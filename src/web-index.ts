import './corti-embedded.js';

export { CortiEmbedded } from './CortiEmbedded.js';

// Export clean public types only
export type {
  AuthCredentials,
  ComponentStatus,
  ConfigureAppPayload,
  ConfigureAppResponsePayload,
  CortiEmbeddedAPI,
  EmbeddedEventData,
  EventListener,
  Fact,
  InteractionDetails,
  SessionConfig,
  User,
} from './public-types.js';
