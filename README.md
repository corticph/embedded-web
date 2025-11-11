# Corti Embedded Web Component

A web component that provides an embedded chat interface for Corti AI assistant.

## Features

- **Show/Hide**: Control the visibility of the chat interface
- **PostMessage Communication**: Send messages to and receive responses from the embedded iframe
- **Authentication Support**: Built-in authentication message handling
- **Custom Messages**: Send custom actions and payloads
- **Response Tracking**: Automatic request/response correlation with timeouts

## Usage

### Basic Setup

```html
<corti-embedded id="corti-component" base-url="https://assistant.eu.corti.app"></corti-embedded>
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

#### authenticate

```javascript
const authResponse = await component.authenticate({
  // Example: Keycloak-style token + mode
  access_token: 'YOUR_JWT',
  token_type: 'Bearer',
  mode: 'stateful'
});
```

#### configureSession

```javascript
await component.configureSession({
  defaultLanguage: 'en',
  defaultOutputLanguage: 'en',
  defaultTemplateKey: 'discharge-summary',
  defaultMode: 'virtual'
});
```

#### addFacts

```javascript
await component.addFacts({
  facts: [
    { text: 'Patient reports chest pain', group: 'subjective' },
    { text: 'BP 120/80', group: 'vitals' }
  ]
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
    title: 'Visit for cough'
  },
  patient: {
    identifier: 'pat-456'
  }
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

### Advanced

For low-level postMessage usage, quick `sendMessage`, message format, error handling, and timeout details, see:

- Advanced messaging and low-level API: [docs/advanced-messaging.md](./docs/advanced-messaging.md)

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

The built component will be available in the `dist/` directory.
