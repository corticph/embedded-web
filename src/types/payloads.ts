// Payload types for embedded API requests and responses
import type { Corti } from "@corti/sdk";

import type { AuthMode, DefaultMode } from "./protocol.js";

// Keycloak token structure
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

// Authentication payload
export interface AuthPayload extends KeycloakTokenResponse {
  mode: AuthMode;
}

// User info structure
export interface UserInfo {
  id: string;
  email: string;
  name?: string;
  [key: string]: unknown;
}

// Auth response
export interface AuthResponse {
  user: UserInfo;
}

// Create interaction response
export interface CreateInteractionResponse {
  id: string;
  createdAt: string;
  status?: string;
}

// Fact structure
export interface Fact {
  text: Corti.FactsCreateInput["text"];
  group: string;
  source?: Corti.FactsCreateInput["source"];
}

// Create interaction payload
export interface CreateInteractionPayload {
  assignedUserId?: Corti.InteractionsCreateRequest["assignedUserId"] | null;
  encounter: {
    identifier: Corti.InteractionsCreateRequest["encounter"]["identifier"];
    status: Corti.InteractionsCreateRequest["encounter"]["status"];
    type: Corti.InteractionsCreateRequest["encounter"]["type"];
    period: {
      startedAt: string;
      endedAt?: string;
    };
    title?: string;
  };
  patient?: {
    identifier?: Corti.InteractionsPatient["identifier"];
    name?: string;
    birthDate?: string | null;
    gender?: Corti.InteractionsPatient["gender"];
  };
}

// Add facts payload
export interface AddFactsPayload {
  facts: Fact[];
}

// Configure session payload
export interface ConfigureSessionPayload {
  defaultLanguage?: string;
  defaultOutputLanguage?: string;
  defaultTemplateKey?: string;
  defaultMode?: DefaultMode;
}

// Navigate payload
export interface NavigatePayload {
  path: string;
}

// Set credentials payload
export interface SetCredentialsPayload {
  password: string;
}
