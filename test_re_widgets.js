// test_re_widgets.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { guiToApiGraph } from './src/lib/comfyWorkflowConverter.js';

function scanWorkflow(filepath) {
  console.log(`Scanning ${filepath}...`);
  const json = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  const api = guiToApiGraph(json);
  
  const badNodes = [];
  Object.entries(api).forEach(([id, node]) => {
    const keys = Object.keys(node.inputs);
    const hasWidgetKey = keys.some(k => k.startsWith('widget_'));
    if (hasWidgetKey) {
      badNodes.push({ id, class_type: node.class_type, inputs: node.inputs });
    }
  });
  
  if (badNodes.length > 0) {
    console.log(`❌ Workflow has unmapped widgets:`);
    badNodes.forEach(n => {
      console.log(`  - Node ${n.id} (${n.class_type}):`, JSON.stringify(n.inputs));
    });
  } else {
    console.log(`✅ Workflow has all widgets mapped successfully!`);
  }
}

const targetPath = path.join(__dirname, 'src', 'workflows', 'mat changer', 're.json');
scanWorkflow(targetPath);
