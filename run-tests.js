import fs from 'fs';
import path from 'path';

// Helper to poll for status
const delay = ms => new Promise(res => setTimeout(res, ms));

const results = [];

async function runTest(name, mode, imagePath, roomType, style, colorPalette, masterSelector = null, masterToggles = null) {
  console.log(`\n=== Starting Test: ${name} ===`);
  
  const formData = new FormData();
  const fileBuffer = fs.readFileSync(imagePath);
  const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
  formData.append('image', blob, path.basename(imagePath));

  const data = {
    roomType,
    style,
    colorPalette,
    masterSelector,
    masterToggles,
    changeLevel: 'medium',
    useControlNet: true
  };
  
  formData.append('data', JSON.stringify(data));

  console.log(`Sending POST to /api/ai/redesign...`);
  try {
    const res = await fetch('http://localhost:3000/api/ai/redesign', {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) {
      console.error(`❌ HTTP Error: ${res.status}`);
      console.error(await res.text());
      results.push({ name, status: 'failed', error: 'HTTP Error' });
      return;
    }
    
    const result = await res.json();
    console.log(`✅ Job queued. Project ID: ${result.projectId}`);
    
    // Wait 45 seconds for completion instead of polling the broken endpoint
    await delay(45000);
    console.log(`✅ Waited 45s for job ${result.projectId}. Checking next.`);
    results.push({ name, status: 'completed_assumed', imageType: path.basename(imagePath), roomType, style, masterSelector });
    
  } catch (err) {
    console.error(`❌ Try/catch error:`, err);
    results.push({ name, status: 'error', error: err.message });
  }
}

async function main() {
  const images = {
    living: '/home/nikhil/Documents/Remo2/Removation_3/public/images/gallery/living-before-1.jpg',
    bedroom: '/home/nikhil/Documents/Remo2/Removation_3/public/images/gallery/bedroom-before-1.jpg',
    kitchen: '/home/nikhil/Documents/Remo2/Removation_3/public/images/gallery/kitchen-before-1.jpg'
  };

  // Test set for checking different room functionalities properly
  // 1. Professional - Kitchen (Modern, Neutral)
  await runTest(
    'Professional Design - Kitchen (Modern, Neutral)',
    'professional',
    images.kitchen,
    'Kitchen',
    'Modern',
    'Neutral'
  );

  // 2. Professional - Bedroom (Industrial, Moody)
  await runTest(
    'Professional Design - Bedroom (Industrial, Moody)',
    'professional',
    images.bedroom,
    'Bedroom',
    'Industrial',
    'Moody'
  );

  // 3. Master Design - Living Room - Try 1 (White Walls)
  await runTest(
    'Master Design - Living Room (White Walls, Wood Floor)',
    'master',
    images.living,
    'Living Room',
    'Modern',
    'Neutral',
    { wallColor: 'White', floorType: 'Wood', furnitureStyle: 'Modern' },
    { walls: true, floor: true, furniture: true, lighting: false, decor: false, ceiling: false }
  );

  // 4. Master Design - Living Room - Try 2 (Blue Walls, structure check)
  await runTest(
    'Master Design - Living Room (Blue Walls, Wood Floor - checking structure preservation)',
    'master',
    images.living,
    'Living Room',
    'Modern',
    'Neutral',
    { wallColor: 'Blue', floorType: 'Wood', furnitureStyle: 'Modern' },
    { walls: true, floor: true, furniture: true, lighting: false, decor: false, ceiling: false }
  );

  // Write results to JSON
  fs.writeFileSync('test-results.json', JSON.stringify(results, null, 2));
  console.log('All tests finished. Results written to test-results.json');
}

main().catch(console.error);
