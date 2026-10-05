// ============================================================
// DevMobile Simulator - Content Script
// Injected into every page. Receives messages from background.
// ============================================================

(function () {
  if (window.__devmobile_injected__) return;
  window.__devmobile_injected__ = true;

  let currentState = null;
  let touchInitialized = false;

  // ── Touch event simulation ──────────────────────────────────
  function initTouchSimulation() {
    if (touchInitialized) return;
    touchInitialized = true;

    const script = document.createElement('script');
    script.textContent = `
      (function() {
        if (window.__devmobile_touch__) return;
        window.__devmobile_touch__ = true;

        // Override touch support detection
        Object.defineProperty(navigator, 'maxTouchPoints', {
          get: () => 5,
          configurable: true,
        });

        // Convert mouse events to touch events
        function mouseToTouch(e, type) {
          const touch = new Touch({
            identifier: Date.now(),
            target: e.target,
            clientX: e.clientX,
            clientY: e.clientY,
            screenX: e.screenX,
            screenY: e.screenY,
            pageX: e.pageX,
            pageY: e.pageY,
          });
          const touchEvent = new TouchEvent(type, {
            bubbles: true,
            cancelable: true,
            touches: type === 'touchend' ? [] : [touch],
            targetTouches: type === 'touchend' ? [] : [touch],
            changedTouches: [touch],
          });
          e.target.dispatchEvent(touchEvent);
        }

        document.addEventListener('mousedown', (e) => mouseToTouch(e, 'touchstart'), { capture: true, passive: false });
        document.addEventListener('mousemove', (e) => { if (e.buttons > 0) mouseToTouch(e, 'touchmove'); }, { capture: true, passive: false });
        document.addEventListener('mouseup', (e) => mouseToTouch(e, 'touchend'), { capture: true, passive: false });

        console.log('[DevMobile] Touch simulation active.');
      })();
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }

  function removeTouchSimulation() {
    touchInitialized = false;
    // Cannot fully undo injected script, but flag it off for new pages
  }

  // ── Geolocation spoofing ────────────────────────────────────
  function applyGeolocation(geo) {
    if (!geo) return;
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        const fakeGeo = ${JSON.stringify(geo)};
        const origGeo = navigator.geolocation;
        const fakeGeolocation = {
          getCurrentPosition: (success, error, opts) => {
            success({ coords: { ...fakeGeo, accuracy: 10, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() });
          },
          watchPosition: (success, error, opts) => {
            success({ coords: { ...fakeGeo, accuracy: 10, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() });
            return 1;
          },
          clearWatch: () => {},
        };
        Object.defineProperty(navigator, 'geolocation', { get: () => fakeGeolocation, configurable: true });
        console.log('[DevMobile] Geolocation spoofed to', fakeGeo.latitude, fakeGeo.longitude);
      })();
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }

  // ── Dark mode ───────────────────────────────────────────────
  function applyDarkMode(enabled) {
    const id = '__devmobile_dark__';
    let el = document.getElementById(id);
    if (enabled) {
      if (!el) {
        el = document.createElement('style');
        el.id = id;
        el.textContent = `
          html { filter: invert(1) hue-rotate(180deg) !important; }
          img, video, iframe, canvas, svg, picture { filter: invert(1) hue-rotate(180deg) !important; }
        `;
        document.documentElement.appendChild(el);
      }
    } else {
      el?.remove();
    }
  }

  // ── Network throttling simulation ───────────────────────────
  function applyNetworkThrottle(profile) {
    // NOTE: True network throttling requires DevTools Protocol (CDP).
    // In a content script we can simulate it by patching fetch & XMLHttpRequest.
    const PROFILES = {
      'slow-3g': { latency: 2000, downloadKbps: 500 },
      'fast-3g': { latency: 562, downloadKbps: 1500 },
      '4g': { latency: 170, downloadKbps: 9000 },
      'none': null,
    };

    const cfg = PROFILES[profile] || null;
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        const cfg = ${JSON.stringify(cfg)};
        if (!cfg) { window.__devmobile_throttle__ = null; return; }
        window.__devmobile_throttle__ = cfg;

        const origFetch = window.fetch;
        window.fetch = function(...args) {
          return new Promise((resolve, reject) => {
            setTimeout(() => origFetch(...args).then(resolve, reject), cfg.latency);
          });
        };

        const origOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(...args) {
          this.__devmobile_delay__ = cfg.latency;
          return origOpen.apply(this, args);
        };
        const origSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function(...args) {
          const delay = this.__devmobile_delay__ || 0;
          const self = this;
          setTimeout(() => origSend.apply(self, args), delay);
        };
        console.log('[DevMobile] Network throttle:', cfg);
      })();
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }

  // ── Message listener ────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    switch (msg.type) {
      case 'ACTIVATE':
      case 'UPDATE_STATE': {
        currentState = msg.state;
        if (currentState.active) {
          initTouchSimulation();
          if (currentState.geolocation) applyGeolocation(currentState.geolocation);
          if (currentState.darkMode) applyDarkMode(true);
          if (currentState.networkThrottle && currentState.networkThrottle !== 'none') {
            applyNetworkThrottle(currentState.networkThrottle);
          }
        }
        break;
      }
      case 'DEACTIVATE': {
        currentState = null;
        removeTouchSimulation();
        applyDarkMode(false);
        break;
      }
      case 'TOGGLE_DARK_MODE': {
        applyDarkMode(msg.darkMode);
        break;
      }
      case 'SET_NETWORK': {
        applyNetworkThrottle(msg.profile);
        break;
      }
      case 'SET_GEOLOCATION': {
        applyGeolocation(msg.geo);
        break;
      }
    }
  });

  console.log('[DevMobile] Content script ready.');
})();
