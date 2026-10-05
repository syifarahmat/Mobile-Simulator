// ============================================================
// DevMobile Simulator - Device Database
// ============================================================

const DEVICES = [
  // ── iPhone ─────────────────────────────────────────────────
  {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro',
    brand: 'Apple',
    type: 'phone',
    icon: '🍎',
    width: 393,
    height: 852,
    devicePixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  },
  {
    id: 'iphone-15',
    name: 'iPhone 15',
    brand: 'Apple',
    type: 'phone',
    icon: '🍎',
    width: 390,
    height: 844,
    devicePixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
  {
    id: 'iphone-se',
    name: 'iPhone SE 3rd Gen',
    brand: 'Apple',
    type: 'phone',
    icon: '🍎',
    width: 375,
    height: 667,
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
  {
    id: 'ipad-pro-13',
    name: 'iPad Pro 13"',
    brand: 'Apple',
    type: 'tablet',
    icon: '🍎',
    width: 1024,
    height: 1366,
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
  {
    id: 'ipad-mini',
    name: 'iPad Mini 6',
    brand: 'Apple',
    type: 'tablet',
    icon: '🍎',
    width: 744,
    height: 1133,
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },

  // ── Samsung ─────────────────────────────────────────────────
  {
    id: 'samsung-s24-ultra',
    name: 'Galaxy S24 Ultra',
    brand: 'Samsung',
    type: 'phone',
    icon: '🌌',
    width: 412,
    height: 915,
    devicePixelRatio: 3.088,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  },
  {
    id: 'samsung-s24',
    name: 'Galaxy S24',
    brand: 'Samsung',
    type: 'phone',
    icon: '🌌',
    width: 360,
    height: 780,
    devicePixelRatio: 3,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  },
  {
    id: 'samsung-fold-6',
    name: 'Galaxy Z Fold 6',
    brand: 'Samsung',
    type: 'phone',
    icon: '🌌',
    width: 373,
    height: 882,
    devicePixelRatio: 2.625,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-F956B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  },
  {
    id: 'samsung-tab-s9',
    name: 'Galaxy Tab S9',
    brand: 'Samsung',
    type: 'tablet',
    icon: '🌌',
    width: 800,
    height: 1280,
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  },

  // ── Google ──────────────────────────────────────────────────
  {
    id: 'pixel-9-pro',
    name: 'Pixel 9 Pro',
    brand: 'Google',
    type: 'phone',
    icon: '🔵',
    width: 412,
    height: 892,
    devicePixelRatio: 2.625,
    userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  },
  {
    id: 'pixel-8',
    name: 'Pixel 8',
    brand: 'Google',
    type: 'phone',
    icon: '🔵',
    width: 393,
    height: 851,
    devicePixelRatio: 2.816,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  },
  {
    id: 'pixel-tablet',
    name: 'Pixel Tablet',
    brand: 'Google',
    type: 'tablet',
    icon: '🔵',
    width: 1280,
    height: 800,
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  },

  // ── OnePlus ─────────────────────────────────────────────────
  {
    id: 'oneplus-12',
    name: 'OnePlus 12',
    brand: 'OnePlus',
    type: 'phone',
    icon: '🔴',
    width: 412,
    height: 919,
    devicePixelRatio: 3,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; CPH2581) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  },

  // ── Xiaomi ──────────────────────────────────────────────────
  {
    id: 'xiaomi-14-ultra',
    name: 'Xiaomi 14 Ultra',
    brand: 'Xiaomi',
    type: 'phone',
    icon: '🟠',
    width: 393,
    height: 873,
    devicePixelRatio: 3,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; 23116PN5BC) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  },

  // ── Generic ─────────────────────────────────────────────────
  {
    id: 'generic-mobile',
    name: 'Generic Mobile',
    brand: 'Generic',
    type: 'phone',
    icon: '📱',
    width: 375,
    height: 667,
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  },
  {
    id: 'generic-tablet',
    name: 'Generic Tablet',
    brand: 'Generic',
    type: 'tablet',
    icon: '📟',
    width: 768,
    height: 1024,
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  },
];

const NETWORK_PROFILES = [
  { id: 'none', label: 'No Throttle', icon: '⚡', downloadKbps: null, latency: 0, color: '#10b981' },
  { id: 'wifi', label: 'WiFi', icon: '📶', downloadKbps: 30000, latency: 5, color: '#3b82f6' },
  { id: '4g', label: '4G LTE', icon: '4️⃣', downloadKbps: 9000, latency: 170, color: '#8b5cf6' },
  { id: 'fast-3g', label: 'Fast 3G', icon: '3️⃣', downloadKbps: 1500, latency: 562, color: '#f59e0b' },
  { id: 'slow-3g', label: 'Slow 3G', icon: '🐢', downloadKbps: 500, latency: 2000, color: '#ef4444' },
  { id: 'offline', label: 'Offline', icon: '🚫', downloadKbps: 0, latency: 9999, color: '#6b7280' },
];

const GEO_PRESETS = [
  { id: 'custom', label: 'Custom', latitude: 0, longitude: 0 },
  { id: 'jakarta', label: '🇮🇩 Jakarta', latitude: -6.2088, longitude: 106.8456 },
  { id: 'new-york', label: '🇺🇸 New York', latitude: 40.7128, longitude: -74.0060 },
  { id: 'london', label: '🇬🇧 London', latitude: 51.5074, longitude: -0.1278 },
  { id: 'tokyo', label: '🇯🇵 Tokyo', latitude: 35.6762, longitude: 139.6503 },
  { id: 'paris', label: '🇫🇷 Paris', latitude: 48.8566, longitude: 2.3522 },
  { id: 'sydney', label: '🇦🇺 Sydney', latitude: -33.8688, longitude: 151.2093 },
  { id: 'dubai', label: '🇦🇪 Dubai', latitude: 25.2048, longitude: 55.2708 },
  { id: 'singapore', label: '🇸🇬 Singapore', latitude: 1.3521, longitude: 103.8198 },
  { id: 'seoul', label: '🇰🇷 Seoul', latitude: 37.5665, longitude: 126.9780 },
];

if (typeof module !== 'undefined') {
  module.exports = { DEVICES, NETWORK_PROFILES, GEO_PRESETS };
}
