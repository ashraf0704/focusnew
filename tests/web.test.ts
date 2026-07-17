import { Builder, By, until } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';

async function runWebTest() {
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
    console.log('Navigating to Web application at http://localhost:3000...');
    await driver.get('http://localhost:3000');

    // Wait for the page title or guest sign-in button
    console.log('Waiting for welcome screen elements to load...');
    const guestButton = await driver.wait(
      until.elementLocated(By.id('guest-signin-button')),
      20000
    );

    console.log('Guest sign-in button found. Clicking it...');
    await guestButton.click();

    // Verify loading state or immediate dashboard load
    console.log('Waiting for Main Central Interface or Dashboard to load...');
    await driver.wait(
      until.elementLocated(By.css('main')),
      20000
    );

    console.log('Checking bottom navigation bar...');
    const nav = await driver.findElement(By.id('mobile-bottom-nav'));
    if (nav) {
      console.log('Navigation bar is present.');
    }

    console.log('Web E2E login/guest flow verified successfully!');
  } catch (err) {
    console.error('Web test failed with error:', err);
    process.exit(1);
  } finally {
    await driver.quit();
  }
}

runWebTest();
