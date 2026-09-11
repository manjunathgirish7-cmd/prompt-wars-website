/**
 * Real Device & Environment Detector
 * Accurately detects OS, browser, device form factor, screen resolution, and persistent client device ID
 */

export interface DetectedClientDevice {
  deviceId: string;
  deviceName: string;
  os: string;
  browser: string;
  deviceType: 'desktop' | 'laptop' | 'mobile' | 'tablet' | 'unknown';
  screenResolution: string;
  userAgent: string;
  isTouchDevice: boolean;
  platform: string;
}

const DEVICE_ID_KEY = 'intentbridge_client_device_id';
const DEVICE_CUSTOM_NAME_KEY = 'intentbridge_custom_device_name';

/**
 * Gets or initializes a persistent unique device identifier for this client browser
 */
export function getPersistentDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'dev-browser-session';
  }
}

/**
 * Gets user-customized nickname for this device if set (e.g. "Home Laptop")
 */
export function getCustomDeviceName(): string | null {
  try {
    return localStorage.getItem(DEVICE_CUSTOM_NAME_KEY);
  } catch {
    return null;
  }
}

/**
 * Sets a custom nickname for this device
 */
export function setCustomDeviceName(name: string): void {
  try {
    localStorage.setItem(DEVICE_CUSTOM_NAME_KEY, name.trim());
  } catch {
    // ignore
  }
}

/**
 * Accurately analyzes the client environment and returns structured device details
 */
export function detectCurrentDevice(): DetectedClientDevice {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const platform = typeof navigator !== 'undefined' ? (navigator.platform || '') : '';
  const deviceId = getPersistentDeviceId();
  const customName = getCustomDeviceName();

  // 1. Detect Operating System
  let os = 'Unknown OS';
  if (/Windows NT 10.0/i.test(ua)) {
    // Windows 11 uses NT 10.0 too; check userAgentData if available or modern build
    os = 'Windows 11 / 10';
  } else if (/Windows NT 6.3/i.test(ua)) {
    os = 'Windows 8.1';
  } else if (/Windows NT 6.1/i.test(ua)) {
    os = 'Windows 7';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
    os = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
  } else if (/iPhone/i.test(ua)) {
    const match = ua.match(/OS (\d+[._]\d+)/);
    os = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS (iPhone)';
  } else if (/iPad/i.test(ua)) {
    os = 'iPadOS';
  } else if (/Android/i.test(ua)) {
    const match = ua.match(/Android (\d+(\.\d+)?)/);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/CrOS/i.test(ua)) {
    os = 'ChromeOS';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  // 2. Detect Browser
  let browser = 'Modern Browser';
  if (/Edg\//i.test(ua)) {
    const match = ua.match(/Edg\/(\d+[\.\d]*)/);
    browser = match ? `Microsoft Edge ${match[1].split('.')[0]}` : 'Microsoft Edge';
  } else if (/Chrome\//i.test(ua) && !/Chromium|Edg/i.test(ua)) {
    const match = ua.match(/Chrome\/(\d+[\.\d]*)/);
    browser = match ? `Google Chrome ${match[1].split('.')[0]}` : 'Google Chrome';
  } else if (/Safari\//i.test(ua) && !/Chrome|Chromium/i.test(ua)) {
    const match = ua.match(/Version\/(\d+[\.\d]*)/);
    browser = match ? `Apple Safari ${match[1].split('.')[0]}` : 'Apple Safari';
  } else if (/Firefox\//i.test(ua)) {
    const match = ua.match(/Firefox\/(\d+[\.\d]*)/);
    browser = match ? `Mozilla Firefox ${match[1].split('.')[0]}` : 'Mozilla Firefox';
  } else if (/OPR\/|Opera\//i.test(ua)) {
    browser = 'Opera';
  }

  // 3. Detect Form Factor & Device Type
  const isTouchDevice = typeof window !== 'undefined' && (
    'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)
  );

  let deviceType: 'desktop' | 'laptop' | 'mobile' | 'tablet' | 'unknown' = 'desktop';
  if (/iPhone|iPod|Android.*Mobile/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) {
    deviceType = 'tablet';
  } else if (isTouchDevice && typeof window !== 'undefined' && window.innerWidth <= 1024) {
    deviceType = 'tablet';
  } else if (/Macintosh/i.test(ua) || /Windows/i.test(ua) || /Linux/i.test(ua)) {
    deviceType = (typeof window !== 'undefined' && window.screen.width < 1600) ? 'laptop' : 'desktop';
  }

  // 4. Formulate Friendly Device Name
  let defaultDeviceName = 'Computer';
  if (deviceType === 'mobile') {
    defaultDeviceName = /iPhone/i.test(ua) ? 'Apple iPhone' : 'Android Smartphone';
  } else if (deviceType === 'tablet') {
    defaultDeviceName = /iPad/i.test(ua) ? 'Apple iPad' : 'Android Tablet';
  } else if (/Macintosh/i.test(ua)) {
    defaultDeviceName = 'MacBook / Mac Computer';
  } else if (/Windows/i.test(ua)) {
    defaultDeviceName = deviceType === 'laptop' ? 'Windows Laptop' : 'Windows PC';
  } else if (/Linux/i.test(ua)) {
    defaultDeviceName = 'Linux Workstation';
  }

  const deviceName = customName || defaultDeviceName;
  const screenResolution = typeof window !== 'undefined' 
    ? `${window.screen.width}x${window.screen.height} (${window.devicePixelRatio || 1}x)` 
    : 'Unknown';

  return {
    deviceId,
    deviceName,
    os,
    browser,
    deviceType,
    screenResolution,
    userAgent: ua,
    isTouchDevice: Boolean(isTouchDevice),
    platform
  };
}

/**
 * Returns HTTP headers containing client device info to attach to fetch calls
 */
export function getDeviceHttpHeaders(): Record<string, string> {
  try {
    const dev = detectCurrentDevice();
    return {
      'x-device-id': dev.deviceId,
      'x-device-name': dev.deviceName,
      'x-device-os': dev.os,
      'x-device-browser': dev.browser,
      'x-device-type': dev.deviceType,
      'x-device-res': dev.screenResolution
    };
  } catch {
    return {
      'x-device-id': 'dev-unknown',
      'x-device-name': 'Web Client'
    };
  }
}
