# React Component Usage

This document shows how to use the `CortiEmbeddedReact` component in your React application.

## Installation

```bash
npm install @corti/embedded-web react
```

## Basic Usage

```tsx
import React, { useRef } from 'react';
import {
  CortiEmbeddedReact,
  type CortiEmbeddedReactRef,
  type EmbeddedEventData,
} from '@corti/embedded-web/react';

function MyApp() {
  const cortiRef = useRef<CortiEmbeddedReactRef>(null);

  const handleReady = () => {
    console.log('Corti embedded component is ready!');
  };

  const handleAuthChanged = (
    event: CustomEvent<EmbeddedEventData['auth-changed']>,
  ) => {
    console.log('User authenticated:', event.detail.user);
  };

  const handleError = (event: CustomEvent<EmbeddedEventData['error']>) => {
    console.error('Corti error:', event.detail.message);
  };

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <CortiEmbeddedReact
        ref={cortiRef}
        baseURL="https://assistant.eu.corti.app"
        visibility="visible"
        onReady={handleReady}
        onAuthChanged={handleAuthChanged}
        onError={handleError}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
```

## Using API Methods

The React component exposes all the same API methods as the web component through a ref:

```tsx
import React, { useRef, useCallback } from 'react';
import {
  CortiEmbeddedReact,
  type CortiEmbeddedReactRef,
} from '@corti/embedded-web/react';

function AdvancedExample() {
  const cortiRef = useRef<CortiEmbeddedReactRef>(null);

  const handleAuth = useCallback(async () => {
    if (!cortiRef.current) return;

    try {
      const user = await cortiRef.current.auth({
        access_token: 'your-access-token',
        token_type: 'Bearer',
        // ... other credential fields
      });
      console.log('Authenticated user:', user);
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  }, []);

  const handleCreateInteraction = useCallback(async () => {
    if (!cortiRef.current) return;

    try {
      const interaction = await cortiRef.current.createInteraction({
        assignedUserId: 'user-123',
        encounter: {
          ...
        }
        // ... other interaction data
      });
      console.log('Created interaction:', interaction);
    } catch (error) {
      console.error('Failed to create interaction:', error);
    }
  }, []);

  const handleStartRecording = useCallback(async () => {
    if (!cortiRef.current) return;

    try {
      await cortiRef.current.startRecording();
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={handleAuth}>Authenticate</button>
        <button onClick={handleCreateInteraction}>Create Interaction</button>
        <button onClick={handleStartRecording}>Start Recording</button>
      </div>

      <CortiEmbeddedReact
        ref={cortiRef}
        baseURL="https://assistant.eu.corti.app"
        visibility="visible"
        style={{ width: '100%', height: '500px', border: '1px solid #ccc' }}
      />
    </div>
  );
}
```

## Event Handling

All events are passed as native DOM events. For events that carry data, you need to cast them to `CustomEvent` and access the `detail` property.

```tsx
import type {
  EmbeddedEventData,
  CortiEmbeddedReactProps,
} from '@corti/embedded-web/react';

// Method 1: Use the typed event handlers interface
const handleInteractionCreated: CortiEmbeddedReactProps['onInteractionCreated'] =
  event => {
    console.log('New interaction:', event.detail.interaction);
  };

const handleDocumentGenerated: CortiEmbeddedReactProps['onDocumentGenerated'] =
  event => {
    console.log('Document generated:', event.detail.document);
  };

// Method 2: Cast events manually
const handleAuthChanged = (event: Event) => {
  const customEvent = event as CustomEvent<EmbeddedEventData['auth-changed']>;
  console.log('User authenticated:', customEvent.detail.user);
};

// Use in component
<CortiEmbeddedReact
  onInteractionCreated={handleInteractionCreated} // NOT IMPLEMENTED YET
  onDocumentGenerated={handleDocumentGenerated}
  onAuthChanged={handleAuthChanged} // NOT IMPLEMENTED YET
  // ... other props
/>;
```

## Available Events

- `onReady`: Component is ready to receive API calls
- `onAuthChanged`: User authentication status changed // Limited access - NOT IMPLEMENTED
- `onInteractionCreated`: New interaction was created // Limited access - NOT IMPLEMENTED
- `onRecordingStarted`: Recording started
- `onRecordingStopped`: Recording stopped
- `onDocumentGenerated`: Document was generated
- `onDocumentUpdated`: Document was updated
- `onNavigationChanged`: Navigation within the embedded UI changed // Limited access - NOT IMPLEMENTED
- `onError`: An error occurred

## API Methods

All API methods return Promises and can be called through the component ref:

- `auth(credentials)`: Authenticate with Corti
- `createInteraction(payload)`: Create a new interaction
- `configureSession(config)`: Configure the session
- `addFacts(facts)`: Add facts to the session
- `navigate(path)`: Navigate within the embedded UI
- `startRecording()`: Start recording
- `stopRecording()`: Stop recording
- `getStatus()`: Get current component status
- `configure(config)`: Configure the component
- `setCredentials(credentials)`: Set credentials without triggering auth
- `show()`: Show the embedded UI
- `hide()`: Hide the embedded UI

## TypeScript Support

The component is fully typed. Import the types you need:

```tsx
import {
  CortiEmbeddedReact,
  type CortiEmbeddedReactRef,
  type CortiEmbeddedReactProps,
  type CortiEmbeddedEventHandlers,
  type EmbeddedEventData,
} from '@corti/embedded-web/react';
```

## Differences from Web Component

The React component provides the same functionality as the web component but with:

- React-style props instead of attributes
- Ref-based API access instead of direct method calls
- Standard React event handling patterns
- Full TypeScript integration
- React lifecycle compatibility
