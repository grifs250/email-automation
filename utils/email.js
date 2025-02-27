import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.APP_PASS,
  },
});

export async function sendEmail({ to, subject, template, context }) {
  try {
    // Render email template
    const emailHTML = await ejs.renderFile(
      path.join(process.cwd(), 'views', 'mail.ejs'),
      context
    );

    const message = {
      from: process.env.EMAIL,
      to,
      subject,
      html: emailHTML,
    };

    const result = await transporter.sendMail(message);
    console.log(`Email sent to ${to}: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
} 