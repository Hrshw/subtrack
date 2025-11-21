import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import { User } from '../models/User';
import { ScanResult } from '../models/ScanResult';
import { EmailService } from '../services/EmailService';

dotenv.config();

const run = async () => {
    await connectDB();

    const users = await User.find({});

    for (const user of users) {
        // Get last month's results
        const results = await ScanResult.find({
            userId: user._id,
            status: { $in: ['zombie', 'downgrade_possible'] }
        });

        if (results.length > 0) {
            const totalSavings = results.reduce((acc, r) => acc + (r.potentialSavings || 0), 0);
            const digestResults = results.map(result => ({
                resourceName: result.resourceName,
                reason: result.reason,
                potentialSavings: result.potentialSavings || 0,
            }));

            await EmailService.sendMonthlyDigest(user.email, totalSavings, digestResults);
            console.log(`Sent digest to ${user.email}`);
        }
    }

    console.log('Digest sending complete');
    process.exit(0);
};

run().catch(err => {
    console.error(err);
    process.exit(1);
});
