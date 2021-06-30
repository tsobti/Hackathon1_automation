//for this we have to give access for third party use
//youtube video reference --- "https://www.youtube.com/watch?v=NB71vyCj2X4"
//link for this access --- "https://myaccount.google.com/lesssecureapps?pli=1&rapt=AEjHL4OFlCRhJolHrwMFiuyxrZf8S_UfonOSApaK2eEx95nMPxxE_9fghSxqJ4soXfOIi-wJw-iPiPBaJO7kpK7kNDpgbqy9fg"
const nodemailer = require("nodemailer");


let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'temp116090@gmail.com',
        pass: 'TempTester#123'
    }
});

let mailOptions = {
    from: 'temp116090@gmail.com',
    to: 'tanvisobti2000@gmail.com',
    subject: 'Test',
    // text: 'Hey There! i am Tanvi and this is automation maybe you love it',
    html: '<h1>Welcome</h1><p>That was easy!</p>',
    attachments : [
        {
            filename : 'intD.json',
            path : "./intD.json",
        }
    ]
    
};

transporter.sendMail(mailOptions, function (error, info) {
    if (error)
        console.log(error);
    else
        console.log(info.response);
});