# Scheduled Deprecations

Use this page to track deprecated Embedded API functionality surfaced by this package.

Canonical Corti documentation:

- Configuration migration: https://docs.corti.ai/assistant/configuration-migration
- Deprecation timeline: https://docs.corti.ai/assistant/deprecation-timeline

Deprecated Embedded API functionality remains functional for the announced migration window. When technically possible, this package also emits `console.warn` messages before shutdown.

## Legacy Embedded Events

- Status: migrate now.
- Announced: 2026-02-20 in Corti Assistant release notes v12.10.0.
- Expected shutdown date: 2026-08-20.
- Required action: update event subscriptions to the current event names and payloads.

When consumer code subscribes to a deprecated DOM event name, this package emits a `console.warn` that points to the canonical deprecation timeline. Dispatching a deprecated event from the embedded app does not warn unless the host application subscribed to that deprecated event surface.

## Embedded Configuration API Split

- Status: plan migration.
- Announced: 2026-05-29 in Corti Assistant release notes v12.18.0.
- Expected shutdown date: 2026-11-29.
- Required action: move app-level settings to `configureApp()` and interaction-level options to `setInteractionOptions()`.

Use these methods for new integrations:

- `configureApp()` for app-level settings that may be patched multiple times.
- `setInteractionOptions()` for interaction/session defaults that should be set before the user starts or opens an interaction.

The legacy methods remain available during the deprecation period:

- `configure()` still sends the legacy `configure` action to the embedded app.
- `configureSession()` still sends the legacy `configureSession` action to the embedded app.

When either legacy method is called, the web component emits a `console.warn` in addition to preserving existing behavior.
