const fs = require('fs');
const path = require('path');

// Create a simple script to generate icons using canvas or fallback
const sizes = [
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' }
];

// Try using sharp if available
try {
  const sharp = require('sharp');
  const inputPath = path.join(__dirname, '../public/logo.jpg');
  
  Promise.all(sizes.map(({ size, name }) => {
    const outputPath = path.join(__dirname, '../public', name);
    return sharp(inputPath)
      .resize(size, size, { fit: 'contain', background: { r: 29, g: 11, b: 62, alpha: 1 } })
      .png()
      .toFile(outputPath)
      .then(() => console.log(`✅ Generated ${name}`))
      .catch(err => console.error(`❌ Error generating ${name}:`, err));
  }))
  .then(() => console.log('✅ All icons generated successfully!'))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
} catch (err) {
  console.log('⚠️ Sharp not available, installing...');
  const { execSync } = require('child_process');
  execSync('npm install sharp --save-dev', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('✅ Sharp installed, please run this script again');
}
