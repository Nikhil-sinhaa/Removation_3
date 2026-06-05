import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AdminConfig } from '@/lib/db/models/AdminConfig';
import { invalidateAppModeCache } from '@/lib/ai/appMode';
import { writeAuditLog, auditDescription } from '@/lib/audit/logger';


export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authResult = await requireRole(req, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        await connectToDatabase();

        const configs = await AdminConfig.find({
            key: { $in: ['app_mode', 'credit_costs', 'free_credits_on_signup'] }
        }).lean();

        const configMap = new Map(configs.map(c => [c.key, c.value]));

        const appMode = configMap.get('app_mode') || 'development';
        const creditCosts = configMap.get('credit_costs') || {
            'room-changer': 1,
            'furniture-remover': 1,
            'redesign': 2
        };
        const freeCreditsOnSignup = configMap.has('free_credits_on_signup')
            ? Number(configMap.get('free_credits_on_signup'))
            : 10;

        return NextResponse.json({
            appMode,
            creditCosts,
            freeCreditsOnSignup,
            // also return snake_case for maximum compatibility
            app_mode: appMode,
            credit_costs: creditCosts,
            free_credits_on_signup: freeCreditsOnSignup
        }, { status: 200 });
    } catch (error) {
        console.error('GET admin app-mode error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const authResult = await requireRole(req, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const adminId = authResult.user._id;
        const body = await req.json();

        if (!body || typeof body !== 'object') {
            return NextResponse.json({ message: 'Invalid body payload' }, { status: 400 });
        }

        const appMode = body.appMode !== undefined ? body.appMode : body.app_mode;
        const creditCosts = body.creditCosts !== undefined ? body.creditCosts : body.credit_costs;
        const freeCreditsOnSignup = body.freeCreditsOnSignup !== undefined 
            ? body.freeCreditsOnSignup 
            : body.free_credits_on_signup;

        await connectToDatabase();

        // 1. Validate & Update app_mode
        if (appMode !== undefined) {
            if (appMode !== 'development' && appMode !== 'production') {
                return NextResponse.json({ message: 'appMode must be either development or production' }, { status: 400 });
            }
            await AdminConfig.findOneAndUpdate(
                { key: 'app_mode' },
                {
                    value: appMode,
                    updatedBy: adminId,
                    updatedAt: new Date()
                },
                { upsert: true, new: true }
            );
        }

        // 2. Validate & Update credit_costs
        if (creditCosts !== undefined) {
            if (typeof creditCosts !== 'object' || creditCosts === null) {
                return NextResponse.json({ message: 'creditCosts must be an object' }, { status: 400 });
            }
            // Ensure values are numbers
            for (const [action, cost] of Object.entries(creditCosts)) {
                if (typeof cost !== 'number' || cost < 0) {
                    return NextResponse.json({ message: `Cost for ${action} must be a non-negative number` }, { status: 400 });
                }
            }
            await AdminConfig.findOneAndUpdate(
                { key: 'credit_costs' },
                {
                    value: creditCosts,
                    updatedBy: adminId,
                    updatedAt: new Date()
                },
                { upsert: true, new: true }
            );
        }

        // 3. Validate & Update free_credits_on_signup
        if (freeCreditsOnSignup !== undefined) {
            const numVal = Number(freeCreditsOnSignup);
            if (!Number.isInteger(numVal) || numVal < 0) {
                return NextResponse.json({ message: 'freeCreditsOnSignup must be a non-negative integer' }, { status: 400 });
            }
            await AdminConfig.findOneAndUpdate(
                { key: 'free_credits_on_signup' },
                {
                    value: numVal,
                    updatedBy: adminId,
                    updatedAt: new Date()
                },
                { upsert: true, new: true }
            );
        }

        // 4. Invalidate the appConfig memory cache so changes apply immediately
        invalidateAppModeCache();

        // Fetch freshly updated configs
        const updatedConfigs = await AdminConfig.find({
            key: { $in: ['app_mode', 'credit_costs', 'free_credits_on_signup'] }
        }).lean();

        const updatedMap = new Map(updatedConfigs.map(c => [c.key, c.value]));

        const resMode = updatedMap.get('app_mode') || 'development';
        const resCosts = updatedMap.get('credit_costs') || {
            'room-changer': 1,
            'furniture-remover': 1,
            'redesign': 2
        };
        const resFreeCredits = updatedMap.has('free_credits_on_signup')
            ? Number(updatedMap.get('free_credits_on_signup'))
            : 10;

        // Log the change
        const changes: string[] = [];
        if (appMode !== undefined) changes.push(`app_mode=${appMode}`);
        if (creditCosts !== undefined) changes.push(`credit_costs=${JSON.stringify(creditCosts)}`);
        if (freeCreditsOnSignup !== undefined) changes.push(`free_credits_on_signup=${freeCreditsOnSignup}`);

        const changeStr = changes.join(', ');
        await writeAuditLog(req, authResult.user, {
            action: 'system.app.mode.change',
            category: 'system',
            targetType: 'system',
            targetId: 'app_mode',
            targetName: 'App Configurations',
            description: auditDescription('system.app.mode.change', 'App Configurations', changeStr),
            metadata: { appMode, creditCosts, freeCreditsOnSignup }
        });

        return NextResponse.json({
            success: true,
            message: 'App configurations updated successfully',
            appMode: resMode,
            creditCosts: resCosts,
            freeCreditsOnSignup: resFreeCredits,
            // snake_case compatible response
            app_mode: resMode,
            credit_costs: resCosts,
            free_credits_on_signup: resFreeCredits
        }, { status: 200 });

    } catch (error) {
        console.error('PATCH admin app-mode error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

