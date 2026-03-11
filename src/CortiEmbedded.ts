/* eslint-disable no-console */
import type { Corti } from '@corti/sdk';
import { html, LitElement, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import type {
  AuthResponse,
  AddFactsPayload,
  ConfigureAppPayload,
  ConfigureAppResponse,
  ConfigureSessionPayload,
  CreateInteractionPayload,
  CreateInteractionResponse,
  NavigatePayload,
  SetCredentialsPayload,
  CortiEmbeddedAPI,
  InteractionDetails,
  SessionConfig,
  User,
  GetStatusResponse,
  GetTemplatesResponse,
  KeycloakTokenResponse,
} from './types';
import { baseStyles } from './styles/base.js';
import { containerStyles } from './styles/container-styles.js';
import { validateAndNormalizeBaseURL } from './utils/baseUrl.js';
import { buildEmbeddedUrl, isRealEmbeddedLoad } from './utils/embedUrl.js';
import { formatError } from './utils/errorFormatter.js';
import {
  PostMessageHandler,
  type PostMessageHandlerCallbacks,
} from './utils/PostMessageHandler.js';

export class CortiEmbedded extends LitElement implements CortiEmbeddedAPI {
  static styles = [baseStyles, containerStyles];

  @property({ type: String, reflect: true })
  visibility = 'hidden';

  @property({ type: String, reflect: true })
  baseURL!: string;

  private postMessageHandler: PostMessageHandler | null = null;

  private normalizedBaseURL: string | null = null;

  connectedCallback() {
    super.connectedCallback();

    // Ensure baseURL is provided
    if (!this.baseURL) {
      this.dispatchErrorEvent({
        message: 'baseURL is required',
      });
      return;
    }

    // Validate and normalize the initial baseURL early (fail fast)
    try {
      this.normalizedBaseURL = validateAndNormalizeBaseURL(this.baseURL);
    } catch (error) {
      this.dispatchErrorEvent({
        message: (error as Error).message || 'Invalid baseURL',
      });
      // Dispatch the error event rather than throwing so consumers can handle it
      // via the 'error' event listener without wrapping connectedCallback in try/catch.
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

    if (iframe?.contentWindow) {
      const callbacks: PostMessageHandlerCallbacks = {
        onEvent: event => {
          this.dispatchEmbeddedEvent(event.name, event.payload);
        },
        onError: error => {
          this.dispatchErrorEvent(error);
        },
      };

      this.postMessageHandler = new PostMessageHandler(iframe, callbacks);
    } else {
      this.dispatchErrorEvent({
        message: 'No iframe or contentWindow available',
      });
    }
  }

  private dispatchPublicEvent(event: string, data: unknown) {
    this.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  private dispatchEmbeddedEvent(rawEventName: string, payload: unknown) {
    if (rawEventName !== 'ready' && rawEventName !== 'loaded') {
      // Pass all other events through as raw DOM events for direct listeners.
      this.dispatchPublicEvent(rawEventName, payload);
    }

    // Always forward through the generic 'embedded-event' stream so consumers
    // can observe the full event feed regardless of event name.
    this.dispatchPublicEvent('embedded-event', {
      name: rawEventName,
      payload,
    });
  }

  private dispatchErrorEvent(error: {
    message: string;
    code?: string;
    details?: unknown;
  }) {
    this.dispatchPublicEvent('error', error);
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
      this.dispatchErrorEvent({
        message: `Failed to setup PostMessageHandler on iframe load: ${error}`,
      });
    }
  }

  private getIframe(): HTMLIFrameElement | null {
    return this.shadowRoot?.querySelector('iframe') || null;
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);
    if (changedProps.has('baseURL')) {
      // Tear down the existing handler; the new one is created in handleIframeLoad
      if (this.postMessageHandler) {
        this.postMessageHandler.destroy();
        this.postMessageHandler = null;
      }

      // Validate the new URL
      try {
        this.normalizedBaseURL = validateAndNormalizeBaseURL(this.baseURL);
      } catch (error) {
        this.normalizedBaseURL = null;
        const iframe = this.getIframe();
        if (iframe) {
          iframe.setAttribute('src', 'about:blank');
        }
        this.dispatchErrorEvent({
          message: (error as Error).message || 'Invalid baseURL',
        });
        return;
      }

      // Update the iframe to the new URL
      const iframe = this.getIframe();
      if (iframe) {
        const expected = buildEmbeddedUrl(this.normalizedBaseURL);
        if (iframe.getAttribute('src') !== expected) {
          iframe.setAttribute('src', expected);
          iframe.setAttribute(
            'allow',
            `microphone ${expected}; camera ${expected}; device-capture ${expected}; display-capture ${expected}`,
          );
        }
      }
    }
  }

  // Public API Implementation

  /**
   * Authenticate with the Corti system
   * @param credentials Authentication credentials
   * @returns Promise resolving to user information
   */
  async auth(credentials: KeycloakTokenResponse): Promise<User> {
    if (!this.postMessageHandler) {
      throw new Error('Component not ready');
    }

    try {
      const payload: KeycloakTokenResponse = {
        access_token: credentials.access_token,
        token_type: credentials.token_type,
        expires_at: credentials.expires_at,
        expires_in: credentials.expires_in,
        refresh_expires_in: credentials.refresh_expires_in,
        refresh_token: credentials.refresh_token,
        id_token: credentials.id_token,
        'not-before-policy': credentials['not-before-policy'],
        session_state: credentials.session_state,
        scope: credentials.scope,
        profile: credentials.profile,
      };

      const response = await this.postMessageHandler.postMessage({
        type: 'CORTI_EMBEDDED',
        version: 'v1',
        action: 'auth',
        payload,
      });

      if (response.success && response.payload) {
        return (response.payload as AuthResponse).user;
      }
      throw new Error(response.error);
    } catch (error) {
      const formattedError = formatError(error, 'Authentication failed');
      throw new Error(JSON.stringify(formattedError));
    }
  }

  /**
   * Create a new interaction
   * @param encounter Encounter request data
   * @returns Promise resolving to interaction details
   */
  async createInteraction(
    encounter: CreateInteractionPayload,
  ): Promise<InteractionDetails> {
    if (!this.postMessageHandler) {
      throw new Error('Component not ready');
    }

    try {
      const response = await this.postMessageHandler.postMessage({
        type: 'CORTI_EMBEDDED',
        version: 'v1',
        action: 'createInteraction',
        payload: encounter,
      });

      if (response.success && response.payload) {
        const result = response.payload as CreateInteractionResponse;
        return {
          id: result.id,
          createdAt: result.createdAt,
        };
      }
      throw new Error(response.error);
    } catch (error) {
      const formattedError = formatError(error, 'Failed to create interaction');
      throw new Error(JSON.stringify(formattedError));
    }
  }

  /**
   * Configure the current session
   * @param config Session configuration
   * @returns Promise that resolves when configuration is complete
   */
  async configureSession(config: SessionConfig): Promise<void> {
    if (!this.postMessageHandler) {
      throw new Error('Component not ready');
    }

    try {
      const payload: ConfigureSessionPayload = {
        defaultLanguage: config.defaultLanguage,
        defaultOutputLanguage: config.defaultOutputLanguage,
        defaultTemplateKey: config.defaultTemplateKey,
        defaultMode: config.defaultMode,
      };

      await this.postMessageHandler.postMessage({
        type: 'CORTI_EMBEDDED',
        version: 'v1',
        action: 'configureSession',
        payload,
      });
    } catch (error) {
      const formattedError = formatError(error, 'Failed to configure session');
      throw new Error(JSON.stringify(formattedError));
    }
  }

  /**
   * Add facts to the current session
   * @param facts Array of facts to add
   * @returns Promise that resolves when facts are added
   */
  async addFacts(facts: Corti.FactsCreateInput[]): Promise<void> {
    if (!this.postMessageHandler) {
      throw new Error('Component not ready');
    }

    try {
      const payload: AddFactsPayload = { facts };
      await this.postMessageHandler.postMessage({
        type: 'CORTI_EMBEDDED',
        version: 'v1',
        action: 'addFacts',
        payload,
      });
    } catch (error) {
      const formattedError = formatError(error, 'Failed to add facts');
      throw new Error(JSON.stringify(formattedError));
    }
  }

  /**
   * Navigate to a specific path within the embedded UI
   * @param path Path to navigate to
   * @returns Promise that resolves when navigation is complete
   */
  async navigate(path: string): Promise<void> {
    if (!this.postMessageHandler) {
      throw new Error('Component not ready');
    }

    try {
      const payload: NavigatePayload = { path };
      await this.postMessageHandler.postMessage({
        type: 'CORTI_EMBEDDED',
        version: 'v1',
        action: 'navigate',
        payload,
      });
    } catch (error) {
      const formattedError = formatError(error, 'Failed to navigate');
      throw new Error(JSON.stringify(formattedError));
    }
  }

  /**
   * Start recording
   * @returns Promise that resolves when recording starts
   */
  async startRecording(): Promise<void> {
    if (!this.postMessageHandler) {
      throw new Error('Component not ready');
    }

    try {
      await this.postMessageHandler.postMessage({
        type: 'CORTI_EMBEDDED',
        version: 'v1',
        action: 'startRecording',
        payload: {},
      });
    } catch (error) {
      const formattedError = formatError(error, 'Failed to start recording');
      throw new Error(JSON.stringify(formattedError));
    }
  }

  /**
   * Stop recording
   * @returns Promise that resolves when recording stops
   */
  async stopRecording(): Promise<void> {
    if (!this.postMessageHandler) {
      throw new Error('Component not ready');
    }

    try {
      await this.postMessageHandler.postMessage({
        type: 'CORTI_EMBEDDED',
        version: 'v1',
        action: 'stopRecording',
        payload: {},
      });
    } catch (error) {
      const formattedError = formatError(error, 'Failed to stop recording');
      throw new Error(JSON.stringify(formattedError));
    }
  }

  /**
   * Get current component status
   * @returns Promise resolving to current status
   */
  async getStatus(): Promise<GetStatusResponse> {
    if (!this.postMessageHandler) {
      return {
        auth: {
          isAuthenticated: false,
          user: undefined,
        },
        currentUrl: '',
        interaction: null,
      };
    }

    try {
      const response = await this.postMessageHandler.postMessage({
        type: 'CORTI_EMBEDDED',
        version: 'v1',
        action: 'getStatus',
        payload: {},
      });

      if (response.success && response.payload) {
        return response.payload as GetStatusResponse;
      }
      throw new Error(response.error);
    } catch (error) {
      const formattedError = formatError(error, 'Failed to get status');
      throw new Error(JSON.stringify(formattedError));
    }
  }

  /**
   * Configure the component
   * @param config Component configuration
   * @returns Promise that resolves when configuration is applied
   */
  async configure(config: ConfigureAppPayload): Promise<ConfigureAppResponse> {
    if (!this.postMessageHandler) {
      throw new Error('Component not ready');
    }

    try {
      const response = await this.postMessageHandler.postMessage({
        type: 'CORTI_EMBEDDED',
        version: 'v1',
        action: 'configure',
        payload: config,
      });

      if (response.success && response.payload) {
        return response.payload as ConfigureAppResponse;
      }
      throw new Error(response.error);
    } catch (error) {
      const formattedError = formatError(
        error,
        'Failed to configure component',
      );
      throw new Error(JSON.stringify(formattedError));
    }
  }

  /**
   * Set authentication credentials without triggering auth flow
   * @param credentials Authentication credentials to store
   * @returns Promise that resolves when credentials are set
   */
  async setCredentials(credentials: SetCredentialsPayload): Promise<void> {
    if (!this.postMessageHandler) {
      throw new Error('Component not ready');
    }

    try {
      if (!credentials.password) {
        throw new Error('Password is required');
      }
      await this.postMessageHandler.postMessage({
        type: 'CORTI_EMBEDDED',
        version: 'v1',
        action: 'setCredentials',
        payload: credentials,
      });
    } catch (error) {
      const formattedError = formatError(error, 'Failed to set credentials');
      throw new Error(JSON.stringify(formattedError));
    }
  }

  /**
   * Show the embedded UI
   */
  show(): void {
    this.visibility = 'visible';
  }

  /**
   * Hide the embedded UI
   */
  hide(): void {
    this.visibility = 'hidden';
  }

  /**
   * Get templates
   */
  async getTemplates(): Promise<GetTemplatesResponse> {
    if (!this.postMessageHandler) {
      throw new Error('Component not ready');
    }

    try {
      const response = await this.postMessageHandler.postMessage({
        type: 'CORTI_EMBEDDED',
        version: 'v1',
        action: 'getTemplates',
      });

      if (response.success && response.payload) {
        return response.payload as GetTemplatesResponse;
      }
      throw new Error(response.error);
    } catch (error) {
      const formattedError = formatError(error, 'Failed to get templates');
      throw new Error(JSON.stringify(formattedError));
    }
  }

  /**
   * Check the current status of the iframe and PostMessageHandler
   * Useful for debugging
   * @deprecated Use getStatus() instead
   */
  getDebugStatus() {
    const iframe = this.getIframe();
    return {
      ready: iframe?.contentDocument?.readyState === 'complete',
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
    // Use the pre-validated normalizedBaseURL so render() never throws.
    // normalizedBaseURL is set in connectedCallback (before first render) and
    // kept up to date by updated() on each baseURL change.
    if (!this.normalizedBaseURL) {
      return html``;
    }

    return html`
      <iframe
        src=${buildEmbeddedUrl(this.normalizedBaseURL)}
        title="Corti Embedded UI"
        sandbox=${'allow-forms allow-modals allow-scripts allow-same-origin' as any}
        allow="microphone *; camera *; device-capture *; display-capture *"
        @load=${(event: Event) => this.handleIframeLoad(event)}
        @unload=${() => this.postMessageHandler?.destroy()}
        style=${this.visibility === 'hidden'
        ? 'display: none;'
        : 'display: block;'}
      ></iframe>
    `;
  }
}
