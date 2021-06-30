//puppeteer used for automating
const pup = require("puppeteer");
//fs for using writeFileSync
const fs = require("fs");

//for mailing
var nodemailer = require('nodemailer');

//for converting JSON to PDF
let PDFDocument=require('pdfkit');

//for input
const prompt = require('prompt-sync')();

//chalk for coloring text prompted
const chalk = require('chalk');
const { PassThrough } = require("stream");
const { resolve } = require("path");
const doc = require("pdfkit");


//taking source and destination input from user
const source = prompt(chalk.bgMagenta('Please enter the Source : '));
const destination = prompt(chalk.bgMagenta('Please enter the Destination : '));
console.log("\n");
console.log(chalk.blackBright.bgYellow(`Source: ${source}`));
console.log(chalk.blackBright.bgYellow(`Destination: ${destination}`));
console.log("\n");
console.log(chalk.blue.bgRed.bold(`THE TRAINS ARE:`))


let finalData = [];

let browser;
let tab;

async function main() {
    browser = await pup.launch({
        headless: false,
        slowMo:60,
        defaultViewport: false,
        args: ["--start-maximized"]
    });
    let pages = await browser.pages();
    //by default 2 pages open, so array's 0th element is actually first page
    tab = pages[0];

    //opening the site
    await tab.goto("https://www.railyatri.in/");
    await tab.click(".RY_vertical.train_info_list.train-info.hide_action");
    await new Promise(function (resolve, reject) {
        setTimeout(resolve, 2000);
    })

    //clicking on Seats Availability
    let lists = await tab.$$(".train_info_popup .popup_list li");
    await lists[4].click();

    //typing the Source
    await tab.waitForNavigation({ waitUntil: "networkidle2" });
    await tab.type("input[name='from_stn']", source);
    await new Promise(function (resolve, reject) {
        setTimeout(resolve, 1000);
    })

    //typing the destination
    await tab.keyboard.press("ArrowDown");
    await tab.keyboard.press("Enter");
    await tab.type("input[name='to_stn']", destination);
    await new Promise(function (resolve, reject) {
        setTimeout(resolve, 1000);
    })

    //Pressing submit
    await tab.keyboard.press("ArrowDown");
    await tab.keyboard.press("Enter");
    await tab.click("input[value='Check Trains']");



    //Names of trains
    await tab.waitForSelector(".namePart p", { visible: true });

    await tab.evaluate(function(){
        let allTrain=document.querySelectorAll(".namePart p");

        let div=document.querySelector(".col-xs-9.lft-space");

        //scrolling till down to get all train associated info
        window.scrollTo(0,div.scrollHeight);
       
    })

    
    let trainNamesPart = await tab.$$(".namePart p");
    let trainNames = [];
    let trainSeats = [];

    //console.log(trainNamesPart.length)

    //pushing Train names in its array
    for (let i of trainNamesPart) {
        let trainName = await tab.evaluate(function (ele) {
            return ele.textContent;
        }, i);
        trainNames.push(trainName);

    }


    await tab.waitForSelector(".SA-info .SA-status p", { visible: true });
    let trainSeatsPart = await tab.$$(".SA-info .SA-status p");

    
    //pushing train seats in the Train Seat array
    let trainSeatArr = []
    for (let i = 0; i < trainSeatsPart.length; i += 3) {
        let trainSeat = await tab.evaluate(function (ele) {     //134
            console.log(ele);
            return ele.innerHTML;
        }, trainSeatsPart[i]);
        trainSeatArr.push(trainSeat);
    }

    trainSeats = trainSeatArr;
    

    //pushing Deaprture, arrival time, total journey times in their respective arrays
    //departure time
    let departureTimePart = await tab.$$(".Departure-time.Departure-time-text-1");
    let trainDepartureTimes = [];
    for (let i of departureTimePart) {
        let trainDepartureTime = await tab.evaluate(function (ele) {
            /////////////////
            return ele.innerText;
        }, i);
        trainDepartureTimes.push(trainDepartureTime);
    }

    //arrival time
    let arrivalTimePart = await tab.$$(".Arrival-time.Arrival-time-text-1.text-right");
    let trainArrivalTimes = [];
    for (let i of arrivalTimePart) {
        let trainArrivalTime = await tab.evaluate(function (ele) {
            return ele.innerText;
        }, i);
        trainArrivalTimes.push(trainArrivalTime);
    }

    //total travel time
    let trainTravelTimePart = await tab.$$(".TravelHour.text-center");
    let trainTravelTimes = [];
    for (let i of trainTravelTimePart) {
        let trainTravelTime = await tab.evaluate(function (ele) {
            return ele.innerText;
        }, i);
        trainTravelTimes.push(trainTravelTime);
    }


    //assigning it key value pairs in the object data
    let cnt = 0;
    console.log(trainNames.length);
    for (let i = 0; i < trainNames.length; i++) {
        let data = {};
        data["TrainName"] = trainNames[i];
        data["TrainSeats"] = [trainSeats[cnt], trainSeats[cnt + 1], trainSeats[cnt + 2], trainSeats[cnt + 3]];
        data["DepartureTime"] = trainDepartureTimes[i];
        data["ArrivalTime"] = trainArrivalTimes[i];
        data["TotalTravelTime"] = trainTravelTimes[i];
        finalData.push(data);
        cnt += 4;
    }

    //converting JSON to PDF

    let filepath=__dirname+"\\"+"finalData.pdf"
    let pdf=new PDFDocument();
    pdf.pipe(fs.createWriteStream(filepath));
    pdf.text(JSON.stringify(finalData));
    pdf.end();

    //making JSON file
    fs.writeFileSync("Trainsemail.json", JSON.stringify(finalData));
    await new Promise(function (resolve, reject) {
        setTimeout(resolve, 4000);
    })



    //Automatic sending of email to the user by attaching the file conating details of trains and seats available.
    //wrapped it inside the async function
    async function wrapedSendMail() {

        return new Promise((resolve, reject) => {

            var transporter = nodemailer.createTransport({
                service: `gmail`,
                auth: {
                    user: `temp116090@gmail.com`,
                    pass: `wndcmqxadlfyqmof`,
                }
            });

            var mailOptions = {
                from: `temp116090@gmail.com`,
                to: `tanvisobti2000@gmail.com`,
                subject: `TRAINS SEATS AVAILABILITY!!`,
                attachments : [
                    {
                        filename : 'finalData.pdf',
                        path : "./finalData.pdf",
                    },
                    {
                        filename : 'Trainsemail.json',
                        path : "./Trainsemail.json",
                    }
                ],
                text: `This file contains the seat availability. This is an automated mail. The file has info of all the trains available between source and destination you chose and the seats available `
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                }
                else {
                    console.log('Email sent' + info.response);
                }
            });
        })
    }
    wrapedSendMail();//function call


    //closing the browser after completing the work
    browser.close();
}
//function call
main();         