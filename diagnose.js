const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'manifest.json');

const readStream = fs.createReadStream(manifestPath, { encoding: 'utf8' });

let outlinedCount = 0;
let filledCount = 0;
let totalCount = 0;
let buffer = '';

readStream.on('data', (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop();

    lines.forEach(line => {
        if (line.includes('"name":')) {
            totalCount++;
            if (line.includes('-fill"')) {
                filledCount++;
            } else {
                outlinedCount++;
            }
        }
    });
});

readStream.on('end', () => {
    // Process the remaining buffer
    if (buffer.includes('"name":')) {
        totalCount++;
        if (buffer.includes('-fill"')) {
            filledCount++;
        } else {
            outlinedCount++;
        }
    }

    console.log(`Total icons: ${totalCount}`);
    console.log(`Outlined icons: ${outlinedCount}`);
    console.log(`Filled icons: ${filledCount}`);
});

readStream.on('error', (err) => {
    console.error('Error reading manifest.json:', err);
});