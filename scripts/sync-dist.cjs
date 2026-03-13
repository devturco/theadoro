const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const sourceDist = path.join(rootDir, 'apps', 'web', 'dist');
const targetDist = path.join(rootDir, 'dist');

console.log('[sync-dist] Starting synchronization...');

// 1. Check if source exists
if (!fs.existsSync(sourceDist)) {
  console.error(`[sync-dist] ❌ Source directory not found: ${sourceDist}`);
  process.exit(1);
}

// 2. Clean/Create target directory
if (fs.existsSync(targetDist)) {
  console.log('[sync-dist] Cleaning existing root dist...');
  fs.rmSync(targetDist, { recursive: true, force: true });
}

// 3. Copy files (using native command for speed on Linux/Hostinger)
try {
  if (process.platform === 'win32') {
    // Windows fallback
    execSync(`xcopy "${sourceDist}" "${targetDist}" /E /I /Y`, { stdio: 'inherit' });
  } else {
    // Linux/Hostinger (Standard cp)
    execSync(`cp -r "${sourceDist}" "${targetDist}"`, { stdio: 'inherit' });
  }
  console.log(`[sync-dist] ✅ Successfully synced build files to root /dist`);
} catch (error) {
  console.error('[sync-dist] ❌ Error copying files:', error.message);
  process.exit(1);
}
