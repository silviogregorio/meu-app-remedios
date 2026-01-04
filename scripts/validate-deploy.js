/**
 * Pre-deploy validation script
 * Runs automatically before each deploy to catch common issues
 * 
 * Checks:
 * 1. Firebase SDK version compatibility between app and Service Worker
 * 2. CSP headers include all required domains
 * 3. Required files exist
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const COLORS = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(type, message) {
    const icons = { error: '❌', warn: '⚠️', success: '✅', info: 'ℹ️' };
    const colors = { error: COLORS.red, warn: COLORS.yellow, success: COLORS.green, info: COLORS.blue };
    console.log(`${colors[type]}${icons[type]} ${message}${COLORS.reset}`);
}

let hasErrors = false;
let hasWarnings = false;

function resolvePath(relativePath) {
    return path.join(rootDir, relativePath);
}

// 1. Check Firebase version compatibility
function checkFirebaseVersion() {
    console.log('\n📦 Checking Firebase SDK compatibility...');

    const packageJson = JSON.parse(fs.readFileSync(resolvePath('package.json'), 'utf8'));
    const firebaseVersion = packageJson.dependencies?.firebase || '';
    const appVersion = firebaseVersion.replace(/[\^~]/g, '');

    const swPath = resolvePath('public/firebase-messaging-sw.js');
    if (!fs.existsSync(swPath)) {
        log('error', `Service Worker not found: public/firebase-messaging-sw.js`);
        hasErrors = true;
        return;
    }

    const swContent = fs.readFileSync(swPath, 'utf8');
    const swVersionMatch = swContent.match(/gstatic\.com\/firebasejs\/([\d.]+)\//);
    const swVersion = swVersionMatch ? swVersionMatch[1] : null;

    if (!swVersion) {
        log('warn', 'Could not detect Firebase version in Service Worker');
        hasWarnings = true;
        return;
    }

    const appMajor = parseInt(appVersion.split('.')[0]);
    const swMajor = parseInt(swVersion.split('.')[0]);

    // SW compat versions should be within 1 major version
    if (Math.abs(appMajor - swMajor) > 1) {
        log('error', `Firebase version mismatch!`);
        log('error', `  App: v${appVersion} | Service Worker: v${swVersion}`);
        log('info', `  Update firebase-messaging-sw.js to use a compatible version`);
        hasErrors = true;
    } else if (appMajor !== swMajor) {
        log('warn', `Firebase minor version difference: App v${appVersion} vs SW v${swVersion}`);
        hasWarnings = true;
    } else {
        log('success', `Firebase versions compatible: App v${appVersion} | SW v${swVersion}`);
    }
}

// 2. Check CSP headers
function checkCSPHeaders() {
    console.log('\n🔒 Checking Content Security Policy...');

    const vercelPath = resolvePath('vercel.json');
    if (!fs.existsSync(vercelPath)) {
        log('warn', 'vercel.json not found - CSP not configured');
        hasWarnings = true;
        return;
    }

    const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
    const cspHeader = vercelConfig.headers?.[0]?.headers?.find(h => h.key === 'Content-Security-Policy');

    if (!cspHeader) {
        log('warn', 'CSP header not found in vercel.json');
        hasWarnings = true;
        return;
    }

    const csp = cspHeader.value;

    // Required domains for Firebase
    const requiredScriptSrc = ['gstatic.com'];
    const requiredConnectSrc = ['supabase.co', 'gstatic.com', 'googleapis.com'];

    // Check script-src
    const scriptSrcMatch = csp.match(/script-src([^;]+)/);
    const scriptSrc = scriptSrcMatch ? scriptSrcMatch[1] : '';

    for (const domain of requiredScriptSrc) {
        if (!scriptSrc.includes(domain)) {
            log('error', `CSP script-src missing: ${domain}`);
            hasErrors = true;
        }
    }

    // Check connect-src
    const connectSrcMatch = csp.match(/connect-src([^;]+)/);
    const connectSrc = connectSrcMatch ? connectSrcMatch[1] : '';

    for (const domain of requiredConnectSrc) {
        if (!connectSrc.includes(domain)) {
            log('error', `CSP connect-src missing: ${domain}`);
            hasErrors = true;
        }
    }

    // Check worker-src
    if (!csp.includes('worker-src')) {
        log('warn', 'CSP worker-src not defined (may cause Service Worker issues)');
        hasWarnings = true;
    }

    if (!hasErrors) {
        log('success', 'CSP headers look good');
    }
}

// 3. Check required files
function checkRequiredFiles() {
    console.log('\n📁 Checking required files...');

    const requiredFiles = [
        'public/firebase-messaging-sw.js',
        'public/manifest.json',
        'vercel.json',
        'src/lib/supabase.js',
        'src/utils/firebase.js'
    ];

    let allExist = true;
    for (const file of requiredFiles) {
        if (!fs.existsSync(resolvePath(file))) {
            log('error', `Missing required file: ${file}`);
            hasErrors = true;
            allExist = false;
        }
    }

    if (allExist) {
        log('success', 'All required files present');
    }
}

// 4. Check environment variables hints
function checkEnvHints() {
    console.log('\n🔐 Checking environment configuration...');

    // Check if .env.example exists for documentation
    if (!fs.existsSync(resolvePath('.env.example')) && !fs.existsSync(resolvePath('.env.local.example'))) {
        log('warn', 'No .env.example found - ensure env vars are documented');
        hasWarnings = true;
    } else {
        log('success', 'Environment template exists');
    }
}

// Run all checks
console.log('╔════════════════════════════════════════════╗');
console.log('║     🚀 Pre-Deploy Validation Script        ║');
console.log('╚════════════════════════════════════════════╝');

checkFirebaseVersion();
checkCSPHeaders();
checkRequiredFiles();
checkEnvHints();

console.log('\n' + '═'.repeat(46));

if (hasErrors) {
    log('error', 'Validation FAILED - fix errors before deploying!');
    process.exit(1);
} else if (hasWarnings) {
    log('warn', 'Validation passed with warnings');
    process.exit(0);
} else {
    log('success', 'All checks passed! Ready to deploy 🚀');
    process.exit(0);
}
