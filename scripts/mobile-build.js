const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("🚀 Starting Mobile Static Build...");

const apiFolder = path.join(__dirname, '../src/app/api');
const authFolder = path.join(__dirname, '../src/app/auth');
const tempApi = path.join(__dirname, '../temp_api_backup');
const tempAuth = path.join(__dirname, '../temp_auth_backup');

let apiMoved = false;
let authMoved = false;

// Helper: copy directory recursively (avoids rename EPERM on Windows)
function copyDirSync(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Helper: remove directory recursively
function removeDirSync(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

// Clean up any leftover temp folders from a previous failed run
removeDirSync(tempApi);
removeDirSync(tempAuth);

try {
    if (fs.existsSync(apiFolder)) {
        console.log("📦 Backing up api folder...");
        copyDirSync(apiFolder, tempApi);
        removeDirSync(apiFolder);
        apiMoved = true;
        console.log("✅ api folder backed up.");
    }

    if (fs.existsSync(authFolder)) {
        console.log("📦 Backing up auth folder...");
        copyDirSync(authFolder, tempAuth);
        removeDirSync(authFolder);
        authMoved = true;
        console.log("✅ auth folder backed up.");
    }

    console.log("🔨 Running next build with IS_STATIC=true...");
    execSync('npx next build', {
        stdio: 'inherit',
        env: { ...process.env, IS_STATIC: 'true' }
    });
    console.log("✅ Static build complete!");

} catch (error) {
    console.error("❌ Build failed:", error.message);
    process.exitCode = 1;
} finally {
    // Always restore folders
    if (apiMoved && fs.existsSync(tempApi)) {
        console.log("🔄 Restoring api folder...");
        removeDirSync(apiFolder); // clean if partially written
        copyDirSync(tempApi, apiFolder);
        removeDirSync(tempApi);
        console.log("✅ api folder restored.");
    }
    if (authMoved && fs.existsSync(tempAuth)) {
        console.log("🔄 Restoring auth folder...");
        removeDirSync(authFolder);
        copyDirSync(tempAuth, authFolder);
        removeDirSync(tempAuth);
        console.log("✅ auth folder restored.");
    }

    if (process.exitCode === 1) {
        console.error("❌ Build failed. Folders have been restored.");
        process.exit(1);
    }
}
