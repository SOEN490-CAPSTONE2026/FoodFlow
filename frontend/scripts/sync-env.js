const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const frontendRoot = path.resolve(__dirname, '..');

const candidateNames = ['.ENV', '.env'];
const sourcePath = candidateNames
  .map(name => path.join(repoRoot, name))
  .find(candidate => fs.existsSync(candidate));

if (!sourcePath) {
  console.warn('[sync-env] No .ENV or .env found in repo root. Skipping.');
  process.exit(0);
}

const destPath = path.join(frontendRoot, '.env');
fs.copyFileSync(sourcePath, destPath);
console.log(`[sync-env] Copied ${path.basename(sourcePath)} -> frontend/.env`);
