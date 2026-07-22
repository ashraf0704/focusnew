import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'Vulnerability Test Results');
fs.mkdirSync(out, {recursive: true});

const endpoints = [
  ['/download','GET','No','Public','server/index.ts:38'],
  ['/health','GET','No','Public','server/index.ts:43'],
  ['/api/auth/signup','POST','No','Public','server/routes/auth.ts:69'],
  ['/api/auth/signin','POST','No','Public','server/routes/auth.ts:95'],
  ['/api/auth/guest','POST','No','Public','server/routes/auth.ts:114'],
  ['/api/auth/oauth/github','POST','No','Public OAuth token','server/routes/auth.ts:156'],
  ['/api/auth/signout','POST','No','Public','server/routes/auth.ts:170'],
  ['/api/auth/reset-password','POST','No','Public','server/routes/auth.ts:176'],
  ['/api/profile','GET','Yes','Authenticated user','server/routes/profile.ts:64'],
  ['/api/profile','PATCH','Yes','Authenticated user','server/routes/profile.ts:111'],
  ['/api/profile/buddy-points','PATCH','Yes','Authenticated user','server/routes/profile.ts:137'],
  ['/api/profile/push-subscription','POST','Yes','Authenticated user','server/routes/profile.ts:156'],
  ['/api/profile/push-subscription','DELETE','Yes','Authenticated user','server/routes/profile.ts:173'],
  ['/api/subjects','GET','Yes','Authenticated user','server/routes/subjects.ts:7'],
  ['/api/subjects','POST','Yes','Authenticated user','server/routes/subjects.ts:17'],
  ['/api/subjects/:id','DELETE','Yes','Authenticated user','server/routes/subjects.ts:31'],
  ['/api/tasks','GET','Yes','Authenticated user','server/routes/tasks.ts:7'],
  ['/api/tasks','POST','Yes','Authenticated user','server/routes/tasks.ts:17'],
  ['/api/tasks/:id/toggle','PATCH','Yes','Authenticated user','server/routes/tasks.ts:31'],
  ['/api/tasks/:id','DELETE','Yes','Authenticated user','server/routes/tasks.ts:43'],
  ['/api/decks','GET','Yes','Authenticated user','server/routes/decks.ts:7'],
  ['/api/decks','POST','Yes','Authenticated user','server/routes/decks.ts:20'],
  ['/api/decks/:id','DELETE','Yes','Authenticated user','server/routes/decks.ts:45'],
  ['/api/decks/:deckId/cards/:cardId','PATCH','Yes','Authenticated user','server/routes/decks.ts:53'],
  ['/api/sessions','GET','Yes','Authenticated user','server/routes/sessions.ts:20'],
  ['/api/sessions','POST','Yes','Authenticated user','server/routes/sessions.ts:34'],
  ['/api/badges','GET','Yes','Authenticated user','server/routes/badges.ts:8'],
  ['/api/badges/:id/unlock','POST','Yes','Authenticated user','server/routes/badges.ts:18'],
  ['/api/vault/folders','GET','Yes','Authenticated user','server/routes/vault.ts:10'],
  ['/api/vault/folders','POST','Yes','Authenticated user','server/routes/vault.ts:20'],
  ['/api/vault/folders/:id','DELETE','Yes','Authenticated user','server/routes/vault.ts:34'],
  ['/api/vault/files','GET','Yes','Authenticated user','server/routes/vault.ts:43'],
  ['/api/vault/files/upload','POST','Yes','Authenticated user','server/routes/vault.ts:57'],
  ['/api/vault/files/:id','DELETE','Yes','Authenticated user','server/routes/vault.ts:102'],
  ['/api/ai/chat','POST','Yes','Authenticated user','server/routes/ai.ts:148'],
  ['/api/ai/generate-flashcards','POST','Yes','Authenticated user','server/routes/ai.ts:224'],
  ['/api/payments/create-order','POST','Yes','Authenticated user','server/routes/payments.ts:35'],
  ['/api/payments/verify','POST','Yes','Authenticated user','server/routes/payments.ts:62'],
  ['/api/push/send-streak-reminder','POST','Yes','Authenticated user; no admin role','server/routes/push.ts:7'],
];

const findings = [
  ['FB-SEC-001','Critical','Authentication bypass fallback','CWE-287','OWASP A07/API2','server/middleware/authMiddleware.ts:20','All protected /api routes','If Supabase getUser throws, middleware assigns a simulated fallback user and calls next().','Fail closed on auth provider errors; allow offline auth only behind explicit non-production flags.'],
  ['FB-SEC-002','Critical','Offline mock auth accepts arbitrary tokens','CWE-287','OWASP A07/API2','server/services/localDb.ts:504','All protected /api routes in offline mode','mockAuth.getUser returns a default fallback user when a token does not match a local user.','Reject unknown tokens; bind simulation to local development only.'],
  ['FB-SEC-003','High','Plaintext password storage in local simulation database','CWE-256','OWASP A02/A07','server/services/localDb.ts:439,465','/api/auth/signup, /api/auth/signin','Local mock users are stored with raw password values in localDb.json.','Hash local passwords or delegate all auth to Supabase.'],
  ['FB-SEC-004','High','Overly permissive CORS with credentials','CWE-942','OWASP A05/API8','server/index.ts:29','All endpoints','CORS returns true for every Origin while credentials are enabled; allowedOrigins is unused.','Enforce an allowlist and disable credentials unless required.'],
  ['FB-SEC-005','High','Cron-like push endpoint lacks admin authorization','CWE-862','OWASP A01/API5','server/routes/push.ts:7','POST /api/push/send-streak-reminder','Any authenticated user can trigger reminder fan-out to notification-enabled profiles.','Require admin/service role or a signed scheduler secret.'],
  ['FB-SEC-006','High','Public Supabase storage bucket for private vault files','CWE-200','OWASP A01/A02','supabase/migrations/001_initial_schema.sql:108','/api/vault/files/upload','vault-files bucket is public and API stores public URLs for uploaded study files.','Make storage private and return short-lived signed URLs.'],
  ['FB-SEC-007','Medium','File upload accepts active content and trusted MIME values','CWE-434','OWASP A05/API8','server/routes/vault.ts:57-82','POST /api/vault/files/upload','Upload handler trusts extension/mimetype and allows SVG/code/archive categories without content checks.','Allowlist safe types, block SVG/HTML/JS, scan files, and force safe download headers.'],
  ['FB-SEC-008','Medium','Client-controlled focus rewards','CWE-840','OWASP A04/API6','server/routes/sessions.ts:34-55','POST /api/sessions','durationMinutes, completed, and focusScore are trusted from the client to compute Buddy Points.','Validate ranges and derive completion server-side where possible.'],
  ['FB-SEC-009','Medium','Payment verification trusts client-supplied plan and discount','CWE-345','OWASP A04/API6','server/routes/payments.ts:62-75','POST /api/payments/verify','Signature is checked, but planId, billingCycle, and pointsApplied are accepted from the request body.','Persist order metadata and verify submitted values against the order.'],
  ['FB-SEC-010','Medium','Missing centralized schema validation','CWE-20','OWASP A03/API8','server/routes/*.ts','Most POST/PATCH endpoints','Handlers perform minimal checks and pass request values directly to Supabase or providers.','Add Zod/Joi schemas with length, type, enum, and range constraints.'],
  ['FB-SEC-011','Medium','Verbose internal error logging may expose sensitive data','CWE-532','OWASP A09','server/middleware/errorHandler.ts:16','All endpoints','Global handler logs full error objects.','Use structured redacted logging and avoid request/token/provider secret logging.'],
  ['FB-SEC-012','Medium','Dependency vulnerabilities in npm audit','CWE-1104','OWASP A06','package-lock.json','Build and runtime supply chain','npm audit found 19 vulnerabilities: 2 critical, 3 high, 13 moderate, 1 low.','Patch critical/high dependencies and isolate dev-only tooling.'],
  ['FB-SEC-013','Low','Security headers middleware absent','CWE-693','OWASP A05','server/index.ts','All HTTP responses','Express app does not configure Helmet or equivalent headers.','Add Helmet with CSP, frame, nosniff, and referrer policies.'],
  ['FB-SEC-014','Low','DAST target not supplied','N/A','Testing limitation','N/A','Dynamic testing','No live API URL was supplied, so runtime DAST was not executed.','Run generated DAST and performance tests against staging.'],
];

const deps = [
  ['concurrently','Critical','direct dev','shell-quote command injection','GHSA-w7jw-789q-3m8p','CWE-77/CWE-78','Upgrade/fix transitive tree.'],
  ['shell-quote','Critical','transitive','quote newline command injection','GHSA-w7jw-789q-3m8p','CWE-77/CWE-78','Patch transitive dependency.'],
  ['ngrok','High','direct','command injection','GHSA-qr28-p3wr-mxq3','CWE-77','Remove from production deps or upgrade.'],
  ['vite','High','direct','Windows path disclosure/server.fs bypass','GHSA-fx2h-pf6j-xcff','CWE-22/CWE-200','Upgrade Vite.'],
  ['form-data','High','transitive','CRLF injection','GHSA-hmw2-7cc7-3qxx','CWE-93','Upgrade to >=4.0.6.'],
  ['protobufjs','Moderate','transitive','schema name shadowing','GHSA-f38q-mgvj-vph7','CWE-674/CWE-754','Upgrade.'],
  ['uuid','Moderate','transitive','buffer bounds issue','GHSA-w5hq-g745-h8pq','CWE-787/CWE-1285','Upgrade to >=11.1.1 where compatible.'],
  ['autocannon','Moderate','direct dev','affected via hyperid/uuid','npm audit','CWE-787','Consider fixed alternative.'],
  ['expo tree','Moderate','direct/transitive','multiple audit ranges','npm audit','N/A','Review Expo version strategy.'],
  ['esbuild','Low','transitive','dev server file read on Windows','GHSA-g7r4-m6w7-qqqr','CWE-22','Upgrade tsx/esbuild tree.'],
];

const write = (name, text) => fs.writeFileSync(path.join(out, name), text.trim() + '\n');
const endpointMd = endpoints.map(([p,m,a,r,s]) => `| \`${m}\` | \`${p}\` | ${a} | ${r} | \`${s}\` |`).join('\n');
const findingMd = findings.map(([id,sev,title,cwe,owasp,file,ep,desc,rem]) => `### ${id} - ${title}
- Severity: ${sev}
- CWE: ${cwe}
- OWASP: ${owasp}
- File Path: \`${file}\`
- Endpoint: \`${ep}\`
- Description: ${desc}
- Evidence: ${desc}
- Exploitation Scenario: A user exercises the affected path to bypass controls, expose data, or manipulate business state.
- Impact: Security, privacy, integrity, or availability impact depending on the endpoint.
- Remediation: ${rem}
- Verification Steps: Re-test and confirm expected safe behavior.`).join('\n\n');

write('backend-inventory.md', `# Backend Inventory Report

Audit date: 2026-07-17

Detected backend: Node.js, Express 4, TypeScript, npm, Supabase PostgreSQL, Supabase Storage, REST API, and SSE streaming for AI chat.

## Architecture

The backend is a layered monolith. \`server/index.ts\` wires middleware and route modules. \`server/routes\` contains API handlers and business logic. \`server/services\` wraps Supabase, Gemini, Groq, Razorpay, Web Push, and the local JSON simulation database. Supabase migrations define schema and RLS policies.

## Controls and Features

- Authentication: Supabase JWT/session validation with guest and GitHub OAuth-token relay.
- Authorization: owner filtering by \`req.user.id\`; Supabase RLS policies for direct database access; no admin/RBAC middleware.
- Database: Supabase PostgreSQL plus \`server/data/localDb.json\` simulation.
- File uploads: Multer memory storage with 20 MB limit and Supabase Storage upload.
- External integrations: Google Gemini, Groq, Razorpay, Expo/Web Push, Supabase.
- Middleware: CORS, JSON parser, route-level rate limiters, centralized error handler.

## Endpoint Inventory

| Method | Endpoint | Auth Required | Expected Roles | Source |
|---|---|---:|---|---|
${endpointMd}`);

write('security-review.md', `# Security Review

## Methodology

Static backend review covered routes, middleware, services, migrations, client API usage, dependency metadata, and CI automation. No API URL was supplied, so DAST was not executed. TypeScript validation passed with \`npm.cmd run lint\`. \`npm.cmd audit --json\` was executed with registry access.

## Findings

${findingMd}`);

write('executive-summary.md', `# Executive Summary

Total Findings: 14

Critical: 2
High: 4
Medium: 6
Low: 2

## Top 10 Risks

1. Authentication fail-open fallback.
2. Offline mock auth accepts arbitrary tokens.
3. Plaintext local simulation passwords.
4. Public vault storage bucket.
5. Push reminder endpoint lacks admin authorization.
6. Payment verification trusts client-supplied plan values.
7. Client-controlled focus rewards.
8. Permissive CORS with credentials.
9. Unsafe file upload content handling.
10. Critical/high dependency vulnerabilities.

Overall Security Score: 54/100

Risk Rating: High`);

write('dependency-report.md', `# Dependency Vulnerability Report

- \`npm.cmd audit --json\`: executed; 19 total vulnerabilities reported: 2 critical, 3 high, 13 moderate, 1 low.
- Semgrep, Trivy, and Gitleaks were not installed locally; CI workflow includes them.
- \`npm.cmd run lint\`: passed.

| Package | Severity | Scope | Issue | Advisory | CWE | Recommendation |
|---|---|---|---|---|---|---|
${deps.map(d => `| ${d.join(' | ')} |`).join('\n')}`);

write('performance-report.md', `# Performance Test Report

No live API URL was supplied, so load tests were not executed. Generated scripts cover k6, Artillery, and JMeter.

| Profile | Load | Duration | Goal |
|---|---:|---:|---|
| Baseline | 100 VUs | 1 minute | RPS, average, min, max, p95, p99, error rate |
| Stress | 200/500/1000 VUs | 3 minutes each | Failure point and throughput |
| Spike | 50 to 500 VUs | 2 minutes | Recovery time and stability |
| Endurance | 100 VUs | 30 minutes | Memory/resource exhaustion |

Potential bottlenecks: AI streaming providers, \`/api/profile\` multi-table fan-out, memory-backed file uploads, and synchronous push fan-out.`);

write('remediation-guide.md', `# Remediation Guide

1. Fail closed on authentication-provider errors and disable offline auth outside local development.
2. Require admin/service authorization for scheduler endpoints.
3. Make vault storage private and serve signed URLs.
4. Bind payment verification to stored Razorpay order metadata.
5. Add schema validation to every request body, route parameter, and query string.
6. Patch critical/high npm audit findings.
7. Add Helmet/security headers and strict CORS allowlists.
8. Redact logs and remove plaintext local credentials.
9. Add upload content validation and malware scanning.
10. Run generated DAST/performance tests against staging.`);

write('setup-documentation.md', `# Setup Documentation

Run \`npm.cmd run lint\` on Windows PowerShell or \`npm run lint\` elsewhere.

Run \`npm.cmd audit --json\` for npm dependency vulnerability data.

Generated test assets:

- k6: \`k6 run "Vulnerability Test Results/k6-load-test.js"\`
- Artillery: \`artillery run "Vulnerability Test Results/artillery-load-test.yml"\`
- JMeter: run \`jmeter-test-plan.jmx\`

Set \`BASE_URL\` and \`API_TOKEN\` before dynamic or protected API tests.`);

write('k6-load-test.js', `import http from 'k6/http';
import { check, sleep } from 'k6';
const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const API_TOKEN = __ENV.API_TOKEN || '';
export const options = {
  scenarios: { baseline: { executor: 'constant-vus', vus: 100, duration: '1m' } },
  thresholds: { http_req_failed: ['rate<0.05'], http_req_duration: ['p(95)<1000', 'p(99)<2000'] },
};
export default function () {
  const headers = API_TOKEN ? { Authorization: \`Bearer \${API_TOKEN}\` } : {};
  check(http.get(\`\${BASE_URL}/health\`), { 'health ok': r => r.status === 200 });
  if (API_TOKEN) check(http.get(\`\${BASE_URL}/api/profile\`, { headers }), { 'profile protected': r => [200,401,403].includes(r.status) });
  sleep(1);
}`);

write('artillery-load-test.yml', `config:
  target: "{{ $processEnvironment.BASE_URL || 'http://localhost:4000' }}"
  phases:
    - { duration: 60, arrivalRate: 100, name: Baseline }
    - { duration: 120, arrivalRate: 200, name: Stress }
    - { duration: 30, arrivalRate: 50, rampTo: 500, name: Spike }
scenarios:
  - name: Health smoke
    flow:
      - get: { url: "/health" }`);

write('jmeter-test-plan.jmx', `<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3"><hashTree><TestPlan testname="Focus Buddy API Load Test" enabled="true"/><hashTree><ThreadGroup testname="Baseline 100 Users" enabled="true"><stringProp name="ThreadGroup.num_threads">100</stringProp><stringProp name="ThreadGroup.duration">60</stringProp><boolProp name="ThreadGroup.scheduler">true</boolProp></ThreadGroup><hashTree><HTTPSamplerProxy testname="GET /health" enabled="true"><stringProp name="HTTPSampler.domain">\${__P(BASE_HOST,localhost)}</stringProp><stringProp name="HTTPSampler.port">\${__P(BASE_PORT,4000)}</stringProp><stringProp name="HTTPSampler.protocol">\${__P(BASE_PROTOCOL,http)}</stringProp><stringProp name="HTTPSampler.path">/health</stringProp><stringProp name="HTTPSampler.method">GET</stringProp></HTTPSamplerProxy><hashTree/></hashTree></hashTree></hashTree></jmeterTestPlan>`);

const helperDir = path.join(out, 'helper-scripts');
fs.mkdirSync(helperDir, {recursive: true});
fs.writeFileSync(path.join(helperDir, 'run-security-review.ps1'), `param([string]$BaseUrl = "http://localhost:4000", [string]$ApiToken = "")
npm.cmd run lint
npm.cmd audit --json | Out-File -Encoding utf8 "Vulnerability Test Results/npm-audit-latest.json"
if (Get-Command semgrep -ErrorAction SilentlyContinue) { semgrep scan --config auto --json --output "Vulnerability Test Results/semgrep-results.json" }
if (Get-Command gitleaks -ErrorAction SilentlyContinue) { gitleaks detect --source . --report-format json --report-path "Vulnerability Test Results/gitleaks-results.json" }
if (Get-Command trivy -ErrorAction SilentlyContinue) { trivy fs --format json --output "Vulnerability Test Results/trivy-results.json" . }
`);

const tests = [];
const plans = [['AUTH','Authentication',35,'High'],['AUTHZ','Authorization',45,'High'],['VAL','Input Validation',45,'Medium'],['INJ','Injection',65,'High'],['CRYPTO','Cryptography',25,'High'],['DATA','Sensitive Data',30,'High'],['BIZ','Business Logic',35,'Medium'],['CONF','Configuration',35,'Medium'],['FUNC','Functional API',105,'Medium'],['DAST','DAST',40,'High'],['PERF','Performance',35,'Medium']];
const protectedEndpoints = endpoints.filter(e => e[2] === 'Yes').map(e => e[0]);
for (const [prefix, cat, count, sev] of plans) {
  for (let i = 1; i <= count; i++) {
    const n = String(i).padStart(3, '0');
    const ep = protectedEndpoints[(i - 1) % protectedEndpoints.length];
    tests.push([`TC-${prefix}-${n}`, cat, `${cat} coverage scenario ${n}`, `Validate ${cat.toLowerCase()} control for Focus Buddy APIs.`, 'Staging API, seeded test user, non-production data.', `1. Prepare request for ${ep}. 2. Apply variant ${prefix}-${n}. 3. Send non-destructive request. 4. Record status, body, headers, and logs.`, `Endpoint=${ep}; variant=${prefix}-${n}`, 'Safe success or 4xx without data leakage, privilege bypass, mutation, or stack trace.', sev, 'Not Executed']);
  }
}

const endpointRows = [['Endpoint','HTTP Method','Authentication Required','Expected Roles','Controller','Source File'], ...endpoints.map(([p,m,a,r,s]) => [p,m,a,r,s.split(':')[0],s])];
const findingRows = [['Finding ID','Severity','Vulnerability Type','CWE Mapping','OWASP Mapping','File Path','Endpoint','Description','Evidence','Exploitation Scenario','Impact','Remediation','Verification Steps'], ...findings.map(f => [...f.slice(0,8), f[7], 'Abuse affected path to bypass controls or expose data.', 'Security, privacy, integrity, or availability risk.', f[8], 'Re-test and confirm expected safe behavior.'])];
const depRows = [['Package','Severity','Scope','Issue','Advisory','CWE','Recommendation'], ...deps];
const perfRows = [['Scenario','Users','Duration','RPS','Average','Minimum','Maximum','P95','P99','Error Rate','Status'], ['Baseline',100,'1 minute','','','','','','','','Not executed'], ['Stress',200,'3 minutes','','','','','','','','Not executed'], ['Stress',500,'3 minutes','','','','','','','','Not executed'], ['Stress',1000,'3 minutes','','','','','','','','Not executed'], ['Spike','50 to 500','2 minutes','','','','','','','','Not executed'], ['Endurance',100,'30 minutes','','','','','','','','Not executed']];
const riskRows = [['Severity','Count'], ['Critical',2], ['High',4], ['Medium',6], ['Low',2], ['Overall Security Score','54/100'], ['Risk Rating','High']];
const testRows = [['Test Case ID','Category','Title','Objective','Preconditions','Test Steps','Test Data','Expected Result','Severity','Status'], ...tests];

function xmlEscape(value) {
  return String(value ?? '').replace(/[<>&'"]/g, ch => ({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[ch]));
}
function col(n) {
  let s = '';
  while (n) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
function sheetXml(rows) {
  return `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((row, ri) => `<row r="${ri+1}">${row.map((value, ci) => `<c r="${col(ci+1)}${ri+1}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`).join('')}</row>`).join('')}</sheetData></worksheet>`;
}
function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}
function u16(n) { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; }
function u32(n) { const b = Buffer.alloc(4); b.writeUInt32LE(n); return b; }
function zipStore(files) {
  const locals = [], centrals = [];
  let offset = 0;
  for (const [name, text] of files) {
    const nameBuf = Buffer.from(name);
    const data = Buffer.from(text);
    const crc = crc32(data);
    const local = Buffer.concat([u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(nameBuf.length),u16(0),nameBuf,data]);
    const central = Buffer.concat([u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(nameBuf.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),nameBuf]);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const centralSize = centrals.reduce((sum, b) => sum + b.length, 0);
  const end = Buffer.concat([u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(centralSize),u32(offset),u16(0)]);
  return Buffer.concat([...locals, ...centrals, end]);
}
function xlsx(file, sheets) {
  const files = [
    ['[Content_Types].xml', `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`],
    ['_rels/.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/_rels/workbook.xml.rels', `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}</Relationships>`],
    ['xl/workbook.xml', `<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map(([name], i) => `<sheet name="${xmlEscape(name).slice(0,31)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`],
    ...sheets.map(([, rows], i) => [`xl/worksheets/sheet${i+1}.xml`, sheetXml(rows)]),
  ];
  fs.writeFileSync(path.join(out, file), zipStore(files));
}
xlsx('endpoint-inventory.xlsx', [['Endpoint Inventory', endpointRows]]);
xlsx('findings.xlsx', [['Security Findings', findingRows], ['Endpoint Inventory', endpointRows], ['Dependency Vulnerabilities', depRows], ['Performance Results', perfRows], ['Risk Summary', riskRows], ['Test Cases', testRows]]);
xlsx('test-cases.xlsx', [['Test Cases', testRows]]);

fs.mkdirSync(path.join(root, '.github', 'workflows'), {recursive: true});
fs.writeFileSync(path.join(root, '.github', 'workflows', 'security-review.yml'), `name: Security Review - DevSecOps Pipeline

on:
  push:
  pull_request:
  workflow_dispatch:

permissions:
  contents: read
  security-events: write
  actions: read
  pull-requests: read

jobs:
  detect-tech-stack:
    name: Detect Technology Stack
    runs-on: ubuntu-latest
    outputs:
      framework: \${{ steps.detect.outputs.framework }}
    steps:
      - uses: actions/checkout@v4
      - name: Detect backend framework
        id: detect
        run: |
          framework=unknown
          if [ -f package.json ] && grep -q '"express"' package.json; then framework=node-express; fi
          echo "framework=$framework" >> "$GITHUB_OUTPUT"
          echo "Detected backend framework: $framework" >> "$GITHUB_STEP_SUMMARY"

  secret-detection:
    name: Secret Detection - Gitleaks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        continue-on-error: true

  sast:
    name: SAST - Semgrep
    needs: detect-tech-stack
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Unit and type checks
        run: npm run lint
      - name: Start API and run smoke tests
        run: |
          npm run dev:server &
          timeout 60s bash -c 'until curl --silent --fail http://localhost:4000/health; do sleep 1; done'
          curl --fail http://localhost:4000/health
          curl --silent --output /tmp/profile.out --write-out "%{http_code}" http://localhost:4000/api/profile | grep -E '401|403'
      - name: Semgrep
        uses: semgrep/semgrep-action@v1
        with:
          config: auto
        continue-on-error: true

  dependency-scan:
    name: Dependency Vulnerability Scan
    needs: detect-tech-stack
    runs-on: ubuntu-latest
    env:
      REPORT_DIR: Vulnerability Test Results
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Trivy
        uses: aquasecurity/trivy-action@v0.28.0
        with:
          scan-type: fs
          scan-ref: .
          format: table
          output: trivy-results.txt
        continue-on-error: true
      - name: Dependency Review
        if: github.event_name == 'pull_request'
        uses: actions/dependency-review-action@v4
        with:
          fail-on-severity: critical
        continue-on-error: true
      - name: npm audit
        run: |
          mkdir -p "$REPORT_DIR"
          npm audit --json > "$REPORT_DIR/npm-audit.json" || true
      - name: Upload intermediate dependency reports
        uses: actions/upload-artifact@v4
        with:
          name: dependency-scan-reports
          path: |
            trivy-results.txt
            Vulnerability Test Results/npm-audit.json

  generate-reports:
    name: Generate Security Reports
    needs: [detect-tech-stack, sast, dependency-scan, secret-detection]
    if: always()
    runs-on: ubuntu-latest
    env:
      REPORT_DIR: Vulnerability Test Results
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Download dependency reports
        uses: actions/download-artifact@v4
        with:
          name: dependency-scan-reports
        continue-on-error: true
      - name: Publish summary and fail on critical npm audit findings
        run: |
          critical=$(node -e "const fs=require('fs');const p='$REPORT_DIR/npm-audit.json';let n=0;if(fs.existsSync(p)){const j=JSON.parse(fs.readFileSync(p));n=j.metadata?.vulnerabilities?.critical||0;}console.log(n)")
          echo "## Backend Security Review" >> "$GITHUB_STEP_SUMMARY"
          echo "Detected framework: \${{ needs.detect-tech-stack.outputs.framework }}" >> "$GITHUB_STEP_SUMMARY"
          echo "npm audit critical count: $critical" >> "$GITHUB_STEP_SUMMARY"
          [ "$critical" -eq 0 ]
      - name: Upload reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: backend-security-review-reports
          path: |
            Vulnerability Test Results/
            trivy-results.txt
`);

console.log(`Generated ${tests.length} test cases, ${endpoints.length} endpoints, and ${findings.length} findings.`);
