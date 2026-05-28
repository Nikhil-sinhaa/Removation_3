// app/api/contractor/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Contractor, CONTRACTOR_SPECIALTIES } from '@/lib/db/models/Contractor';
import { User } from '@/lib/db/models/User';
import { isValidPortfolioImageUrl } from '@/lib/utils/isValidPortfolioImageUrl';

export async function POST(req: NextRequest) {
    try {
        // Authenticate user
        const authResult = await requireRole(req, ['customer', 'contractor', 'admin']);
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
                if (!CONTRACTOR_SPECIALTIES.includes(spec)) {
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
                if (!isValidPortfolioImageUrl(img)) {
                    return NextResponse.json(
                        { message: 'Portfolio images must be uploaded via this platform. External URLs are not accepted.' },
                        { status: 400 }
                    );
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

        // Check if contractor profile already exists
        const existingContractor = await Contractor.findOne({ userId });

        let contractor;
        if (existingContractor) {
            // Rejection flow: if there is a rejection reason, allow resubmission (updating existing profile)
            if (existingContractor.rejectionReason !== null) {
                existingContractor.displayName = displayName.trim();
                existingContractor.bio = bio ? bio.trim() : undefined;
                existingContractor.phone = phone.trim();
                existingContractor.city = city.trim();
                existingContractor.specialties = specialties || [];
                existingContractor.portfolioImages = portfolioImages || [];
                existingContractor.yearsOfExperience = yearsOfExperience !== undefined ? Number(yearsOfExperience) : undefined;
                existingContractor.isVerified = false;
                existingContractor.verifiedAt = null;
                existingContractor.verifiedBy = null;
                existingContractor.rejectionReason = null; // Clear rejection
                existingContractor.isActive = true;

                contractor = await existingContractor.save();
            } else {
                return NextResponse.json({ message: 'Already registered as a contractor' }, { status: 400 });
            }
        } else {
            // Create brand new contractor
            contractor = await Contractor.create({
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
                consultationFee: { amount: 0, currency: 'INR' },
                projectMinFee: { amount: 0, currency: 'INR' },
                acceptsConsultations: true,
                acceptsProjects: true,
            });
        }

        // Update User role to 'contractor' (but don't downgrade if user is 'admin')
        if (user.role === 'customer') {
            try {
                await User.findByIdAndUpdate(userId, { role: 'contractor' });
            } catch (userUpdateErr) {
                console.error('Failed to update user role to contractor:', userUpdateErr);
            }
        }

        return NextResponse.json({ contractor }, { status: 201 });
    } catch (error) {
        console.error('Register contractor error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
