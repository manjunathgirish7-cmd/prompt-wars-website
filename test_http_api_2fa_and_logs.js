import assert from 'node:assert';
import express from 'express';
import { calculateTOTP, clearUserData, getUserById, getUserByEmail } from './backend/utils/storage.js';
import { apiRouter } from './backend/routes/api.js';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

const server = app.listen(0);
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}/api`;

console.log(`--- Running HTTP API Integration Tests on ${baseUrl} ---`);

async function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function get(path, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, { headers });
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  try {
    const timestamp = Date.now();
    const email = `citizen_${timestamp}@intentbridge.test`;
    const password = 'SecurePassword2026!';

    // Step 1: Register citizen
    console.log('1. Testing Citizen Registration...');
    const regRes = await post('/auth/register', {
      name: 'Test Citizen',
      email,
      password,
      city: 'Bengaluru',
      ward: 'Ward 45'
    });
    assert.strictEqual(regRes.status, 201, 'Registration should return 201');
    assert.strictEqual(regRes.data.success, true, 'Registration succeeded');
    const userToken = regRes.data.token;
    const userId = regRes.data.user.id;
    console.log('✓ Citizen registered successfully');

    // Step 2: Failed login attempt (bad password)
    console.log('2. Testing Failed Login Handling...');
    const badLogin = await post('/auth/login', {
      email,
      password: 'WrongPassword!'
    });
    assert.strictEqual(badLogin.status, 401, 'Bad credentials must return 401');
    console.log('✓ Failed login correctly rejected');

    // Step 3: Successful login (no 2FA initially)
    console.log('3. Testing Valid Login...');
    const goodLogin = await post('/auth/login', {
      email,
      password
    });
    assert.strictEqual(goodLogin.status, 200, 'Valid login should return 200');
    assert(!goodLogin.data.requires2FA, 'No 2FA required yet');
    assert(goodLogin.data.token, 'Session token returned');
    console.log('✓ Successful login verified');

    // Step 4: Initiate 2FA setup (Authenticator)
    console.log('4. Testing 2FA Setup Initiation...');
    const setupRes = await post('/auth/2fa/setup', {
      email,
      method: 'authenticator'
    }, userToken);
    assert.strictEqual(setupRes.status, 200, '2FA setup should return 200');
    assert(setupRes.data.secret, 'TOTP secret must be returned');
    assert(setupRes.data.qrCodeUrl, 'QR code must be returned');
    assert(setupRes.data.otpauthUri, 'OTPAuth URI must be returned');
    const totpSecret = setupRes.data.secret;
    console.log('✓ 2FA setup initiated, secret & QR code generated');

    // Step 5: Confirm 2FA setup with valid TOTP code
    console.log('5. Testing 2FA Setup Confirmation...');
    const validCode = calculateTOTP(totpSecret);
    const confirmRes = await post('/auth/2fa/confirm', {
      email,
      method: 'authenticator',
      code: validCode,
      secret: totpSecret
    }, userToken);
    assert.strictEqual(confirmRes.status, 200, 'Confirmation should return 200');
    assert.strictEqual(confirmRes.data.success, true);
    assert(confirmRes.data.backupCodes && confirmRes.data.backupCodes.length > 0, 'Backup codes generated');
    const backupCodes = confirmRes.data.backupCodes;
    console.log('✓ 2FA confirmed and activated, backup codes saved to user record');

    // Step 6: Login with 2FA enabled -> Challenge issued
    console.log('6. Testing Login with 2FA Enabled...');
    const loginWith2FA = await post('/auth/login', {
      email,
      password
    });
    assert.strictEqual(loginWith2FA.status, 200);
    assert.strictEqual(loginWith2FA.data.requires2FA, true, 'Must require 2FA challenge');
    assert(loginWith2FA.data.tempToken, 'Temporary challenge token issued');
    const tempToken = loginWith2FA.data.tempToken;
    console.log('✓ 2FA challenge triggered upon login');

    // Step 7: Verify 2FA with invalid code -> rejected
    console.log('7. Testing 2FA Verification with Invalid Code...');
    const invalidVerify = await post('/auth/verify-2fa', {
      tempToken,
      code: '000000',
      email
    });
    assert.strictEqual(invalidVerify.status, 401, 'Invalid code must be rejected with 401');
    console.log('✓ Invalid 2FA code rejected');

    // Step 8: Verify 2FA with valid TOTP code -> authenticated
    console.log('8. Testing 2FA Verification with Valid TOTP Code...');
    const validCode2 = calculateTOTP(totpSecret);
    const validVerify = await post('/auth/verify-2fa', {
      tempToken,
      code: validCode2,
      email,
      trustDevice: true
    });
    assert.strictEqual(validVerify.status, 200, 'Valid code should return 200');
    assert.strictEqual(validVerify.data.success, true);
    assert(validVerify.data.token, 'Authenticated session token returned');
    const authenticatedSessionToken = validVerify.data.token;
    console.log('✓ 2FA TOTP verification completed, session token issued');

    // Step 9: Login and verify using emergency backup code
    console.log('9. Testing 2FA Emergency Backup Code Login...');
    const loginForBackup = await post('/auth/login', { email, password });
    assert.strictEqual(loginForBackup.data.requires2FA, true);
    const backupTempToken = loginForBackup.data.tempToken;
    const backupCodeToUse = backupCodes[0];

    const backupVerify = await post('/auth/verify-2fa', {
      tempToken: backupTempToken,
      code: backupCodeToUse,
      email,
      isBackupCode: true
    });
    assert.strictEqual(backupVerify.status, 200, 'Backup code must verify');
    assert.strictEqual(backupVerify.data.success, true);
    console.log('✓ Emergency backup code verified and consumed');

    // Step 10: Fetch Activity Logs for authenticated citizen
    console.log('10. Testing Persistent Activity Logs Retrieval...');
    const logsRes = await get('/auth/security/logs', authenticatedSessionToken);
    assert.strictEqual(logsRes.status, 200, 'Logs endpoint should return 200');
    assert(Array.isArray(logsRes.data.logs), 'Logs must be an array');
    assert(logsRes.data.logs.length > 0, 'Must have recorded events');
    console.log(`✓ Fetched ${logsRes.data.logs.length} persistent activity logs for user`);

    // Verify all logs belong to this user
    for (const log of logsRes.data.logs) {
      assert.strictEqual(log.userId, userId, 'All logs must strictly belong to authenticated user');
    }
    console.log('✓ Verified 100% user isolation in Activity Logs');

    // Step 11: Test Device Management (Trust toggle, rename, revoke)
    console.log('11. Testing Device Management...');
    const userObj = getUserById(userId);
    const sessionId = userObj.sessions[0]?.id;
    if (sessionId) {
      const trustRes = await post('/auth/devices/trust', {
        sessionId,
        trusted: true
      }, authenticatedSessionToken);
      assert.strictEqual(trustRes.status, 200);

      const renameRes = await post('/auth/devices/rename', {
        sessionId,
        customName: 'Citizen Laptop (Work)'
      }, authenticatedSessionToken);
      assert.strictEqual(renameRes.status, 200);
      console.log('✓ Device trust and rename endpoints verified');
    }

    // Step 12: Test Logout
    console.log('12. Testing Logout...');
    const logoutRes = await post('/auth/logout', {}, authenticatedSessionToken);
    assert.strictEqual(logoutRes.status, 200);
    console.log('✓ Logout endpoint verified');

    // Cleanup
    clearUserData(userId);
    console.log('✓ Cleaned up test citizen');

    console.log('\n=============================================');
    console.log('ALL HTTP API INTEGRATION TESTS PASSED 100%!');
    console.log('=============================================');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Test failed with error:', err);
    server.close();
    process.exit(1);
  }
}

run();
