# Corti Embedded Web Component

A web component and React component library that provides an embedded interface for Corti AI assistant.

## Features

- **Web Component & React**: Available as both a native web component and React component
- **Show/Hide**: Control the visibility of the chat interface
- **Authentication Support**: Built-in authentication message handling
- **TypeScript Support**: Full TypeScript definitions included

## Installation

```bash
npm install @corti/embedded-web
```

## Usage

### Web Component

```html
<corti-embedded
  id="corti-component"
  base-url="https://assistant.eu.corti.app" <!-- REQUIRED -->
></corti-embedded>
```

```js
const myComponent = document.getElementById('corti-component');

const userResponse = await myComponent.auth({...});

const interaction = await myComponent.createInteraction({
  "assignedUserId": null,
  "encounter": {
    "identifier": `encounter-${Date.now()}`,
    "status": "planned",
    "type": "first_consultation",
    "period": {
      "startedAt": "2025-11-11T16:14:59.923Z"
    }
  }
});

await myComponent.configureSession({"defaultTemplateKey": "soap_note"});
await myComponent.addFacts([{"text": "Chest pain", "group": "other"}]);
await myComponent.navigate('/interactions/123');
await myComponent.show()
```

#### Generic Event Listener (Web Component)

Use `embedded-event` as the canonical event stream for web component integrations.

- Event detail shape is `{ name: string; payload: unknown }`.
- Full event catalog and payload details are documented at:
  - https://docs.corti.ai/assistant/events

```js
myComponent.addEventListener('embedded-event', event => {
  const { detail } = event;
  console.log(detail.name, detail.payload);
});
```

### React Component

```tsx
import React, { useRef } from 'react';
import {
  CortiEmbeddedReact,
  type CortiEmbeddedReactRef,
  useCortiEmbeddedApi,
  useCortiEmbeddedStatus,
} from '@corti/embedded-web/react';

function App() {
  const cortiRef = useRef<CortiEmbeddedReactRef>(null);
  const api = useCortiEmbeddedApi(cortiRef);
  const { status } = useCortiEmbeddedStatus(cortiRef);

  const handleReady = () => {
    console.log('Corti component is ready!');
  };

  const handleEvent = (
    event: CustomEvent<{ name: string; payload: unknown }>,
  ) => {
    console.log('Event name:', event.detail.name);
    console.log('Event payload:', event.detail.payload);
  };

  const handleAuth = async () => {
    try {
      const user = await api.auth({
        access_token: 'your-token',
        token_type: 'Bearer',
        // ... rest of the token response
      });
      console.log('Authenticated:', user);

      await api.configureSession({ defaultTemplateKey: 'soap_note' });
      await api.createInteraction({
        encounter: {
          identifier: `encounter-${Date.now()}`,
          status: 'planned',
          type: 'first_consultation',
          period: { startedAt: new Date().toISOString() },
        },
      });
    } catch (error) {
      console.error('Auth failed:', error);
    }
  };

  return (
    <div style={{ height: '100vh' }}>
      <button onClick={handleAuth}>Authenticate</button>

      <CortiEmbeddedReact
        ref={cortiRef}
        baseURL="https://assistant.eu.corti.app" // REQUIRED
        visibility="visible"
        onReady={handleReady}
        onEvent={handleEvent}
        onError={event => console.error('Embedded error:', event.detail)}
        style={{ width: '100%', height: '500px' }}
      />

      <pre>{JSON.stringify(status, null, 2)}</pre>
    </div>
  );
}
```

### Show/Hide the Component

```javascript
const component = document.getElementById('corti-component');

// Show the chat interface
component.show();

// Hide the chat interface
component.hide();
```

### API methods (recommended)

- Use these named helpers for common tasks. They provide clearer intent and sensible defaults.

#### auth

Authentication is required before using the embedded app. The payload passed to
`component.auth(...)` should come directly from your identity provider token
response (for example, Keycloak/OIDC token endpoint response).

- API details and payload shape: https://docs.corti.ai/assistant/api-reference#auth
- End-to-end authentication guidance: https://docs.corti.ai/assistant/authentication

Use user-based authentication (OAuth2/OIDC). Client-credentials-only flows are
not supported for the embedded app.

```javascript
const authResponse = await component.auth({
  // Use the full token response from your IdP
  access_token: 'YOUR_JWT',
  token_type: 'Bearer',
  // include other token fields from your provider response (expires_in, refresh_token, etc.)
  ...
});
```

#### configureSession

```javascript
await component.configureSession({
  defaultLanguage: 'en',
  defaultOutputLanguage: 'en',
  defaultTemplateKey: 'discharge-summary',
  defaultMode: 'virtual',
});
```

#### addFacts

```javascript
await component.addFacts([
    { text: 'Patient reports chest pain', group: 'subjective' },
    { text: 'BP 120/80', group: 'vitals' },
  ],
```

#### navigate

```javascript
await component.navigate('/interactions/123');
```

#### createInteraction

```javascript
const created = await component.createInteraction({
  assignedUserId: null,
  encounter: {
    identifier: 'enc-123',
    status: 'in-progress',
    type: 'consult',
    period: { startedAt: new Date().toISOString() },
    title: 'Visit for cough',
  },
  patient: {
    identifier: 'pat-456',
  },
});
```

#### startRecording / stopRecording

```javascript
await component.startRecording();
// ... later
await component.stopRecording();
```

#### getStatus (debugging)

```javascript
console.log(component.getStatus());
```

## Architecture

The component uses a `PostMessageHandler` utility class that:

- Manages message listeners and cleanup
- Tracks pending requests with unique IDs
- Handles response correlation
- Ensures proper cleanup on component destruction

## React Component Features

The React component (`CortiEmbeddedReact`) is available as an additional export and provides:

- **Hook-based API access**: `useCortiEmbeddedApi(ref)` exposes instance-bound methods (`auth`, `navigate`, `createInteraction`, etc.)
- **Generic event stream**: `onEvent` receives all embedded events as `{ name, payload }`
- **Status hook**: `useCortiEmbeddedStatus(ref)` keeps latest status/reactive state
- **Multi-instance safety**: API methods are scoped to the ref you pass
- **React Props**: Standard React props like `className`, `style`, etc.

### React Component Import

```tsx
import {
  CortiEmbeddedReact,
  CortiEmbedded, // Web component also available
  type CortiEmbeddedReactRef,
  useCortiEmbeddedApi,
  useCortiEmbeddedStatus,
} from '@corti/embedded-web/react';
```

### Event Listener Setup

- Use `onEvent` for all embedded events.
- Event detail shape is `{ name: string; payload: unknown }`.
- Full event catalog and payload details are documented at:
  - https://docs.corti.ai/assistant/events

```tsx
<CortiEmbeddedReact
  baseURL="https://assistant.eu.corti.app"
  onEvent={event => {
    console.log(event.detail.name, event.detail.payload);
  }}
  onReady={() => console.log('Ready')}
  onError={event => console.error(event.detail)}
/>
```

### API Methods (React)

Use the API hook with the same component ref:

```tsx
import React, { useRef } from 'react';
import {
  CortiEmbeddedReact,
  type CortiEmbeddedReactRef,
  useCortiEmbeddedApi,
} from '@corti/embedded-web/react';

function Example() {
  const ref = useRef<CortiEmbeddedReactRef>(null);
  const api = useCortiEmbeddedApi(ref);

  const run = async () => {
    await api.auth({ access_token: '...', token_type: 'Bearer' });
    const created = await api.createInteraction({ encounter: { ... } });
    await api.navigate(`/session/${created.id}`);
  };

  return (
    <>
      <button onClick={() => void run()}>Run</button>
      <CortiEmbeddedReact ref={ref} baseURL="https://assistant.eu.corti.app" />
    </>
  );
}
```

For detailed React usage examples, see [docs/react-usage.md](./docs/react-usage.md).

## Package Structure

- **Default export**: Web component only (`dist/web-bundle.js`)
- **React export**: Web component + React component (`@corti/embedded-web/react`)
- **No dependencies**: Web component bundle has zero external dependencies
- **Peer dependencies**: React components require React as peer dependency only
