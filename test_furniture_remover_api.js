import fs from 'fs';
import path from 'path';

const delay = ms => new Promise(res => setTimeout(res, ms));

async function main() {
  const imagePath = '/home/nikhil/Documents/Remo2/Removation_3/test_images/bedroom.jpg';
  console.log(`🚀 Starting end-to-end integration test with image: ${imagePath}`);

  // ----------------------------------------------------
  // STEP 1: Auto-detection
  // ----------------------------------------------------
  console.log('\n--- Step 1: Submitting to /api/ai/furniture-remover/detect ---');
  const formData = new FormData();
  const fileBuffer = fs.readFileSync(imagePath);
  const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
  formData.append('roomImage', blob, path.basename(imagePath));

  const detectRes = await fetch('http://localhost:3000/api/ai/furniture-remover/detect', {
    method: 'POST',
    body: formData,
  });

  if (!detectRes.ok) {
    console.error(`❌ Detect HTTP error: ${detectRes.status}`);
    console.error(await detectRes.text());
    process.exit(1);
  }

  const detectData = await detectRes.json();
  const projectId = detectData.projectId;
  console.log(`✅ Job queued successfully. Project ID: ${projectId}`);

  // Poll for detection completion
  let status = 'queued';
  let attempts = 0;
  let detectInfo = null;

  while (attempts < 60) {
    await delay(3000);
    attempts++;
    const pollRes = await fetch(`http://localhost:3000/api/ai/furniture-remover/detect?projectId=${projectId}`);
    if (!pollRes.ok) {
      console.error(`❌ Poll HTTP error: ${pollRes.status}`);
      continue;
    }
    detectInfo = await pollRes.json();
    status = detectInfo.status;
    console.log(`[Detect Poll ${attempts}] Status: ${status}, maskUrl: ${detectInfo.maskUrl}`);

    if (detectInfo.maskUrl) {
      console.log(`🎉 Auto-detection Completed!`);
      console.log(`- Input Image URL: ${detectInfo.inputImageUrl}`);
      console.log(`- Mask Image URL: ${detectInfo.maskUrl}`);
      console.log(`- Adjusted Image URL: ${detectInfo.adjustedImageUrl}`);
      break;
    } else if (status === 'failed') {
      console.error(`❌ Auto-detection failed:`, detectInfo.errorMessage);
      process.exit(1);
    }
  }

  if (!detectInfo || !detectInfo.maskUrl) {
    console.error(`❌ Auto-detection timed out.`);
    process.exit(1);
  }

  // ----------------------------------------------------
  // STEP 2: Erasure
  // ----------------------------------------------------
  console.log('\n--- Step 2: Submitting to /api/ai/furniture-remover/erase ---');
  const eraseFormData = new FormData();
  eraseFormData.append('projectId', projectId);

  const eraseRes = await fetch('http://localhost:3000/api/ai/furniture-remover/erase', {
    method: 'POST',
    body: eraseFormData,
  });

  if (!eraseRes.ok) {
    console.error(`❌ Erase HTTP error: ${eraseRes.status}`);
    console.error(await eraseRes.text());
    process.exit(1);
  }

  console.log(`✅ Erase job queued successfully.`);

  // Poll for erase completion
  status = 'queued';
  attempts = 0;
  let eraseInfo = null;

  while ((status === 'queued' || status === 'processing' || status === 'completed') && attempts < 60) {
    // Note: status might temporarily reset to queued or processing as eraseFurniture starts.
    await delay(3000);
    attempts++;
    const pollRes = await fetch(`http://localhost:3000/api/ai/furniture-remover/erase?projectId=${projectId}`);
    if (!pollRes.ok) {
      console.error(`❌ Poll HTTP error: ${pollRes.status}`);
      continue;
    }
    eraseInfo = await pollRes.json();
    status = eraseInfo.status;
    console.log(`[Erase Poll ${attempts}] Status: ${status}`);

    // If it completed, and we have outputImageUrl, then it's done!
    if (status === 'completed' && eraseInfo.outputImageUrl) {
      console.log(`🎉 Erasure Completed!`);
      console.log(`- Before Image: ${eraseInfo.beforeUrl}`);
      console.log(`- After Image: ${eraseInfo.afterUrl}`);
      break;
    } else if (status === 'failed') {
      console.error(`❌ Erasure failed:`, eraseInfo.errorMessage);
      process.exit(1);
    }
  }

  if (status === 'completed' && eraseInfo.outputImageUrl) {
    console.log('\n🌟 ALL TESTS PASSED SUCCESSFULLY! 🌟');
  } else {
    console.error(`❌ Erasure timed out or failed.`);
    process.exit(1);
  }
}

main().catch(console.error);
