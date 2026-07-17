export class BasePage {
  protected driver: any;

  constructor(driver: any) {
    this.driver = driver;
  }

  // Find an element using driver
  protected async findElement(selector: string) {
    if (!this.driver) return null;
    return await this.driver.$(selector);
  }

  // Click on a selector
  async click(selector: string) {
    const el = await this.findElement(selector);
    if (el) {
      await el.waitForDisplayed({ timeout: 10000 });
      await el.click();
    }
  }

  // Set input text
  async setValue(selector: string, value: string) {
    const el = await this.findElement(selector);
    if (el) {
      await el.waitForDisplayed({ timeout: 10000 });
      await el.setValue(value);
    }
  }

  // Wait for element to display
  async waitForDisplayed(selector: string, timeout = 10000) {
    const el = await this.findElement(selector);
    if (el) {
      await el.waitForDisplayed({ timeout });
    }
  }

  // Get inner text
  async getText(selector: string): Promise<string> {
    const el = await this.findElement(selector);
    if (el) {
      await el.waitForDisplayed({ timeout: 10000 });
      return await el.getText();
    }
    return '';
  }
}
