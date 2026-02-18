import { useCallback, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  addFacts,
  auth,
  configure,
  configureSession,
  createInteraction,
  hide,
  type AuthCredentials,
  type CortiEmbeddedEventDetail,
  type ConfigureAppPayload,
  CortiEmbeddedReact,
  type CortiEmbeddedReactRef,
  type Fact,
  navigate,
  type SessionConfig,
  show,
  useCortiEmbeddedStatus,
} from '../dist/index.js';

function CortiEmbeddedDemo() {
  const componentRef = useRef<CortiEmbeddedReactRef>(null);
  const [log, setLog] = useState<
    Array<{ time: string; message: string; type: string }>
  >([
    {
      time: new Date().toLocaleTimeString(),
      message: 'Ready to send messages...',
      type: 'info',
    },
  ]);
  const [isReady, setIsReady] = useState(false);
  const baseURL = 'https://assistant.staging-eu.corti.app';

  // Form states
  const [authPayload, setAuthPayload] = useState<string>(
    JSON.stringify(
      {
        token: 'test-token-123',
        userId: 'demo-user',
      },
      null,
      2,
    ),
  );

  const [configureAppPayload, setConfigureAppPayload] = useState<string>(
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

  const [createInteractionPayload, setCreateInteractionPayload] =
    useState<string>(
      JSON.stringify(
        {
          encounter: {
            identifier: `encounter-${Date.now()}`,
            status: 'planned',
            type: 'inpatient',
            period: {
              startedAt: new Date().toISOString(),
            },
            title: 'New Encounter',
          },
        },
        null,
        2,
      ),
    );

  const [configureSessionPayload, setConfigureSessionPayload] =
    useState<string>(
      JSON.stringify(
        {
          defaultLanguage: 'en',
          defaultOutputLanguage: 'en',
          defaultTemplateKey: 'soap_note',
          defaultMode: 'virtual',
        },
        null,
        2,
      ),
    );

  const [addFactsPayload, setAddFactsPayload] = useState<string>(
    JSON.stringify(
      [
        { text: 'Chest pain', group: 'other' },
        { text: 'Shortness of breath', group: 'other' },
        { text: 'Fatigue', group: 'other' },
        { text: 'Dizziness', group: 'other' },
        { text: 'Nausea', group: 'other' },
      ],
      null,
      2,
    ),
  );

  const [navigatePayload, setNavigatePayload] = useState<string>(
    '/session/{interaction_id}',
  );

  // Helper to add log entries
  const addLogEntry = useCallback(
    (message: string, type: 'info' | 'success' | 'error' = 'info') => {
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
        'error',
      );
    },
  });

  // Event handlers
  const handleReady = useCallback(() => {
    setIsReady(true);
    addLogEntry('Corti component loaded and ready', 'success');
  }, [addLogEntry]);

  const handleError = useCallback(
    (event: CustomEvent) => {
      addLogEntry(`Error: ${JSON.stringify(event.detail)}`, 'error');
    },
    [addLogEntry],
  );

  const handleEvent = useCallback(
    (event: CustomEvent<CortiEmbeddedEventDetail>) => {
      const { name, payload } = event.detail;
      addLogEntry(`Event ${name}: ${JSON.stringify(payload)}`, 'info');
      if (
        name === 'embedded.interactionCreated' &&
        payload &&
        typeof payload === 'object' &&
        'interaction' in payload
      ) {
        const { interaction } = payload as { interaction?: { id?: string } };
        if (interaction?.id) {
          setNavigatePayload(`/session/${interaction.id}`);
        }
      }
    },
    [addLogEntry],
  );

  // Action handlers
  const handleShow = () => {
    try {
      show();
      addLogEntry('Corti component shown', 'info');
    } catch (error) {
      addLogEntry(
        `Show failed: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      );
    }
  };

  const handleHide = () => {
    try {
      hide();
      addLogEntry('Corti component hidden', 'info');
    } catch (error) {
      addLogEntry(
        `Hide failed: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      );
    }
  };

  const handleAuth = async () => {
    try {
      const payload = JSON.parse(authPayload) as AuthCredentials;
      addLogEntry(
        `Sending authentication request with payload: ${JSON.stringify(payload)}`,
        'info',
      );
      const response = await auth(payload);
      addLogEntry(
        `Authentication successful: ${JSON.stringify(response)}`,
        'success',
      );
    } catch (error) {
      addLogEntry(
        `Authentication failed: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      );
    }
  };

  const handleConfigureApp = async () => {
    try {
      const payload = JSON.parse(configureAppPayload) as ConfigureAppPayload;
      addLogEntry(
        `Configuring app with payload: ${JSON.stringify(payload)}`,
        'info',
      );
      await configure(payload);
      addLogEntry('App configuration successful', 'success');
    } catch (error) {
      addLogEntry(
        `App configuration failed: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      );
    }
  };

  const handleConfigureSession = async () => {
    try {
      const payload = JSON.parse(configureSessionPayload) as SessionConfig;
      addLogEntry(
        `Configuring session with payload: ${JSON.stringify(payload)}`,
        'info',
      );
      await configureSession(payload);
      addLogEntry('Session configuration successful', 'success');
    } catch (error) {
      addLogEntry(
        `Session configuration failed: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      );
    }
  };

  const handleAddFacts = async () => {
    try {
      const payload = JSON.parse(addFactsPayload) as Fact[];
      addLogEntry(
        `Adding facts with payload: ${JSON.stringify(payload)}`,
        'info',
      );
      await addFacts(payload);
      addLogEntry('Add facts successful', 'success');
    } catch (error) {
      addLogEntry(
        `Add facts failed: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      );
    }
  };

  const handleNavigate = async () => {
    try {
      addLogEntry(`Navigating with payload: ${navigatePayload}`, 'info');
      await navigate(navigatePayload);
    } catch (error) {
      addLogEntry(
        `Navigation failed: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      );
    }
  };

  const handleCreateInteraction = async () => {
    try {
      const payload = JSON.parse(createInteractionPayload);
      addLogEntry(
        `Creating interaction with payload: ${JSON.stringify(payload)}`,
        'info',
      );
      const response = await createInteraction(payload);

      // Update navigate payload with interaction ID
      if (response.id) {
        setNavigatePayload(`/session/${response.id}`);
        addLogEntry(
          `Navigate payload updated with interaction ID: ${response.id}`,
          'success',
        );
      }
    } catch (error) {
      addLogEntry(
        `Interaction creation failed: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      );
    }
  };

  const handleClearLog = () => {
    setLog([
      {
        time: new Date().toLocaleTimeString(),
        message: 'Ready to send messages...',
        type: 'info',
      },
    ]);
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
              Component Ready: {isReady ? 'Yes' : 'No'}
              <br />
              Status Loading: {isStatusLoading ? 'Yes' : 'No'}
              <br />
              Authenticated:{' '}
              {embeddedStatus?.auth?.isAuthenticated ? 'Yes' : 'No'}
              <br />
              Interaction ID: {embeddedStatus?.interaction?.id || 'N/A'}
              <br />
              Current URL: {embeddedStatus?.currentUrl || 'N/A'}
              {statusError ? (
                <>
                  <br />
                  Status Error:{' '}
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
            </div>
          </div>

          <div className="demo-section">
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

          <div className="demo-section">
            <div className="demo-title">Configure App</div>
            <div className="section-row">
              <details className="auth-payload-section">
                <summary>⚙️ Settings</summary>
                <label htmlFor="configure-app-payload">Payload (JSON):</label>
                <textarea
                  id="configure-app-payload"
                  value={configureAppPayload}
                  onChange={e => setConfigureAppPayload(e.target.value)}
                  placeholder='{"features": {"aiChat": false}}'
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

          <div className="demo-section">
            <div className="demo-title">1. Create Interaction</div>
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

          <div className="demo-section">
            <div className="demo-title">2. Configure Session</div>
            <div className="section-row">
              <details className="auth-payload-section">
                <summary>⚙️ Settings</summary>
                <label htmlFor="configure-session-payload">Payload:</label>
                <textarea
                  id="configure-session-payload"
                  value={configureSessionPayload}
                  onChange={e => setConfigureSessionPayload(e.target.value)}
                  placeholder='{"defaultLanguage": "en", "defaultOutputLanguage": "en", "defaultTemplateKey": "soap_note", "defaultMode": "virtual"}'
                />
              </details>
              <button
                type="button"
                className="postmessage-btn"
                onClick={handleConfigureSession}
              >
                Send
              </button>
            </div>
          </div>

          <div className="demo-section">
            <div className="demo-title">3. Add Facts</div>
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

          <div className="demo-section">
            <div className="demo-title">4. Navigate</div>
            <div className="section-row">
              <details className="auth-payload-section">
                <summary>⚙️ Settings</summary>
                <label htmlFor="navigate-payload">Payload:</label>
                <textarea
                  id="navigate-payload"
                  value={navigatePayload}
                  onChange={e => setNavigatePayload(e.target.value)}
                  placeholder='"/session/{interaction_id}"'
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

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<CortiEmbeddedDemo />);
}
