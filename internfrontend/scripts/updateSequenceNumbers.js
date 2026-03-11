const fs = require('fs');
const path = 'src/components/swiftMessages.json';

// Read the JSON file
let data = JSON.parse(fs.readFileSync(path, 'utf8'));

// Add unique sequenceNumber to each record and remove sequenceFrom/sequenceTo
data.forEach((item, index) => {
  delete item.sequenceFrom;
  delete item.sequenceTo;
  item.sequenceNumber = index + 1;
});

// Write back to file with proper formatting
fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');

console.log(`Updated ${data.length} records with unique sequenceNumber values`);
console.log('Removed sequenceFrom and sequenceTo fields');
