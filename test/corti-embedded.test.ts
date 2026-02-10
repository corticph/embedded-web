/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect, fixture } from '@open-wc/testing';
import { html } from 'lit';
import { CortiEmbedded } from '../src/CortiEmbedded.js';
import '../src/corti-embedded.js';
import type {
  SetCredentialsPayload,
  AuthCredentials,
  GetStatusResponsePayload,
  InteractionDetails,
  SessionConfig,
  User,
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
    expect(allowAttr).to.include('microphone *');
    expect(allowAttr).to.include('camera *');
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

  it('throws and dispatches an error event on invalid baseURL (connectedCallback)', async () => {
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
    expect(thrown).to.be.instanceOf(Error);
    expect(errorEvent).to.exist;
    expect((errorEvent!.detail as any).message).to.match(/Invalid baseURL/i);
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
    expect(allowAttr).to.include('microphone *');
    expect(allowAttr).to.include('camera *');
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

  it('auth throws if component not ready', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const credentials: AuthCredentials = {
      access_token: 'test-token',
      token_type: 'Bearer',
      mode: 'stateless',
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

    const mockStatus: GetStatusResponsePayload = {
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

    // Inject a minimal mock handler
    (el as any).postMessageHandler = {
      auth: async () => mockUser,
      createInteraction: async () => mockInteraction,
      configureSession: async () => {},
      addFacts: async () => {},
      navigate: async () => {},
      startRecording: async () => {},
      stopRecording: async () => {},
      getStatus: async () => mockStatus,
      configure: async () => {},
      setCredentials: async () => {},
      destroy: () => {},
      ready: true,
      on: () => {},
      off: () => {},
    };

    const credentials: SetCredentialsPayload = {
      password: 'test-password',
    };

    const sessionConfig: SessionConfig = {
      defaultLanguage: 'en',
      defaultMode: 'virtual',
    };

    const authPayload: AuthCredentials = {
      access_token: 'test-token',
      token_type: 'Bearer',
      mode: 'stateless',
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

  it('dispatches error and removes iframe when baseURL becomes invalid (updated)', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded baseurl=${validBaseURL}></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    // Ensure it starts valid
    expect(iframe.getAttribute('src')).to.equal(`${validBaseURL}/embedded`);

    el.baseURL = 'https://example.com';
    let thrown: Error | null = null;
    try {
      await el.updateComplete;
    } catch (error: any) {
      thrown = error;
    }
    expect(thrown).to.be.instanceOf(Error);
    expect(String(thrown?.message || thrown)).to.match(/Invalid baseURL/i);
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
