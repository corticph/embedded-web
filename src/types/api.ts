// Public API types for SDK consumers

import type {
  ConfigureApplicationPayload,
  ConfigurePayload,
} from "./config.js";
import type {
  AuthChangedEventPayload,
  DocumentEventPayload,
  ErrorEventPayload,
  InteractionCreatedEventPayload,
  NavigationChangedEventPayload,
  UsageEventPayload,
} from "./events.js";
import type {
  AddFactsPayload,
  ConfigureSessionPayload,
  CreateInteractionPayload,
  Fact,
  KeycloakTokenResponse,
  NavigatePayload,
  SetInteractionOptionsPayload,
  SetCredentialsPayload,
} from "./payloads.js";
import type { DefaultMode } from "./protocol.js";
import type {
  AuthResponse,
  ConfigureApplicationResponse,
  ConfigureResponse,
  CreateInteractionResponse,
  GetStatusResponse,
  GetTemplatesResponse,
} from "./responses.js";

export type {
  ConfigureAppPayload,
  ConfigureApplicationPayload,
  ConfigurePayload,
} from "./config.js";
// Re-export common types for public API
export type { UserInfo } from "./responses.js";

/**
 * User information returned from authentication
 */
export interface User {
  id: string;
  email: string;
}

/**
 * Details of a created interaction
 */
export interface InteractionDetails {
  id: string;
  createdAt: string;
}

/**
 * Session configuration options
 */
export interface SessionConfig {
  defaultLanguage?: string;
  defaultOutputLanguage?: string;
  defaultTemplateKey?: string;
  defaultMode?: DefaultMode;
}

/**
 * Event data types for component events
 */
export interface EmbeddedEventData {
  ready: undefined;
  "auth-changed": AuthChangedEventPayload;
  "interaction-created": InteractionCreatedEventPayload;
  "recording-started": undefined;
  "recording-stopped": undefined;
  "document-generated": DocumentEventPayload;
  "document-updated": DocumentEventPayload;
  "document-synced": DocumentEventPayload;
  "navigation-changed": NavigationChangedEventPayload;
  usage: UsageEventPayload;
  error: ErrorEventPayload;
}

// Window API Types
export interface CortiEmbeddedV1API {
  auth(payload: KeycloakTokenResponse): Promise<AuthResponse>;
  createInteraction(
    payload: CreateInteractionPayload,
  ): Promise<CreateInteractionResponse>;
  addFacts(payload: AddFactsPayload): Promise<void>;
  configureApp(
    payload: ConfigureApplicationPayload,
  ): Promise<ConfigureApplicationResponse>;
  configureSession(payload: ConfigureSessionPayload): Promise<void>;
  setInteractionOptions(payload: SetInteractionOptionsPayload): Promise<void>;
  configure(payload: ConfigurePayload): Promise<ConfigureResponse>;
  navigate(payload: NavigatePayload): Promise<void>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<void>;
  setCredentials(payload: SetCredentialsPayload): Promise<void>;
  getStatus(): Promise<GetStatusResponse>;
  getTemplates(): Promise<GetTemplatesResponse>;
}
export interface CortiEmbeddedWindowAPI {
  v1: CortiEmbeddedV1API;
}

// Extend Window interface
declare global {
  interface Window {
    CortiEmbedded?: CortiEmbeddedWindowAPI;
  }
}

/**
 * Event listener function type
 */
export type EventListener<T = unknown> = (data: T) => void;

/**
 * Public API interface for the Corti Embedded component
 */
export interface CortiEmbeddedAPI {
  /**
   * Authenticate with the Corti system
   * @param credentials Authentication credentials
   * @returns Promise resolving to user information
   */
  auth(credentials: KeycloakTokenResponse): Promise<User>;

  /**
   * Create a new interaction
   * @param encounter Encounter request data
   * @returns Promise resolving to interaction details
   */
  createInteraction(
    encounter: CreateInteractionPayload,
  ): Promise<InteractionDetails>;

  /**
   * Configure the current session
   * @param config Session configuration
   * @returns Promise that resolves when configuration is complete
   * @deprecated Use setInteractionOptions() instead. See https://docs.corti.ai/assistant/deprecation-timeline.
   */
  configureSession(config: SessionConfig): Promise<void>;

  /**
   * Add facts to the current session
   * @param facts Array of facts to add
   * @returns Promise that resolves when facts are added
   */
  addFacts(facts: Fact[]): Promise<void>;

  /**
  * Navigate to a specific path within the embedded UI
  * @param payload Navigation request payload
   * @returns Promise that resolves when navigation is complete
   */
  navigate(payload: NavigatePayload): Promise<void>;

  /**
   * Start recording
   * @returns Promise that resolves when recording starts
   */
  startRecording(): Promise<void>;

  /**
   * Stop recording
   * @returns Promise that resolves when recording stops
   */
  stopRecording(): Promise<void>;

  /**
   * Get current component status
   * @returns Promise resolving to current status
   */
  getStatus(): Promise<GetStatusResponse>;

  /**
   * Get all templates available to the current user
   * @returns Promise resolving to list of templates
   */
  getTemplates(): Promise<GetTemplatesResponse>;

  /**
   * Configure the embedded application
   * @param config Application-level configuration
   * @returns Promise that resolves when configuration is applied
   */
  configureApp(
    config: ConfigureApplicationPayload,
  ): Promise<ConfigureApplicationResponse>;

  /**
   * Configure the application
   * @param config Application configuration
   * @returns Promise that resolves when configuration is applied
   * @deprecated Use configureApp() and setInteractionOptions() instead. See https://docs.corti.ai/assistant/deprecation-timeline.
   */
  configure(config: ConfigurePayload): Promise<ConfigureResponse>;

  /**
   * Set one-shot interaction options for the embedded instance.
   *
   * Each call patches the provided interaction-options branches onto the current
   * snapshot for the embedded instance. Omitted branches preserve their existing
   * values from previous calls.
   * @param config Interaction/session-level options
   * @returns Promise that resolves when options are applied
   */
  setInteractionOptions(config: SetInteractionOptionsPayload): Promise<void>;

  /**
   * Set authentication credentials without triggering auth flow
   * @param credentials Authentication credentials to store
   * @returns Promise that resolves when credentials are set
   */
  setCredentials(credentials: { password: string }): Promise<void>;

  /**
   * Show the embedded UI
   */
  show(): void;

  /**
   * Hide the embedded UI
   */
  hide(): void;
}
