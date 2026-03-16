import { playwrightLauncher } from '@web/test-runner-playwright';

const filteredLogs = ['Running in dev mode', 'Lit is in dev mode'];

export default /** @type {import("@web/test-runner").TestRunnerConfig} */ ({
  /** Test files to run */
  files: '.tmp/test-dist/test/**/*.test.js',

  /** Resolve bare module imports */
  nodeResolve: {
    exportConditions: ['browser', 'development'],
  },

  /** Use Playwright Chromium (bundled) so no CHROME_PATH is required */
  browsers: [playwrightLauncher({ product: 'chromium' })],

  coverageConfig: {
    include: ['src/**/*.ts'],
    exclude: ['.tmp/test-dist/test/vendor/**'],
  },

  testRunnerHtml: testFrameworkImport => `<!DOCTYPE html>
    <html>
      <head>
        <script>
          window.process = window.process || { env: {} };
          window.process.env = window.process.env || {};
          window.process.env.NODE_ENV = window.process.env.NODE_ENV || 'development';
        </script>
      </head>
      <body>
        <script type="module" src="${testFrameworkImport}"></script>
      </body>
    </html>`,

  /** Filter out lit dev mode logs */
  filterBrowserLogs(log) {
    for (const arg of log.args) {
      if (typeof arg === 'string' && filteredLogs.some(l => arg.includes(l))) {
        return false;
      }
    }
    return true;
  },

  /** Amount of browsers to run concurrently */
  // concurrentBrowsers: 2,

  /** Amount of test files per browser to test concurrently */
  // concurrency: 1,

  /** Browsers to run tests on */
  // browsers: [
  //   playwrightLauncher({ product: 'chromium' }),
  //   playwrightLauncher({ product: 'firefox' }),
  //   playwrightLauncher({ product: 'webkit' }),
  // ],

  // See documentation for all available options
});
