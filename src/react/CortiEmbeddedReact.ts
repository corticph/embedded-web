import { createComponent } from '@lit/react';
import * as React from 'react';
import { CortiEmbedded } from '../CortiEmbedded.js';
import type { CortiEmbeddedAPI } from '../types';

export interface CortiEmbeddedEventDetail {
  name: string;
  payload: unknown;
}

// Props interface
export interface CortiEmbeddedReactProps {
  baseURL: string;
  visibility?: 'visible' | 'hidden';

  // Event handlers
  onEvent?: (event: CustomEvent<CortiEmbeddedEventDetail>) => void;
  onReady?: (event: CustomEvent<unknown>) => void;
  onError?: (event: CustomEvent<unknown>) => void;

  // Additional props
  className?: string;
  style?: React.CSSProperties;
}

export type CortiEmbeddedReactRef = CortiEmbedded & CortiEmbeddedAPI;

// Export public types
export * from '../types/index.js';

// Create the component directly without additional forwardRef wrapping
export const CortiEmbeddedReact = createComponent({
  tagName: 'corti-embedded',
  elementClass: CortiEmbedded,
  react: React,
  events: {
    onEvent: 'embedded-event',
    onReady: 'ready',
    onError: 'error',
  },
}) as React.ForwardRefExoticComponent<
  CortiEmbeddedReactProps & React.RefAttributes<CortiEmbeddedReactRef>
>;

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
  refresh: () => Promise<void>;
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
    if (!enabled) {
      return undefined;
    }

    let cleanup: (() => void) | null = null;
    let frameId: number | null = null;
    let disposed = false;

    const attach = () => {
      if (disposed) return;
      const target = ref.current;
      if (!target) {
        frameId = window.requestAnimationFrame(attach);
        return;
      }

      const handleEvent = (event: Event) => {
        const { detail } = event as CustomEvent<CortiEmbeddedEventDetail>;
        setLastEvent(detail);
        if (!shouldRefreshOnEventRef.current(detail)) {
          return;
        }
        if (isRefreshingRef.current) {
          return;
        }
        refresh();
      };

      target.addEventListener('embedded-event', handleEvent);
      cleanup = () => {
        target.removeEventListener('embedded-event', handleEvent);
      };
    };

    attach();

    return () => {
      disposed = true;
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      cleanup?.();
    };
  }, [enabled, ref, refresh]);

  return {
    status,
    isLoading,
    error,
    lastEvent,
    refresh,
  };
}

function getCortiEmbeddedInstanceOrThrow(): CortiEmbeddedReactRef {
  if (typeof document === 'undefined') {
    throw new Error(
      'No active corti-embedded instance found in this environment.',
    );
  }
  const instance = document.querySelector(
    'corti-embedded',
  ) as CortiEmbeddedReactRef | null;
  if (!instance) {
    throw new Error(
      'No active corti-embedded instance found. Mount <CortiEmbeddedReact /> first.',
    );
  }
  return instance;
}

export async function auth(
  ...args: Parameters<CortiEmbeddedReactRef['auth']>
): ReturnType<CortiEmbeddedReactRef['auth']> {
  return getCortiEmbeddedInstanceOrThrow().auth(...args);
}

export async function createInteraction(
  ...args: Parameters<CortiEmbeddedReactRef['createInteraction']>
): ReturnType<CortiEmbeddedReactRef['createInteraction']> {
  return getCortiEmbeddedInstanceOrThrow().createInteraction(...args);
}

export async function configureSession(
  ...args: Parameters<CortiEmbeddedReactRef['configureSession']>
): ReturnType<CortiEmbeddedReactRef['configureSession']> {
  return getCortiEmbeddedInstanceOrThrow().configureSession(...args);
}

export async function addFacts(
  ...args: Parameters<CortiEmbeddedReactRef['addFacts']>
): ReturnType<CortiEmbeddedReactRef['addFacts']> {
  return getCortiEmbeddedInstanceOrThrow().addFacts(...args);
}

export async function navigate(
  ...args: Parameters<CortiEmbeddedReactRef['navigate']>
): ReturnType<CortiEmbeddedReactRef['navigate']> {
  return getCortiEmbeddedInstanceOrThrow().navigate(...args);
}

export async function startRecording(
  ...args: Parameters<CortiEmbeddedReactRef['startRecording']>
): ReturnType<CortiEmbeddedReactRef['startRecording']> {
  return getCortiEmbeddedInstanceOrThrow().startRecording(...args);
}

export async function stopRecording(
  ...args: Parameters<CortiEmbeddedReactRef['stopRecording']>
): ReturnType<CortiEmbeddedReactRef['stopRecording']> {
  return getCortiEmbeddedInstanceOrThrow().stopRecording(...args);
}

export async function getStatus(
  ...args: Parameters<CortiEmbeddedReactRef['getStatus']>
): ReturnType<CortiEmbeddedReactRef['getStatus']> {
  return getCortiEmbeddedInstanceOrThrow().getStatus(...args);
}

export async function configure(
  ...args: Parameters<CortiEmbeddedReactRef['configure']>
): ReturnType<CortiEmbeddedReactRef['configure']> {
  return getCortiEmbeddedInstanceOrThrow().configure(...args);
}

export async function setCredentials(
  ...args: Parameters<CortiEmbeddedReactRef['setCredentials']>
): ReturnType<CortiEmbeddedReactRef['setCredentials']> {
  return getCortiEmbeddedInstanceOrThrow().setCredentials(...args);
}

export function show(...args: Parameters<CortiEmbeddedReactRef['show']>) {
  return getCortiEmbeddedInstanceOrThrow().show(...args);
}

export function hide(...args: Parameters<CortiEmbeddedReactRef['hide']>) {
  return getCortiEmbeddedInstanceOrThrow().hide(...args);
}

CortiEmbeddedReact.displayName = 'CortiEmbeddedReact';
