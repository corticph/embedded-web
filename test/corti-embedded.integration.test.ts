import { expect, fixture } from "@open-wc/testing";
import { html } from "lit";
import type { CortiEmbedded } from "../src/CortiEmbedded.js";
import "../src/corti-embedded.js";
import type {
  ConfigurePayload,
  ConfigureApplicationPayload,
  CreateInteractionPayload,
  Fact,
  KeycloakTokenResponse,
  NavigatePayload,
  SessionConfig,
  SetCredentialsPayload,
  SetInteractionOptionsPayload,
} from "../src/web-index.js";

interface EmbeddedEventDetail {
  name: string;
  payload: unknown;
}

interface RequestReceivedPayload {
  action: string;
  payload?: unknown;
  hasRequestId: boolean;
  version: string;
}

const integrationBaseURL = "https://assistant.integration.corti.app";

const authPayload: KeycloakTokenResponse = {
  access_token: "integration-token",
  token_type: "Bearer",
};

const createInteractionPayload: CreateInteractionPayload = {
  assignedUserId: "integration-user",
  encounter: {
    identifier: "integration-encounter",
    status: "planned",
    type: "first_consultation",
    period: {
      startedAt: "2026-07-09T00:00:00.000Z",
    },
    title: "Integration Encounter",
  },
  patient: {
    identifier: "integration-patient",
    name: "Integration Patient",
  },
};

const configureAppPayload: ConfigureApplicationPayload = {
  debug: true,
  ui: { navigation: true },
  appearance: { primaryColor: "#0055ff" },
};

const configurePayload: ConfigurePayload = {
  debug: false,
  features: { aiChat: false },
  appearance: { primaryColor: null },
};

const sessionConfig: SessionConfig = {
  defaultLanguage: "en",
  defaultMode: "virtual",
};

const factsPayload: Fact[] = [
  {
    text: "Patient reports chest pain",
    group: "subjective",
  },
];

const interactionOptionsPayload: SetInteractionOptionsPayload = {
  mode: {
    fallback: "virtual",
    options: ["virtual"],
  },
  spokenLanguage: {
    fallback: "en",
  },
};

const credentialsPayload: SetCredentialsPayload = {
  password: "integration-password",
};

const navigatePayload: NavigatePayload = {
  path: "/summary",
};

function waitForEmbeddedEvent(
  el: CortiEmbedded,
  eventName: string,
  timeoutMs = 2000,
): Promise<CustomEvent<EmbeddedEventDetail>> {
  return new Promise((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const listener = (event: Event) => {
      const customEvent = event as CustomEvent<EmbeddedEventDetail>;
      if (customEvent.detail?.name !== eventName) {
        return;
      }

      clearTimeout(timeoutId);
      el.removeEventListener("event", listener);
      resolve(customEvent);
    };

    timeoutId = setTimeout(() => {
      el.removeEventListener("event", listener);
      reject(new Error(`Timed out waiting for ${eventName}`));
    }, timeoutMs);

    el.addEventListener("event", listener);
  });
}

async function mountEmbeddedIntegration(): Promise<CortiEmbedded> {
  const el = await fixture<CortiEmbedded>(
    html`<corti-embedded baseurl=${integrationBaseURL}></corti-embedded>`,
  );

  await waitForEmbeddedEvent(el, "embedded.ready");
  return el;
}

async function captureRequest<T>(
  el: CortiEmbedded,
  requestEvents: RequestReceivedPayload[],
  callback: () => Promise<T>,
): Promise<T> {
  const requestEvent = waitForEmbeddedEvent(el, "test.request-received");
  const [event, result] = await Promise.all([requestEvent, callback()]);
  requestEvents.push(event.detail.payload as RequestReceivedPayload);
  return result;
}

async function withoutConsoleWarn<T>(callback: () => Promise<T>): Promise<T> {
  const originalWarn = console.warn;
  console.warn = () => {};

  try {
    return await callback();
  } finally {
    console.warn = originalWarn;
  }
}

describe("CortiEmbedded browser integration", () => {
  it("round-trips public API calls through a real iframe", async () => {
    const el = await mountEmbeddedIntegration();
    const requestEvents: RequestReceivedPayload[] = [];

    const user = await captureRequest(el, requestEvents, () =>
      el.auth(authPayload),
    );
    expect(user).to.deep.equal({
      id: "integration-user",
      email: "integration@example.test",
    });

    const interaction = await captureRequest(el, requestEvents, () =>
      el.createInteraction(createInteractionPayload),
    );
    expect(interaction).to.deep.equal({
      id: "integration-interaction",
      createdAt: "2026-07-09T00:00:00.000Z",
    });

    await withoutConsoleWarn(() =>
      captureRequest(el, requestEvents, () =>
        el.configureSession(sessionConfig),
      ),
    );

    await captureRequest(el, requestEvents, () => el.addFacts(factsPayload));

    await captureRequest(el, requestEvents, () => el.navigate(navigatePayload));

    await captureRequest(el, requestEvents, () => el.startRecording());

    await captureRequest(el, requestEvents, () => el.stopRecording());

    const configureAppResponse = await captureRequest(el, requestEvents, () =>
      el.configureApp(configureAppPayload),
    );
    expect(configureAppResponse.ui.navigation).to.equal(true);

    const configureResponse = await withoutConsoleWarn(() =>
      captureRequest(el, requestEvents, () => el.configure(configurePayload)),
    );
    expect(configureResponse.features.aiChat).to.equal(false);

    await captureRequest(el, requestEvents, () =>
      el.setInteractionOptions(interactionOptionsPayload),
    );

    await captureRequest(el, requestEvents, () =>
      el.setCredentials(credentialsPayload),
    );

    const status = await captureRequest(el, requestEvents, () =>
      el.getStatus(),
    );
    expect(status.auth.isAuthenticated).to.equal(true);
    expect(status.currentUrl).to.equal("/summary");

    const templates = await captureRequest(el, requestEvents, () =>
      el.getTemplates(),
    );
    expect(templates.templates[0].id).to.equal("integration-template");

    expect(
      requestEvents.map(({ action, hasRequestId, version }) => ({
        action,
        hasRequestId,
        version,
      })),
    ).to.deep.equal([
      {
        action: "auth",
        hasRequestId: true,
        version: "v1",
      },
      {
        action: "createInteraction",
        hasRequestId: true,
        version: "v1",
      },
      {
        action: "configureSession",
        hasRequestId: true,
        version: "v1",
      },
      {
        action: "addFacts",
        hasRequestId: true,
        version: "v1",
      },
      {
        action: "navigate",
        hasRequestId: true,
        version: "v1",
      },
      {
        action: "startRecording",
        hasRequestId: true,
        version: "v1",
      },
      {
        action: "stopRecording",
        hasRequestId: true,
        version: "v1",
      },
      {
        action: "configureApp",
        hasRequestId: true,
        version: "v1",
      },
      {
        action: "configure",
        hasRequestId: true,
        version: "v1",
      },
      {
        action: "setInteractionOptions",
        hasRequestId: true,
        version: "v1",
      },
      {
        action: "setCredentials",
        hasRequestId: true,
        version: "v1",
      },
      {
        action: "getStatus",
        hasRequestId: true,
        version: "v1",
      },
      {
        action: "getTemplates",
        hasRequestId: true,
        version: "v1",
      },
    ]);
    expect(requestEvents[0].payload).to.deep.include(authPayload);
    expect(requestEvents[1].payload).to.deep.equal(createInteractionPayload);
    expect(requestEvents[2].payload).to.deep.include(sessionConfig);
    expect(requestEvents[3].payload).to.deep.equal({ facts: factsPayload });
    expect(requestEvents[4].payload).to.deep.equal(navigatePayload);
    expect(requestEvents[5].payload).to.deep.equal({});
    expect(requestEvents[6].payload).to.deep.equal({});
    expect(requestEvents[7].payload).to.deep.equal(configureAppPayload);
    expect(requestEvents[8].payload).to.deep.equal(configurePayload);
    expect(requestEvents[9].payload).to.deep.equal(interactionOptionsPayload);
    expect(requestEvents[10].payload).to.deep.equal(credentialsPayload);
    expect(requestEvents[11].payload).to.deep.equal({});
  });

  it("surfaces events emitted by the embedded iframe", async () => {
    const el = await mountEmbeddedIntegration();
    const requestReceived = waitForEmbeddedEvent(el, "test.request-received");
    const navigated = waitForEmbeddedEvent(el, "embedded.navigated");

    await el.navigate({ path: "/summary" });

    const requestEvent = await requestReceived;
    expect(requestEvent.detail.payload).to.deep.equal({
      action: "navigate",
      payload: { path: "/summary" },
      hasRequestId: true,
      version: "v1",
    });

    const navigatedEvent = await navigated;
    expect(navigatedEvent.detail).to.deep.equal({
      name: "embedded.navigated",
      payload: { path: "/summary" },
    });
  });

  it("toggles visibility through local public methods", async () => {
    const el = await mountEmbeddedIntegration();
    const iframe = el.shadowRoot!.querySelector("iframe") as HTMLIFrameElement;

    expect(iframe.getAttribute("style")).to.contain("display: none");
    el.show();
    await el.updateComplete;
    expect(iframe.getAttribute("style")).to.contain("display: block");

    el.hide();
    await el.updateComplete;
    expect(iframe.getAttribute("style")).to.contain("display: none");
  });
});
