import { useCallback, useRef, useState } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { createRoot } from 'react-dom/client';
import {
  type AuthCredentials,
  CortiEmbeddedReact,
  type CortiEmbeddedReactRef,
  type Fact,
  type SessionConfig,
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
  const [status, setStatus] = useState({
    isReady: false,
    baseURL: 'https://assistant.eu.corti.app',
  });

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

  // Event handlers
  const handleReady = useCallback(() => {
    setStatus(prev => ({ ...prev, isReady: true }));
    addLogEntry('Corti component loaded and ready', 'success');
  }, [addLogEntry]);

  const handleRecordingStarted = useCallback(
    (event: CustomEvent) => {
      addLogEntry(`Recording started: ${JSON.stringify(event.detail)}`, 'info');
    },
    [addLogEntry],
  );

  const handleRecordingStopped = useCallback(
    (event: CustomEvent) => {
      addLogEntry(`Recording stopped: ${JSON.stringify(event.detail)}`, 'info');
    },
    [addLogEntry],
  );

  const handleDocumentGenerated = useCallback(
    (event: CustomEvent) => {
      addLogEntry(
        `Document generated: ${JSON.stringify(event.detail)}`,
        'success',
      );
    },
    [addLogEntry],
  );

  const handleDocumentUpdated = useCallback(
    (event: CustomEvent) => {
      addLogEntry(`Document updated: ${JSON.stringify(event.detail)}`, 'info');
    },
    [addLogEntry],
  );

  const handleError = useCallback(
    (event: CustomEvent) => {
      addLogEntry(`Error: ${JSON.stringify(event.detail)}`, 'error');
    },
    [addLogEntry],
  );

  const handleUsage = useCallback(
    (event: CustomEvent) => {
      addLogEntry(`Usage event: ${JSON.stringify(event.detail)}`, 'info');
    },
    [addLogEntry],
  );

  // Action handlers
  const handleShow = () => {
    if (componentRef.current?.show) {
      componentRef.current.show();
      addLogEntry('Corti component shown', 'info');
    }
  };

  const handleHide = () => {
    if (componentRef.current?.hide) {
      componentRef.current.hide();
      addLogEntry('Corti component hidden', 'info');
    }
  };

  const handleAuth = async () => {
    if (!componentRef.current?.auth) {
      addLogEntry('Component not ready for authentication', 'error');
      return;
    }

    try {
      const payload = JSON.parse(authPayload) as AuthCredentials;
      addLogEntry(
        `Sending authentication request with payload: ${JSON.stringify(payload)}`,
        'info',
      );
      const response = await componentRef.current.auth(payload);
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

  const handleConfigureSession = async () => {
    if (!componentRef.current?.configureSession) {
      addLogEntry('Component not ready for configureSession', 'error');
      return;
    }

    try {
      const payload = JSON.parse(configureSessionPayload) as SessionConfig;
      addLogEntry(
        `Configuring session with payload: ${JSON.stringify(payload)}`,
        'info',
      );
      await componentRef.current.configureSession(payload);
      addLogEntry('Session configuration successful', 'success');
    } catch (error) {
      addLogEntry(
        `Session configuration failed: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      );
    }
  };

  const handleAddFacts = async () => {
    if (!componentRef.current?.addFacts) {
      addLogEntry('Component not ready for addFacts', 'error');
      return;
    }

    try {
      const payload = JSON.parse(addFactsPayload) as Fact[];
      addLogEntry(
        `Adding facts with payload: ${JSON.stringify(payload)}`,
        'info',
      );
      await componentRef.current.addFacts(payload);
      addLogEntry('Add facts successful', 'success');
    } catch (error) {
      addLogEntry(
        `Add facts failed: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      );
    }
  };

  const handleNavigate = async () => {
    if (!componentRef.current?.navigate) {
      addLogEntry('Component not ready for navigate', 'error');
      return;
    }

    try {
      addLogEntry(`Navigating with payload: ${navigatePayload}`, 'info');
      await componentRef.current.navigate(navigatePayload);
      addLogEntry('Navigation successful', 'success');
    } catch (error) {
      addLogEntry(
        `Navigation failed: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      );
    }
  };

  const handleCreateInteraction = async () => {
    if (!componentRef.current?.createInteraction) {
      addLogEntry('Component not ready for createInteraction', 'error');
      return;
    }

    try {
      const payload = JSON.parse(createInteractionPayload);
      addLogEntry(
        `Creating interaction with payload: ${JSON.stringify(payload)}`,
        'info',
      );
      const response = await componentRef.current.createInteraction(payload);
      addLogEntry(
        `Interaction creation successful: ${JSON.stringify(response)}`,
        'success',
      );

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
              Base URL: {status.baseURL}
              <br />
              Component Ready: {status.isReady ? 'Yes' : 'No'}
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
                baseURL={status.baseURL}
                onReady={handleReady}
                onRecordingStarted={handleRecordingStarted}
                onRecordingStopped={handleRecordingStopped}
                onDocumentGenerated={handleDocumentGenerated}
                onDocumentUpdated={handleDocumentUpdated}
                onError={handleError}
                onUsage={handleUsage}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Message Log */}
        <div className="right-panel">
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
            {log.map(entry => (
              <div key={entry.time} className={`log-entry log-${entry.type}`}>
                [{entry.time}] {entry.message}
              </div>
            ))}
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
