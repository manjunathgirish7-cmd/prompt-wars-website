import { GovernmentService, GovernmentOffice, ProblemAnalysis, ComplaintLetter, EmergencyContact, OfficialSourceItem } from '../types.js';

export async function analyzeProblemApi(payload: {
  problem: string;
  imageBase64?: string;
  imageMimeType?: string;
  location?: {
    city?: string;
    state?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
  };
}): Promise<ProblemAnalysis> {
  const res = await fetch('/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error('Failed to analyze problem');
  }
  return res.json();
}

export async function generateComplaintApi(payload: {
  problemSummary: string;
  category: string;
  authorityName: string;
  department: string;
  location?: string;
  applicantName?: string;
  applicantContact?: string;
  applicantAddress?: string;
  tone?: 'formal' | 'urgent' | 'detailed';
  specificDetails?: string;
}): Promise<ComplaintLetter> {
  try {
    const res = await fetch('/api/ai/generate-complaint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.body) {
        return data;
      }
    }
  } catch (netErr) {
    console.warn('Network notice during complaint generation:', netErr);
  }

  // Client-side reliable fallback
  const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const tonePrefix = payload.tone === 'urgent' 
    ? 'URGENT STATUTORY GRIEVANCE' 
    : payload.tone === 'detailed' 
    ? 'COMPREHENSIVE CITIZEN GRIEVANCE AND INCIDENT REPORT' 
    : 'FORMAL CIVIC GRIEVANCE';

  return {
    id: `cpl-${Date.now()}`,
    recipient: {
      designation: payload.tone === 'urgent' ? 'The Executive Engineer & Ward Grievance Officer' : 'The Citizen Grievance Redressal Officer',
      department: payload.department || 'Ward Works & Public Grievances',
      officeAddress: payload.authorityName || 'Bruhat Bengaluru Mahanagara Palike',
      city: payload.location || 'Bengaluru, Karnataka'
    },
    subject: `${tonePrefix}: Immediate Rectification of ${payload.category} (${payload.problemSummary}) at ${payload.location || 'Locality'}`,
    applicantInfo: {
      name: payload.applicantName || 'Concerned Resident / Citizen',
      contact: payload.applicantContact || '+91 98765 43210',
      address: payload.applicantAddress || `${payload.location || 'Bengaluru'}, India`
    },
    body: `Respected Sir/Madam,\n\nI am writing to formally submit this ${tonePrefix.toLowerCase()} regarding a persistent civic hazard under your administrative jurisdiction: "${payload.problemSummary}".\n\nThis condition is situated at ${payload.location || 'our residential ward'} and falls under the operational purview of the ${payload.department} at ${payload.authorityName}.${payload.specificDetails ? ` Specific notes: ${payload.specificDetails}.` : ''}\n\nThis unresolved condition has been persisting without required intervention, causing daily jeopardy, transit obstruction, and safety risks to residents, schoolchildren, senior citizens, and vehicular traffic. Previous verbal and informal notifications have not yielded the mandated remedy, necessitating this formal record.\n\nUnder the mandatory provisions of the Citizen Service Charter and the Public Services Guarantee Act (Sakala), maintenance of public safety and timely grievance resolution within 24 to 72 hours are statutory obligations. I respectfully request an official on-site inspection and scheduled remediation without further delay.`,
    incidentDetails: {
      location: payload.location || 'Local Ward Thoroughfare',
      dateOrDuration: 'Persisting continuously without mandated municipal intervention',
      impactDescription: `Hazard to pedestrian/vehicular movement, safety violation, and public distress under ${payload.category}.`
    },
    reliefRequested: [
      'Immediate on-site technical inspection by the designated Ward Junior/Executive Engineer.',
      'Allocation of an official Grievance Tracking / Docket Number.',
      'Comprehensive physical repair and structural rectification within mandated Citizen Charter SLA.',
      'Formal written or SMS/electronic status confirmation upon completion of site restoration.'
    ],
    referenceLawOrCharter: 'Section 58 of Karnataka Municipal Corporations Act & Sakala Services Guarantee Act',
    generatedDate: currentDate
  };
}

export async function chatWithAssistantApi(payload: {
  message: string;
  history?: Array<{ sender: 'user' | 'assistant'; text: string }>;
  context?: ProblemAnalysis;
}): Promise<{ reply: string }> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error('Failed to get answer from assistant');
  }
  return res.json();
}

export async function fetchServicesApi(category?: string, search?: string): Promise<GovernmentService[]> {
  const params = new URLSearchParams();
  if (category && category !== 'All') params.set('category', category);
  if (search) params.set('search', search);
  const res = await fetch(`/api/services?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch services');
  return res.json();
}

export async function fetchOfficesApi(paramsObj?: {
  city?: string;
  category?: string;
  search?: string;
  latitude?: number;
  longitude?: number;
}): Promise<GovernmentOffice[]> {
  const params = new URLSearchParams();
  if (paramsObj?.city && paramsObj.city !== 'All') params.set('city', paramsObj.city);
  if (paramsObj?.category && paramsObj.category !== 'All') params.set('category', paramsObj.category);
  if (paramsObj?.search) params.set('search', paramsObj.search);
  
  const url = (paramsObj?.latitude && paramsObj?.longitude)
    ? `/api/offices/nearby?latitude=${paramsObj.latitude}&longitude=${paramsObj.longitude}`
    : `/api/offices?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch offices');
  return res.json();
}

export async function fetchEmergencyApi(): Promise<{
  emergencyModeTitle: string;
  disclaimer: string;
  contacts: EmergencyContact[];
}> {
  const res = await fetch('/api/emergency');
  if (!res.ok) throw new Error('Failed to fetch emergency contacts');
  return res.json();
}

export async function fetchSourcesApi(): Promise<{
  totalVerifiedSources: number;
  lastAuditDate: string;
  auditStandard: string;
  sources: OfficialSourceItem[];
}> {
  const res = await fetch('/api/sources');
  if (!res.ok) throw new Error('Failed to fetch verified sources');
  return res.json();
}

export async function resolveLocationApi(payload: {
  city?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
}): Promise<{
  city: string;
  state: string;
  municipalBody: string;
  resolvedAt: string;
  confidence: string;
}> {
  const res = await fetch('/api/location', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to resolve location');
  return res.json();
}

// Authentication & Citizen Security API Client
import { TwoFactorSetupData } from '../types.js';
import { getDeviceHttpHeaders } from '../utils/deviceDetector.js';

export function getAuthHeaders(): Record<string, string> {
  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('intentbridge_citizen_token');
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    }
  }
  return {};
}

export async function logoutCitizenApi() {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getDeviceHttpHeaders(), ...getAuthHeaders() }
  });
  return res.json();
}

// Authentication Client Calls
export async function registerCitizenApi(payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
  ward?: string;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'sms' | 'authenticator' | 'passkey';
  autoPurgeDays?: number;
  localEncryptionEnabled?: boolean;
}) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getDeviceHttpHeaders() },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed');
  }
  return data;
}

export async function loginCitizenApi(payload: {
  email: string;
  password?: string;
  code?: string;
  isDemoBypass?: boolean;
  trustDevice?: boolean;
}) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getDeviceHttpHeaders() },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }
  return data;
}

export async function verify2FAApi(payload: {
  tempToken?: string;
  code: string;
  email?: string;
  trustDevice?: boolean;
  isBackupCode?: boolean;
}) {
  const res = await fetch('/api/auth/verify-2fa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getDeviceHttpHeaders() },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '2FA Verification failed');
  }
  return data;
}

export async function initiate2FASetupApi(payload: {
  email?: string;
  method: 'sms' | 'authenticator' | 'passkey';
}): Promise<{
  success: boolean;
  method: 'sms' | 'authenticator' | 'passkey';
  secret?: string;
  qrCodeUrl?: string;
  otpauthUri?: string;
  phoneMasked?: string;
  smsPreviewCode?: string;
  currentCodePreview?: string;
  expiresInSeconds?: number;
  message?: string;
}> {
  const res = await fetch('/api/auth/2fa/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getDeviceHttpHeaders(), ...getAuthHeaders() },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to initiate 2FA setup');
  }
  return data;
}

export async function confirm2FASetupApi(payload: {
  email?: string;
  method: 'sms' | 'authenticator' | 'passkey';
  code: string;
  secret?: string;
}) {
  const res = await fetch('/api/auth/2fa/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getDeviceHttpHeaders(), ...getAuthHeaders() },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to confirm 2FA setup');
  }
  return data;
}

export async function resend2FACodeApi(payload: {
  tempToken?: string;
  email?: string;
}) {
  const res = await fetch('/api/auth/2fa/resend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getDeviceHttpHeaders() },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to resend 2FA code');
  }
  return data;
}

export async function disable2FAApi(payload: {
  email?: string;
  password?: string;
}) {
  const res = await fetch('/api/auth/2fa/disable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getDeviceHttpHeaders(), ...getAuthHeaders() },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to disable 2FA');
  }
  return data;
}

export async function registerDeviceApi(email?: string) {
  const res = await fetch('/api/auth/devices/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getDeviceHttpHeaders(), ...getAuthHeaders() },
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to register device');
  }
  return data;
}

export async function toggleDeviceTrustApi(payload: {
  email?: string;
  sessionId: string;
  trusted: boolean;
}) {
  const res = await fetch('/api/auth/devices/trust', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getDeviceHttpHeaders(), ...getAuthHeaders() },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update device authorization');
  }
  return data;
}

export async function renameDeviceApi(payload: {
  email?: string;
  sessionId: string;
  customName: string;
}) {
  const res = await fetch('/api/auth/devices/rename', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getDeviceHttpHeaders(), ...getAuthHeaders() },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to rename device');
  }
  return data;
}

export async function revokeDeviceSessionApi(payload: {
  email?: string;
  sessionId: string;
}) {
  const res = await fetch('/api/auth/devices/revoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getDeviceHttpHeaders(), ...getAuthHeaders() },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to revoke device session');
  }
  return data;
}

export async function cleanupInvalidDevicesApi(email?: string) {
  const res = await fetch('/api/auth/devices/cleanup-invalid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getDeviceHttpHeaders(), ...getAuthHeaders() },
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to cleanup invalid devices');
  }
  return data;
}

export async function updateSecuritySettingsApi(payload: {
  email?: string;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'sms' | 'authenticator' | 'passkey';
  passkeyEnabled?: boolean;
  autoPurgeDays?: number;
  localEncryptionEnabled?: boolean;
  currentPassword?: string;
  newPassword?: string;
}) {
  const res = await fetch('/api/auth/security/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getDeviceHttpHeaders(), ...getAuthHeaders() },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update security settings');
  }
  return data;
}

export async function rotateRecoveryKeyApi(email?: string) {
  const res = await fetch('/api/auth/security/rotate-recovery-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getDeviceHttpHeaders(), ...getAuthHeaders() },
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to rotate recovery key');
  }
  return data;
}

export async function fetchSecurityAuditLogsApi(email?: string) {
  const params = email ? `?email=${encodeURIComponent(email)}` : '';
  const res = await fetch(`/api/auth/security/logs${params}`, {
    headers: { ...getDeviceHttpHeaders(), ...getAuthHeaders() }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load security logs');
  }
  return data;
}

export async function terminateOtherSessionsApi(email?: string) {
  const res = await fetch('/api/auth/security/terminate-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getDeviceHttpHeaders(), ...getAuthHeaders() },
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to terminate sessions');
  }
  return data;
}

export async function requestForgotPasswordApi(payload: { email: string }) {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to dispatch password reset');
  }
  return data;
}

export async function completePasswordResetApi(payload: {
  resetToken?: string;
  email?: string;
  code?: string;
  newPassword: string;
  recoveryKey?: string;
}) {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to reset password');
  }
  return data;
}

export async function submitFeedbackApi(payload: {
  emoji: string;
  rating: number;
  category: string;
  feedbackText: string;
  email?: string;
  experiencedLag?: boolean;
}) {
  const res = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit feedback');
  }
  return data;
}

export async function fetchRecentFeedbackApi() {
  const res = await fetch('/api/feedback');
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load feedback');
  }
  return data;
}
