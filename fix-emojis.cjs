const fs = require('fs');

// Read file
const filePath = 'c:\\BKP NVMe\\DEVIAs\\remedios\\server\\index.js';
let content = fs.readFileSync(filePath, 'utf8');

// Replace broken emoji escapes with real emojis
content = content.replace(/\\\\uD83D\\\\uDEA8/g, '🚨');
content = content.replace(/\\\\uD83D\\\\uDCCD/g, '📍');

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Emojis fixed!');
