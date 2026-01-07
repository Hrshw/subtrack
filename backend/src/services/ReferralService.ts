import crypto from 'crypto';
import { Referral } from '../models/Referral';
import { User } from '../models/User';
import { Connection } from '../models/Connection';

const REQUIRED_SERVICES_FOR_REWARD = 3;
const FREE_MONTHS_PER_REFERRAL = 1;

export class ReferralService {
    /**
     * Get or create referral code for a user
     */
    static async getOrCreateReferralCode(userId: string): Promise<string> {
        let referral = await Referral.findOne({ userId });

        if (!referral) {
            // Generate unique code
            let code: string;
            let attempts = 0;
            do {
                code = crypto.randomBytes(4).toString('hex').toUpperCase();
                const existing = await Referral.findOne({ referralCode: code });
                if (!existing) break;
                attempts++;
            } while (attempts < 10);

            referral = await Referral.create({
                userId,
                referralCode: code,
                referredUsers: [],
                totalRewardsEarned: 0,
                totalReferrals: 0
            });
        }

        return referral.referralCode;
    }

    /**
     * Apply a referral code during signup
     */
    static async applyReferralCode(newUserId: string, newUserEmail: string, code: string): Promise<{ success: boolean; message: string }> {
        try {
            const referral = await Referral.findOne({ referralCode: code.toUpperCase() });

            if (!referral) {
                return { success: false, message: 'Invalid referral code' };
            }

            // Check if user already referred
            const alreadyReferred = referral.referredUsers.some(
                (r: any) => r.userId?.toString() === newUserId || r.email === newUserEmail
            );

            if (alreadyReferred) {
                return { success: false, message: 'Already referred by this code' };
            }

            // Can't refer yourself
            if (referral.userId.toString() === newUserId) {
                return { success: false, message: 'Cannot use your own referral code' };
            }

            // Add to referred users list
            referral.referredUsers.push({
                userId: newUserId,
                email: newUserEmail,
                connectedServices: 0,
                qualifiedAt: null,
                rewardApplied: false
            });
            referral.totalReferrals++;
            await referral.save();

            console.log(`🎉 User ${newUserEmail} signed up with referral code ${code}`);
            return { success: true, message: 'Referral code applied! Connect 3 services to unlock rewards.' };

        } catch (error) {
            console.error('Referral code application failed:', error);
            return { success: false, message: 'Failed to apply referral code' };
        }
    }

    /**
     * Check if a referred user qualifies for reward (3+ services connected)
     */
    static async checkAndApplyReward(userId: string) {
        try {
            // Count user's connections
            const connectionCount = await Connection.countDocuments({
                userId,
                status: 'active'
            });

            if (connectionCount < REQUIRED_SERVICES_FOR_REWARD) return;

            // Find the referral where this user was referred
            const referral = await Referral.findOne({
                'referredUsers.userId': userId,
                'referredUsers.rewardApplied': false
            });

            if (!referral) return;

            // Update the referred user entry
            const referredUserIndex = referral.referredUsers.findIndex(
                (r: any) => r.userId?.toString() === userId && !r.rewardApplied
            );

            if (referredUserIndex === -1) return;

            referral.referredUsers[referredUserIndex].connectedServices = connectionCount;
            referral.referredUsers[referredUserIndex].qualifiedAt = new Date();
            referral.referredUsers[referredUserIndex].rewardApplied = true;
            referral.totalRewardsEarned += FREE_MONTHS_PER_REFERRAL;
            await referral.save();

            // Grant the referrer a free month (extend their subscription)
            const referrer = await User.findById(referral.userId);
            if (referrer) {
                // If they're free, upgrade to pro for 1 month
                // If already pro, this could extend their subscription
                // For simplicity, we'll just log it - full implementation would need subscription dates
                console.log(`🎁 Referrer ${referrer.email} earned ${FREE_MONTHS_PER_REFERRAL} free month(s)!`);

                // TODO: Implement subscription extension logic
                // This would require adding subscriptionEndDate to User model
            }

        } catch (error) {
            console.error('Referral reward check failed:', error);
        }
    }

    /**
     * Get referral stats for a user
     */
    static async getReferralStats(userId: string) {
        const referral = await Referral.findOne({ userId });

        if (!referral) {
            return {
                code: await this.getOrCreateReferralCode(userId),
                totalReferrals: 0,
                pendingReferrals: 0,
                qualifiedReferrals: 0,
                rewardsEarned: 0
            };
        }

        const qualified = referral.referredUsers.filter((r: any) => r.rewardApplied).length;
        const pending = referral.referredUsers.length - qualified;

        return {
            code: referral.referralCode,
            totalReferrals: referral.totalReferrals,
            pendingReferrals: pending,
            qualifiedReferrals: qualified,
            rewardsEarned: referral.totalRewardsEarned
        };
    }
}
