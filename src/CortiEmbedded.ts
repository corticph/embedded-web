import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { baseStyles } from './styles/base.js';
import { PostMessageHandler } from './utils/PostMessageHandler.js';
import { EmbeddedRequest, EmbeddedResponse } from './api_types.js';
import { containerStyles } from './styles/container-styles.js';
import { EventDispatcher } from './services/EventDispatcher.js';


export class CortiEmbedded extends LitElement {
  static styles = [baseStyles, containerStyles];

  @property({ type: String })
  visibility = 'hidden';

  @property({ type: String })
  baseURL = 'https://assistant.eu.corti.app';

  private postMessageHandler: PostMessageHandler | null = null;

  connectedCallback() {
    super.connectedCallback();
    // The PostMessageHandler will be set up when the iframe loads
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
      iframe.setAttribute('src', `${this.baseURL}/embedded`);
    } else {
      EventDispatcher.dispatchEvent('error', {
        message: 'No iframe or contentWindow available',
      });
    }
  }

  private getIframe(): HTMLIFrameElement | null {
    return this.shadowRoot?.querySelector('iframe') || null;
  }

  /**
   * Sends a postMessage to the iframe and returns a Promise that resolves with the response
   * @param message - The message to send
   * @param timeout - Optional timeout in milliseconds (default: 10000ms)
   * @returns Promise that resolves with the response
   */
  async postMessage(message: Omit<EmbeddedRequest, 'requestId'>, timeout = 10000): Promise<EmbeddedResponse> {
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
  async authenticate(payload: any): Promise<EmbeddedResponse> {
    if (!this.postMessageHandler) {
      throw new Error('PostMessageHandler not ready');
    }
    return this.postMessageHandler.authenticate(payload);
  }

  /**
   * Helper method to send a custom message
   * @param action - Action to perform
   * @param payload - Message payload
   * @returns Promise that resolves with the response
   */
  async sendMessage(action: string, payload: any): Promise<EmbeddedResponse> {
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
  async configureSession(payload: any): Promise<EmbeddedResponse> {
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
  async addFacts(payload: any): Promise<EmbeddedResponse> {
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
  async navigate(payload: any): Promise<EmbeddedResponse> {
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
  async createInteraction(payload: any): Promise<EmbeddedResponse> {
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
      baseURL: this.baseURL
    };
  }

  render() {
    return html`
      <iframe
        src=""
        title="Corti Embedded"
        sandbox=${"allow-forms allow-modals allow-scripts allow-same-origin" as any}
        allow="microphone *; camera *; device-capture *"
        @load=${async () => {
          try {
            await this.setupPostMessageHandler();
          } catch (error) {
            EventDispatcher.dispatchEvent('error', {
              message: 'Failed to setup PostMessageHandler on iframe load',
              error,
            });
          }
        }}
        style=${this.visibility === 'hidden' ? 'display: none;' : 'display: block;'}
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
