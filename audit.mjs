#! /usr/bin/env node

console.log('web-app-perf-lighthouse...')

import 'dotenv/config'
import { execSync, spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { hrtime } from 'node:process';

const exec = (command) => execSync(command, { encoding: 'utf-8' });

const LH_HOST = process.env.LH_HOST;
const LH_PORT = process.env.LH_PORT;
const LH_PATH = process.env.LH_PATH;
const VERBOSE = process.env.VERBOSE === 'true';
const INSTALL = process.env.INSTALL === 'true';
const FILESIZE = process.env.FILESIZE === 'true';
const WRITE = process.env.WRITE === 'true';
const MS_WAIT_BEFORE_LIGHTHOUSE = process.env.MS_WAIT_BEFORE_LIGHTHOUSE || 10000;

const log = (msg) => {
  if (VERBOSE) {
    console.log(msg);
  }
};

const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const parseHrtimeToSeconds = (hrtime) => {
  const seconds = (hrtime[0] + hrtime[1] / 1e9).toFixed(3);
  return seconds;
};

async function main() {

  console.log(`testing ${LH_HOST}${LH_PORT}${LH_PATH}`)

  const sha = exec('git rev-parse --short HEAD');
  log(`auditing site at SHA ${sha.trim()}...`);

  let prodInstallTimeResult
  if (INSTALL) {
    log('cleaning slate...');
    exec('rm -rf node_modules report.json');

    log('installing production dependencies only...');

    const installTimeResultMatch = exec('npm ci --omit=dev').match(/(\d+s)/);
    prodInstallTimeResult = installTimeResultMatch[0];
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

  devServerProcess.on('error', (err) => {
    console.error(err);
  });

  log('waiting for app to start...');
  await sleep(MS_WAIT_BEFORE_LIGHTHOUSE);

  log('running lighthouse...');
  exec(
    `npx lighthouse ${LH_HOST}${LH_PORT}${LH_PATH} --output=json --output-path ./report.json --quiet`
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

  lighthouseTests.forEach((test) => {
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

  diagnosticProperties.forEach((diag) => {
    const result = lighthouseDiagnostics[diag];
    log(`${diag}...`);
    log(result);
    diagnosticPropertyResults[diag] = result;
  });

  console.log('stopping app...');
  devServerProcess.kill();

  exec('rm -rf ./.next')

  log('running a cold build...');
  const buildStartTime = hrtime();
  exec('npm run build --quiet');
  const elapsedBuildTime = parseHrtimeToSeconds(hrtime(buildStartTime));
  log(elapsedBuildTime);

  exec('rm -rf ./.next')

  log('running a cold deploy...');
  const deployStartTime = hrtime();
  exec('npm run deploy --quiet');
  const elapsedDeployTime = parseHrtimeToSeconds(hrtime(deployStartTime));
  log(elapsedDeployTime);

  /*
  WRITE RESULTS SOMEWHERE TO LATER AGGREGATE
  */

  const report = {
    vulnerabilities,
    prodNodeModulesCount,
    prodNodeModulesSize,
    allNodeModulesCount,
    allNodeModulesSize,
    prodInstallTimeResult,
    installTimeResult,
    ...{ lightHouseTestResults },
    ...{ diagnosticPropertyResults },
    elapsedBuildTime,
    elapsedDeployTime,
  };

  if (WRITE) {
    writeFileSync(`./audit-report-${sha.trim()}.json`, JSON.stringify(report, null, 2));
  }

  process.exit(0);
}

try {
  await main();
} catch (err) {
  process.stderr.write('Error: ' + err.message + '\n');
  process.exit(1);
}
