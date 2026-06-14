import fs from 'fs';
import path from 'path';
import https from 'https';

const publicDir = path.resolve('public');
const iconsDir = path.resolve('public', 'icons');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

async function main() {
  try {
    console.log('Downloading properly-sized PWA icons...');
    // Download 192x192 and 512x512 solid color placeholder PNGs (deep olive theme color matching theme_color #5A5A40)
    await downloadFile('https://placehold.co/192x192/5A5A40/ffffff.png?text=FB', path.join(iconsDir, 'icon-192.png'));
    await downloadFile('https://placehold.co/512x512/5A5A40/ffffff.png?text=FocusBuddy', path.join(iconsDir, 'icon-512.png'));
    console.log('PWA icons successfully generated with correct dimensions!');
  } catch (error) {
    console.error('Failed to download icons:', error.message);
  }
}

main();
