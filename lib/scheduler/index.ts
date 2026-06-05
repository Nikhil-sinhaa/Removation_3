import { registerTask, seedDefaultTasks } from './engine';
import { purgeOldRendersTask }              from './tasks/purgeOldRenders';
import { purgeAuditLogsTask }               from './tasks/purgeAuditLogs';
import { purgeExpiredExportsTask }          from './tasks/purgeExpiredExports';
import { subscriptionExpiryCheckTask }      from './tasks/subscriptionExpiryCheck';
import { subscriptionRenewalRemindersTask } from './tasks/subscriptionRenewalReminders';
import { renderStuckCleanupTask }           from './tasks/renderStuckCleanup';
import { redisCacheFlushTask }              from './tasks/redisCacheFlush';
import { dbStatsSnapshotTask }              from './tasks/dbStatsSnapshot';
import { purge404LogsTask }                 from './tasks/purge404Logs';
import { purgeOldSnapshotsTask }            from './tasks/purgeOldSnapshots';
import { expireAnnouncementsTask }          from './tasks/expireAnnouncements';
import { notifyLowCreditsTask }             from './tasks/notifyLowCredits';
import { feedbackReminderTask }             from './tasks/feedbackReminder';

let initialized = false;

/**
 * Initialize the scheduler.
 * Registers all task handlers and seeds default task configs to DB.
 * Idempotent — safe to call multiple times.
 */
export async function initializeScheduler() {
  if (initialized) return;
  initialized = true;

  registerTask('purge.old.renders',              purgeOldRendersTask);
  registerTask('purge.audit.logs',               purgeAuditLogsTask);
  registerTask('purge.expired.exports',          purgeExpiredExportsTask);
  registerTask('subscription.expiry.check',      subscriptionExpiryCheckTask);
  registerTask('subscription.renewal.reminders', subscriptionRenewalRemindersTask);
  registerTask('render.stuck.cleanup',           renderStuckCleanupTask);
  registerTask('redis.cache.flush',              redisCacheFlushTask);
  registerTask('db.stats.snapshot',              dbStatsSnapshotTask);
  registerTask('purge.404.logs',                 purge404LogsTask);
  registerTask('purge.old.snapshots',            purgeOldSnapshotsTask);
  registerTask('expire.announcements',           expireAnnouncementsTask);
  registerTask('notify.low.credits',             notifyLowCreditsTask);
  registerTask('feedback.reminder',              feedbackReminderTask);

  await seedDefaultTasks();

  console.log('[Scheduler] Initialized with 13 registered task handlers');
}
