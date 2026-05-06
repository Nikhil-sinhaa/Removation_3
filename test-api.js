import fs from 'fs';
import path from 'path';

// Helper to poll for status
const delay = ms => new Promise(res => setTimeout(res, ms));

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
      return;
    }
    
    const result = await res.json();
    console.log(`✅ Job queued. Project ID: ${result.projectId}`);
    
    // Poll for status
    let status = 'queued';
    let outputUrl = null;
    let attempts = 0;
    
    while ((status === 'queued' || status === 'processing') && attempts < 40) {
      await delay(5000);
      const statusRes = await fetch(`http://localhost:3000/api/ai/redesign/${result.projectId}?projectId=${result.projectId}`);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        status = statusData.status;
        console.log(`[Attempt ${attempts+1}] Status: ${status}`);
        if (status === 'completed') {
          outputUrl = statusData.generatedImage;
          console.log(`🎉 Completed! Output URL: ${outputUrl}`);
          break;
        } else if (status === 'failed') {
          console.error(`❌ Job failed`);
          break;
        }
      }
      attempts++;
    }
    
    if (status !== 'completed') {
      console.error(`Timeout or error. Final status: ${status}`);
    }
  } catch (err) {
    console.error(`❌ Try/catch error:`, err);
  }
}

async function main() {
  const images = {
    living: '/home/nikhil/Documents/Remo2/Removation_3/public/images/gallery/living-before-1.jpg',
    bedroom: '/home/nikhil/Documents/Remo2/Removation_3/public/images/gallery/bedroom-before-1.jpg',
    kitchen: '/home/nikhil/Documents/Remo2/Removation_3/public/images/gallery/kitchen-before-1.jpg'
  };

  // Test 1: Professional Design - Kitchen (Modern)
  await runTest(
    'Professional Design - Kitchen (Modern)',
    'professional',
    images.kitchen,
    'Kitchen',
    'Modern',
    'Neutral'
  );

  // Test 2: Master Design - Living Room (White Walls)
  await runTest(
    'Master Design - Living Room (White Walls)',
    'master',
    images.living,
    'Living Room',
    'Modern',
    'Neutral',
    { wallColor: 'White', floorType: 'Wood', furnitureStyle: 'Modern' },
    { walls: true, floor: true, furniture: true, lighting: false, decor: false, ceiling: false }
  );

  // Test 3: Master Design - Living Room (Blue Walls) - to check if structure remains same but color changes
  await runTest(
    'Master Design - Living Room (Blue Walls)',
    'master',
    images.living,
    'Living Room',
    'Modern',
    'Neutral',
    { wallColor: 'Blue', floorType: 'Wood', furnitureStyle: 'Modern' },
    { walls: true, floor: true, furniture: true, lighting: false, decor: false, ceiling: false }
  );

}

main().catch(console.error);
