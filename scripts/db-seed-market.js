import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/removation_ai';

async function main() {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    
    // Find the user IDs
    const user1 = await mongoose.connection.db.collection('users').findOne({ email: 'testuser1@example.com' });
    const user2 = await mongoose.connection.db.collection('users').findOne({ email: 'xhm90760@gmail.com' });

    if (!user1) {
        throw new Error('testuser1@example.com not found');
    }
    if (!user2) {
        throw new Error('xhm90760@gmail.com not found');
    }

    console.log(`testuser1@example.com ID: ${user1._id}`);
    console.log(`xhm90760@gmail.com ID: ${user2._id}`);

    // Let's delete existing contractor or vendor profiles for these users to clean up
    await mongoose.connection.db.collection('contractors').deleteMany({ userId: user1._id });
    await mongoose.connection.db.collection('vendors').deleteMany({ userId: user2._id });

    // Create a Contractor record
    const contractor = {
        userId: user1._id,
        displayName: 'John Doe Carpentry',
        bio: 'Over 10 years of experience making custom furniture and premium cabinets.',
        phone: '+1 555-0199',
        city: 'San Francisco',
        specialties: ['carpenter'],
        portfolioImages: ['https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80'],
        yearsOfExperience: 12,
        isVerified: false,
        verifiedAt: null,
        verifiedBy: null,
        rejectionReason: null,
        isActive: true,
        consultationFee: {
            amount: 50000, // ₹500
            currency: 'INR'
        },
        consultationDurationMinutes: 60,
        projectMinFee: {
            amount: 2500000, // ₹25,000
            currency: 'INR'
        },
        acceptsConsultations: true,
        acceptsProjects: true,
        averageRating: 0,
        totalReviews: 0,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const contractorInsert = await mongoose.connection.db.collection('contractors').insertOne(contractor);
    console.log('Contractor inserted:', contractorInsert.insertedId);

    // Create a Vendor record
    const vendor = {
        userId: user2._id,
        displayName: 'Premium Tiles & Co',
        bio: 'Direct importer of ceramic, porcelain, and marble tiles.',
        phone: '+1 555-0288',
        city: 'San Francisco',
        storeAddress: '123 Tile Way, San Francisco',
        specialties: ['tile-shop'],
        portfolioImages: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'],
        isVerified: false,
        verifiedAt: null,
        verifiedBy: null,
        rejectionReason: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const vendorInsert = await mongoose.connection.db.collection('vendors').insertOne(vendor);
    console.log('Vendor inserted:', vendorInsert.insertedId);

    await mongoose.disconnect();
    console.log('Done!');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
