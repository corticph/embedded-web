// Public API types for SDK consumers

import type { Corti } from "@corti/sdk";

import type { ConfigureAppPayload, ConfigureAppResponsePayload } from "./config.js";
import type {
  AuthChangedEventPayload,
  DocumentEventPayload,
  ErrorEventPayload,
  InteractionCreatedEventPayload,
  NavigationChangedEventPayload,
  UsageEventPayload,
} from "./events.js";
import type { AuthPayload, CreateInteractionPayload, Fact } from "./payloads.js";
import type { DefaultMode } from "./protocol.js";

export type { ConfigureAppPayload, ConfigureAppResponsePayload } from "./config.js";
// Re-export common types for public API
export type { UserInfo } from "./payloads.js";

/**
 * Authentication credentials for Assistant
 */
export type AuthCredentials = AuthPayload;

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
 * Status information about the embedded component
 */
export interface ComponentStatus {
  ready: boolean;
  auth: {
    authenticated: boolean;
    user?: User;
  };
  currentUrl?: string;
  interaction?: {
    encounter: Corti.InteractionsEncounterResponse;
    documents: Corti.DocumentsListResponse["data"];
    facts: Corti.FactsListResponse["facts"];
  };
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
  auth(credentials: AuthCredentials): Promise<User>;

  /**
   * Create a new interaction
   * @param encounter Encounter request data
   * @returns Promise resolving to interaction details
   */
  createInteraction(encounter: CreateInteractionPayload): Promise<InteractionDetails>;

  /**
   * Configure the current session
   * @param config Session configuration
   * @returns Promise that resolves when configuration is complete
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
   * @param path Path to navigate to
   * @returns Promise that resolves when navigation is complete
   */
  navigate(path: string): Promise<void>;

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
  getStatus(): Promise<ComponentStatus>;

  /**
   * Configure the application
   * @param config Application configuration
   * @returns Promise that resolves when configuration is applied
   */
  configure(config: ConfigureAppPayload): Promise<ConfigureAppResponsePayload>;

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
