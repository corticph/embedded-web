## AGENTS.md

### Project overview

This repository provides a TypeScript web component (`<corti-embedded>`) for embedding the Corti AI assistant into web apps. It is built with ESM, TypeScript strict mode, and Lit 3. The project ships type declarations and a Custom Elements Manifest for tooling.

### Setup commands

- Install deps: `npm install`
- Start dev server: `npm run start` (opens `demo/` using `@web/dev-server`)
  - Enable HMR: `npm run start -- --hmr`
- Build: `npm run build`
- Bundle (optional ESM bundle): `npm run build:bundle`

### Testing instructions

- Run all tests with coverage: `npm test`
- Watch mode: `npm run test:watch`

Notes:
- Tests run in the browser via `@web/test-runner` against compiled files in `dist/test/**/*.test.js`.
- TypeScript is compiled before tests (`tsc` is part of the scripts).

### Linting and formatting

- Check: `npm run lint`
- Fix: `npm run format`

Rules and tools:
- ESLint config extends `@open-wc` and `prettier` with TypeScript plugin.
- Prettier config uses single quotes and avoids extra parentheses for single-arg arrows.

### Dev environment tips

- The dev server opens `demo/` by default; adjust `web-dev-server.config.js` if needed.
- Re-run `npm run analyze` (or `npm run build`) to refresh `custom-elements.json` for editor/tooling support.
- Source is in `src/`, compiled to `dist/` via `tsc` with `noEmitOnError: true` and `declaration: true`.
- Module system is ESM (`"type": "module"` and Node16 module resolution); avoid CommonJS.

### Release workflow

- Publish sequence: `npm run release`
  - Builds, bundles, analyzes, then runs `npm publish --access public`.
- Ensure `npm run lint` and `npm test` pass locally before publishing.

### Code style

- TypeScript strict mode enabled.
- Prefer functional patterns with Lit; keep side effects minimal in lifecycle methods.
- Prettier: single quotes; arrowParens: `avoid`.
- Avoid unused exports; the linter enforces `@typescript-eslint/no-unused-vars: error`.

### Security and integration notes

- The component communicates with an embedded iframe using `postMessage`. Be mindful of origin checks and only use trusted `base-url` values when integrating in apps.
- The package exposes ESM entry points via `exports` in `package.json`.

### CI-friendly checks

- Build: `npm run build`
- Lint: `npm run lint`
- Tests: `npm test`

Run these before merging PRs and before releases. Fail the pipeline on any errors or coverage regressions.

### Files of interest

- Dev server config: `web-dev-server.config.js`
- Test runner config: `web-test-runner.config.js`
- TypeScript config: `tsconfig.json`
- Entry points: `src/index.ts`, output in `dist/`
- Demo: `demo/`

### Monorepo considerations

This is a single-package repository. If you introduce subpackages later, place an `AGENTS.md` in each package directory; the closest `AGENTS.md` to edited files should be treated as authoritative.

### Agent policy

- Prefer `npm` (not `pnpm` or `yarn`) for all commands.
- When modifying TypeScript, run `npm run build` or `npm test` to surface type errors early.
- After moving files or changing imports, run `npm run lint` to validate ESLint and Prettier rules.

### About this format

This file follows the open guidance for coding agents described at `https://agents.md/`.


