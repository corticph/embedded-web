# Configuration Migration Guide

This guide shows how to move from the legacy configuration methods to the split configuration API.

Canonical Corti documentation:

- Configuration migration: https://docs.corti.ai/assistant/configuration-migration
- Deprecation timeline: https://docs.corti.ai/assistant/deprecation-timeline

`configure()` and `configureSession()` remain supported until 2026-11-29, but new integrations should use `configureApp()` and `setInteractionOptions()` now. See the canonical deprecation timeline for rollout timing.

## New Methods

Use `configureApp()` for patchable app-level configuration:

```js
await component.configureApp({
  debug: true,
  ui: {
    interactionTitle: true,
    aiChat: true,
    documentFeedback: true,
    navigation: false,
  },
  appearance: {
    primaryColor: "#000000",
  },
  locale: {
    interfaceLanguage: "da",
    dictationLanguage: "da",
    overrides: {
      "assistant.interview.startSession": "Begin Session",
    },
  },
  network: {
    websocketBaseUrl: "wss://example.test",
  },
});
```

For TypeScript consumers, use `ConfigureApplicationPayload` with `configureApp()`. The previously exported `ConfigureAppPayload` name remains available as a deprecated alias for the legacy `configure()` payload shape to avoid breaking existing imports.

Use `setInteractionOptions()` for interaction defaults:

```js
await component.setInteractionOptions({
  mode: {
    fallback: "in-person",
    options: ["in-person", "virtual"],
  },
  spokenLanguage: {
    fallback: "da",
  },
  templates: {
    sources: {
      personal: {
        enabled: true,
      },
    },
    defaultTemplate: {
      behaviour: "fallback",
      template: {
        source: "standard",
        id: "corti-soap",
      },
    },
  },
  documents: {
    actions: {
      sync: false,
    },
  },
});
```

## Mapping From `configure()`

The second column shows the request shape to use in the new method call, not a response path.

| Legacy field                  | New method call                                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| `features.interactionTitle`   | `configureApp({ ui: { interactionTitle: ... } })`                                               |
| `features.aiChat`             | `configureApp({ ui: { aiChat: ... } })`                                                         |
| `features.documentFeedback`   | `configureApp({ ui: { documentFeedback: ... } })`                                               |
| `features.navigation`         | `configureApp({ ui: { navigation: ... } })`                                                     |
| `features.virtualMode: true`  | `setInteractionOptions({ mode: { fallback: "in-person", options: ["in-person", "virtual"] } })` |
| `features.virtualMode: false` | `setInteractionOptions({ mode: { fallback: "in-person", options: ["in-person"] } })`            |
| `features.syncDocumentAction` | `setInteractionOptions({ documents: { actions: { sync: ... } } })`                              |
| `features.templateEditor`     | `setInteractionOptions({ templates: { sources: { personal: { enabled: ... } } } })`             |
| `appearance.primaryColor`     | `configureApp({ appearance: { primaryColor: ... } })`                                           |
| `locale.interfaceLanguage`    | `configureApp({ locale: { interfaceLanguage: ... } })`                                          |
| `locale.dictationLanguage`    | `configureApp({ locale: { dictationLanguage: ... } })`                                          |
| `locale.overrides`            | `configureApp({ locale: { overrides: ... } })`                                                  |
| `network.websocketBaseUrl`    | `configureApp({ network: { websocketBaseUrl: ... } })`                                          |

## Mapping From `configureSession()`

```js
await component.configureSession({
  defaultLanguage: "da",
  defaultOutputLanguage: "da",
  defaultTemplateKey: "corti-soap",
  defaultMode: "in-person",
});
```

Migrate to:

```js
await component.setInteractionOptions({
  mode: {
    fallback: "in-person",
    options: ["in-person", "virtual"],
  },
  spokenLanguage: {
    fallback: "da",
  },
  templates: {
    defaultTemplate: {
      behaviour: "fallback",
      template: {
        source: "standard",
        id: "corti-soap",
      },
    },
  },
});
```

The old configuration resolved the selected template from `defaultTemplateKey` plus `defaultOutputLanguage`. In the new API, pass the fully resolved template id directly. For example, `defaultTemplateKey: "corti-soap"` plus `defaultOutputLanguage: "en"` becomes `template.id: "corti-soap-en"`.
