import { CortiEmbedded } from './CortiEmbedded.js';

// Import services
import './services/EventDispatcher.js';

// Register the main component
if (!customElements.get('corti-embedded'))
  customElements.define('corti-embedded', CortiEmbedded);
