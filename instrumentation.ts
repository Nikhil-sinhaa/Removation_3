/**
 * Next.js Instrumentation Hook
 * Runs once on server startup (Node.js runtime only).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startMemoryWatchdog } = await import('./lib/server/memoryWatchdog');
    startMemoryWatchdog();

    const { createSearchIndexes } = await import('./lib/search/createIndexes');
    await createSearchIndexes().catch(console.error);

    const { initializeScheduler } = await import('./lib/scheduler');
    await initializeScheduler().catch(console.error);

    const { seedDefaultTours } = await import('./lib/tours/seedTours');
    await seedDefaultTours().catch(console.error);

    const { seedDefaultTags } = await import('./lib/tags/defaultTags');
    await seedDefaultTags().catch(console.error);

    const { seedWorkflow } = await import('./lib/workflow/defaultWorkflow');
    await seedWorkflow().catch(console.error);

    const { seedDefaultAnnouncement } = await import('./lib/announcements/seedAnnouncement');
    await seedDefaultAnnouncement().catch(console.error);

    // Restore GPU mode + cloud URL from MongoDB (survives PM2 restart)
    const { initGPUModeFromDB } = await import('./lib/ai/gpu-mode-router');
    await initGPUModeFromDB().catch(console.error);
  }
}
