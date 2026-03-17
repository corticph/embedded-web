import type { AnyEvent, EmbeddedRequest, EmbeddedResponse } from '../types';

export interface PostMessageHandlerCallbacks {
  onEvent?: (event: { name: string; payload: unknown }) => void;
  onError?: (error: {
    message: string;
    code?: string;
    details?: unknown;
  }) => void;
  /**
   * Default timeout in milliseconds for postMessage requests.
   * @default 10000
   */
  requestTimeout?: number;
}

interface PostMessageHandlerError {
  message: string;
  code?: string;
  details?: unknown;
}

interface PendingRequest {
  resolve: (value: EmbeddedResponse) => void;
  reject: (reason: PostMessageHandlerError) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isEmbeddedEventMessage(value: unknown): value is AnyEvent {
  return (
    isRecord(value) &&
    value.type === 'CORTI_EMBEDDED_EVENT' &&
    typeof value.event === 'string'
  );
}

function isEmbeddedResponseMessage(value: unknown): value is EmbeddedResponse {
  return (
    isRecord(value) &&
    value.type === 'CORTI_EMBEDDED_RESPONSE' &&
    typeof value.action === 'string' &&
    typeof value.requestId === 'string' &&
    typeof value.success === 'boolean'
  );
}

export class PostMessageHandler {
  private pendingRequests = new Map<string, PendingRequest>();

  private messageListener: ((event: MessageEvent) => void) | null = null;

  private iframe: HTMLIFrameElement;

  private isReady = false;

  private _protocolVersion: string | null = null;

  private static readonly SUPPORTED_PROTOCOL_VERSION = 'v1';

  private readonly requestTimeout: number;

  private callbacks: PostMessageHandlerCallbacks;

  constructor(
    iframe: HTMLIFrameElement,
    callbacks: PostMessageHandlerCallbacks = {},
  ) {
    this.iframe = iframe;
    this.callbacks = callbacks;
    this.requestTimeout = callbacks.requestTimeout ?? 10000;
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
      if (isEmbeddedEventMessage(data)) {
        this.handleEvent(data);
        return;
      }

      // Check if this is a response to a pending request
      if (
        isEmbeddedResponseMessage(data) &&
        this.pendingRequests.has(data.requestId)
      ) {
        this.handleResponse(data);
      }
    };

    window.addEventListener('message', this.messageListener);
  }

  private handleEvent(eventData: AnyEvent): void {
    const eventType = eventData.event;
    const { payload } = eventData;

    // Only 'embedded.ready' signals that the iframe is ready to receive messages
    if (eventType === 'embedded.ready') {
      this.isReady = true;

      // Store and validate the protocol version from the ready payload
      const version =
        isRecord(payload) && typeof payload.version === 'string'
          ? payload.version
          : undefined;
      if (typeof version === 'string') {
        this._protocolVersion = version;
        if (version !== PostMessageHandler.SUPPORTED_PROTOCOL_VERSION) {
          this.callbacks.onError?.({
            message: `Protocol version mismatch: host supports '${PostMessageHandler.SUPPORTED_PROTOCOL_VERSION}', iframe reported '${version}'. Some features may not work correctly.`,
          });
        }
      }
    }

    if (eventType === 'error.triggered') {
      const errorPayload =
        payload && typeof payload === 'object'
          ? (payload as Record<string, unknown>)
          : undefined;
      const payloadMessage =
        errorPayload && typeof errorPayload.message === 'string'
          ? errorPayload.message
          : undefined;
      const payloadCode =
        errorPayload && typeof errorPayload.code === 'string'
          ? errorPayload.code
          : undefined;

      this.callbacks.onError?.({
        message:
          payloadMessage ||
          (typeof payload === 'string'
            ? payload
            : 'Embedded event reported an error'),
        code: payloadCode,
        details: eventData,
      });
      return;
    }

    this.callbacks.onEvent?.({
      name: eventType,
      payload,
    });
  }

  private handleResponse(data: EmbeddedResponse): void {
    const pendingRequest = this.pendingRequests.get(data.requestId);
    if (pendingRequest) {
      const { resolve, reject } = pendingRequest;
      this.pendingRequests.delete(data.requestId);

      if (data.success === false || data.error) {
        const error = {
          message: data.error || 'Request failed',
          code: data.errorCode,
          details: data.errorDetails,
        };
        this.callbacks.onError?.(error);
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
  }

  /**
   * Update callbacks after construction
   */
  updateCallbacks(callbacks: PostMessageHandlerCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Whether the iframe has signaled it is ready to receive postMessages
   */
  get ready(): boolean {
    return this.isReady;
  }

  /**
   * The protocol version reported by the iframe in its 'embedded.ready' event,
   * or null if the version was not included in the ready payload.
   */
  get protocolVersion(): string | null {
    return this._protocolVersion;
  }

  /**
   * Wait for the iframe to signal readiness via the 'embedded.ready' event.
   * @param timeout - Optional timeout in milliseconds (default: 30000ms)
   */
  async waitForReady(timeout = 30000): Promise<void> {
    if (this.isReady) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let readyListener: (event: MessageEvent) => void = () => { };

      function cleanup() {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
        window.removeEventListener('message', readyListener);
      }

      // Create a one-time listener for the ready event
      readyListener = (event: MessageEvent) => {
        if (
          event.source === this.iframe.contentWindow &&
          event.origin === this.getTrustedOrigin() &&
          event.data?.type === 'CORTI_EMBEDDED_EVENT' &&
          event.data.event === 'embedded.ready'
        ) {
          cleanup();
          resolve();
        }
      };

      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Timeout waiting for iframe to be ready'));
      }, timeout);

      window.addEventListener('message', readyListener);
    });
  }

  /**
   * Sends a postMessage to the iframe and returns a Promise that resolves with the response.
   * @param message - The message to send
   * @param timeout - Optional timeout in milliseconds. Defaults to the requestTimeout set at construction.
   */
  async postMessage(
    message: Omit<EmbeddedRequest, 'requestId'>,
    timeout?: number,
  ): Promise<EmbeddedResponse> {
    if (!this.iframe.contentWindow) {
      throw new Error('Iframe not ready');
    }

    // Ensure the iframe has signaled readiness before sending
    await this.waitForReady();

    const { contentWindow } = this.iframe;
    const requestId = PostMessageHandler.generateRequestId();
    const effectiveTimeout = timeout ?? this.requestTimeout;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }, effectiveTimeout);

      this.pendingRequests.set(requestId, {
        resolve: value => {
          clearTimeout(timeoutId);
          resolve(value);
        },
        reject: reason => {
          clearTimeout(timeoutId);
          reject(reason);
        },
      });

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

  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Derive the trusted origin from the iframe src (constructed from baseURL).
   * Returns null if it cannot be determined.
   */
  private getTrustedOrigin(): string | null {
    try {
      const src = this.iframe.getAttribute('src') || this.iframe.src;
      if (!src) return null;
      const url = new URL(src, window.location.href);
      return url.origin;
    } catch {
      return null;
    }
  }
}
