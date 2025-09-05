# Corti LLM Chat Agent SDK - Developer Guide

This document contains all the developer-specific information for working with the Corti LLM Chat Agent SDK project.

## Installation

```bash
# Install dependencies
npm install

# Build the component
npm run build

# Start the demo server
npm run dev
```

## Linting and formatting

To scan the project for linting and formatting errors, run

```bash
npm run lint
```

To automatically fix linting and formatting errors, run

```bash
npm run format
```

## Testing with Web Test Runner

To execute a single test run:

```bash
npm run test
```

To run the tests in interactive watch mode run:

```bash
npm run test:watch
```

## Demoing with Storybook

To run a local instance of Storybook for your component, run

```bash
npm run storybook
```

To build a production version of Storybook, run

```bash
npm run storybook:build
```

## Tooling configs

For most of the tools, the configuration is in the `package.json` to reduce the amount of files in your project.

If you customize the configuration a lot, you can consider moving them to individual files.

## Local Demo with `web-dev-server`

```bash
npm start
```

To run a local development server that serves the basic demo located in `demo/index.html`

## Project Structure

The project is built with:
- **Lit** - For the web components
- **Zustand** - For state management
- **TypeScript** - For type safety
- **Web Test Runner** - For testing
- **Storybook** - For component development and documentation
- **ESLint & Prettier** - For code quality and formatting

## Development Workflow

1. **Install dependencies**: `npm install`
2. **Start development server**: `npm run dev`
3. **Make changes** to the source code in `src/`
4. **Build the component**: `npm run build`
5. **Run tests**: `npm run test`
6. **Format code**: `npm run format`
7. **Lint code**: `npm run lint`

## Building for Production

```bash
npm run build
```

This will create the distributable files in the `dist/` directory.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test`
5. Format code: `npm run format`
6. Submit a pull request
