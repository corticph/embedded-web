import { expect } from "@open-wc/testing";
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

  it("forwards embedded.ready through onEvent as the generic event stream", async () => {
    const eventCalls: Array<CustomEvent<{ name: string; payload: unknown }>> = [];
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
