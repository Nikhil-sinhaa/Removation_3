/**
 * GET /api/admin/storage
 *
 * Returns storage statistics derived from DB records:
 * - Total render count (approximates file count)
 * - Counts by render status
 * - Counts of renders with output images (generated) vs input-only
 * - User image upload estimates
 * - DB document sizes
 *
 * Admin only. UploadThing does not expose aggregate storage stats
 * via SDK; we derive estimates from DB record counts & known avg sizes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Render } from '@/lib/db/models/Render';

export const dynamic = 'force-dynamic';

// Average file size estimates (bytes)
const AVG_INPUT_IMAGE_BYTES  = 800_000;   // ~800 KB  user upload
const AVG_OUTPUT_IMAGE_BYTES = 2_000_000; // ~2 MB    generated image
const AVG_AVATAR_BYTES       = 150_000;   // ~150 KB  profile picture

export async function GET(req: NextRequest) {
    try {
        const authResult = await requireRole(req, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        await connectToDatabase();

        const [
            totalUsers,
            usersWithAvatar,
            totalRenders,
            completedRenders,
            failedRenders,
            processingRenders,
            rendersWithOutput,
            rendersByMode,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ imageUrl: { $exists: true, $nin: [null, ''] } }),
            Render.countDocuments(),
            Render.countDocuments({ status: 'completed' }),
            Render.countDocuments({ status: 'failed' }),
            Render.countDocuments({ status: { $in: ['processing', 'queued'] } }),
            Render.countDocuments({
                status: 'completed',
                $or: [
                    { outputImageUrl: { $exists: true, $ne: '' } },
                    { generatedImageUrl: { $exists: true, $ne: '' } },
                    { result: { $exists: true } },
                ],
            }),
            Render.aggregate([
                { $group: { _id: '$mode', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),
        ]);

        // Estimate total bytes
        const avatarBytes      = usersWithAvatar * AVG_AVATAR_BYTES;
        const inputImageBytes  = totalRenders    * AVG_INPUT_IMAGE_BYTES;
        const outputImageBytes = rendersWithOutput * AVG_OUTPUT_IMAGE_BYTES;
        const totalBytes       = avatarBytes + inputImageBytes + outputImageBytes;

        const formatBytes = (bytes: number): string => {
            if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(2)} TB`;
            if (bytes >= 1e9)  return `${(bytes / 1e9).toFixed(2)} GB`;
            if (bytes >= 1e6)  return `${(bytes / 1e6).toFixed(1)} MB`;
            return `${(bytes / 1e3).toFixed(0)} KB`;
        };

        const breakdown = [
            {
                label:      'User Avatars',
                count:      usersWithAvatar,
                bytes:      avatarBytes,
                formatted:  formatBytes(avatarBytes),
                percentage: totalBytes > 0 ? Math.round((avatarBytes / totalBytes) * 100) : 0,
                icon:       'avatar',
            },
            {
                label:      'Input Images',
                count:      totalRenders,
                bytes:      inputImageBytes,
                formatted:  formatBytes(inputImageBytes),
                percentage: totalBytes > 0 ? Math.round((inputImageBytes / totalBytes) * 100) : 0,
                icon:       'upload',
            },
            {
                label:      'Generated Images',
                count:      rendersWithOutput,
                bytes:      outputImageBytes,
                formatted:  formatBytes(outputImageBytes),
                percentage: totalBytes > 0 ? Math.round((outputImageBytes / totalBytes) * 100) : 0,
                icon:       'sparkles',
            },
        ];

        const modeStorage = rendersByMode.map((m: any) => ({
            mode:      m._id ?? 'unknown',
            count:     m.count,
            bytes:     m.count * (AVG_INPUT_IMAGE_BYTES + AVG_OUTPUT_IMAGE_BYTES),
            formatted: formatBytes(m.count * (AVG_INPUT_IMAGE_BYTES + AVG_OUTPUT_IMAGE_BYTES)),
        }));

        return NextResponse.json({
            summary: {
                totalFiles:       usersWithAvatar + totalRenders + rendersWithOutput,
                totalBytes,
                totalFormatted:   formatBytes(totalBytes),
                usedPercent:      0,    // No hard limit — UploadThing usage billed by bandwidth
            },
            counts: {
                totalUsers,
                usersWithAvatar,
                totalRenders,
                completedRenders,
                failedRenders,
                processingRenders,
                rendersWithOutput,
            },
            breakdown,
            modeStorage,
        }, { status: 200 });
    } catch (error) {
        console.error('Admin storage error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
