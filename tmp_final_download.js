const fs = require('fs');
const https = require('https');
const path = require('path');

const download = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                resolve(response);
            } else {
                reject(new Error(response.statusCode));
            }
        }).on('error', reject);
    });
};

async function start() {
    const dir = path.join(process.cwd(), 'public', 'assets', 'eril-disil');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    for (let i = 1; i <= 54; i++) {
        const localName = String(i).padStart(2, '0');
        const formats = [String(i).padStart(3, '0'), String(i).padStart(2, '0')];
        let success = false;

        for (let fmt of formats) {
            const url = `https://sevilayericdem.com/_next/image?url=%2Feril-disil%2Feril_web%2FEril_enerji_diyorki_${fmt}.jpg&w=1920&q=75`;
            try {
                const stream = await download(url);
                const file = fs.createWriteStream(path.join(dir, `${localName}.jpg`));
                stream.pipe(file);
                await new Promise(r => file.on('finish', r));
                console.log(`Saved ${localName}.jpg (using remote fmt ${fmt})`);
                success = true;
                break;
            } catch (e) {
                // Try next format
            }
        }
        if (!success) console.log(`Could not find file for ${localName}`);
    }
}
start();
