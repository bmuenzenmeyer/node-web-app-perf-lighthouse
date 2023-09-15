# node-web-app-perf-lighthouse

A script to run your local web app and yield developer experience and user performance data

This script is a drop in to perform the following in most Node.js based-web apps:

- count the vulnerabilities
- count the number of production node_modules
- count the number of total node_modules
- measure the installation time of `npm ci` (no `node_modules`)
- run [lighthouse](https://www.npmjs.com/package/lighthouse) programmatically, using `npm run serve`, gathering standard web vitals data
- reports diagnostic data like the number of request, total bytes, etc
- measures the build time of the app using `npm run build`

> There seem to be a lot of tools that ALMOST do this, but a use case here is to run this vs different SHAs of your own site to compare results over time. No one metric tells the complete story, so be aware of the tradeoffs you make.

## Installation

1. Drop `audit.mjs` into your web app.

## Usage

1. Configure an `.env` file :
   ```env
   LH_HOST = 'http://localhost'
   LH_PORT = ':3000'
   LH_PATH = '/en'
   VERBOSE = true
   INSTALL = true
   FILESIZE = true
   WRITE = true
   MS_WAIT_BEFORE_LIGHTHOUSE = 10000
   ```
1. Run `node audit.mjs`
1. Review `./audit-report-{sha}.json`

## Sample Output:

```json
{
  "vulnerabilities": 0,
  "prodNodeModulesCount": 458,
  "prodNodeModulesSize": "432M",
  "allNodeModulesCount": 2083,
  "allNodeModulesSize": "799M",
  "prodInstallTimeResult": "15s",
  "installTimeResult": "32s",
  "lightHouseTestResults": {
    "first-contentful-paint": "0.8 s",
    "largest-contentful-paint": "13.4 s",
    "first-meaningful-paint": "0.8 s",
    "speed-index": "11.3 s",
    "total-blocking-time": "1,330 ms",
    "max-potential-fid": "1,470 ms",
    "cumulative-layout-shift": "0.005",
    "interactive": "13.1 s",
    "server-response-time": "Root document took 7,260 ms",
    "bootup-time": "1.7 s"
  },
  "diagnosticPropertyResults": {
    "numRequests": 18,
    "numScripts": 8,
    "numStylesheets": 1,
    "numFonts": 1,
    "totalByteWeight": 1955274
  },
  "elapsedBuildTime": "30.774",
  "elapsedDeployTime": "58.139"
}
```
