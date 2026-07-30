const fs = require('fs');
const ledger = fs.readFileSync('.ai/FEATURE_LEDGER.md', 'utf8');
console.log('Ledger lines:', ledger.split('\n').length);
