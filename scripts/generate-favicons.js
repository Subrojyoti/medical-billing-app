const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const sizes = {
  'favicon-16x16.png': 16,
  'favicon-32x32.png': 32,
  'favicon-48x48.png': 48,
  'apple-touch-icon.png': 180,
  'android-chrome-192x192.png': 192,
  'android-chrome-512x512.png': 512
};

async function generateFavicons() {
  const sourceLogo = path.join(__dirname, '../public/ABSOLUTE_PROSTHETICS_AND_ORTHOTICS_logo.png');
  const outputDir = path.join(__dirname, '../public');

  try {
    // Generate each size
    for (const [filename, size] of Object.entries(sizes)) {
      await sharp(sourceLogo)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .toFile(path.join(outputDir, filename));
      console.log(`Generated ${filename}`);
    }

    // Generate favicon.ico (16x16 and 32x32 combined)
    const favicon16 = await sharp(sourceLogo)
      .resize(16, 16, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toBuffer();

    const favicon32 = await sharp(sourceLogo)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toBuffer();

    // Note: Generating .ico files requires additional libraries
    // For now, we'll just copy the 32x32 version as favicon.ico
    await fs.copyFile(
      path.join(outputDir, 'favicon-32x32.png'),
      path.join(outputDir, 'favicon.ico')
    );
    console.log('Generated favicon.ico');

    // Generate Safari pinned tab SVG
    await sharp(sourceLogo)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(path.join(outputDir, 'safari-pinned-tab.svg'));
    console.log('Generated safari-pinned-tab.svg');

    console.log('All favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

generateFavicons(); 