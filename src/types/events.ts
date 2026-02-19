// Event payload types for embedded component events
import type { Corti } from "@corti/sdk";

import type { UserInfo } from "./responses.js";

export interface NavigateEventPayload {
  interactionId: string;
}

export interface DocumentEventPayload {
  document: Corti.DocumentsGetResponse;
}

export interface AuthChangedEventPayload {
  user: UserInfo;
}

export interface InteractionCreatedEventPayload {
  interaction: {
    id: string;
    createdAt: string;
  };
}

export interface NavigationChangedEventPayload {
  path: string;
}

export interface ErrorEventPayload {
  message: string;
  code?: string;
  details?: unknown;
}

export interface UsageEventPayload {
  creditsConsumed: number;
}
