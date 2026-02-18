// Configuration types for the embedded component

export interface AppearanceConfig {
  primaryColor: string | null;
}

export interface FeaturesConfig {
  interactionTitle: boolean;
  aiChat: boolean;
  documentFeedback: boolean;
  navigation: boolean;
  virtualMode: boolean;
  syncDocumentAction: boolean;
  templateEditor: boolean;
}

export interface LocaleConfig {
  interfaceLanguage: string;
  dictationLanguage?: string | null;
  overrides?: Record<string, string>;
}

export interface NetworkConfig {
  websocketBaseUrl?: string | null;
}

export interface ConfigureAppPayload {
  appearance?: Partial<AppearanceConfig>;
  features?: Partial<FeaturesConfig>;
  locale?: Partial<LocaleConfig>;
  network?: Partial<NetworkConfig>;
}
