/* eslint-disable no-console */
import type { Corti } from '@corti/sdk';
import { html, LitElement, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import type {
  AddFactsPayload,
  AuthPayload,
  ConfigureAppPayload,
  ConfigureSessionPayload,
  NavigatePayload,
  SetCredentialsPayload,
} from './internal-types.js';
import type {
  AuthCredentials,
  ComponentStatus,
  ConfigureAppResponsePayload,
  CortiEmbeddedAPI,
  EmbeddedEventData,
  InteractionDetails,
  InteractionPayload,
  SessionConfig,
  User,
} from './public-types.js';
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
      throw new Error('baseURL is required');
    }

    // Validate and normalize the initial baseURL early (fail fast)
    try {
      this.normalizedBaseURL = validateAndNormalizeBaseURL(this.baseURL);
    } catch (error) {
      this.dispatchErrorEvent({
        message: (error as Error).message || 'Invalid baseURL',
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

    if (iframe?.contentWindow) {
      const callbacks: PostMessageHandlerCallbacks = {
        onReady: () => {
          this.dispatchPublicEvent('ready', undefined);
        },
        onAuthChanged: payload => {
          this.dispatchPublicEvent('auth-changed', { user: payload.user });
        },
        onInteractionCreated: payload => {
          this.dispatchPublicEvent('interaction-created', {
            interaction: payload.interaction,
          });
        },
        onRecordingStarted: () => {
          this.dispatchPublicEvent('recording-started', undefined);
        },
        onRecordingStopped: () => {
          this.dispatchPublicEvent('recording-stopped', undefined);
        },
        onDocumentGenerated: payload => {
          this.dispatchPublicEvent('document-generated', {
            document: payload.document,
          });
        },
        onDocumentUpdated: payload => {
          this.dispatchPublicEvent('document-updated', {
            document: payload.document,
          });
        },
        onNavigationChanged: payload => {
          this.dispatchPublicEvent('navigation-changed', {
            path: payload.path,
          });
        },
        onUsage: payload => {
          this.dispatchPublicEvent('usage', {
            creditsConsumed: payload.creditsConsumed,
          });
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

  private dispatchPublicEvent<K extends keyof EmbeddedEventData>(
    event: K,
    data: EmbeddedEventData[K],
  ) {
    this.dispatchEvent(new CustomEvent(event, { detail: data }));
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
        this.dispatchErrorEvent({
          message: (error as Error).message || 'Invalid baseURL',
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
  async auth(credentials: AuthCredentials): Promise<User> {
    if (!this.postMessageHandler) {
      throw new Error('Component not ready');
    }

    try {
      const payload: AuthPayload = {
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
        mode: credentials.mode,
      };

      const user = await this.postMessageHandler.auth(payload);
      return user;
    } catch (error) {
      const formattedError = formatError(error, 'Authentication failed');
      this.dispatchErrorEvent(formattedError);
      throw new Error(JSON.stringify(formattedError));
    }
  }

  /**
   * Create a new interaction
   * @param encounter Encounter request data
   * @returns Promise resolving to interaction details
   */
  async createInteraction(
    encounter: InteractionPayload,
  ): Promise<InteractionDetails> {
    if (!this.postMessageHandler) {
      throw new Error('Component not ready');
    }

    try {
      const response =
        await this.postMessageHandler.createInteraction(encounter);
      return {
        id: response.id,
        createdAt: response.createdAt,
      };
    } catch (error) {
      const formattedError = formatError(error, 'Failed to create interaction');
      this.dispatchErrorEvent(formattedError);
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

      await this.postMessageHandler.configureSession(payload);
    } catch (error) {
      const formattedError = formatError(error, 'Failed to configure session');
      this.dispatchErrorEvent(formattedError);
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
      await this.postMessageHandler.addFacts(payload);
    } catch (error) {
      const formattedError = formatError(error, 'Failed to add facts');
      this.dispatchErrorEvent(formattedError);
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
      await this.postMessageHandler.navigate(payload);
    } catch (error) {
      const formattedError = formatError(error, 'Failed to navigate');
      this.dispatchErrorEvent(formattedError);
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
      await this.postMessageHandler.startRecording();
    } catch (error) {
      const formattedError = formatError(error, 'Failed to start recording');
      this.dispatchErrorEvent(formattedError);
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
      await this.postMessageHandler.stopRecording();
    } catch (error) {
      const formattedError = formatError(error, 'Failed to stop recording');
      this.dispatchErrorEvent(formattedError);
      throw new Error(JSON.stringify(formattedError));
    }
  }

  /**
   * Get current component status
   * @returns Promise resolving to current status
   */
  async getStatus(): Promise<ComponentStatus> {
    if (!this.postMessageHandler) {
      return {
        ready: false,
        auth: {
          authenticated: false,
          user: undefined,
        },
        currentUrl: undefined,
        interaction: undefined,
      };
    }

    try {
      return await this.postMessageHandler.getStatus();
    } catch (error) {
      const formattedError = formatError(error, 'Failed to get status');
      this.dispatchErrorEvent(formattedError);
      throw new Error(JSON.stringify(formattedError));
    }
  }

  /**
   * Configure the component
   * @param config Component configuration
   * @returns Promise that resolves when configuration is applied
   */
  async configure(
    config: ConfigureAppPayload,
  ): Promise<ConfigureAppResponsePayload> {
    if (!this.postMessageHandler) {
      throw new Error('Component not ready');
    }

    try {
      return await this.postMessageHandler.configure(config);
    } catch (error) {
      const formattedError = formatError(
        error,
        'Failed to configure component',
      );
      this.dispatchErrorEvent(formattedError);
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
      await this.postMessageHandler.setCredentials(credentials);
    } catch (error) {
      const formattedError = formatError(error, 'Failed to set credentials');
      this.dispatchErrorEvent(formattedError);
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
    // Don't render if baseURL is not provided
    if (!this.baseURL) {
      return html`<div>baseURL is required</div>`;
    }

    return html`
      <iframe
        src=${buildEmbeddedUrl(validateAndNormalizeBaseURL(this.baseURL))}
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
