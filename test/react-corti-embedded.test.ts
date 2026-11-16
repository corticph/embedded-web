import { expect, waitUntil } from "@open-wc/testing";
import {
  EMBEDDED_WEB_PACKAGE_NAME,
  EMBEDDED_WEB_PACKAGE_VERSION,
} from "../src/packageMetadata.js";
import {
  React,
  createRoot,
  type Root,
  CortiEmbeddedReact,
  useCortiEmbeddedApi,
  type CortiEmbeddedReactRef,
  type UseCortiEmbeddedApiResult,
} from "./vendor/react-test-bundle.js";
import type {
  ConfigureApplicationPayload,
  ConfigureApplicationResponse,
  SetInteractionOptionsPayload,
} from "../src/index.js";

describe("CortiEmbeddedReact", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  async function flushReact() {
    await new Promise(resolve => {
      setTimeout(resolve, 0);
    });
  }

  async function waitForRef(
    ref: React.RefObject<CortiEmbeddedReactRef | null>,
  ): Promise<CortiEmbeddedReactRef> {
    for (let i = 0; i < 10; i += 1) {
      if (ref.current) {
        return ref.current;
      }
      // eslint-disable-next-line no-await-in-loop
      await flushReact();
    }

    throw new Error("CortiEmbeddedReact ref was not attached");
  }

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    root?.unmount();
    await flushReact();
    container?.remove();
    root = null;
    container = null;
  });

  it("fires onReady only once per mounted component instance", async () => {
    const readyCalls: CustomEvent[] = [];
    const ref = React.createRef<CortiEmbeddedReactRef>();

    root!.render(
      React.createElement(CortiEmbeddedReact, {
        ref,
        baseURL: "https://assistant.eu.corti.app",
        onReady: event => {
          readyCalls.push(event);
        },
      }),
    );

    const el = await waitForRef(ref);
    await flushReact();
    expect(el).to.exist;

    el.dispatchEvent(new CustomEvent("embedded.ready", { detail: { a: 1 } }));
    el.dispatchEvent(new CustomEvent("embedded.ready", { detail: { a: 2 } }));

    expect(readyCalls).to.have.length(1);
    expect(readyCalls[0].detail).to.deep.equal({ a: 1 });
  });

  it("sets and removes the optional analytics property", async () => {
    const ref = React.createRef<CortiEmbeddedReactRef>();
    const analytics = { is_console: true, integration: "ehr", revision: 2 };

    root!.render(
      React.createElement(CortiEmbeddedReact, {
        ref,
        baseURL: "https://assistant.eu.corti.app",
        analytics,
      }),
    );

    const element = await waitForRef(ref);
    expect(element.analytics).to.deep.equal(analytics);

    root!.render(
      React.createElement(CortiEmbeddedReact, {
        ref,
        baseURL: "https://assistant.eu.corti.app",
      }),
    );
    await flushReact();

    expect(element.analytics).to.equal(undefined);
  });

  it("sends analytics in the first init message without another React render", async () => {
    const analytics = { is_console: true, integration: "qa", revision: 2 };
    const initPayloads: unknown[] = [];

    root!.render(
      React.createElement(CortiEmbeddedReact, {
        baseURL: "https://assistant.integration.corti.app",
        analytics,
        onEvent: event => {
          if (event.detail.name !== "test.request-received") return;
          const request = event.detail.payload as {
            action: string;
            payload: unknown;
          };
          if (request.action === "_init") initPayloads.push(request.payload);
        },
      }),
    );

    await waitUntil(
      () => initPayloads.length > 0,
      "React init request was not received",
    );

    expect(initPayloads).to.deep.equal([
      {
        web_component: EMBEDDED_WEB_PACKAGE_NAME,
        web_component_version: EMBEDDED_WEB_PACKAGE_VERSION,
        analytics,
      },
    ]);
  });

  it("forwards embedded.ready through onEvent as the generic event stream", async () => {
    const eventCalls: Array<CustomEvent<{ name: string; payload: unknown }>> =
      [];
    const ref = React.createRef<CortiEmbeddedReactRef>();

    root!.render(
      React.createElement(CortiEmbeddedReact, {
        ref,
        baseURL: "https://assistant.eu.corti.app",
        onEvent: event => {
          eventCalls.push(event);
        },
      }),
    );

    const el = await waitForRef(ref);
    await flushReact();
    expect(el).to.exist;

    el.dispatchEvent(
      new CustomEvent("event", {
        detail: { name: "embedded.ready", payload: { version: "1.0.0" } },
      }),
    );

    expect(eventCalls).to.have.length(1);
    expect(eventCalls[0].detail).to.deep.equal({
      name: "embedded.ready",
      payload: { version: "1.0.0" },
    });
  });

  it("passes configureApp and setInteractionOptions through the API hook", async () => {
    const ref = React.createRef<CortiEmbeddedReactRef>();
    let api: UseCortiEmbeddedApiResult | null = null;

    function HookConsumer() {
      api = useCortiEmbeddedApi(ref);
      return React.createElement(CortiEmbeddedReact, {
        ref,
        baseURL: "https://assistant.eu.corti.app",
      });
    }

    root!.render(React.createElement(HookConsumer));

    const el = await waitForRef(ref);
    const configureAppCalls: ConfigureApplicationPayload[] = [];
    const setInteractionOptionsCalls: SetInteractionOptionsPayload[] = [];
    const configureAppResponse = {
      debug: false,
    } as ConfigureApplicationResponse;

    el.configureApp = async config => {
      configureAppCalls.push(config);
      return configureAppResponse;
    };
    el.setInteractionOptions = async config => {
      setInteractionOptionsCalls.push(config);
    };

    const configureAppPayload: ConfigureApplicationPayload = {
      ui: { navigation: false },
    };
    const interactionOptionsPayload: SetInteractionOptionsPayload = {
      mode: {
        fallback: "virtual",
        options: ["virtual"],
      },
    };

    const response = await api!.configureApp(configureAppPayload);
    await api!.setInteractionOptions(interactionOptionsPayload);

    expect(response).to.equal(configureAppResponse);
    expect(configureAppCalls).to.deep.equal([configureAppPayload]);
    expect(setInteractionOptionsCalls).to.deep.equal([
      interactionOptionsPayload,
    ]);
  });
});
