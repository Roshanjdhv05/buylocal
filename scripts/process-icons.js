import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Using the generated image from AI directory
const inputImagePath = 'C:/Users/hp/.gemini/antigravity/brain/a09cd113-71f6-4a5e-bfc8-4a7ee9c437e4/buylocal_app_icon_1775805184838.png';
const publicDir = path.resolve('public');
const iconsDir = path.join(publicDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function processIcons() {
  try {
    console.log("Processing icons using Sharp...");

    // 1024x1024 (Master)
    await sharp(inputImagePath)
      .resize(1024, 1024, { fit: 'cover' })
      .toFile(path.join(iconsDir, 'icon-1024.png'));
    console.log("Created icon-1024.png");

    // 512x512
    await sharp(inputImagePath)
      .resize(512, 512, { fit: 'cover' })
      .toFile(path.join(iconsDir, 'icon-512.png'));
    console.log("Created icon-512.png");

    // 512x512 Maskable (Android circle crop requires full bleed background, which our image already is)
    await sharp(inputImagePath)
      .resize(512, 512, { fit: 'cover' })
      .toFile(path.join(iconsDir, 'icon-512-maskable.png'));
    console.log("Created icon-512-maskable.png");

    // 192x192
    await sharp(inputImagePath)
      .resize(192, 192, { fit: 'cover' })
      .toFile(path.join(iconsDir, 'icon-192.png'));
    console.log("Created icon-192.png");

    // 64x64 Favicon (Transparent Rounded Corners Version)
    // Create an SVG mask for rounded corners
    const roundedCorners = Buffer.from(
      `<svg><rect x="0" y="0" width="64" height="64" rx="14" ry="14" /></svg>`
    );

    await sharp(inputImagePath)
      .resize(64, 64, { fit: 'cover' })
      .composite([{
        input: roundedCorners,
        blend: 'dest-in'
      }])
      .png()
      .toFile(path.join(publicDir, 'favicon.png'));
    console.log("Created rounded favicon.png of 64x64");

    // Create 32x32 standard favicon for better older browser support (optional)
    const roundedCorners32 = Buffer.from(
        `<svg><rect x="0" y="0" width="32" height="32" rx="7" ry="7" /></svg>`
    );
    await sharp(inputImagePath)
      .resize(32, 32, { fit: 'cover' })
      .composite([{
        input: roundedCorners32,
        blend: 'dest-in'
      }])
      .png()
      .toFile(path.join(publicDir, 'favicon.ico')); // saving as png, named ico for some platforms

    console.log("Done processing all icons.");

  } catch (error) {
    console.error("Error processing icons:", error);
  }
}

processIcons();
