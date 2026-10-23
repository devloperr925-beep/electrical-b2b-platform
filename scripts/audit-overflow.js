const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

// Check fixed widths in inline styles
const inlineWidths = [];
const regex = /style="([^"]*)"/g;
let match;
while ((match = regex.exec(html)) !== null) {
  const style = match[1];
  if (/width:\s*\d+px/i.test(style) && !/width:\s*(?:1[0-9]|2[0-9]|3[0-9]|4[0-9]|50)px/i.test(style)) { // exclude icons <= 50px
    inlineWidths.push(style);
  }
}
console.log('Fixed inline widths (>50px):', inlineWidths);

// Check CSS files for fixed widths or grids
const cssFiles = ['css/base.css', 'css/header.css', 'css/public.css', 'css/admin.css', 'css/drawer.css', 'css/modals.css'];
for (const file of cssFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (/(?:width|min-width):\s*(?:[3-9]\d{2,}|[1-9]\d{3,})px/i.test(line)) {
      console.log(`[${file}:${i+1}] Large fixed width:`, line.trim());
    }
  });
}
