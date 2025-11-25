# Advanced messaging and low-level API

Use this guide when you need full control over postMessage or want to send custom actions not covered by the named helpers shown in the README.

## postMessage (full control)

Use this to control the entire envelope or customize timeouts.

```javascript
const response = await component.postMessage(
  {
    type: 'CORTI_EMBEDDED',
    version: 'v1',
    action: 'custom_action',
    payload: { key: 'value' }
  },
  30000 // optional timeout override (ms)
);
```

When to use:
- You need a custom timeout.
- You want to explicitly set `type`/`version` (future compatibility).
- You already have a fully formed message envelope.

## sendMessage (quick custom action)

Convenience for ad-hoc actions. Automatically sets `type: 'CORTI_EMBEDDED'` and `version: 'v1'`.

```javascript
const customResponse = await component.sendMessage('action_name', {
  data: 'custom data',
  timestamp: new Date().toISOString()
});
```

When to use:
- You just need to send an `action` + `payload` without managing the envelope.
- You’re fine with default timeout (10s).

## Message Format

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

## Error Handling

All methods return Promises that can be handled with try/catch:

```javascript
try {
  const response = await component.auth({ token: 'invalid' });
  console.log('Success:', response.payload);
} catch (error) {
  console.error('Authentication failed:', error.message);
}
```

## Timeouts

By default, all requests have a 10-second timeout. You can customize this when using `postMessage`:

```javascript
const response = await component.postMessage(message, 30000); // 30 second timeout
```

---

For common actions, prefer the named helpers documented in the README’s “API methods (recommended)” section.

