#!/usr/bin/env node
// ============================================================
// DevMobile Simulator — Build Script
// Copies src/ → dist/ (ready to load in Chrome)
// Usage: node build.js
// ============================================================

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const DIST = path.join(__dirname, 'dist');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Clean dist
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
fs.mkdirSync(DIST, { recursive: true });

// Copy all src files
copyDir(SRC, DIST);

console.log('✅ Build complete! Load the "dist/" folder in Chrome:');
console.log('   chrome://extensions → Developer mode → Load unpacked → select dist/');
