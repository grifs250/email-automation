const { ImapFlow } = require('imapflow');
require('dotenv').config();
const EmailStatus = require('../models/emailStatus');

const EMAIL = process.env.EMAIL;
const PASS = process.env.APP_PASS;

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

        const totalMessages = mailbox.exists;
        const start = Math.max(1, totalMessages - 10); // Adjust as needed
        const end = totalMessages;

        const processedEmails = new Set(); // To track processed emails

        for await (let message of client.fetch(`${start}:${end}`, { envelope: true, flags: true, bodyStructure: true, source: true })) {
            const bodyText = message.source.toString();

            if (bodyText.includes("Your message wasn't delivered")) {
                console.log("Bounce message detected");

                let bounceType = 'soft';
                if (bodyText.includes("couldn't be found") || bodyText.includes("invalid recipient")) {
                    bounceType = 'hard';
                }

                const emailMatch = bodyText.match(/Your message wasn't delivered to\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);

                if (emailMatch) {
                    const bouncedEmail = emailMatch[1].trim();

                    if (!bouncedEmail) {
                        console.error('Extracted a null or undefined email. Skipping.');
                        continue;
                    }

                    console.log('Extracted Email:', bouncedEmail);

                    // Check if this email has already been processed in this run
                    if (processedEmails.has(bouncedEmail)) {
                        console.log(`Email ${bouncedEmail} already processed.`);
                        continue;
                    }

                    try {
                        // Update the email status to 'bounced' only if it's not already marked as bounced
                        const emailStatus = await EmailStatus.findOneAndUpdate(
                            { email: bouncedEmail, status: { $ne: 'bounced' } },
                            { status: 'bounced', bouncedAt: new Date(), bounceType }
                        );

                        if (emailStatus) {
                            console.log(`Updated status for ${bouncedEmail} to bounced.`);
                        } else {
                            console.log(`No update required for ${bouncedEmail}. Already bounced.`);
                        }

                    } catch (updateError) {
                        console.error(`Failed to update status for ${bouncedEmail}: ${updateError.message}`);
                    }

                    // Add the email to the set to mark it as processed
                    processedEmails.add(bouncedEmail);
                }
            }
        }
    } catch (error) {
        console.error('Error during bounce check:', error);
        throw error;
    } finally {
        await client.logout();
    }
}

module.exports = { checkBounces };
