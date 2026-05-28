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

export interface ConfigureFeaturesConfig {
  interactionTitle: boolean;
  aiChat: boolean;
  documentFeedback: boolean;
  navigation: boolean;
  virtualMode: boolean;
  syncDocumentAction: boolean;
  templateEditor: boolean;
}

/**
 * @deprecated Use ConfigureFeaturesConfig instead.
 */
export type FeaturesConfig = ConfigureFeaturesConfig;

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

/**
 * @deprecated Use ConfigurePayload for configure() or ConfigureApplicationPayload for configureApp().
 */
export type ConfigureAppPayload = ConfigurePayload;

export interface ConfigureApplicationPayload {
  debug?: boolean;
  ui?: Partial<UIConfig>;
  appearance?: Partial<AppearanceConfig>;
  locale?: Partial<LocaleConfig>;
  network?: Partial<NetworkConfig>;
}
