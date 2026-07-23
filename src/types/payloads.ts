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

export type DeviceLinkTokenResponse = KeycloakTokenResponse & { refresh_token: string };

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
  fallback?: DefaultMode;
  options: DefaultMode[];
}

export interface SpokenLanguageOptions {
  fallback?: string;
  options?: string[];
}

export interface InlineTemplateLabel {
  key: string;
  value: string;
}

export interface InlineTemplateSectionInstructions {
  contentPrompt?: string;
  writingStylePrompt?: string;
  miscPrompt?: string;
}

export interface InlineTemplateSection {
  inheritFromId?: string;
  heading: string;
  labels?: InlineTemplateLabel[];
  instructions: InlineTemplateSectionInstructions;
  outputSchema?: Record<string, unknown>;
}

export interface InlineTemplate {
  id?: string;
  name: string;
  labels?: InlineTemplateLabel[];
  generation: {
    instructions: {
      prompt: string;
    };
    sections: InlineTemplateSection[];
  };
}

export interface InteractionTemplateReference {
  source: "standard" | "project" | "inline";
  id: string;
}

export interface DefaultInteractionTemplateOptions {
  behaviour?: "fallback" | "force-first-document";
  template?: InteractionTemplateReference;
  allowUserSelection?: boolean;
}

export interface PersonalTemplateSectionFieldConfig {
  visible?: boolean;
  editable?: boolean;
}

export interface PersonalTemplateSectionFields {
  heading?: { editable?: boolean };
  description?: { editable?: boolean };
  miscPrompt?: PersonalTemplateSectionFieldConfig;
  outputSchema?: PersonalTemplateSectionFieldConfig;
}

export interface InteractionTemplateSources {
  personal?: {
    enabled?: boolean;
    sectionFields?: PersonalTemplateSectionFields;
  };
  standard?: {
    enabled?: boolean;
    include?: {
      regions?: string[];
      families?: string[];
    };
  };
  project?: {
    enabled?: boolean;
    include?: {
      ids?: string[];
    };
    exclude?: {
      ids?: string[];
    };
  };
  inline?: {
    enabled?: boolean;
    templates?: InlineTemplate[];
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
  allowedLanguages?: string[];
  maxGenerated?: number | "unlimited";
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
