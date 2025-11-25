import { html, LitElement, PropertyValues } from 'lit';
import { type Corti } from '@corti/sdk';
import { property } from 'lit/decorators.js';
import { baseStyles } from './styles/base.js';
import { PostMessageHandler } from './utils/PostMessageHandler.js';
import {
  AuthPayload,
  ConfigureSessionPayload,
  EmbeddedAction,
  EmbeddedRequest,
  EmbeddedResponse,
  AddFactsPayload,
  NavigatePayload,
} from './api_types.js';
import { containerStyles } from './styles/container-styles.js';
import { EventDispatcher } from './services/EventDispatcher.js';
import { validateAndNormalizeBaseURL } from './utils/baseUrl.js';
import { buildEmbeddedUrl, isRealEmbeddedLoad } from './utils/embedUrl.js';

export class CortiEmbedded extends LitElement {
  static styles = [baseStyles, containerStyles];

  @property({ type: String, reflect: true })
  visibility = 'hidden';

  @property({ type: String })
  baseURL = 'https://assistant.eu.corti.app';

  private postMessageHandler: PostMessageHandler | null = null;

  private normalizedBaseURL: string | null = null;

  connectedCallback() {
    super.connectedCallback();
    // Validate and normalize the initial baseURL early (fail fast)
    try {
      this.normalizedBaseURL = validateAndNormalizeBaseURL(this.baseURL);
    } catch (error) {
      EventDispatcher.dispatchEvent('error', {
        message: (error as Error).message || 'Invalid baseURL',
        error,
      });
      throw error;
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.postMessageHandler) {
      this.postMessageHandler.destroy();
      this.postMessageHandler = null;
    }
  }

  private async setupPostMessageHandler() {
    // Prevent multiple setups
    if (this.postMessageHandler) {
      return;
    }

    const iframe = this.getIframe();

    if (iframe && iframe.contentWindow) {
      this.postMessageHandler = new PostMessageHandler(iframe);
    } else {
      EventDispatcher.dispatchEvent('error', {
        message: 'No iframe or contentWindow available',
      });
    }
  }

  private isRealIframeLoad(iframe: HTMLIFrameElement): boolean {
    const src = iframe.getAttribute('src') || '';
    if (!this.normalizedBaseURL) return false;
    return isRealEmbeddedLoad(src, this.normalizedBaseURL);
  }

  private async handleIframeLoad(event: Event) {
    const iframe = event.target as HTMLIFrameElement | null;
    if (!iframe) {
      return;
    }
    // Only initialize on real URL load, ignore about:blank
    if (!this.isRealIframeLoad(iframe)) {
      return;
    }
    try {
      await this.setupPostMessageHandler();
    } catch (error) {
      EventDispatcher.dispatchEvent('error', {
        message: 'Failed to setup PostMessageHandler on iframe load',
        error,
      });
    }
  }

  private getIframe(): HTMLIFrameElement | null {
    return this.shadowRoot?.querySelector('iframe') || null;
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);
    if (changedProps.has('baseURL')) {
      // Validate baseURL and normalize; fail fast on invalid input
      try {
        this.normalizedBaseURL = validateAndNormalizeBaseURL(this.baseURL);
      } catch (error) {
        // Tear down and clear iframe to avoid keeping an old origin active
        if (this.postMessageHandler) {
          this.postMessageHandler.destroy();
          this.postMessageHandler = null;
        }
        const iframe = this.getIframe();
        if (iframe) {
          iframe.setAttribute('src', 'about:blank');
        }
        EventDispatcher.dispatchEvent('error', {
          message: (error as Error).message || 'Invalid baseURL',
          error,
        });
        return;
      }
      // Tear down existing handler and re-point iframe to new URL
      if (this.postMessageHandler) {
        this.postMessageHandler.destroy();
        this.postMessageHandler = null;
      }
      const iframe = this.getIframe();
      if (iframe) {
        const expected = this.normalizedBaseURL
          ? buildEmbeddedUrl(this.normalizedBaseURL)
          : '';
        if (iframe.getAttribute('src') !== expected) {
          iframe.setAttribute('src', expected);
        }
      }
    }
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
    if (!this.postMessageHandler) {
      throw new Error('PostMessageHandler not ready');
    }
    return this.postMessageHandler.postMessage(message, timeout);
  }

  /**
   * Helper method to send an auth message
   * @param payload - Auth payload
   * @returns Promise that resolves with the auth response
   */
  async auth(payload: AuthPayload): Promise<EmbeddedResponse> {
    if (!this.postMessageHandler) {
      throw new Error('PostMessageHandler not ready');
    }
    return this.postMessageHandler.auth(payload);
  }

  /**
   * Helper method to send a custom message
   * @param action - Action to perform
   * @param payload - Message payload
   * @returns Promise that resolves with the response
   */
  async sendMessage(
    action: EmbeddedAction,
    payload: unknown,
  ): Promise<EmbeddedResponse> {
    if (!this.postMessageHandler) {
      throw new Error('PostMessageHandler not ready');
    }
    return this.postMessageHandler.sendMessage(action, payload);
  }

  /**
   * Helper method to configure a session
   * @param payload - Session configuration payload
   * @returns Promise that resolves with the configuration response
   */
  async configureSession(
    payload: ConfigureSessionPayload,
  ): Promise<EmbeddedResponse> {
    if (!this.postMessageHandler) {
      throw new Error('PostMessageHandler not ready');
    }
    return this.postMessageHandler.configureSession(payload);
  }

  /**
   * Helper method to add facts to the session
   * @param payload - Facts payload
   * @returns Promise that resolves with the add facts response
   */
  async addFacts(payload: AddFactsPayload): Promise<EmbeddedResponse> {
    if (!this.postMessageHandler) {
      throw new Error('PostMessageHandler not ready');
    }
    return this.postMessageHandler.addFacts(payload);
  }

  /**
   * Helper method to navigate to a specific path
   * @param payload - Navigation payload
   * @returns Promise that resolves with the navigation response
   */
  async navigate(payload: NavigatePayload): Promise<EmbeddedResponse> {
    if (!this.postMessageHandler) {
      throw new Error('PostMessageHandler not ready');
    }
    return this.postMessageHandler.navigate(payload);
  }

  /**
   * Helper method to create a new interaction
   * @param payload - Interaction creation payload
   * @returns Promise that resolves with the interaction creation response
   */
  async createInteraction(
    payload: Corti.InteractionsEncounterCreateRequest,
  ): Promise<EmbeddedResponse> {
    if (!this.postMessageHandler) {
      throw new Error('PostMessageHandler not ready');
    }
    return this.postMessageHandler.createInteraction(payload);
  }

  /**
   * Check the current status of the iframe and PostMessageHandler
   * Useful for debugging
   */
  getStatus() {
    const iframe = this.getIframe();
    return {
      iframeExists: !!iframe,
      iframeSrc: iframe?.src,
      iframeContentWindow: !!iframe?.contentWindow,
      iframeContentDocument: !!iframe?.contentDocument,
      iframeReadyState: iframe?.contentDocument?.readyState,
      postMessageHandlerExists: !!this.postMessageHandler,
      postMessageHandlerReady: this.postMessageHandler?.ready || false,
      baseURL: this.baseURL,
    };
  }

  render() {
    // Build a spec-compliant allow attribute value. Quote the origin URLs, but not 'self'.
    const allowedOrigin = this.normalizedBaseURL
      ? `"${new URL(this.normalizedBaseURL).origin}"`
      : "'self'";
    const allow = `microphone 'self' ${allowedOrigin} ; camera 'self' ${allowedOrigin} ; device-capture 'self' ${allowedOrigin}`;
    return html`
      <iframe
        src=${this.normalizedBaseURL
          ? buildEmbeddedUrl(this.normalizedBaseURL)
          : ''}
        title="Corti Embedded UI"
        sandbox=${'allow-forms allow-modals allow-scripts allow-same-origin' as any}
        allow=${allow}
        @load=${(event: Event) => this.handleIframeLoad(event)}
        @unload=${() => this.postMessageHandler?.destroy()}
        style=${this.visibility === 'hidden'
          ? 'display: none;'
          : 'display: block;'}
      ></iframe>
    `;
  }

  show() {
    this.visibility = 'visible';
  }

  hide() {
    this.visibility = 'hidden';
  }
}
