// Protocol types for communication between parent applications and embedded Corti Assistant

export type APIVersion = "v1";

export type MessageType = "CORTI_EMBEDDED" | "CORTI_EMBEDDED_RESPONSE" | "CORTI_EMBEDDED_EVENT";

export type DefaultMode = "virtual" | "in-person";

// WARNING: "_init" is an internal-only action used by the embedded Assistant component
// for initialization handshake. External applications should NOT send _init messages.
// Use only public actions listed below.
export type EmbeddedAction =
  | "_init" // @internal - Internal-only handshake action
  | "auth"
  | "createInteraction"
  | "addFacts"
  | "configureApp"
  | "configureSession"
  | "setInteractionOptions"
  | "navigate"
  | "startRecording"
  | "stopRecording"
  | "getStatus"
  | "getTemplates"
  | "configure"
  | "setCredentials"
  | "showDeviceLinkQR";

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

export interface EmbeddedEventMessage extends BaseMessage {
  type: "CORTI_EMBEDDED_EVENT";
  event: string;
  payload: null | Record<string, unknown>;
  confidential: boolean;
  deprecated?: boolean;
}

// Specific Request Types
export interface AuthRequest extends EmbeddedRequest {
  action: "auth";
}

export interface InitRequest extends EmbeddedRequest {
  action: "_init";
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

export interface ConfigureAppRequest extends EmbeddedRequest {
  action: "configureApp";
}

export interface SetInteractionOptionsRequest extends EmbeddedRequest {
  action: "setInteractionOptions";
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

export interface GetTemplatesRequest extends EmbeddedRequest {
  action: "getTemplates";
}

export interface ConfigureRequest extends EmbeddedRequest {
  action: "configure";
}

export interface SetCredentialsRequest extends EmbeddedRequest {
  action: "setCredentials";
}

export interface ShowDeviceLinkQRRequest extends EmbeddedRequest {
  action: "showDeviceLinkQR";
}

// Request/Response/Event type unions
export type AnyEmbeddedRequest =
  | InitRequest
  | AuthRequest
  | CreateInteractionRequest
  | AddFactsRequest
  | ConfigureAppRequest
  | ConfigureSessionRequest
  | GetTemplatesRequest
  | NavigateRequest
  | SetInteractionOptionsRequest
  | StartRecordingRequest
  | StopRecordingRequest
  | GetStatusRequest
  | ConfigureRequest
  | SetCredentialsRequest
  | ShowDeviceLinkQRRequest;

export type AnyEmbeddedResponse = EmbeddedResponse;

export type AnyEvent = EmbeddedEventMessage;

export type AnyEmbeddedMessage = AnyEmbeddedRequest | AnyEmbeddedResponse | AnyEvent;
