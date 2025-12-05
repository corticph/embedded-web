import type { Corti } from '@corti/sdk';
import type { User } from './public-types.js';

export type APIVersion = 'v1';

export type MessageType =
  | 'CORTI_EMBEDDED'
  | 'CORTI_EMBEDDED_RESPONSE'
  | 'CORTI_EMBEDDED_EVENT';

export type AuthMode = 'stateless' | 'stateful';

export type DefaultMode = 'virtual' | 'in-person';

export type EmbeddedAction =
  | 'auth'
  | 'createInteraction'
  | 'addFacts'
  | 'configureSession'
  | 'navigate'
  | 'startRecording'
  | 'stopRecording'
  | 'getStatus'
  | 'configure'
  | 'setCredentials';

export type EmbeddedEvent =
  | 'ready'
  | 'loaded'
  | 'recordingStarted'
  | 'recordingStopped'
  | 'documentGenerated'
  | 'documentUpdated'
  | 'documentSynced'
  | 'authChanged'
  | 'interactionCreated'
  | 'navigationChanged';

export interface KeycloakTokenResponse {
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
}

// Authentication Schema
export interface AuthPayload extends KeycloakTokenResponse {
  mode: AuthMode;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    [key: string]: unknown;
  };
}

export interface CreateInteractionResponse {
  id: string;
  createdAt: string;
  status?: string;
}

// Add Facts Schema
export interface AddFactsPayload {
  facts: Corti.FactsCreateInput[];
}

// Configure Session Schema
export interface ConfigureSessionPayload {
  defaultLanguage?: string;
  defaultOutputLanguage?: string;
  defaultTemplateKey?: string;
  defaultMode?: DefaultMode;
}

// Navigate Schema
export interface NavigatePayload {
  path: string;
}

// App configuration schema
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

// Get status schema
export interface GetStatusResponse {
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

// Set credentials schema
export interface SetCredentialsPayload {
  password: string;
}

export interface NavigateEventPayload {
  interactionId: string;
}

export interface DocumentEventPayload {
  document: Corti.DocumentsGetResponse;
}

export interface AuthChangedEventPayload {
  user: {
    id: string;
    email: string;
    name?: string;
    [key: string]: unknown;
  };
}

export interface InteractionCreatedEventPayload {
  interaction: {
    id: string;
    createdAt: string;
  };
}

export interface NavigationChangedEventPayload {
  path: string;
}

// Base Message Types
export interface BaseMessage {
  type: MessageType;
  version: APIVersion;
}

export interface EmbeddedRequest extends BaseMessage {
  type: 'CORTI_EMBEDDED';
  action: EmbeddedAction;
  requestId: string;
  payload?: unknown;
}

export interface EmbeddedResponse extends BaseMessage {
  type: 'CORTI_EMBEDDED_RESPONSE';
  action: EmbeddedAction;
  requestId: string;
  success: boolean;
  payload?: unknown;
  error?: string;
  errorCode?: string;
  errorDetails?: unknown;
}

export interface EmbeddedEventMessage extends BaseMessage {
  type: 'CORTI_EMBEDDED_EVENT';
  event: EmbeddedEvent;
  payload?: unknown;
}

// Specific Request/Response Types
export interface AuthRequest extends EmbeddedRequest {
  action: 'auth';
  payload: AuthPayload;
}

export interface AuthResponseMessage extends EmbeddedResponse {
  action: 'auth';
  payload?: AuthResponse;
}

export interface CreateInteractionRequest extends EmbeddedRequest {
  action: 'createInteraction';
  payload: Corti.InteractionsEncounterCreateRequest;
}

export interface CreateInteractionResponseMessage extends EmbeddedResponse {
  action: 'createInteraction';
  payload: CreateInteractionResponse;
}

export interface AddFactsRequest extends EmbeddedRequest {
  action: 'addFacts';
  payload: AddFactsPayload;
}

export interface ConfigureSessionRequest extends EmbeddedRequest {
  action: 'configureSession';
  payload: ConfigureSessionPayload;
}

export interface NavigateRequest extends EmbeddedRequest {
  action: 'navigate';
  payload: NavigatePayload;
}

export interface StartRecordingRequest extends EmbeddedRequest {
  action: 'startRecording';
}

export interface StopRecordingRequest extends EmbeddedRequest {
  action: 'stopRecording';
}

export interface GetStatusRequest extends EmbeddedRequest {
  action: 'getStatus';
}

export interface GetStatusResponseMessage extends EmbeddedResponse {
  action: 'getStatus';
  payload: GetStatusResponse;
}

export interface ConfigureRequest extends EmbeddedRequest {
  action: 'configure';
  payload: ConfigureAppPayload;
}

export interface SetCredentialsRequest extends EmbeddedRequest {
  action: 'setCredentials';
  payload: SetCredentialsPayload;
}

// Event Types
export interface ReadyEvent extends EmbeddedEventMessage {
  event: 'ready';
}

export interface LoadedEvent extends EmbeddedEventMessage {
  event: 'loaded';
  payload: NavigateEventPayload;
}

export interface RecordingStartedEvent extends EmbeddedEventMessage {
  event: 'recordingStarted';
}

export interface RecordingStoppedEvent extends EmbeddedEventMessage {
  event: 'recordingStopped';
}

export interface DocumentGeneratedEvent extends EmbeddedEventMessage {
  event: 'documentGenerated';
  payload: DocumentEventPayload;
}

export interface DocumentUpdatedEvent extends EmbeddedEventMessage {
  event: 'documentUpdated';
  payload: DocumentEventPayload;
}

export interface DocumentSyncedEvent extends EmbeddedEventMessage {
  event: 'documentSynced';
  payload: DocumentEventPayload;
}

export interface AuthChangedEvent extends EmbeddedEventMessage {
  event: 'authChanged';
  payload: AuthChangedEventPayload;
}

export interface InteractionCreatedEvent extends EmbeddedEventMessage {
  event: 'interactionCreated';
  payload: InteractionCreatedEventPayload;
}

export interface NavigationChangedEvent extends EmbeddedEventMessage {
  event: 'navigationChanged';
  payload: NavigationChangedEventPayload;
}

// Request/Response/Event types
export type AnyEmbeddedRequest =
  | AuthRequest
  | CreateInteractionRequest
  | AddFactsRequest
  | ConfigureSessionRequest
  | NavigateRequest
  | StartRecordingRequest
  | StopRecordingRequest
  | GetStatusRequest
  | ConfigureRequest
  | SetCredentialsRequest;

export type AnyEmbeddedResponse =
  | AuthResponseMessage
  | CreateInteractionResponseMessage
  | GetStatusResponseMessage
  | EmbeddedResponse;

export type AnyEmbeddedEvent =
  | ReadyEvent
  | LoadedEvent
  | RecordingStartedEvent
  | RecordingStoppedEvent
  | DocumentGeneratedEvent
  | DocumentUpdatedEvent
  | DocumentSyncedEvent
  | AuthChangedEvent
  | InteractionCreatedEvent
  | NavigationChangedEvent;

export type AnyEmbeddedMessage =
  | AnyEmbeddedRequest
  | AnyEmbeddedResponse
  | AnyEmbeddedEvent;
