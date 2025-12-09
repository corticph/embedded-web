import type { Corti } from '@corti/sdk';

/**
 * Authentication credentials for Assistant
 */
export interface AuthCredentials {
  access_token: string;
  token_type: string;
  expires_at?: number | null;
  expires_in?: number | null;
  refresh_expires_in?: number | null;
  refresh_token?: string;
  id_token?: string;
  'not-before-policy'?: number | null;
  session_state?: string;
  scope?: string;
  profile?: {
    name: string;
    email: string;
    sub: string;
  };
  mode: 'stateless' | 'stateful';
}

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
 * Interaction payload
 */
export interface InteractionPayload {
  assignedUserId: Corti.InteractionsCreateRequest['assignedUserId'];
  encounter: {
    identifier: Corti.InteractionsCreateRequest['encounter']['identifier'];
    status: Corti.InteractionsCreateRequest['encounter']['status'];
    type: Corti.InteractionsCreateRequest['encounter']['type'];
    period: Corti.InteractionsCreateRequest['encounter']['period'];
    title?: string;
  };
  patient: Corti.InteractionsCreateRequest['patient'];
}

/**
 * Fact used to provide additional information for the interaction context
 */
export interface Fact {
  text: Corti.FactsCreateInput['text'];
  group: Corti.FactsCreateInput['group'];
  source?: Corti.FactsCreateInput['source'];
}

/**
 * Session configuration options
 */
export interface SessionConfig {
  defaultLanguage?: string;
  defaultOutputLanguage?: string;
  defaultTemplateKey?: string;
  defaultMode?: 'virtual' | 'in-person';
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
    documents: Corti.DocumentsListResponse['data'];
    facts: Corti.FactsListResponse['facts'];
  };
}

interface AppearanceConfig {
  primaryColor: string | null;
}

interface FeaturesConfig {
  interactionTitle: boolean;
  aiChat: boolean;
  documentFeedback: boolean;
  navigation: boolean;
  virtualMode: boolean;
}

interface LocaleConfig {
  interfaceLanguage: string;
}

/**
 * Configuration options for the embedded component
 */
export interface ConfigureAppPayload {
  appearance?: Partial<AppearanceConfig>;
  features?: Partial<FeaturesConfig>;
  locale?: Partial<LocaleConfig>;
}

export interface ConfigureAppResponsePayload {
  appearance: AppearanceConfig;
  features: FeaturesConfig;
  locale: LocaleConfig;
}

/**
 * Event data types for component events
 */
export interface EmbeddedEventData {
  ready: undefined;
  /**
   * Limited access - NOT IMPLEMENTED
   */
  'auth-changed': {
    user: User;
  };
  /**
   * Limited access - NOT IMPLEMENTED
   */
  'interaction-created': {
    interaction: InteractionDetails;
  };
  'recording-started': undefined;
  'recording-stopped': undefined;
  'document-generated': {
    document: Corti.DocumentsGetResponse;
  };
  /**
   * Emitted after manual updates and changes made through dictation as well as re-generating the document
   */
  'document-updated': {
    document: Corti.DocumentsGetResponse;
  };
  /**
   * Emitted when a document is "pushed" to the host EHR system from the Assistant interface
   */
  'document-synced': {
    document: Corti.DocumentsGetResponse;
  };
  /**
   * Limited access - NOT IMPLEMENTED
   */
  'navigation-changed': {
    // TODO: Implement navigation change event in CA
    path: string;
  };
  error: {
    message: string;
    code?: string; // TODO: ensure that code is a valid error code and we have a mapping to error messages
    details?: unknown;
  };
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
  createInteraction(encounter: InteractionPayload): Promise<InteractionDetails>;

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
