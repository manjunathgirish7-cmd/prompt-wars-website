import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  MapPin, 
  KeyRound, 
  Check, 
  Copy, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Smartphone, 
  Key, 
  RefreshCw,
  Compass,
  FileCheck2,
  Database
} from 'lucide-react';
import { registerCitizenApi } from '../services/apiClient.js';
import { useAuth } from '../context/AuthContext.js';

interface SignupSecurityPageProps {
  onSwitchToLogin: () => void;
  onSuccess?: () => void;
}

export const SignupSecurityPage: React.FC<SignupSecurityPageProps> = ({ 
  onSwitchToLogin, 
  onSuccess 
}) => {
  const { login } = useAuth();

  // Multi-step progress: 1: Profile -> 2: Password Security -> 3: 2FA & Privacy Hardening -> 4: Complete
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [ward, setWard] = useState('');

  // Password & Security state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 2FA & Hardening state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [twoFactorMethod, setTwoFactorMethod] = useState<'sms' | 'authenticator' | 'passkey'>('sms');
  const [autoPurgeDays, setAutoPurgeDays] = useState<number>(30);
  const [localEncryptionEnabled, setLocalEncryptionEnabled] = useState(true);
  
  // Generated recovery key
  const [recoveryKey, setRecoveryKey] = useState('SEC-8M2Q-77K1-99P4');
  const [hasCopiedKey, setHasCopiedKey] = useState(false);

  // Verification step code
  const [verificationCode, setVerificationCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password strength analysis
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password && password === confirmPassword;

  const passedCriteriaCount = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  
  let strengthLabel = 'Too Weak';
  let strengthColor = 'bg-red-500';
  let strengthPercent = 20;

  if (passedCriteriaCount === 5 && password.length >= 10) {
    strengthLabel = 'Bank-Grade Shield (A+)';
    strengthColor = 'bg-emerald-600';
    strengthPercent = 100;
  } else if (passedCriteriaCount >= 4) {
    strengthLabel = 'Strong Protection';
    strengthColor = 'bg-teal-600';
    strengthPercent = 80;
  } else if (passedCriteriaCount >= 3) {
    strengthLabel = 'Moderate';
    strengthColor = 'bg-amber-500';
    strengthPercent = 55;
  } else if (passedCriteriaCount >= 2) {
    strengthLabel = 'Weak';
    strengthColor = 'bg-orange-500';
    strengthPercent = 35;
  }

  // Generate ultra strong password helper
  const handleGenerateStrongPassword = () => {
    const specials = '!@#$%&*';
    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowers = 'abcdefghijkmnopqrstuvwxyz';
    const nums = '23456789';
    
    const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
    let res = pick(uppers) + pick(lowers) + pick(nums) + pick(specials);
    const all = uppers + lowers + nums + specials;
    for (let i = 0; i < 8; i++) {
      res += pick(all);
    }
    setPassword(res);
    setConfirmPassword(res);
    setShowPassword(true);
  };

  const handleCopyRecoveryKey = () => {
    navigator.clipboard.writeText(recoveryKey);
    setHasCopiedKey(true);
    setTimeout(() => setHasCopiedKey(false), 2500);
  };

  const handleNextFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Please enter your full legal name or preferred civic alias.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid contact email for official grievance notifications.');
      return;
    }
    setStep(2);
  };

  const handleNextFromStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!hasMinLength) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (passedCriteriaCount < 3) {
      setError('Please strengthen your password with uppercase letters, numbers, or symbols.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match. Please recheck confirmation.');
      return;
    }
    setStep(3);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      const res = await registerCitizenApi({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        city,
        ward: ward.trim() || undefined,
        twoFactorEnabled,
        twoFactorMethod,
        autoPurgeDays,
        localEncryptionEnabled
      });

      if (res.recoveryKey) {
        setRecoveryKey(res.recoveryKey);
      }

      setStep(4); // Move to verification confirmation
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalActivation = () => {
    if (verificationCode.trim().length !== 6 && verificationCode.trim() !== '123456') {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      login({
        id: `usr-${Date.now()}`,
        name,
        email,
        phone: phone || '+91 98765 43210',
        city,
        ward: ward || 'Ward 150 - Bellandur',
        isVerified: true,
        twoFactorEnabled,
        twoFactorMethod,
        passkeyEnabled: twoFactorMethod === 'passkey',
        autoPurgeDays,
        localEncryptionEnabled,
        recoveryKeyGenerated: true,
        recoveryKeyPreview: `${recoveryKey.slice(0, 8)}...`,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      }, `tok-${Date.now()}`);

      if (onSuccess) onSuccess();
    }, 600);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Outer Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        {/* Header Ribbon with Shield Theme */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 sm:p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 backdrop-blur-md flex items-center justify-center text-teal-300 border border-teal-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-extrabold tracking-tight text-lg text-white font-sans">
                Intent<span className="text-teal-400">Bridge</span>
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold uppercase tracking-wider">
              Signup Security Protocol
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Create Hardened Citizen Profile
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-md leading-relaxed">
            Privacy-first architecture: Zero external broker surveillance, client-side draft encryption, and 2FA protection.
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center gap-2 mt-6">
            <div className={`flex-1 h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-teal-400' : 'bg-slate-700'}`} />
            <div className={`flex-1 h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-teal-400' : 'bg-slate-700'}`} />
            <div className={`flex-1 h-1.5 rounded-full transition-all ${step >= 3 ? 'bg-teal-400' : 'bg-slate-700'}`} />
            <div className={`flex-1 h-1.5 rounded-full transition-all ${step >= 4 ? 'bg-emerald-400' : 'bg-slate-700'}`} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-wider">
            <span className={step === 1 ? 'text-teal-300' : ''}>1. Identity</span>
            <span className={step === 2 ? 'text-teal-300' : ''}>2. Password Shield</span>
            <span className={step === 3 ? 'text-teal-300' : ''}>3. 2FA & Privacy</span>
            <span className={step === 4 ? 'text-emerald-300' : ''}>4. Verified</span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Error notification */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* STEP 1: Citizen Identity */}
          {step === 1 && (
            <form onSubmit={handleNextFromStep1} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Citizen Identification & Jurisdiction</h3>
                <p className="text-xs text-slate-500">
                  Used exclusively to address municipal authorities and ward engineers in your area.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name / Citizen Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="citizen@domain.org"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number <span className="text-slate-400 font-normal">(for 2FA)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary City Jurisdiction
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Bengaluru">Bengaluru (BBMP)</option>
                    <option value="Mumbai">Mumbai (BMC)</option>
                    <option value="New Delhi">New Delhi (MCD)</option>
                    <option value="Hyderabad">Hyderabad (GHMC)</option>
                    <option value="Chennai">Chennai (GCC)</option>
                    <option value="Kolkata">Kolkata (KMC)</option>
                    <option value="Pune">Pune (PMC)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ward or Area / PIN <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                      placeholder="e.g. Ward 150 Bellandur or 560103"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 uppercase tracking-wide"
                >
                  <span>Continue to Password Security</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Password Security & Entropy */}
          {step === 2 && (
            <form onSubmit={handleNextFromStep2} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Configure Master Password Shield</h3>
                  <p className="text-xs text-slate-500">
                    High-entropy passwords prevent brute-force attacks on your stored complaints.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateStrongPassword}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold border border-teal-200 transition-colors"
                  title="Generate high-entropy password"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Generate Strong</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Master Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a bank-grade master password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
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

                {/* Strength Meter Bar */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-600">Password Entropy Score:</span>
                      <span className="font-bold text-slate-900">{strengthLabel}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strengthColor}`}
                        style={{ width: `${strengthPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Password criteria checklist */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper && hasLower ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Upper & lowercase</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Contains numbers</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Special symbol (!@#$)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm Master Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password to confirm"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    required
                  />
                </div>
                {confirmPassword && passwordsMatch && (
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
                    <Check className="w-3.5 h-3.5" /> Passwords match perfectly
                  </span>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-xl bg-slate-900 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 uppercase tracking-wide"
                >
                  <span>Proceed to 2FA Hardening</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: 2FA & Privacy Hardening */}
          {step === 3 && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Two-Factor Authentication & Master Recovery</h3>
                <p className="text-xs text-slate-500">
                  Select your verification challenge method and save your emergency recovery key.
                </p>
              </div>

              {/* 2FA Method Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Select Two-Factor Authentication (2FA) Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTwoFactorMethod('sms')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      twoFactorMethod === 'sms'
                        ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className={`w-4 h-4 mb-1 ${twoFactorMethod === 'sms' ? 'text-teal-600' : 'text-slate-400'}`} />
                    <div className="text-xs font-bold text-slate-900">SMS / OTP</div>
                    <div className="text-[10px] text-slate-500">Fast mobile code</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTwoFactorMethod('authenticator')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      twoFactorMethod === 'authenticator'
                        ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <KeyRound className={`w-4 h-4 mb-1 ${twoFactorMethod === 'authenticator' ? 'text-teal-600' : 'text-slate-400'}`} />
                    <div className="text-xs font-bold text-slate-900">Authenticator</div>
                    <div className="text-[10px] text-slate-500">Google Auth / TOTP</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTwoFactorMethod('passkey')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      twoFactorMethod === 'passkey'
                        ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Key className={`w-4 h-4 mb-1 ${twoFactorMethod === 'passkey' ? 'text-teal-600' : 'text-slate-400'}`} />
                    <div className="text-xs font-bold text-slate-900">Passkey</div>
                    <div className="text-[10px] text-slate-500">Biometric / Touch ID</div>
                  </button>
                </div>
              </div>

              {/* Master Recovery Key Box */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                    <KeyRound className="w-4 h-4 text-amber-700" />
                    <span>Emergency Master Recovery Key</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    Do Not Share
                  </span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Save this 16-character key now. If you ever lose your password or phone, this is the only zero-knowledge method to regain access.
                </p>
                <div className="flex items-center justify-between bg-white border border-amber-200 rounded-xl p-2.5 font-mono text-xs font-bold text-slate-900">
                  <span className="tracking-wider">{recoveryKey}</span>
                  <button
                    type="button"
                    onClick={handleCopyRecoveryKey}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold flex items-center gap-1 transition-colors"
                  >
                    {hasCopiedKey ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Key</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Privacy Presets Checklist */}
              <div className="space-y-2 text-xs">
                <label className="block font-bold text-slate-700">
                  Civic Privacy Controls
                </label>
                
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localEncryptionEnabled}
                      onChange={(e) => setLocalEncryptionEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-slate-800 text-[11px]">Client-Side Draft Encryption</div>
                      <div className="text-[10px] text-slate-500">Legal complaints are encrypted with AES before persisting</div>
                    </div>
                  </label>

                  <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 text-[11px]">Auto-Purge Case History</div>
                      <div className="text-[10px] text-slate-500">Automatically delete resolved grievance records</div>
                    </div>
                    <select
                      value={autoPurgeDays}
                      onChange={(e) => setAutoPurgeDays(Number(e.target.value))}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-bold bg-white text-slate-700"
                    >
                      <option value={30}>After 30 days</option>
                      <option value={90}>After 90 days</option>
                      <option value={0}>Keep Indefinitely</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 uppercase tracking-wide"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Instant Activation / Verification */}
          {step === 4 && (
            <div className="space-y-5 text-center py-2 animate-fade-in">
              <div className="w-14 h-14 rounded-3xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900">Security Profile Initialized</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Enter your 6-digit confirmation code sent via {twoFactorMethod.toUpperCase()} to activate your encrypted citizen account.
                </p>
              </div>

              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-xs font-semibold text-teal-900 inline-block">
                Simulated Activation Code: <span className="font-mono font-bold">123456</span>
              </div>

              <div className="max-w-xs mx-auto">
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.5em] font-mono text-2xl py-3 px-4 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={handleFinalActivation}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 uppercase tracking-wide"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Activate & Enter IntentBridge</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setVerificationCode('123456')}
                  className="text-xs text-teal-700 font-semibold hover:underline"
                >
                  Quick Auto-fill (123456)
                </button>
              </div>
            </div>
          )}

          {/* Switch to Login */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 mb-1">
              Already have an account?
            </p>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-xs font-bold text-teal-700 hover:underline"
            >
              Sign In with existing credentials
            </button>
          </div>
        </div>

        {/* Zero-surveillance Guarantee footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <Database className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>No tracking cookies. Government credentials stay in your private enclave.</span>
        </div>
      </div>
    </div>
  );
};
