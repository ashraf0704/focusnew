import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const appiumCapabilities = {
  platformName: 'Android',
  'appium:deviceName': 'Nexus_6_API_34',
  'appium:automationName': 'UiAutomator2',
  'appium:app': path.resolve(__dirname, '../../focus-buddy-native/android/app/build/outputs/apk/debug/app-debug.apk'),
  'appium:autoGrantPermissions': true,
  'appium:newCommandTimeout': 300,
  'appium:gpsEnabled': true,
  'appium:ensureWebviewsHavePages': true,
  'appium:nativeWebScreenshot': true,
  'appium:connectHardwareKeyboard': true
};
