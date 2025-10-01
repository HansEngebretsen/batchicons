const fs = require('fs');
const path = require('path');

const iconsFilePath = path.join(__dirname, 'icons.json');
const baseSvgDir = path.join(__dirname, 'material-symbols', 'svg');
const outputDir = path.join(__dirname, 'processed-icons');
const manifestFilePath = path.join(__dirname, 'manifest.json');

// Clean up old processed files
if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir);

try {
    // --- Read Metadata for Tags ---
    const iconsJsonRaw = fs.readFileSync(iconsFilePath, 'utf8');
    const jsonStart = iconsJsonRaw.indexOf('{');
    const iconsJsonData = iconsJsonRaw.substring(jsonStart);
    const iconsData = JSON.parse(iconsJsonData);
    const tagMap = new Map(iconsData.icons.map(icon => [icon.name, icon.tags || []]));
    console.log(`Loaded metadata with tags for ${tagMap.size} icons.`);

    // --- Process All Local SVG Files ---
    const iconManifest = [];
    const processedIcons = new Set();

    const weightDirs = fs.readdirSync(baseSvgDir).filter(d => !isNaN(parseInt(d)));

    for (const weight of weightDirs) {
        const styleDirs = fs.readdirSync(path.join(baseSvgDir, weight));
        for (const style of styleDirs) {
            const stylePath = path.join(baseSvgDir, weight, style);
            if (fs.statSync(stylePath).isDirectory()) {
                const svgFiles = fs.readdirSync(stylePath).filter(f => f.endsWith('.svg'));

                for (const svgFile of svgFiles) {
                    const iconName = path.basename(svgFile, '.svg');

                    // Add to main manifest only once
                    if (!processedIcons.has(iconName)) {
                        iconManifest.push({
                            name: iconName,
                            tags: tagMap.get(iconName) || []
                        });
                        processedIcons.add(iconName);
                    }

                    // Create structured directory and save the specific SVG content
                    const outputIconDir = path.join(outputDir, weight, style);
                    if (!fs.existsSync(outputIconDir)) {
                        fs.mkdirSync(outputIconDir, { recursive: true });
                    }
                    
                    const svgContent = fs.readFileSync(path.join(stylePath, svgFile), 'utf8');
                    const iconData = {
                        name: iconName,
                        tags: tagMap.get(iconName) || [],
                        content: svgContent
                    };
                    
                    const outputJsonPath = path.join(outputIconDir, `${iconName}.json`);
                    fs.writeFileSync(outputJsonPath, JSON.stringify(iconData, null, 2), 'utf8');
                }
            }
        }
    }

    // Sort manifest alphabetically for consistency
    iconManifest.sort((a, b) => a.name.localeCompare(b.name));
    fs.writeFileSync(manifestFilePath, JSON.stringify(iconManifest, null, 2), 'utf8');

    console.log(`Successfully processed ${processedIcons.size} unique icons across all styles/weights.`);

} catch (err) {
    console.error('An error occurred during processing:', err);
}