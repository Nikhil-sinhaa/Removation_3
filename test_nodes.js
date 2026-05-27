// test_nodes.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { guiToApiGraph } from './src/lib/comfyWorkflowConverter.js';


function scanWorkflow(filename) {
  const filepath = path.join(__dirname, 'src', 'workflows', 'lighting', filename);
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
    console.log(`❌ Workflow ${filename} has unmapped widgets:`);
    badNodes.forEach(n => {
      console.log(`  - Node ${n.id} (${n.class_type}):`, JSON.stringify(n.inputs));
    });
  } else {
    console.log(`   Workflow ${filename} has all widgets mapped successfully!`);
  }
}

console.log('--- WIDGET MAPPING SCAN ---');
scanWorkflow('01_ic_light_static_circle.json');
scanWorkflow('02_ic_light_static_gradient.json');
scanWorkflow('03_ic_light_animated_circle.json');
scanWorkflow('04_ic_light_animated_gradient.json');
scanWorkflow('05_ic_light_animated_multilight.json');
scanWorkflow('06_ic_light_fbc_background.json');
scanWorkflow('07_ic_light_normals_4dir.json');
scanWorkflow('08_ic_light_simple_4dir.json');


