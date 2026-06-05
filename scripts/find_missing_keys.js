import fs from 'fs';
import path from 'path';

const hook = fs.readFileSync('hooks/useLanguage.ts', 'utf8');

// Function to recursively find TSX files
function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, files);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      files.push(filePath);
    }
  }
  return files;
}

const files = [
  ...getFiles('app/(app)'),
  ...getFiles('components')
];

const allMissing = {};

for (const file of files) {
  // Skip useLanguage.ts itself
  if (file.includes('useLanguage.ts')) continue;
  
  const content = fs.readFileSync(file, 'utf8');
  
  // Match t('...') and t("...")
  const tMatches = [...content.matchAll(/t\(['"]([a-zA-Z0-9_]+)['"]\)/g)].map(m => m[1]);
  
  // Also match key properties like titleKey: '...', descKey: '...', badgeKey: '...', key: '...'
  const keyMatches = [...content.matchAll(/(?:titleKey|descKey|badgeKey|key)\s*:\s*['"]([a-zA-Z0-9_]+)['"]/g)].map(m => m[1]);
  
  const allMatches = [...new Set([...tMatches, ...keyMatches])];
  
  const missing = allMatches.filter(key => {
    // Only verify keys that start with standard namespaces or have specific patterns
    if (!key.includes('_') || key.startsWith('bg_') || key.startsWith('text_') || key.startsWith('font_') || key.startsWith('items_')) return false;
    
    // Check if it appears in useLanguage.ts
    const pattern1 = `'${key}'`;
    const pattern2 = `"${key}"`;
    return !hook.includes(pattern1) && !hook.includes(pattern2);
  });
  
  if (missing.length > 0) {
    allMissing[file] = missing;
  }
}

console.log('--- SCANNING ALL PAGES FOR MISSING KEYS ---');
console.log(JSON.stringify(allMissing, null, 2));
