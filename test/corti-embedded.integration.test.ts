import { expect, fixture } from "@open-wc/testing";
import { html } from "lit";
import type { CortiEmbedded } from "../src/CortiEmbedded.js";
import "../src/corti-embedded.js";
import type {
  ConfigureApplicationPayload,
  CreateInteractionPayload,
  KeycloakTokenResponse,
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

function waitForEmbeddedEvent(
  el: CortiEmbedded,
  eventName: string,
): Promise<CustomEvent<EmbeddedEventDetail>> {
  return new Promise(resolve => {
    const listener = (event: Event) => {
      const customEvent = event as CustomEvent<EmbeddedEventDetail>;
      if (customEvent.detail?.name !== eventName) {
        return;
      }

      el.removeEventListener("event", listener);
      resolve(customEvent);
    };

    el.addEventListener("event", listener);
  });
}

async function waitForEmbeddedReady(el: CortiEmbedded): Promise<void> {
  return new Promise((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const intervalId = setInterval(() => {
      if (!el.getDebugStatus().postMessageHandlerReady) {
        return;
      }

      clearInterval(intervalId);
      clearTimeout(timeoutId);
      resolve();
    }, 10);

    timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      reject(new Error("Timed out waiting for the embedded integration frame"));
    }, 2000);
  });
}

async function mountEmbeddedIntegration(): Promise<CortiEmbedded> {
  const el = await fixture<CortiEmbedded>(
    html`<corti-embedded baseurl=${integrationBaseURL}></corti-embedded>`,
  );

  await waitForEmbeddedReady(el);
  return el;
}

describe("CortiEmbedded browser integration", () => {
  it("round-trips public API calls through a real iframe", async () => {
    const el = await mountEmbeddedIntegration();
    const requestEvents: RequestReceivedPayload[] = [];

    const collectRequestEvent = async (eventPromise: Promise<CustomEvent>) => {
      const event = await eventPromise;
      requestEvents.push(event.detail.payload as RequestReceivedPayload);
    };

    await Promise.all([
      collectRequestEvent(waitForEmbeddedEvent(el, "test.request-received")),
      el.auth(authPayload).then(user => {
        expect(user).to.deep.equal({
          id: "integration-user",
          email: "integration@example.test",
        });
      }),
    ]);

    await Promise.all([
      collectRequestEvent(waitForEmbeddedEvent(el, "test.request-received")),
      el.createInteraction(createInteractionPayload).then(interaction => {
        expect(interaction).to.deep.equal({
          id: "integration-interaction",
          createdAt: "2026-07-09T00:00:00.000Z",
        });
      }),
    ]);

    await Promise.all([
      collectRequestEvent(waitForEmbeddedEvent(el, "test.request-received")),
      el.configureApp(configureAppPayload).then(config => {
        expect(config.ui.navigation).to.equal(true);
      }),
    ]);

    await Promise.all([
      collectRequestEvent(waitForEmbeddedEvent(el, "test.request-received")),
      el.getStatus().then(status => {
        expect(status.auth.isAuthenticated).to.equal(true);
        expect(status.currentUrl).to.equal("/summary");
      }),
    ]);

    await Promise.all([
      collectRequestEvent(waitForEmbeddedEvent(el, "test.request-received")),
      el.getTemplates().then(result => {
        expect(result.templates[0].id).to.equal("integration-template");
      }),
    ]);

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
        action: "configureApp",
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
    expect(requestEvents[2].payload).to.deep.equal(configureAppPayload);
    expect(requestEvents[3].payload).to.deep.equal({});
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
});
