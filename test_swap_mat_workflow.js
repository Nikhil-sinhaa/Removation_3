import fs from 'fs/promises';
import { guiToApiGraph } from './src/lib/comfyWorkflowConverter.js';

const COMFY_URL = 'http://127.0.0.1:8188';

async function main() {
  console.log('🚀 Loading swap mat.json...');
  const workflowData = await fs.readFile('/home/nikhil/Documents/Remo2/ComfyUI/user/default/workflows/swap mat.json', 'utf8');
  const guiWorkflow = JSON.parse(workflowData);
  
  console.log('🔄 Converting to ComfyUI API Graph...');
  const apiGraph = guiToApiGraph(guiWorkflow);
  
  // Debug output of nodes to verify correctness
  console.log('UNETLoader config in API graph:', JSON.stringify(apiGraph['18'], null, 2));
  console.log('VAELoader config in API graph:', JSON.stringify(apiGraph['19'], null, 2));
  console.log('CLIPLoader config in API graph:', JSON.stringify(apiGraph['14'], null, 2));
  console.log('TextEncodeQwenImageEditPlus config in API graph:', JSON.stringify(apiGraph['7'], null, 2));

  console.log('📤 Submitting to ComfyUI...');
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
  console.log('⏳ Processing with Qwen-Image-Edit-2509. Monitoring progress...');
  
  let attempts = 0;
  const maxAttempts = 100; // ~5 minutes
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    attempts++;
    
    try {
      const historyRes = await fetch(`${COMFY_URL}/history/${promptId}`);
      if (!historyRes.ok) continue;
      
      const history = await historyRes.json();
      if (history[promptId]) {
        const promptHistory = history[promptId];
        const status = promptHistory.status || {};
        
        if (status.status_str === 'success') {
          console.log('\n✅ Material Swap workflow COMPLETED successfully!');
          console.log('🖼️ Outputs:', JSON.stringify(promptHistory.outputs, null, 2));
          return;
        } else if (status.status_str === 'error') {
          console.log('\n❌ Workflow execution error:');
          console.log(JSON.stringify(status, null, 2));
          return;
        }
      }
    } catch (e) {
      // Ignore polling errors
    }
    
    process.stdout.write('.');
  }
  
  console.log('\n⏳ Timeout: workflow execution took too long.');
}

main().catch(console.error);
