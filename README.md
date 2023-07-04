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

1. Install lighthouse globally.

```
npm install -g lighthouse
```

2. Drop `audit.mjs` into your web app.

## Usage

1. Confgiure the constants at the top of the file:
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
  "vulnerabilities": 0,
  "prodNodeModulesCount": 432,
  "allNodeModulesCount": 2309,
  "installTimeResult": "44s",
  "lightHouseTestResults": {
    "first-contentful-paint": "0.9 s",
    "largest-contentful-paint": "15.1 s",
    "first-meaningful-paint": "0.9 s",
    "speed-index": "9.2 s",
    "total-blocking-time": "1,230 ms",
    "max-potential-fid": "1,350 ms",
    "cumulative-layout-shift": "0.005",
    "interactive": "14.9 s",
    "server-response-time": "Root document took 5,580 ms",
    "bootup-time": "1.7 s"
  },
  "diagnosticPropertyResults": {
    "numRequests": 22,
    "numScripts": 9,
    "numStylesheets": 1,
    "numFonts": 2,
    "totalByteWeight": 2270185
  },
  "elapsedBuildTime": "17.304"
}
```
