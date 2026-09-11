import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { 
  getUserByEmail, 
  getUserById, 
  getUserByToken, 
  saveUser, 
  clearUserData,
  registerSessionToken, 
  revokeSessionToken, 
  recordActivityEvent, 
  getUserActivityLogs, 
  calculateTOTP, 
  verifyTOTP, 
  generateEmergencyBackupCodes, 
  generateSmsOtpCode, 
  generateBase32Secret,
  sanitizeLogMetadata
} from './backend/utils/storage.js';

console.log('--- Starting Comprehensive 2FA & Storage Validation Test ---');

// 1. Storage files exist
assert(fs.existsSync(path.resolve(process.cwd(), 'data/users.json')), 'users.json should exist');
assert(fs.existsSync(path.resolve(process.cwd(), 'data/sessions.json')), 'sessions.json should exist');
assert(fs.existsSync(path.resolve(process.cwd(), 'data/activity_logs.json')), 'activity_logs.json should exist');
console.log('✓ Storage files exist');

// 2. TOTP Algorithm Validation
const testSecret = generateBase32Secret();
assert(testSecret && testSecret.length >= 16, 'Base32 secret generated properly');
const currentTotp = calculateTOTP(testSecret);
assert(currentTotp && currentTotp.length === 6, 'TOTP code must be 6 digits');
assert(verifyTOTP(currentTotp, testSecret), 'Calculated TOTP must verify with secret');
assert(!verifyTOTP('000000', testSecret) || currentTotp === '000000', 'Invalid code rejected');
console.log('✓ TOTP generation and verification algorithm works');

// 3. Backup Codes Generation
const backupCodes = generateEmergencyBackupCodes();
assert(backupCodes.length === 8, 'Should generate 8 emergency backup codes');
assert(backupCodes.every(c => c.length === 9 && c.includes('-')), 'Backup code format is XXXX-XXXX');
console.log('✓ Emergency backup codes generated correctly');

// 4. SMS OTP Code
const smsCode = generateSmsOtpCode();
assert(smsCode.length === 6 && /^\d+$/.test(smsCode), 'SMS code must be 6 digits');
console.log('✓ SMS OTP generation valid');

// 5. User creation & persistence
const testUserAEmail = `test_citizen_a_${Date.now()}@example.org`;
const userA = {
  id: `usr-a-${Date.now()}`,
  name: 'Citizen Test A',
  email: testUserAEmail,
  passwordHash: '$2b$10$hashedpasswordA',
  phone: '+91 9876543210',
  city: 'Bengaluru',
  ward: 'Indiranagar Ward 82',
  twoFactorEnabled: false,
  twoFactorMethod: 'authenticator',
  twoFactorSecret: testSecret,
  backupCodes: [...backupCodes],
  autoPurgeDays: 30,
  localEncryptionEnabled: true,
  createdAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
  sessions: [],
  auditLogs: []
};
saveUser(userA);

const fetchedA = getUserByEmail(testUserAEmail);
assert(fetchedA && fetchedA.id === userA.id, 'User A saved and retrieved by email');
assert(getUserById(userA.id)?.email === testUserAEmail, 'User A retrieved by ID');
console.log('✓ User saved and retrieved by email and ID');

// 6. Session registration & resolution
const tokenA = `tok-session-${Date.now()}`;
registerSessionToken(tokenA, userA.id, {
  id: 'sess-a-1',
  device: 'Chrome / macOS',
  ip: '127.0.0.1',
  location: 'Bengaluru, KA, India',
  trusted: true,
  lastActive: 'Just now'
});
const userFromToken = getUserByToken(tokenA);
assert(userFromToken && userFromToken.id === userA.id, 'Session token resolves to User A');
console.log('✓ Session token registration and resolution works');

// 7. Activity Logging for User A
recordActivityEvent({
  userId: userA.id,
  action: 'REGISTRATION_SUCCESS',
  type: 'profile_updated',
  category: 'account_modification',
  title: 'Citizen Account Registered',
  description: 'Registered verified citizen profile.',
  locationTag: 'Bengaluru, KA, India',
  ipAddress: '127.0.0.1',
  deviceInfo: 'Chrome / macOS',
  status: 'success'
});
recordActivityEvent({
  userId: userA.id,
  action: 'LOGIN_SUCCESS',
  type: 'login',
  category: 'login_security',
  title: 'Citizen Signed In',
  description: 'Password authentication verified.',
  locationTag: 'Bengaluru, KA, India',
  ipAddress: '127.0.0.1',
  deviceInfo: 'Chrome / macOS',
  status: 'success'
});

// 8. User B creation and isolation test
const testUserBEmail = `test_citizen_b_${Date.now()}@example.org`;
const userB = {
  id: `usr-b-${Date.now()}`,
  name: 'Citizen Test B',
  email: testUserBEmail,
  passwordHash: '$2b$10$hashedpasswordB',
  phone: '+91 9876543211',
  city: 'Mysuru',
  ward: 'Central Ward',
  twoFactorEnabled: true,
  twoFactorMethod: 'sms',
  autoPurgeDays: 60,
  localEncryptionEnabled: false,
  createdAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
  sessions: [],
  auditLogs: []
};
saveUser(userB);

recordActivityEvent({
  userId: userB.id,
  action: 'TWO_FACTOR_ENABLED',
  type: '2fa_enabled',
  category: 'security_config',
  title: 'Two-Factor Authentication Activated',
  description: 'SMS 2FA security activated.',
  locationTag: 'Mysuru, KA, India',
  ipAddress: '127.0.0.2',
  deviceInfo: 'Firefox / Linux',
  status: 'success'
});

// Check log isolation between User A and User B
const logsA = getUserActivityLogs(userA.id);
const logsB = getUserActivityLogs(userB.id);

assert(logsA.every(log => log.userId === userA.id), 'User A logs must only contain User A');
assert(logsB.every(log => log.userId === userB.id), 'User B logs must only contain User B');
assert(!logsA.some(log => log.userId === userB.id), 'No cross-user leakage in logs for User A');
assert(!logsB.some(log => log.userId === userA.id), 'No cross-user leakage in logs for User B');
console.log('✓ Strict activity log isolation verified (no cross-user data leakage)');

// 9. Secret Sanitization in Activity Logs
const dirtyMetadata = {
  password: 'SuperSecretPassword123!',
  currentPassword: 'OldPassword456!',
  newPassword: 'BrandNewPassword789!',
  secret: 'JBSWY3DPEHPK3PXP',
  twoFactorSecret: 'JBSWY3DPEHPK3PXP',
  token: 'eyJhbGciOi...',
  sessionToken: 'tok-abc-123',
  apiKey: 'AIzaSySecretApiKey',
  code: '829104',
  recoveryKey: 'SEC-A1B2-C3D4-E5F6',
  publicField: 'safe_civic_value'
};
const cleaned = sanitizeLogMetadata(dirtyMetadata);
assert(cleaned.password === '[REDACTED]', 'password must be redacted');
assert(cleaned.newPassword === '[REDACTED]', 'newPassword must be redacted');
assert(cleaned.secret === '[REDACTED]', 'secret must be redacted');
assert(cleaned.token === '[REDACTED]', 'token must be redacted');
assert(cleaned.apiKey === '[REDACTED]', 'apiKey must be redacted');
assert(cleaned.recoveryKey === '[REDACTED]', 'recoveryKey must be redacted');
assert(cleaned.publicField === 'safe_civic_value', 'Safe metadata retained');
console.log('✓ Sensitive secrets strictly sanitized from activity logs');

// 10. Backup code single-use consumption simulation
const codeToUse = userA.backupCodes[0];
const remainingCodes = userA.backupCodes.filter(c => c !== codeToUse);
userA.backupCodes = remainingCodes;
saveUser(userA);

const userAfterBackupUse = getUserById(userA.id);
assert(userAfterBackupUse.backupCodes.length === 7, 'Used backup code was consumed');
assert(!userAfterBackupUse.backupCodes.includes(codeToUse), 'Used code no longer present');
console.log('✓ Single-use backup code consumption verified');

// 11. Session revocation
revokeSessionToken(tokenA);
assert(getUserByToken(tokenA) === undefined, 'Revoked session is invalid');
console.log('✓ Session revocation verified');

// 12. Cleanup test users using clearUserData
clearUserData(userA.id);
clearUserData(userB.id);
assert(getUserById(userA.id) === undefined, 'User A cleaned up');
assert(getUserById(userB.id) === undefined, 'User B cleaned up');
console.log('✓ Cleaned up test records');

console.log('\n========================================');
console.log('ALL 2FA AND ACTIVITY LOG TESTS PASSED!');
console.log('========================================');

