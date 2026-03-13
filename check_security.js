const fs = require('fs');
const path = require('path');

const PROJECT_DIR = 'e:/Repo/GitHub/food-diabetes-app';
const FORBIDDEN_KEY_PATTERN = /AIzaSy[A-Za-z0-9_-]{33}/;

console.log("🛡️ Starting Security Check for Hardcoded API Keys...");

function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    let violations = 0;

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.expo' && file !== '.git') {
                violations += scanDirectory(fullPath);
            }
        } else if (file === 'App.js' || file === 'logic.js' || file.endsWith('.js')) {
            // Skip .env files as they are MEANT to have keys
            if (file === '.env') return;

            const content = fs.readFileSync(fullPath, 'utf8');
            if (FORBIDDEN_KEY_PATTERN.test(content)) {
                console.error(`❌ SECURITY VIOLATION: Hardcoded key pattern found in ${fullPath}`);
                violations++;
            }
        }
    });

    return violations;
}

const totalViolations = scanDirectory(PROJECT_DIR);

if (totalViolations === 0) {
    console.log("✅ PASS: No hardcoded Google API keys detected in source files.");
    process.exit(0);
} else {
    console.error(`\n📊 FAILED: ${totalViolations} security violations found.`);
    process.exit(1);
}
