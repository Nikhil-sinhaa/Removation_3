import mongoose from 'mongoose';
import connectToDatabase from '../db/mongodb';
import { User } from '../db/models/User';
import { getAppMode, getCreditCosts } from './appMode';

export interface DeductionResult {
    success: boolean;
    mode: 'development' | 'production';
    cost: number;
    remaining: number;
    reason?: string;
    code?: 'USER_NOT_FOUND' | 'INSUFFICIENT_CREDITS' | 'ERROR';
}

/**
 * Validates and atomically deducts credits for a user's AI action.
 * Bypasses deduction if the application is in development mode.
 * 
 * @param userId - The Clerk ID or Mongoose ObjectId of the user.
 * @param actionKey - The AI action type (e.g., 'room-changer', 'furniture-remover', 'redesign').
 * @returns DeductionResult
 */
export async function checkAndDeductCredits(
    userId: string,
    actionKey: string
): Promise<DeductionResult> {
    try {
        await connectToDatabase();

        // 1. Resolve user first
        let user = await User.findOne({ clerkId: userId });
        if (!user && mongoose.Types.ObjectId.isValid(userId)) {
            user = await User.findById(userId);
        }

        if (!user) {
            return {
                success: false,
                mode: 'development', // default fallback
                cost: 0,
                remaining: 0,
                reason: 'User not found',
                code: 'USER_NOT_FOUND'
            };
        }

        // 2. Fetch app mode config
        const mode = await getAppMode();

        // 3. Handle Development Mode (Bypass deductions)
        if (mode === 'development') {
            await User.updateOne(
                { _id: user._id },
                { $set: { lastRenderAt: new Date() } }
            );

            const remaining = user.subscription.credits - user.subscription.creditsUsed;
            return {
                success: true,
                mode: 'development',
                cost: 0,
                remaining
            };
        }

        // 4. Handle Production Mode (Enforce and deduct)
        const creditCosts = await getCreditCosts();
        const cost = creditCosts[actionKey] ?? 1;

        const remainingBefore = user.subscription.credits - user.subscription.creditsUsed;

        if (remainingBefore < cost) {
            return {
                success: false,
                mode: 'production',
                cost,
                remaining: remainingBefore,
                reason: 'Insufficient credits',
                code: 'INSUFFICIENT_CREDITS'
            };
        }

        // Atomically decrement available balance by incrementing creditsUsed and decrementing credits
        const updatedUser = await User.findOneAndUpdate(
            {
                _id: user._id,
                $expr: {
                    $gte: [
                        { $subtract: ['$subscription.credits', '$subscription.creditsUsed'] },
                        cost
                    ]
                }
            },
            {
                $inc: { 
                    'subscription.creditsUsed': cost,
                    'credits': -cost
                },
                $set: { lastRenderAt: new Date(), updatedAt: new Date() },
                $push: {
                    creditHistory: {
                        amount: -cost,
                        type: actionKey,
                        description: `${actionKey.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} generation`,
                        createdAt: new Date(),
                    }
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            return {
                success: false,
                mode: 'production',
                cost,
                remaining: remainingBefore,
                reason: 'Insufficient credits (balance changed)',
                code: 'INSUFFICIENT_CREDITS'
            };
        }

        const remainingAfter = updatedUser.subscription.credits - updatedUser.subscription.creditsUsed;

        return {
            success: true,
            mode: 'production',
            cost,
            remaining: remainingAfter
        };
    } catch (error: any) {
        console.error('Error in checkAndDeductCredits:', error);
        return {
            success: false,
            mode: 'production',
            cost: 0,
            remaining: 0,
            reason: error.message || 'Internal database error during credit check',
            code: 'ERROR'
        };
    }
}
