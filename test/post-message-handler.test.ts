import { expect } from '@open-wc/testing';
import { PostMessageHandler } from '../src/utils/PostMessageHandler.js';

describe('PostMessageHandler', () => {
  function makeRealHandler(origin = 'https://assistant.eu.corti.app') {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', `${origin}/embedded`);
    document.body.appendChild(iframe);
    const handler = new PostMessageHandler(iframe);
    return { handler, iframe, origin };
  }

  it('waits for ready event and exposes ready=true', async () => {
    const { handler, iframe, origin } = makeRealHandler();
    const readyPromise = handler.waitForReady(500);
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'CORTI_EMBEDDED_EVENT', event: 'ready' },
        origin,
        source: iframe.contentWindow as any,
      }),
    );
    await readyPromise;
    expect(handler.ready).to.equal(true);
    handler.destroy();
    iframe.remove();
  });

  it('forwards passthrough events through onEvent', async () => {
    const forwarded: Array<{
      name: string;
      payload: unknown;
    }> = [];
    const { handler, iframe, origin } = makeRealHandler();
    handler.updateCallbacks({
      onEvent: event => {
        forwarded.push(event);
      },
    });

    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          type: 'CORTI_EMBEDDED_EVENT',
          event: 'embedded.navigated',
          payload: { path: '/summary' },
        },
        origin,
        source: iframe.contentWindow as any,
      }),
    );

    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          type: 'CORTI_EMBEDDED_EVENT',
          event: 'custom.event',
          payload: { a: 1 },
        },
        origin,
        source: iframe.contentWindow as any,
      }),
    );

    expect(forwarded).to.have.length(2);
    expect(forwarded[0]).to.deep.equal({
      name: 'embedded.navigated',
      payload: { path: '/summary' },
    });
    expect(forwarded[1]).to.deep.equal({
      name: 'custom.event',
      payload: { a: 1 },
    });

    handler.destroy();
    iframe.remove();
  });

  it('postMessage resolves on matching response from trusted origin', async () => {
    const { handler } = makeRealHandler();
    // Ensure waitForReady resolves quickly
    (handler as any).isReady = true;
    try {
      const promise = handler.postMessage(
        {
          type: 'CORTI_EMBEDDED',
          version: 'v1',
          action: 'navigate',
          payload: { path: '/foo' },
        },
        500,
      );
      // Allow pendingRequests to be set
      await new Promise(r => {
        setTimeout(r, 0);
      });
      const requestId = (handler as any).pendingRequests.keys().next().value;
      // Directly invoke internal response handler
      const responsePayload = { ok: true };
      (handler as any).handleResponse({ requestId, payload: responsePayload });
      const resp: any = await promise;
      expect(resp.payload).to.deep.equal(responsePayload);
    } finally {
      handler.destroy();
    }
  });

  it('rejects when response indicates failure', async () => {
    const { handler } = makeRealHandler();
    (handler as any).isReady = true;
    try {
      const promise = handler.postMessage(
        {
          type: 'CORTI_EMBEDDED',
          version: 'v1',
          action: 'navigate',
          payload: { path: '/foo' },
        },
        500,
      );
      await new Promise(r => {
        setTimeout(r, 0);
      });
      const requestId = (handler as any).pendingRequests.keys().next().value;
      (handler as any).handleResponse({
        requestId,
        success: false,
        error: 'Bad request',
      });
      try {
        await promise;
        expect.fail('Expected rejection for bad response');
      } catch (e: any) {
        expect(String(e.message || e)).to.match(/Bad request/);
      }
    } finally {
      handler.destroy();
    }
  });

  it('ignores messages from wrong origin and times out', async () => {
    const { handler, iframe } = makeRealHandler('https://trusted.example');
    (handler as any).isReady = true;
    const origGen = (PostMessageHandler as any).generateRequestId;
    (PostMessageHandler as any).generateRequestId = () => 'req_test';
    try {
      const promise = handler.postMessage(
        {
          type: 'CORTI_EMBEDDED',
          version: 'v1',
          action: 'navigate',
          payload: { path: '/foo' },
        },
        60,
      );
      // Wrong origin response should be ignored
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { requestId: 'req_test', payload: { ok: true } },
          origin: 'https://evil.example',
          source: iframe.contentWindow as any,
        }),
      );
      try {
        await promise;
        expect.fail('Expected timeout rejection');
      } catch (e: any) {
        expect(String(e.message || e)).to.match(/Request timeout/);
      }
    } finally {
      (PostMessageHandler as any).generateRequestId = origGen;
      handler.destroy();
      iframe.remove();
    }
  });

  it('throws if iframe contentWindow not available', async () => {
    const fakeIframe: any = {
      getAttribute: (n: string) =>
        n === 'src' ? 'https://assistant.eu.corti.app/embedded' : null,
      src: 'https://assistant.eu.corti.app/embedded',
      contentWindow: null,
    };
    const handler = new PostMessageHandler(fakeIframe);
    try {
      await handler.postMessage({
        type: 'CORTI_EMBEDDED',
        version: 'v1',
        action: 'startRecording',
        payload: {},
      });
      expect.fail('Expected Iframe not ready rejection');
    } catch (e: any) {
      expect(String(e.message || e)).to.match(/Iframe not ready/);
    } finally {
      handler.destroy();
    }
  });

  it('rejects if trusted origin cannot be derived', async () => {
    const fakeIframe: any = {
      getAttribute: () => '',
      src: '',
      contentWindow: window,
    };
    const handler = new PostMessageHandler(fakeIframe);
    // Skip waiting for ready; we only test origin error
    (handler as any).waitForReady = () => Promise.resolve();
    try {
      await handler.postMessage({
        type: 'CORTI_EMBEDDED',
        version: 'v1',
        action: 'startRecording',
        payload: {},
      });
      expect.fail('Expected trusted origin rejection');
    } catch (e: any) {
      expect(String(e.message || e)).to.match(/trusted origin/i);
    } finally {
      handler.destroy();
    }
  });
});
