import { connectToDatabase } from '../db/mongodb';
import { Tour } from '../db/models/Tour';
import { defaultTours } from './defaultTours';

export async function seedDefaultTours() {
  try {
    await connectToDatabase();
    
    console.log('Seeding default tours...');
    let seededCount = 0;
    
    for (const tour of defaultTours) {
      const existing = await Tour.findOne({ id: tour.id });
      if (!existing) {
        await Tour.create(tour);
        seededCount++;
      }
    }
    
    console.log(`Seeded ${seededCount} new tours.`);
  } catch (error) {
    console.error('Error seeding default tours:', error);
  }
}
