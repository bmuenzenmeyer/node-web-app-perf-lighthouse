import { execSync, spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { hrtime } from 'node:process';

const exec = command => execSync(command, { encoding: 'utf-8' });

/* TODO: MAKE ENV OR ARGS */
const HOST = 'http://localhost';
const PORT = 3000;
const PATH = '/en';
const VERBOSE = true;
const INSTALL = true;
const FILESIZE = false;
const WRITE = true;
const SLEEP = 10000;

const log = msg => {
  if (VERBOSE) {
    console.log(msg);
  }
};

const sleep = ms => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

const parseHrtimeToSeconds = hrtime => {
  const seconds = (hrtime[0] + hrtime[1] / 1e9).toFixed(3);
  return seconds;
};

const sha = exec('git rev-parse --short HEAD');
log(`auditing site at SHA ${sha.trim()}...`);

if (INSTALL) {
  log('cleaning slate...');
  exec('rm -rf node_modules report.json');

  log('installing production dependencies only...');

  exec('npm ci --omit=dev');
}

log('auditing dependencies...');

const auditResult = JSON.parse(
  exec('npm audit --json=true --audit-level=none')
);

log('count of vulnerabilities...');
const vulnerabilities = auditResult.metadata.vulnerabilities.total;
log(vulnerabilities);

log('count of prod node_modules...');
const prodNodeModulesCount = auditResult.metadata.dependencies.prod;
log(prodNodeModulesCount);

let prodNodeModulesSize;
if (FILESIZE) {
  log('reading size of prod node_modules...');
  prodNodeModulesSize = exec('du -sh node_modules');

  log(prodNodeModulesSize.split('node_modules')[0]);
}

let installTimeResult;
let allNodeModulesCount;
let allNodeModulesSize;
if (INSTALL) {
  console.log('installing all dependencies...');
  const installTimeResultMatch = exec('npm ci').match(/(\d+s)/);
  installTimeResult = installTimeResultMatch[0];

  log('count of all node_modules...');
  allNodeModulesCount = auditResult.metadata.dependencies.total;
  log(allNodeModulesCount);

  log('install time...');
  log(installTimeResult);

  if (FILESIZE) {
    log('reading size of node_modules...');
    allNodeModulesSize = exec('du -sh node_modules');

    log(allNodeModulesSize.split('node_modules')[0]);
  }
}

log('starting app... check if this is the right command');
const devServerProcess = spawn('npm', ['run serve'], { shell: true });

devServerProcess.on('error', err => {
  console.error(err);
});

log('waiting for app to start...');
await sleep(SLEEP);

log('running lighthouse...');
exec(
  `npx lighthouse ${HOST}:${PORT}${PATH} --output=json --output-path ./report.json --quiet`
);

const lighthouseResults = JSON.parse(readFileSync('./report.json'));

const lighthouseTests = [
  'first-contentful-paint',
  'largest-contentful-paint',
  'first-meaningful-paint',
  'speed-index',
  'total-blocking-time',
  'max-potential-fid',
  'cumulative-layout-shift',
  'interactive',
  'server-response-time',
  'bootup-time',
];

const lightHouseTestResults = {};

lighthouseTests.forEach(test => {
  const result = lighthouseResults.audits[test];
  log(`${test}...`);
  log(result.displayValue);
  lightHouseTestResults[test] = result.displayValue;
});

const lighthouseDiagnostics =
  lighthouseResults.audits.diagnostics.details.items[0];

const diagnosticProperties = [
  'numRequests',
  'numScripts',
  'numStylesheets',
  'numFonts',
  'totalByteWeight',
];

const diagnosticPropertyResults = {};

diagnosticProperties.forEach(diag => {
  const result = lighthouseDiagnostics[diag];
  log(`${diag}...`);
  log(result);
  diagnosticPropertyResults[diag] = result;
});

console.log('stopping app...');
devServerProcess.kill();

log('running a cold build...');
const buildStartTime = hrtime();
exec('npm run build --quiet');
const elapsedBuildTime = parseHrtimeToSeconds(hrtime(buildStartTime));
log(elapsedBuildTime);

/*
 WRITE RESULTS SOMEWHERE TO LATER AGGREGATE
*/

const report = {
  vulnerabilities,
  prodNodeModulesCount,
  prodNodeModulesSize,
  allNodeModulesCount,
  allNodeModulesSize,

  installTimeResult,
  ...{ lightHouseTestResults },
  ...{ diagnosticPropertyResults },
  elapsedBuildTime,
};

if (WRITE) {
  writeFileSync(`./audit-report.json`, JSON.stringify(report));
}

process.exit(0);
