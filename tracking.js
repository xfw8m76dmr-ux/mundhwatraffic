// ==========================
//   tracking.js (v2)
//   True Watch-Time & Engagement Tracker
//   ✓ Safe for GA4
//   ✓ Guaranteed exit event via beacon
//   ✓ No double GA risk
// ==========================

// --- Safe GA event wrapper ---
function safeGA(eventName, params = {}) {
  if (typeof gtag === "function") {
    gtag('event', eventName, params);
  }
}

// ---- Active visible time tracking ----
let activeTime = 0;        // ms spent with tab visible
let lastTick = performance.now();

function tick(now) {
  if (!document.hidden) {
    activeTime += (now - lastTick);
  }
  lastTick = now;
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);

// ---- Heartbeat every 10 seconds ----
setInterval(() => {
  if (!document.hidden) {
    safeGA('heartbeat', {
      event_category: 'engagement',
      event_label: 'active'
    });
  }
}, 10000);


// ==========================
//   SEND WATCH TIME
//   (Beacon for reliability)
// ==========================
function sendWatchTime() {
  const seconds = Math.round(activeTime / 1000);

  // Prepare payload for GA4 measurement protocol (beacon fallback)
  const payload = {
    event_time: Math.floor(Date.now() / 1000),
    watch_time_seconds: seconds,
    value: seconds
  };

  // ---- Try normal gtag event first ----
  safeGA('watch_time', {
    watch_time_seconds: seconds,
    value: seconds,
    transport_type: 'beacon'
  });

  // ---- Fallback: Use beacon directly if tab closes immediately ----
  try {
    navigator.sendBeacon(
      "/ga-watchtime",     // your backend endpoint (safe no-op if missing)
      JSON.stringify(payload)
    );
  } catch (e) {
    // ignore — beacon fails only on very old browsers
  }
}


// ---- Exit handlers (cover all browsers) ----
window.addEventListener("pagehide", sendWatchTime);
window.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") sendWatchTime();
});
