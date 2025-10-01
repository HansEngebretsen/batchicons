const fs = require('fs');
const path = require('path');

const iconsFilePath = path.join(__dirname, 'icons.json');
const baseSvgDir = path.join(__dirname, 'material-symbols', 'svg');

try {
    // --- Read Metadata ---
    const iconsJsonRaw = fs.readFileSync(iconsFilePath, 'utf8');
    const jsonStart = iconsJsonRaw.indexOf('{');
    const iconsJsonData = iconsJsonRaw.substring(jsonStart);
    const iconsData = JSON.parse(iconsJsonData);
    const metadataIconNames = new Set(iconsData.icons.map(icon => icon.name));
    console.log(`Found ${metadataIconNames.size} unique icon names in metadata (icons.json).`);

    // --- Read Local SVGs ---
    const localSvgNames = new Set();
    const weightDirs = fs.readdirSync(baseSvgDir).filter(d => !isNaN(parseInt(d)));

    for (const weight of weightDirs) {
        const styleDirs = fs.readdirSync(path.join(baseSvgDir, weight));
        for (const style of styleDirs) {
            const svgFilesPath = path.join(baseSvgDir, weight, style);
            if (fs.statSync(svgFilesPath).isDirectory()) {
                const svgFiles = fs.readdirSync(svgFilesPath).filter(f => f.endsWith('.svg'));
                for (const svgFile of svgFiles) {
                    const iconName = path.basename(svgFile, '.svg');
                    localSvgNames.add(iconName);
                }
            }
        }
    }
    console.log(`Found ${localSvgNames.size} unique SVG files in material-symbols/svg.`);

    // --- Compare the sets ---
    let metadataMissingCount = 0;
    for (const name of localSvgNames) {
        if (!metadataIconNames.has(name)) {
            metadataMissingCount++;
        }
    }
    console.log(`
${metadataMissingCount} SVGs are present locally but are NOT in the metadata file.`);

    let localFileMissingCount = 0;
    for (const name of metadataIconNames) {
        if (!localSvgNames.has(name)) {
            localFileMissingCount++;
        }
    }
    console.log(`${localFileMissingCount} icons are in the metadata file but do NOT have a corresponding SVG locally.`);

    console.log(`
This means the overlap is ${localSvgNames.size - metadataMissingCount} icons.`);


} catch (err) {
    console.error('An error occurred during diagnosis:', err);
}
