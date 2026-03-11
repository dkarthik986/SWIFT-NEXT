const fs = require('fs');
const path = 'src/components/swiftMessages.json';
let text = fs.readFileSync(path, 'utf8');
// Use a case-insensitive replacement for 'multiformat' while keeping surrounding quote groups
// Perform a case-insensitive replacement for 'multiformat' while keeping surrounding quote groups
const replaced = text.replace(/("format"\s*:\s*")multiformat(")/gi, '$1ALL-MT&MX$2');
const count = (text.match(/("format"\s*:\s*")multiformat(")/gi) || []).length;
if (count === 0) {
  console.log('No occurrences found; no changes made.');
} else {
  fs.writeFileSync(path, replaced, 'utf8');
  console.log(`Replaced ${count} occurrence(s) of MultiFormat in ${path}`);
}
