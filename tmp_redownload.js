const fs = require('fs');
const https = require('https');
const path = require('path');

const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => file.close(resolve));
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
};

async function start() {
    const dir = path.join(process.cwd(), 'public', 'assets', 'eril-disil');
    for (let i = 1; i <= 54; i++) {
        const urlNum = String(i).padStart(3, '0'); // Remote needs 001
        const localNum = String(i).padStart(2, '0'); // You want 01

        const url = `https://sevilayericdem.com/_next/image?url=%2Feril-disil%2Feril_web%2FEril_enerji_diyorki_${urlNum}.jpg&w=1920&q=75`;
        const dest = path.join(dir, `${localNum}.jpg`);

        try {
            process.stdout.write(`Downloading ${urlNum} as ${localNum}.jpg... `);
            await download(url, dest);
            console.log('OK');
        } catch (err) {
            console.log(`Error: ${err.message}`);
        }
    }
}
start();
