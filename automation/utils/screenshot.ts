import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function captureScreenshot(driver: any, filename: string): Promise<string> {
  const screenshotsDir = path.resolve(__dirname, '../screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const targetPath = path.join(screenshotsDir, filename);

  try {
    if (driver) {
      const screenshot = await driver.takeScreenshot();
      fs.writeFileSync(targetPath, screenshot, 'base64');
      return targetPath;
    } else {
      // Mock screenshot generation if running without emulator
      fs.writeFileSync(targetPath, 'MOCK SCREENSHOT BUFFER CONTENT');
      return targetPath;
    }
  } catch (err) {
    console.error(`Failed to capture screenshot ${filename}:`, err);
    // Write placeholder on failure
    fs.writeFileSync(targetPath, 'PLACEHOLDER CONTENT ON FAILURE');
    return targetPath;
  }
}
