import { expect } from '@open-wc/testing';
import {
  React,
  createRoot,
  type Root,
  CortiEmbeddedReact,
  type CortiEmbeddedReactRef,
} from './vendor/react-test-bundle.js';

describe('CortiEmbeddedReact', () => {
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

    throw new Error('CortiEmbeddedReact ref was not attached');
  }

  beforeEach(() => {
    container = document.createElement('div');
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

  it('fires onReady only once per mounted component instance', async () => {
    const readyCalls: unknown[] = [];
    const ref = React.createRef<CortiEmbeddedReactRef>();

    root!.render(
      React.createElement(CortiEmbeddedReact, {
        ref,
        baseURL: 'https://assistant.eu.corti.app',
        onReady: detail => {
          readyCalls.push(detail);
        },
      }),
    );

    const el = await waitForRef(ref);
    await flushReact();
    expect(el).to.exist;

    el.dispatchEvent(new CustomEvent('embedded.ready', { detail: { a: 1 } }));
    el.dispatchEvent(new CustomEvent('embedded.ready', { detail: { a: 2 } }));

    expect(readyCalls).to.deep.equal([{ a: 1 }]);
  });
});
