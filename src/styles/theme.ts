import { css } from 'lit';

const ThemeStyles = css`
  :host {
    color-scheme: light dark;
    /* Component Defaults */
    --component-font-family: 'Segoe UI', Roboto, sans-serif;

    /* Plain (Default) Colors */
    --plain-bg-color: light-dark(#f5f5f5, #3a3a3a);
    --plain-border-color: light-dark(
      rgba(0, 0, 0, 0.08),
      rgba(255, 255, 255, 0.1)
    );
    --plain-active-color: light-dark(#f0f0f0, #393939);
    --plain-text-color: light-dark(#333, #eee);

    /* Accent Colors */
    --accent-bg-color: light-dark(#232323, #ffffff);
    --accent-border-color: light-dark(#1a1a1a, #f5f5f5);
    --accent-active-color: light-dark(#3a3a3a, #f5f5f5);
    --accent-text-color: light-dark(#fff, #333);

    /* User Colors (Same as Plain) */
    --msg-user-bg-color: var(--plain-bg-color);
    --msg-user-border-color: var(--plain-border-color);
    --msg-user-active-color: var(--plain-active-color);
    --msg-user-text-color: var(--plain-text-color);

    /* Response Colors */
    --msg-agent-bg-color: transparent;
    --msg-agent-border-color: light-dark(
      rgba(0, 0, 0, 0.05),
      rgba(255, 255, 255, 0.08)
    );
    --msg-agent-active-color: light-dark(
      rgba(0, 0, 0, 0.02),
      rgba(255, 255, 255, 0.05)
    );
    --msg-agent-text-color: var(--plain-text-color);

    /* Success Colors */
    --success-bg-color: light-dark(
      rgba(34, 197, 94, 0.1),
      rgba(34, 197, 94, 0.2)
    );
    --success-border-color: light-dark(
      rgba(34, 197, 94, 0.2),
      rgba(34, 197, 94, 0.3)
    );
    --success-active-color: light-dark(
      rgba(34, 197, 94, 0.15),
      rgba(34, 197, 94, 0.25)
    );
    --success-text-color: light-dark(#22c55e, #4ade80);

    /* Info Colors */
    --info-bg-color: light-dark(
      rgba(59, 130, 246, 0.1),
      rgba(59, 130, 246, 0.2)
    );
    --info-border-color: light-dark(
      rgba(59, 130, 246, 0.2),
      rgba(59, 130, 246, 0.3)
    );
    --info-active-color: light-dark(
      rgba(59, 130, 246, 0.15),
      rgba(59, 130, 246, 0.25)
    );
    --info-text-color: light-dark(#3b82f6, #60a5fa);

    /* Error Colors */
    --error-bg-color: light-dark(
      rgba(239, 68, 68, 0.1),
      rgba(239, 68, 68, 0.2)
    );
    --error-border-color: light-dark(
      rgba(239, 68, 68, 0.2),
      rgba(239, 68, 68, 0.3)
    );
    --error-active-color: light-dark(
      rgba(239, 68, 68, 0.15),
      rgba(239, 68, 68, 0.25)
    );
    --error-text-color: light-dark(#ef4444, #f87171);

    /* Layout defaults */
    --base-background: light-dark(#fff, #222);
    --card-padding: 8px;
    --card-border-radius: 12px;
    --card-inner-border-radius: 8px;
    --card-box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  }

  :host {
    /* Apply base font and color directly to the host */
    font-family: var(--component-font-family);
    color: var(--plain-text-color);
  }
`;

export default ThemeStyles;
