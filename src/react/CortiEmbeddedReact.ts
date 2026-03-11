import * as React from 'react';
import '../corti-embedded.js';
import type { CortiEmbedded } from '../CortiEmbedded.js';
import type { CortiEmbeddedAPI } from '../types';

export interface CortiEmbeddedEventDetail {
  name: string;
  payload: unknown;
}

export interface CortiEmbeddedErrorDetail {
  message: string;
  code?: string;
  details?: unknown;
}

// Props interface
export interface CortiEmbeddedReactProps {
  baseURL: string;
  visibility?: 'visible' | 'hidden';

  // Event handlers receive the unwrapped detail, not the raw CustomEvent
  onEvent?: (detail: CortiEmbeddedEventDetail) => void;
  onReady?: (detail: unknown) => void;
  onError?: (detail: CortiEmbeddedErrorDetail) => void;

  // Additional props
  className?: string;
  style?: React.CSSProperties;
}

export type CortiEmbeddedReactRef = CortiEmbedded & CortiEmbeddedAPI;

// Export public types
export * from '../types/index.js';

// Renders the custom element directly so React sets the ref to the actual
// CortiEmbedded DOM instance. This avoids the @lit/react wrapper chain that
// was preventing the ref from reaching the DOM node in React 19.
export const CortiEmbeddedReact = React.forwardRef<
  CortiEmbeddedReactRef,
  CortiEmbeddedReactProps
>(
  (
    { onEvent, onReady, onError, baseURL, visibility, className, style },
    forwardedRef,
  ) => {
    const internalRef = React.useRef<CortiEmbeddedReactRef | null>(null);
    const hasEmittedReadyRef = React.useRef(false);

    // "Latest ref" pattern: update on every render so handlers are always
    // current without re-attaching event listeners.
    const onEventRef = React.useRef(onEvent);
    const onReadyRef = React.useRef(onReady);
    const onErrorRef = React.useRef(onError);
    onEventRef.current = onEvent;
    onReadyRef.current = onReady;
    onErrorRef.current = onError;

    // Expose the DOM element to the consumer's forwarded ref. Native element
    // refs are set during React's mutation phase, before layout effects run,
    // so internalRef.current is always populated when this executes.
    React.useImperativeHandle(forwardedRef, () => internalRef.current!, []);

    // Keep LitElement reactive properties in sync with React props.
    React.useLayoutEffect(() => {
      if (internalRef.current) internalRef.current.baseURL = baseURL;
    }, [baseURL]);

    React.useLayoutEffect(() => {
      if (internalRef.current == null || visibility === undefined) return;
      internalRef.current.visibility = visibility;
    }, [visibility]);

    // Attach DOM event listeners once on mount. The latest-ref pattern above
    // ensures handlers always call the current prop without re-attaching.
    React.useEffect(() => {
      const el = internalRef.current;
      if (!el) return undefined;

      const handleEvent = (e: Event) =>
        onEventRef.current?.(
          (e as CustomEvent<CortiEmbeddedEventDetail>).detail,
        );
      const handleReady = (e: Event) => {
        if (hasEmittedReadyRef.current) return;
        hasEmittedReadyRef.current = true;
        onReadyRef.current?.((e as CustomEvent<unknown>).detail);
      };
      const handleError = (e: Event) =>
        onErrorRef.current?.(
          (e as CustomEvent<CortiEmbeddedErrorDetail>).detail,
        );

      el.addEventListener('embedded-event', handleEvent);
      el.addEventListener('embedded.ready', handleReady);
      el.addEventListener('error', handleError);
      return () => {
        el.removeEventListener('embedded-event', handleEvent);
        el.removeEventListener('embedded.ready', handleReady);
        el.removeEventListener('error', handleError);
      };
    }, []);

    return React.createElement('corti-embedded', {
      ref: internalRef,
      baseurl: baseURL,
      ...(visibility !== undefined ? { visibility } : {}),
      ...(className !== undefined ? { className } : {}),
      style,
    });
  },
);

CortiEmbeddedReact.displayName = 'CortiEmbeddedReact';

export interface UseCortiEmbeddedStatusOptions {
  enabled?: boolean;
  onError?: (error: unknown) => void;
  shouldRefreshOnEvent?: (event: CortiEmbeddedEventDetail) => boolean;
}

export interface UseCortiEmbeddedStatusResult {
  status: Awaited<ReturnType<CortiEmbeddedReactRef['getStatus']>> | null;
  isLoading: boolean;
  error: unknown;
  lastEvent: CortiEmbeddedEventDetail | null;
}

export function useCortiEmbeddedStatus(
  ref: React.RefObject<CortiEmbeddedReactRef | null>,
  options: UseCortiEmbeddedStatusOptions = {},
): UseCortiEmbeddedStatusResult {
  const {
    enabled = true,
    onError,
    shouldRefreshOnEvent = event => {
      const normalized = event.name.toLowerCase();
      if (normalized.includes('getstatus')) return false;
      if (normalized.includes('statusreturned')) return false;
      return true;
    },
  } = options;
  const [status, setStatus] =
    React.useState<UseCortiEmbeddedStatusResult['status']>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);
  const [lastEvent, setLastEvent] =
    React.useState<UseCortiEmbeddedStatusResult['lastEvent']>(null);
  const onErrorRef = React.useRef(onError);
  const shouldRefreshOnEventRef = React.useRef(shouldRefreshOnEvent);
  const isRefreshingRef = React.useRef(false);

  React.useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  React.useEffect(() => {
    shouldRefreshOnEventRef.current = shouldRefreshOnEvent;
  }, [shouldRefreshOnEvent]);

  const refresh = React.useCallback(async () => {
    if (!enabled || !ref.current || isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsLoading(true);
    try {
      const nextStatus = await ref.current.getStatus();
      setStatus(nextStatus);
      setError(null);
    } catch (refreshError) {
      setError(refreshError);
      onErrorRef.current?.(refreshError);
    } finally {
      setIsLoading(false);
      isRefreshingRef.current = false;
    }
  }, [enabled, ref]);

  React.useEffect(() => {
    if (!enabled || !ref.current) return undefined;

    const target = ref.current;
    const handleEvent = (event: Event) => {
      const { detail } = event as CustomEvent<CortiEmbeddedEventDetail>;
      setLastEvent(detail);
      if (!shouldRefreshOnEventRef.current(detail)) return;
      if (isRefreshingRef.current) return;
      refresh();
    };

    target.addEventListener('embedded-event', handleEvent);
    return () => target.removeEventListener('embedded-event', handleEvent);
  }, [enabled, ref, refresh]);

  return {
    status,
    isLoading,
    error,
    lastEvent,
  };
}

export interface UseCortiEmbeddedApiResult {
  auth: (
    ...args: Parameters<CortiEmbeddedReactRef['auth']>
  ) => ReturnType<CortiEmbeddedReactRef['auth']>;
  createInteraction: (
    ...args: Parameters<CortiEmbeddedReactRef['createInteraction']>
  ) => ReturnType<CortiEmbeddedReactRef['createInteraction']>;
  configureSession: (
    ...args: Parameters<CortiEmbeddedReactRef['configureSession']>
  ) => ReturnType<CortiEmbeddedReactRef['configureSession']>;
  addFacts: (
    ...args: Parameters<CortiEmbeddedReactRef['addFacts']>
  ) => ReturnType<CortiEmbeddedReactRef['addFacts']>;
  navigate: (
    ...args: Parameters<CortiEmbeddedReactRef['navigate']>
  ) => ReturnType<CortiEmbeddedReactRef['navigate']>;
  startRecording: (
    ...args: Parameters<CortiEmbeddedReactRef['startRecording']>
  ) => ReturnType<CortiEmbeddedReactRef['startRecording']>;
  stopRecording: (
    ...args: Parameters<CortiEmbeddedReactRef['stopRecording']>
  ) => ReturnType<CortiEmbeddedReactRef['stopRecording']>;
  getStatus: (
    ...args: Parameters<CortiEmbeddedReactRef['getStatus']>
  ) => ReturnType<CortiEmbeddedReactRef['getStatus']>;
  configure: (
    ...args: Parameters<CortiEmbeddedReactRef['configure']>
  ) => ReturnType<CortiEmbeddedReactRef['configure']>;
  getTemplates: (
    ...args: Parameters<CortiEmbeddedReactRef['getTemplates']>
  ) => ReturnType<CortiEmbeddedReactRef['getTemplates']>;
  setCredentials: (
    ...args: Parameters<CortiEmbeddedReactRef['setCredentials']>
  ) => ReturnType<CortiEmbeddedReactRef['setCredentials']>;
  show: (
    ...args: Parameters<CortiEmbeddedReactRef['show']>
  ) => ReturnType<CortiEmbeddedReactRef['show']>;
  hide: (
    ...args: Parameters<CortiEmbeddedReactRef['hide']>
  ) => ReturnType<CortiEmbeddedReactRef['hide']>;
}

function getCortiEmbeddedInstanceFromRefOrThrow(
  ref: React.RefObject<CortiEmbeddedReactRef | null>,
): CortiEmbeddedReactRef {
  const instance = ref.current;
  if (!instance) {
    throw new Error(
      'No active corti-embedded instance found for this ref. Mount <CortiEmbeddedReact ref={...} /> first.',
    );
  }
  return instance;
}

export function useCortiEmbeddedApi(
  ref: React.RefObject<CortiEmbeddedReactRef | null>,
): UseCortiEmbeddedApiResult {
  const getInstance = React.useCallback(
    () => getCortiEmbeddedInstanceFromRefOrThrow(ref),
    [ref],
  );

  return React.useMemo(
    () => ({
      auth: (...args) => getInstance().auth(...args),
      createInteraction: (...args) => getInstance().createInteraction(...args),
      configureSession: (...args) => getInstance().configureSession(...args),
      addFacts: (...args) => getInstance().addFacts(...args),
      navigate: (...args) => getInstance().navigate(...args),
      startRecording: (...args) => getInstance().startRecording(...args),
      stopRecording: (...args) => getInstance().stopRecording(...args),
      getStatus: (...args) => getInstance().getStatus(...args),
      configure: (...args) => getInstance().configure(...args),
      getTemplates: (...args) => getInstance().getTemplates(...args),
      setCredentials: (...args) => getInstance().setCredentials(...args),
      show: (...args) => getInstance().show(...args),
      hide: (...args) => getInstance().hide(...args),
    }),
    [getInstance],
  );
}
