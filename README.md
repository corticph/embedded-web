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

The package provides a web component by default. For React usage, also install React as a peer dependency:

```bash
npm install react @types/react
```

## Usage

### Web Component

```html
<corti-embedded
  id="corti-component"
  base-url="https://assistant.eu.corti.app"
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
await myComponent.addFacts({"facts": [{"text": "Chest pain", "group": "other"}]});
await myComponent.navigate({ path: `/session/${interaction.id}` });
await myComponent.show()
```

### React Component

```tsx
import React, { useRef } from 'react';
import {
  CortiEmbeddedReact,
  type CortiEmbeddedReactRef,
  type EmbeddedEventData,
} from '@corti/embedded-web/react';

function App() {
  const cortiRef = useRef<CortiEmbeddedReactRef>(null);

  const handleReady = () => {
    console.log('Corti component is ready!');
    cortiRef.current?.show();
  };

  const handleAuthChanged = (event: Event) => {
    const customEvent = event as CustomEvent<EmbeddedEventData['auth-changed']>;
    console.log('User authenticated:', customEvent.detail.user);
  };

  const handleAuth = async () => {
    if (!cortiRef.current) return;

    try {
      const user = await cortiRef.current.auth({
        access_token: 'your-token',
        token_type: 'Bearer',
        // ... other credentials
      });
      console.log('Authenticated:', user);
    } catch (error) {
      console.error('Auth failed:', error);
    }
  };

  return (
    <div style={{ height: '100vh' }}>
      <button onClick={handleAuth}>Authenticate</button>

      <CortiEmbeddedReact
        ref={cortiRef}
        baseURL="https://assistant.eu.corti.app"
        visibility="visible"
        onReady={handleReady}
        onAuthChanged={handleAuthChanged}
        style={{ width: '100%', height: '500px' }}
      />
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

```javascript
const authResponse = await component.auth({
  // Example: Keycloak-style token + mode
  access_token: 'YOUR_JWT',
  token_type: 'Bearer',
  mode: 'stateful',
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
await component.addFacts({
  facts: [
    { text: 'Patient reports chest pain', group: 'subjective' },
    { text: 'BP 120/80', group: 'vitals' },
  ],
});
```

#### navigate

```javascript
await component.navigate({ path: '/interactions/123' });
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
- Provides timeout management
- Ensures proper cleanup on component destruction

## Demo

See `demo/index.html` for a complete working example that demonstrates:

- Component show/hide functionality
- Authentication
- Named API methods
- Advanced custom message sending
- Real-time message logging
- Status monitoring

## Building

```bash
npm install
npm run build
```

The built component will be available in the `dist/` directory:

- `dist/web-bundle.js` - Default web component bundle (no React)
- `dist/bundle.js` - Full bundle including React components (requires React)

## React Component Features

The React component (`CortiEmbeddedReact`) is available as an additional export and provides:

- **All Web Component APIs**: Full access to all methods via ref
- **React Event Handlers**: Native React event handling with proper typing
- **TypeScript Support**: Complete type definitions
- **Forward Ref**: Access to the underlying component instance
- **React Props**: Standard React props like `className`, `style`, etc.

### React Component Import

```tsx
import {
  CortiEmbeddedReact,
  CortiEmbedded, // Web component also available
  type CortiEmbeddedReactProps,
  type CortiEmbeddedReactRef,
} from '@corti/embedded-web/react';
```

### Available Events (React)

- `onReady`: Component is ready to receive API calls
- `onAuthChanged`: User authentication status changed
- `onInteractionCreated`: New interaction was created
- `onRecordingStarted` / `onRecordingStopped`: Recording status changes
- `onDocumentGenerated` / `onDocumentUpdated`: Document events
- `onNavigationChanged`: Navigation within the embedded UI changed
- `onUsage`: Usage data (credits used)
- `onError`: An error occurred

### Event Data Access

Events in React carry data in the `detail` property:

```tsx
import type {
  EmbeddedEventData,
  CortiEmbeddedReactProps,
} from '@corti/embedded-web/react';

// Method 1: Use typed event handler interface
const handleAuthChanged: CortiEmbeddedReactProps['onAuthChanged'] = event => {
  console.log('User:', event.detail.user);
};

// Method 2: Cast events manually
const handleDocumentGenerated = (event: Event) => {
  const customEvent = event as CustomEvent<
    EmbeddedEventData['document-generated']
  >;
  console.log('Document:', customEvent.detail.document);
};
```

For detailed React usage examples, see [docs/react-usage.md](./docs/react-usage.md).

## Package Structure

- **Default export**: Web component only (`dist/web-bundle.js`)
- **React export**: Web component + React component (`@corti/embedded-web/react`)
- **No dependencies**: Web component bundle has zero external dependencies
- **Peer dependencies**: React components require React as peer dependency only

This structure ensures maximum compatibility while keeping the core web component lightweight and framework-agnostic.
