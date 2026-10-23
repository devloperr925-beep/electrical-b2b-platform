const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const templatePath = path.join(rootDir, 'index.template.html');
const outputPath = path.join(rootDir, 'index.html');

console.log('Compiling HTML components into index.html...');

let template = fs.readFileSync(templatePath, 'utf8');

const includeRegex = /\{\{include:([^}]+)\}\}/g;
let match;
let missingFiles = [];

const result = template.replace(includeRegex, (fullMatch, relativePath) => {
  const filePath = path.join(rootDir, relativePath.trim());
  if (!fs.existsSync(filePath)) {
    missingFiles.push(relativePath.trim());
    console.error(`Error: File not found: ${filePath}`);
    return `<!-- MISSING COMPONENT: ${relativePath.trim()} -->`;
  }
  return fs.readFileSync(filePath, 'utf8').trimEnd();
});

if (missingFiles.length > 0) {
  console.error(`Build failed with ${missingFiles.length} missing components!`);
  process.exit(1);
}

fs.writeFileSync(outputPath, result, 'utf8');
console.log(`Successfully compiled index.html (${result.length} bytes, ${result.split('\n').length} lines) from modular components!`);

// Bundle modular CSS files into a single unified css/bundle.css
console.log('Bundling modular CSS into css/bundle.css...');
const cssOrder = [
  'css/variables.css',
  'css/base.css',
  'css/header.css',
  'css/public.css',
  'css/drawer.css',
  'css/modals.css',
  'css/admin.css'
];

let bundledCss = '/* Unified Production Stylesheet for Apex Electro B2B Platform */\n';
cssOrder.forEach(file => {
  const fullPath = path.join(rootDir, file);
  if (fs.existsSync(fullPath)) {
    bundledCss += `\n/* --- ${file} --- */\n` + fs.readFileSync(fullPath, 'utf8') + '\n';
  }
});

const bundlePath = path.join(rootDir, 'css', 'bundle.css');
fs.writeFileSync(bundlePath, bundledCss, 'utf8');
console.log(`Successfully generated css/bundle.css (${bundledCss.length} bytes, ${bundledCss.split('\n').length} lines)!`);
