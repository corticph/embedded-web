import { css } from 'lit';

// Main container styles for the Corti Agent component
export const containerStyles = css`
  :host {
    /* Make the component fill its container completely */
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;

    margin: 0;
    padding: 0;
    background-color: transparent;
    overflow: hidden;
  }

  /* Handle visibility state */
  :host([visibility='hidden']) {
    display: none;
  }

  /* Ensure iframe fills the entire component */
  iframe {
    width: 100% !important;
    height: 100% !important;
    border: none !important;
    margin: 0 !important;
    padding: 0 !important;
  }
`;
