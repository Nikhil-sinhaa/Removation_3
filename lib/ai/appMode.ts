import connectToDatabase from '../db/mongodb';
import { AdminConfig } from '../db/models/AdminConfig';

interface CachedConfig {
    appMode: 'development' | 'production';
    creditCosts: Record<string, number>;
    freeCreditsOnSignup: number;
    fetchedAt: number;
}

let cache: CachedConfig | null = null;
const CACHE_TTL = 60 * 1000; // 60 seconds

async function fetchConfigFromDB(): Promise<CachedConfig> {
    await connectToDatabase();

    const configs = await AdminConfig.find({
        key: { $in: ['app_mode', 'credit_costs', 'free_credits_on_signup'] }
    });

    const configMap = new Map(configs.map(c => [c.key, c.value]));

    const appMode = (configMap.get('app_mode') as 'development' | 'production') || 'development';
    const creditCosts = (configMap.get('credit_costs') as Record<string, number>) || {
        'room-changer': 1,
        'furniture-remover': 1,
        'redesign': 2
    };
    const freeCreditsOnSignup = Number(configMap.get('free_credits_on_signup') ?? 10);

    return {
        appMode,
        creditCosts,
        freeCreditsOnSignup,
        fetchedAt: Date.now()
    };
}

async function getCachedConfig(): Promise<CachedConfig> {
    if (!cache || (Date.now() - cache.fetchedAt) > CACHE_TTL) {
        cache = await fetchConfigFromDB();
    }
    return cache;
}

export async function getAppMode(): Promise<'development' | 'production'> {
    const config = await getCachedConfig();
    return config.appMode;
}

export async function getCreditCosts(): Promise<Record<string, number>> {
    const config = await getCachedConfig();
    return config.creditCosts;
}

export async function getFreeCreditsOnSignup(): Promise<number> {
    const config = await getCachedConfig();
    return config.freeCreditsOnSignup;
}

export function invalidateAppModeCache(): void {
    cache = null;
}
