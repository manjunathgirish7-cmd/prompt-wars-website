import React, { useState } from 'react';
import { 
  Building2, 
  AlertTriangle, 
  MapPin, 
  BookOpen, 
  HelpCircle, 
  FileText, 
  CheckCircle2, 
  Compass, 
  ChevronDown,
  ShieldCheck,
  User,
  LogOut,
  KeyRound,
  Lock,
  Sun,
  Moon,
  Activity,
  MessageSquare,
  History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';

interface HeaderProps {
  activeTab: 'solve' | 'services' | 'offices' | 'complaint' | 'emergency' | 'sources' | 'security' | 'login' | 'signup';
  setActiveTab: (tab: 'solve' | 'services' | 'offices' | 'complaint' | 'emergency' | 'sources' | 'security' | 'login' | 'signup') => void;
  currentCity: string;
  onSelectCity: (city: string) => void;
  onOpenOnboarding: () => void;
  onOpenFeedback?: () => void;
  onOpenTroubleshooter?: () => void;
  isEmergencyAlertActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentCity,
  onSelectCity,
  onOpenOnboarding,
  onOpenFeedback,
  onOpenTroubleshooter,
  isEmergencyAlertActive = false
}) => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const cityOptions = ['Bengaluru', 'Mumbai', 'New Delhi', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune'];

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-4">
            <button 
              id="brand-home-btn"
              onClick={() => setActiveTab('solve')} 
              className="flex items-center gap-3 text-left focus:outline-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-teal-600 text-white flex items-center justify-center shadow-md shadow-slate-900/10 group-hover:bg-teal-700 transition-colors">
                <Compass className="w-5 h-5 text-teal-400 dark:text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
                    Intent<span className="text-teal-600 dark:text-teal-400">Bridge</span>
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 rounded">
                    Civic AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block font-medium">
                  Universal Bridge to Real-World Systems
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 text-sm font-medium">
            <button
              id="nav-tab-solve"
              onClick={() => setActiveTab('solve')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'solve'
                  ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Compass className="w-4 h-4" />
              Solve Problem
            </button>

            <button
              id="nav-tab-services"
              onClick={() => setActiveTab('services')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'services'
                  ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Services
            </button>

            <button
              id="nav-tab-offices"
              onClick={() => setActiveTab('offices')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'offices'
                  ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Offices
            </button>

            <button
              id="nav-tab-complaint"
              onClick={() => setActiveTab('complaint')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'complaint'
                  ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              Grievance Studio
            </button>

            <button
              id="nav-tab-security"
              onClick={() => setActiveTab('security')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'security'
                  ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Security Center
            </button>

            <button
              id="nav-tab-sources"
              onClick={() => setActiveTab('sources')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'sources'
                  ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Verified Sources
            </button>
          </nav>

          {/* Right Action Items: Auth, Emergency Mode, Location */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Location Jurisdiction selector */}
            <div className="relative">
              <button
                id="location-picker-btn"
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-800/90 shadow-2xs"
                title="Change active location jurisdiction"
              >
                <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span className="max-w-[70px] sm:max-w-none truncate">{currentCity}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {cityDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-50 text-xs">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                    Select Jurisdiction
                  </div>
                  {cityOptions.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        onSelectCity(c);
                        setCityDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                        c === currentCity ? 'text-teal-700 dark:text-teal-400 font-bold bg-teal-50/50 dark:bg-teal-950/40' : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span>{c}</span>
                      {c === currentCity && <span className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Emergency Mode Button */}
            <button
              id="emergency-mode-btn"
              onClick={() => setActiveTab('emergency')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                activeTab === 'emergency' || isEmergencyAlertActive
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/60'
              }`}
              title="Immediate flood, fire, live wire or disaster assistance"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Emergency Mode</span>
            </button>

            {/* Authentication Buttons or Citizen Profile Dropdown */}
            {isAuthenticated && currentUser ? (
              <div className="relative">
                <button
                  id="user-profile-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-950/40 hover:bg-teal-100/60 dark:hover:bg-teal-900/60 transition-colors text-xs font-bold text-slate-900 dark:text-white shadow-2xs"
                >
                  <div className="w-6 h-6 rounded-lg bg-slate-900 dark:bg-teal-600 text-white flex items-center justify-center font-black text-[11px]">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="leading-tight truncate max-w-[100px]">{currentUser.name}</div>
                    <div className="text-[10px] text-teal-700 dark:text-teal-400 font-normal font-mono">2FA Active ✓</div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-2 z-50 text-xs animate-fade-in">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{currentUser.name}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate">{currentUser.email}</div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800 w-fit font-semibold">
                        <ShieldCheck className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                        <span>Protected Citizen Profile</span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setActiveTab('security');
                          setUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium"
                      >
                        <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <span>Security Cockpit & 2FA</span>
                      </button>

                      <button
                        id="header-activity-logs-btn"
                        onClick={() => {
                          setActiveTab('security');
                          setUserMenuOpen(false);
                          setTimeout(() => {
                            document.getElementById('activity-logs-section')?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium"
                      >
                        <History className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <span>Activity & Audit Logs</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('complaint');
                          setUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium"
                      >
                        <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span>My Complaint Letters</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-slate-100 dark:border-slate-700">
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 text-red-700 dark:text-red-400 font-bold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  id="header-login-btn"
                  onClick={() => setActiveTab('login')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'login'
                      ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-xs'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Sign In</span>
                </button>

                <button
                  id="header-signup-btn"
                  onClick={() => setActiveTab('signup')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                    activeTab === 'signup'
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-900 dark:bg-teal-600 text-white hover:bg-teal-700'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span className="hidden sm:inline">Signup Security</span>
                </button>
              </div>
            )}

            {/* Diagnostics Troubleshooter */}
            {onOpenTroubleshooter && (
              <button
                id="header-troubleshoot-btn"
                onClick={onOpenTroubleshooter}
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Website Health & Freezing Troubleshooter"
                aria-label="Troubleshoot website problems"
              >
                <Activity className="w-5 h-5" />
              </button>
            )}

            {/* Citizen Feedback Form trigger */}
            {onOpenFeedback && (
              <button
                id="header-feedback-btn"
                onClick={onOpenFeedback}
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Citizen Feedback & Rating (Emoji + Text)"
                aria-label="Give feedback"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            )}

            {/* Dark Mode / Light Mode Toggle Button */}
            <button
              id="header-theme-toggle-btn"
              type="button"
              onClick={toggleTheme}
              className="p-1.5 text-slate-500 dark:text-amber-400 hover:text-slate-900 dark:hover:text-amber-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle dark / light theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-5 h-5 transition-transform hover:rotate-45" />
              ) : (
                <Moon className="w-5 h-5 transition-transform hover:-rotate-12" />
              )}
            </button>

            {/* How it works info modal trigger */}
            <button
              id="how-it-works-btn"
              onClick={onOpenOnboarding}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="How IntentBridge works"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="xl:hidden flex items-center justify-between border-t border-slate-100 dark:border-slate-800 py-2 overflow-x-auto text-xs font-medium space-x-1">
          <button
            onClick={() => setActiveTab('solve')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${
              activeTab === 'solve' ? 'bg-slate-900 dark:bg-teal-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Solve Problem
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${
              activeTab === 'services' ? 'bg-slate-900 dark:bg-teal-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Services
          </button>
          <button
            onClick={() => setActiveTab('offices')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${
              activeTab === 'offices' ? 'bg-slate-900 dark:bg-teal-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Offices
          </button>
          <button
            onClick={() => setActiveTab('complaint')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${
              activeTab === 'complaint' ? 'bg-slate-900 dark:bg-teal-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Complaint
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'security' ? 'bg-slate-900 dark:bg-teal-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3 h-3 text-teal-600 dark:text-teal-400" />
            <span>Security</span>
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${
              activeTab === 'sources' ? 'bg-slate-900 dark:bg-teal-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Sources
          </button>
        </div>
      </div>
    </header>
  );
};
