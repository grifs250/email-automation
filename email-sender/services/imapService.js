const { ImapFlow } = require('imapflow');
require('dotenv').config();
const EmailStatus = require('../models/emailStatus');

const EMAIL = process.env.EMAIL;
const PASS = process.env.APP_PASS;

// Function to check for bounced emails
async function checkBounces() {
    const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: {
            user: EMAIL,
            pass: PASS
        },
        logger: false // Disable verbose logging
    });

    try {
        await client.connect();
        const mailbox = await client.mailboxOpen('INBOX');

        const bounces = [];

        const totalMessages = mailbox.exists;
        const start = Math.max(1, totalMessages - 10); // Adjust as needed
        const end = totalMessages;

        for await (let message of client.fetch(`${start}:${end}`, { envelope: true, flags: true, bodyStructure: true, source: true })) {
            const bodyText = message.source.toString();

            if (bodyText.includes("Your message wasn't delivered")) {
                console.log("Bounce message detected");

                let bounceType = 'soft';
                if (bodyText.includes("domain not found") || bodyText.includes("invalid recipient")) {
                    bounceType = 'hard';
                }

                const emailMatch = bodyText.match(/Your message wasn't delivered to\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);

                if (emailMatch) {
                    const bouncedEmail = emailMatch[1].trim();
                    console.log('Extracted Email:', bouncedEmail);

                    // Update the email status with the bounce type
                    await EmailStatus.findOneAndUpdate(
                        { email: bouncedEmail },
                        { status: 'bounced', bouncedAt: new Date(), bounceType }
                    );
                }
            }
        }

        return bounces;
    } catch (error) {
        console.error('Error during bounce check:', error);
        throw error;
    } finally {
        await client.logout();
    }
}

module.exports = { checkBounces };
