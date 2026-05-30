// test_re_workflow.js
import fs from 'fs/promises';
import { guiToApiGraph } from './src/lib/comfyWorkflowConverter.js';

const COMFY_URL = 'http://127.0.0.1:8188';

async function main() {
  console.log('🚀 Loading re.json from workflows...');
  const workflowData = await fs.readFile('/home/nikhil/Documents/Remo2/Removation_3/src/workflows/mat changer/re.json', 'utf8');
  const guiWorkflow = JSON.parse(workflowData);
  
  console.log('🔄 Converting GUI workflow to ComfyUI API Graph...');
  const apiGraph = guiToApiGraph(guiWorkflow);
  
  // Validate and log key node configuration
  console.log('📋 Key Node Configurations:');
  console.log('  - Node 20 (UNETLoader):', JSON.stringify(apiGraph['20'], null, 2));
  console.log('  - Node 19 (VAELoader):', JSON.stringify(apiGraph['19'], null, 2));
  console.log('  - Node 14 (CLIPLoader):', JSON.stringify(apiGraph['14'], null, 2));
  console.log('  - Node 17 (LoraLoaderModelOnly):', JSON.stringify(apiGraph['17'], null, 2));
  console.log('  - Node 7 (TextEncodeQwen):', JSON.stringify(apiGraph['7'], null, 2));
  console.log('  - Node 15 (LoadImage 1):', JSON.stringify(apiGraph['15'], null, 2));
  console.log('  - Node 16 (LoadImage 2):', JSON.stringify(apiGraph['16'], null, 2));

  console.log('\n📤 Submitting prompt to ComfyUI...');
  const response = await fetch(`${COMFY_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: apiGraph })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to submit prompt: ${response.statusText} - ${errorText}`);
  }
  
  const result = await response.json();
  const promptId = result.prompt_id;
  console.log(`🎯 Successfully queued! Prompt ID: ${promptId}`);
  console.log('⏳ Processing. Monitoring progress...');
  
  let attempts = 0;
  const maxAttempts = 200; // ~10 minutes
  let lastActiveNode = null;
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    attempts++;
    
    try {
      // 1. Check current queue/execution status for active node info
      const queueRes = await fetch(`${COMFY_URL}/queue`);
      if (queueRes.ok) {
        const queueData = await queueRes.json();
        const running = queueData.queue_running || [];
        const runningPrompt = running.find(p => p[1] === promptId);
        if (runningPrompt) {
          // Running prompt structure contains [number, prompt_id, prompt, extra_data, outputs]
          // Let's get current execution status from /history or the queue api if available
        }
      }
      
      // 2. Poll history endpoint to see if it is completed or has errors
      const historyRes = await fetch(`${COMFY_URL}/history/${promptId}`);
      if (!historyRes.ok) continue;
      
      const history = await historyRes.json();
      if (history[promptId]) {
        const promptHistory = history[promptId];
        const status = promptHistory.status || {};
        
        if (status.status_str === 'success') {
          console.log('\n✅ Material Swap/Changer workflow COMPLETED successfully without any errors!');
          console.log('🖼️ Outputs:', JSON.stringify(promptHistory.outputs, null, 2));
          return;
        } else if (status.status_str === 'error') {
          console.log('\n❌ Workflow execution failed with error:');
          console.log(JSON.stringify(status, null, 2));
          return;
        }
      }
    } catch (e) {
      console.log(`(Polling error: ${e.message})`);
    }
    
    // Print dots to show live tracking
    process.stdout.write('.');
  }
  
  console.log('\n⏳ Timeout: workflow execution took too long.');
}

main().catch(console.error);
