/**
 * Optimize full-size poster images
 *
 * Usage: node scripts/optimize-images.js
 *
 * - Reduces file size without visible quality loss
 * - Strips unnecessary metadata
 * - Preserves original dimensions
 */

const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('Error: sharp is not installed.');
  console.error('Run: npm install -D sharp');
  process.exit(1);
}

const FULL_DIR = path.join(__dirname, '../public/posters/full');
const QUALITY = 95; // Very high quality, preserve appearance

async function optimizeImages() {
  const files = fs.readdirSync(FULL_DIR).filter(file =>
    /\.(jpg|jpeg|png|webp)$/i.test(file)
  );

  if (files.length === 0) {
    console.log('No images found.');
    return;
  }

  console.log(`Optimizing ${files.length} images...\n`);

  let totalOriginal = 0;
  let totalOptimized = 0;

  for (const file of files) {
    const inputPath = path.join(FULL_DIR, file);
    const tempPath = path.join(FULL_DIR, `_temp_${file}`);

    try {
      const originalStats = fs.statSync(inputPath);
      const originalSize = originalStats.size;
      totalOriginal += originalSize;

      // Optimize the image
      await sharp(inputPath)
        .jpeg({
          quality: QUALITY,
          mozjpeg: false, // Disabled to preserve original appearance
        })
        .toFile(tempPath);

      const optimizedStats = fs.statSync(tempPath);
      const optimizedSize = optimizedStats.size;

      // Only replace if the optimized version is smaller
      if (optimizedSize < originalSize) {
        fs.unlinkSync(inputPath);
        fs.renameSync(tempPath, inputPath);
        totalOptimized += optimizedSize;

        const saved = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
        const origKB = (originalSize / 1024).toFixed(0);
        const newKB = (optimizedSize / 1024).toFixed(0);
        console.log(`✓ ${file}: ${origKB}KB → ${newKB}KB (-${saved}%)`);
      } else {
        // Keep original if it's already optimal
        fs.unlinkSync(tempPath);
        totalOptimized += originalSize;
        console.log(`○ ${file}: already optimal`);
      }
    } catch (err) {
      // Clean up temp file if it exists
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      console.error(`✗ ${file}: ${err.message}`);
    }
  }

  const totalSavedMB = ((totalOriginal - totalOptimized) / 1024 / 1024).toFixed(2);
  const totalSavedPercent = ((1 - totalOptimized / totalOriginal) * 100).toFixed(1);

  console.log('\n─────────────────────────────────────');
  console.log(`Total saved: ${totalSavedMB}MB (${totalSavedPercent}%)`);
  console.log(`Original: ${(totalOriginal / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Optimized: ${(totalOptimized / 1024 / 1024).toFixed(2)}MB`);
}

optimizeImages().catch(console.error);
