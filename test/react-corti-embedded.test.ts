import { expect } from '@open-wc/testing';
import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  CortiEmbeddedReact,
  type CortiEmbeddedReactRef,
} from '../src/react/CortiEmbeddedReact.js';

describe('CortiEmbeddedReact', () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  async function flushReact() {
    await new Promise(resolve => {
      setTimeout(resolve, 0);
    });
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

    await flushReact();

    const el = ref.current;
    expect(el).to.exist;

    el!.dispatchEvent(new CustomEvent('embedded.ready', { detail: { a: 1 } }));
    el!.dispatchEvent(new CustomEvent('embedded.ready', { detail: { a: 2 } }));

    expect(readyCalls).to.deep.equal([{ a: 1 }]);
  });
});
