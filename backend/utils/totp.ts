import crypto from 'crypto';
import QRCode from 'qrcode';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decodes a standard RFC 4648 Base32 string into a Buffer
 */
export function base32Decode(base32Str: string): Buffer {
  const clean = base32Str.toUpperCase().replace(/=+$/, '').replace(/[\s-]/g, '');
  let bits = 0;
  let value = 0;
  let index = 0;
  const output = Buffer.alloc(Math.ceil((clean.length * 5) / 8));

  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]);
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }

  return output.subarray(0, index);
}

/**
 * Generates a cryptographically strong Base32 secret key for TOTP
 */
export function generateBase32Secret(byteLength: number = 20): string {
  const randomBytes = crypto.randomBytes(byteLength);
  let result = '';
  let bits = 0;
  let value = 0;

  for (let i = 0; i < randomBytes.length; i++) {
    value = (value << 8) | randomBytes[i];
    bits += 8;
    while (bits >= 5) {
      result += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return result;
}

/**
 * Calculates RFC 6238 TOTP for a given secret at a specific epoch time
 */
export function calculateTOTP(secret: string, epochSeconds: number = Math.floor(Date.now() / 1000), step: number = 30): string {
  const counter = Math.floor(epochSeconds / step);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter));

  const key = base32Decode(secret);
  const hmac = crypto.createHmac('sha1', key).update(buf).digest();

  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verifies a candidate TOTP token against a secret with window allowance for clock drift
 */
export function verifyTOTP(token: string, secret: string, windowSteps: number = 1, step: number = 30): boolean {
  if (!token || !secret) return false;
  const cleanToken = token.trim().replace(/\D/g, '');
  if (cleanToken.length !== 6) return false;

  const currentEpoch = Math.floor(Date.now() / 1000);

  for (let offset = -windowSteps; offset <= windowSteps; offset++) {
    const epoch = currentEpoch + offset * step;
    const expected = calculateTOTP(secret, epoch, step);
    if (expected === cleanToken) {
      return true;
    }
  }

  return false;
}

/**
 * Generates standard OTPAuth URL for Google Authenticator / Authy / Apple Passwords
 */
export function generateOtpAuthUri(email: string, secret: string, issuer: string = 'IntentBridge Civic AI'): string {
  const label = encodeURIComponent(`IntentBridge:${email}`);
  const encIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generates a high-contrast QR code Data URL for mobile authenticator scanning
 */
export async function generateQrCodeDataUrl(otpauthUri: string): Promise<string> {
  return await QRCode.toDataURL(otpauthUri, {
    width: 280,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'M'
  });
}

/**
 * Generates an array of single-use emergency backup recovery codes
 */
export function generateEmergencyBackupCodes(count: number = 8): string[] {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const seg1 = Array.from({ length: 4 }, () => chars[crypto.randomInt(0, chars.length)]).join('');
    const seg2 = Array.from({ length: 4 }, () => chars[crypto.randomInt(0, chars.length)]).join('');
    codes.push(`${seg1}-${seg2}`);
  }

  return codes;
}

/**
 * Generates a random 6-digit numeric OTP for SMS/Phone verification
 */
export function generateSmsOtpCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}
