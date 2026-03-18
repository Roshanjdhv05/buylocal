const fs = require('fs');
const path = require('path');

const locales = ['en.json', 'hi.json', 'mr.json'];
const localeDir = path.join(__dirname, 'src', 'locales');

locales.forEach(file => {
    const filePath = path.join(localeDir, file);
    if (!fs.existsSync(filePath)) {
        console.error(`ERROR: ${file} does not exist at ${filePath}`);
        return;
    }
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        JSON.parse(content);
        console.log(`OK: ${file} is valid JSON`);
    } catch (e) {
        console.error(`FAIL: ${file} has invalid JSON: ${e.message}`);
    }
});
