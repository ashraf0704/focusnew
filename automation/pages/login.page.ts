import { BasePage } from './base.page.js';

export class LoginPage extends BasePage {
  // Selector constants
  private get guestButton() { return '#guest-signin-button'; }
  private get emailInput() { return '#sign-in-email'; }
  private get passwordInput() { return '#sign-in-password'; }
  private get submitButton() { return '#auth-submit-button'; }

  // Guest sign-in flow
  async continueAsGuest() {
    await this.click(this.guestButton);
  }

  // Regular login flow
  async login(email: string, pass: string) {
    await this.setValue(this.emailInput, email);
    await this.setValue(this.passwordInput, pass);
    await this.click(this.submitButton);
  }
}
