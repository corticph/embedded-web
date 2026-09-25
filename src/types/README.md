# Shared types for the Corti Embedded Web component

Changes here are synced to the corticph/embedded-web repository by the `sync-embedded-types` workflow.

We have a single type that is currently generated for consistency.

When using the generated type, please ensure that it is not edited manually, but always generated and in sync with the original schema used/defined elsewhere in the application.

To regenerate the type, run the following command:

```bash
bun embedded-types:generate
```
