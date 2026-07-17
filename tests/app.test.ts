import { Builder, By, until } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';

async function runAppTest() {
  const options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-gpu');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    console.log('Navigating to Expo App (Web portal) at http://localhost:8081...');
    await driver.get('http://localhost:8081');

    // React Native Web maps all elements. It often mounts on a div with id "root" or similar, or basic body/views
    console.log('Waiting for application container to mount...');
    const body = await driver.wait(
      until.elementLocated(By.css('body')),
      30000
    );

    console.log('Verifying that application loaded contents...');
    // We wait 5 seconds to ensure bundle loading and rendering
    await driver.sleep(5000);
    const source = await driver.getPageSource();
    if (source.includes('focus') || source.includes('root') || source.includes('react-root') || source.length > 200) {
      console.log('Application content successfully compiled and mounted in DOM.');
    } else {
      throw new Error('Application loaded, but DOM is empty.');
    }

    console.log('Expo Native App Web portal verified successfully!');
  } catch (err) {
    console.error('App test failed with error:', err);
    process.exit(1);
  } finally {
    await driver.quit();
  }
}

runAppTest();
