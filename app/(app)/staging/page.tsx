import React from 'react';
import { StagingView } from '@/components/shared/StagingView';

export const metadata = {
    title: 'Virtual Staging - Removation AI',
    description: 'Upload an empty room and generate professional furniture staging using AI.',
};

export default function StagingPage() {
    return (
        <main className="flex-1 w-full bg-background pt-8 pb-16 px-4 md:px-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Room Staging</h1>
                    <p className="text-muted-foreground">
                        Instantly transform empty spaces into beautifully furnished rooms using our AI staging model.
                    </p>
                </div>

                <StagingView />
            </div>
        </main>
    );
}
