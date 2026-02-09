import type {
  AuthCredentials,
  GetStatusResponsePayload,
  ConfigureAppPayload,
  ConfigureAppResponsePayload,
  CortiEmbeddedAPI,
  EmbeddedEventData,
  Fact,
  InteractionDetails,
  CreateInteractionPayload,
  SessionConfig,
} from '../src/types';

// Get the component with proper typing
const component = document.getElementById('corti-component') as HTMLElement &
  CortiEmbeddedAPI;

// Define log entry types
type LogType = 'info' | 'success' | 'error' | 'warning';

// Utils
export const clearLog = (): void => {
  const logElement = document.getElementById('log');
  if (!logElement) return;
  logElement.innerHTML = '<div class="log-entry log-info">Log cleared...</div>';
};

export const addLogEntry = (message: string, type: LogType = 'info'): void => {
  const logElement = document.getElementById('log');
  if (!logElement) return;
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logElement.appendChild(entry);
  logElement.scrollTop = logElement.scrollHeight;
};

export const updateStatus = (): void => {
  const statusElement = document.getElementById('status');
  if (!statusElement) return;

  if (component) {
    const baseURL = component.getAttribute('baseURL');

    statusElement.innerHTML = `
      <strong>Current Status:</strong><br>
      Base URL: ${baseURL}<br>
      Component Ready: ${typeof component.show === 'function' && typeof component.hide === 'function' ? 'Yes' : 'No'}<br>
    `;
  } else {
    statusElement.innerHTML = 'Status: Component not found';
  }
};

// Define functions with proper typing and export to global scope
export const showCorti = (): void => {
  if (component?.show) {
    component.show();
    updateStatus();
    addLogEntry('Corti component shown', 'info');
  }
};

export const hideCorti = (): void => {
  if (component?.hide) {
    component.hide();
    updateStatus();
    addLogEntry('Corti component hidden', 'info');
  }
};

export const testAuthentication = async (): Promise<void> => {
  if (component?.auth) {
    try {
      // Parse the JSON from the textarea
      const authPayloadElement = document.getElementById(
        'auth-payload',
      ) as HTMLTextAreaElement;
      const authPayloadText = authPayloadElement.value;
      let authPayload: AuthCredentials;

      try {
        authPayload = JSON.parse(authPayloadText) as AuthCredentials;
      } catch (jsonError) {
        const errorMessage =
          jsonError instanceof Error ? jsonError.message : 'Unknown JSON error';
        addLogEntry(`Invalid JSON in payload: ${errorMessage}`, 'error');
        return;
      }

      addLogEntry(
        `Sending authentication request with payload: ${JSON.stringify(authPayload)}`,
        'info',
      );
      const response = await component.auth(authPayload);
      addLogEntry(
        `Authentication successful: ${JSON.stringify(response)}`,
        'success',
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      addLogEntry(`Authentication failed: ${errorMessage}`, 'error');
    }
  } else {
    addLogEntry('Component not ready for authentication', 'error');
  }
};

export const configureSession = async (): Promise<void> => {
  if (component?.configureSession) {
    try {
      // Parse the JSON from the textarea
      const payloadElement = document.getElementById(
        'configure-session-payload',
      ) as HTMLTextAreaElement;
      const payloadText = payloadElement.value;
      let payload: SessionConfig;

      try {
        payload = JSON.parse(payloadText) as SessionConfig;
      } catch (jsonError) {
        const errorMessage =
          jsonError instanceof Error ? jsonError.message : 'Unknown JSON error';
        addLogEntry(`Invalid JSON in payload: ${errorMessage}`, 'error');
        return;
      }

      addLogEntry(
        `Configuring session with payload: ${JSON.stringify(payload)}`,
        'info',
      );
      await component.configureSession(payload);
      addLogEntry('Session configuration successful', 'success');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      addLogEntry(`Session configuration failed: ${errorMessage}`, 'error');
    }
  } else {
    addLogEntry('Component not ready for configureSession', 'error');
  }
};

export const addFacts = async (): Promise<void> => {
  if (component?.addFacts) {
    try {
      // Parse the JSON from the textarea
      const payloadElement = document.getElementById(
        'add-facts-payload',
      ) as HTMLTextAreaElement;
      const payloadText = payloadElement.value;
      let payload: Fact[];

      try {
        payload = JSON.parse(payloadText) as Fact[];
      } catch (jsonError) {
        const errorMessage =
          jsonError instanceof Error ? jsonError.message : 'Unknown JSON error';
        addLogEntry(`Invalid JSON in payload: ${errorMessage}`, 'error');
        return;
      }

      addLogEntry(
        `Adding facts with payload: ${JSON.stringify(payload)}`,
        'info',
      );
      await component.addFacts(payload);
      addLogEntry('Add facts successful', 'success');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      addLogEntry(`Add facts failed: ${errorMessage}`, 'error');
    }
  } else {
    addLogEntry('Component not ready for addFacts', 'error');
  }
};

export const navigate = async (): Promise<void> => {
  if (component?.navigate) {
    try {
      // Parse the JSON from the textarea
      const payloadElement = document.getElementById(
        'navigate-payload',
      ) as HTMLTextAreaElement;
      const payloadText = payloadElement.value;
      let payload: { path: string };

      try {
        payload = JSON.parse(payloadText) as { path: string };
      } catch (jsonError) {
        const errorMessage =
          jsonError instanceof Error ? jsonError.message : 'Unknown JSON error';
        addLogEntry(`Invalid JSON in payload: ${errorMessage}`, 'error');
        return;
      }

      addLogEntry(
        `Navigating with payload: ${JSON.stringify(payload)}`,
        'info',
      );
      await component.navigate(payload.path);
      addLogEntry('Navigation successful', 'success');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      addLogEntry(`Navigation failed: ${errorMessage}`, 'error');
    }
  } else {
    addLogEntry('Component not ready for navigate', 'error');
  }
};

export const createInteraction = async (): Promise<void> => {
  if (component?.createInteraction) {
    try {
      // Parse the JSON from the textarea
      const payloadElement = document.getElementById(
        'create-interaction-payload',
      ) as HTMLTextAreaElement;
      const payloadText = payloadElement.value;
      let payload: CreateInteractionPayload;

      try {
        payload = JSON.parse(payloadText);
      } catch (jsonError) {
        const errorMessage =
          jsonError instanceof Error ? jsonError.message : 'Unknown JSON error';
        addLogEntry(`Invalid JSON in payload: ${errorMessage}`, 'error');
        return;
      }

      addLogEntry(
        `Creating interaction with payload: ${JSON.stringify(payload)}`,
        'info',
      );
      const response: InteractionDetails =
        await component.createInteraction(payload);
      addLogEntry(
        `Interaction creation successful: ${JSON.stringify(response)}`,
        'success',
      );

      // Update navigate payload textarea with the returned interaction ID
      try {
        const interactionId = response.id;
        if (interactionId) {
          const navTextarea = document.getElementById(
            'navigate-payload',
          ) as HTMLTextAreaElement;
          if (navTextarea) {
            try {
              const navPayload = JSON.parse(navTextarea.value);
              if (
                navPayload &&
                typeof navPayload === 'object' &&
                'path' in navPayload
              ) {
                navPayload.path = String(navPayload.path).replace(
                  '{interaction_id}',
                  interactionId,
                );
                navTextarea.value = JSON.stringify(navPayload, null, 2);
              } else {
                // Fallback to string replace if unexpected structure
                navTextarea.value = navTextarea.value.replace(
                  '{interaction_id}',
                  interactionId,
                );
              }
            } catch {
              // Fallback to string replace if JSON is invalid
              navTextarea.value = navTextarea.value.replace(
                '{interaction_id}',
                interactionId,
              );
            }
            addLogEntry(
              `Navigate payload updated with interaction ID: ${interactionId}`,
              'success',
            );
          }
        }
      } catch (updateError) {
        const errorMessage =
          updateError instanceof Error ? updateError.message : 'Unknown error';
        addLogEntry(
          `Failed to update navigate payload: ${errorMessage}`,
          'error',
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      addLogEntry(`Interaction creation failed: ${errorMessage}`, 'error');
    }
  } else {
    addLogEntry('Component not ready for createInteraction', 'error');
  }
};

export const startRecording = async (): Promise<void> => {
  if (component?.startRecording) {
    try {
      addLogEntry('Starting recording...', 'info');
      await component.startRecording();
      addLogEntry('Recording started successfully', 'success');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      addLogEntry(`Failed to start recording: ${errorMessage}`, 'error');
    }
  } else {
    addLogEntry('Component not ready for startRecording', 'error');
  }
};

export const stopRecording = async (): Promise<void> => {
  if (component?.stopRecording) {
    try {
      addLogEntry('Stopping recording...', 'info');
      await component.stopRecording();
      addLogEntry('Recording stopped successfully', 'success');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      addLogEntry(`Failed to stop recording: ${errorMessage}`, 'error');
    }
  } else {
    addLogEntry('Component not ready for stopRecording', 'error');
  }
};

export const getStatus = async (): Promise<void> => {
  if (component?.getStatus) {
    try {
      addLogEntry('Getting component status...', 'info');
      const status: GetStatusResponsePayload = await component.getStatus();
      addLogEntry(
        `Component status: ${JSON.stringify(status, null, 2)}`,
        'success',
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      addLogEntry(`Failed to get status: ${errorMessage}`, 'error');
    }
  } else {
    addLogEntry('Component not ready for getStatus', 'error');
  }
};

export const configure = async (): Promise<void> => {
  if (component?.configure) {
    try {
      // Parse the JSON from the textarea
      const payloadElement = document.getElementById(
        'configure-payload',
      ) as HTMLTextAreaElement;
      const payloadText = payloadElement.value;
      let payload: ConfigureAppPayload;

      try {
        payload = JSON.parse(payloadText) as ConfigureAppPayload;
      } catch (jsonError) {
        const errorMessage =
          jsonError instanceof Error ? jsonError.message : 'Unknown JSON error';
        addLogEntry(`Invalid JSON in payload: ${errorMessage}`, 'error');
        return;
      }

      addLogEntry(
        `Configuring app with payload: ${JSON.stringify(payload)}`,
        'info',
      );
      const response: ConfigureAppResponsePayload =
        await component.configure(payload);
      addLogEntry(
        `App configuration successful: ${JSON.stringify(response)}`,
        'success',
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      addLogEntry(`App configuration failed: ${errorMessage}`, 'error');
    }
  } else {
    addLogEntry('Component not ready for configure', 'error');
  }
};

export const setCredentials = async (): Promise<void> => {
  if (component?.setCredentials) {
    try {
      // Parse the JSON from the textarea
      const payloadElement = document.getElementById(
        'set-credentials-payload',
      ) as HTMLTextAreaElement;
      const payloadText = payloadElement.value;
      let payload: { password: string };

      try {
        payload = JSON.parse(payloadText) as { password: string };
      } catch (jsonError) {
        const errorMessage =
          jsonError instanceof Error ? jsonError.message : 'Unknown JSON error';
        addLogEntry(`Invalid JSON in payload: ${errorMessage}`, 'error');
        return;
      }

      addLogEntry('Setting credentials...', 'info');
      await component.setCredentials(payload);
      addLogEntry('Credentials set successfully', 'success');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      addLogEntry(`Failed to set credentials: ${errorMessage}`, 'error');
    }
  } else {
    addLogEntry('Component not ready for setCredentials', 'error');
  }
};

// Export functions to global scope
declare global {
  interface Window {
    showCorti: typeof showCorti;
    hideCorti: typeof hideCorti;
    testAuthentication: typeof testAuthentication;
    configureSession: typeof configureSession;
    addFacts: typeof addFacts;
    navigate: typeof navigate;
    createInteraction: typeof createInteraction;
    startRecording: typeof startRecording;
    stopRecording: typeof stopRecording;
    getStatus: typeof getStatus;
    configure: typeof configure;
    setCredentials: typeof setCredentials;
    clearLog: typeof clearLog;
    addLogEntry: typeof addLogEntry;
    updateStatus: typeof updateStatus;
  }
}

// Assign to window for global access
Object.assign(window, {
  showCorti,
  hideCorti,
  testAuthentication,
  configureSession,
  addFacts,
  navigate,
  createInteraction,
  startRecording,
  stopRecording,
  getStatus,
  configure,
  setCredentials,
  clearLog,
  addLogEntry,
  updateStatus,
});

// Initialize demo when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Populate create-interaction-payload with current date
  const createInteractionPayload = document.getElementById(
    'create-interaction-payload',
  ) as HTMLTextAreaElement;
  if (createInteractionPayload) {
    const currentDate = new Date().toISOString();
    const randomId = `encounter-${Date.now()}`;

    const payload = {
      encounter: {
        identifier: randomId,
        status: 'planned',
        type: 'first_consultation',
        period: {
          startedAt: currentDate,
        },
        title: 'Initial Consultation',
      },
    };

    createInteractionPayload.value = JSON.stringify(payload, null, 2);
  }

  // Add event listeners to buttons
  document.getElementById('show-btn')?.addEventListener('click', showCorti);
  document.getElementById('hide-btn')?.addEventListener('click', hideCorti);
  document
    .getElementById('auth-btn')
    ?.addEventListener('click', testAuthentication);
  document.getElementById('clear-log-btn')?.addEventListener('click', clearLog);
  document
    .getElementById('create-interaction-btn')
    ?.addEventListener('click', createInteraction);
  document
    .getElementById('configure-session-btn')
    ?.addEventListener('click', configureSession);
  document.getElementById('add-facts-btn')?.addEventListener('click', addFacts);
  document.getElementById('navigate-btn')?.addEventListener('click', navigate);
  document
    .getElementById('start-recording-btn')
    ?.addEventListener('click', startRecording);
  document
    .getElementById('stop-recording-btn')
    ?.addEventListener('click', stopRecording);
  document
    .getElementById('get-status-btn')
    ?.addEventListener('click', getStatus);
  document
    .getElementById('configure-btn')
    ?.addEventListener('click', configure);
  document
    .getElementById('set-credentials-btn')
    ?.addEventListener('click', setCredentials);
});

// Initialize when component is defined
customElements.whenDefined('corti-embedded').then(() => {
  updateStatus();
  addLogEntry('Corti component loaded and ready', 'success');

  // Add typed event listeners
  component.addEventListener('error', (event: EmbeddedEventData['error']) => {
    console.log('Error event:', event);
    addLogEntry(`[EVENT] - Component error: ${event.message}`, 'error');
  });

  component.addEventListener('auth-changed', (event: Event) => {
    const customEvent = event as CustomEvent<EmbeddedEventData['auth-changed']>;
    console.log('Auth changed event:', customEvent);
    addLogEntry(
      `[EVENT] - User authenticated: ${customEvent.detail.user.email}`,
      'success',
    );
  });

  component.addEventListener('interaction-created', (event: Event) => {
    const customEvent = event as CustomEvent<
      EmbeddedEventData['interaction-created']
    >;
    console.log('Interaction created event:', customEvent);
    addLogEntry(
      `[EVENT] - Interaction created: ${customEvent.detail.interaction.id}`,
      'success',
    );
  });

  component.addEventListener('recording-started', () => {
    console.log('Recording started event');
    addLogEntry('[EVENT] - Recording started (event)', 'info');
  });

  component.addEventListener('recording-stopped', () => {
    console.log('Recording stopped event');
    addLogEntry('[EVENT] - Recording stopped (event)', 'info');
  });

  component.addEventListener('document-generated', (event: Event) => {
    const customEvent = event as CustomEvent<
      EmbeddedEventData['document-generated']
    >;
    console.log('Document generated event:', customEvent);
    addLogEntry(
      `[EVENT] - Document generated: ${customEvent.detail.document.id}`,
      'success',
    );
  });

  component.addEventListener('document-updated', (event: Event) => {
    const customEvent = event as CustomEvent<
      EmbeddedEventData['document-updated']
    >;
    console.log('Document updated event:', customEvent);
    addLogEntry(
      `[EVENT] - Document updated: ${customEvent.detail.document.id}`,
      'info',
    );
  });

  component.addEventListener('document-synced', (event: Event) => {
    const customEvent = event as CustomEvent<
      EmbeddedEventData['document-synced']
    >;
    console.log('Document synced event:', customEvent);
    addLogEntry(
      `[EVENT] - Document synced: ${customEvent.detail.document.id}`,
      'success',
    );
  });

  component.addEventListener('navigation-changed', (event: Event) => {
    const customEvent = event as CustomEvent<
      EmbeddedEventData['navigation-changed']
    >;
    console.log('Navigation changed event:', customEvent);
    addLogEntry(
      `[EVENT] - Navigation changed to: ${customEvent.detail.path}`,
      'info',
    );
  });

  component.addEventListener('usage', (event: Event) => {
    const customEvent = event as CustomEvent<EmbeddedEventData['usage']>;
    console.log('Usage event:', customEvent);
    addLogEntry(
      `[EVENT] - Usage: ${customEvent.detail.creditsConsumed} credits`,
      'info',
    );
  });
});
