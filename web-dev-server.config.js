/* eslint-disable no-console */
// eslint-disable-next-line import/no-extraneous-dependencies
import { esbuildPlugin } from '@web/dev-server-esbuild';

/** Use Hot Module replacement by adding --hmr to the start command */
const hmr = process.argv.includes('--hmr');

/** Plugin to log available routes */
function routeLoggerPlugin() {
  return {
    name: 'route-logger',
    serverStart() {
      const baseUrl = `http://localhost:8000`;

      console.log('\n📡 Available routes:');
      console.log(`  • ${baseUrl}/demo/`);
      console.log(`  • ${baseUrl}/demo/typescript-demo.html`);
      console.log('');
    },
  };
}

export default /** @type {import('@web/dev-server').DevServerConfig} */ ({
  watch: !hmr,
  nodeResolve: {
    exportConditions: ['browser', 'development'],
  },

  plugins: [
    routeLoggerPlugin(),

    /** Compile TypeScript on-the-fly for development */
    esbuildPlugin({
      ts: true,
      target: 'auto',
      tsconfig: './tsconfig.json',
    }),
  ],
});
