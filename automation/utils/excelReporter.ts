import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestCaseResult {
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

export async function generateExcelReports(results: TestCaseResult[]): Promise<void> {
  const reportsDir = path.resolve(__dirname, '../reports/Excel');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const passedTests = results.filter(r => r.status === 'Passed');
  const failedTests = results.filter(r => r.status === 'Failed');
  const skippedTests = results.filter(r => r.status === 'Skipped');
  const blockedTests = results.filter(r => r.status === 'Blocked');

  // Helper metrics calculation
  const total = results.length;
  const passed = passedTests.length;
  const failed = failedTests.length;
  const skipped = skippedTests.length;
  const blocked = blockedTests.length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : '0.00';

  // 1. Build: Automation_Test_Report.xlsx (All sheets)
  const mainWorkbook = new ExcelJS.Workbook();
  mainWorkbook.creator = 'Focus Buddy SDET Automation';
  mainWorkbook.lastModifiedBy = 'CI/CD runner';

  // Styles utility
  const headerStyle = {
    font: { name: 'Arial', family: 2, size: 10, bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A4A3A' } }, // Brand primary dark
    alignment: { vertical: 'middle', horizontal: 'center' }
  } as const;

  // Sheet 1: Executed Test Cases
  const sheet1 = mainWorkbook.addWorksheet('Executed Test Cases');
  sheet1.columns = [
    { header: 'Test ID', key: 'id', width: 15 },
    { header: 'Module', key: 'module', width: 25 },
    { header: 'Test Name', key: 'name', width: 45 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Execution Time (ms)', key: 'duration', width: 20 }
  ];
  sheet1.getRow(1).eachCell(c => { Object.assign(c, headerStyle); });
  results.forEach(r => {
    sheet1.addRow({
      id: r.id,
      module: r.module,
      name: r.name,
      priority: r.priority,
      status: r.status,
      duration: r.durationMs
    });
  });

  // Sheet 2: Passed Tests
  const sheet2 = mainWorkbook.addWorksheet('Passed Tests');
  sheet2.columns = sheet1.columns;
  sheet2.getRow(1).eachCell(c => { Object.assign(c, headerStyle); });
  passedTests.forEach(r => {
    sheet2.addRow({
      id: r.id,
      module: r.module,
      name: r.name,
      priority: r.priority,
      status: r.status,
      duration: r.durationMs
    });
  });

  // Sheet 3: Failed Tests
  const sheet3 = mainWorkbook.addWorksheet('Failed Tests');
  sheet3.columns = sheet1.columns;
  sheet3.getRow(1).eachCell(c => { Object.assign(c, headerStyle); });
  failedTests.forEach(r => {
    sheet3.addRow({
      id: r.id,
      module: r.module,
      name: r.name,
      priority: r.priority,
      status: r.status,
      duration: r.durationMs
    });
  });

  // Sheet 4: Skipped Tests
  const sheet4 = mainWorkbook.addWorksheet('Skipped Tests');
  sheet4.columns = sheet1.columns;
  sheet4.getRow(1).eachCell(c => { Object.assign(c, headerStyle); });
  skippedTests.forEach(r => {
    sheet4.addRow({
      id: r.id,
      module: r.module,
      name: r.name,
      priority: r.priority,
      status: r.status,
      duration: r.durationMs
    });
  });

  // Sheet 5: Execution Metrics
  const sheet5 = mainWorkbook.addWorksheet('Execution Metrics');
  sheet5.addRow(['Metric Name', 'Count / Percent']);
  sheet5.getRow(1).eachCell(c => { Object.assign(c, headerStyle); });
  sheet5.addRow(['Total Test Cases', total]);
  sheet5.addRow(['Passed Test Cases', passed]);
  sheet5.addRow(['Failed Test Cases', failed]);
  sheet5.addRow(['Skipped Test Cases', skipped]);
  sheet5.addRow(['Blocked Test Cases', blocked]);
  sheet5.addRow(['Pass Rate (%)', `${passRate}%`]);
  sheet5.getColumn(1).width = 25;
  sheet5.getColumn(2).width = 20;

  // Sheet 6: Defect Summary
  const sheet6 = mainWorkbook.addWorksheet('Defect Summary');
  sheet6.columns = [
    { header: 'Test ID', key: 'id', width: 15 },
    { header: 'Module', key: 'module', width: 25 },
    { header: 'Failure Reason', key: 'reason', width: 55 },
    { header: 'Stack Trace Snippet', key: 'stack', width: 60 }
  ];
  sheet6.getRow(1).eachCell(c => { Object.assign(c, headerStyle); });
  failedTests.forEach(r => {
    sheet6.addRow({
      id: r.id,
      module: r.module,
      reason: r.failureReason || 'N/A',
      stack: r.stackTrace?.substring(0, 150) || 'N/A'
    });
  });

  // Sheet 7: Pass Rate Summary
  const sheet7 = mainWorkbook.addWorksheet('Pass Rate Summary');
  sheet7.columns = [
    { header: 'Module Name', key: 'module', width: 25 },
    { header: 'Total Tests', key: 'total', width: 15 },
    { header: 'Passed', key: 'passed', width: 12 },
    { header: 'Failed', key: 'failed', width: 12 },
    { header: 'Pass Rate (%)', key: 'rate', width: 18 }
  ];
  sheet7.getRow(1).eachCell(c => { Object.assign(c, headerStyle); });
  
  // Calculate modules split
  const moduleMap = new Map<string, { total: number; passed: number; failed: number }>();
  results.forEach(r => {
    const data = moduleMap.get(r.module) || { total: 0, passed: 0, failed: 0 };
    data.total++;
    if (r.status === 'Passed') data.passed++;
    if (r.status === 'Failed') data.failed++;
    moduleMap.set(r.module, data);
  });
  
  moduleMap.forEach((val, key) => {
    const rate = val.total > 0 ? ((val.passed / val.total) * 100).toFixed(1) : '0.0';
    sheet7.addRow({
      module: key,
      total: val.total,
      passed: val.passed,
      failed: val.failed,
      rate: `${rate}%`
    });
  });

  await mainWorkbook.xlsx.writeFile(path.join(reportsDir, 'Automation_Test_Report.xlsx'));

  // 2. Build: Passed_Test_Cases.xlsx
  const passedWorkbook = new ExcelJS.Workbook();
  const passedSheet = passedWorkbook.addWorksheet('Passed Tests');
  passedSheet.columns = sheet1.columns;
  passedSheet.getRow(1).eachCell(c => { Object.assign(c, headerStyle); });
  passedTests.forEach(r => {
    passedSheet.addRow({
      id: r.id,
      module: r.module,
      name: r.name,
      priority: r.priority,
      status: r.status,
      duration: r.durationMs
    });
  });
  await passedWorkbook.xlsx.writeFile(path.join(reportsDir, 'Passed_Test_Cases.xlsx'));

  // 3. Build: Failed_Test_Cases.xlsx
  const failedWorkbook = new ExcelJS.Workbook();
  const failedSheet = failedWorkbook.addWorksheet('Failed Tests');
  failedSheet.columns = sheet1.columns;
  failedSheet.getRow(1).eachCell(c => { Object.assign(c, headerStyle); });
  failedTests.forEach(r => {
    failedSheet.addRow({
      id: r.id,
      module: r.module,
      name: r.name,
      priority: r.priority,
      status: r.status,
      duration: r.durationMs
    });
  });
  await failedWorkbook.xlsx.writeFile(path.join(reportsDir, 'Failed_Test_Cases.xlsx'));

  // 4. Build: Execution_Summary.xlsx
  const summaryWorkbook = new ExcelJS.Workbook();
  const summarySheet = summaryWorkbook.addWorksheet('Execution Summary');
  summarySheet.addRow(['Metric Title', 'Value']);
  summarySheet.getRow(1).eachCell(c => { Object.assign(c, headerStyle); });
  summarySheet.addRow(['Total Evaluated', total]);
  summarySheet.addRow(['Total Passed', passed]);
  summarySheet.addRow(['Total Failed', failed]);
  summarySheet.addRow(['Total Skipped', skipped]);
  summarySheet.addRow(['Total Blocked', blocked]);
  summarySheet.addRow(['Pass Percentage (%)', `${passRate}%`]);
  summarySheet.getColumn(1).width = 25;
  summarySheet.getColumn(2).width = 20;
  await summaryWorkbook.xlsx.writeFile(path.join(reportsDir, 'Execution_Summary.xlsx'));

  console.log('All Excel Reports generated successfully.');
}
