const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'globals.css');
let content = fs.readFileSync(filePath, 'utf8');

// Fix line 542 specifically
content = content.replace(
  '@apply backdrop-blur-xl border border-white/10;',
  '@apply backdrop-blur-xl border;\n  border-color: rgba(255, 255, 255, 0.1);'
);

// Fix line 3509 specifically
content = content.replace(
  '.dark .glass {\n  @apply bg-black/40 backdrop-blur-xl border-white/10;\n}',
  '.dark .glass {\n  background-color: rgba(0, 0, 0, 0.4);\n  backdrop-filter: blur(40px);\n  -webkit-backdrop-filter: blur(40px);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n}'
);

// Fix glass-panel border
content = content.replace(
  '@apply border border-white/10;',
  '@apply border;\n  border-color: rgba(255, 255, 255, 0.1);'
);

// Fix any remaining @apply with opacity notation
content = content.replace(/@apply\s+[^;]*border-white\/[^;]*;/g, (match) => {
  return match.replace(/border-white\/\d+/, 'border') + '\n  border-color: rgba(255, 255, 255, 0.1);';
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Final fixes applied');