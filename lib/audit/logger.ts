// lib/audit/logger.ts
import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import AuditLog, { AuditAction, AuditCategory } from '@/lib/db/models/AuditLog';

export interface AuditAdminIdentity {
  id: string;
  name: string;
  email: string;
}

export interface AuditLogEntry {
  action: AuditAction;
  category: AuditCategory;
  targetType: 'user' | 'designer' | 'contractor' | 'vendor' | 'render' | 'subscription' | 'system';
  targetId?: string;
  targetName?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * Write an audit log entry after a successful admin action.
 *
 * Pass `admin` from the object returned by `requireRole`:
 *   const auth = await requireRole(req, ['admin']);
 *   const adminUser = auth.user;
 *   await writeAuditLog(req, adminUser, { ... });
 *
 * This function NEVER throws — failures are logged to console only.
 */
export async function writeAuditLog(
  req: NextRequest,
  adminUser: { _id: any; firstName?: string; lastName?: string; email: string },
  entry: AuditLogEntry
): Promise<void> {
  try {
    await connectToDatabase();

    const adminName =
      [adminUser.firstName, adminUser.lastName].filter(Boolean).join(' ').trim() ||
      adminUser.email;

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    await AuditLog.create({
      adminId:    adminUser._id,
      adminName,
      adminEmail: adminUser.email,
      adminIp:    ip,
      ...entry,
      createdAt:  new Date(),
    });
  } catch (err) {
    // Never let audit logging crash the main request
    console.error('[AuditLog] Failed to write log:', err);
  }
}

/**
 * Human-readable description for every audit action.
 */
export function auditDescription(
  action: AuditAction,
  targetName: string,
  extra?: string
): string {
  const map: Record<AuditAction, string> = {
    'user.ban':               `Banned user ${targetName}`,
    'user.unban':             `Unbanned user ${targetName}`,
    'user.suspend':           `Suspended user ${targetName}`,
    'user.delete':            `Deleted user ${targetName}`,
    'user.credits.add':       `Added credits to ${targetName}${extra ? ` (${extra})` : ''}`,
    'user.credits.deduct':    `Deducted credits from ${targetName}${extra ? ` (${extra})` : ''}`,
    'user.role.change':       `Changed role of ${targetName} to ${extra ?? ''}`,
    'user.plan.change':       `Changed plan of ${targetName} to ${extra ?? ''}`,
    'designer.approve':       `Approved designer ${targetName}`,
    'designer.reject':        `Rejected designer ${targetName}`,
    'contractor.approve':     `Approved contractor ${targetName}`,
    'contractor.reject':      `Rejected contractor ${targetName}`,
    'vendor.approve':         `Approved vendor ${targetName}`,
    'vendor.reject':          `Rejected vendor ${targetName}`,
    'render.delete':          `Deleted render ${targetName}`,
    'render.flag':            `Flagged render ${targetName}`,
    'render.unflag':          `Unflagged render ${targetName}`,
    'subscription.cancel':    `Cancelled subscription for ${targetName}`,
    'subscription.refund':    `Issued refund for ${targetName}`,
    'system.gpu.mode.change': `Changed GPU mode to ${extra ?? ''}`,
    'system.app.mode.change': `Changed app mode to ${extra ?? ''}`,
    'system.config.change':   `Updated system config: ${extra ?? ''}`,
    'admin.login':            `Admin ${targetName} logged in`,
    'admin.logout':           `Admin ${targetName} logged out`,
  };
  return map[action] ?? `${action} on ${targetName}`;
}
