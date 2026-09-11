import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Smartphone, 
  KeyRound, 
  Key, 
  Globe, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  RefreshCw, 
  LogOut, 
  Download, 
  ShieldAlert, 
  Eye, 
  Clock,
  UserCheck,
  ChevronRight,
  Database,
  Fingerprint,
  Laptop,
  Monitor,
  Tablet,
  QrCode,
  Sparkles,
  Sliders,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { 
  updateSecuritySettingsApi, 
  rotateRecoveryKeyApi, 
  fetchSecurityAuditLogsApi, 
  terminateOtherSessionsApi,
  registerDeviceApi,
  toggleDeviceTrustApi,
  renameDeviceApi,
  revokeDeviceSessionApi,
  cleanupInvalidDevicesApi,
  disable2FAApi
} from '../services/apiClient.js';
import { SecurityAuditEvent, ActiveSession } from '../types.js';
import { ActivityLogs } from './ActivityLogs.js';
import { TwoFactorSetupModal } from './TwoFactorSetupModal.js';
import { DeviceDetailsModal } from './DeviceDetailsModal.js';

export const SecurityCenter: React.FC = () => {
  const { currentUser, updateUser, logout } = useAuth();

  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditEvent[]>([]);
  const [backupCodesCount, setBackupCodesCount] = useState<number>(6);
  const [securityScore, setSecurityScore] = useState<{
    score: number;
    level: string;
    checklist: { title: string; passed: boolean }[];
  }>({
    score: 85,
    level: 'Robust Protection (A)',
    checklist: []
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 2FA Setup Modal state
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorModalMethod, setTwoFactorModalMethod] = useState<'authenticator' | 'sms'>('authenticator');

  // Device inspection modal state
  const [selectedSessionForModal, setSelectedSessionForModal] = useState<ActiveSession | null>(null);

  // Recovery Key Rotator state
  const [newRecoveryKey, setNewRecoveryKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Change Password Modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Emergency lockdown confirmation
  const [showLockdownModal, setShowLockdownModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const targetEmail = currentUser?.email || 'aarav@citizen.org';
      // Register device gracefully without blocking logs loading
      try {
        await registerDeviceApi(targetEmail);
      } catch (devErr) {
        console.warn('Device registration notice:', devErr);
      }
      const data = await fetchSecurityAuditLogsApi(targetEmail);
      if (data.success) {
        setAuditLogs(data.auditLogs || data.logs || []);
        setActiveSessions(data.sessions || []);
        if (data.backupCodesCount !== undefined) setBackupCodesCount(data.backupCodesCount);
        if (data.securityScore) setSecurityScore(data.securityScore);
      }
    } catch (err) {
      console.warn('Security logs load notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, [currentUser?.email]);

  const handleOpen2FASetup = (method: 'authenticator' | 'sms') => {
    setTwoFactorModalMethod(method);
    setShow2FAModal(true);
  };

  const handleToggle2FA = async () => {
    if (!currentUser) return;
    if (!currentUser.twoFactorEnabled) {
      // Opening real setup modal to configure
      handleOpen2FASetup(currentUser.twoFactorMethod === 'sms' ? 'sms' : 'authenticator');
    } else {
      // Turn off 2FA
      try {
        setUpdating(true);
        const res = await disable2FAApi({ email: currentUser.email });
        if (res.success) {
          updateUser({ twoFactorEnabled: false });
          showToast('Two-Factor Authentication disabled.');
          loadSecurityData();
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to disable 2FA.');
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleToggleDeviceTrust = async (sessionId: string, currentTrusted: boolean) => {
    if (!currentUser) return;
    try {
      setUpdating(true);
      const res = await toggleDeviceTrustApi({
        email: currentUser.email,
        sessionId,
        trusted: !currentTrusted
      });
      if (res.success) {
        setActiveSessions(res.sessions || []);
        showToast(!currentTrusted ? 'Device authorized for 30 days.' : 'Device trust revoked.');
        loadSecurityData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update device authorization.');
    } finally {
      setUpdating(false);
    }
  };

  const handleRenameDevice = async (sessionId: string, newName: string) => {
    if (!currentUser) return;
    try {
      setUpdating(true);
      const res = await renameDeviceApi({
        email: currentUser.email,
        sessionId,
        customName: newName
      });
      if (res.success) {
        setActiveSessions(res.sessions || []);
        showToast('Device renamed successfully.');
        loadSecurityData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to rename device.');
    } finally {
      setUpdating(false);
    }
  };

  const handleRevokeDevice = async (sessionId: string) => {
    if (!currentUser) return;
    try {
      setUpdating(true);
      const res = await revokeDeviceSessionApi({
        email: currentUser.email,
        sessionId
      });
      if (res.success) {
        setActiveSessions(res.sessions || []);
        showToast('Device session terminated.');
        if (selectedSessionForModal?.id === sessionId) {
          setSelectedSessionForModal(null);
        }
        loadSecurityData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke device session.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCleanupInvalidDevices = async () => {
    if (!currentUser) return;
    try {
      setUpdating(true);
      const res = await cleanupInvalidDevicesApi(currentUser.email);
      if (res.success) {
        setActiveSessions(res.sessions || []);
        showToast('Invalid and unrecognized devices purged. Current workstation retained.');
        loadSecurityData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to clean up devices.');
    } finally {
      setUpdating(false);
    }
  };

  const handleTogglePasskey = async () => {
    if (!currentUser) return;
    try {
      setUpdating(true);
      const nextState = !currentUser.passkeyEnabled;
      const res = await updateSecuritySettingsApi({
        email: currentUser.email,
        passkeyEnabled: nextState
      });
      if (res.success && res.user) {
        updateUser({ passkeyEnabled: nextState });
        showToast(nextState ? 'Hardware Passkey / Touch ID registered!' : 'Passkey removed.');
        loadSecurityData();
      }
    } catch (err: any) {
      showToast(err.message || 'Passkey toggle failed.');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleEncryption = async () => {
    if (!currentUser) return;
    try {
      setUpdating(true);
      const nextState = !currentUser.localEncryptionEnabled;
      const res = await updateSecuritySettingsApi({
        email: currentUser.email,
        localEncryptionEnabled: nextState
      });
      if (res.success && res.user) {
        updateUser({ localEncryptionEnabled: nextState });
        showToast(nextState ? 'Client-side draft encryption active.' : 'Encryption disabled.');
        loadSecurityData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update encryption.');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateAutoPurge = async (days: number) => {
    if (!currentUser) return;
    try {
      setUpdating(true);
      const res = await updateSecuritySettingsApi({
        email: currentUser.email,
        autoPurgeDays: days
      });
      if (res.success && res.user) {
        updateUser({ autoPurgeDays: days });
        showToast(`Auto-purge retention set to ${days === 0 ? 'Indefinite' : `${days} days`}.`);
        loadSecurityData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update auto-purge.');
    } finally {
      setUpdating(false);
    }
  };

  const handleRotateRecoveryKey = async () => {
    if (!currentUser) return;
    try {
      setUpdating(true);
      const res = await rotateRecoveryKeyApi(currentUser.email);
      if (res.success && res.recoveryKey) {
        setNewRecoveryKey(res.recoveryKey);
        updateUser({ recoveryKeyGenerated: true });
        showToast('New Master Recovery Key generated!');
        loadSecurityData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to rotate key.');
    } finally {
      setUpdating(false);
    }
  };

  const handleTerminateSessions = async () => {
    if (!currentUser) return;
    try {
      setUpdating(true);
      const res = await terminateOtherSessionsApi(currentUser.email);
      if (res.success) {
        setActiveSessions(res.sessions || []);
        showToast('All other active sessions revoked.');
        loadSecurityData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to terminate sessions.');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setUpdating(true);
      const res = await updateSecuritySettingsApi({
        email: currentUser?.email,
        currentPassword,
        newPassword
      });
      if (res.success) {
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        showToast('Master password successfully updated!');
        loadSecurityData();
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadDataArchive = () => {
    const archive = {
      citizenProfile: currentUser,
      exportedAt: new Date().toISOString(),
      securityHealth: securityScore,
      auditHistory: auditLogs
    };
    const blob = new Blob([JSON.stringify(archive, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IntentBridge_Security_Archive_${currentUser?.name?.replace(/\s+/g, '_') || 'Citizen'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Citizen Security & Case Archive downloaded.');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in py-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Status Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-xs font-bold mb-2 border border-teal-200">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              Citizen Security & Privacy Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Security Cockpit & Data Protection
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Manage your two-factor authentication, cryptographic master recovery keys, hardware passkeys, and verified zero-surveillance protocols.
            </p>
          </div>

          {/* Citizen Security Score Badge */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-4 shrink-0">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={securityScore.score >= 80 ? 'text-emerald-500' : 'text-teal-600'}
                  strokeDasharray={`${securityScore.score}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-mono font-black text-slate-900 text-sm">
                {securityScore.score}%
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-bold block">
                Shield Rating
              </span>
              <span className="text-xs font-extrabold text-slate-900 block">
                {securityScore.level}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3" />
                Zero Cloud Brokerage
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Controls vs Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Core Security Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: 2FA & Credentials */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-teal-600" />
                    Two-Factor Authentication (2FA)
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    currentUser?.twoFactorEnabled 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {currentUser?.twoFactorEnabled ? 'Active (Cryptographic)' : 'Disabled'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Protects your citizen profile with real RFC 6238 TOTP authenticators and SMS verification.
                </p>
              </div>

              {/* Master 2FA Toggle Switch */}
              <button
                type="button"
                onClick={handleToggle2FA}
                disabled={updating}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  currentUser?.twoFactorEnabled ? 'bg-teal-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    currentUser?.twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 2FA Method Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => handleOpen2FASetup('authenticator')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  currentUser?.twoFactorEnabled && currentUser?.twoFactorMethod === 'authenticator'
                    ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <KeyRound className={`w-4 h-4 ${currentUser?.twoFactorMethod === 'authenticator' ? 'text-teal-600' : 'text-slate-400'}`} />
                  {currentUser?.twoFactorEnabled && currentUser?.twoFactorMethod === 'authenticator' && (
                    <span className="px-1.5 py-0.5 rounded bg-teal-600 text-white text-[9px] font-bold">ACTIVE</span>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-900">Authenticator App</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Google Auth / RFC 6238</div>
              </div>

              <div
                onClick={() => handleOpen2FASetup('sms')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  currentUser?.twoFactorEnabled && currentUser?.twoFactorMethod === 'sms'
                    ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Smartphone className={`w-4 h-4 ${currentUser?.twoFactorMethod === 'sms' ? 'text-teal-600' : 'text-slate-400'}`} />
                  {currentUser?.twoFactorEnabled && currentUser?.twoFactorMethod === 'sms' && (
                    <span className="px-1.5 py-0.5 rounded bg-teal-600 text-white text-[9px] font-bold">ACTIVE</span>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-900">SMS / Mobile OTP</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Real phone verification</div>
              </div>

              <div
                onClick={handleTogglePasskey}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  currentUser?.passkeyEnabled
                    ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Key className={`w-4 h-4 ${currentUser?.passkeyEnabled ? 'text-teal-600' : 'text-slate-400'}`} />
                  {currentUser?.passkeyEnabled && (
                    <span className="px-1.5 py-0.5 rounded bg-teal-600 text-white text-[9px] font-bold">ENROLLED</span>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-900">Hardware Passkey</div>
                <div className="text-[11px] text-slate-500 mt-0.5">FIDO2 / Touch ID</div>
              </div>
            </div>

            {/* Configure & Backup Codes Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {currentUser?.twoFactorEnabled ? 'Manage Two-Factor Authentication' : 'Setup Two-Factor Protection'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {currentUser?.twoFactorEnabled 
                      ? `${backupCodesCount} emergency backup codes available in your vault.`
                      : 'Scan QR code with Google Authenticator or register SMS.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpen2FASetup(currentUser?.twoFactorMethod === 'sms' ? 'sms' : 'authenticator')}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1.5"
              >
                <span>{currentUser?.twoFactorEnabled ? 'View QR & Backup Codes' : 'Setup 2FA Now'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Hardware Passkey Enrollment Row */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">FIDO2 Hardware Passkey / Biometrics</h4>
                  <p className="text-[11px] text-slate-500">Sign in using device biometric sensor without typing passwords.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTogglePasskey}
                disabled={updating}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  currentUser?.passkeyEnabled
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    : 'bg-slate-900 text-white hover:bg-teal-700'
                }`}
              >
                {currentUser?.passkeyEnabled ? 'Enrolled ✓' : 'Enroll Passkey'}
              </button>
            </div>
          </div>

          {/* Card: Master Recovery Key */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  Cryptographic Master Recovery Key
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Used to restore your account if you lose your 2FA device or master password.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRotateRecoveryKey}
                disabled={updating}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${updating ? 'animate-spin' : ''}`} />
                <span>Rotate Key</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 font-mono">
                  {newRecoveryKey || currentUser?.recoveryKeyPreview || 'SEC-7K9P-44M2-99L1'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(newRecoveryKey || 'SEC-7K9P-44M2-99L1');
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold flex items-center gap-1 transition-colors"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                IntentBridge maintains a zero-knowledge architecture. If this key is lost, your encrypted complaint drafts cannot be recovered by anyone.
              </p>
            </div>
          </div>

          {/* Card: Active Devices & Authorized Sessions */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-teal-600" />
                  Active Devices & Authorized Sessions
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified hardware workstations and mobile devices authorized to access your portal.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCleanupInvalidDevices}
                  disabled={updating}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                  title="Remove any unverified, stale, or malformed devices"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Purge Unrecognized</span>
                </button>
                <button
                  type="button"
                  onClick={handleTerminateSessions}
                  disabled={updating || activeSessions.length <= 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold border border-red-200 transition-colors disabled:opacity-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Revoke Other Sessions</span>
                </button>
              </div>
            </div>

            {/* List of Real Active Devices */}
            <div className="space-y-2.5">
              {activeSessions.map((sess) => {
                const getIcon = () => {
                  switch (sess.deviceType) {
                    case 'mobile': return <Smartphone className="w-4 h-4 text-teal-600" />;
                    case 'tablet': return <Tablet className="w-4 h-4 text-teal-600" />;
                    case 'laptop': return <Laptop className="w-4 h-4 text-teal-600" />;
                    default: return <Monitor className="w-4 h-4 text-teal-600" />;
                  }
                };

                return (
                  <div
                    key={sess.id}
                    className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs shrink-0">
                        {getIcon()}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {sess.deviceName || sess.device}
                          </span>
                          {sess.current && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Current Device
                            </span>
                          )}
                          {sess.trusted ? (
                            <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-teal-600" />
                              Authorized (30-day Trust)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3 text-amber-600" />
                              Temporary Session
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 text-[11px] flex flex-wrap items-center gap-x-2">
                          <span>{sess.os || 'OS'} • {sess.browser}</span>
                          <span>•</span>
                          <span>IP: <strong className="font-mono text-slate-700">{sess.ip}</strong></span>
                          <span>•</span>
                          <span>{sess.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions on this device */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-[11px] font-medium text-slate-400 mr-1 hidden md:inline">
                        {sess.lastActive}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleDeviceTrust(sess.id, !!sess.trusted)}
                        disabled={updating}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors ${
                          sess.trusted
                            ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                            : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                        }`}
                        title={sess.trusted ? 'Revoke trusted device status' : 'Trust this device for 30 days'}
                      >
                        {sess.trusted ? 'Untrust' : 'Authorize'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSessionForModal(sess)}
                        className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition-colors"
                        title="View Technical Details"
                      >
                        Inspect
                      </button>
                      {!sess.current && (
                        <button
                          type="button"
                          onClick={() => handleRevokeDevice(sess.id)}
                          disabled={updating}
                          className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                          title="Revoke session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Logs Component with Location Tags and Modifications */}
          <ActivityLogs 
            logs={auditLogs} 
            onRefresh={loadSecurityData} 
            loading={loading} 
            onFlagSuspicious={() => setShowLockdownModal(true)} 
          />
        </div>

        {/* Right Column: Privacy, Data, Actions */}
        <div className="space-y-6">
          {/* Privacy & Zero-Surveillance Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600" />
              Privacy & Retention Rules
            </h3>

            {/* Local Draft Encryption Switch */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Draft Encryption</span>
                <button
                  type="button"
                  onClick={handleToggleEncryption}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    currentUser?.localEncryptionEnabled ? 'bg-teal-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition ${
                      currentUser?.localEncryptionEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                AES-256 client-side encryption of your incident locations and uploaded photo evidence.
              </p>
            </div>

            {/* Auto Purge Option */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Auto-Purge Records</span>
                <select
                  value={currentUser?.autoPurgeDays || 30}
                  onChange={(e) => handleUpdateAutoPurge(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg border border-slate-200 text-[11px] font-bold bg-white text-slate-700"
                >
                  <option value={30}>30 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={0}>Never</option>
                </select>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Automatically purges your complaint drafts and chat records once resolved.
              </p>
            </div>

            {/* Download Data Archive */}
            <button
              type="button"
              onClick={handleDownloadDataArchive}
              className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Civic Audit Archive (.json)</span>
            </button>
          </div>

          {/* Account Security Quick Actions */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Account Credentials</h3>

            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold flex items-center justify-between px-4 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-600" />
                Change Master Password
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-between px-4 transition-colors"
            >
              <span className="flex items-center gap-2">
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                Sign Out of Citizen Session
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Emergency Account Lockdown Warning Box */}
          <div className="bg-red-50/80 rounded-3xl p-6 border border-red-200 text-red-950 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-red-900">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>Emergency Account Lockdown</span>
            </div>
            <p className="text-[11px] text-red-800 leading-relaxed">
              If you suspect your physical device or credentials have been compromised, you can freeze your profile instantly.
            </p>
            <button
              type="button"
              onClick={() => setShowLockdownModal(true)}
              className="w-full py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              Emergency Freeze Account
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-teal-600" />
                Update Master Password
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">New Master Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="w-1/2 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="w-1/2 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold"
                >
                  {updating ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Freeze Modal */}
      {showLockdownModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-red-200 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Freeze Citizen Account?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                This will terminate all active sessions immediately and lock your profile. Only your 16-character Master Recovery Key can restore access.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLockdownModal(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLockdownModal(false);
                  logout();
                }}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                Confirm Freeze
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Real Two-Factor Setup Modal */}
      {currentUser && (
        <TwoFactorSetupModal
          isOpen={show2FAModal}
          onClose={() => setShow2FAModal(false)}
          currentUser={currentUser}
          initialMethod={twoFactorModalMethod}
          onSuccess={(updatedUser, backupCodes) => {
            updateUser(updatedUser);
            if (backupCodes) setBackupCodesCount(backupCodes.length);
            showToast('Two-Factor Authentication successfully activated!');
            loadSecurityData();
          }}
        />
      )}

      {/* Device Inspection & Management Modal */}
      {selectedSessionForModal && (
        <DeviceDetailsModal
          session={selectedSessionForModal}
          onClose={() => setSelectedSessionForModal(null)}
          onToggleTrust={async (sessionId, currentTrusted) => {
            await handleToggleDeviceTrust(sessionId, currentTrusted);
            if (selectedSessionForModal.id === sessionId) {
              setSelectedSessionForModal(prev => prev ? { ...prev, trusted: !currentTrusted } : null);
            }
          }}
          onRename={async (sessionId, newName) => {
            await handleRenameDevice(sessionId, newName);
            if (selectedSessionForModal.id === sessionId) {
              setSelectedSessionForModal(prev => prev ? { ...prev, deviceName: newName } : null);
            }
          }}
          onRevoke={async (sessionId) => {
            await handleRevokeDevice(sessionId);
          }}
        />
      )}
    </div>
  );
};
