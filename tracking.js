// ===============
// REAL WATCH TIME TRACKER
// ===============

// Tracks how long user keeps the page visible & active
let activeTime = 0;             // total ms when tab is visible
let lastTick = Date.now();      // last animation frame timestamp

// Heartbeat every 10 seconds for presence tracking
setInterval(() => {
  if (!document.hidden) {
    gtag('event', 'heartbeat', {
      event_category: 'engagement',
      event_label: 'active'
    });
  }
}, 10000); // 10 sec interval

// Visibility-aware active timer
function tick() {
  const now = Date.now();
  
  if (!document.hidden) {
    activeTime += (now - lastTick); // count only when visible
  }

  lastTick = now;
  requestAnimationFrame(tick);
}
tick();

// Send final watch time to GA4 on exit
function sendWatchTime() {
  const seconds = Math.round(activeTime / 1000);

  gtag('event', 'watch_time_seconds', {
    value: seconds
  });
}

// before leaving tab or closing page
window.addEventListener("beforeunload", sendWatchTime);
window.addEventListener("pagehide", sendWatchTime);
