const nodemailer = require('nodemailer');
const Email = require('../models/email');
const fs = require('fs');
// const Mailgen = require('mailgen');
require('dotenv').config();

// post_paldies post_email

const index_get = (req, res) => {
    res.render('index', { title: 'Treniņprogramma' }
)};

const tnx_get = ('/tnx', (req, res) => {
    res.render('tnx', { title: 'Paldies' });
});

const mail_get = ((req, res) => {
    res.render('mail', { name: 'Name' });
});


const tnx_post = ('/tnx', (req, res) => {
    // const userEmail = new Email(req.body);

    // userEmail.save()
    //     .then((result) => {
    //         res.redirect('/tnx');
    //     })
    //     .catch((err) => {
    //         console.log(err);
    //     })





    // Send mail from testing account

    // const transporter = nodemailer.createTransport({
    //     host: "smtp.ethereal.email",
    //     port: 587,
    //     secure: false, // Use `true` for port 465, `false` for all other ports
    //     auth: {
    //         user: "maddison53@ethereal.email",
    //         pass: "jn7jnAPss4f63QBp6D",
    //     },
    // });

    // const message = {
    //     from: '"Maddison Foo Koch 👻" <maddison53@ethereal.email>', // sender address
    //     to: "bar@example.com, baz@example.com", // list of receivers
    //     subject: "Hello ✔", // Subject line
    //     text: "Hello world?", // plain text body
    //     html: "<b>Hello world?</b>", // html body
    // }
      
    // // async..await is not allowed in global scope, must use a wrapper
    // async function main() {
    //     // send mail with defined transport object
    //     const info = await transporter.sendMail(message);

    //     console.log(`Message sent: ${info.messageId}`);
    //     console.log(`Message URL: ${nodemailer.getTestMessageUrl(info)}`);
    //     // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
    //     res.render('tnx', { title: 'Paldies' });
    // }

    // main().catch(console.error);



    // send mail from real gmail account
    const user = new Email(req.body);
    console.log(user);
    const userEmail = user.email;
    const userName = user.name;
    console.log(userEmail);
    console.log(userName);

    const EMAIL = process.env.EMAIL;
    const PASS = process.env.APP_PASS;

    const config = {
        service: 'gmail',
        auth: {
            user: EMAIL,
            pass: PASS
        }
    };

    const transporter = nodemailer.createTransport(config);

    // const MailGen = new Mailgen({
    //     theme: "default",
    //     product: {
    //         name: "Treniņprogramma",
    //         link: 'http://www.mikelissilins/treniņprogramma/'
    //     }
    // })

    // const response = {
    //     body: {
    //         name: userName,
    //         intro: "",
    //         tabel: {
    //             data: [
    //                 {                    
    //                     item: "Nodemailer Stack Book",
    //                     description: "A Backend application",
    //                     price: "$27",
    //                 }
    //             ]
    //         },
    //         outor: "Looking forward to do more business"
    //     }
    // }

    // const mail = MailGen.generate(response)

    const htmlContent = fs.readFileSync('./views/mail.ejs', 'utf-8');

    const message = {
        from: EMAIL,
        to: userEmail,
        subject: "Treniņprogramma",
        html: htmlContent
    };

    async function main() {
            // send mail with defined transport object
            const info = await transporter.sendMail(message);
    
            console.log(`Message sent: ${info.messageId}`);
            console.log(`Message URL: ${nodemailer.getTestMessageUrl(info)}`);
            // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
            res.render('tnx', { title: 'Paldies' });
        }
    
        main().catch(console.error);
});




module.exports = {
    index_get,
    tnx_get,
    tnx_post,
    mail_get
}

