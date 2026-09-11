import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  calculateTOTP, 
  verifyTOTP, 
  generateOtpAuthUri, 
  generateQrCodeDataUrl, 
  generateEmergencyBackupCodes, 
  generateSmsOtpCode,
  generateBase32Secret
} from './totp.js';

// Re-export TOTP functions for unified access
export {
  calculateTOTP,
  verifyTOTP,
  generateOtpAuthUri,
  generateQrCodeDataUrl,
  generateEmergencyBackupCodes,
  generateSmsOtpCode,
  generateBase32Secret
};

export interface StoredCitizenSession {
  id: string;
  deviceId: string;
  device: string;
  deviceName: string;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'laptop' | 'mobile' | 'tablet' | 'unknown';
  location: string;
  ip: string;
  current: boolean;
  trusted: boolean;
  trustedUntil?: string;
  createdAt: string;
  lastActive: string;
  token?: string;
  userId?: string;
}

export interface ActivityLogRecord {
  id: string;
  userId: string;
  action: string; // e.g. 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | '2FA_ENABLED' | '2FA_DISABLED' | '2FA_SUCCESS' | '2FA_FAILED' | 'PROBLEM_ANALYZED' | 'COMPLAINT_GENERATED' | 'FEEDBACK_SUBMITTED'
  type: 'login' | 'logout' | 'password_change' | 'password_reset_initiated' | '2fa_toggle' | 'passkey_register' | 'recovery_key_download' | 'session_terminated' | 'data_purged' | 'profile_updated' | 'ai_analysis' | 'complaint_generated' | 'feedback_submitted';
  category?: 'login_attempt' | 'account_modification' | 'session_device' | 'privacy_purge' | 'security_warning' | 'ai_activity' | 'civic_action';
  title: string;
  description: string;
  locationTag?: string;
  ipAddress: string;
  deviceInfo: string;
  status: 'success' | 'warning' | 'critical';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface StoredCitizenUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  city: string;
  ward?: string;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorMethod: 'sms' | 'authenticator' | 'passkey';
  twoFactorSecret?: string;
  backupCodes: string[];
  passkeyEnabled: boolean;
  autoPurgeDays: number;
  localEncryptionEnabled: boolean;
  recoveryKeyGenerated: boolean;
  recoveryKey: string;
  createdAt: string;
  lastLoginAt: string;
  sessions: StoredCitizenSession[];
  auditLogs?: ActivityLogRecord[];
}

export interface Pending2FAChallenge {
  userId: string;
  email: string;
  method: 'authenticator' | 'sms' | 'passkey';
  secret?: string;
  tempToken: string;
  smsCode?: string;
  phoneMasked?: string;
  expiresAt: number;
  attempts: number;
}

export interface Pending2FASetup {
  email: string;
  method: 'authenticator' | 'sms' | 'passkey';
  secret?: string;
  smsCode?: string;
  expiresAt: number;
}

export interface PendingPasswordReset {
  email: string;
  code: string;
  resetToken: string;
  expiresAt: number;
  attempts: number;
  deliveryChannel: string;
}

interface StoredSessionTokenEntry {
  token: string;
  userId: string;
  session: StoredCitizenSession;
  createdAt: string;
  expiresAt: string;
}

// Storage paths
const DATA_DIR = path.resolve(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ACTIVITY_LOGS_FILE = path.join(DATA_DIR, 'activity_logs.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// In-memory collections synchronized with disk
const usersMap = new Map<string, StoredCitizenUser>();
let activityLogsStore: ActivityLogRecord[] = [];
const sessionTokensMap = new Map<string, StoredSessionTokenEntry>();

// Transient memory maps for active challenges
export const pending2FAChallenges = new Map<string, Pending2FAChallenge>();
export const pending2FASetups = new Map<string, Pending2FASetup>();
export const pendingPasswordResets = new Map<string, PendingPasswordReset>();

/**
 * Ensures data directory exists
 */
function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

/**
 * Safely reads JSON from disk, falling back on error
 */
function safeReadJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw || !raw.trim()) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    try {
      if (fs.existsSync(filePath)) {
        const corruptPath = `${filePath}.corrupt.${Date.now()}`;
        fs.copyFileSync(filePath, corruptPath);
        console.warn(`Backed up corrupted storage to ${corruptPath}`);
      }
    } catch {
      // ignore backup error
    }
    return fallback;
  }
}

/**
 * Writes data atomically to avoid corrupting files on concurrent writes or interruptions
 */
function atomicWriteJson(filePath: string, data: any): void {
  try {
    ensureDataDir();
    const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 7)}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`Failed to persist storage to ${filePath}:`, err);
    throw err;
  }
}

/**
 * Sanitizes metadata to prevent any sensitive credentials from appearing in Activity Logs
 */
export function sanitizeLogMetadata(meta?: Record<string, any>): Record<string, any> | undefined {
  if (!meta) return undefined;
  const sensitivePatterns = [
    'password', 'passwordhash', 'newpassword', 'currentpassword', 'oldpassword',
    'code', 'otp', 'totp', 'secret', 'twofactorsecret', 'token', 'temptoken',
    'resettoken', 'sessiontoken', 'apikey', 'geminikey', 'recoverykey', 'privatekey',
    'auth', 'authorization', 'cookie', 'bearer', 'credential'
  ];

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(meta)) {
    const kClean = key.toLowerCase().replace(/[_\-\s]/g, '');
    const isSensitive = sensitivePatterns.some(pattern => kClean.includes(pattern) || kClean === 'key');
    if (isSensitive) {
      cleaned[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      cleaned[key] = sanitizeLogMetadata(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Seeds default demo user if no users exist
 */
function seedDefaultUsers(): void {
  const aaravEmail = 'aarav@citizen.org';
  if (!usersMap.has(aaravEmail)) {
    const demoUser: StoredCitizenUser = {
      id: 'usr-demo-aarav',
      name: 'Aarav Sharma',
      email: aaravEmail,
      phone: '+91 98765 43210',
      passwordHash: 'Demo@2026Secure!',
      city: 'Bengaluru',
      ward: 'Ward 112, Indiranagar',
      isVerified: true,
      twoFactorEnabled: true,
      twoFactorMethod: 'authenticator',
      twoFactorSecret: 'JBSWY3DPEHPK3PXP',
      backupCodes: [
        '8K9P-44M2',
        '77LQ-91AA',
        '55VB-33CK',
        '99ZP-12RT',
        '33XW-88MN',
        '44TY-66GH'
      ],
      passkeyEnabled: true,
      autoPurgeDays: 90,
      localEncryptionEnabled: true,
      recoveryKeyGenerated: true,
      recoveryKey: 'SEC-7K9P-44M2-99L1',
      createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
      lastLoginAt: new Date().toISOString(),
      sessions: [
        {
          id: 'sess-seed-1',
          deviceId: 'dev-mac-arm-01',
          device: 'MacBook Pro 16" (macOS 15.1)',
          deviceName: 'Aarav’s Work Laptop',
          browser: 'Chrome 128.0 (Encrypted)',
          os: 'macOS Sequoia 15.1',
          deviceType: 'laptop',
          location: 'Bengaluru, KA, India',
          ip: '49.207.214.18',
          current: true,
          trusted: true,
          trustedUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
          lastActive: 'Just now'
        }
      ],
      auditLogs: []
    };

    usersMap.set(demoUser.id, demoUser);
    usersMap.set(aaravEmail, demoUser);
    registerSessionToken('token-usr-demo-aarav-active', demoUser.id, demoUser.sessions[0]);
    persistUsersToDisk();

    // Seed baseline activity logs for demo user
    recordActivityEvent({
      userId: demoUser.id,
      action: '2FA_ENABLED',
      type: '2fa_toggle',
      category: 'account_modification',
      title: 'Two-Factor Authentication Configured',
      description: 'Configured hardware TOTP Authenticator (Google Authenticator) with 6 emergency backup codes.',
      locationTag: 'Bengaluru, KA, India',
      ipAddress: '49.207.214.18',
      deviceInfo: 'MacBook Pro 16" (macOS 15.1)',
      status: 'success',
      timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
    });

    recordActivityEvent({
      userId: demoUser.id,
      action: 'LOGIN',
      type: 'login',
      category: 'login_attempt',
      title: 'Authenticated Civic Session Initiated',
      description: 'Successful login with verified 2FA TOTP code.',
      locationTag: 'Bengaluru, KA, India',
      ipAddress: '49.207.214.18',
      deviceInfo: 'MacBook Pro 16" (macOS 15.1)',
      status: 'success',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    });
  }

  const manjunathEmail = 'manjunathgirish7@gmail.com';
  if (!usersMap.has(manjunathEmail)) {
    const manjunathUser: StoredCitizenUser = {
      id: 'usr-manjunath',
      name: 'Manjunath Girish',
      email: manjunathEmail,
      phone: '+91 98765 43210',
      passwordHash: 'Demo@2026Secure!',
      city: 'Bengaluru',
      ward: 'Ward 112, Indiranagar',
      isVerified: true,
      twoFactorEnabled: true,
      twoFactorMethod: 'authenticator',
      twoFactorSecret: 'JBSWY3DPEHPK3PXP',
      backupCodes: [
        '8K9P-44M2',
        '77LQ-91AA',
        '55VB-33CK',
        '99ZP-12RT',
        '33XW-88MN',
        '44TY-66GH'
      ],
      passkeyEnabled: true,
      autoPurgeDays: 90,
      localEncryptionEnabled: true,
      recoveryKeyGenerated: true,
      recoveryKey: 'SEC-7K9P-44M2-99L1',
      createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      lastLoginAt: new Date().toISOString(),
      sessions: [
        {
          id: 'sess-seed-manjunath-1',
          deviceId: 'dev-mac-arm-01',
          device: 'MacBook Pro 16" (macOS 15.1)',
          deviceName: 'Manjunath’s Workstation',
          browser: 'Chrome 128.0 (Encrypted)',
          os: 'macOS Sequoia 15.1',
          deviceType: 'laptop',
          location: 'Bengaluru, KA, India',
          ip: '49.207.214.18',
          current: true,
          trusted: true,
          trustedUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
          lastActive: 'Just now'
        }
      ],
      auditLogs: []
    };

    usersMap.set(manjunathUser.id, manjunathUser);
    usersMap.set(manjunathEmail, manjunathUser);
    registerSessionToken('token-usr-manjunath-active', manjunathUser.id, manjunathUser.sessions[0]);
    persistUsersToDisk();

    recordActivityEvent({
      userId: manjunathUser.id,
      action: '2FA_ENABLED',
      type: '2fa_toggle',
      category: 'account_modification',
      title: 'Two-Factor Authentication Active',
      description: 'Configured hardware TOTP Authenticator with 6 emergency backup codes.',
      locationTag: 'Bengaluru, KA, India',
      ipAddress: '49.207.214.18',
      deviceInfo: 'MacBook Pro 16" (macOS 15.1)',
      status: 'success',
      timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
    });

    recordActivityEvent({
      userId: manjunathUser.id,
      action: 'LOGIN',
      type: 'login',
      category: 'login_attempt',
      title: 'Authenticated Civic Session Initiated',
      description: 'Successful login with verified 2FA TOTP code.',
      locationTag: 'Bengaluru, KA, India',
      ipAddress: '49.207.214.18',
      deviceInfo: 'MacBook Pro 16" (macOS 15.1)',
      status: 'success',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    });
  }
}

/**
 * Persists in-memory users to disk
 */
function persistUsersToDisk(): void {
  try {
    const uniqueUsers = Array.from(new Set(Array.from(usersMap.values())));
    atomicWriteJson(USERS_FILE, uniqueUsers);
  } catch (err) {
    console.error('Failed to persist users to disk:', err);
  }
}

/**
 * Persists in-memory activity logs to disk
 */
function persistActivityLogsToDisk(): void {
  try {
    atomicWriteJson(ACTIVITY_LOGS_FILE, activityLogsStore);
  } catch (err) {
    console.error('Failed to persist activity logs to disk:', err);
  }
}

/**
 * Persists in-memory session tokens to disk
 */
function persistSessionsToDisk(): void {
  try {
    const entries = Array.from(sessionTokensMap.values());
    atomicWriteJson(SESSIONS_FILE, entries);
  } catch (err) {
    console.error('Failed to persist sessions to disk:', err);
  }
}

/**
 * Initializes persistent storage from disk
 */
export function initializeStorage(): void {
  ensureDataDir();

  // 1. Load users
  const storedUsers = safeReadJson<StoredCitizenUser[]>(USERS_FILE, []);
  usersMap.clear();
  for (const user of storedUsers) {
    usersMap.set(user.id, user);
    usersMap.set(user.email.toLowerCase().trim(), user);
  }

  // 2. Load activity logs
  activityLogsStore = safeReadJson<ActivityLogRecord[]>(ACTIVITY_LOGS_FILE, []);

  // 3. Load active sessions
  const storedSessions = safeReadJson<StoredSessionTokenEntry[]>(SESSIONS_FILE, []);
  sessionTokensMap.clear();
  const now = Date.now();
  for (const entry of storedSessions) {
    if (new Date(entry.expiresAt).getTime() > now) {
      sessionTokensMap.set(entry.token, entry);
    }
  }

  // 4. Seed default if empty
  seedDefaultUsers();

  // 5. Ensure all core json files exist on disk
  if (!fs.existsSync(SESSIONS_FILE)) {
    persistSessionsToDisk();
  }
  if (!fs.existsSync(ACTIVITY_LOGS_FILE)) {
    persistActivityLogsToDisk();
  }
  if (!fs.existsSync(USERS_FILE)) {
    persistUsersToDisk();
  }
}

// Auto-initialize on module load
initializeStorage();

/**
 * Retrieves a user by their registered email address
 */
export function getUserByEmail(email: string): StoredCitizenUser | undefined {
  if (!email) return undefined;
  const normalized = email.toLowerCase().trim();
  return usersMap.get(normalized);
}

/**
 * Retrieves a user by their unique user ID
 */
export function getUserById(id: string): StoredCitizenUser | undefined {
  if (!id) return undefined;
  return usersMap.get(id);
}

/**
 * Retrieves a user by their active session token
 */
export function getUserByToken(token: string): StoredCitizenUser | undefined {
  if (!token) return undefined;
  const entry = sessionTokensMap.get(token);
  if (!entry) return undefined;

  // Check expiration
  if (new Date(entry.expiresAt).getTime() < Date.now()) {
    sessionTokensMap.delete(token);
    persistSessionsToDisk();
    return undefined;
  }

  return getUserById(entry.userId);
}

/**
 * Saves or updates a user and persists to disk
 */
export function saveUser(user: StoredCitizenUser): void {
  if (!user || !user.id || !user.email) {
    throw new Error('Cannot save invalid user record');
  }

  const normalizedEmail = user.email.toLowerCase().trim();
  usersMap.set(user.id, user);
  usersMap.set(normalizedEmail, user);
  persistUsersToDisk();
}

/**
 * Registers an active session token for an authenticated citizen
 */
export function registerSessionToken(token: string, userId: string, session: StoredCitizenSession): void {
  if (!token || !userId) return;

  const entry: StoredSessionTokenEntry = {
    token,
    userId,
    session,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString() // 30-day session
  };

  sessionTokensMap.set(token, entry);
  persistSessionsToDisk();
}

/**
 * Revokes an active session token upon logout or session termination
 */
export function revokeSessionToken(token: string): void {
  if (!token) return;
  if (sessionTokensMap.has(token)) {
    sessionTokensMap.delete(token);
    persistSessionsToDisk();
  }
}

/**
 * Records a real, authenticated Activity Log event and persists to disk
 */
export function recordActivityEvent(
  params: Omit<ActivityLogRecord, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
): ActivityLogRecord {
  if (!params.userId) {
    throw new Error('Security Error: userId is required when recording an Activity Log event.');
  }

  const id = params.id || `act-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const timestamp = params.timestamp || new Date().toISOString();
  const sanitizedMeta = sanitizeLogMetadata(params.metadata);

  const record: ActivityLogRecord = {
    id,
    userId: params.userId,
    action: params.action,
    type: params.type,
    category: params.category || 'civic_action',
    title: params.title,
    description: params.description,
    locationTag: params.locationTag || 'Bengaluru, KA, India',
    ipAddress: params.ipAddress || '127.0.0.1',
    deviceInfo: params.deviceInfo || 'Standard Web Browser',
    status: params.status || 'success',
    timestamp,
    metadata: sanitizedMeta
  };

  // Add to global activity store
  activityLogsStore.unshift(record);
  // Cap at 1000 records to prevent runaway memory
  if (activityLogsStore.length > 1000) {
    activityLogsStore = activityLogsStore.slice(0, 1000);
  }
  persistActivityLogsToDisk();

  // Also sync to user's auditLogs
  const user = getUserById(params.userId);
  if (user) {
    if (!user.auditLogs) user.auditLogs = [];
    user.auditLogs.unshift(record);
    if (user.auditLogs.length > 100) {
      user.auditLogs = user.auditLogs.slice(0, 100);
    }
    saveUser(user);
  }

  return record;
}

/**
 * Retrieves Activity Logs strictly for the designated authenticated user
 */
export function getUserActivityLogs(userId: string): ActivityLogRecord[] {
  if (!userId) return [];

  // Filter global store by userId
  const userLogs = activityLogsStore.filter(l => l.userId === userId);

  // Sort newest first lexicographically
  return [...userLogs].sort((a, b) => b.timestamp > a.timestamp ? 1 : (b.timestamp < a.timestamp ? -1 : 0));
}

/**
 * Returns all activity logs (admin/debug only)
 */
export function getAllActivityLogs(): ActivityLogRecord[] {
  return [...activityLogsStore];
}

/**
 * Completely purges all data for a specific citizen (Right to be Forgotten)
 */
export function clearUserData(userId: string): void {
  const user = getUserById(userId);
  if (user) {
    usersMap.delete(user.id);
    usersMap.delete(user.email.toLowerCase().trim());
    persistUsersToDisk();
  }

  // Purge logs
  activityLogsStore = activityLogsStore.filter(l => l.userId !== userId);
  persistActivityLogsToDisk();

  // Purge sessions
  for (const [token, entry] of sessionTokensMap.entries()) {
    if (entry.userId === userId) {
      sessionTokensMap.delete(token);
    }
  }
  persistSessionsToDisk();
}
