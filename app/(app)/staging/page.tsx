'use client';

import { StagingView } from '@/components/shared/StagingView';
import { useLanguage } from '@/hooks/useLanguage';

export default function StagingPage() {
    const { t } = useLanguage();
    return (
        <main className="flex-1 w-full bg-background pt-8 pb-16 px-4 md:px-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">{t('stg_title')}</h1>
                    <p className="text-muted-foreground">
                        {t('stg_subtitle')}
                    </p>
                </div>

                <StagingView />
            </div>
        </main>
    );
}
