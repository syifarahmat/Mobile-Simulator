// ============================================================
// DevMobile Simulator — Full UI Logic
// ============================================================

// ── State ─────────────────────────────────────────────────────
let state = {
  active: false,
  device: null,
  orientation: 'portrait',
  networkThrottle: 'none',
  geolocation: null,
  darkMode: false,
};

let targetTabId = null;
let zoom = 1;
let customDevices = [];
let currentFilter = 'all';
let searchQuery = '';

// ── Parse target tab from URL ─────────────────────────────────
const params = new URLSearchParams(window.location.search);
targetTabId = parseInt(params.get('tabId'), 10) || null;

// ── Init ──────────────────────────────────────────────────────
async function init() {
  loadCustomDevices();
  renderDeviceList();
  renderNetworkGrid();
  renderGeoPresets();
  setupEventListeners();

  if (targetTabId) {
    const remote = await bgMessage({ type: 'GET_STATE', tabId: targetTabId });
    if (remote) applyState(remote);
  }

  updateUI();
}

// ── Background messaging ───────────────────────────────────────
function bgMessage(msg) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ ...msg, tabId: targetTabId }, (resp) => {
        if (chrome.runtime.lastError) { resolve(null); return; }
        resolve(resp);
      });
    } catch (e) { resolve(null); }
  });
}

// ── State helpers ──────────────────────────────────────────────
function applyState(s) {
  state = { ...state, ...s };
  updateUI();
}

function updateUI() {
  // Toggle btn
  const toggleBtn = $('#toggleBtn');
  if (state.active) {
    toggleBtn.classList.add('is-active');
    toggleBtn.querySelector('.toggle-label').textContent = 'Active';
  } else {
    toggleBtn.classList.remove('is-active');
    toggleBtn.querySelector('.toggle-label').textContent = 'Activate';
  }

  // Active device info
  const info = $('#activeDeviceInfo');
  if (state.device) {
    info.innerHTML = `
      <span class="active-label">
        ${state.active ? '<span class="dot"></span>' : ''}
        ${state.device.icon} ${state.device.name}
        <span style="color:var(--text-3);font-weight:400">·</span>
        <span style="font-family:'JetBrains Mono',monospace;color:var(--text-2)">${effectiveWidth()}×${effectiveHeight()}</span>
      </span>
    `;
  } else {
    info.innerHTML = '<span class="no-device">No device selected</span>';
  }

  // Orientation buttons
  const orientP = $('#orientPortrait');
  const orientL = $('#orientLandscape');
  if (state.orientation === 'portrait') {
    orientP.setAttribute('data-active', 'true');
    orientL.removeAttribute('data-active');
  } else {
    orientL.setAttribute('data-active', 'true');
    orientP.removeAttribute('data-active');
  }

  // Dark mode btn
  const dmBtn = $('#darkModeBtn');
  if (state.darkMode) {
    dmBtn.setAttribute('data-active', 'true');
    dmBtn.title = 'Dark mode: ON';
  } else {
    dmBtn.removeAttribute('data-active');
    dmBtn.title = 'Toggle dark mode';
  }

  // Device frame
  updateDeviceFrame();

  // Info chips
  updateInfoChips();

  // Device list active state
  document.querySelectorAll('.device-item').forEach(el => {
    el.classList.toggle('active', el.dataset.id === state.device?.id);
  });
}

function effectiveWidth() {
  if (!state.device) return 0;
  return state.orientation === 'landscape' ? state.device.height : state.device.width;
}

function effectiveHeight() {
  if (!state.device) return 0;
  return state.orientation === 'landscape' ? state.device.width : state.device.height;
}

function updateDeviceFrame() {
  if (!state.device) return;
  const frame = $('#deviceFrame');
  const screen = $('#deviceScreen');
  const notch = $('#deviceNotch');
  const homeBar = $('#deviceHomeBar');

  const w = effectiveWidth();
  const h = effectiveHeight();
  const maxH = window.innerHeight - 200;
  const maxW = window.innerWidth - 340;
  const autoZoom = Math.min(1, maxW / w, maxH / h, zoom);
  const isLandscape = state.orientation === 'landscape';

  screen.style.width = `${w}px`;
  screen.style.height = `${h}px`;
  frame.style.transform = `scale(${autoZoom * zoom})`;
  frame.style.transformOrigin = 'center center';
  frame.style.borderRadius = isLandscape ? '28px' : '42px';

  // Show notch for iPhone-style devices
  const isApple = state.device.brand === 'Apple';
  notch.classList.toggle('visible', isApple && !isLandscape);
  homeBar.classList.toggle('visible', isApple);

  // Resize iframe
  const iframe = $('#previewFrame');
  if (!iframe.classList.contains('hidden')) {
    iframe.style.width = `${w}px`;
    iframe.style.height = `${h}px`;
  }

  updateZoomLabel(autoZoom * zoom);
}

function updateZoomLabel(z) {
  $('#zoomLabel').textContent = Math.round(z * 100) + '%';
}

function updateInfoChips() {
  const chips = $('#infoChips');
  if (!state.device) {
    chips.innerHTML = '<span class="info-chip">Select a device to preview</span>';
    return;
  }
  const ua = state.device.userAgent || '';
  const shortUA = ua.length > 60 ? ua.slice(0, 60) + '…' : ua;
  chips.innerHTML = `
    <span class="info-chip purple">${effectiveWidth()}×${effectiveHeight()} px</span>
    <span class="info-chip">DPR: ${state.device.devicePixelRatio}</span>
    <span class="info-chip ${state.active ? 'green' : ''}">${state.active ? '● Active' : '○ Inactive'}</span>
    <span class="info-chip">${state.device.brand}</span>
    <span class="info-chip" title="${ua}" style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${shortUA}</span>
  `;
}

// ── Render device list ─────────────────────────────────────────
function allDevices() {
  return [...DEVICES, ...customDevices];
}

function renderDeviceList() {
  const list = $('#deviceList');
  const devices = allDevices().filter(d => {
    const matchFilter = currentFilter === 'all' || d.type === currentFilter || (currentFilter === 'custom' && d.isCustom);
    const matchSearch = !searchQuery || d.name.toLowerCase().includes(searchQuery) || d.brand.toLowerCase().includes(searchQuery);
    return matchFilter && matchSearch;
  });

  if (devices.length === 0) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-3);font-size:12px">No devices found</div>';
    return;
  }

  // Group by brand
  const groups = {};
  devices.forEach(d => {
    const key = d.brand;
    if (!groups[key]) groups[key] = [];
    groups[key].push(d);
  });

  list.innerHTML = Object.entries(groups).map(([brand, devs]) => `
    <div class="device-group-label">${brand}</div>
    ${devs.map(d => `
      <div class="device-item" data-id="${d.id}">
        <span class="device-icon">${d.icon}</span>
        <div class="device-info">
          <div class="device-name">${d.name}</div>
          <div class="device-dims">${d.width}×${d.height}</div>
        </div>
        ${d.isCustom ? `<button class="device-delete-btn" data-delete="${d.id}" title="Delete">✕</button>` : ''}
      </div>
    `).join('')}
  `).join('');

  // Click handlers
  list.querySelectorAll('.device-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-delete]')) return;
      const id = el.dataset.id;
      const device = allDevices().find(d => d.id === id);
      if (device) selectDevice(device);
    });
  });

  // Delete handlers
  list.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteCustomDevice(btn.dataset.delete);
    });
  });
}

async function selectDevice(device) {
  state.device = device;
  updateUI();

  if (state.active) {
    const resp = await bgMessage({ type: 'SET_DEVICE', device });
    if (resp?.state) applyState(resp.state);
  }

  // Show preview
  showPreview();
  toast(`${device.icon} ${device.name} selected`, 'success');
}

function showPreview() {
  const emptyState = $('#emptyState');
  const iframe = $('#previewFrame');
  emptyState.classList.add('hidden');
  iframe.classList.remove('hidden');

  const url = $('#urlInput').value.trim();
  if (url && url !== iframe.src) {
    iframe.style.width = effectiveWidth() + 'px';
    iframe.style.height = effectiveHeight() + 'px';
    iframe.src = url;
  }

  updateDeviceFrame();
}

// ── Network ────────────────────────────────────────────────────
function renderNetworkGrid() {
  const grid = $('#networkGrid');
  grid.innerHTML = NETWORK_PROFILES.map(p => `
    <div class="network-card ${state.networkThrottle === p.id ? 'active' : ''}" data-network="${p.id}">
      <div class="network-card-icon">${p.icon}</div>
      <div class="network-card-label">${p.label}</div>
      <div class="network-card-speed">${p.downloadKbps ? `${(p.downloadKbps/1000).toFixed(1)} Mbps` : '—'}</div>
    </div>
  `).join('');

  grid.querySelectorAll('.network-card').forEach(card => {
    card.addEventListener('click', async () => {
      const id = card.dataset.network;
      state.networkThrottle = id;
      renderNetworkGrid();
      updateNetworkStats(id);
      await bgMessage({ type: 'SET_NETWORK', profile: id });
      toast(`Network: ${NETWORK_PROFILES.find(p => p.id === id)?.label}`, 'success');
    });
  });

  updateNetworkStats(state.networkThrottle);
}

function updateNetworkStats(profileId) {
  const p = NETWORK_PROFILES.find(n => n.id === profileId);
  if (!p) return;
  $('#statDownload').textContent = p.downloadKbps ? `${(p.downloadKbps/1000).toFixed(1)} Mbps` : '∞';
  $('#statLatency').textContent = p.latency ? `${p.latency} ms` : '< 5 ms';
  $('#statStatus').textContent = p.label;
}

// ── Geolocation ────────────────────────────────────────────────
function renderGeoPresets() {
  const container = $('#geoPresets');
  container.innerHTML = GEO_PRESETS.filter(g => g.id !== 'custom').map(g => `
    <button class="geo-btn" data-geo="${g.id}">${g.label}</button>
  `).join('');

  container.querySelectorAll('.geo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.geo;
      const preset = GEO_PRESETS.find(g => g.id === id);
      if (!preset) return;
      document.querySelectorAll('.geo-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $('#geoLat').value = preset.latitude;
      $('#geoLng').value = preset.longitude;
      applyGeolocation(preset.latitude, preset.longitude);
      updateMapPreview(preset.latitude, preset.longitude);
    });
  });
}

async function applyGeolocation(lat, lng) {
  state.geolocation = { latitude: parseFloat(lat), longitude: parseFloat(lng) };
  await bgMessage({ type: 'SET_GEOLOCATION', geo: state.geolocation });
  toast(`📍 Location set: ${lat}, ${lng}`, 'success');
}

function updateMapPreview(lat, lng) {
  const preview = $('#geoMapPreview');
  const frame = $('#mapFrame');
  preview.classList.add('visible');
  frame.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.05},${lat-0.05},${lng+0.05},${lat+0.05}&layer=mapnik&marker=${lat},${lng}`;
}

// ── Custom devices ─────────────────────────────────────────────
function loadCustomDevices() {
  try {
    const stored = localStorage.getItem('devmobile_custom_devices');
    customDevices = stored ? JSON.parse(stored) : [];
  } catch { customDevices = []; }
}

function saveCustomDevices() {
  localStorage.setItem('devmobile_custom_devices', JSON.stringify(customDevices));
}

function deleteCustomDevice(id) {
  customDevices = customDevices.filter(d => d.id !== id);
  saveCustomDevices();
  if (state.device?.id === id) state.device = null;
  renderDeviceList();
  toast('Custom device deleted', 'success');
}

// ── Events ─────────────────────────────────────────────────────
function setupEventListeners() {
  // Toggle
  $('#toggleBtn').addEventListener('click', async () => {
    if (!state.device && !state.active) {
      toast('Please select a device first', 'error');
      return;
    }
    const resp = await bgMessage({ type: 'TOGGLE' });
    if (resp?.state) applyState(resp.state);
    toast(resp?.state?.active ? '✅ Simulator activated' : '⏹ Simulator deactivated',
      resp?.state?.active ? 'success' : '');
  });

  // Orientation portrait
  $('#orientPortrait').addEventListener('click', async () => {
    if (state.orientation === 'portrait') return;
    state.orientation = 'portrait';
    updateUI();
    await bgMessage({ type: 'SET_ORIENTATION', orientation: 'portrait' });
  });

  // Orientation landscape
  $('#orientLandscape').addEventListener('click', async () => {
    if (state.orientation === 'landscape') return;
    state.orientation = 'landscape';
    updateUI();
    await bgMessage({ type: 'SET_ORIENTATION', orientation: 'landscape' });
  });

  // Dark mode
  $('#darkModeBtn').addEventListener('click', async () => {
    const resp = await bgMessage({ type: 'TOGGLE_DARK_MODE' });
    if (resp?.state) applyState(resp.state);
    toast(state.darkMode ? '🌙 Dark mode ON' : '☀️ Dark mode OFF', 'success');
  });

  // Screenshot
  $('#screenshotBtn').addEventListener('click', async () => {
    const resp = await bgMessage({ type: 'SCREENSHOT' });
    if (resp?.ok && resp.dataUrl) {
      showScreenshotModal(resp.dataUrl);
    } else {
      toast('Screenshot failed. Make sure the target tab is active.', 'error');
    }
  });

  // Screenshot modal close
  $('#modalClose').addEventListener('click', () => $('#screenshotModal').classList.add('hidden'));
  $('#modalBackdrop').addEventListener('click', () => $('#screenshotModal').classList.add('hidden'));

  // Download screenshot
  $('#downloadScreenshotBtn').addEventListener('click', () => {
    const img = $('#screenshotImg');
    const a = document.createElement('a');
    a.href = img.src;
    a.download = `devmobile-${state.device?.name ?? 'screenshot'}-${Date.now()}.png`;
    a.click();
  });

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = btn.dataset.tab;
      document.querySelector(`[data-panel="${panel}"]`)?.classList.add('active');
    });
  });

  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderDeviceList();
    });
  });

  // Search
  $('#searchInput').addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderDeviceList();
  });

  // Add device btn (→ go to custom tab)
  $('#addDeviceBtn').addEventListener('click', () => {
    document.querySelector('[data-tab="custom-device"]')?.click();
  });

  // URL go
  $('#urlGoBtn').addEventListener('click', loadUrl);
  $('#urlInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') loadUrl(); });

  // Zoom
  $('#zoomIn').addEventListener('click', () => { zoom = Math.min(zoom + 0.1, 3); updateDeviceFrame(); });
  $('#zoomOut').addEventListener('click', () => { zoom = Math.max(zoom - 0.1, 0.2); updateDeviceFrame(); });
  $('#zoomFit').addEventListener('click', () => { zoom = 1; updateDeviceFrame(); });

  // Apply geolocation
  $('#applyGeoBtn').addEventListener('click', () => {
    const lat = parseFloat($('#geoLat').value);
    const lng = parseFloat($('#geoLng').value);
    if (isNaN(lat) || isNaN(lng)) { toast('Invalid coordinates', 'error'); return; }
    applyGeolocation(lat, lng);
    updateMapPreview(lat, lng);
  });

  // Save custom device
  $('#saveCustomDeviceBtn').addEventListener('click', () => {
    const name = $('#customName').value.trim();
    const width = parseInt($('#customWidth').value, 10);
    const height = parseInt($('#customHeight').value, 10);

    if (!name || !width || !height) {
      toast('Name, width, and height are required', 'error');
      return;
    }

    const device = {
      id: 'custom-' + Date.now(),
      name,
      brand: $('#customBrand').value.trim() || 'Custom',
      type: $('#customType').value,
      icon: $('#customIcon').value.trim() || '📱',
      width,
      height,
      devicePixelRatio: parseFloat($('#customDpr').value) || 2,
      userAgent: $('#customUA').value.trim(),
      isCustom: true,
    };

    customDevices.push(device);
    saveCustomDevices();
    renderDeviceList();
    currentFilter = 'custom';
    document.querySelectorAll('.filter-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.filter === 'custom');
    });
    renderDeviceList();

    // Clear form
    ['customName','customBrand','customWidth','customHeight','customUA'].forEach(id => { $(`#${id}`).value = ''; });
    $('#customDpr').value = '2';
    $('#customIcon').value = '📱';

    toast(`✅ "${name}" added!`, 'success');

    // Go to preview tab
    document.querySelector('[data-tab="preview"]')?.click();
    selectDevice(device);
  });

  // Listen for screenshot result from bg
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SCREENSHOT_RESULT' && msg.dataUrl) {
      showScreenshotModal(msg.dataUrl);
    }
  });

  // Resize
  window.addEventListener('resize', () => updateDeviceFrame());
}

// ── URL loader ─────────────────────────────────────────────────
function loadUrl() {
  let url = $('#urlInput').value.trim();
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  $('#urlInput').value = url;

  if (!state.device) { toast('Select a device first', 'error'); return; }

  const iframe = $('#previewFrame');
  const emptyState = $('#emptyState');
  emptyState.classList.add('hidden');
  iframe.classList.remove('hidden');
  iframe.style.width = effectiveWidth() + 'px';
  iframe.style.height = effectiveHeight() + 'px';
  iframe.src = url;
  updateDeviceFrame();
}

// ── Screenshot modal ───────────────────────────────────────────
function showScreenshotModal(dataUrl) {
  const modal = $('#screenshotModal');
  const img = $('#screenshotImg');
  img.src = dataUrl;
  modal.classList.remove('hidden');
}

// ── Toast ──────────────────────────────────────────────────────
let toastTimer;
function toast(msg, type = '') {
  const el = $('#toast');
  el.textContent = msg;
  el.className = 'toast' + (type ? ' ' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3000);
}

// ── Helper ─────────────────────────────────────────────────────
function $(sel) { return document.querySelector(sel); }

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
