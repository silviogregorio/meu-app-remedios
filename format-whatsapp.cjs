const fs = require('fs');

const filePath = 'c:\\BKP NVMe\\DEVIAs\\remedios\\server\\index.js';
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the whatsappText line
const oldPattern = /const whatsappText = `Olá, sou \$\{patient\?\.name \|\| 'o paciente'\}\.\\n🚨 PRECISO DE AJUDA URGENTE!\\n\\nIdade: \$\{ageText \|\| 'N\/A'\}\\nTipo Sanguíneo: \$\{bloodType\}\\nTelefone: \$\{formattedPhone\}\\n\\n📍 Minha localização:\\n\$\{locationUrl \|\| 'https:\/\/sigremedios\.vercel\.app'\}`;/;

const newText = "const whatsappText = `Olá, sou ${patient?.name || 'o paciente'}.\\n_*PRECISO DE AJUDA URGENTE!*_\\n\\nIdade: ${ageText || 'N/A'}\\nTipo Sanguíneo: *${bloodType}*\\nTelefone: ${formattedPhone}\\n\\n*Minha localização:*\\n${locationUrl || 'https://sigremedios.vercel.app'}`;";

content = content.replace(oldPattern, newText);

fs.writeFileSync(filePath, content, 'utf8');

console.log('WhatsApp message formatted!');
