import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Smart-scroll "fullscreen" for iPhone. We deliberately run in a browser context
// (not standalone) so the microphone works — iOS WebKit blocks getUserMedia in
// home-screen standalone apps. The cost is Safari's chrome, which it only hides
// once the user scrolls. We nudge that scroll programmatically (the body is sized
// 1px taller than the viewport in index.css) so the bars collapse on their own.
function hideBrowserChrome() {
  // A tiny downward scroll is enough for Safari to start collapsing the bars.
  window.scrollTo(0, 1);
}
// Run after layout settles, and again whenever the viewport changes (rotation,
// chrome resize) so we re-hide if Safari brings the bar back.
window.addEventListener('load', () => setTimeout(hideBrowserChrome, 100));
window.addEventListener('orientationchange', () => setTimeout(hideBrowserChrome, 300));
window.addEventListener('resize', () => setTimeout(hideBrowserChrome, 300));
