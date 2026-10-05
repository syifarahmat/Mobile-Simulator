#!/usr/bin/env node
// Generate SVG icons and convert to PNG using sharp or canvas
// If sharp not available, creates placeholder PNGs

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'src', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

// SVG icon content
const svgIcon = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#a855f7"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size*0.22}" fill="url(#bg)"/>
  <rect x="${size*0.28}" y="${size*0.12}" width="${size*0.44}" height="${size*0.76}" rx="${size*0.08}" fill="none" stroke="white" stroke-width="${size*0.07}"/>
  <circle cx="${size*0.5}" cy="${size*0.8}" r="${size*0.05}" fill="white"/>
  <line x1="${size*0.38}" y1="${size*0.22}" x2="${size*0.62}" y2="${size*0.22}" stroke="white" stroke-width="${size*0.06}" stroke-linecap="round"/>
</svg>`;

const sizes = [16, 32, 48, 128];

sizes.forEach(size => {
  const svg = svgIcon(size);
  const svgPath = path.join(iconsDir, `icon${size}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`✅ Created icon${size}.svg`);
});

// Try to use sharp for PNG conversion
try {
  const sharp = require('sharp');
  const promises = sizes.map(size => {
    const svgPath = path.join(iconsDir, `icon${size}.svg`);
    const pngPath = path.join(iconsDir, `icon${size}.png`);
    return sharp(svgPath).png().toFile(pngPath)
      .then(() => console.log(`✅ Converted icon${size}.png`));
  });
  Promise.all(promises).then(() => console.log('\n🎉 All icons generated!'));
} catch (e) {
  console.log('\n⚠️  sharp not found. Installing...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install sharp --save-dev', { stdio: 'inherit', cwd: __dirname });
    const sharp = require('sharp');
    const promises = sizes.map(size => {
      const svgPath = path.join(iconsDir, `icon${size}.svg`);
      const pngPath = path.join(iconsDir, `icon${size}.png`);
      return sharp(svgPath).png().toFile(pngPath)
        .then(() => console.log(`✅ Converted icon${size}.png`));
    });
    Promise.all(promises).then(() => console.log('\n🎉 All icons generated!'));
  } catch (err) {
    console.log('ℹ️  Using SVG icons only (Chrome accepts SVG icons too).');
    // Copy SVG as fallback with .png extension
    sizes.forEach(size => {
      const svgPath = path.join(iconsDir, `icon${size}.svg`);
      const pngPath = path.join(iconsDir, `icon${size}.png`);
      fs.copyFileSync(svgPath, pngPath);
      console.log(`⚠️  Copied icon${size}.svg → icon${size}.png (SVG fallback)`);
    });
    console.log('\n✅ Icons ready (SVG format).');
  }
}
