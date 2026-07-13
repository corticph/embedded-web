import { useCallback, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  type DeviceLinkTokenResponse,
  type KeycloakTokenResponse,
  type CortiEmbeddedEvent,
  type CortiEmbeddedErrorDetail,
  type ConfigureApplicationPayload,
  type ConfigurePayload,
  CortiEmbeddedReact,
  type CortiEmbeddedReactRef,
  type Fact,
  type NavigatePayload,
  type SessionConfig,
  type SetInteractionOptionsPayload,
  useCortiEmbeddedApi,
  useCortiEmbeddedStatus,
} from "../dist/index.js";

const configureAppDemoPayload = {
  debug: false,
  appearance: {
    primaryColor: "#0066cc",
  },
  ui: {
    interactionTitle: true,
    aiChat: true,
    documentFeedback: true,
    navigation: true,
  },
  companionApp: {
    enabled: true,
  },
  locale: {
    interfaceLanguage: "en",
    dictationLanguage: "en",
    overrides: {
      "assistant.header.title": "Embedded Assistant",
    },
  },
} satisfies ConfigureApplicationPayload;

const interactionOptionsDemoPayload = {
  mode: {
    fallback: "virtual",
    options: ["in-person", "virtual"],
  },
  spokenLanguage: {
    fallback: "en",
    options: ["en", "da"],
  },
  templates: {
    sources: {
      personal: {
        enabled: true,
        sectionFields: {
          heading: { editable: true },
          description: { editable: true },
          contentPrompt: { visible: true, editable: true },
          writingStylePrompt: { visible: true, editable: true },
          miscPrompt: { visible: true, editable: true },
          outputSchema: { visible: true, editable: false },
        },
      },
      standard: {
        enabled: true,
        include: {
          regions: ["en"],
          families: ["soap"],
        },
      },
      project: {
        enabled: true,
        exclude: {
          ids: ["deprecated-template"],
        },
      },
    },
    defaultTemplate: {
      behaviour: "fallback",
      template: {
        source: "standard",
        id: "soap_note-en",
      },
      allowUserSelection: true,
    },
  },
  documents: {
    actions: {
      sync: true,
    },
    allowedLanguages: ["en"],
    maxGenerated: "unlimited",
  },
} satisfies SetInteractionOptionsPayload;

const deviceLinkQrDemoPayload = {
  access_token: "demo-device-link-token",
  token_type: "Bearer",
  expires_in: 300,
  refresh_token: "demo-device-link-refresh-token",
} satisfies DeviceLinkTokenResponse;

function CortiEmbeddedDemo() {
  const componentRef = useRef<CortiEmbeddedReactRef>(null);
  const api = useCortiEmbeddedApi(componentRef);
  const [log, setLog] = useState<
    Array<{ time: string; message: string; type: string }>
  >([]);
  const [isReady, setIsReady] = useState(false);
  const baseURL = "https://assistant.eu.corti.app";

  // Form states
  const [authPayload, setAuthPayload] = useState<string>(
    JSON.stringify(
      {
        token: "test-token-123",
        userId: "demo-user",
      },
      null,
      2,
    ),
  );

  const [deviceLinkQrPayload, setDeviceLinkQrPayload] = useState<string>(
    JSON.stringify(deviceLinkQrDemoPayload, null, 2),
  );

  const [configureAppPayload, setConfigureAppPayload] = useState<string>(
    JSON.stringify(configureAppDemoPayload, null, 2),
  );

  const [createInteractionPayload, setCreateInteractionPayload] =
    useState<string>(
      JSON.stringify(
        {
          encounter: {
            identifier: `encounter-${Date.now()}`,
            status: "planned",
            type: "inpatient",
            period: {
              startedAt: new Date().toISOString(),
            },
            title: "New Encounter",
          },
        },
        null,
        2,
      ),
    );

  const [interactionOptionsPayload, setInteractionOptionsPayload] =
    useState<string>(JSON.stringify(interactionOptionsDemoPayload, null, 2));

  const [legacyConfigurePayload, setLegacyConfigurePayload] = useState<string>(
    JSON.stringify(
      {
        features: {
          aiChat: false,
          syncDocumentAction: true,
        },
      },
      null,
      2,
    ),
  );

  const [legacyConfigureSessionPayload, setLegacyConfigureSessionPayload] =
    useState<string>(
      JSON.stringify(
        {
          defaultLanguage: "en",
          defaultOutputLanguage: "en",
          defaultTemplateKey: "soap_note",
          defaultMode: "virtual",
        },
        null,
        2,
      ),
    );

  const [addFactsPayload, setAddFactsPayload] = useState<string>(
    JSON.stringify(
      [
        { text: "Chest pain", group: "other" },
        { text: "Shortness of breath", group: "other" },
        { text: "Fatigue", group: "other" },
        { text: "Dizziness", group: "other" },
        { text: "Nausea", group: "other" },
      ],
      null,
      2,
    ),
  );

  const [navigatePayload, setNavigatePayload] = useState<string>(
    JSON.stringify({ path: "/session/{interaction_id}" }, null, 2),
  );

  // Helper to add log entries
  const addLogEntry = useCallback(
    (message: string, type: "info" | "success" | "error" = "info") => {
      const time = new Date().toLocaleTimeString();
      setLog(prev => [...prev, { time, message, type }]);
    },
    [],
  );

  const {
    status: embeddedStatus,
    isLoading: isStatusLoading,
    error: statusError,
    lastEvent,
  } = useCortiEmbeddedStatus(componentRef, {
    onError: error => {
      addLogEntry(
        `Status refresh failed: ${error instanceof Error ? error.message : String(error)}`,
        "error",
      );
    },
  });

  // Event handlers
  const handleReady = useCallback(() => {
    setIsReady(true);
    addLogEntry("Corti component loaded and ready", "success");
  }, [addLogEntry]);

  const handleError = useCallback(
    (event: CustomEvent<CortiEmbeddedErrorDetail>) => {
      addLogEntry(`Error: ${JSON.stringify(event.detail)}`, "error");
    },
    [addLogEntry],
  );

  const handleEvent = useCallback(
    (event: CortiEmbeddedEvent) => {
      const { name, payload } = event.detail;
      addLogEntry(`Event ${name}: ${JSON.stringify(payload)}`, "info");
      if (
        name === "embedded.interactionCreated" &&
        payload &&
        typeof payload === "object" &&
        "interaction" in payload
      ) {
        const { interaction } = payload as { interaction?: { id?: string } };
        if (interaction?.id) {
          setNavigatePayload(
            JSON.stringify({ path: `/session/${interaction.id}` }, null, 2),
          );
        }
      }
    },
    [addLogEntry],
  );

  // Action handlers
  const handleShow = () => {
    try {
      api.show();
      addLogEntry("Corti component shown", "info");
    } catch (error) {
      addLogEntry(
        `Show failed: ${error instanceof Error ? error.message : String(error)}`,
        "error",
      );
    }
  };

  const handleHide = () => {
    try {
      api.hide();
      addLogEntry("Corti component hidden", "info");
    } catch (error) {
      addLogEntry(
        `Hide failed: ${error instanceof Error ? error.message : String(error)}`,
        "error",
      );
    }
  };

  const handleAuth = async () => {
    try {
      const payload = JSON.parse(authPayload) as KeycloakTokenResponse;
      addLogEntry(
        `Sending authentication request with payload: ${JSON.stringify(payload)}`,
        "info",
      );
      const response = await api.auth(payload);
      addLogEntry(
        `Authentication successful: ${JSON.stringify(response)}`,
        "success",
      );
    } catch (error) {
      console.error(
        `Authentication failed: ${error instanceof Error ? error.message : String(error)}`,
        "error",
      );
    }
  };

  const handleShowDeviceLinkQR = async () => {
    try {
      const payload = JSON.parse(deviceLinkQrPayload) as DeviceLinkTokenResponse;
      addLogEntry("Showing device-link QR", "info");
      const response = await api.showDeviceLinkQR(payload);
      addLogEntry(`Device-link QR finished with status: ${response.status}`, "success");
    } catch (error) {
      console.error(
        `Device-link QR failed: ${error instanceof Error ? error.message : String(error)}`,
        "error",
      );
    }
  };

  const handleConfigureApp = async () => {
    try {
      const payload = JSON.parse(
        configureAppPayload,
      ) as ConfigureApplicationPayload;
      addLogEntry(
        `Configuring app with payload: ${JSON.stringify(payload)}`,
        "info",
      );
      await api.configureApp(payload);
      addLogEntry("App configuration successful", "success");
    } catch (error) {
      console.error(
        `App configuration failed: ${error instanceof Error ? error.message : String(error)}`,
        "error",
      );
    }
  };

  const handleSetInteractionOptions = async () => {
    try {
      const payload = JSON.parse(
        interactionOptionsPayload,
      ) as SetInteractionOptionsPayload;
      addLogEntry(
        `Setting interaction options with payload: ${JSON.stringify(payload)}`,
        "info",
      );
      await api.setInteractionOptions(payload);
      addLogEntry("Interaction options set successfully", "success");
    } catch (error) {
      console.error(
        `Set interaction options failed: ${error instanceof Error ? error.message : String(error)}`,
        "error",
      );
    }
  };

  const handleLegacyConfigure = async () => {
    try {
      const payload = JSON.parse(legacyConfigurePayload) as ConfigurePayload;
      addLogEntry(
        `Sending legacy configure payload: ${JSON.stringify(payload)}`,
        "info",
      );
      await api.configure(payload);
      addLogEntry("Legacy configure successful", "success");
    } catch (error) {
      console.error(
        `Legacy configure failed: ${error instanceof Error ? error.message : String(error)}`,
        "error",
      );
    }
  };

  const handleLegacyConfigureSession = async () => {
    try {
      const payload = JSON.parse(
        legacyConfigureSessionPayload,
      ) as SessionConfig;
      addLogEntry(
        `Sending legacy configureSession payload: ${JSON.stringify(payload)}`,
        "info",
      );
      await api.configureSession(payload);
      addLogEntry("Legacy configureSession successful", "success");
    } catch (error) {
      console.error(
        `Legacy configureSession failed: ${error instanceof Error ? error.message : String(error)}`,
        "error",
      );
    }
  };

  const handleAddFacts = async () => {
    try {
      const payload = JSON.parse(addFactsPayload) as Fact[];
      addLogEntry(
        `Adding facts with payload: ${JSON.stringify(payload)}`,
        "info",
      );
      await api.addFacts(payload);
      addLogEntry("Add facts successful", "success");
    } catch (error) {
      console.error(
        `Add facts failed: ${error instanceof Error ? error.message : String(error)}`,
        "error",
      );
    }
  };

  const handleNavigate = async () => {
    try {
      const payload = JSON.parse(navigatePayload) as NavigatePayload;
      addLogEntry(`Navigating to ${payload.path}`, "info");
      await api.navigate(payload);
    } catch (error) {
      console.error(
        `Navigation failed: ${error instanceof Error ? error.message : String(error)}`,
        "error",
      );
    }
  };

  const handleCreateInteraction = async () => {
    try {
      const payload = JSON.parse(createInteractionPayload);
      addLogEntry(
        `Creating interaction with payload: ${JSON.stringify(payload)}`,
        "info",
      );
      const response = await api.createInteraction(payload);

      // Update navigate payload with interaction ID
      if (response.id) {
        setNavigatePayload(
          JSON.stringify({ path: `/session/${response.id}` }, null, 2),
        );
        addLogEntry(
          `Navigate payload updated with interaction ID: ${response.id}`,
          "success",
        );
      }
    } catch (error) {
      console.error(
        `Interaction creation failed: ${error instanceof Error ? error.message : String(error)}`,
        "error",
      );
    }
  };

  const handleGetTemplates = async () => {
    try {
      const response = await api.getTemplates();
      addLogEntry(
        `Templates retrieved successfully: ${JSON.stringify(response)}`,
        "success",
      );
    } catch (error) {
      console.error(
        `Template retrieval failed: ${error instanceof Error ? error.message : String(error)}`,
        "error",
      );
    }
  };

  const handleClearLog = () => {
    setLog([]);
  };

  const latestStatus = JSON.stringify(
    {
      isLoading: isStatusLoading,
      error:
        statusError instanceof Error
          ? statusError.message
          : (statusError ?? null),
      lastEvent: lastEvent?.name ?? null,
      status: embeddedStatus,
    },
    null,
    2,
  );

  return (
    <div className="container">
      <header>
        <h1>Corti Embedded React Demo</h1>
      </header>

      <div className="main-layout">
        {/* Left Panel - Settings and Controls */}
        <div className="left-panel">
          <div className="demo-section">
            <div className="demo-title">Status</div>
            <div className="status">
              <strong>Current Status:</strong>
              <br />
              Base URL: {baseURL}
              <br />
              Component Ready: {isReady ? "Yes" : "No"}
              <br />
              Status Loading: {isStatusLoading ? "Yes" : "No"}
              <br />
              Authenticated:{" "}
              {embeddedStatus?.auth?.isAuthenticated ? "Yes" : "No"}
              <br />
              Interaction ID: {embeddedStatus?.interaction?.id || "N/A"}
              <br />
              Current URL: {embeddedStatus?.currentUrl || "N/A"}
              {statusError ? (
                <>
                  <br />
                  Status Error:{" "}
                  {statusError instanceof Error
                    ? statusError.message
                    : String(statusError)}
                </>
              ) : null}
            </div>
          </div>

          <div className="demo-section">
            <div className="demo-title">Component Controls</div>
            <div className="controls">
              <button type="button" className="show-btn" onClick={handleShow}>
                Show Corti
              </button>
              <button type="button" className="hide-btn" onClick={handleHide}>
                Hide Corti
              </button>
              <button
                type="button"
                className="get-templates-btn"
                onClick={handleGetTemplates}
              >
                Get Templates
              </button>
            </div>
          </div>

          <div className="method-box">
            <div className="demo-title">Authentication</div>
            <div className="section-row">
              <details className="auth-payload-section">
                <summary>⚙️ Settings</summary>
                <label htmlFor="auth-payload">Payload (JSON):</label>
                <textarea
                  id="auth-payload"
                  value={authPayload}
                  onChange={e => setAuthPayload(e.target.value)}
                  placeholder='{"token": "your-auth-token", "userId": "user-123"}'
                />
              </details>
              <button
                type="button"
                className="postmessage-btn"
                onClick={handleAuth}
              >
                Send
              </button>
            </div>
          </div>

          <div className="method-box">
            <div className="demo-title">Device Link QR</div>
            <div className="section-row">
              <details className="auth-payload-section">
                <summary>⚙️ Settings</summary>
                <label htmlFor="device-link-qr-payload">Payload (JSON):</label>
                <textarea
                  id="device-link-qr-payload"
                  value={deviceLinkQrPayload}
                  onChange={e => setDeviceLinkQrPayload(e.target.value)}
                  placeholder='{"access_token": "your-token", "token_type": "Bearer", "refresh_token": "your-refresh-token"}'
                />
              </details>
              <button type="button" className="postmessage-btn" onClick={handleShowDeviceLinkQR}>
                Send
              </button>
            </div>
          </div>

          <div className="method-box">
            <div className="demo-title">Configure App</div>
            <div className="section-row">
              <details className="auth-payload-section">
                <summary>⚙️ Settings</summary>
                <label htmlFor="configure-app-payload">Payload (JSON):</label>
                <textarea
                  id="configure-app-payload"
                  value={configureAppPayload}
                  onChange={e => setConfigureAppPayload(e.target.value)}
                  placeholder='{"ui": {"aiChat": false}}'
                />
              </details>
              <button
                type="button"
                className="postmessage-btn"
                onClick={handleConfigureApp}
              >
                Send
              </button>
            </div>
          </div>

          <div className="method-box">
            <div className="demo-title">Create Interaction</div>
            <div className="section-row">
              <details className="auth-payload-section">
                <summary>⚙️ Settings</summary>
                <label htmlFor="create-interaction-payload">Payload:</label>
                <textarea
                  id="create-interaction-payload"
                  value={createInteractionPayload}
                  onChange={e => setCreateInteractionPayload(e.target.value)}
                  placeholder='{"encounter": {"identifier": "encounter-123", "status": "planned", "type": "first_consultation"}}'
                />
              </details>
              <button
                type="button"
                className="postmessage-btn"
                onClick={handleCreateInteraction}
              >
                Send
              </button>
            </div>
          </div>

          <div className="method-box">
            <div className="demo-title">Set Interaction Options</div>
            <div className="section-row">
              <details className="auth-payload-section">
                <summary>⚙️ Settings</summary>
                <label htmlFor="interaction-options-payload">Payload:</label>
                <textarea
                  id="interaction-options-payload"
                  value={interactionOptionsPayload}
                  onChange={e => setInteractionOptionsPayload(e.target.value)}
                  placeholder='{"mode": {"fallback": "virtual", "options": ["in-person", "virtual"]}}'
                />
              </details>
              <button
                type="button"
                className="postmessage-btn"
                onClick={handleSetInteractionOptions}
              >
                Send
              </button>
            </div>
          </div>

          <div className="method-box">
            <div className="demo-title">Add Facts</div>
            <div className="section-row">
              <details className="auth-payload-section">
                <summary>⚙️ Settings</summary>
                <label htmlFor="add-facts-payload">Payload:</label>
                <textarea
                  id="add-facts-payload"
                  value={addFactsPayload}
                  onChange={e => setAddFactsPayload(e.target.value)}
                  placeholder='{"facts": [{"text": "Chest pain", "group": "other"}]}'
                />
              </details>
              <button
                type="button"
                className="postmessage-btn"
                onClick={handleAddFacts}
              >
                Send
              </button>
            </div>
          </div>

          <div className="method-box">
            <div className="demo-title">Navigate</div>
            <div className="section-row">
              <details className="auth-payload-section">
                <summary>⚙️ Settings</summary>
                <label htmlFor="navigate-payload">Payload:</label>
                <textarea
                  id="navigate-payload"
                  value={navigatePayload}
                  onChange={e => setNavigatePayload(e.target.value)}
                  placeholder='{"path": "/session/{interaction_id}"}'
                />
              </details>
              <button
                type="button"
                className="postmessage-btn"
                onClick={handleNavigate}
              >
                Send
              </button>
            </div>
          </div>

          <details className="legacy-methods">
            <summary>Legacy Configuration Methods</summary>

            <div className="method-box">
              <div className="demo-title">configure()</div>
              <div className="section-row">
                <details className="auth-payload-section">
                  <summary>⚙️ Settings</summary>
                  <label htmlFor="legacy-configure-payload">Payload:</label>
                  <textarea
                    id="legacy-configure-payload"
                    value={legacyConfigurePayload}
                    onChange={e => setLegacyConfigurePayload(e.target.value)}
                    placeholder='{"features": {"aiChat": false}}'
                  />
                </details>
                <button
                  type="button"
                  className="postmessage-btn"
                  onClick={handleLegacyConfigure}
                >
                  Send
                </button>
              </div>
            </div>

            <div className="method-box">
              <div className="demo-title">configureSession()</div>
              <div className="section-row">
                <details className="auth-payload-section">
                  <summary>⚙️ Settings</summary>
                  <label htmlFor="legacy-configure-session-payload">
                    Payload:
                  </label>
                  <textarea
                    id="legacy-configure-session-payload"
                    value={legacyConfigureSessionPayload}
                    onChange={e =>
                      setLegacyConfigureSessionPayload(e.target.value)
                    }
                    placeholder='{"defaultLanguage": "en", "defaultTemplateKey": "soap_note"}'
                  />
                </details>
                <button
                  type="button"
                  className="postmessage-btn"
                  onClick={handleLegacyConfigureSession}
                >
                  Send
                </button>
              </div>
            </div>
          </details>
        </div>

        {/* Center Panel - Web Component */}
        <div className="embedded-section">
          <div className="demo-section">
            <div className="demo-title">Corti Embedded Component</div>
            <div className="component-container">
              <CortiEmbeddedReact
                ref={componentRef}
                baseURL={baseURL}
                onReady={handleReady}
                onEvent={handleEvent}
                onError={handleError}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Status + Message Log */}
        <div className="right-panel">
          <div className="right-split">
            <div className="right-pane right-status-pane">
              <div className="demo-title">Latest Status</div>
              <pre className="status-json">{latestStatus}</pre>
            </div>
            <div className="right-pane right-log-pane">
              <div className="demo-title">Message Log</div>
              <div className="controls">
                <button
                  type="button"
                  className="postmessage-btn"
                  onClick={handleClearLog}
                >
                  Clear Log
                </button>
              </div>
              <div className="log">
                {log.map((entry, index) => (
                  <div
                    key={`${entry.time}-${index}`}
                    className={`log-entry log-${entry.type}`}
                  >
                    [{entry.time}] {entry.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<CortiEmbeddedDemo />);
}
