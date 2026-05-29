// Payload types for embedded API requests and responses
import type { Corti } from "@corti/sdk";

import type { DefaultMode } from "./protocol.js";

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

export interface InteractionModeOptions {
  fallback: DefaultMode;
  options: DefaultMode[];
}

export interface SpokenLanguageOptions {
  fallback: string;
}

export interface InteractionTemplateReference {
  source: "standard";
  id: string;
}

export interface DefaultInteractionTemplateOptions {
  behaviour: "fallback";
  template: InteractionTemplateReference;
}

export interface InteractionTemplateSources {
  personal?: {
    enabled: boolean;
  };
}

export interface InteractionTemplateOptions {
  sources?: InteractionTemplateSources;
  defaultTemplate?: DefaultInteractionTemplateOptions;
}

export interface InteractionDocumentOptions {
  actions?: {
    sync?: boolean;
  };
}

export interface SetInteractionOptionsPayload {
  mode?: InteractionModeOptions;
  spokenLanguage?: SpokenLanguageOptions;
  templates?: InteractionTemplateOptions;
  documents?: InteractionDocumentOptions;
}

// Navigate payload
export interface NavigatePayload {
  path: string;
}

// Set credentials payload
export interface SetCredentialsPayload {
  password: string;
}
