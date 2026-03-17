import { CortiEmbedded } from "./CortiEmbedded.js";
import type { CortiEmbeddedAPI, CortiEmbeddedWindowAPI } from "./types/api.js";

// Register the main component
if (!customElements.get("corti-embedded")) {
  customElements.define("corti-embedded", CortiEmbedded);
}

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
