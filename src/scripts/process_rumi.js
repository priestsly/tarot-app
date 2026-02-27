const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const inputDir = 'C:\\Users\\sLyGhosT\\tarot\\public\\assets\\rumi_originals'; // We should use originals if possible, or re-process existing
const outputDir = 'C:\\Users\\sLyGhosT\\tarot\\public\\assets\\rumi_optimized';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

async function processImages() {
    try {
        const files = fs.readdirSync(inputDir).filter(file => file.endsWith('.jpg') || file.endsWith('.png'));
        console.log(`Found ${files.length} files. Starting optimization...`);

        for (const file of files) {
            const inputPath = path.join(inputDir, file);
            const fileName = path.parse(file).name;
            const outputPath = path.join(outputDir, `${fileName}.webp`);

            // Precision optimization pass
            const image = sharp(inputPath);
            const metadata = await image.metadata();

            await image
                .trim({ threshold: 100 })
                .resize({ height: 700 }) // Balanced height for mobile/web
                .webp({ quality: 80, effort: 6 }) // Efficient WebP compression
                .toFile(outputPath);

            console.log(`✅ Optimized (WebP): ${fileName}`);
        }
        console.log('Done! All images compressed.');
    } catch (err) {
        console.error('Error:', err);
    }
}

processImages();
