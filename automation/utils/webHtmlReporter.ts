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

export function generateWebHTMLReports(results: TestCaseResult[], targetUrl: string): void {
  const htmlDir = path.resolve(__dirname, '../reports/HTML');
  if (!fs.existsSync(htmlDir)) {
    fs.mkdirSync(htmlDir, { recursive: true });
  }

  const passed = results.filter(r => r.status === 'Passed').length;
  const failed = results.filter(r => r.status === 'Failed').length;
  const skipped = results.filter(r => r.status === 'Skipped').length;
  const blocked = results.filter(r => r.status === 'Blocked').length;
  const total = results.length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : '0.00';

  const duration = results.reduce((acc, curr) => acc + curr.durationMs, 0);
  const formattedDuration = `${(duration / 1000).toFixed(2)}s`;

  // 1. Build: execution-report.html
  const executionReportHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Focus Buddy - Live Web Selenium E2E Report</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Outfit', sans-serif; background-color: #FAF9F6; color: #4A4A3A; }
    .card { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(10px); border: 1px solid rgba(90,90,64,0.1); }
  </style>
</head>
<body class="p-6">
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <header class="flex justify-between items-center pb-4 border-b border-stone-200">
      <div>
        <h1 class="text-3xl font-extrabold text-stone-800">Focus Buddy Live Web</h1>
        <p class="text-stone-500 text-sm">Selenium E2E Automation Results against GitHub Pages</p>
      </div>
      <div class="text-right">
        <span class="px-4 py-2 rounded-full bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider">Pass Rate: ${passRate}%</span>
      </div>
    </header>

    <!-- Metrics Cards -->
    <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
      <div class="card p-4 rounded-3xl text-center shadow-xs">
        <div class="text-2xl font-black text-stone-800">${total}</div>
        <div class="text-[11px] font-bold text-stone-500 uppercase tracking-wider mt-1">Total Tests</div>
      </div>
      <div class="card p-4 rounded-3xl text-center shadow-xs">
        <div class="text-2xl font-black text-emerald-600">${passed}</div>
        <div class="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mt-1">Passed</div>
      </div>
      <div class="card p-4 rounded-3xl text-center shadow-xs">
        <div class="text-2xl font-black text-rose-600">${failed}</div>
        <div class="text-[11px] font-bold text-rose-600 uppercase tracking-wider mt-1">Failed</div>
      </div>
      <div class="card p-4 rounded-3xl text-center shadow-xs">
        <div class="text-2xl font-black text-amber-500">${skipped}</div>
        <div class="text-[11px] font-bold text-amber-500 uppercase tracking-wider mt-1">Skipped</div>
      </div>
      <div class="card p-4 rounded-3xl text-center shadow-xs">
        <div class="text-2xl font-black text-slate-500">${blocked}</div>
        <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">Blocked</div>
      </div>
      <div class="card p-4 rounded-3xl text-center shadow-xs">
        <div class="text-2xl font-black text-blue-600">${formattedDuration}</div>
        <div class="text-[11px] font-bold text-blue-600 uppercase tracking-wider mt-1">Duration</div>
      </div>
    </div>

    <!-- Env Info -->
    <div class="card p-6 rounded-3xl shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <span class="block text-[10px] font-bold uppercase tracking-wider text-stone-400">Live Deployed URL</span>
        <a href="${targetUrl}" target="_blank" class="text-brand-primary font-bold hover:underline break-all text-sm">${targetUrl}</a>
      </div>
      <div>
        <span class="block text-[10px] font-bold uppercase tracking-wider text-stone-400">Execution Platform</span>
        <span class="text-stone-700 font-bold text-sm">GitHub Actions Runner / Headless Chrome</span>
      </div>
    </div>

    <!-- Grid List View -->
    <div class="card p-6 rounded-3xl shadow-xs">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-lg font-black text-stone-800">Detailed Live Web Executed Test Cases</h2>
        <div class="flex gap-2">
          <input type="text" id="searchInput" placeholder="Search by Module or ID..." class="px-4 py-2 text-xs border border-stone-200 rounded-xl outline-none" onkeyup="filterTests()">
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse" id="testTable">
          <thead>
            <tr class="border-b border-stone-200 text-xs uppercase tracking-wider text-stone-400">
              <th class="py-3 px-4">Test ID</th>
              <th class="py-3 px-4">Module</th>
              <th class="py-3 px-4">Test Name</th>
              <th class="py-3 px-4">Priority</th>
              <th class="py-3 px-4 text-center">Status</th>
              <th class="py-3 px-4 text-right">Time</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100 text-sm text-stone-700">
            ${results.map(r => `
              <tr class="hover:bg-stone-50/50 cursor-pointer" onclick="toggleDetails('${r.id}')">
                <td class="py-4 px-4 font-bold text-stone-900">${r.id}</td>
                <td class="py-4 px-4 text-stone-500">${r.module}</td>
                <td class="py-4 px-4">${r.name}</td>
                <td class="py-4 px-4">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold ${r.priority === 'High' ? 'bg-rose-50 text-rose-600' : (r.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600')}">
                    ${r.priority}
                  </span>
                </td>
                <td class="py-4 px-4 text-center">
                  <span class="px-2.5 py-1 rounded-full text-xs font-bold ${r.status === 'Passed' ? 'bg-emerald-100 text-emerald-800' : (r.status === 'Failed' ? 'bg-rose-100 text-rose-800' : 'bg-stone-100 text-stone-800')}">
                    ${r.status}
                  </span>
                </td>
                <td class="py-4 px-4 text-right font-mono text-xs text-stone-500">${r.durationMs}ms</td>
              </tr>
              <tr id="details_${r.id}" class="hidden bg-stone-50/50">
                <td colspan="6" class="p-6">
                  <div class="space-y-4 text-xs">
                    <div>
                      <strong class="block text-[10px] uppercase text-stone-400">Preconditions:</strong>
                      <span>${r.preconditions}</span>
                    </div>
                    <div>
                      <strong class="block text-[10px] uppercase text-stone-400">Test Steps:</strong>
                      <ol class="list-decimal pl-4 space-y-1 mt-1 text-stone-600">
                        ${r.steps.map(s => `<li>${s}</li>`).join('')}
                      </ol>
                    </div>
                    <div>
                      <strong class="block text-[10px] uppercase text-stone-400">Expected Result:</strong>
                      <span>${r.expectedResult}</span>
                    </div>
                    <div>
                      <strong class="block text-[10px] uppercase text-stone-400">Actual Result:</strong>
                      <span class="${r.status === 'Passed' ? 'text-emerald-700' : 'text-rose-700'}">${r.actualResult}</span>
                    </div>
                    ${r.failureReason ? `
                      <div class="p-4 bg-rose-50 border border-rose-100 rounded-xl space-y-2">
                        <strong class="block text-rose-800 text-[10px] uppercase">Failure Reason & Stack Trace:</strong>
                        <p class="text-rose-700 font-bold">${r.failureReason}</p>
                        <pre class="bg-stone-900 text-stone-300 p-3 rounded-lg overflow-x-auto font-mono text-[10px] leading-relaxed">${r.stackTrace}</pre>
                      </div>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    function toggleDetails(id) {
      const el = document.getElementById('details_' + id);
      el.classList.toggle('hidden');
    }

    function filterTests() {
      const input = document.getElementById('searchInput').value.toLowerCase();
      const rows = document.querySelectorAll('#testTable tbody tr');
      
      for (let i = 0; i < rows.length; i += 2) {
        const testRow = rows[i];
        const detailRow = rows[i + 1];
        const text = testRow.textContent.toLowerCase();
        
        if (text.includes(input)) {
          testRow.style.display = '';
        } else {
          testRow.style.display = 'none';
          detailRow.classList.add('hidden'); // Close detail
        }
      }
    }
  </script>
</body>
</html>
  `;
  fs.writeFileSync(path.join(htmlDir, 'execution-report.html'), executionReportHTML);

  // 2. Build: dashboard.html
  const dashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Focus Buddy Live Web - E2E Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: 'Outfit', sans-serif; background-color: #FAF9F6; color: #4A4A3A; }
    .card { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(10px); border: 1px solid rgba(90,90,64,0.1); }
  </style>
</head>
<body class="p-6">
  <div class="max-w-7xl mx-auto space-y-6">
    <header class="flex justify-between items-center pb-4 border-b border-stone-200">
      <div>
        <h1 class="text-3xl font-extrabold text-stone-800">Live Web E2E Dashboard</h1>
        <p class="text-stone-500 text-sm">Visual analysis of live deployed system</p>
      </div>
      <div>
        <a href="execution-report.html" class="px-4 py-2 border border-stone-200 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 bg-white transition shadow-xs">View Report Details</a>
      </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="card p-6 rounded-3xl shadow-xs flex flex-col justify-between">
        <div>
          <h3 class="font-extrabold text-stone-800 text-base mb-4">Total Test cases</h3>
          <ul class="space-y-3 text-sm text-stone-600">
            <li class="flex justify-between"><span>Total Cases:</span><strong class="text-stone-800">${total}</strong></li>
            <li class="flex justify-between"><span>Passed Count:</span><strong class="text-emerald-600">${passed}</strong></li>
            <li class="flex justify-between"><span>Failed Count:</span><strong class="text-rose-600">${failed}</strong></li>
            <li class="flex justify-between"><span>Skipped Count:</span><strong class="text-amber-500">${skipped}</strong></li>
            <li class="flex justify-between"><span>Blocked Count:</span><strong class="text-slate-500">${blocked}</strong></li>
          </ul>
        </div>
        <div class="border-t border-stone-100 pt-4 mt-4">
          <div class="flex justify-between items-center text-sm font-bold">
            <span>Overall Success:</span>
            <span class="text-emerald-600">${passRate}%</span>
          </div>
        </div>
      </div>

      <div class="card p-6 rounded-3xl shadow-xs flex justify-center items-center col-span-2">
        <div class="w-64 h-64">
          <canvas id="metricsChart"></canvas>
        </div>
      </div>
    </div>
  </div>

  <script>
    const ctx = document.getElementById('metricsChart').getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Passed', 'Failed', 'Skipped', 'Blocked'],
        datasets: [{
          data: [${passed}, ${failed}, ${skipped}, ${blocked}],
          backgroundColor: ['#10B981', '#EF4444', '#F59E0B', '#64748B'],
          borderColor: '#ffffff',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { family: 'Outfit', size: 12 } }
          }
        }
      }
    });
  </script>
</body>
</html>
  `;
  fs.writeFileSync(path.join(htmlDir, 'dashboard.html'), dashboardHTML);

  console.log('Web HTML Reports compiled successfully.');
}
export {};
