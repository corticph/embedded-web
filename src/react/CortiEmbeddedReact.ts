import { createComponent } from '@lit/react';
import * as React from 'react';
import { CortiEmbedded } from '../CortiEmbedded.js';
import type { CortiEmbeddedAPI, EmbeddedEventData } from '../public-types.js';

const BaseCortiEmbeddedElement = createComponent({
  tagName: 'corti-embedded',
  elementClass: CortiEmbedded,
  react: React,
  events: {
    onReady: 'ready',
    onAuthChanged: 'auth-changed',
    onInteractionCreated: 'interaction-created',
    onRecordingStarted: 'recording-started',
    onRecordingStopped: 'recording-stopped',
    onDocumentGenerated: 'document-generated',
    onDocumentUpdated: 'document-updated',
    onNavigationChanged: 'navigation-changed',
    onError: 'error',
    onUsage: 'usage',
  },
});

// Props interface
export interface CortiEmbeddedReactProps {
  baseURL: string;
  visibility?: 'visible' | 'hidden';

  // Event handlers
  onReady?: (event: CustomEvent<EmbeddedEventData['ready']>) => void;
  /** LIMITED ACCESS - not implemented */
  onAuthChanged?: (
    event: CustomEvent<EmbeddedEventData['auth-changed']>,
  ) => void;
  /** LIMITED ACCESS - not implemented */
  onInteractionCreated?: (
    event: CustomEvent<EmbeddedEventData['interaction-created']>,
  ) => void;
  onRecordingStarted?: (
    event: CustomEvent<EmbeddedEventData['recording-started']>,
  ) => void;
  onRecordingStopped?: (
    event: CustomEvent<EmbeddedEventData['recording-stopped']>,
  ) => void;
  onDocumentGenerated?: (
    event: CustomEvent<EmbeddedEventData['document-generated']>,
  ) => void;
  onDocumentUpdated?: (
    event: CustomEvent<EmbeddedEventData['document-updated']>,
  ) => void;
  /** LIMITED ACCESS - not implemented */
  onNavigationChanged?: (
    event: CustomEvent<EmbeddedEventData['navigation-changed']>,
  ) => void;
  onError?: (event: CustomEvent<EmbeddedEventData['error']>) => void;
  onUsage?: (event: CustomEvent<EmbeddedEventData['usage']>) => void;

  // Additional props
  className?: string;
  style?: React.CSSProperties;
}

export type CortiEmbeddedReactRef = CortiEmbedded & CortiEmbeddedAPI;
// Export public types
export * from '../public-types.js';

export const CortiEmbeddedReact = React.forwardRef<
  CortiEmbeddedReactRef,
  CortiEmbeddedReactProps
>((props, ref) =>
  React.createElement(BaseCortiEmbeddedElement as any, {
    ref,
    ...props,
  }),
);

CortiEmbeddedReact.displayName = 'CortiEmbeddedReact';
