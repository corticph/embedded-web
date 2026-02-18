import './corti-embedded.js';

export { CortiEmbedded } from './CortiEmbedded.js';

// Export React components
export * from './react/index.js';

// Export clean public types only
export * from './types/index.js';

// Export PostMessageHandler types for advanced usage
export type { PostMessageHandlerCallbacks } from './utils/PostMessageHandler.js';
