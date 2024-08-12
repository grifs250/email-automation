const { ImapFlow } = require('imapflow');

const EMAIL = process.env.EMAIL;
const PASS = process.env.APP_PASS;

async function checkBounces(sentEmails) {
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

    // Select the inbox
    try {
        await client.connect();
        const mailbox = await client.mailboxOpen('INBOX');

        const bounces = [];

        const totalMessages = mailbox.exists; // Number of messages in the mailbox
        const start = Math.max(1, totalMessages - 4); // Calculate the starting point for the last 10 emails
        const end = totalMessages; // The last email
        console.log(sentEmails);

        for await (let message of client.fetch(`${start}:${end}`, { envelope: true, flags: true, bodyStructure: true, source: true })) {
            const bodyText = message.source.toString();

            // Check if the body contains the bounce indicator
            if (bodyText.includes("Your message wasn't delivered")) {
                console.log("Bounce message detected");

                // Use a regex to extract the email address that wasn't delivered
                const emailMatch = bodyText.match(/Your message wasn't delivered to\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);

                if (emailMatch) {
                    const bouncedEmail = emailMatch[1].trim();
                    console.log('Extracted Email:', bouncedEmail);

                    // Check if the bounced email matches any in sentEmails
                    const matchingEmail = sentEmails.find(sentEmail => sentEmail.email === bouncedEmail);
                    if (matchingEmail) {
                        bounces.push(matchingEmail.email);
                        console.log('Bounce detected for email:', matchingEmail.email);
                    }
                }
            }
        }

        return bounces;
    } catch (error) {
        console.error('Error during bounce check:', error);
        throw error;
    } finally {
        await client.logout(); // Ensure the connection is closed after operation
    }
};
module.exports = { checkBounces };