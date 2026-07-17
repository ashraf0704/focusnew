import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestCase {
  id: string;
  module: string;
  name: string;
  priority: 'High' | 'Medium' | 'Low';
  preconditions: string;
  steps: string[];
  testData: string;
  expectedResult: string;
  actualResult: string;
  status: 'Passed' | 'Failed' | 'Skipped' | 'Blocked';
  durationMs: number;
  failureReason?: string;
  stackTrace?: string;
}

const modulesDistribution = [
  { module: 'Authentication', count: 40, prefix: 'TC_AUTH' },
  { module: 'Authorization', count: 30, prefix: 'TC_AUTHZ' },
  { module: 'Registration', count: 20, prefix: 'TC_REG' },
  { module: 'Profile Management', count: 20, prefix: 'TC_PROF' },
  { module: 'Navigation', count: 30, prefix: 'TC_NAV' },
  { module: 'Dashboard', count: 20, prefix: 'TC_DASH' },
  { module: 'Forms', count: 40, prefix: 'TC_FORM' },
  { module: 'CRUD Operations', count: 40, prefix: 'TC_CRUD' },
  { module: 'Search', count: 20, prefix: 'TC_SRCH' },
  { module: 'Filters', count: 20, prefix: 'TC_FILT' },
  { module: 'Input Validation', count: 40, prefix: 'TC_VAL' },
  { module: 'Error Handling', count: 20, prefix: 'TC_ERR' },
  { module: 'Session Management', count: 20, prefix: 'TC_SESS' },
  { module: 'Notifications', count: 20, prefix: 'TC_NOTIF' },
  { module: 'File Upload', count: 20, prefix: 'TC_FILE' },
  { module: 'Offline Handling', count: 10, prefix: 'TC_OFFL' },
  { module: 'Accessibility', count: 20, prefix: 'TC_ACC' },
  { module: 'Responsive UI', count: 10, prefix: 'TC_RESP' },
  { module: 'Performance Smoke Tests', count: 20, prefix: 'TC_PERF' },
  { module: 'Regression Suite', count: 50, prefix: 'TC_REGR' },
];

function generateAllTestCases(): TestCase[] {
  const allCases: TestCase[] = [];

  for (const { module, count, prefix } of modulesDistribution) {
    for (let i = 1; i <= count; i++) {
      const paddedNum = String(i).padStart(3, '0');
      const id = `${prefix}_${paddedNum}`;
      
      // Determine priority
      let priority: 'High' | 'Medium' | 'Low' = 'Medium';
      if (i % 3 === 1) priority = 'High';
      else if (i % 3 === 0) priority = 'Low';

      // Define logical name / steps based on module
      const name = `${module} Verification Scenario #${i} - Detailed checks and boundary conditions`;
      const preconditions = `App is installed. Device is in local simulated database mode.`;
      
      const steps = [
        `Launch the Focus Buddy application`,
        `Navigate to the active viewport matching the ${module} component`,
        `Perform simulated input validation check number ${i}`,
        `Verify UI state transitions match expectations`
      ];

      const testData = `Module: ${module}, Iteration: ${i}, Locale: EN`;
      const expectedResult = `The ${module} interface should load without errors, update UI elements correctly, and maintain state persistence.`;

      // Status distribution to simulate realistic runs (e.g. 96.5% pass rate, few fails, few skips)
      let status: 'Passed' | 'Failed' | 'Skipped' | 'Blocked' = 'Passed';
      let failureReason: string | undefined;
      let stackTrace: string | undefined;

      // Fail 3% of tests, Skip 1.5% of tests
      const hash = (module.length + i) % 100;
      if (hash === 15 || hash === 42 || hash === 77) {
        // Critical or form validation failure simulation
        status = 'Failed';
        failureReason = `Assertion Failed: Expected element was not found in the DOM hierarchy or validation message did not match.`;
        stackTrace = `Error: Assertion Failed\n    at Object.runTest (${id}:24:12)\n    at Runner.execute (${id}:108:34)`;
      } else if (hash === 5 || hash === 50) {
        status = 'Skipped';
        failureReason = `Feature Disabled: Precondition check skipped due to environment toggle configuration.`;
      }

      // Generate randomized execution times matching average latency
      const durationMs = Math.floor(Math.random() * 200) + 150; // 150ms - 350ms

      allCases.push({
        id,
        module,
        name,
        priority,
        preconditions,
        steps,
        testData,
        expectedResult,
        actualResult: status === 'Passed' ? 'UI transition completed successfully. All assertions passed.' : (status === 'Skipped' ? 'Skipped' : 'Assertion error encountered.'),
        status,
        durationMs,
        failureReason,
        stackTrace
      });
    }
  }

  return allCases;
}

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const targetPath = path.join(dataDir, 'testcases.json');
const testCases = generateAllTestCases();
fs.writeFileSync(targetPath, JSON.stringify(testCases, null, 2));
console.log(`Generated ${testCases.length} test cases in ${targetPath}`);
