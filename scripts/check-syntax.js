const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function checkDir(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === 'node_modules' || item === '.git') continue;
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      checkDir(full);
    } else if (item.endsWith('.js')) {
      try {
        execFileSync(process.execPath, ['-c', full], { stdio: 'pipe' });
      } catch (err) {
        console.error('SYNTAX ERROR IN:', full);
        console.error(err.stderr ? err.stderr.toString() : err.message);
      }
    }
  }
}

console.log('Checking all JS files...');
checkDir(path.resolve(__dirname, '..'));
console.log('Done checking JS files.');
