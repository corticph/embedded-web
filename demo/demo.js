// Demo functionality for Corti Embedded Web Component
const component = document.getElementById('corti-component');

// Define functions in global scope
window.showCorti = () => {
  if (component?.show) {
    component.show();
    window.updateStatus();
    window.addLogEntry('Corti component shown', 'info');
  }
};

window.hideCorti = () => {
  if (component?.hide) {
    component.hide();
    window.updateStatus();
    window.addLogEntry('Corti component hidden', 'info');
  }
};

window.testAuthentication = async () => {
  if (component?.auth) {
    try {
      // Parse the JSON from the textarea
      const authPayloadText = document.getElementById('auth-payload').value;
      let authPayload;
      try {
        authPayload = JSON.parse(authPayloadText);
      } catch (jsonError) {
        window.addLogEntry(
          `Invalid JSON in payload: ${jsonError.message}`,
          'error',
        );
        return;
      }

      window.addLogEntry(
        `Sending authentication request with payload: ${JSON.stringify(authPayload)}`,
        'info',
      );
      const response = await component.auth(authPayload);
      window.addLogEntry(
        `Authentication successful: ${JSON.stringify(response)}`,
        'success',
      );
    } catch (error) {
      window.addLogEntry(`Authentication failed: ${error.message}`, 'error');
    }
  } else {
    window.addLogEntry('Component not ready for postMessage', 'error');
  }
};

window.configureSession = async () => {
  if (component?.configureSession) {
    try {
      // Parse the JSON from the textarea
      const payloadText = document.getElementById(
        'configure-session-payload',
      ).value;
      let payload;
      try {
        payload = JSON.parse(payloadText);
      } catch (jsonError) {
        window.addLogEntry(
          `Invalid JSON in payload: ${jsonError.message}`,
          'error',
        );
        return;
      }

      window.addLogEntry(
        `Configuring session with payload: ${JSON.stringify(payload)}`,
        'info',
      );
      await component.configureSession(payload);
      window.addLogEntry('Session configuration successful', 'success');
    } catch (error) {
      window.addLogEntry(
        `Session configuration failed: ${error.message}`,
        'error',
      );
    }
  } else {
    window.addLogEntry('Component not ready for configureSession', 'error');
  }
};

window.addFacts = async () => {
  if (component?.addFacts) {
    try {
      // Parse the JSON from the textarea
      const payloadText = document.getElementById('add-facts-payload').value;
      let payload;
      try {
        payload = JSON.parse(payloadText);
      } catch (jsonError) {
        window.addLogEntry(
          `Invalid JSON in payload: ${jsonError.message}`,
          'error',
        );
        return;
      }

      window.addLogEntry(
        `Adding facts with payload: ${JSON.stringify(payload)}`,
        'info',
      );
      await component.addFacts(payload);
      window.addLogEntry('Add facts successful', 'success');
    } catch (error) {
      window.addLogEntry(`Add facts failed: ${error.message}`, 'error');
    }
  } else {
    window.addLogEntry('Component not ready for addFacts', 'error');
  }
};

window.navigate = async () => {
  if (component?.navigate) {
    try {
      // Parse the JSON from the textarea
      const payloadText = document.getElementById('navigate-payload').value;
      let payload;
      try {
        payload = JSON.parse(payloadText);
      } catch (jsonError) {
        window.addLogEntry(
          `Invalid JSON in payload: ${jsonError.message}`,
          'error',
        );
        return;
      }

      window.addLogEntry(
        `Navigating with payload: ${JSON.stringify(payload)}`,
        'info',
      );
      await component.navigate(payload);
      window.addLogEntry('Navigation successful', 'success');
    } catch (error) {
      window.addLogEntry(`Navigation failed: ${error.message}`, 'error');
    }
  } else {
    window.addLogEntry('Component not ready for navigate', 'error');
  }
};

window.createInteraction = async () => {
  if (component?.createInteraction) {
    try {
      // Parse the JSON from the textarea
      const payloadText = document.getElementById(
        'create-interaction-payload',
      ).value;
      let payload;
      try {
        payload = JSON.parse(payloadText);
      } catch (jsonError) {
        window.addLogEntry(
          `Invalid JSON in payload: ${jsonError.message}`,
          'error',
        );
        return;
      }

      window.addLogEntry(
        `Creating interaction with payload: ${JSON.stringify(payload)}`,
        'info',
      );
      const response = await component.createInteraction(payload);
      window.addLogEntry(
        `Interaction creation successful: ${JSON.stringify(response)}`,
        'success',
      );
      // Update navigate payload textarea with the returned interaction ID
      try {
        const interactionId = response.id || null;
        if (interactionId) {
          const navTextarea = document.getElementById('navigate-payload');
          if (navTextarea) {
            try {
              const navPayload = JSON.parse(navTextarea.value);
              if (navPayload && typeof navPayload === 'string') {
                navPayload.path = navPayload.path.replace(
                  '{interaction_id}',
                  String(interactionId),
                );
                navTextarea.value = JSON.stringify(navPayload, null, 2);
              } else {
                // Fallback to string replace if unexpected structure
                navTextarea.value = String(navTextarea.value).replace(
                  '{interaction_id}',
                  String(interactionId),
                );
              }
            } catch {
              // Fallback to string replace if JSON is invalid
              navTextarea.value = String(navTextarea.value).replace(
                '{interaction_id}',
                String(interactionId),
              );
            }
            window.addLogEntry(
              `Navigate payload updated with interaction ID: ${interactionId}`,
              'success',
            );
          }
        }
      } catch (updateError) {
        window.addLogEntry(
          `Failed to update navigate payload: ${updateError.message}`,
          'error',
        );
      }
    } catch (error) {
      window.addLogEntry(
        `Interaction creation failed: ${error.message}`,
        'error',
      );
    }
  } else {
    window.addLogEntry('Component not ready for createInteraction', 'error');
  }
};

window.clearLog = () => {
  const logElement = document.getElementById('log');
  logElement.innerHTML = '<div class="log-entry log-info">Log cleared...</div>';
};

window.addLogEntry = (message, type = 'info') => {
  const logElement = document.getElementById('log');
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logElement.appendChild(entry);
  logElement.scrollTop = logElement.scrollHeight;
};

window.updateStatus = () => {
  const statusElement = document.getElementById('status');

  if (component) {
    const baseURL = component.getAttribute('baseURL');

    statusElement.innerHTML = `
            <strong>Current Status:</strong><br>
            Base URL: ${baseURL}<br>
            Component Ready: ${component.show && component.hide ? 'Yes' : 'No'}<br>
        `;
  } else {
    statusElement.innerHTML = 'Status: Component not found';
  }
};

// Initialize demo when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Generate random encounter ID for create interaction
  const createInteractionPayload = document.getElementById(
    'create-interaction-payload',
  );
  if (createInteractionPayload) {
    const randomId = `encounter-${Date.now()}`;
    const payload = {
      assignedUserId: null,
      encounter: {
        identifier: randomId,
        status: 'planned',
        type: 'first_consultation',
        period: {
          startedAt: new Date().toISOString(),
        },
      },
    };
    createInteractionPayload.value = JSON.stringify(payload, null, 2);
  }

  // Add event listeners to buttons
  document
    .getElementById('show-btn')
    .addEventListener('click', window.showCorti);
  document
    .getElementById('hide-btn')
    .addEventListener('click', window.hideCorti);
  document
    .getElementById('auth-btn')
    .addEventListener('click', window.testAuthentication);
  document
    .getElementById('clear-log-btn')
    .addEventListener('click', window.clearLog);
  document
    .getElementById('create-interaction-btn')
    .addEventListener('click', window.createInteraction);
  document
    .getElementById('configure-session-btn')
    .addEventListener('click', window.configureSession);
  document
    .getElementById('add-facts-btn')
    .addEventListener('click', window.addFacts);
  document
    .getElementById('navigate-btn')
    .addEventListener('click', window.navigate);

  // Update status periodically
  setInterval(window.updateStatus, 1000);
});

// Initialize when component is defined
customElements.whenDefined('corti-embedded').then(() => {
  window.updateStatus();
  window.addLogEntry('Corti component loaded and ready', 'success');
  component.addEventListener('error', event => {
    console.log(event.detail);
  });
  component.addEventListener('add-facts', event => {
    console.log(event.detail);
  });
});
