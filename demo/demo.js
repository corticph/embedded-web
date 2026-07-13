// Demo functionality for Corti Embedded Web Component
const component = document.getElementById("corti-component");

// Define functions in global scope
window.showCorti = () => {
  if (component?.show) {
    component.show();
    window.updateStatus();
    window.addLogEntry("Corti component shown", "info");
  }
};

window.hideCorti = () => {
  if (component?.hide) {
    component.hide();
    window.updateStatus();
    window.addLogEntry("Corti component hidden", "info");
  }
};

window.testAuthentication = async () => {
  if (component?.auth) {
    try {
      // Parse the JSON from the textarea
      const authPayloadText = document.getElementById("auth-payload").value;
      let authPayload;
      try {
        authPayload = JSON.parse(authPayloadText);
      } catch (jsonError) {
        window.addLogEntry(
          `Invalid JSON in payload: ${jsonError.message}`,
          "error",
        );
        return;
      }

      window.addLogEntry(
        `Sending authentication request with payload: ${JSON.stringify(authPayload)}`,
        "info",
      );
      const response = await component.auth(authPayload);
      window.addLogEntry(
        `Authentication successful: ${JSON.stringify(response)}`,
        "success",
      );
    } catch (error) {
      window.addLogEntry(`Authentication failed: ${error.message}`, "error");
    }
  } else {
    window.addLogEntry("Component not ready for postMessage", "error");
  }
};

window.showDeviceLinkQR = async () => {
  if (component?.showDeviceLinkQR) {
    try {
      const payloadText = document.getElementById(
        "device-link-qr-payload",
      ).value;
      let payload;
      try {
        payload = JSON.parse(payloadText);
      } catch (jsonError) {
        window.addLogEntry(
          `Invalid JSON in payload: ${jsonError.message}`,
          "error",
        );
        return;
      }

      window.addLogEntry("Showing device-link QR", "info");
      const response = await component.showDeviceLinkQR(payload);
      window.addLogEntry(
        `Device-link QR finished with status: ${response.status}`,
        "success",
      );
    } catch (error) {
      window.addLogEntry(`Device-link QR failed: ${error.message}`, "error");
    }
  } else {
    window.addLogEntry("Component not ready for showDeviceLinkQR", "error");
  }
};

window.configureApp = async () => {
  if (component?.configureApp) {
    try {
      const payloadText = document.getElementById(
        "configure-app-payload",
      ).value;
      let payload;
      try {
        payload = JSON.parse(payloadText);
      } catch (jsonError) {
        window.addLogEntry(
          `Invalid JSON in payload: ${jsonError.message}`,
          "error",
        );
        return;
      }

      window.addLogEntry(
        `Configuring app with payload: ${JSON.stringify(payload)}`,
        "info",
      );
      await component.configureApp(payload);
      window.addLogEntry("App configuration successful", "success");
    } catch (error) {
      window.addLogEntry(`App configuration failed: ${error.message}`, "error");
    }
  } else {
    window.addLogEntry("Component not ready for configureApp", "error");
  }
};

window.setInteractionOptions = async () => {
  if (component?.setInteractionOptions) {
    try {
      const payloadText = document.getElementById(
        "interaction-options-payload",
      ).value;
      let payload;
      try {
        payload = JSON.parse(payloadText);
      } catch (jsonError) {
        window.addLogEntry(
          `Invalid JSON in payload: ${jsonError.message}`,
          "error",
        );
        return;
      }

      window.addLogEntry(
        `Setting interaction options with payload: ${JSON.stringify(payload)}`,
        "info",
      );
      await component.setInteractionOptions(payload);
      window.addLogEntry("Interaction options set successfully", "success");
    } catch (error) {
      window.addLogEntry(
        `Set interaction options failed: ${error.message}`,
        "error",
      );
    }
  } else {
    window.addLogEntry(
      "Component not ready for setInteractionOptions",
      "error",
    );
  }
};

window.configureLegacy = async () => {
  if (component?.configure) {
    try {
      const payloadText = document.getElementById(
        "legacy-configure-payload",
      ).value;
      let payload;
      try {
        payload = JSON.parse(payloadText);
      } catch (jsonError) {
        window.addLogEntry(
          `Invalid JSON in payload: ${jsonError.message}`,
          "error",
        );
        return;
      }

      window.addLogEntry(
        `Sending legacy configure payload: ${JSON.stringify(payload)}`,
        "info",
      );
      await component.configure(payload);
      window.addLogEntry("Legacy configure successful", "success");
    } catch (error) {
      window.addLogEntry(`Legacy configure failed: ${error.message}`, "error");
    }
  } else {
    window.addLogEntry("Component not ready for configure", "error");
  }
};

window.configureSessionLegacy = async () => {
  if (component?.configureSession) {
    try {
      const payloadText = document.getElementById(
        "legacy-configure-session-payload",
      ).value;
      let payload;
      try {
        payload = JSON.parse(payloadText);
      } catch (jsonError) {
        window.addLogEntry(
          `Invalid JSON in payload: ${jsonError.message}`,
          "error",
        );
        return;
      }

      window.addLogEntry(
        `Sending legacy configureSession payload: ${JSON.stringify(payload)}`,
        "info",
      );
      await component.configureSession(payload);
      window.addLogEntry("Legacy configureSession successful", "success");
    } catch (error) {
      window.addLogEntry(
        `Legacy configureSession failed: ${error.message}`,
        "error",
      );
    }
  } else {
    window.addLogEntry("Component not ready for configureSession", "error");
  }
};

window.addFacts = async () => {
  if (component?.addFacts) {
    try {
      // Parse the JSON from the textarea
      const payloadText = document.getElementById("add-facts-payload").value;
      let payload;
      try {
        payload = JSON.parse(payloadText);
      } catch (jsonError) {
        window.addLogEntry(
          `Invalid JSON in payload: ${jsonError.message}`,
          "error",
        );
        return;
      }

      window.addLogEntry(
        `Adding facts with payload: ${JSON.stringify(payload)}`,
        "info",
      );
      await component.addFacts(payload);
      window.addLogEntry("Add facts successful", "success");
    } catch (error) {
      window.addLogEntry(`Add facts failed: ${error.message}`, "error");
    }
  } else {
    window.addLogEntry("Component not ready for addFacts", "error");
  }
};

window.navigate = async () => {
  if (component?.navigate) {
    try {
      // Parse the JSON from the textarea
      const payloadText = document.getElementById("navigate-payload").value;
      let payload;
      try {
        payload = JSON.parse(payloadText);
      } catch (jsonError) {
        window.addLogEntry(
          `Invalid JSON in payload: ${jsonError.message}`,
          "error",
        );
        return;
      }

      window.addLogEntry(
        `Navigating with payload: ${JSON.stringify(payload)}`,
        "info",
      );
      await component.navigate(payload);
      window.addLogEntry("Navigation successful", "success");
    } catch (error) {
      window.addLogEntry(`Navigation failed: ${error.message}`, "error");
    }
  } else {
    window.addLogEntry("Component not ready for navigate", "error");
  }
};

window.createInteraction = async () => {
  if (component?.createInteraction) {
    try {
      // Parse the JSON from the textarea
      const payloadText = document.getElementById(
        "create-interaction-payload",
      ).value;
      let payload;
      try {
        payload = JSON.parse(payloadText);
      } catch (jsonError) {
        window.addLogEntry(
          `Invalid JSON in payload: ${jsonError.message}`,
          "error",
        );
        return;
      }

      window.addLogEntry(
        `Creating interaction with payload: ${JSON.stringify(payload)}`,
        "info",
      );
      const response = await component.createInteraction(payload);
      window.addLogEntry(
        `Interaction creation successful: ${JSON.stringify(response)}`,
        "success",
      );
      // Update navigate payload textarea with the returned interaction ID
      try {
        const interactionId = response.id || null;
        if (interactionId) {
          const navTextarea = document.getElementById("navigate-payload");
          if (navTextarea) {
            try {
              const navPayload = JSON.parse(navTextarea.value);
              if (navPayload && typeof navPayload === "string") {
                navPayload.path = navPayload.path.replace(
                  "{interaction_id}",
                  String(interactionId),
                );
                navTextarea.value = JSON.stringify(navPayload, null, 2);
              } else {
                // Fallback to string replace if unexpected structure
                navTextarea.value = String(navTextarea.value).replace(
                  "{interaction_id}",
                  String(interactionId),
                );
              }
            } catch {
              // Fallback to string replace if JSON is invalid
              navTextarea.value = String(navTextarea.value).replace(
                "{interaction_id}",
                String(interactionId),
              );
            }
            window.addLogEntry(
              `Navigate payload updated with interaction ID: ${interactionId}`,
              "success",
            );
          }
        }
      } catch (updateError) {
        window.addLogEntry(
          `Failed to update navigate payload: ${updateError.message}`,
          "error",
        );
      }
    } catch (error) {
      window.addLogEntry(
        `Interaction creation failed: ${error.message}`,
        "error",
      );
    }
  } else {
    window.addLogEntry("Component not ready for createInteraction", "error");
  }
};

window.clearLog = () => {
  const logElement = document.getElementById("log");
  logElement.innerHTML = '<div class="log-entry log-info">Log cleared...</div>';
};

window.addLogEntry = (message, type = "info") => {
  const logElement = document.getElementById("log");
  const entry = document.createElement("div");
  entry.className = `log-entry log-${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logElement.appendChild(entry);
  logElement.scrollTop = logElement.scrollHeight;
};

window.updateStatus = () => {
  const statusElement = document.getElementById("status");

  if (component) {
    const baseURL = component.getAttribute("baseURL");

    statusElement.innerHTML = `
            <strong>Current Status:</strong><br>
            Base URL: ${baseURL}<br>
            Component Ready: ${component.show && component.hide ? "Yes" : "No"}<br>
        `;
  } else {
    statusElement.innerHTML = "Status: Component not found";
  }
};

// Initialize demo when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Generate random encounter ID for create interaction
  const createInteractionPayload = document.getElementById(
    "create-interaction-payload",
  );
  if (createInteractionPayload) {
    const randomId = `encounter-${Date.now()}`;
    const payload = {
      assignedUserId: null,
      encounter: {
        identifier: randomId,
        status: "planned",
        type: "first_consultation",
        period: {
          startedAt: new Date().toISOString(),
        },
      },
    };
    createInteractionPayload.value = JSON.stringify(payload, null, 2);
  }

  // Add event listeners to buttons
  document
    .getElementById("show-btn")
    .addEventListener("click", window.showCorti);
  document
    .getElementById("hide-btn")
    .addEventListener("click", window.hideCorti);
  document
    .getElementById("auth-btn")
    .addEventListener("click", window.testAuthentication);
  document
    .getElementById("device-link-qr-btn")
    .addEventListener("click", window.showDeviceLinkQR);
  document
    .getElementById("clear-log-btn")
    .addEventListener("click", window.clearLog);
  document
    .getElementById("create-interaction-btn")
    .addEventListener("click", window.createInteraction);
  document
    .getElementById("configure-app-btn")
    .addEventListener("click", window.configureApp);
  document
    .getElementById("set-interaction-options-btn")
    .addEventListener("click", window.setInteractionOptions);
  document
    .getElementById("legacy-configure-btn")
    .addEventListener("click", window.configureLegacy);
  document
    .getElementById("legacy-configure-session-btn")
    .addEventListener("click", window.configureSessionLegacy);
  document
    .getElementById("add-facts-btn")
    .addEventListener("click", window.addFacts);
  document
    .getElementById("navigate-btn")
    .addEventListener("click", window.navigate);

  // Update status periodically
  setInterval(window.updateStatus, 1000);
});

// Initialize when component is defined
customElements.whenDefined("corti-embedded").then(() => {
  window.updateStatus();
  window.addLogEntry("Corti component loaded and ready", "success");
  component.addEventListener("error", event => {
    console.log(event.detail);
  });
  component.addEventListener("add-facts", event => {
    console.log(event.detail);
  });
});
