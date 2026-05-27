/**
 * POST /api/designer/register
 * 
 * Manual Test:
 * curl -X POST http://localhost:3000/api/designer/register \
 *   -H "Content-Type: application/json" \
 *   -H "Cookie: auth_token=YOUR_JWT_HERE" \
 *   -d '{
 *     "displayName": "John Doe Interiors",
 *     "bio": "Expert modular kitchen and minimalist designs",
 *     "phone": "+919876543210",
 *     "city": "Mumbai",
 *     "specialties": ["modular-kitchen", "minimalist"],
 *     "portfolioImages": ["https://picsum.photos/800/600"],
 *     "yearsOfExperience": 5
 *   }'
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Designer, DESIGNER_SPECIALTIES } from '@/lib/db/models/Designer';
import { User } from '@/lib/db/models/User';

export async function POST(req: NextRequest) {
    try {
        // Authenticate any logged-in user
        const authResult = await requireRole(req, ['customer', 'designer', 'admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { user } = authResult;
        const userId = user._id;

        // Parse and validate request body
        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
        }

        const { displayName, bio, phone, city, specialties, portfolioImages, yearsOfExperience } = body;

        // Validation checks
        if (!displayName || typeof displayName !== 'string' || displayName.trim().length < 2) {
            return NextResponse.json({ message: 'Display name is required (min 2 characters)' }, { status: 400 });
        }
        if (!phone || typeof phone !== 'string' || phone.trim().length < 5) {
            return NextResponse.json({ message: 'Valid phone number is required' }, { status: 400 });
        }
        if (!city || typeof city !== 'string' || city.trim().length < 2) {
            return NextResponse.json({ message: 'City is required' }, { status: 400 });
        }

        // Validate specialties
        if (specialties !== undefined) {
            if (!Array.isArray(specialties)) {
                return NextResponse.json({ message: 'Specialties must be an array' }, { status: 400 });
            }
            for (const spec of specialties) {
                if (!DESIGNER_SPECIALTIES.includes(spec)) {
                    return NextResponse.json({ message: `Invalid specialty: ${spec}` }, { status: 400 });
                }
            }
        }

        // Validate portfolioImages
        if (portfolioImages !== undefined) {
            if (!Array.isArray(portfolioImages)) {
                return NextResponse.json({ message: 'Portfolio images must be an array' }, { status: 400 });
            }
            if (portfolioImages.length > 10) {
                return NextResponse.json({ message: 'Maximum 10 portfolio images allowed' }, { status: 400 });
            }
            for (const img of portfolioImages) {
                if (typeof img !== 'string') {
                    return NextResponse.json({ message: 'Portfolio image URLs must be strings' }, { status: 400 });
                }
            }
        }

        // Validate yearsOfExperience
        if (yearsOfExperience !== undefined) {
            const exp = Number(yearsOfExperience);
            if (isNaN(exp) || exp < 0 || exp > 60) {
                return NextResponse.json({ message: 'Years of experience must be between 0 and 60' }, { status: 400 });
            }
        }

        await connectToDatabase();

        // Check if designer profile already exists
        const existingDesigner = await Designer.findOne({ userId });

        let designer;
        if (existingDesigner) {
            // Rejection flow: if there is a rejection reason, allow resubmission (updating existing profile)
            if (existingDesigner.rejectionReason !== null) {
                existingDesigner.displayName = displayName.trim();
                existingDesigner.bio = bio ? bio.trim() : undefined;
                existingDesigner.phone = phone.trim();
                existingDesigner.city = city.trim();
                existingDesigner.specialties = specialties || [];
                existingDesigner.portfolioImages = portfolioImages || [];
                existingDesigner.yearsOfExperience = yearsOfExperience !== undefined ? Number(yearsOfExperience) : undefined;
                existingDesigner.isVerified = false;
                existingDesigner.verifiedAt = null;
                existingDesigner.verifiedBy = null;
                existingDesigner.rejectionReason = null; // Clear rejection
                existingDesigner.isActive = true;

                designer = await existingDesigner.save();
            } else {
                return NextResponse.json({ message: 'Already registered as a designer' }, { status: 400 });
            }
        } else {
            // Create brand new designer
            designer = await Designer.create({
                userId,
                displayName: displayName.trim(),
                bio: bio ? bio.trim() : undefined,
                phone: phone.trim(),
                city: city.trim(),
                specialties: specialties || [],
                portfolioImages: portfolioImages || [],
                yearsOfExperience: yearsOfExperience !== undefined ? Number(yearsOfExperience) : undefined,
                isVerified: false,
                isActive: true,
            });
        }

        // Update User role to 'designer' (but don't downgrade if user is 'admin')
        if (user.role === 'customer') {
            try {
                await User.findByIdAndUpdate(userId, { role: 'designer' });
            } catch (userUpdateErr) {
                console.error('Failed to update user role to designer:', userUpdateErr);
                // Non-blocking: Still return 201 as profile creation/update succeeded
            }
        }

        return NextResponse.json({ designer }, { status: 201 });
    } catch (error) {
        console.error('Register designer error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
