import { EmbeddedEvents } from '../types.js';

/**
 * Service for dispatching typed custom events
 */
export class EventDispatcherClass {
  private element: HTMLElement;

  constructor() {
    // Create an element to use for dispatching events
    this.element = document.createElement('div');
  }

  /**
   * Dispatch a typed custom event
   */
  public dispatchEvent<K extends keyof EmbeddedEvents>(
    eventName: K,
    detail: EmbeddedEvents[K],
  ): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    this.element.dispatchEvent(
      new CustomEvent(eventName, {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Add an event listener for a custom event
   */
  public addEventListener<K extends keyof EmbeddedEvents>(
    eventName: K,
    callback: (event: CustomEvent<EmbeddedEvents[K]>) => void,
  ): () => void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return () => {};
    }

    // Type assertion for the callback
    const typedCallback = callback as any;
    this.element.addEventListener(eventName, typedCallback);

    // Return a function to remove the listener
    return () => {
      this.element.removeEventListener(eventName, typedCallback);
    };
  }
}

// Create and export a singleton instance
export const EventDispatcher = new EventDispatcherClass();
