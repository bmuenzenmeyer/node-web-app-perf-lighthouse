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

1. Configure the constants at the top of the file:
   ```js
   const HOST = 'http://localhost';
   const PORT = ':3000';
   const PATH = '/en';
   const VERBOSE = true;
   const INSTALL = true;
   const FILESIZE = true;
   const WRITE = true;
   const SLEEP = 10000;
   ```
1. Run `node audit.mjs`
1. Review `./audit-report.json`

## Sample Output:

```json
{
  "vulnerabilities": 22,
  "prodNodeModulesCount": 233,
  "prodNodeModulesSize": "40M",
  "allNodeModulesCount": 728,
  "allNodeModulesSize": "130M",
  "installTimeResult": "7s",
  "lightHouseTestResults": {
    "first-contentful-paint": "2.3 s",
    "largest-contentful-paint": "2.3 s",
    "first-meaningful-paint": "2.3 s",
    "speed-index": "2.3 s",
    "total-blocking-time": "0 ms",
    "max-potential-fid": "20 ms",
    "cumulative-layout-shift": "0.041",
    "interactive": "2.3 s",
    "server-response-time": "Root document took 10 ms",
    "bootup-time": "0.1 s"
  },
  "diagnosticPropertyResults": {
    "numRequests": 12,
    "numScripts": 3,
    "numStylesheets": 3,
    "numFonts": 1,
    "totalByteWeight": 75421
  },
  "elapsedBuildTime": "9.873"
}
```
