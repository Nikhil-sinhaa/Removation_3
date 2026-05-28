// app/api/vendor/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Vendor, VENDOR_SPECIALTIES } from '@/lib/db/models/Vendor';
import { User } from '@/lib/db/models/User';
import { isValidPortfolioImageUrl } from '@/lib/utils/isValidPortfolioImageUrl';

export async function POST(req: NextRequest) {
    try {
        // Authenticate user
        const authResult = await requireRole(req, ['customer', 'vendor', 'admin']);
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

        const { displayName, bio, phone, city, storeAddress, website, yearsOfExperience, specialties, portfolioImages } = body;

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
        if (!storeAddress || typeof storeAddress !== 'string' || storeAddress.trim().length < 5) {
            return NextResponse.json({ message: 'Store address is required (min 5 characters)' }, { status: 400 });
        }

        // Validate yearsOfExperience
        if (yearsOfExperience !== undefined) {
            const yoe = Number(yearsOfExperience);
            if (!Number.isInteger(yoe) || yoe < 0 || yoe > 100) {
                return NextResponse.json({ message: 'yearsOfExperience must be an integer between 0 and 100' }, { status: 400 });
            }
        }

        // Validate specialties
        if (specialties !== undefined) {
            if (!Array.isArray(specialties)) {
                return NextResponse.json({ message: 'Specialties must be an array' }, { status: 400 });
            }
            for (const spec of specialties) {
                if (!VENDOR_SPECIALTIES.includes(spec)) {
                    return NextResponse.json({ message: `Invalid specialty: ${spec}` }, { status: 400 });
                }
            }
        }

        // Validate portfolioImages/store photos
        if (portfolioImages !== undefined) {
            if (!Array.isArray(portfolioImages)) {
                return NextResponse.json({ message: 'Portfolio images must be an array' }, { status: 400 });
            }
            if (portfolioImages.length > 10) {
                return NextResponse.json({ message: 'Maximum 10 store photos allowed' }, { status: 400 });
            }
            for (const img of portfolioImages) {
                if (typeof img !== 'string') {
                    return NextResponse.json({ message: 'Store photo URLs must be strings' }, { status: 400 });
                }
                if (!isValidPortfolioImageUrl(img)) {
                    return NextResponse.json(
                        { message: 'Store photos must be uploaded via this platform. External URLs are not accepted.' },
                        { status: 400 }
                    );
                }
            }
        }

        await connectToDatabase();

        // Check if vendor profile already exists
        const existingVendor = await Vendor.findOne({ userId });

        let vendor;
        if (existingVendor) {
            // Rejection flow: if there is a rejection reason, allow resubmission (updating existing profile)
            if (existingVendor.rejectionReason !== null) {
                existingVendor.displayName = displayName.trim();
                existingVendor.bio = bio ? bio.trim() : undefined;
                existingVendor.phone = phone.trim();
                existingVendor.city = city.trim();
                existingVendor.storeAddress = storeAddress.trim();
                existingVendor.website = website ? website.trim() : undefined;
                existingVendor.yearsOfExperience = yearsOfExperience !== undefined ? Number(yearsOfExperience) : undefined;
                existingVendor.specialties = specialties || [];
                existingVendor.portfolioImages = portfolioImages || [];
                existingVendor.isVerified = false;
                existingVendor.verifiedAt = null;
                existingVendor.verifiedBy = null;
                existingVendor.rejectionReason = null; // Clear rejection
                existingVendor.isActive = true;

                vendor = await existingVendor.save();
            } else {
                return NextResponse.json({ message: 'Already registered as a vendor' }, { status: 400 });
            }
        } else {
            // Create brand new vendor
            vendor = await Vendor.create({
                userId,
                displayName: displayName.trim(),
                bio: bio ? bio.trim() : undefined,
                phone: phone.trim(),
                city: city.trim(),
                storeAddress: storeAddress.trim(),
                website: website ? website.trim() : undefined,
                yearsOfExperience: yearsOfExperience !== undefined ? Number(yearsOfExperience) : undefined,
                specialties: specialties || [],
                portfolioImages: portfolioImages || [],
                isVerified: false,
                isActive: true,
            });
        }

        // Update User role to 'vendor' (but don't downgrade if user is 'admin')
        if (user.role === 'customer') {
            try {
                await User.findByIdAndUpdate(userId, { role: 'vendor' });
            } catch (userUpdateErr) {
                console.error('Failed to update user role to vendor:', userUpdateErr);
            }
        }

        return NextResponse.json({ vendor }, { status: 201 });
    } catch (error) {
        console.error('Register vendor error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
