import "./corti-embedded.js";

export { CortiEmbedded } from "./CortiEmbedded.js";

// Export React components
export * from "./react/index.js";

// Export hand-owned public types only. The src/types folder is generated.
export * from "./public-types.js";

// Export PostMessageHandler types for advanced usage
export type { PostMessageHandlerCallbacks } from "./utils/PostMessageHandler.js";
