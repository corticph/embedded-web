export interface EmbeddedAgentAuth {
  type: "none" | "inherit";
}

export type EmbeddedAgentConnector = (
  | { type: "registry"; name: string; config?: Record<string, unknown> }
  | { type: "mcp"; name: string; url: string; auth?: EmbeddedAgentAuth }
  | { type: "a2a"; name?: string; url: string }
  | {
      type: "schema";
      name: string;
      description?: string;
      schema: Record<string, unknown>;
      transition?: "complete" | "input_required";
    }
) & { enabled?: boolean };

/** Create-an-agent request body. Console-internal agent references are unsupported. */
export interface EmbeddedAgentDefinition {
  name: string;
  description?: string;
  systemPrompt?: string;
  model?: string;
  maxLoops?: number;
  visibility?: "private" | "unlisted" | "public";
  /** Ignored. Assistant creates ephemeral agents. */
  lifecycle?: "ephemeral" | "persistent";
  connectors?: EmbeddedAgentConnector[];
  labels?: Record<string, string>;
}

export interface AIChatConfig {
  /** Set to null to restore the default Assistant agent configuration. */
  agent?: EmbeddedAgentDefinition | null;
}
