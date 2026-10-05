// ============================================================
// DevMobile Simulator - Background Service Worker
// ============================================================

const DEFAULT_STATE = {
  active: false,
  device: null,
  orientation: 'portrait',
  networkThrottle: 'none',
  geolocation: null,
  darkMode: false,
};

// Per-tab simulator state
const tabStates = new Map();

// ── Utility ──────────────────────────────────────────────────
function getTabState(tabId) {
  return tabStates.get(tabId) ?? { ...DEFAULT_STATE };
}

function setTabState(tabId, patch) {
  const prev = getTabState(tabId);
  const next = { ...prev, ...patch };
  tabStates.set(tabId, next);
  return next;
}

// ── User-Agent spoofing via declarativeNetRequest ─────────────
async function applyUserAgent(tabId, ua) {
  const ruleId = tabId; // use tabId as rule id (unique)
  try {
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [ruleId],
      addRules: ua ? [
        {
          id: ruleId,
          priority: 1,
          action: {
            type: 'modifyHeaders',
            requestHeaders: [
              { header: 'User-Agent', operation: 'set', value: ua },
            ],
          },
          condition: {
            tabIds: [tabId],
            resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest', 'script', 'stylesheet', 'image', 'font', 'other'],
          },
        },
      ] : [],
    });
  } catch (e) {
    console.warn('[DevMobile] UA rule error:', e.message);
  }
}

async function removeUserAgent(tabId) {
  try {
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [tabId],
    });
  } catch (e) { /* ignore */ }
}

// ── Inject simulator into tab ─────────────────────────────────
async function injectSimulator(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: false },
      files: ['simulator/simulator.js'],
    });
  } catch (e) {
    console.warn('[DevMobile] Inject error:', e.message);
  }
}

async function sendToTab(tabId, msg) {
  try {
    await chrome.tabs.sendMessage(tabId, msg);
  } catch (e) {
    // tab not ready yet – inject first
    await injectSimulator(tabId);
    try { await chrome.tabs.sendMessage(tabId, msg); } catch (_) {}
  }
}

// ── Activate / Deactivate ─────────────────────────────────────
async function activateSimulator(tabId, state) {
  const { device, orientation } = state;
  if (device?.userAgent) await applyUserAgent(tabId, device.userAgent);
  await sendToTab(tabId, { type: 'ACTIVATE', state });
  // Reload to apply new UA to the page
  await chrome.tabs.reload(tabId);
}

async function deactivateSimulator(tabId) {
  await removeUserAgent(tabId);
  await sendToTab(tabId, { type: 'DEACTIVATE' });
  await chrome.tabs.reload(tabId);
}

// ── Message handler ───────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const tabId = msg.tabId ?? sender.tab?.id;

  (async () => {
    switch (msg.type) {
      case 'GET_STATE': {
        sendResponse(getTabState(tabId));
        break;
      }

      case 'SET_DEVICE': {
        const state = setTabState(tabId, { device: msg.device, active: true });
        if (msg.device?.userAgent) await applyUserAgent(tabId, msg.device.userAgent);
        await sendToTab(tabId, { type: 'UPDATE_STATE', state });
        await chrome.tabs.reload(tabId);
        sendResponse({ ok: true, state });
        break;
      }

      case 'TOGGLE': {
        const prev = getTabState(tabId);
        const active = !prev.active;
        const state = setTabState(tabId, { active });
        if (active) {
          await activateSimulator(tabId, state);
        } else {
          await deactivateSimulator(tabId);
        }
        sendResponse({ ok: true, state });
        break;
      }

      case 'ACTIVATE': {
        const state = setTabState(tabId, { active: true, ...msg.patch });
        await activateSimulator(tabId, state);
        sendResponse({ ok: true, state });
        break;
      }

      case 'DEACTIVATE': {
        const state = setTabState(tabId, { active: false });
        await deactivateSimulator(tabId);
        sendResponse({ ok: true, state });
        break;
      }

      case 'ROTATE': {
        const prev = getTabState(tabId);
        const orientation = prev.orientation === 'portrait' ? 'landscape' : 'portrait';
        const state = setTabState(tabId, { orientation });
        await sendToTab(tabId, { type: 'ROTATE', orientation });
        sendResponse({ ok: true, state });
        break;
      }

      case 'SET_ORIENTATION': {
        const state = setTabState(tabId, { orientation: msg.orientation });
        await sendToTab(tabId, { type: 'ROTATE', orientation: msg.orientation });
        sendResponse({ ok: true, state });
        break;
      }

      case 'SET_NETWORK': {
        const state = setTabState(tabId, { networkThrottle: msg.profile });
        await sendToTab(tabId, { type: 'SET_NETWORK', profile: msg.profile });
        sendResponse({ ok: true, state });
        break;
      }

      case 'SET_GEOLOCATION': {
        const state = setTabState(tabId, { geolocation: msg.geo });
        await sendToTab(tabId, { type: 'SET_GEOLOCATION', geo: msg.geo });
        sendResponse({ ok: true, state });
        break;
      }

      case 'TOGGLE_DARK_MODE': {
        const prev = getTabState(tabId);
        const darkMode = !prev.darkMode;
        const state = setTabState(tabId, { darkMode });
        await sendToTab(tabId, { type: 'TOGGLE_DARK_MODE', darkMode });
        sendResponse({ ok: true, state });
        break;
      }

      case 'SCREENSHOT': {
        try {
          const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
          sendResponse({ ok: true, dataUrl });
        } catch (e) {
          sendResponse({ ok: false, error: e.message });
        }
        break;
      }

      case 'OPEN_SIMULATOR_PAGE': {
        const url = chrome.runtime.getURL('simulator/index.html') + `?tabId=${tabId}`;
        const existing = await chrome.tabs.query({ url: chrome.runtime.getURL('simulator/index.html') + '*' });
        if (existing.length > 0) {
          await chrome.tabs.update(existing[0].id, { active: true, url });
        } else {
          await chrome.tabs.create({ url, active: true });
        }
        sendResponse({ ok: true });
        break;
      }

      default:
        sendResponse({ ok: false, error: 'Unknown message type' });
    }
  })();

  return true; // keep channel open for async
});

// ── Action click → open simulator page ───────────────────────
chrome.action.onClicked.addListener(async (tab) => {
  const url = chrome.runtime.getURL('simulator/index.html') + `?tabId=${tab.id}`;
  const existing = await chrome.tabs.query({ url: chrome.runtime.getURL('simulator/index.html') + '*' });
  if (existing.length > 0) {
    await chrome.tabs.update(existing[0].id, { active: true, url });
  } else {
    await chrome.tabs.create({ url, active: true });
  }
});

// ── Keyboard commands ─────────────────────────────────────────
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  switch (command) {
    case 'toggle-simulator': {
      const prev = getTabState(tab.id);
      const active = !prev.active;
      const state = setTabState(tab.id, { active });
      if (active) await activateSimulator(tab.id, state);
      else await deactivateSimulator(tab.id);
      break;
    }
    case 'rotate-device': {
      const prev = getTabState(tab.id);
      const orientation = prev.orientation === 'portrait' ? 'landscape' : 'portrait';
      setTabState(tab.id, { orientation });
      await sendToTab(tab.id, { type: 'ROTATE', orientation });
      break;
    }
    case 'take-screenshot': {
      const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
      const simulatorTabs = await chrome.tabs.query({ url: chrome.runtime.getURL('simulator/index.html') + '*' });
      if (simulatorTabs.length > 0) {
        chrome.tabs.sendMessage(simulatorTabs[0].id, { type: 'SCREENSHOT_RESULT', dataUrl });
      }
      break;
    }
  }
});

// ── Cleanup on tab close ──────────────────────────────────────
chrome.tabs.onRemoved.addListener((tabId) => {
  removeUserAgent(tabId);
  tabStates.delete(tabId);
});

// ── Re-inject on navigation ───────────────────────────────────
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) return;
  const state = getTabState(details.tabId);
  if (state.active) {
    await sendToTab(details.tabId, { type: 'UPDATE_STATE', state });
  }
});

console.log('[DevMobile] Background service worker started.');
