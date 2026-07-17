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
  expectedResult: string;
  actualResult: string;
  status: 'Passed' | 'Failed' | 'Skipped' | 'Blocked';
  durationMs: number;
  failureReason?: string;
  stackTrace?: string;
}

export async function generateWebExcelReports(results: TestCaseResult[]): Promise<void> {
  const reportsDir = path.resolve(__dirname, '../reports/Excel');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const passedTests = results.filter(r => r.status === 'Passed');
  const failedTests = results.filter(r => r.status === 'Failed');
  const skippedTests = results.filter(r => r.status === 'Skipped');
  const blockedTests = results.filter(r => r.status === 'Blocked');

  const total = results.length;
  const passed = passedTests.length;
  const failed = failedTests.length;
  const skipped = skippedTests.length;
  const blocked = blockedTests.length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : '0.00';

  const headerStyle = {
    font: { name: 'Arial', family: 2, size: 10, bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5A5A40' } }, // Brand primary color
    alignment: { vertical: 'middle', horizontal: 'center' }
  } as const;

  // 1. Build: Automation_Test_Report.xlsx
  const mainWorkbook = new ExcelJS.Workbook();
  mainWorkbook.creator = 'Focus Buddy Live Web Automation';

  const sheet1 = mainWorkbook.addWorksheet('Executed Test Cases');
  sheet1.columns = [
    { header: 'Test ID', key: 'id', width: 18 },
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

  const sheet5 = mainWorkbook.addWorksheet('Execution Metrics');
  sheet5.addRow(['Metric Title', 'Count / Proportion']);
  sheet5.getRow(1).eachCell(c => { Object.assign(c, headerStyle); });
  sheet5.addRow(['Total Tests Eval', total]);
  sheet5.addRow(['Passed Tests', passed]);
  sheet5.addRow(['Failed Tests', failed]);
  sheet5.addRow(['Skipped Tests', skipped]);
  sheet5.addRow(['Blocked Tests', blocked]);
  sheet5.addRow(['Success Pass Rate (%)', `${passRate}%`]);
  sheet5.getColumn(1).width = 25;
  sheet5.getColumn(2).width = 20;

  const sheet6 = mainWorkbook.addWorksheet('Defect Summary');
  sheet6.columns = [
    { header: 'Test ID', key: 'id', width: 18 },
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

  await mainWorkbook.xlsx.writeFile(path.join(reportsDir, 'Automation_Test_Report.xlsx'));

  // 2. Passed_Test_Cases.xlsx
  const passedWb = new ExcelJS.Workbook();
  const pSheet = passedWb.addWorksheet('Passed');
  pSheet.columns = sheet1.columns;
  pSheet.getRow(1).eachCell(c => { Object.assign(c, headerStyle); });
  passedTests.forEach(r => {
    pSheet.addRow({
      id: r.id,
      module: r.module,
      name: r.name,
      priority: r.priority,
      status: r.status,
      duration: r.durationMs
    });
  });
  await passedWb.xlsx.writeFile(path.join(reportsDir, 'Passed_Test_Cases.xlsx'));

  // 3. Failed_Test_Cases.xlsx
  const failedWb = new ExcelJS.Workbook();
  const fSheet = failedWb.addWorksheet('Failed');
  fSheet.columns = sheet1.columns;
  fSheet.getRow(1).eachCell(c => { Object.assign(c, headerStyle); });
  failedTests.forEach(r => {
    fSheet.addRow({
      id: r.id,
      module: r.module,
      name: r.name,
      priority: r.priority,
      status: r.status,
      duration: r.durationMs
    });
  });
  await failedWb.xlsx.writeFile(path.join(reportsDir, 'Failed_Test_Cases.xlsx'));

  // 4. Summary_Report.xlsx
  const summaryWb = new ExcelJS.Workbook();
  const sSheet = summaryWb.addWorksheet('Summary');
  sSheet.addRow(['Metric Title', 'Count / Proportion']);
  sSheet.getRow(1).eachCell(c => { Object.assign(c, headerStyle); });
  sSheet.addRow(['Total Evaluated', total]);
  sSheet.addRow(['Passed Total', passed]);
  sSheet.addRow(['Failed Total', failed]);
  sSheet.addRow(['Skipped Total', skipped]);
  sSheet.addRow(['Blocked Total', blocked]);
  sSheet.addRow(['Pass Rate (%)', `${passRate}%`]);
  sSheet.getColumn(1).width = 25;
  sSheet.getColumn(2).width = 20;
  await summaryWb.xlsx.writeFile(path.join(reportsDir, 'Summary_Report.xlsx'));

  console.log('Web Excel Reports compiled successfully.');
}
export {};
