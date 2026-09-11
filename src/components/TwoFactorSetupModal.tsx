import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  Smartphone, 
  QrCode, 
  Copy, 
  Check, 
  ArrowRight, 
  RefreshCw, 
  X, 
  AlertCircle, 
  Download, 
  Clock, 
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { initiate2FASetupApi, confirm2FASetupApi, resend2FACodeApi } from '../services/apiClient';
import { CitizenUser } from '../types';

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CitizenUser;
  onSuccess: (updatedUser: Partial<CitizenUser>, backupCodes?: string[]) => void;
  initialMethod?: 'authenticator' | 'sms';
}

export const TwoFactorSetupModal: React.FC<TwoFactorSetupModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
  initialMethod = 'authenticator'
}) => {
  const [method, setMethod] = useState<'authenticator' | 'sms'>(initialMethod);
  const [step, setStep] = useState<'configure' | 'verify' | 'backup_codes'>('configure');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authenticator state
  const [secret, setSecret] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [otpauthUri, setOtpauthUri] = useState<string>('');
  const [currentCodePreview, setCurrentCodePreview] = useState<string>('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  // SMS state
  const [phoneMasked, setPhoneMasked] = useState<string>('');
  const [smsPreviewCode, setSmsPreviewCode] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Verification input
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  // Countdown timer for 30-second TOTP cycle
  const [totpSecondsLeft, setTotpSecondsLeft] = useState(30 - (Math.floor(Date.now() / 1000) % 30));

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const remaining = 30 - (Math.floor(Date.now() / 1000) % 30);
      setTotpSecondsLeft(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Initiate setup when modal opens
  useEffect(() => {
    if (isOpen) {
      initiateSetup(method);
    } else {
      // Reset state on close
      setStep('configure');
      setVerificationCode('');
      setError(null);
      setBackupCodes([]);
    }
  }, [isOpen, method]);

  const initiateSetup = async (chosenMethod: 'authenticator' | 'sms') => {
    try {
      setLoading(true);
      setError(null);
      const res = await initiate2FASetupApi({
        email: currentUser.email,
        method: chosenMethod
      });

      if (res.success) {
        if (chosenMethod === 'authenticator') {
          setSecret(res.secret || '');
          setQrCodeUrl(res.qrCodeUrl || '');
          setOtpauthUri(res.otpauthUri || '');
          setCurrentCodePreview(res.currentCodePreview || '');
        } else {
          setPhoneMasked(res.phoneMasked || (currentUser.phone ? `•••• ${currentUser.phone.slice(-4)}` : '•••• 4321'));
          setSmsPreviewCode(res.smsPreviewCode || '');
          setResendCooldown(60);
        }
        setStep('verify');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize two-factor configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleResendSms = async () => {
    if (resendCooldown > 0) return;
    try {
      setLoading(true);
      const res = await resend2FACodeApi({ email: currentUser.email });
      if (res.success) {
        setSmsPreviewCode(res.smsPreviewCode || '');
        setResendCooldown(60);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim() || verificationCode.trim().length < 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await confirm2FASetupApi({
        email: currentUser.email,
        method,
        code: verificationCode.trim(),
        secret: method === 'authenticator' ? secret : undefined
      });

      if (res.success) {
        const codes = res.backupCodes || [];
        setBackupCodes(codes);
        setStep('backup_codes');
        onSuccess({
          twoFactorEnabled: true,
          twoFactorMethod: method
        }, codes);
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. The code entered was invalid.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBackupCodes = () => {
    if (!backupCodes.length) return;
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedBackupCodes(true);
    setTimeout(() => setCopiedBackupCodes(false), 2000);
  };

  const handleDownloadBackupCodes = () => {
    const content = `=====================================================
INTENTBRIDGE CIVIC PORTAL - EMERGENCY BACKUP CODES
Account: ${currentUser.email} (${currentUser.name})
Issued At: ${new Date().toISOString()}
=====================================================

Keep these single-use recovery codes in a secure vault.
Each code can be used once to bypass 2FA if you lose access to your device.

${backupCodes.map((c, i) => `[${i + 1}] ${c}`).join('\n')}

=====================================================
Civic Data Protection & Citizen Identity Authority
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IntentBridge_2FA_Backup_Codes_${currentUser.name.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 flex items-center justify-center shadow-inner shrink-0">
            {method === 'authenticator' ? <KeyRound className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Real Multi-Factor Authentication
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {step === 'backup_codes' ? 'Emergency Backup Codes' : 'Configure Two-Factor Authentication'}
            </h2>
          </div>
        </div>

        {/* Method Switcher (only when not on final step) */}
        {step !== 'backup_codes' && (
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setMethod('authenticator'); }}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                method === 'authenticator'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Google Authenticator (TOTP)</span>
            </button>
            <button
              type="button"
              onClick={() => { setMethod('sms'); }}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                method === 'sms'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>SMS Verification</span>
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1 & 2: CONFIGURE & VERIFY */}
        {step === 'verify' && (
          <form onSubmit={handleConfirmVerification} className="space-y-5">
            {method === 'authenticator' ? (
              <div className="space-y-4">
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Open <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong>, or <strong>Apple Passwords</strong> on your phone and scan the QR code below:
                </div>

                {/* QR Code Container */}
                <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-center gap-5">
                  {loading ? (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <RefreshCw className="w-7 h-7 text-teal-600 animate-spin" />
                    </div>
                  ) : qrCodeUrl ? (
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 shrink-0">
                      <img 
                        src={qrCodeUrl} 
                        alt="2FA QR Code" 
                        className="w-40 h-40 object-contain rounded-lg"
                      />
                    </div>
                  ) : null}

                  <div className="space-y-3 flex-1 text-center sm:text-left">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Can't scan QR code?</span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Use manual setup key:</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                      <code className="font-mono text-xs font-bold text-teal-800 dark:text-teal-300 break-all select-all">
                        {secret}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 transition-colors shrink-0"
                        title="Copy Secret Key"
                      >
                        {copiedSecret ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* SMS Verification Details */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-2">
                  <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200 text-xs font-bold">
                    <Smartphone className="w-4 h-4 text-teal-600" />
                    <span>SMS Authentication Channel</span>
                  </div>
                  <p className="text-xs text-teal-800 dark:text-teal-300">
                    A real 6-digit cryptographic verification code has been dispatched to <strong>{phoneMasked}</strong>.
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Didn't receive text?</span>
                  <button
                    type="button"
                    onClick={handleResendSms}
                    disabled={resendCooldown > 0 || loading}
                    className="font-bold text-teal-700 dark:text-teal-400 hover:underline disabled:opacity-50"
                  >
                    {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </div>
            )}

            {/* 6-Digit Code Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 text-center">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="w-full text-center tracking-[0.5em] font-mono text-2xl py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 font-black"
                autoFocus
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || verificationCode.trim().length !== 6}
                className="w-2/3 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Verify & Activate 2FA</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: EMERGENCY BACKUP CODES (SHOWN UPON ACTIVATION) */}
        {step === 'backup_codes' && (
          <div className="space-y-5 animate-fade-in">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Two-Factor Authentication Activated!
              </h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Your account is now guarded by real multi-factor cryptographic security.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    Save Your Emergency Backup Codes
                  </h4>
                  <p className="text-[11px] text-slate-500">Each code can be used once if your mobile phone is unavailable.</p>
                </div>
              </div>

              {/* 2-Column Grid of 8 Backup Codes */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {backupCodes.map((code, idx) => (
                  <div 
                    key={idx} 
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center font-mono text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wider shadow-xs"
                  >
                    {code}
                  </div>
                ))}
              </div>

              {/* Copy & Download Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyBackupCodes}
                  className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedBackupCodes ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBackupCodes ? 'Copied to Clipboard' : 'Copy All Codes'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadBackupCodes}
                  className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download .txt Vault</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-900 dark:bg-teal-600 hover:bg-teal-700 dark:hover:bg-teal-500 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>I Have Safely Stored My Backup Codes</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
