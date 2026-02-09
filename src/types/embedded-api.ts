import type {
  ConfigureAppPayload,
  ConfigureAppResponsePayload,
} from './config.js';
import type { EmbeddedInterviewDetails } from './generated/interview-details.ts';
import type {
  AddFactsPayload,
  AuthResponse,
  ConfigureSessionPayload,
  CreateInteractionPayload,
  CreateInteractionResponse,
  KeycloakTokenResponse,
  NavigatePayload,
  SetCredentialsPayload,
  UserInfo,
} from './payloads.js';

/**
 * Status information about the embedded component
 */
export interface GetStatusResponsePayload {
  auth: {
    isAuthenticated: boolean;
    user?: UserInfo;
  };
  currentUrl: string;
  interaction: EmbeddedInterviewDetails | null;
}

// Window API Types
export interface CortiEmbeddedV1API {
  auth(payload: KeycloakTokenResponse): Promise<AuthResponse>;
  createInteraction(
    payload: CreateInteractionPayload,
  ): Promise<CreateInteractionResponse>;
  addFacts(payload: AddFactsPayload): Promise<void>;
  configureSession(payload: ConfigureSessionPayload): Promise<void>;
  configure(payload: ConfigureAppPayload): Promise<ConfigureAppResponsePayload>;
  navigate(payload: NavigatePayload): Promise<void>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<void>;
  setCredentials(payload: SetCredentialsPayload): Promise<void>;
  getStatus(): Promise<GetStatusResponsePayload>;
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
