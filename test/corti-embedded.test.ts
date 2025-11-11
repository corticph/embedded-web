import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';
import { CortiEmbedded } from '../src/CortiEmbedded.js';
import '../src/corti-embedded.js';
import { EventDispatcher } from '../src/services/EventDispatcher.js';

describe('CortiEmbedded', () => {
  it('registers the custom element', () => {
    const ctor = customElements.get('corti-embedded');
    expect(ctor).to.equal(CortiEmbedded);
  });

  it('renders an iframe with the expected src and attributes', async () => {
    const el = await fixture<CortiEmbedded>(html`<corti-embedded></corti-embedded>`);
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe).to.exist;
    expect(iframe.getAttribute('sandbox')).to.include('allow-scripts');
    const expectedSrc = 'https://assistant.eu.corti.app/embedded';
    expect(iframe.getAttribute('src')).to.equal(expectedSrc);
    const allowAttr = iframe.getAttribute('allow')!;
    expect(allowAttr).to.include('"https://assistant.eu.corti.app"');
  });

  it('is hidden by default and toggles visibility with show/hide', async () => {
    const el = await fixture<CortiEmbedded>(html`<corti-embedded></corti-embedded>`);
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe.getAttribute('style')).to.contain('display: none');
    el.show();
    await el.updateComplete;
    expect(iframe.getAttribute('style')).to.contain('display: block');
    el.hide();
    await el.updateComplete;
    expect(iframe.getAttribute('style')).to.contain('display: none');
  });

  it('throws and dispatches an error event on invalid baseURL (connectedCallback)', async () => {
    const errorEventPromise = new Promise<CustomEvent>(resolve => {
      EventDispatcher.addEventListener('error', (evt) => resolve(evt));
    });
    const el = new CortiEmbedded();
    el.baseURL = 'https://example.com';
    let thrown: Error | null = null;
    try {
      el.connectedCallback();
    } catch (e: any) {
      thrown = e;
    }
    const evt = await errorEventPromise;
    expect(thrown).to.be.instanceOf(Error);
    expect((evt.detail as any).message).to.match(/Invalid baseURL/i);
  });

  it('updates iframe src and resets handler when baseURL changes', async () => {
    const el = await fixture<CortiEmbedded>(html`<corti-embedded></corti-embedded>`);
    // Simulate real load to create PostMessageHandler
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    iframe.dispatchEvent(new Event('load'));
    // After load, a handler should exist
    expect(el.getStatus().postMessageHandlerExists).to.equal(true);
    // Change baseURL
    el.baseURL = 'https://assistant.us.corti.app';
    await el.updateComplete;
    // Handler should have been torn down until next load
    const status = el.getStatus();
    expect(status.postMessageHandlerExists).to.equal(false);
    expect(iframe.getAttribute('src')).to.equal('https://assistant.us.corti.app/embedded');
  });

  it('ignores about:blank iframe loads (no handler setup)', async () => {
    const el = await fixture<CortiEmbedded>(html`<corti-embedded></corti-embedded>`);
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    // Force about:blank then emit load
    iframe.setAttribute('src', 'about:blank');
    iframe.dispatchEvent(new Event('load'));
    expect(el.getStatus().postMessageHandlerExists).to.equal(false);
  });

  it('accepts iframe loads with trailing slash in path', async () => {
    const el = await fixture<CortiEmbedded>(html`<corti-embedded></corti-embedded>`);
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    iframe.setAttribute('src', 'https://assistant.eu.corti.app/embedded/');
    iframe.dispatchEvent(new Event('load'));
    expect(el.getStatus().postMessageHandlerExists).to.equal(true);
  });

  it('accepts iframe loads with query params', async () => {
    const el = await fixture<CortiEmbedded>(html`<corti-embedded></corti-embedded>`);
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    iframe.setAttribute('src', 'https://assistant.eu.corti.app/embedded?x=1&y=2');
    iframe.dispatchEvent(new Event('load'));
    expect(el.getStatus().postMessageHandlerExists).to.equal(true);
  });

  it('postMessage throws if PostMessageHandler not ready', async () => {
    const el = await fixture<CortiEmbedded>(html`<corti-embedded></corti-embedded>`);
    try {
      await el.postMessage({ type: 'CORTI_EMBEDDED', version: 'v1', action: 'navigate', payload: { path: '/x' } });
      expect.fail('Expected PostMessageHandler not ready error');
    } catch (e: any) {
      expect(String(e.message || e)).to.match(/PostMessageHandler not ready/);
    }
  });

  it('delegates helper methods to PostMessageHandler when available', async () => {
    const el = await fixture<CortiEmbedded>(html`<corti-embedded></corti-embedded>`);
    // Inject a minimal mock handler
    const response = { ok: true } as any;
    (el as any).postMessageHandler = {
      postMessage: async () => response,
      authenticate: async (p: any) => ({ ...response, action: 'auth', p }),
      sendMessage: async (a: string, p: any) => ({ ...response, action: a, p }),
      configureSession: async (p: any) => ({ ...response, action: 'configureSession', p }),
      addFacts: async (p: any) => ({ ...response, action: 'addFacts', p }),
      navigate: async (p: any) => ({ ...response, action: 'navigate', p }),
      createInteraction: async (p: any) => ({ ...response, action: 'createInteraction', p }),
      destroy: () => {},
      ready: false,
    };
    expect(await el.postMessage({ type: 'CORTI_EMBEDDED', version: 'v1', action: 'startRecording', payload: {} })).to.equal(response);
    expect((await el.authenticate({ token: 't' })) as any).to.include({ action: 'auth' });
    expect((await el.sendMessage('someAction', { a: 1 })) as any).to.include({ action: 'someAction' });
    expect((await el.configureSession({ s: 1 })) as any).to.include({ action: 'configureSession' });
    expect((await el.addFacts({ f: 1 })) as any).to.include({ action: 'addFacts' });
    expect((await el.navigate({ n: 1 })) as any).to.include({ action: 'navigate' });
    expect((await el.createInteraction({ i: 1 } as any)) as any).to.include({ action: 'createInteraction' });
  });

  it('dispatches error and blanks iframe when baseURL becomes invalid (updated)', async () => {
    const el = await fixture<CortiEmbedded>(html`<corti-embedded></corti-embedded>`);
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    // Ensure it starts valid
    expect(iframe.getAttribute('src')).to.equal('https://assistant.eu.corti.app/embedded');

    const errorEventPromise = new Promise<CustomEvent>(resolve => {
      EventDispatcher.addEventListener('error', (evt) => resolve(evt));
    });

    el.baseURL = 'https://example.com';
    await el.updateComplete;
    const evt = await errorEventPromise;
    expect((evt.detail as any).message).to.match(/Invalid baseURL/i);
    expect(iframe.getAttribute('src')).to.equal('about:blank');
  });
});
