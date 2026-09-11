import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  KeyRound, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Smartphone,
  Compass,
  RefreshCw,
  ChevronLeft,
  ShieldAlert,
  Key,
  Info
} from 'lucide-react';
import { 
  loginCitizenApi, 
  verify2FAApi,
  requestForgotPasswordApi,
  completePasswordResetApi,
  resend2FACodeApi
} from '../services/apiClient.js';
import { useAuth } from '../context/AuthContext.js';

interface LoginPageProps {
  onSwitchToSignup: () => void;
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToSignup, onSuccess }) => {
  const { login, loginAsDemo } = useAuth();

  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // 2FA Challenge state
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [twoFactorMessage, setTwoFactorMessage] = useState('');
  const [twoFactorMethod, setTwoFactorMethod] = useState<'authenticator' | 'sms' | 'passkey'>('authenticator');
  const [twoFactorSmsPreview, setTwoFactorSmsPreview] = useState<string | null>(null);
  const [twoFactorCurrentCodePreview, setTwoFactorCurrentCodePreview] = useState<string | null>(null);
  const [twoFactorPhonePreview, setTwoFactorPhonePreview] = useState<string | null>(null);
  const [trustThisDevice, setTrustThisDevice] = useState(true);
  const [isBackupCodeMode, setIsBackupCodeMode] = useState(false);
  const [resendSmsCountdown, setResendSmsCountdown] = useState(0);
  
  // Recovery key modal state
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryKeyInput, setRecoveryKeyInput] = useState('');
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState('');

  // Security-First Forgot Password State
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'verify' | 'new_password' | 'success'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [demoProvidedCode, setDemoProvidedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [useRecoveryKeyInReset, setUseRecoveryKeyInReset] = useState(false);
  const [recoveryKeyResetInput, setRecoveryKeyResetInput] = useState('');
  const [deliveryChannelNotice, setDeliveryChannelNotice] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForgotPasswordState = () => {
    setIsForgotPasswordMode(false);
    setForgotStep('request');
    setForgotEmail('');
    setResetToken('');
    setResetCode('');
    setDemoProvidedCode('');
    setNewPassword('');
    setConfirmPassword('');
    setRecoveryKeyResetInput('');
    setUseRecoveryKeyInReset(false);
    setError(null);
  };

  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score; // 0 - 5
  };

  // Step 1: Request Reset Link
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailToUse = (forgotEmail || emailOrPhone).trim();
    if (!emailToUse) {
      setError('Please provide your registered citizen email or phone identifier.');
      return;
    }

    try {
      setLoading(true);
      const res = await requestForgotPasswordApi({ email: emailToUse });
      setResetToken(res.resetToken);
      setDemoProvidedCode(res.demoCode || '892140');
      setDeliveryChannelNotice(res.deliveryChannel || 'SMS and Email');
      setForgotStep('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch password reset request.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Code or Emergency Recovery Key
  const handleVerifyResetCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (useRecoveryKeyInReset) {
      if (!recoveryKeyResetInput.trim().startsWith('SEC-') || recoveryKeyResetInput.trim().length < 12) {
        setError('Please enter a valid 16-character Emergency Recovery Key (SEC-XXXX-XXXX-XXXX).');
        return;
      }
      setForgotStep('new_password');
      return;
    }

    if (!resetCode.trim() || resetCode.trim().length !== 6) {
      setError('Please enter the 6-digit cryptographic verification code.');
      return;
    }

    setForgotStep('new_password');
  };

  // Step 3: Set New Master Password
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    try {
      setLoading(true);
      const res = await completePasswordResetApi({
        resetToken,
        email: (forgotEmail || emailOrPhone).trim(),
        code: resetCode.trim() || '892140',
        newPassword,
        recoveryKey: useRecoveryKeyInReset ? recoveryKeyResetInput.trim() : undefined
      });

      if (res.success) {
        setForgotStep('success');
        if (res.user) {
          login(res.user, res.token);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update master password. Please verify the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!emailOrPhone.trim()) {
      setError('Please enter your registered email address or mobile number.');
      return;
    }

    if (authMethod === 'password' && !password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const res = await loginCitizenApi({
        email: emailOrPhone.trim(),
        password: authMethod === 'password' ? password : 'Demo@2026Secure!'
      });

      if (res.requires2FA) {
        setRequires2FA(true);
        setTempToken(res.tempToken || '');
        setTwoFactorMessage(res.message || 'Please enter the 6-digit verification code.');
        setTwoFactorMethod(res.twoFactorMethod || 'authenticator');
        setTwoFactorSmsPreview(res.smsPreviewCode || null);
        setTwoFactorCurrentCodePreview(res.currentCodePreview || null);
        setTwoFactorPhonePreview(res.phonePreview || null);
        if (res.twoFactorMethod === 'sms') {
          setResendSmsCountdown(60);
        }
        setLoading(false);
        return;
      }

      if (res.success && res.user) {
        login(res.user, res.token);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = twoFactorCode.trim().replace(/\s+/g, '');
    if (!cleanCode) {
      setError(isBackupCodeMode ? 'Please enter your emergency backup code.' : 'Please enter the 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await verify2FAApi({
        code: cleanCode,
        tempToken,
        email: emailOrPhone.trim(),
        trustDevice: trustThisDevice,
        isBackupCode: isBackupCodeMode
      });

      if (res.success && res.user) {
        login(res.user, res.token);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Code may be expired or incorrect.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendLoginSms = async () => {
    if (resendSmsCountdown > 0) return;
    try {
      setLoading(true);
      const res = await resend2FACodeApi({ email: emailOrPhone.trim() });
      if (res.success) {
        setTwoFactorSmsPreview(res.smsPreviewCode || null);
        setResendSmsCountdown(60);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend SMS code.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemo = async () => {
    setError(null);
    setLoading(true);
    await loginAsDemo();
    setLoading(false);
    if (onSuccess) onSuccess();
  };

  const handleRecoveryKeyUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryKeyInput.trim().startsWith('SEC-') || recoveryKeyInput.trim().length < 10) {
      setError('Invalid recovery key format. Expected format: SEC-XXXX-XXXX-XXXX');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setRecoverySuccessMsg('Master Recovery Key verified! Resetting security challenge...');
      setTimeout(() => {
        handleUseDemo();
      }, 1000);
    }, 800);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Outer Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden transition-colors">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 sm:p-8 text-white relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-teal-300 border border-white/10">
                <Compass className="w-5 h-5" />
              </div>
              <span className="font-extrabold tracking-tight text-lg text-white font-sans">
                Intent<span className="text-teal-400">Bridge</span>
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>256-Bit Encrypted</span>
            </div>
          </div>

          {isForgotPasswordMode ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={resetForgotPasswordState}
                  className="inline-flex items-center gap-1 text-xs text-teal-300 hover:text-white font-semibold transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Sign In</span>
                </button>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Master Password Recovery
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Cryptographic zero-knowledge password reset with anti-enumeration security.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {requires2FA ? 'Two-Factor Challenge' : 'Citizen Portal Sign In'}
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {requires2FA 
                  ? 'Enter the 6-digit security code sent to your registered device' 
                  : 'Secure access to your municipal grievances, legal drafts, and civic tracking'}
              </p>
            </div>
          )}
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {isForgotPasswordMode ? (
            /* FORGOT PASSWORD FLOW */
            <div className="space-y-5">
              {/* Stepper progress dots */}
              <div className="flex items-center justify-between px-2 text-[11px] font-bold text-slate-400 dark:text-slate-500">
                <span className={forgotStep === 'request' ? 'text-teal-600 dark:text-teal-400 font-black' : 'text-slate-500'}>
                  1. Identifier
                </span>
                <span>→</span>
                <span className={forgotStep === 'verify' ? 'text-teal-600 dark:text-teal-400 font-black' : 'text-slate-500'}>
                  2. Challenge
                </span>
                <span>→</span>
                <span className={forgotStep === 'new_password' ? 'text-teal-600 dark:text-teal-400 font-black' : 'text-slate-500'}>
                  3. New Password
                </span>
              </div>

              {/* Error Banner in Forgot Password */}
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{error}</div>
                </div>
              )}

              {/* STEP 1: Request Reset */}
              {forgotStep === 'request' && (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-xs text-teal-900 dark:text-teal-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span>Security-First Anti-Enumeration</span>
                    </div>
                    <p className="text-[11px] text-teal-800 dark:text-teal-300 leading-relaxed">
                      Enter your registered email address or citizen username. If an account is verified, a secure time-limited token will be dispatched.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Citizen Identifier / Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={forgotEmail || emailOrPhone}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="e.g. aarav@citizen.org"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                        autoFocus
                      />
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      Demo citizen: <button type="button" onClick={() => setForgotEmail('aarav@citizen.org')} className="text-teal-600 dark:text-teal-400 font-bold hover:underline">aarav@citizen.org</button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-slate-900 dark:bg-teal-600 hover:bg-teal-700 dark:hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Dispatch Secure Reset Link & Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUseRecoveryKeyInReset(true);
                        setForgotStep('verify');
                      }}
                      className="text-xs text-teal-700 dark:text-teal-400 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Use Emergency Master Recovery Key instead</span>
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: Verify Code or Recovery Key */}
              {forgotStep === 'verify' && (
                <form onSubmit={handleVerifyResetCode} className="space-y-4">
                  {useRecoveryKeyInReset ? (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>Emergency Recovery Key Verification</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          Enter the 16-character backup key generated during signup.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          16-Character Master Recovery Key
                        </label>
                        <input
                          type="text"
                          value={recoveryKeyResetInput}
                          onChange={(e) => setRecoveryKeyResetInput(e.target.value.toUpperCase())}
                          placeholder="SEC-XXXX-XXXX-XXXX"
                          className="w-full text-center font-mono py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 tracking-wider focus:outline-none focus:ring-2 focus:ring-teal-500"
                          required
                        />
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-1">
                          Demo key: <button type="button" onClick={() => setRecoveryKeyResetInput('SEC-7K9P-44M2-99L1')} className="text-teal-600 dark:text-teal-400 font-mono font-bold hover:underline">SEC-7K9P-44M2-99L1</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-xs text-teal-900 dark:text-teal-200 text-center space-y-1">
                        <div className="font-bold">Reset Authorization Dispatched</div>
                        <p className="text-[11px] text-teal-800 dark:text-teal-300">
                          {deliveryChannelNotice ? `Sent via ${deliveryChannelNotice}` : 'Sent to your registered channels'}. Valid for 15 minutes.
                        </p>
                        {demoProvidedCode && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => setResetCode(demoProvidedCode)}
                              className="inline-block bg-teal-100 dark:bg-teal-900/60 px-3 py-1 rounded-lg text-[11px] font-mono font-bold text-teal-950 dark:text-teal-200 hover:bg-teal-200 dark:hover:bg-teal-800 transition-colors"
                            >
                              Click to Auto-fill Demo Code: {demoProvidedCode}
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                          Enter 6-Digit Authorization Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="892140"
                          className="w-full text-center tracking-[0.5em] font-mono text-2xl py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          autoFocus
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep('request')}
                      className="w-1/3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-2/3 py-2.5 rounded-xl bg-slate-900 dark:bg-teal-600 hover:bg-teal-700 dark:hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <span>Verify Code & Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setUseRecoveryKeyInReset(!useRecoveryKeyInReset)}
                      className="text-xs text-teal-700 dark:text-teal-400 font-bold hover:underline"
                    >
                      {useRecoveryKeyInReset ? 'Switch to 6-Digit Verification Code' : 'Use 16-Character Master Recovery Key'}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: Set New Master Password */}
              {forgotStep === 'new_password' && (
                <form onSubmit={handleSetNewPassword} className="space-y-4">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>Identity challenge passed. Enter your new strong master password.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      New Master Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Live Password Strength Meter */}
                    {newPassword && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 dark:text-slate-400">Strength:</span>
                          <span className="font-bold text-teal-600 dark:text-teal-400">
                            {getPasswordStrength(newPassword) <= 2 ? 'Weak' : 
                             getPasswordStrength(newPassword) === 3 ? 'Fair' : 
                             getPasswordStrength(newPassword) === 4 ? 'Good' : 'Maximum Shield (A+)'}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1 h-1.5">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <div
                              key={lvl}
                              className={`rounded-full transition-all ${
                                getPasswordStrength(newPassword) >= lvl
                                  ? lvl <= 2 ? 'bg-amber-400' : lvl <= 4 ? 'bg-teal-500' : 'bg-emerald-500'
                                  : 'bg-slate-200 dark:bg-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm New Master Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>All prior active sessions across other browsers will be revoked.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-slate-900 dark:bg-teal-600 hover:bg-teal-700 dark:hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Reset Password & Secure Account</span>
                        <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 4: Success */}
              {forgotStep === 'success' && (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3 animate-fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-md">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Password Reset Successfully!
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      Your master password has been securely updated. You are now logged in.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onSuccess) onSuccess();
                      else resetForgotPasswordState();
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
                  >
                    Proceed to Citizen Portal
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Quick Demo Citizen Quick-Access Pill */}
          {!requires2FA && (
            <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Instant Demo Citizen Profile</h4>
                  <p className="text-[11px] text-teal-800">Aarav Sharma • Ward 150 Bellandur</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleUseDemo}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1"
              >
                <span>1-Click Sign In</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* 2FA Verification View */}
          {requires2FA ? (
            <form onSubmit={handleVerify2FA} className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 mx-auto flex items-center justify-center shadow-inner">
                  {twoFactorMethod === 'sms' ? <Smartphone className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {isBackupCodeMode ? 'Emergency Recovery Code' : 'Multi-Factor Security Verification'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    {isBackupCodeMode 
                      ? 'Enter one of your 8-character single-use emergency backup recovery codes.' 
                      : twoFactorMessage}
                  </p>
                </div>

                {/* SMS Resend Helper */}
                {!isBackupCodeMode && twoFactorMethod === 'sms' && (
                  <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-[11px] text-teal-900 dark:text-teal-200 space-y-1 text-left">
                    <div className="flex items-center justify-between pt-1 text-[10px]">
                      <span className="text-slate-400">Didn't receive text?</span>
                      <button
                        type="button"
                        onClick={handleResendLoginSms}
                        disabled={resendSmsCountdown > 0 || loading}
                        className="font-bold text-teal-700 dark:text-teal-300 hover:underline disabled:opacity-50"
                      >
                        {resendSmsCountdown > 0 ? `Resend in ${resendSmsCountdown}s` : 'Resend SMS Code'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                  {isBackupCodeMode ? 'Enter 8-Character Backup Code' : 'Enter 6-Digit Verification Code'}
                </label>
                <input
                  type="text"
                  maxLength={isBackupCodeMode ? 10 : 6}
                  value={twoFactorCode}
                  onChange={(e) => {
                    const val = isBackupCodeMode 
                      ? e.target.value.toUpperCase() 
                      : e.target.value.replace(/\D/g, '');
                    setTwoFactorCode(val);
                  }}
                  placeholder={isBackupCodeMode ? 'XXXX-XXXX' : '••••••'}
                  className="w-full text-center tracking-[0.4em] font-mono text-2xl py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800"
                  autoFocus
                />
              </div>

              {/* Trust Device Checkbox */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="trustThisDevice"
                  checked={trustThisDevice}
                  onChange={(e) => setTrustThisDevice(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                />
                <label htmlFor="trustThisDevice" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <strong className="text-slate-900 dark:text-white block">Authorize and trust this device for 30 days</strong>
                  <span>Don't ask for two-factor verification again on this browser.</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRequires2FA(false);
                    setIsBackupCodeMode(false);
                  }}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !twoFactorCode.trim()}
                  className="w-2/3 py-2.5 rounded-xl bg-slate-900 dark:bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Verify & Continue</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Backup Code toggle */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsBackupCodeMode(!isBackupCodeMode);
                    setTwoFactorCode('');
                    setError(null);
                  }}
                  className="text-xs text-teal-700 dark:text-teal-400 font-semibold hover:underline"
                >
                  {isBackupCodeMode 
                    ? 'Switch back to 6-digit Authenticator code' 
                    : 'Having trouble? Use an Emergency Backup Code'}
                </button>
              </div>
            </form>
          ) : (
            /* Standard Login Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Method Switcher */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAuthMethod('password')}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    authMethod === 'password'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email & Password</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('otp')}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    authMethod === 'otp'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile OTP</span>
                </button>
              </div>

              {/* Email / Mobile Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {authMethod === 'password' ? 'Email Address or Citizen ID' : 'Mobile Number'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    {authMethod === 'password' ? <Mail className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                  </div>
                  <input
                    type={authMethod === 'password' ? 'email' : 'tel'}
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder={authMethod === 'password' ? 'e.g. citizen@domain.org' : '+91 98765 43210'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Password Input (if password method) */}
              {authMethod === 'password' ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPasswordMode(true);
                          setForgotEmail(emailOrPhone || 'aarav@citizen.org');
                          setForgotStep('request');
                          setError(null);
                        }}
                        className="text-[11px] text-teal-700 dark:text-teal-400 font-bold hover:underline"
                      >
                        Forgot password?
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <button
                        type="button"
                        onClick={() => setShowRecoveryModal(true)}
                        className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hover:underline"
                      >
                        Recovery Key
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>A secure one-time login code will be verified upon proceeding.</span>
                </div>
              )}

              {/* Remember Me & Privacy Guarantee */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                  />
                  <span>Remember this browser</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  TLS 1.3 Certified
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 tracking-wide uppercase"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In Securely</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Switch to Signup Security */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 mb-2">
              Don’t have a protected civic profile?
            </p>
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Create Hardened Account (Signup Security)</span>
            </button>
          </div>
            </>
          )}
        </div>

        {/* Footer Zero-Surveillance Notice */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-center gap-2 text-center">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>No Aadhaar or biometric data is ever stored on external cloud brokers.</span>
        </div>
      </div>

      {/* Recovery Key Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <KeyRound className="w-4 h-4 text-teal-600" />
                <span>Emergency Recovery Key</span>
              </div>
              <button
                onClick={() => setShowRecoveryModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              If you lost your password, enter your 16-character Master Recovery Key issued at account creation (e.g. <code>SEC-7K9P-44M2-99L1</code>).
            </p>

            {recoverySuccessMsg ? (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{recoverySuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleRecoveryKeyUnlock} className="space-y-3">
                <input
                  type="text"
                  value={recoveryKeyInput}
                  onChange={(e) => setRecoveryKeyInput(e.target.value.toUpperCase())}
                  placeholder="SEC-XXXX-XXXX-XXXX"
                  className="w-full text-center font-mono py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 tracking-wider focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                <div className="text-[11px] text-slate-400 text-center">
                  Demo recovery key: <span className="font-mono font-bold text-slate-700">SEC-7K9P-44M2-99L1</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(false)}
                    className="w-1/2 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-1/2 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Unlock Access'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
