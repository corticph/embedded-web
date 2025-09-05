export interface EmbeddedEvents {
  'auth-changed': {
    accessToken: string;
  };
  'thread-created': {
    threadId: string;
  };
  'messages-cleared': undefined;
  error: {
    message: string;
    error?: unknown;
  };
}
