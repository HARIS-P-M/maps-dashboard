const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'node_modules', 'pdf-parse', 'index.js');

if (fs.existsSync(targetPath)) {
  const content = fs.readFileSync(targetPath, 'utf8');
  // pdf-parse v1.1.1 has a bug where it checks `!module.parent` which is true in Next.js Turbopack,
  // causing it to try and synchronously read a test PDF that doesn't exist. We disable this.
  const patchedContent = content.replace('let isDebugMode = !module.parent;', 'let isDebugMode = false;');
  
  if (content !== patchedContent) {
    fs.writeFileSync(targetPath, patchedContent);
    console.log('Successfully patched pdf-parse@1.1.1 to disable broken debug mode in Next.js.');
  }
}
