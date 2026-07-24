/**
 * Background & System Notifications Engine
 * Handles HTML5 Page Visibility API and System Desktop Notifications when tab runs in background.
 */

class BackgroundManager {
  constructor() {
    this.isTabHidden = document.hidden;
    this.notificationPermission = 'default';

    this.initListeners();
    this.requestPermissions();
  }

  initListeners() {
    document.addEventListener('visibilitychange', () => {
      this.isTabHidden = document.hidden;
    });
  }

  requestPermissions() {
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission;
      if (this.notificationPermission === 'default') {
        Notification.requestPermission().then(perm => {
          this.notificationPermission = perm;
        });
      }
    }
  }

  /**
   * Sends desktop notification if app is in background or permission granted
   */
  sendDesktopWarning(title, body, tag = 'alarm-warning') {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body: body,
          tag: tag,
          renotify: true,
          requireInteraction: true,
          icon: 'https://cdn.lineicons.com/4.0/lineicons.svg'
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (e) {
        console.warn('Desktop notification error:', e);
      }
    }
  }
}

window.bgManager = new BackgroundManager();
