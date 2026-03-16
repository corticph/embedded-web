/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect, fixture } from '@open-wc/testing';
import { html } from 'lit';
import { CortiEmbedded } from '../src/CortiEmbedded.js';
import '../src/corti-embedded.js';
import type {
  SetCredentialsPayload,
  GetStatusResponse,
  InteractionDetails,
  SessionConfig,
  User,
  KeycloakTokenResponse,
} from '../src/types';

describe('CortiEmbedded', () => {
  const validBaseURL = 'https://assistant.eu.corti.app';
  const ensureContentWindow = (iframe: HTMLIFrameElement) => {
    if (!iframe.contentWindow) {
      Object.defineProperty(iframe, 'contentWindow', {
        value: window,
        configurable: true,
      });
    }
  };

  it('registers the custom element', () => {
    const ctor = customElements.get('corti-embedded');
    expect(ctor).to.equal(CortiEmbedded);
  });

  it('renders an iframe with the expected src and attributes', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe).to.exist;
    expect(iframe.getAttribute('sandbox')).to.include('allow-scripts');
    const expectedSrc = `${validBaseURL}/embedded`;
    expect(iframe.getAttribute('src')).to.equal(expectedSrc);
    const allowAttr = iframe.getAttribute('allow')!;
    expect(allowAttr).to.include(`microphone ${validBaseURL}`);
    expect(allowAttr).to.include(`camera ${validBaseURL}`);
    expect(allowAttr).to.include(`clipboard-write ${validBaseURL}`);
  });

  it('is hidden by default and toggles visibility with show/hide', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe.getAttribute('style')).to.contain('display: none');
    el.show();
    await el.updateComplete;
    expect(iframe.getAttribute('style')).to.contain('display: block');
    el.hide();
    await el.updateComplete;
    expect(iframe.getAttribute('style')).to.contain('display: none');
  });

  it('dispatches an error event on invalid baseURL (connectedCallback) without throwing', async () => {
    const el = new CortiEmbedded();
    let errorEvent: CustomEvent | null = null;
    el.addEventListener('error', evt => {
      errorEvent = evt as unknown as CustomEvent;
    });
    el.baseURL = 'https://example.com';
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

  it('does not dispatch error event from API catch when error was already notified', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    let count = 0;
    let thrown: Error | null = null;
    el.addEventListener('error', event => {
      const detail = (event as unknown as CustomEvent).detail as {
        message?: string;
      };
      if (detail.message === 'Failed to configure session') {
        count += 1;
      }
    });

    (el as any).postMessageHandler = {
      postMessage: async () => {
        throw new Error('User must be authenticated to configure session');
      },
      destroy: () => { },
    };

    try {
      await el.configureSession({});
    } catch (error: unknown) {
      thrown = error as Error;
    }

    expect(thrown).to.exist;
    expect(count).to.equal(0);
  });

  it('does not dispatch error event from API catch when the handler rejects', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    let count = 0;
    let thrown: Error | null = null;
    el.addEventListener('error', event => {
      const detail = (event as unknown as CustomEvent).detail as {
        message?: string;
      };
      if (detail.message === 'Failed to configure session') {
        count += 1;
      }
    });

    (el as any).postMessageHandler = {
      postMessage: async () => {
        throw new Error('User must be authenticated to configure session');
      },
      destroy: () => { },
    };

    try {
      await el.configureSession({});
    } catch (error: unknown) {
      thrown = error as Error;
    }

    expect(thrown).to.exist;
    expect(count).to.equal(0);
  });

  it('dispatches both direct error events without component-side dedupe', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    let count = 0;
    el.addEventListener('error', () => {
      count += 1;
    });
    (el as any).dispatchErrorEvent({
      message: 'Duplicate test error',
      code: 'TEST',
      details: { a: 1 },
    });
    (el as any).dispatchErrorEvent({
      message: 'Duplicate test error',
      code: 'TEST',
      details: { a: 1 },
    });

    expect(count).to.equal(2);
  });

  it('forwards iframe error.triggered through the error handler once', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    ensureContentWindow(iframe);
    iframe.setAttribute('src', `${validBaseURL}/embedded`);
    iframe.dispatchEvent(new Event('load'));

    let embeddedEventCalled = false;
    let errorDetail: unknown;

    el.addEventListener('embedded-event', (event: Event) => {
      embeddedEventCalled = true;
    });
    el.addEventListener('error', (event: Event) => {
      errorDetail = (event as CustomEvent).detail;
    });

    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          type: 'CORTI_EMBEDDED_EVENT',
          event: 'error.triggered',
          payload: { message: 'Boom', code: 'UNAUTHORIZED' },
        },
        origin: validBaseURL,
        source: iframe.contentWindow as any,
      }),
    );

    expect(embeddedEventCalled).to.equal(false);
    expect(errorDetail).to.deep.equal({
      message: 'Boom',
      code: 'UNAUTHORIZED',
      details: {
        type: 'CORTI_EMBEDDED_EVENT',
        event: 'error.triggered',
        payload: { message: 'Boom', code: 'UNAUTHORIZED' },
      },
    });
  });

  it('updates iframe src and resets handler when baseURL changes', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    let destroyed = false;
    (el as any).postMessageHandler = {
      destroy: () => {
        destroyed = true;
      },
    };
    // Change baseURL
    el.baseURL = 'https://assistant.us.corti.app';
    await el.updateComplete;
    expect(destroyed).to.equal(true);
    expect((el as any).postMessageHandler).to.equal(null);
    // Check new iframe src
    expect(iframe.getAttribute('src')).to.equal(
      'https://assistant.us.corti.app/embedded',
    );
    const allowAttr = iframe.getAttribute('allow')!;
    expect(allowAttr).to.include(`microphone ${el.baseURL}`);
    expect(allowAttr).to.include(`camera ${el.baseURL}`);
    expect(allowAttr).to.include(`clipboard-write ${el.baseURL}`);
  });

  it('ignores about:blank iframe loads (no handler setup)', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    ensureContentWindow(iframe);
    // Force about:blank then emit load
    iframe.setAttribute('src', 'about:blank');
    iframe.dispatchEvent(new Event('load'));
    expect((el as any).postMessageHandler).to.equal(null);
  });

  it('accepts iframe loads with trailing slash in path', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    ensureContentWindow(iframe);
    iframe.setAttribute('src', `${validBaseURL}/embedded/`);
    iframe.dispatchEvent(new Event('load'));
    expect((el as any).postMessageHandler).to.exist;
  });

  it('accepts iframe loads with query params', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    ensureContentWindow(iframe);
    iframe.setAttribute('src', `${validBaseURL}/embedded?x=1&y=2`);
    iframe.dispatchEvent(new Event('load'));
    expect((el as any).postMessageHandler).to.exist;
  });

  it('dispatches raw event and embedded-event payload via dispatchEmbeddedEvent', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    let rawDetail: unknown;
    let embeddedDetail: unknown;

    el.addEventListener('embedded.navigated', (event: Event) => {
      rawDetail = (event as CustomEvent).detail;
    });
    el.addEventListener('embedded-event', (event: Event) => {
      embeddedDetail = (event as CustomEvent).detail;
    });

    (el as any).dispatchEmbeddedEvent('embedded.navigated', { path: '/test' });

    expect(rawDetail).to.deep.equal({ path: '/test' });
    expect(embeddedDetail).to.deep.equal({
      name: 'embedded.navigated',
      payload: { path: '/test' },
    });
  });

  it("forwards 'embedded.ready' raw and suppresses raw 'ready'/'loaded'", async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );

    const fired: string[] = [];
    for (const name of [
      'ready',
      'loaded',
      'embedded.ready',
      'embedded-event',
    ]) {
      el.addEventListener(name, () => fired.push(name));
    }

    // 'embedded.ready' should fire raw 'embedded.ready' + 'embedded-event'
    (el as any).dispatchEmbeddedEvent('embedded.ready', {});
    expect(fired).to.not.include('ready');
    expect(fired).to.include('embedded-event');
    expect(fired).to.include('embedded.ready');

    fired.length = 0;

    // 'ready' from iframe should only fire 'embedded-event', NOT the public 'ready'
    (el as any).dispatchEmbeddedEvent('ready', {});
    expect(fired).to.not.include('ready');
    expect(fired).to.include('embedded-event');

    fired.length = 0;

    // 'loaded' from iframe should only fire 'embedded-event', NOT 'loaded' raw
    (el as any).dispatchEmbeddedEvent('loaded', {});
    expect(fired).to.not.include('loaded');
    expect(fired).to.include('embedded-event');
  });

  it('auth throws if component not ready', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const credentials: KeycloakTokenResponse = {
      access_token: 'test-token',
      token_type: 'Bearer',
    };

    try {
      await el.auth(credentials);
      expect.fail('Expected component not ready error');
    } catch (e: any) {
      expect(String(e.message || e)).to.match(/Component not ready/);
    }
  });

  it('delegates methods to PostMessageHandler when available', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );

    // Mock user data
    const mockUser: User = {
      id: 'user123',
      email: 'test@example.com',
    };

    const mockInteraction: InteractionDetails = {
      id: 'int123',
      createdAt: '2024-01-01T00:00:00Z',
    };

    const mockStatus: GetStatusResponse = {
      auth: {
        isAuthenticated: true,
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
      },
      currentUrl: 'https://example.com',
      interaction: null,
    };

    // Inject a minimal mock handler that responds via the generic postMessage interface
    (el as any).postMessageHandler = {
      postMessage: async (msg: { action: string }) => {
        switch (msg.action) {
          case 'auth':
            return { success: true, payload: { user: mockUser } };
          case 'createInteraction':
            return { success: true, payload: mockInteraction };
          case 'getStatus':
            return { success: true, payload: mockStatus };
          default:
            return { success: true, payload: {} };
        }
      },
      waitForReady: async () => { },
      destroy: () => { },
      ready: true,
    };

    const credentials: SetCredentialsPayload = {
      password: 'test-password',
    };

    const sessionConfig: SessionConfig = {
      defaultLanguage: 'en',
      defaultMode: 'virtual',
    };

    const authPayload: KeycloakTokenResponse = {
      access_token: 'test-token',
      token_type: 'Bearer',
    };

    // Test all the API methods
    const user = await el.auth(authPayload);
    expect(user).to.deep.equal(mockUser);

    const randomId = `encounter-${Date.now()}`;
    const interaction = await el.createInteraction({
      assignedUserId: user.id,
      encounter: {
        identifier: randomId,
        status: 'planned',
        type: 'first_consultation',
        period: {
          startedAt: new Date().toDateString(),
        },
        title: 'Initial Consultation',
      },
      patient: {
        identifier: randomId,
        name: 'John Doe',
        gender: 'male',
        birthDate: new Date().toDateString(),
      },
    });
    expect(interaction).to.deep.equal(mockInteraction);

    await el.configureSession(sessionConfig);
    await el.addFacts([{ text: 'test', group: 'my note' }]);
    await el.navigate('/test');
    await el.startRecording();
    await el.stopRecording();
    await el.setCredentials(credentials);

    const status = await el.getStatus();
    expect(status).to.deep.equal(mockStatus);

    // Note: configure method would normally change baseURL, but our mock doesn't handle that
  });

  it('dispatches error event when baseURL becomes invalid (updated) without throwing', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    // Ensure it starts valid
    expect(iframe.getAttribute('src')).to.equal(`${validBaseURL}/embedded`);

    let errorEvent: CustomEvent | null = null;
    el.addEventListener('error', evt => {
      errorEvent = evt as unknown as CustomEvent;
    });

    el.baseURL = 'https://example.com';
    // updateComplete must not reject after the fix
    await el.updateComplete;

    expect(errorEvent).to.exist;
    expect((errorEvent!.detail as any).message).to.match(/Invalid baseURL/i);
    // The iframe src should have been reset to about:blank
    expect(iframe.getAttribute('src')).to.equal('about:blank');
  });

  it('returns proper status when component is not ready', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );

    const status = await el.getStatus();
    expect(status).to.deep.equal({
      auth: {
        isAuthenticated: false,
        user: undefined,
      },
      currentUrl: '',
      interaction: null,
    });
  });
});
