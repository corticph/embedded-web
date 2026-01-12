import { CortiEmbedded } from './CortiEmbedded.js';

// Register the main component
if (!customElements.get('corti-embedded'))
  customElements.define('corti-embedded', CortiEmbedded);
