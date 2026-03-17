const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("🚀 Starting Mobile Static Build...");

const apiFolder = path.join(__dirname, '../src/app/api');
const authFolder = path.join(__dirname, '../src/app/auth');
const tempApi = path.join(__dirname, '../temp_api');
const tempAuth = path.join(__dirname, '../temp_auth');

let apiMoved = false;
let authMoved = false;

try {
    if (fs.existsSync(apiFolder)) {
        console.log("Moving api folder to temp...");
        fs.renameSync(apiFolder, tempApi);
        apiMoved = true;
    }
    if (fs.existsSync(authFolder)) {
        console.log("Moving auth folder to temp...");
        fs.renameSync(authFolder, tempAuth);
        authMoved = true;
    }

    console.log("Running next build with IS_STATIC=true...");
    process.env.IS_STATIC = 'true';
    execSync('npx next build', { stdio: 'inherit' });
    console.log("✅ Static build complete!");

} catch (error) {
    console.error("❌ Build failed:", error.message);
    process.exit(1);
} finally {
    if (apiMoved) {
        console.log("Restoring api folder...");
        if (fs.existsSync(apiFolder)) {
            // Already exists? something went wrong. Let's merge or skip.
            console.log("Api folder already exists, move back failed.");
        } else {
            fs.renameSync(tempApi, apiFolder);
        }
    }
    if (authMoved) {
        console.log("Restoring auth folder...");
        if (fs.existsSync(authFolder)) {
            console.log("Auth folder already exists, move back failed.");
        } else {
            fs.renameSync(tempAuth, authFolder);
        }
    }
}
