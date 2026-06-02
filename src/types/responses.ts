// Response types for embedded API

import type {
  AppearanceConfig,
  ConfigureFeaturesConfig,
  LocaleConfig,
  NetworkConfig,
  UIConfig,
} from "./config.js";
import type { EmbeddedInterviewDetails } from "./generated/interview-details.js";

export interface UserInfo {
  id: string;
  email: string;
  name?: string;
  [key: string]: unknown;
}

export interface AuthResponse {
  user: UserInfo;
}

export interface CreateInteractionResponse {
  id: string;
  createdAt: string;
  status?: string;
}

export interface EmbeddedTemplate {
  id: string;
  name: string;
  description?: string;
  language: {
    code: string;
    name: string;
    locale?: string;
  };
  sections: Array<{
    id: string;
    title: string;
  }>;
  isCustom: boolean;
}

export interface GetStatusResponse {
  auth: {
    isAuthenticated: boolean;
    user?: UserInfo;
  };
  currentUrl: string;
  interaction: EmbeddedInterviewDetails | null;
}

export interface GetTemplatesResponse {
  templates: EmbeddedTemplate[];
}

export interface ConfigureResponse {
  debug?: boolean;
  appearance: AppearanceConfig;
  features: ConfigureFeaturesConfig;
  locale: LocaleConfig;
  network: NetworkConfig;
}

export interface ConfigureAppResponse {
  debug?: boolean;
  appearance: AppearanceConfig;
  ui: UIConfig;
  locale: LocaleConfig;
  network: NetworkConfig;
}
