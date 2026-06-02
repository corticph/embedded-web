import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { CortiEmbedded } from '../../src/CortiEmbedded.js';
import {
  CortiEmbeddedReact,
  useCortiEmbeddedApi,
  type CortiEmbeddedReactRef,
} from '../../src/react/CortiEmbeddedReact.js';

if (!customElements.get('corti-embedded')) {
  customElements.define('corti-embedded', CortiEmbedded);
}

export type Root = import('react-dom/client').Root;

export { React, createRoot, CortiEmbeddedReact, useCortiEmbeddedApi };
export type { CortiEmbeddedReactRef };
