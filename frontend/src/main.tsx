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
  // Scroll past the toolbar margin (index.css adds ~90px). iOS 17 Safari ignores
  // a 1px nudge; scrolling the full overflow forces the chrome to collapse.
  window.scrollTo(0, document.body.scrollHeight);
}
// Older iOS (e.g. 15 Pro / iOS 17.5) lays out late, so a single early nudge can
// fire before Safari is ready and do nothing. Retry a few times after load to
// catch whenever it finally settles. Newer iOS collapses on the first try.
function nudge() {
  [0, 150, 400, 800].forEach((d) => setTimeout(hideBrowserChrome, d));
}
window.addEventListener('load', nudge);
window.addEventListener('orientationchange', nudge);
window.addEventListener('resize', nudge);
