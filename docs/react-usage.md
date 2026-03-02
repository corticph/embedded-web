# React Component Usage

This document shows how to use the `CortiEmbeddedReact` component with the current React API.

## Installation

```bash
npm install @corti/embedded-web
```

## Basic Usage

```tsx
import React, { useRef } from 'react';
import {
  CortiEmbeddedReact,
  type CortiEmbeddedReactRef,
  type CortiEmbeddedEventDetail,
  type CortiEmbeddedErrorDetail,
} from '@corti/embedded-web/react';

function App() {
  const cortiRef = useRef<CortiEmbeddedReactRef>(null);

  const handleEvent = (detail: CortiEmbeddedEventDetail) => {
    console.log(detail.name, detail.payload);
  };

  const handleError = (detail: CortiEmbeddedErrorDetail) => {
    console.error('Embedded error:', detail);
  };

  return (
    <CortiEmbeddedReact
      ref={cortiRef}
      baseURL="https://assistant.eu.corti.app"
      visibility="visible"
      onReady={() => console.log('Corti embedded is ready')}
      onEvent={handleEvent}
      onError={handleError}
      style={{ width: '100%', height: '600px' }}
    />
  );
}
```

## Event Listener Setup

Use `onEvent` as the canonical event listener.

- Event shape: `{ name: string; payload: unknown }`
- This receives all embedded events
- `onReady` is triggered by the raw `embedded.ready` event
- Internal lifecycle events like `ready` and `loaded` are also visible in
  `onEvent` (via `embedded-event`)
- Event names and payload contracts are documented publicly at:
  - https://docs.corti.ai/assistant/events

## Calling API Methods

Use `useCortiEmbeddedApi(ref)` to get stable API methods bound to your component instance.

```tsx
import React, { useRef } from 'react';
import {
  CortiEmbeddedReact,
  type CortiEmbeddedReactRef,
  useCortiEmbeddedApi,
} from '@corti/embedded-web/react';

function ApiExample() {
  const ref = useRef<CortiEmbeddedReactRef>(null);
  const api = useCortiEmbeddedApi(ref);

  const run = async () => {
    await api.auth({
      access_token: '...',
      token_type: 'Bearer',
      mode: 'stateful',
    });
    const created = await api.createInteraction({
      encounter: {
        identifier: `encounter-${Date.now()}`,
        status: 'planned',
        type: 'first_consultation',
        period: { startedAt: new Date().toISOString() },
      },
    });
    await api.configureSession({ defaultTemplateKey: 'soap_note' });
    await api.addFacts([{ text: 'Chest pain', group: 'other' }]);
    await api.navigate(`/session/${created.id}`);
    await api.startRecording();
    await api.stopRecording();
    const status = await api.getStatus();
    await api.configure({ features: { aiChat: false } });
    await api.setCredentials({ password: '...' });
    api.show();
    api.hide();
    console.log(status);
  };

  return (
    <>
      <button onClick={() => void run()}>Run API Flow</button>
      <CortiEmbeddedReact ref={ref} baseURL="https://assistant.eu.corti.app" />
    </>
  );
}
```

This avoids singleton DOM lookup and works correctly with multiple embedded instances.

## Reactive Status Hook

Use `useCortiEmbeddedStatus(ref)` to keep latest status in React state.

The hook returns:

- `status`: latest value from `getStatus()` (or `null` before first fetch)
- `isLoading`: `true` while a status fetch is in progress
- `error`: last fetch error (if any)
- `lastEvent`: latest received embedded event (`{ name, payload }`) used for refresh decisions

How it works:

- It fetches status when mounted (if enabled).
- It listens to `embedded-event` from the mounted component and automatically refreshes status on incoming events.
- Internal filtering avoids refresh recursion from status request/response events.

Suggested usage:

- Mount one `CortiEmbeddedReact` instance and pass the same ref to the hook.
- Use `status` for rendering UI state.
- Keep event-specific logic in `onEvent` while letting the hook handle status synchronization.

```tsx
import React, { useRef } from 'react';
import {
  CortiEmbeddedReact,
  type CortiEmbeddedReactRef,
  useCortiEmbeddedStatus,
} from '@corti/embedded-web/react';

function StatusExample() {
  const ref = useRef<CortiEmbeddedReactRef>(null);
  const { status, isLoading, error, lastEvent } = useCortiEmbeddedStatus(ref);

  return (
    <div>
      <div>Loading: {String(isLoading)}</div>
      <div>Last Event: {lastEvent?.name ?? 'none'}</div>
      <pre>{JSON.stringify(status, null, 2)}</pre>
      {error ? <pre>{String(error)}</pre> : null}
      <CortiEmbeddedReact ref={ref} baseURL="https://assistant.eu.corti.app" />
    </div>
  );
}
```
