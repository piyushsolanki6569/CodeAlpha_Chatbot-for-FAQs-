import fs from 'node:fs';
const content = fs.readFileSync('FAQ-Chatbot/faqs.json', 'utf8');
fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/faqs.json', content);
fs.writeFileSync('faqs.json', content);
console.log('Synchronized faqs.json to root and src/data/faqs.json');
