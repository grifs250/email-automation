import { connectToDatabase } from '../utils/db';
import { sendEmail } from '../utils/email';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, name } = req.body;
        
        await sendEmail({
            to: email,
            subject: 'Treniņu programma',
            template: 'mail',
            context: { 
                name,
                programLink: "https://docs.google.com/spreadsheets/d/1oMrSgnYp54GaVxjGBW4_7Q3EmmVBs1GFg_k99bb8Y-E/edit?usp=sharing"
            }
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Email processing error:', error);
        res.status(500).json({ error: 'Failed to process email' });
    }
} 