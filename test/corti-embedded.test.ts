/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect, fixture } from "@open-wc/testing";
import { html } from "lit";
import { CortiEmbedded } from "../src/CortiEmbedded.js";
import { PostMessageHandler } from "../src/utils/PostMessageHandler.js";
import { EMBEDDED_WEB_PACKAGE_NAME, EMBEDDED_WEB_PACKAGE_VERSION } from "../src/packageMetadata.js";
import "../src/corti-embedded.js";
import type {
  ConfigureApplicationPayload,
  ConfigureAppPayload,
  ConfigureAppResponse,
  ConfigurePayload,
  SetCredentialsPayload,
  SetInteractionOptionsPayload,
  GetStatusResponse,
  InteractionDetails,
  SessionConfig,
  User,
  KeycloakTokenResponse,
} from "../src/web-index.js";

describe("CortiEmbedded", () => {
  const validBaseURL = "https://assistant.eu.corti.app";
  const ensureContentWindow = (iframe: HTMLIFrameElement) => {
    if (!iframe.contentWindow) {
      Object.defineProperty(iframe, "contentWindow", {
        value: window,
        configurable: true,
      });
    }
  };

  it("registers the custom element", () => {
    const ctor = customElements.get("corti-embedded");
    expect(ctor).to.equal(CortiEmbedded);
  });

  it("renders an iframe with the expected src and attributes", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector("iframe") as HTMLIFrameElement;
    expect(iframe).to.exist;
    expect(iframe.getAttribute("sandbox")).to.include("allow-scripts");
    const expectedSrc = `${validBaseURL}/embedded`;
    expect(iframe.getAttribute("src")).to.equal(expectedSrc);
    const allowAttr = iframe.getAttribute("allow")!;
    expect(allowAttr).to.include(`microphone ${validBaseURL}`);
    expect(allowAttr).to.include(`camera ${validBaseURL}`);
    expect(allowAttr).to.include(`clipboard-write ${validBaseURL}`);
  });

  it("allows localhost http baseURL for local development", async () => {
    const localBaseURL = "http://localhost:5173";
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${localBaseURL}></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector("iframe") as HTMLIFrameElement;
    expect(iframe).to.exist;
    expect(iframe.getAttribute("src")).to.equal(`${localBaseURL}/embedded`);
  });

  it("allows IPv6 localhost http baseURL for local development", async () => {
    const localBaseURL = "http://[::1]:5173";
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${localBaseURL}></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector("iframe") as HTMLIFrameElement;
    expect(iframe).to.exist;
    expect(iframe.getAttribute("src")).to.equal(`${localBaseURL}/embedded`);
  });

  it("is hidden by default and toggles visibility with show/hide", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector("iframe") as HTMLIFrameElement;
    expect(iframe.getAttribute("style")).to.contain("display: none");
    el.show();
    await el.updateComplete;
    expect(iframe.getAttribute("style")).to.contain("display: block");
    el.hide();
    await el.updateComplete;
    expect(iframe.getAttribute("style")).to.contain("display: none");
  });

  it("dispatches an error event on invalid baseURL (connectedCallback) without throwing", async () => {
    const el = new CortiEmbedded();
    let errorEvent: CustomEvent | null = null;
    el.addEventListener("error", (evt) => {
      errorEvent = evt as unknown as CustomEvent;
    });
    el.baseURL = "https://example.com";
    let thrown: Error | null = null;
    try {
      el.connectedCallback();
    } catch (e: any) {
      thrown = e;
    }
    // connectedCallback must not throw — consumers handle invalid URLs via the error event
    expect(thrown).to.equal(null);
    expect(errorEvent).to.exist;
    expect((errorEvent!.detail as any).message).to.match(/Invalid baseURL/i);
  });

  it("does not dispatch error event from API catch when error was already notified", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    let count = 0;
    let thrown: Error | null = null;
    el.addEventListener("error", (event) => {
      const detail = (event as unknown as CustomEvent).detail as {
        message?: string;
      };
      if (detail.message === "Failed to configure session") {
        count += 1;
      }
    });

    (el as any).postMessageHandler = {
      postMessage: async () => {
        throw new Error("User must be authenticated to configure session");
      },
      destroy: () => {},
    };

    try {
      await el.configureSession({});
    } catch (error: unknown) {
      thrown = error as Error;
    }

    expect(thrown).to.exist;
    expect(count).to.equal(0);
  });

  it("does not dispatch error event from API catch when the handler rejects", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    let count = 0;
    let thrown: Error | null = null;
    el.addEventListener("error", (event) => {
      const detail = (event as unknown as CustomEvent).detail as {
        message?: string;
      };
      if (detail.message === "Failed to configure session") {
        count += 1;
      }
    });

    (el as any).postMessageHandler = {
      postMessage: async () => {
        throw new Error("User must be authenticated to configure session");
      },
      destroy: () => {},
    };

    try {
      await el.configureSession({});
    } catch (error: unknown) {
      thrown = error as Error;
    }

    expect(thrown).to.exist;
    expect(count).to.equal(0);
  });

  it("dispatches both direct error events without component-side dedupe", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    let count = 0;
    el.addEventListener("error", () => {
      count += 1;
    });
    (el as any).dispatchErrorEvent({
      message: "Duplicate test error",
      code: "TEST",
      details: { a: 1 },
    });
    (el as any).dispatchErrorEvent({
      message: "Duplicate test error",
      code: "TEST",
      details: { a: 1 },
    });

    expect(count).to.equal(2);
  });

  it("forwards iframe error.triggered through the error handler once", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector("iframe") as HTMLIFrameElement;
    ensureContentWindow(iframe);
    iframe.setAttribute("src", `${validBaseURL}/embedded`);
    iframe.dispatchEvent(new Event("load"));

    let embeddedEventCalled = false;
    let errorDetail: unknown;

    el.addEventListener("event", (event: Event) => {
      embeddedEventCalled = true;
    });
    el.addEventListener("error", (event: Event) => {
      errorDetail = (event as CustomEvent).detail;
    });

    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          type: "CORTI_EMBEDDED_EVENT",
          event: "error.triggered",
          payload: { message: "Boom", code: "UNAUTHORIZED" },
        },
        origin: validBaseURL,
        source: iframe.contentWindow as any,
      }),
    );

    expect(embeddedEventCalled).to.equal(false);
    expect(errorDetail).to.deep.equal({
      message: "Boom",
      code: "UNAUTHORIZED",
      details: {
        type: "CORTI_EMBEDDED_EVENT",
        event: "error.triggered",
        payload: { message: "Boom", code: "UNAUTHORIZED" },
      },
    });
  });

  it("updates iframe src and resets handler when baseURL changes", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector("iframe") as HTMLIFrameElement;
    let destroyed = false;
    (el as any).postMessageHandler = {
      destroy: () => {
        destroyed = true;
      },
    };
    // Change baseURL
    el.baseURL = "https://assistant.us.corti.app";
    await el.updateComplete;
    expect(destroyed).to.equal(true);
    expect((el as any).postMessageHandler).to.equal(null);
    expect((el as any).pendingPostMessageHandler).to.be.instanceOf(PostMessageHandler);
    // Check new iframe src
    expect(iframe.getAttribute("src")).to.equal("https://assistant.us.corti.app/embedded");
    const allowAttr = iframe.getAttribute("allow")!;
    expect(allowAttr).to.include(`microphone ${el.baseURL}`);
    expect(allowAttr).to.include(`camera ${el.baseURL}`);
    expect(allowAttr).to.include(`clipboard-write ${el.baseURL}`);
  });

  it("listens as soon as the iframe renders, before it loads", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    expect((el as any).pendingPostMessageHandler).to.be.instanceOf(PostMessageHandler);
    // The public API stays unavailable until the iframe loads or sends ready
    expect((el as any).postMessageHandler).to.equal(null);
  });

  it("handles embedded.ready posted before the iframe load event", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector("iframe") as HTMLIFrameElement;
    ensureContentWindow(iframe);
    const handler = (el as any).pendingPostMessageHandler;

    const actions: string[] = [];
    handler.postMessage = async (message: { action: string }) => {
      actions.push(message.action);
      return { type: "CORTI_EMBEDDED_RESPONSE", success: true };
    };
    let handlerOnReady: unknown = null;
    el.addEventListener("embedded.ready", () => {
      handlerOnReady = (el as any).postMessageHandler;
    });

    // No 'load' event dispatched: the Assistant can post ready first on a cold load.
    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          type: "CORTI_EMBEDDED_EVENT",
          event: "embedded.ready",
          payload: { version: "v1" },
        },
        origin: validBaseURL,
        source: iframe.contentWindow as any,
      }),
    );
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(actions).to.deep.equal(["_init"]);
    // The API is usable by the time consumers receive 'embedded.ready'
    expect(handlerOnReady).to.equal(handler);
    expect((el as any).pendingPostMessageHandler).to.equal(null);
  });

  it("listens again when the element is re-added, before the iframe loads", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const parent = el.parentNode!;
    el.remove();
    expect((el as any).pendingPostMessageHandler).to.equal(null);

    // Re-inserting reloads the iframe, which can post 'embedded.ready' before 'load'
    parent.appendChild(el);
    expect((el as any).pendingPostMessageHandler).to.be.instanceOf(PostMessageHandler);
  });

  it("does not dispatch an error when updated while disconnected", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const errors: unknown[] = [];
    el.addEventListener("error", (event) => {
      errors.push((event as unknown as CustomEvent).detail);
    });
    el.remove();

    el.show();
    await el.updateComplete;

    expect(errors).to.deep.equal([]);
    expect((el as any).pendingPostMessageHandler).to.equal(null);
  });

  it("keeps the handler when baseURL changes to an equivalent URL", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector("iframe") as HTMLIFrameElement;
    ensureContentWindow(iframe);
    iframe.dispatchEvent(new Event("load"));
    const handler = (el as any).postMessageHandler;
    expect(handler).to.be.instanceOf(PostMessageHandler);

    // Same origin, so the iframe does not reload and will not send 'embedded.ready' again
    el.baseURL = `${validBaseURL}/`;
    await el.updateComplete;

    expect((el as any).postMessageHandler).to.equal(handler);
  });

  it("ignores about:blank iframe loads (no handler setup)", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector("iframe") as HTMLIFrameElement;
    ensureContentWindow(iframe);
    // Force about:blank then emit load
    iframe.setAttribute("src", "about:blank");
    iframe.dispatchEvent(new Event("load"));
    expect((el as any).postMessageHandler).to.equal(null);
  });

  it("accepts iframe loads with trailing slash in path", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector("iframe") as HTMLIFrameElement;
    ensureContentWindow(iframe);
    iframe.setAttribute("src", `${validBaseURL}/embedded/`);
    iframe.dispatchEvent(new Event("load"));
    expect((el as any).postMessageHandler).to.exist;
  });

  it("accepts iframe loads with query params", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector("iframe") as HTMLIFrameElement;
    ensureContentWindow(iframe);
    iframe.setAttribute("src", `${validBaseURL}/embedded?x=1&y=2`);
    iframe.dispatchEvent(new Event("load"));
    expect((el as any).postMessageHandler).to.exist;
  });

  it("sends internal wrapper metadata before forwarding embedded.ready", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector("iframe") as HTMLIFrameElement;
    ensureContentWindow(iframe);
    iframe.setAttribute("src", `${validBaseURL}/embedded`);
    iframe.dispatchEvent(new Event("load"));

    const messages: unknown[] = [];
    const fired: string[] = [];
    (el as any).postMessageHandler.postMessage = async (message: unknown) => {
      messages.push(message);
      expect(fired).to.deep.equal([]);
      return { type: "CORTI_EMBEDDED_RESPONSE", success: true };
    };
    el.addEventListener("embedded.ready", () => {
      fired.push("embedded.ready");
    });

    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          type: "CORTI_EMBEDDED_EVENT",
          event: "embedded.ready",
          payload: { version: "v1" },
        },
        origin: validBaseURL,
        source: iframe.contentWindow as any,
      }),
    );
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(messages).to.deep.equal([
      {
        type: "CORTI_EMBEDDED",
        version: "v1",
        action: "_init",
        payload: {
          web_component: EMBEDDED_WEB_PACKAGE_NAME,
          web_component_version: EMBEDDED_WEB_PACKAGE_VERSION,
        },
      },
    ]);
    expect(fired).to.deep.equal(["embedded.ready"]);
  });

  it("dispatches raw event and event payload via dispatchEmbeddedEvent", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    let rawDetail: unknown;
    let embeddedDetail: unknown;

    el.addEventListener("embedded.navigated", (event: Event) => {
      rawDetail = (event as CustomEvent).detail;
    });
    el.addEventListener("event", (event: Event) => {
      embeddedDetail = (event as CustomEvent).detail;
    });

    (el as any).dispatchEmbeddedEvent("embedded.navigated", { path: "/test" });

    expect(rawDetail).to.deep.equal({ path: "/test" });
    expect(embeddedDetail).to.deep.equal({
      name: "embedded.navigated",
      payload: { path: "/test" },
    });
  });

  it("forwards 'embedded.ready' raw and through the event stream", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );

    const fired: string[] = [];
    for (const name of ["embedded.ready", "event"]) {
      el.addEventListener(name, () => fired.push(name));
    }

    (el as any).dispatchEmbeddedEvent("embedded.ready", {});
    expect(fired).to.deep.equal(["embedded.ready", "event"]);
  });

  it("auth throws if component not ready", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const credentials: KeycloakTokenResponse = {
      access_token: "test-token",
      token_type: "Bearer",
    };

    try {
      await el.auth(credentials);
      expect.fail("Expected component not ready error");
    } catch (e: any) {
      expect(String(e.message || e)).to.match(/Component not ready/);
    }
  });

  it("delegates methods to PostMessageHandler when available", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );

    // Mock user data
    const mockUser: User = {
      id: "user123",
      email: "test@example.com",
    };

    const mockInteraction: InteractionDetails = {
      id: "int123",
      createdAt: "2024-01-01T00:00:00Z",
      status: "planned",
    };

    const mockStatus: GetStatusResponse = {
      auth: {
        isAuthenticated: true,
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
      },
      applicationVersion: "1.0.0",
      currentUrl: "https://example.com",
      interaction: null,
      isMedicalDevice: false,
    };

    // Inject a minimal mock handler that responds via the generic postMessage interface
    (el as any).postMessageHandler = {
      postMessage: async (msg: { action: string }) => {
        switch (msg.action) {
          case "auth":
            return { success: true, payload: { user: mockUser } };
          case "createInteraction":
            return { success: true, payload: mockInteraction };
          case "getStatus":
            return { success: true, payload: mockStatus };
          default:
            return { success: true, payload: {} };
        }
      },
      waitForReady: async () => {},
      destroy: () => {},
      ready: true,
    };

    const credentials: SetCredentialsPayload = {
      password: "test-password",
    };

    const sessionConfig: SessionConfig = {
      defaultLanguage: "en",
      defaultMode: "virtual",
    };

    const authPayload: KeycloakTokenResponse = {
      access_token: "test-token",
      token_type: "Bearer",
    };

    // Test all the API methods
    const user = await el.auth(authPayload);
    expect(user).to.deep.equal(mockUser);

    const randomId = `encounter-${Date.now()}`;
    const interaction = await el.createInteraction({
      assignedUserId: user.id,
      encounter: {
        identifier: randomId,
        status: "planned",
        type: "first_consultation",
        period: {
          startedAt: new Date().toDateString(),
        },
        title: "Initial Consultation",
      },
      patient: {
        identifier: randomId,
        name: "John Doe",
        gender: "male",
        birthDate: new Date().toDateString(),
      },
    });
    expect(interaction).to.deep.equal(mockInteraction);

    await el.configureSession(sessionConfig);
    await el.addFacts([{ text: "test", group: "my note" }]);
    await el.navigate({ path: "/test" });
    await el.startRecording();
    await el.stopRecording();
    await el.setCredentials(credentials);

    const status = await el.getStatus();
    expect(status).to.deep.equal(mockStatus);

    // Note: configure method would normally change baseURL, but our mock doesn't handle that
  });

  it("exempts showDeviceLinkQR from the default postMessage timeout", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const messages: Array<{ action: string; timeout?: number | null }> = [];

    (el as any).postMessageHandler = {
      postMessage: async (msg: { action: string }, timeout?: number | null) => {
        messages.push({ action: msg.action, timeout });
        return { success: true, payload: { status: "approved" } };
      },
      destroy: () => {},
      ready: true,
    };

    const result = await el.showDeviceLinkQR({
      access_token: "access-token",
      expires_in: 300,
      refresh_token: "refresh-token",
      token_type: "Bearer",
    });

    expect(result).to.deep.equal({ status: "approved" });
    expect(messages).to.deep.equal([
      { action: "showDeviceLinkQR", timeout: null },
    ]);
  });

  it("normalizes legacy string navigate input before forwarding", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const messages: Array<{ action: string; payload?: unknown }> = [];

    (el as any).postMessageHandler = {
      postMessage: async (msg: { action: string; payload?: unknown }) => {
        messages.push(msg);
        return { success: true, payload: {} };
      },
      destroy: () => {},
      ready: true,
    };

    await el.navigate("/legacy-path");
    await el.navigate({ path: "/object-path" });

    expect(messages).to.deep.equal([
      {
        type: "CORTI_EMBEDDED",
        version: "v1",
        action: "navigate",
        payload: { path: "/legacy-path" },
      },
      {
        type: "CORTI_EMBEDDED",
        version: "v1",
        action: "navigate",
        payload: { path: "/object-path" },
      },
    ]);
  });

  it("dispatches error event when baseURL becomes invalid (updated) without throwing", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector("iframe") as HTMLIFrameElement;
    // Ensure it starts valid
    expect(iframe.getAttribute("src")).to.equal(`${validBaseURL}/embedded`);

    let errorEvent: CustomEvent | null = null;
    el.addEventListener("error", (evt) => {
      errorEvent = evt as unknown as CustomEvent;
    });

    el.baseURL = "https://example.com";
    // updateComplete must not reject after the fix
    await el.updateComplete;

    expect(errorEvent).to.exist;
    expect((errorEvent!.detail as any).message).to.match(/Invalid baseURL/i);
    // The iframe src should have been reset to about:blank
    expect(iframe.getAttribute("src")).to.equal("about:blank");
  });

  it("returns proper status when component is not ready", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );

    const status = await el.getStatus();
    expect(status).to.deep.equal({
      auth: {
        isAuthenticated: false,
        user: undefined,
      },
      applicationVersion: "",
      currentUrl: "",
      interaction: null,
      isMedicalDevice: false,
    });
  });

  it("passes through configureApp and setInteractionOptions via postMessage", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const messages: Array<{ action: string; payload?: unknown }> = [];
    const configureAppResponse = {
      debug: true,
      appearance: { primaryColor: "#000000" },
      ui: {
        interactionTitle: true,
        aiChat: true,
        documentFeedback: true,
        navigation: false,
      },
      locale: { interfaceLanguage: "da" },
      network: { websocketBaseUrl: "wss://example.test" },
    };

    (el as any).postMessageHandler = {
      postMessage: async (msg: { action: string; payload?: unknown }) => {
        messages.push(msg);
        return {
          success: true,
          payload: msg.action === "configureApp" ? configureAppResponse : {},
        };
      },
      destroy: () => {},
      ready: true,
    };

    const configureAppPayload: ConfigureApplicationPayload = {
      debug: true,
      ui: { navigation: false },
      appearance: { primaryColor: "#000000" },
    };
    const interactionOptionsPayload: SetInteractionOptionsPayload = {
      mode: {
        fallback: "virtual",
        options: ["virtual"],
      },
    };

    const response = await el.configureApp(configureAppPayload);
    await el.setInteractionOptions(interactionOptionsPayload);

    expect(response).to.deep.equal(configureAppResponse);
    expect(messages).to.deep.equal([
      {
        type: "CORTI_EMBEDDED",
        version: "v1",
        action: "configureApp",
        payload: configureAppPayload,
      },
      {
        type: "CORTI_EMBEDDED",
        version: "v1",
        action: "setInteractionOptions",
        payload: interactionOptionsPayload,
      },
    ]);
  });

  it("passes through deprecated config methods and emits console warnings", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const messages: Array<{ action: string; payload?: unknown }> = [];
    const warnings: string[] = [];
    const originalWarn = console.warn;
    const configureResponse = {
      debug: false,
      appearance: { primaryColor: null },
      features: {
        interactionTitle: true,
        aiChat: false,
        documentFeedback: true,
        navigation: true,
        virtualMode: false,
        syncDocumentAction: true,
        templateEditor: false,
      },
      locale: { interfaceLanguage: "en" },
      network: { websocketBaseUrl: null },
    };

    console.warn = (message?: unknown) => {
      warnings.push(String(message));
    };

    (el as any).postMessageHandler = {
      postMessage: async (msg: { action: string; payload?: unknown }) => {
        messages.push(msg);
        return {
          success: true,
          payload: msg.action === "configure" ? configureResponse : {},
        };
      },
      destroy: () => {},
      ready: true,
    };

    const configurePayload: ConfigurePayload = {
      features: { aiChat: false },
    };
    const legacyConfigureAppPayload: ConfigureAppPayload = configurePayload;
    const legacyConfigureAppResponse: ConfigureAppResponse = configureResponse;
    const sessionConfig: SessionConfig = {
      defaultLanguage: "da",
      defaultOutputLanguage: "da",
      defaultTemplateKey: "corti-soap",
      defaultMode: "in-person",
    };

    try {
      const response = await el.configure(configurePayload);
      await el.configureSession(sessionConfig);

      expect(response).to.deep.equal(configureResponse);
      expect(legacyConfigureAppPayload).to.deep.equal(configurePayload);
      expect(legacyConfigureAppResponse).to.deep.equal(configureResponse);
      expect(messages).to.deep.equal([
        {
          type: "CORTI_EMBEDDED",
          version: "v1",
          action: "configure",
          payload: configurePayload,
        },
        {
          type: "CORTI_EMBEDDED",
          version: "v1",
          action: "configureSession",
          payload: sessionConfig,
        },
      ]);
      expect(warnings[0]).to.contain("configure() is deprecated");
      expect(warnings[0]).to.contain("https://docs.corti.ai/assistant/deprecation-timeline");
      expect(warnings[1]).to.contain("configureSession() is deprecated");
      expect(warnings[1]).to.contain("https://docs.corti.ai/assistant/deprecation-timeline");
    } finally {
      console.warn = originalWarn;
    }
  });
});
