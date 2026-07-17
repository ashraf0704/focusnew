# Focus Buddy - Android E2E Appium Automation Framework

This directory contains the enterprise-grade automated testing framework for the Focus Buddy Android application, utilizing Appium, WebDriverIO, Page Object Model (POM), data-driven testing, and robust Excel & HTML reporting pipelines integrated with GitHub Actions CI/CD and GitHub Pages.

---

## 1. Local Execution Guide

To run the Appium test suite locally on your developer machine:

### Prerequisites
- **Node.js**: Version 18 or 20.
- **Java Development Kit (JDK)**: JDK 17 installed with `JAVA_HOME` environment variable configured.
- **Android Studio**: Installed with Android SDK, `ANDROID_HOME` configured, platform-tools, and a Virtual Device (AVD) running Android 14 (API 34).

### Step 1: Install Dependencies
From the root directory, install all dependencies:
```bash
npm install
cd automation
npm install
```

### Step 2: Generate test cases database
Generate the database of 400+ data-driven test cases:
```bash
npm run generate-data
```

### Step 3: Start Appium Server
Start your local Appium server:
```bash
npm install -g appium
appium driver install uiautomator2
appium
```

### Step 4: Run E2E Automation
Start your Android Emulator in Android Studio, and run the test runner:
```bash
npm run test:e2e
```

---

## 2. CI/CD Execution Guide

The GitHub Actions workflow [.github/workflows/android-e2e.yml](file:///c:/Users/Ashraf/Downloads/focus-buddy%20new/.github/workflows/android-e2e.yml) automates the entire testing pipeline on every `push` and `pull_request` to `main`/`master` branches:

1. **Checkout & Setup**: Clones the repo, installs JDK 17, and configure Android SDK.
2. **Build APK**: Locally prebuilds the Expo project to generate the `android/` directory and compiles the debug APK via Gradle `./gradlew assembleDebug`.
3. **Appium & Emulator Startup**: Boots a hardware-accelerated Android Emulator, starts the Appium server, and verifies connectivity.
4. **App Installation & Test Execution**: Installs the newly generated APK onto the emulator and executes the test runner suite.
5. **Report Generation**: Dynamically creates:
   - Excel workbooks (`Automation_Test_Report.xlsx`, `Passed_Test_Cases.xlsx`, `Failed_Test_Cases.xlsx`, `Execution_Summary.xlsx`)
   - Interactive HTML reports with charts and trends (`execution-report.html`, `dashboard.html`, `trends.html`)
   - Markdown summary published directly to the GitHub Job Summary.
6. **Pages Deployment**: Publishes reports to the `gh-pages` branch, archiving past builds.

---

## 3. Troubleshooting Guide

### Issue: Emulator fails to boot or times out in CI
- **Solution**: The workflow uses `reactivecircus/android-emulator-runner` which is optimized for GitHub runner performance. If it times out, consider increasing the timeout limit or checking SDK compatibility.

### Issue: Appium Port Clashes (Error: port 4723 already in use)
- **Solution**: Check if another Appium instance is running:
  - Windows: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 4723).OwningProcess -Force`
  - Linux/Mac: `kill -9 $(lsof -t -i:4723)`

### Issue: Gradle compilation errors in prebuild
- **Solution**: Run `npx expo prebuild --clean` locally to clean cache and rebuild android gradle wrapper.

---

## 4. Repository Configuration Guide

To deploy HTML/Excel reports to GitHub Pages successfully:

1. **Enable GitHub Pages**:
   - Go to your repository settings on GitHub.
   - Navigate to **Pages** in the left menu.
   - Select **Deploy from a branch** under Build and deployment.
   - Choose the `gh-pages` branch and click **Save**.
2. **Workflow Permissions**:
   - Go to **Settings** > **Actions** > **General**.
   - Under **Workflow permissions**, select **Read and write permissions**.
   - Tick the checkbox **Allow GitHub Actions to create and approve pull requests**.
   - Click **Save**.
