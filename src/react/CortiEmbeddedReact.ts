import { createComponent } from '@lit/react';
import * as React from 'react';
import { CortiEmbedded } from '../CortiEmbedded.js';
import type { CortiEmbeddedAPI, EmbeddedEventData } from '../public-types.js';

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

// Create the component directly without additional forwardRef wrapping
export const CortiEmbeddedReact = createComponent({
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
}) as React.ForwardRefExoticComponent<
  CortiEmbeddedReactProps & React.RefAttributes<CortiEmbeddedReactRef>
>;

CortiEmbeddedReact.displayName = 'CortiEmbeddedReact';
