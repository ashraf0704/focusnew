import { BasePage } from './base.page.js';

export class DashboardPage extends BasePage {
  // Selector constants
  private get bottomNav() { return '#mobile-bottom-nav'; }
  private get settingsTab() { return '#mobile-settings-nav-button'; }

  // Wait for load
  async isLoaded() {
    await this.waitForDisplayed(this.bottomNav);
  }

  // Navigate to settings tab
  async goToSettings() {
    await this.click(this.settingsTab);
  }
}
