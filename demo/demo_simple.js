// Simplified demo: direct calls without UI updates, logging, or error handling
const component = document.getElementById('corti-component');

window.showCorti = function showCorti() {
  component.show();
};

window.hideCorti = function hideCorti() {
  component.hide();
};

window.testAuthentication = function testAuthentication() {
  const authPayloadText = document.getElementById('auth-payload').value;
  const authPayload = JSON.parse(authPayloadText);
  return component.auth(authPayload);
};

window.configureSession = function configureSession() {
  const payloadText = document.getElementById(
    'configure-session-payload',
  ).value;
  const payload = JSON.parse(payloadText);
  return component.configureSession(payload);
};

window.addFacts = function addFacts() {
  const payloadText = document.getElementById('add-facts-payload').value;
  const payload = JSON.parse(payloadText);
  return component.addFacts(payload);
};

window.navigate = function navigate() {
  const payloadText = document.getElementById('navigate-payload').value;
  const payload = JSON.parse(payloadText);
  return component.navigate(payload);
};

window.createInteraction = function createInteraction() {
  const payloadText = document.getElementById(
    'create-interaction-payload',
  ).value;
  const payload = JSON.parse(payloadText);
  return component.createInteraction(payload);
};

component.addEventListener('error', event => {
  console.log(event.detail);
});
