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

    try {
        await client.connect();
        const mailbox = await client.mailboxOpen('INBOX');

        const bounces = [];

        const totalMessages = mailbox.exists; // Number of messages in the mailbox
        const start = Math.max(1, totalMessages - 10); // Adjust this range as needed
        const end = totalMessages;

        for await (let message of client.fetch(`${start}:${end}`, { envelope: true, flags: true, bodyStructure: true, source: true })) {
            const bodyText = message.source.toString();

            if (bodyText.includes("Your message wasn't delivered")) {
                console.log("Bounce message detected");

                // Determine the type of bounce
                let bounceType = 'soft';
                if (bodyText.includes("domain not found") || bodyText.includes("invalid recipient")) {
                    bounceType = 'hard';
                }

                // Extract the email address that wasn't delivered
                const emailMatch = bodyText.match(/Your message wasn't delivered to\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);

                if (emailMatch) {
                    const bouncedEmail = emailMatch[1].trim();
                    console.log('Extracted Email:', bouncedEmail);

                    // Check if the bounced email matches any in sentEmails
                    const matchingEmail = sentEmails.find(sentEmail => sentEmail.email === bouncedEmail);
                    if (matchingEmail) {
                        bounces.push({ email: matchingEmail.email, bounceType });
                        console.log('Bounce detected for email:', matchingEmail.email, bounceType);

                        // Update the email status with the bounce type
                        await IndividualEmailStatus.findOneAndUpdate(
                            { bulkSendId: matchingEmail.bulkSendId, email: matchingEmail.email },
                            { status: 'bounced', bouncedAt: new Date(), bounceType: bounceType }
                        );
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
}

module.exports = { checkBounces };
