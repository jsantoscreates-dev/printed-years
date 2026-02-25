/**
 * Generate thumbnails from full-size poster images
 *
 * Usage: node scripts/generate-thumbnails.js
 *
 * Reads images from: public/posters/full/
 * Writes thumbnails to: public/posters/thumb/
 *
 * - Preserves original aspect ratio
 * - Max dimension: 512px (width or height, whichever is larger)
 * - Supports: JPG, PNG, WebP
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('Error: sharp is not installed.');
  console.error('Run: npm install -D sharp');
  process.exit(1);
}

const FULL_DIR = path.join(__dirname, '../public/posters/full');
const THUMB_DIR = path.join(__dirname, '../public/posters/thumb');
const MAX_DIMENSION = 800; // Larger thumbnails for better quality

async function generateThumbnails() {
  // Ensure directories exist
  if (!fs.existsSync(FULL_DIR)) {
    console.log(`Creating ${FULL_DIR}`);
    fs.mkdirSync(FULL_DIR, { recursive: true });
  }

  if (!fs.existsSync(THUMB_DIR)) {
    console.log(`Creating ${THUMB_DIR}`);
    fs.mkdirSync(THUMB_DIR, { recursive: true });
  }

  // Get all image files
  const files = fs.readdirSync(FULL_DIR).filter(file =>
    /\.(jpg|jpeg|png|webp)$/i.test(file)
  );

  if (files.length === 0) {
    console.log('No images found in public/posters/full/');
    console.log('Add your poster images there and run this script again.');
    return;
  }

  console.log(`Found ${files.length} images to process...\n`);

  for (const file of files) {
    const inputPath = path.join(FULL_DIR, file);
    const baseName = path.basename(file, path.extname(file));
    const outputPath = path.join(THUMB_DIR, `${baseName}.jpg`);

    try {
      // Get original dimensions
      const metadata = await sharp(inputPath).metadata();
      const { width, height } = metadata;

      // Calculate new dimensions preserving aspect ratio
      let newWidth, newHeight;
      if (width > height) {
        // Landscape or square
        newWidth = Math.min(width, MAX_DIMENSION);
        newHeight = Math.round((newWidth / width) * height);
      } else {
        // Portrait
        newHeight = Math.min(height, MAX_DIMENSION);
        newWidth = Math.round((newHeight / height) * width);
      }

      await sharp(inputPath, { failOnError: false })
        .withMetadata() // Preserve color profile
        .resize(newWidth, newHeight, {
          fit: 'inside',
          withoutEnlargement: true,
          kernel: sharp.kernel.lanczos3,
        })
        .jpeg({
          quality: 100,
          chromaSubsampling: '4:4:4',
          force: false // Keep original format characteristics
        })
        .toFile(outputPath);

      const ratio = (width / height).toFixed(2);
      console.log(`✓ ${file} → ${newWidth}×${newHeight} (${ratio}:1)`);
    } catch (err) {
      console.error(`✗ ${file}: ${err.message}`);
    }
  }

  console.log('\nDone! Thumbnails saved to public/posters/thumb/');
}

generateThumbnails().catch(console.error);
