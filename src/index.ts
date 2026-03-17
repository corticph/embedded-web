import "./corti-embedded.js";
import { CortiEmbeddedAPI, CortiEmbeddedWindowAPI } from "./types/api.js";

export { CortiEmbedded } from "./CortiEmbedded.js";

// Export React components
export * from "./react/index.js";

// Export clean public types only
export * from "./types/index.js";

// Export PostMessageHandler types for advanced usage
export type { PostMessageHandlerCallbacks } from "./utils/PostMessageHandler.js";

/**
 * Type representing the corti-embedded custom element in the DOM.
 * When this package is installed, tag-name based APIs like
 * document.querySelector('corti-embedded') and document.createElement('corti-embedded')
 * are automatically typed via HTMLElementTagNameMap. Other lookups such as getElementById
 * still return HTMLElement | null and require a cast or narrowing to CortiEmbeddedElement.
 */
export type CortiEmbeddedElement = HTMLElement & CortiEmbeddedAPI;

// Extend Window interface
declare global {
  interface Window {
    CortiEmbedded?: CortiEmbeddedWindowAPI;
  }
  interface HTMLElementTagNameMap {
    "corti-embedded": CortiEmbeddedElement;
  }
}
