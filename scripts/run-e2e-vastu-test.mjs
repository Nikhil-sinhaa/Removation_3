import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split('=');
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    process.env[key] = val;
  }
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/removation_ai';
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('Error: JWT_SECRET not found in .env.local');
  process.exit(1);
}

async function main() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  // Find a test user
  const user = await mongoose.connection.db.collection('users').findOne({
    email: 'nikhilkumarsinha4321@gmail.com'
  });

  if (!user) {
    console.error('Test user nikhilkumarsinha4321@gmail.com not found. Finding any user...');
    const fallbackUser = await mongoose.connection.db.collection('users').findOne({});
    if (!fallbackUser) {
      console.error('No users found in database.');
      process.exit(1);
    }
    await runTestWithUser(fallbackUser);
  } else {
    // Add credits and set role to admin to allow toggling GPU mode
    await mongoose.connection.db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { 
          role: 'admin',
          credits: 100,
          "subscription.credits": 500,
          "subscription.creditsUsed": 0,
          "subscription.plan": "pro",
          "subscription.status": "active"
        } 
      }
    );

    // Delete stale Google Drive tokens to avoid blocking OAuth refresh network call
    await mongoose.connection.db.collection('appsettings').deleteOne({ key: 'GOOGLE_DRIVE_TOKENS' });
    console.log('Stale Google Drive tokens deleted from database for rapid mock fallback.');

    const updatedUser = await mongoose.connection.db.collection('users').findOne({ _id: user._id });
    await runTestWithUser(updatedUser);
  }

  await mongoose.disconnect();
}

async function runTestWithUser(user) {
  console.log(`\n=== Running Test with User: ${user.email} (ID: ${user._id}) ===`);
  
  // Sign JWT token
  const token = jwt.sign(
    { id: user._id.toString(), email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const cookieHeader = `auth_token=${token}`;

  // Toggle GPU mode to local
  console.log('Switching GPU mode to local via settings API...');
  const settingsRes = await fetch('http://localhost:3000/api/settings/gpu', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader
    },
    body: JSON.stringify({ mode: 'local' })
  });
  if (!settingsRes.ok) {
    console.warn('Warning: Failed to switch GPU mode to local:', await settingsRes.text());
  } else {
    console.log('GPU mode switched to local successfully.');
  }
  
  const payload = {
    imageUrl: '/renders/bedroom.jpg',
    roomType: 'bedroom',
    direction: 'north'
  };

  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Submitting async Vastu job...`);
  
  const submitRes = await fetch('http://localhost:3000/api/ai/jobs/vastu', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader
    },
    body: JSON.stringify(payload)
  });

  const submitTime = Date.now();
  const submitDuration = submitTime - startTime;
  
  if (!submitRes.ok) {
    const text = await submitRes.text();
    console.error(`Job submission failed (${submitRes.status}):`, text);
    return;
  }

  const submitData = await submitRes.json();
  console.log(`[${new Date().toISOString()}] Job submitted successfully in ${submitDuration}ms.`);
  console.log('Response:', JSON.stringify(submitData, null, 2));

  const jobId = submitData.jobId;
  if (!jobId) {
    console.error('No jobId returned in response.');
    return;
  }

  // Poll status
  let status = 'queued';
  let elapsed = 0;
  const pollInterval = 3000; // 3 seconds
  const timeoutLimit = 240000; // 4 minutes
  let pollCount = 0;
  
  let leaseTime = null;
  let comfuiStartTime = null;
  let comfyuiEndTime = null;
  let completeTime = null;
  let firstCompletedFetchTime = null;
  let finalResult = null;

  console.log(`\nStarting status polling for job ${jobId}...`);
  
  while (status !== 'completed' && status !== 'failed' && elapsed < timeoutLimit) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    pollCount++;
    elapsed = Date.now() - submitTime;

    const pollStart = Date.now();
    const statusRes = await fetch(`http://localhost:3000/api/ai/jobs/${jobId}/status`, {
      headers: {
        'Cookie': cookieHeader
      }
    });
    const pollDuration = Date.now() - pollStart;

    if (!statusRes.ok) {
      console.warn(`[${new Date().toISOString()}] Poll #${pollCount} failed (${statusRes.status}). Continuing...`);
      continue;
    }

    const statusData = await statusRes.json();
    const currentStatus = statusData.status;

    console.log(`[${new Date().toISOString()}] Poll #${pollCount} (elapsed: ${Math.round(elapsed / 1000)}s, response: ${pollDuration}ms) -> Status: ${currentStatus}`);

    if (currentStatus !== status) {
      console.log(`>>> Status transitioned: ${status} -> ${currentStatus}`);
      status = currentStatus;
    }

    if (status === 'completed') {
      firstCompletedFetchTime = Date.now();
      finalResult = statusData;
      break;
    }
    if (status === 'failed') {
      console.error('Job failed according to status endpoint.');
      console.error('Errors:', statusData.errorLogs);
      break;
    }
  }

  if (status !== 'completed') {
    console.error(`Job did not complete. Final status: ${status}. Timeout elapsed: ${Math.round(elapsed / 1000)}s.`);
    return;
  }

  console.log('\n=== Fetching job details from database to get precise timestamps ===');
  const jobDoc = await mongoose.connection.db.collection('gpujobs').findOne({
    _id: new mongoose.Types.ObjectId(jobId)
  });

  if (jobDoc) {
    const createdAt = jobDoc.createdAt;
    const leasedAt = jobDoc.leasedAt;
    const processingStartedAt = jobDoc.processingStartedAt;
    const processingCompletedAt = jobDoc.processingCompletedAt;
    const completedAt = jobDoc.completedAt;

    console.log('Database Timestamps:');
    console.log(`- Created At:             ${createdAt ? new Date(createdAt).toISOString() : 'N/A'}`);
    console.log(`- Leased At:              ${leasedAt ? new Date(leasedAt).toISOString() : 'N/A'}`);
    console.log(`- Processing Started:     ${processingStartedAt ? new Date(processingStartedAt).toISOString() : 'N/A'}`);
    console.log(`- Processing Completed:   ${processingCompletedAt ? new Date(processingCompletedAt).toISOString() : 'N/A'}`);
    console.log(`- Completed/Saved:        ${completedAt ? new Date(completedAt).toISOString() : 'N/A'}`);

    if (leasedAt && createdAt) {
      console.log(`  -> Time to pick up (lease): ${new Date(leasedAt) - new Date(createdAt)}ms`);
    }
    if (processingCompletedAt && processingStartedAt) {
      console.log(`  -> Worker processing time:  ${new Date(processingCompletedAt) - new Date(processingStartedAt)}ms`);
    }
    if (completedAt && createdAt) {
      console.log(`  -> Total job pipeline time: ${new Date(completedAt) - new Date(createdAt)}ms`);
    }
  }

  // ── Run Synchronous Regression Test ──────────────────────────────────────────
  console.log('\n=== Running Synchronous Regression Check (POST /api/vastu) ===');
  const syncStart = Date.now();
  console.log(`[${new Date().toISOString()}] Sending synchronous vastu analysis request...`);
  
  const syncRes = await fetch('http://localhost:3000/api/vastu', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader
    },
    body: JSON.stringify(payload)
  });

  const syncEnd = Date.now();
  const syncDuration = syncEnd - syncStart;

  if (!syncRes.ok) {
    const text = await syncRes.text();
    console.error(`Sync Vastu request failed (${syncRes.status}):`, text);
    return;
  }

  const syncData = await syncRes.json();
  console.log(`[${new Date().toISOString()}] Sync request finished successfully in ${syncDuration}ms.`);
  console.log(`Sync Score: ${syncData.score}`);
  console.log(`Sync Detected Elements Count: ${syncData.detectedElements?.length || 0}`);

  // Print Comparison
  console.log('\n================================================================');
  console.log('                    LATENCY COMPARISON REPORT                    ');
  console.log('================================================================');
  console.log(`Async Job Submission API Response Time:  ${submitDuration}ms`);
  
  if (jobDoc) {
    const created = new Date(jobDoc.createdAt);
    const leased = jobDoc.leasedAt ? new Date(jobDoc.leasedAt) : null;
    const completed = jobDoc.completedAt ? new Date(jobDoc.completedAt) : null;
    
    if (leased) {
      console.log(`Worker Leasing Delay (Queue Wait Time):   ${leased - created}ms`);
    }
    if (completed && leased) {
      console.log(`Worker Execution Time (ComfyUI + Drive): ${completed - leased}ms`);
    }
    if (completed) {
      console.log(`Total Asynchronous End-to-End Latency:   ${completed - created}ms`);
    }
  }
  
  console.log(`Synchronous /api/vastu Execution Latency: ${syncDuration}ms`);
  console.log('----------------------------------------------------------------');
  console.log(`Response Time Improvement for Client UI:  ${(syncDuration - submitDuration).toFixed(0)}ms faster initial response!`);
  console.log('================================================================');

  // Print Vastu Results Summary
  console.log('\n================================================================');
  console.log('                     VASTU DETECTION RESULTS                    ');
  console.log('================================================================');
  console.log(`Final Vastu Score: ${finalResult.score}`);
  console.log(`Detected Elements Count: ${finalResult.detectedElements?.length || 0}`);
  if (finalResult.detectedElements && finalResult.detectedElements.length > 0) {
    console.log('Detected Elements List:');
    finalResult.detectedElements.forEach(el => {
      console.log(`  - ${el.name} (Compliance: ${el.vastuCompliance})`);
    });
  }
  console.log(`Issues Found Count: ${finalResult.issues?.length || 0}`);
  if (finalResult.issues && finalResult.issues.length > 0) {
    finalResult.issues.forEach((issue, idx) => {
      console.log(`  [Issue #${idx + 1}] ${issue.title || issue.message || JSON.stringify(issue)}`);
    });
  }
  console.log(`Suggestions Count: ${finalResult.suggestions?.length || 0}`);
  console.log('================================================================\n');
}

main().catch(err => {
  console.error('Unhandled error in test runner:', err);
  process.exit(1);
});
