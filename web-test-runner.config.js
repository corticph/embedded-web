import { playwrightLauncher } from "@web/test-runner-playwright";

const filteredLogs = ["Running in dev mode", "Lit is in dev mode"];

const embeddedIntegrationBaseURL = "https://assistant.integration.corti.app";

const browserProducts = (process.env.EMBEDDED_WEB_TEST_BROWSERS || "chromium")
  .split(",")
  .map(browser => browser.trim())
  .filter(Boolean);

const chromiumChannel = process.env.EMBEDDED_WEB_CHROMIUM_CHANNEL;

const embeddedIntegrationFrameHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Corti Embedded Integration Frame</title>
  </head>
  <body>
    <script>
      const responsePayloads = {
        auth: { user: { id: 'integration-user', email: 'integration@example.test' } },
        createInteraction: {
          id: 'integration-interaction',
          createdAt: '2026-07-09T00:00:00.000Z'
        },
        configureApp: {
          debug: true,
          appearance: { primaryColor: '#0055ff' },
          ui: {
            interactionTitle: true,
            aiChat: true,
            documentFeedback: true,
            navigation: true
          },
          locale: { interfaceLanguage: 'en' },
          network: { websocketBaseUrl: null }
        },
        getStatus: {
          auth: {
            isAuthenticated: true,
            user: { id: 'integration-user', email: 'integration@example.test' }
          },
          currentUrl: '/summary',
          interaction: null
        },
        getTemplates: {
          templates: [
            {
              id: 'integration-template',
              name: 'Integration Template',
              language: { code: 'en', name: 'English' },
              sections: [{ id: 'summary', title: 'Summary' }],
              isCustom: false
            }
          ]
        }
      };

      const postToParent = message => {
        parent.postMessage(message, '*');
      };

      const postReady = () => {
        postToParent({
          type: 'CORTI_EMBEDDED_EVENT',
          version: 'v1',
          event: 'embedded.ready',
          payload: { version: 'v1' },
          confidential: false
        });
      };

      const readyInterval = window.setInterval(postReady, 25);

      window.addEventListener('message', event => {
        window.clearInterval(readyInterval);
        const request = event.data || {};

        postToParent({
          type: 'CORTI_EMBEDDED_EVENT',
          version: 'v1',
          event: 'test.request-received',
          payload: {
            action: request.action,
            payload: request.payload,
            hasRequestId: typeof request.requestId === 'string',
            version: request.version
          },
          confidential: false
        });

        if (request.action === 'navigate') {
          postToParent({
            type: 'CORTI_EMBEDDED_EVENT',
            version: 'v1',
            event: 'embedded.navigated',
            payload: request.payload,
            confidential: false
          });
        }

        postToParent({
          type: 'CORTI_EMBEDDED_RESPONSE',
          version: 'v1',
          action: request.action,
          requestId: request.requestId,
          success: true,
          payload: responsePayloads[request.action] || {}
        });
      });
    </script>
  </body>
</html>`;

function createBrowserLauncher(product) {
  return playwrightLauncher({
    product,
    launchOptions:
      product === "chromium" && chromiumChannel
        ? { channel: chromiumChannel }
        : {},
    createBrowserContext: async ({ browser }) => {
      const context = await browser.newContext();

      await context.route(`${embeddedIntegrationBaseURL}/embedded`, route =>
        route.fulfill({
          status: 200,
          contentType: "text/html",
          body: embeddedIntegrationFrameHtml,
        }),
      );

      return context;
    },
  });
}

export default /** @type {import("@web/test-runner").TestRunnerConfig} */ ({
  /** Test files to run */
  files: ".tmp/test-dist/test/**/*.test.js",

  /** Resolve bare module imports */
  nodeResolve: {
    exportConditions: ["browser", "development"],
  },

  /** Use Playwright Chromium (bundled) so no CHROME_PATH is required */
  browsers: browserProducts.map(createBrowserLauncher),

  coverageConfig: {
    include: ["src/**/*.ts"],
    exclude: [".tmp/test-dist/test/vendor/**"],
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
      if (typeof arg === "string" && filteredLogs.some(l => arg.includes(l))) {
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
