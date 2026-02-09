// Protocol types for communication between parent applications and embedded Corti Assistant

export type APIVersion = "v1";

export type MessageType = "CORTI_EMBEDDED" | "CORTI_EMBEDDED_RESPONSE" | "CORTI_EMBEDDED_EVENT";

export type AuthMode = "stateless" | "stateful";

export type DefaultMode = "virtual" | "in-person";

export type EmbeddedAction =
  | "auth"
  | "createInteraction"
  | "addFacts"
  | "configureSession"
  | "navigate"
  | "startRecording"
  | "stopRecording"
  | "getStatus"
  | "configure"
  | "setCredentials";

export type DeprecatedEmbeddedEvent =
  | "ready"
  | "loaded"
  | "recordingStarted"
  | "recordingStopped"
  | "documentGenerated"
  | "documentUpdated"
  | "documentSynced"
  | "authChanged"
  | "interactionCreated"
  | "navigationChanged"
  | "usage";

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
  errorCode?: string;
  errorDetails?: unknown;
}

interface BaseEventMessage extends BaseMessage {
  type: "CORTI_EMBEDDED_EVENT";
  event: string | DeprecatedEmbeddedEvent;
  payload?: unknown;
}

export interface DeprecatedEmbeddedEventMessage extends BaseEventMessage {
  event: DeprecatedEmbeddedEvent;
  deprecated: true;
}

export interface EmbeddedEventMessage extends BaseEventMessage {
  payload: null | Record<string, unknown>;
  confidential: boolean;
}

// Specific Request Types
export interface AuthRequest extends EmbeddedRequest {
  action: "auth";
}

export interface CreateInteractionRequest extends EmbeddedRequest {
  action: "createInteraction";
}

export interface AddFactsRequest extends EmbeddedRequest {
  action: "addFacts";
}

export interface ConfigureSessionRequest extends EmbeddedRequest {
  action: "configureSession";
}

export interface NavigateRequest extends EmbeddedRequest {
  action: "navigate";
}

export interface StartRecordingRequest extends EmbeddedRequest {
  action: "startRecording";
}

export interface StopRecordingRequest extends EmbeddedRequest {
  action: "stopRecording";
}

export interface GetStatusRequest extends EmbeddedRequest {
  action: "getStatus";
}

export interface ConfigureRequest extends EmbeddedRequest {
  action: "configure";
}

export interface SetCredentialsRequest extends EmbeddedRequest {
  action: "setCredentials";
}

// Event Types
export interface ReadyEvent extends DeprecatedEmbeddedEventMessage {
  event: "ready";
}

export interface LoadedEvent extends DeprecatedEmbeddedEventMessage {
  event: "loaded";
}

export interface RecordingStartedEvent extends DeprecatedEmbeddedEventMessage {
  event: "recordingStarted";
}

export interface RecordingStoppedEvent extends DeprecatedEmbeddedEventMessage {
  event: "recordingStopped";
}

export interface DocumentGeneratedEvent extends DeprecatedEmbeddedEventMessage {
  event: "documentGenerated";
}

export interface DocumentUpdatedEvent extends DeprecatedEmbeddedEventMessage {
  event: "documentUpdated";
}

export interface DocumentSyncedEvent extends DeprecatedEmbeddedEventMessage {
  event: "documentSynced";
}

export interface AuthChangedEvent extends DeprecatedEmbeddedEventMessage {
  event: "authChanged";
}

export interface InteractionCreatedEvent extends DeprecatedEmbeddedEventMessage {
  event: "interactionCreated";
}

export interface NavigationChangedEvent extends DeprecatedEmbeddedEventMessage {
  event: "navigationChanged";
}

export interface UsageEvent extends DeprecatedEmbeddedEventMessage {
  event: "usage";
}

// Request/Response/Event type unions
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

export type AnyEmbeddedResponse = EmbeddedResponse;

export type AnyDeprecatedEmbeddedEvent =
  | ReadyEvent
  | LoadedEvent
  | RecordingStartedEvent
  | RecordingStoppedEvent
  | DocumentGeneratedEvent
  | DocumentUpdatedEvent
  | DocumentSyncedEvent
  | AuthChangedEvent
  | InteractionCreatedEvent
  | NavigationChangedEvent
  | UsageEvent;

export type AnyEvent = EmbeddedEventMessage | AnyDeprecatedEmbeddedEvent;

export type AnyEmbeddedMessage =
  | AnyEmbeddedRequest
  | AnyEmbeddedResponse
  | AnyDeprecatedEmbeddedEvent;
