// ==========================
//   tracking.js (FINAL)
//   True Watch-Time & Engagement Tracker
// ==========================

// Safe GA wrapper so events never fail if gtag loads late
function safeGA(eventName, params) {
  if (typeof gtag === "function") {
    gtag('event', eventName, params);
  }
}

// ---- Active visible time tracking ----
let activeTime = 0;           // total ms the tab is visible
let lastTick = Date.now();    // last timestamp used for diff calc

function tick() {
  const now = Date.now();
  if (!document.hidden) {
    activeTime += (now - lastTick);
  }
  lastTick = now;
  requestAnimationFrame(tick);
}
tick();

// ---- Heartbeat every 10 seconds ----
setInterval(() => {
  if (!document.hidden) {
    safeGA('heartbeat', {
      event_category: 'engagement',
      event_label: 'active'
    });
  }
}, 10000); // 10s


// ---- Send final watch time on exit ----
function sendWatchTime() {
  const seconds = Math.round(activeTime / 1000);
  safeGA('watch_time_seconds', { value: seconds });
}

// Handle all exit cases
window.addEventListener("beforeunload", sendWatchTime);
window.addEventListener("pagehide", sendWatchTime);
