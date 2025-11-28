/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect, fixture } from '@open-wc/testing';
import { html } from 'lit';
import { CortiEmbedded } from '../src/CortiEmbedded.js';
import '../src/corti-embedded.js';
import type { SetCredentialsPayload } from '../src/internal-types.js';
import type {
  AuthCredentials,
  ComponentStatus,
  InteractionDetails,
  SessionConfig,
  User,
} from '../src/public-types.js';
import { EventDispatcher } from '../src/services/EventDispatcher.js';

describe('CortiEmbedded', () => {
  it('registers the custom element', () => {
    const ctor = customElements.get('corti-embedded');
    expect(ctor).to.equal(CortiEmbedded);
  });

  it('renders an iframe with the expected src and attributes', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe).to.exist;
    expect(iframe.getAttribute('sandbox')).to.include('allow-scripts');
    const expectedSrc = 'https://assistant.eu.corti.app/embedded';
    expect(iframe.getAttribute('src')).to.equal(expectedSrc);
    const allowAttr = iframe.getAttribute('allow')!;
    expect(allowAttr).to.include('"https://assistant.eu.corti.app"');
  });

  it('is hidden by default and toggles visibility with show/hide', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded></corti-embedded>`,
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
    const errorEventPromise = new Promise<CustomEvent>(resolve => {
      EventDispatcher.addEventListener('error', evt => resolve(evt));
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
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded></corti-embedded>`,
    );
    // Simulate real load to create PostMessageHandler
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    iframe.dispatchEvent(new Event('load'));
    // After load, getStatus should work (though might not be ready yet)
    const initialStatus = await el.getDebugStatus();
    expect(initialStatus).to.have.property('ready');
    // Change baseURL
    el.baseURL = 'https://assistant.us.corti.app';
    await el.updateComplete;
    // Check new iframe src
    expect(iframe.getAttribute('src')).to.equal(
      'https://assistant.us.corti.app/embedded',
    );
  });

  it('ignores about:blank iframe loads (no handler setup)', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    // Force about:blank then emit load
    iframe.setAttribute('src', 'about:blank');
    iframe.dispatchEvent(new Event('load'));
    const status = await el.getStatus();
    expect(status.ready).to.be.false;
  });

  it('accepts iframe loads with trailing slash in path', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    iframe.setAttribute('src', 'https://assistant.eu.corti.app/embedded/');
    iframe.dispatchEvent(new Event('load'));
    const status = await el.getDebugStatus();
    // Status should be available even if not fully ready
    expect(status).to.have.property('ready');
  });

  it('accepts iframe loads with query params', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    iframe.setAttribute(
      'src',
      'https://assistant.eu.corti.app/embedded?x=1&y=2',
    );
    iframe.dispatchEvent(new Event('load'));
    const status = await el.getDebugStatus();
    expect(status).to.have.property('ready');
  });

  it('auth throws if component not ready', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded></corti-embedded>`,
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
      html`<corti-embedded></corti-embedded>`,
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

    const mockStatus: ComponentStatus = {
      ready: true,
      auth: {
        authenticated: true,
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
      },
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
          startedAt: new Date(),
        },
        title: 'Initial Consultation',
      },
      patient: {
        identifier: randomId,
        name: 'John Doe',
        gender: 'male',
        birthDate: new Date(),
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

  it('dispatches error and blanks iframe when baseURL becomes invalid (updated)', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded></corti-embedded>`,
    );
    const iframe = el.shadowRoot!.querySelector('iframe') as HTMLIFrameElement;
    // Ensure it starts valid
    expect(iframe.getAttribute('src')).to.equal(
      'https://assistant.eu.corti.app/embedded',
    );

    const errorEventPromise = new Promise<CustomEvent>(resolve => {
      EventDispatcher.addEventListener('error', evt => resolve(evt));
    });

    el.baseURL = 'https://example.com';
    await el.updateComplete;
    const evt = await errorEventPromise;
    expect((evt.detail as any).message).to.match(/Invalid baseURL/i);
    expect(iframe.getAttribute('src')).to.equal('about:blank');
  });

  it('provides event listener functionality', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded></corti-embedded>`,
    );

    let readyEventFired = false;
    let errorEventFired = false;

    const readyListener = () => {
      readyEventFired = true;
    };

    const errorListener = () => {
      errorEventFired = true;
    };

    // Add event listeners
    el.addEventListener('ready', readyListener);
    el.addEventListener('error', errorListener);

    // Simulate events (we'd need to trigger them through the PostMessageHandler)
    // For now, just test that the listeners are stored
    expect((el as any).eventListeners.has('ready')).to.be.true;
    expect((el as any).eventListeners.has('error')).to.be.true;

    // Remove event listeners
    el.removeEventListener('ready', readyListener);
    el.removeEventListener('error', errorListener);

    const readyListeners = (el as any).eventListeners.get('ready') || [];
    const errorListeners = (el as any).eventListeners.get('error') || [];
    expect(readyListeners).to.not.include(readyListener);
    expect(errorListeners).to.not.include(errorListener);
  });

  it('returns proper status when component is not ready', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded></corti-embedded>`,
    );

    const status = await el.getStatus();
    expect(status).to.deep.equal({
      ready: false,
      auth: {
        authenticated: false,
        user: undefined,
      },
      currentUrl: undefined,
      interaction: undefined,
    });
  });

  it('has backward compatibility getDebugStatus method', async () => {
    const el = await fixture<CortiEmbedded>(
      html`<corti-embedded></corti-embedded>`,
    );

    const debugStatus = el.getDebugStatus();
    expect(debugStatus).to.have.property('iframeExists');
    expect(debugStatus).to.have.property('iframeSrc');
    expect(debugStatus).to.have.property('postMessageHandlerExists');
    expect(debugStatus).to.have.property('baseURL');
    expect(debugStatus.baseURL).to.equal('https://assistant.eu.corti.app');
  });
});
