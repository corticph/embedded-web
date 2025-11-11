import { type Corti } from '@corti/sdk';
import {
  EmbeddedRequest,
  EmbeddedResponse,
  ConfigureSessionPayload,
  NavigatePayload,
  AddFactsPayload,
  AnyEmbeddedEvent,
} from '../api_types.js';


export class PostMessageHandler {
  private pendingRequests = new Map<
    string,
    { resolve: (value: any) => void; reject: (reason: any) => void }
  >();

  private eventListeners = new Map<string, Array<(payload?: any) => void>>();

  private messageListener: ((event: MessageEvent) => void) | null = null;

  private iframe: HTMLIFrameElement;

  private isReady = false;

  constructor(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
    this.setupMessageListener();
  }

  private setupMessageListener() {
    this.messageListener = (event: MessageEvent) => {
      // Only handle messages from our iframe
      if (event.source !== this.iframe.contentWindow) {
        return;
      }

      // Enforce origin to match the trusted iframe origin
      const trustedOrigin = this.getTrustedOrigin();
      if (!trustedOrigin || event.origin !== trustedOrigin) {
        return;
      }

      const { data } = event;

      // Check for Corti embedded events
      if (data?.type === 'CORTI_EMBEDDED_EVENT') {
        this.handleEvent(data);
        return;
      }

      // Check if this is a response to a pending request
      if (data.requestId && this.pendingRequests.has(data.requestId)) {
        this.handleResponse(data);
      }
    };

    window.addEventListener('message', this.messageListener);
  }

  private handleEvent(eventData: AnyEmbeddedEvent): void {
    // Handle ready-like events
    if (eventData.event === 'ready' || (eventData as any).event === 'loaded') {
      this.isReady = true;
    }

    // Notify event listeners
    const listeners = this.eventListeners.get((eventData as any).event);
    if (listeners) {
      listeners.forEach(callback => callback((eventData as any).payload));
    }
  }

  private handleResponse(data: any): void {
    const pendingRequest = this.pendingRequests.get(data.requestId);
    if (pendingRequest) {
      const { resolve, reject } = pendingRequest;
      this.pendingRequests.delete(data.requestId);

      if (data.success === false || data.error) {
        const error = {
          message: data.error || 'Request failed',
          code: data.errorCode,
          details: data.errorDetails
        };
        reject(error);
      } else {
        resolve(data);
      }
    }
  }

  destroy() {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }
    this.pendingRequests.clear();
    this.eventListeners.clear();
  }

  /**
   * Check if the iframe is ready to receive postMessages
   */
  get ready(): boolean {
    return this.isReady;
  }

  /**
   * Wait for the iframe to be ready
   * @param timeout - Optional timeout in milliseconds (default: 30000ms)
   * @returns Promise that resolves when ready
   */
  async waitForReady(timeout = 30000): Promise<void> {

    if (this.isReady) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout waiting for iframe to be ready'));
      }, timeout);

      // Create a one-time listener for the ready event
      const readyListener = (event: MessageEvent) => {

        if (
          event.source === this.iframe.contentWindow &&
          event.origin === this.getTrustedOrigin() &&
          event.data?.type === 'CORTI_EMBEDDED_EVENT' &&
          event.data.event === 'ready'
        ) {
          clearTimeout(timeoutId);
          window.removeEventListener('message', readyListener);
          resolve();
        }
      };

      window.addEventListener('message', readyListener);
    });
  }

  /**
   * Sends a postMessage to the iframe and returns a Promise that resolves with the response
   * @param message - The message to send
   * @param timeout - Optional timeout in milliseconds (default: 10000ms)
   * @returns Promise that resolves with the response
   */
  async postMessage(
    message: Omit<EmbeddedRequest, 'requestId'>,
    timeout = 10000,
  ): Promise<EmbeddedResponse> {
    if (!this.iframe.contentWindow) {
      throw new Error('Iframe not ready');
    }

    // Ensure the iframe has signaled readiness before sending
    await this.waitForReady();

    const { contentWindow } = this.iframe;
    const requestId = PostMessageHandler.generateRequestId();

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }, timeout);

      // Store the promise handlers
      const handlers = {
        resolve: (value: any) => {
          clearTimeout(timeoutId);
          resolve(value);
        },
        reject: (reason: any) => {
          clearTimeout(timeoutId);
          reject(reason);
        },
      };

      this.pendingRequests.set(requestId, handlers);

      // Send the message
      const fullMessage: EmbeddedRequest = {
        ...message,
        requestId,
      };

      const targetOrigin = this.getTrustedOrigin();
      if (!targetOrigin) {
        this.pendingRequests.delete(requestId);
        reject(new Error('Cannot determine trusted origin for postMessage'));
        return;
      }
      contentWindow.postMessage(fullMessage, targetOrigin);
    });
  }

  /**
   * Helper method to send an auth message
   * @param payload - Auth payload
   * @returns Promise that resolves with the auth response
   */
  async authenticate(payload: any): Promise<EmbeddedResponse> {
    return this.postMessage({
      type: 'CORTI_EMBEDDED',
      version: 'v1',
      action: 'auth',
      payload,
    });
  }

  /**
   * Helper method to configure a session
   * @param payload - Session configuration payload
   * @returns Promise that resolves with the configuration response
   */
  async configureSession(
    payload: ConfigureSessionPayload,
  ): Promise<EmbeddedResponse> {
    return this.postMessage({
      type: 'CORTI_EMBEDDED',
      version: 'v1',
      action: 'configureSession',
      payload,
    });
  }

  /**
   * Helper method to navigate to a specific path
   * @param payload - Navigation payload
   * @returns Promise that resolves with the navigation response
   */
  async navigate(payload: NavigatePayload): Promise<EmbeddedResponse> {
    return this.postMessage({
      type: 'CORTI_EMBEDDED',
      version: 'v1',
      action: 'navigate',
      payload,
    });
  }

  /**
   * Helper method to add facts to the session
   * @param payload - Facts payload
   * @returns Promise that resolves with the add facts response
   */
  async addFacts(payload: AddFactsPayload): Promise<EmbeddedResponse> {
    return this.postMessage({
      type: 'CORTI_EMBEDDED',
      version: 'v1',
      action: 'addFacts',
      payload,
    });
  }

  /**
   * Helper method to create a new interaction
   * @param payload - Interaction creation payload
   * @returns Promise that resolves with the interaction creation response
   */
  async createInteraction(
    payload: Corti.InteractionsEncounterCreateRequest,
  ): Promise<EmbeddedResponse> {
    return this.postMessage({
      type: 'CORTI_EMBEDDED',
      version: 'v1',
      action: 'createInteraction',
      payload,
    });
  }

  /**
   * Helper method to start recording
   * @returns Promise that resolves with the start recording response
   */
  async startRecording(): Promise<EmbeddedResponse> {
    return this.postMessage({
      type: 'CORTI_EMBEDDED',
      version: 'v1',
      action: 'startRecording',
      payload: {},
    });
  }

  /**
   * Helper method to stop recording
   * @returns Promise that resolves with the stop recording response
   */
  async stopRecording(): Promise<EmbeddedResponse> {
    return this.postMessage({
      type: 'CORTI_EMBEDDED',
      version: 'v1',
      action: 'stopRecording',
      payload: {},
    });
  }

  /**
   * Helper method to send a custom message
   * @param action - Action to perform
   * @param payload - Message payload
   * @returns Promise that resolves with the response
   */
  async sendMessage(
    action: string,
    payload: any,
  ): Promise<EmbeddedResponse> {
    return this.postMessage({
      type: 'CORTI_EMBEDDED',
      version: 'v1',
      action: action as any,
      payload,
    });
  }

  /**
   * Add an event listener for specific Corti events
   * @param event - Event name to listen for
   * @param callback - Callback function
   */
  on(event: string, callback: (payload?: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove an event listener
   * @param event - Event name
   * @param callback - Callback function to remove
   */
  off(event: string, callback: (payload?: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Derive the trusted origin from the iframe src (constructed from baseURL).
   * Returns null if it cannot be determined.
   */
  private getTrustedOrigin(): string | null {
    try {
      // If iframe.src is relative, URL() will resolve against the current location.
      // Embeds should provide an absolute baseURL; enforcing strict origin here.
      const src = this.iframe.getAttribute('src') || this.iframe.src;
      if (!src) return null;
      const url = new URL(src, window.location.href);
      return url.origin;
    } catch {
      return null;
    }
  }
}
