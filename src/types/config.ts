// Configuration types for the embedded component

export interface AppearanceConfig {
  primaryColor: string | null;
}

export interface UIConfig {
  interactionTitle: boolean;
  aiChat: boolean;
  documentFeedback: boolean;
  navigation: boolean;
}

export interface CompanionAppConfig {
  enabled: boolean;
}

export interface ConsentConfig {
  enabled: boolean;
}

export interface ConfigureFeaturesConfig {
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

export interface ConfigurePayload {
  debug?: boolean;
  appearance?: Partial<AppearanceConfig>;
  features?: Partial<ConfigureFeaturesConfig>;
  locale?: Partial<LocaleConfig>;
  network?: Partial<NetworkConfig>;
}

export interface ConfigureAppPayload {
  debug?: boolean;
  ui?: Partial<UIConfig>;
  companionApp?: CompanionAppConfig;
  /** Patient consent. When enabled, the user must confirm patient consent before recording starts */
  consent?: ConsentConfig;
  appearance?: Partial<AppearanceConfig>;
  locale?: Partial<LocaleConfig>;
  network?: Partial<NetworkConfig>;
}
