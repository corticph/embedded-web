import { type Corti } from '@corti/sdk';


export type APIVersion = "v1";

export type MessageType =
  | "CORTI_EMBEDDED"
  | "CORTI_EMBEDDED_RESPONSE"
  | "CORTI_EMBEDDED_EVENT";

export type AuthMode = "stateless" | "stateful";

export type DefaultMode = "virtual" | "in-person";

export type EmbeddedAction =
  | "auth"
  | "createInteraction"
  | "addFacts"
  | "configureSession"
  | "navigate"
  | "startRecording"
  | "stopRecording";

export type EmbeddedEvent =
  | "ready"
  | "loaded"
  | "recordingStarted"
  | "recordingStopped"
  | "documentGenerated"
  | "documentUpdated"
  | "documentSynced";

export interface KeycloakTokenResponse {
  access_token: string;
  token_type: string;
  expires_at?: number | null;
  expires_in?: number | null;
  refresh_expires_in?: number | null;
  refresh_token?: string;
  id_token?: string;
  "not-before-policy"?: number | null;
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
    [key: string]: unknown;
  };
}

export interface CreateInteractionResponse {
  id: string;
  createdAt: string;
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

export interface NavigateEventPayload {
  interactionId: string;
}

export interface DocumentEventPayload {
  document: Corti.DocumentsGetResponse;
}

// Base Message Types
export interface BaseMessage {
  type: MessageType;
  version: APIVersion;
}

export interface EmbeddedRequest extends BaseMessage {
  type: "CORTI_EMBEDDED";
  action: EmbeddedAction;
  requestId: string;
  payload?: unknown;
}

export interface EmbeddedResponse extends BaseMessage {
  type: "CORTI_EMBEDDED_RESPONSE";
  action: EmbeddedAction;
  requestId: string;
  success: boolean;
  payload?: unknown;
  error?: string;
}

export interface EmbeddedEventMessage extends BaseMessage {
  type: "CORTI_EMBEDDED_EVENT";
  event: EmbeddedEvent;
  payload?: unknown;
}

// Specific Request/Response Types
export interface AuthRequest extends EmbeddedRequest {
  action: "auth";
  payload: AuthPayload;
}

export interface AuthResponseMessage extends EmbeddedResponse {
  action: "auth";
  payload?: AuthResponse;
}

export interface CreateInteractionRequest extends EmbeddedRequest {
  action: "createInteraction";
  payload: Corti.InteractionsEncounterCreateRequest;
}

export interface CreateInteractionResponseMessage extends EmbeddedResponse {
  action: "createInteraction";
  payload: CreateInteractionResponse;
}

export interface AddFactsRequest extends EmbeddedRequest {
  action: "addFacts";
  payload: AddFactsPayload;
}

export interface ConfigureSessionRequest extends EmbeddedRequest {
  action: "configureSession";
  payload: ConfigureSessionPayload;
}

export interface NavigateRequest extends EmbeddedRequest {
  action: "navigate";
  payload: NavigatePayload;
}

export interface StartRecordingRequest extends EmbeddedRequest {
  action: "startRecording";
}

export interface StopRecordingRequest extends EmbeddedRequest {
  action: "stopRecording";
}

// Event Types
export interface ReadyEvent extends EmbeddedEventMessage {
  event: "ready";
}

export interface LoadedEvent extends EmbeddedEventMessage {
  event: "loaded";
  payload: NavigateEventPayload;
}

export interface RecordingStartedEvent extends EmbeddedEventMessage {
  event: "recordingStarted";
}

export interface RecordingStoppedEvent extends EmbeddedEventMessage {
  event: "recordingStopped";
}

export interface DocumentGeneratedEvent extends EmbeddedEventMessage {
  event: "documentGenerated";
  payload: DocumentEventPayload;
}

export interface DocumentUpdatedEvent extends EmbeddedEventMessage {
  event: "documentUpdated";
  payload: DocumentEventPayload;
}

export interface DocumentSyncedEvent extends EmbeddedEventMessage {
  event: "documentSynced";
  payload: DocumentEventPayload;
}

// Window API Types
export interface CortiEmbeddedV1API {
  auth(payload: AuthPayload): Promise<AuthResponse>;
  createInteraction(
    payload: Corti.InteractionsEncounterCreateRequest,
  ): Promise<CreateInteractionResponse>;
  addFacts(payload: AddFactsPayload): Promise<void>;
  configureSession(payload: ConfigureSessionPayload): Promise<void>;
  navigate(payload: NavigatePayload): Promise<void>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<void>;
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

// Request/Response/Event types
export type AnyEmbeddedRequest =
  | AuthRequest
  | CreateInteractionRequest
  | AddFactsRequest
  | ConfigureSessionRequest
  | NavigateRequest
  | StartRecordingRequest
  | StopRecordingRequest;

export type AnyEmbeddedResponse =
  | AuthResponseMessage
  | CreateInteractionResponseMessage
  | EmbeddedResponse;

export type AnyEmbeddedEvent =
  | ReadyEvent
  | LoadedEvent
  | RecordingStartedEvent
  | RecordingStoppedEvent
  | DocumentGeneratedEvent
  | DocumentUpdatedEvent
  | DocumentSyncedEvent;

export type AnyEmbeddedMessage =
  | AnyEmbeddedRequest
  | AnyEmbeddedResponse
  | AnyEmbeddedEvent;
