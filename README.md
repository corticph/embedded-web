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

### PostMessage Communication

The component provides several methods for communicating with the embedded iframe:

#### 1. Generic PostMessage

```javascript
const response = await component.postMessage({
  type: 'CORTI_EMBEDDED',
  version: 'v1',
  action: 'custom_action',
  payload: { key: 'value' }
});
```

#### 2. Authentication

```javascript
const authResponse = await component.authenticate({
  token: 'your-auth-token',
  userId: 'user-123'
});
```

#### 3. Custom Messages

```javascript
const customResponse = await component.sendMessage('action_name', {
  data: 'custom data',
  timestamp: new Date().toISOString()
});
```

### Message Format

All messages follow this structure:

```typescript
interface PostMessageRequest {
  type: string;        // Always 'CORTI_EMBEDDED'
  version: string;     // API version (e.g., 'v1')
  action: string;      // Action to perform
  requestId: string;   // Auto-generated unique ID
  payload: any;        // Message data
}
```

Responses include the same fields plus:

```typescript
interface PostMessageResponse {
  // ... same as request ...
  success?: boolean;   // Whether the request succeeded
  error?: string;      // Error message if failed
}
```

### Error Handling

All postMessage methods return Promises that can be handled with try/catch:

```javascript
try {
  const response = await component.authenticate({ token: 'invalid' });
  console.log('Success:', response.payload);
} catch (error) {
  console.error('Authentication failed:', error.message);
}
```

### Timeouts

By default, all requests have a 10-second timeout. You can customize this:

```javascript
const response = await component.postMessage(message, 30000); // 30 second timeout
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
- Authentication message testing
- Custom message sending
- Real-time message logging
- Status monitoring

## Building

```bash
npm install
npm run build
```

The built component will be available in the `dist/` directory.
