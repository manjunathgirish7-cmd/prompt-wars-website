import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { OnboardingModal } from './components/OnboardingModal.js';
import { InteractiveDemo } from './components/InteractiveDemo.js';
import { ProblemSolver } from './components/ProblemSolver.js';
import { ServicesDirectory } from './components/ServicesDirectory.js';
import { OfficesFinder } from './components/OfficesFinder.js';
import { EmergencyView } from './components/EmergencyView.js';
import { SourcesAndPrivacy } from './components/SourcesAndPrivacy.js';
import { ComplaintGeneratorModal } from './components/ComplaintGeneratorModal.js';
import { LoginPage } from './components/LoginPage.js';
import { SignupSecurityPage } from './components/SignupSecurityPage.js';
import { SecurityCenter } from './components/SecurityCenter.js';
import { AuthModal } from './components/AuthModal.js';
import { FeedbackModal } from './components/FeedbackModal.js';
import { TroubleshooterModal } from './components/TroubleshooterModal.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { ProblemAnalysis, GovernmentService } from './types.js';
import { Compass, ShieldCheck, Heart, Sparkles, Building2, HelpCircle, Lock, MessageSquare, Activity } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'solve' | 'services' | 'offices' | 'complaint' | 'emergency' | 'sources' | 'security' | 'login' | 'signup'>('solve');
  const [currentCity, setCurrentCity] = useState('Bengaluru');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [complaintModalAnalysis, setComplaintModalAnalysis] = useState<ProblemAnalysis | null>(null);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isTroubleshooterOpen, setIsTroubleshooterOpen] = useState(false);

  const { authModalOpen, authModalMode, closeAuthModal } = useAuth();

  // Check if first-time onboarding has been seen
  useEffect(() => {
    try {
      const completed = localStorage.getItem('intentbridge_onboarding_completed');
      if (!completed) {
        setIsOnboardingOpen(true);
      }
    } catch {
      // localStorage may fail in restricted iframes
    }
  }, []);

  const handleOpenComplaintModal = (analysis: ProblemAnalysis) => {
    setComplaintModalAnalysis(analysis);
    setIsComplaintModalOpen(true);
  };

  const handleSelectServiceForAI = (service: GovernmentService) => {
    // Generate a starter analysis context or trigger solver
    setActiveTab('solve');
    setComplaintModalAnalysis({
      id: `analysis-service-${service.id}`,
      originalProblem: service.name,
      understoodSummary: `Applying for ${service.name} under ${service.level} jurisdiction.`,
      category: service.category,
      urgency: 'MEDIUM',
      isEmergency: service.category === 'Disaster & Emergency',
      intent: `Citizen request for ${service.name}`,
      locationRequirement: {
        needed: true,
        detectedLocation: currentCity,
        level: 'City Municipal'
      },
      recommendedAuthority: {
        name: service.portalName,
        department: `${service.level} Civic Department`,
        level: `${service.level} Government Authority`,
        role: `Executive authority for ${service.name}`
      },
      reportingChannels: [
        {
          type: 'Online Portal',
          name: service.portalName,
          linkOrNumber: service.officialWebsite,
          verified: true,
          notes: 'Official application portal'
        },
        {
          type: 'Helpline',
          name: 'Citizen Helpline',
          linkOrNumber: service.helplinePhone || '1800-NIC-CITIZEN',
          verified: true,
          notes: 'Toll-free citizen support'
        }
      ],
      actionSteps: service.procedures.map((proc, idx) => ({
        stepNumber: proc.step || idx + 1,
        title: proc.title,
        description: proc.instruction
      })),
      requiredDocuments: service.requiredDocuments.map(doc => ({
        name: doc.name,
        reason: doc.description,
        isMandatory: doc.mandatory
      })),
      officialSources: [
        {
          name: service.portalName,
          url: service.officialWebsite,
          verified: true,
          lastChecked: '2026-09-08',
          sourceType: 'Government Portal',
          authority: service.portalName
        }
      ],
      complaintDraftAvailable: true,
      createdAt: new Date().toISOString()
    });
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col selection:bg-teal-500 selection:text-white transition-colors duration-150">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentCity={currentCity}
        onSelectCity={setCurrentCity}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        onOpenTroubleshooter={() => setIsTroubleshooterOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* If on 'solve' tab, show the live Interactive Pipeline Demo and Solver */}
        {activeTab === 'solve' && (
          <div className="space-y-8">
            <ProblemSolver
              currentCity={currentCity}
              onSelectCity={setCurrentCity}
              onOpenComplaintModal={handleOpenComplaintModal}
              onNavigateTab={setActiveTab}
              onTriggerEmergency={() => setActiveTab('emergency')}
              onOpenOnboarding={() => setIsOnboardingOpen(true)}
            />

            {/* Visual Transformation Pipeline Showcase */}
            <section className="max-w-4xl mx-auto pt-6">
              <InteractiveDemo />
            </section>
          </div>
        )}

        {/* Government Services Directory Tab */}
        {activeTab === 'services' && (
          <ServicesDirectory onSelectServiceForAI={handleSelectServiceForAI} />
        )}

        {/* Nearby Offices Finder Tab */}
        {activeTab === 'offices' && (
          <OfficesFinder currentCity={currentCity} onSelectCity={setCurrentCity} />
        )}

        {/* Direct Complaint Generator Tab */}
        {activeTab === 'complaint' && (
          <div className="max-w-4xl mx-auto py-4">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 mx-auto flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                Official Citizen Grievance Generator
              </h2>
              <p className="text-sm text-slate-600 max-w-lg mx-auto">
                Generate a pre-formatted legal complaint letter addressed to your local municipal commissioner, ward engineer, or department head.
              </p>
              <button
                onClick={() => setIsComplaintModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all"
              >
                Launch Complaint Letter Studio
              </button>
            </div>
          </div>
        )}

        {/* Dedicated Citizen Security Center Tab */}
        {activeTab === 'security' && (
          <SecurityCenter />
        )}

        {/* Dedicated Citizen Login Page Tab */}
        {activeTab === 'login' && (
          <div className="py-6 sm:py-10 animate-fade-in">
            <LoginPage
              onSwitchToSignup={() => setActiveTab('signup')}
              onSuccess={() => setActiveTab('solve')}
            />
          </div>
        )}

        {/* Dedicated Citizen Signup Security Page Tab */}
        {activeTab === 'signup' && (
          <div className="py-6 sm:py-10 animate-fade-in">
            <SignupSecurityPage
              onSwitchToLogin={() => setActiveTab('login')}
              onSuccess={() => setActiveTab('solve')}
            />
          </div>
        )}

        {/* Emergency Mode Tab */}
        {activeTab === 'emergency' && (
          <EmergencyView onBackToMain={() => setActiveTab('solve')} />
        )}

        {/* Verified Sources & Privacy Tab */}
        {activeTab === 'sources' && (
          <SourcesAndPrivacy />
        )}
      </main>

      {/* Onboarding / How-it-works Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

      {/* Complaint Generator Modal */}
      <ComplaintGeneratorModal
        isOpen={isComplaintModalOpen}
        onClose={() => setIsComplaintModalOpen(false)}
        analysis={complaintModalAnalysis}
      />

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuthModal}
        initialMode={authModalMode}
      />

      {/* Citizen Feedback Modal with Emoji Faces & Text */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onOpenTroubleshooter={() => {
          setIsFeedbackModalOpen(false);
          setIsTroubleshooterOpen(true);
        }}
      />

      {/* Website Health & Performance Troubleshooter (Hanging, Freezing, Slowness) */}
      <TroubleshooterModal
        isOpen={isTroubleshooterOpen}
        onClose={() => setIsTroubleshooterOpen(false)}
      />

      {/* Modern Civic Footer */}
      <footer className="mt-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-teal-600 text-white flex items-center justify-center">
                <Compass className="w-4 h-4 text-teal-400 dark:text-white" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight">
                  Intent<span className="text-teal-600 dark:text-teal-400">Bridge</span>
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Universal Bridge between Citizens and Real-World Systems
                </p>
              </div>
            </div>

            {/* Quick security, feedback & civic links in footer */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <button
                onClick={() => setActiveTab('login')}
                className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
              >
                <Lock className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                <span>Citizen Sign In</span>
              </button>
              <span>•</span>
              <button
                onClick={() => setActiveTab('signup')}
                className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
              >
                <ShieldCheck className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                <span>Signup Security</span>
              </button>
              <span>•</span>
              <button
                onClick={() => setActiveTab('security')}
                className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>Security Cockpit & 2FA</span>
              </button>
              <span>•</span>
              <button
                id="footer-feedback-btn"
                onClick={() => setIsFeedbackModalOpen(true)}
                className="hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1 transition-colors text-teal-700 dark:text-teal-400"
              >
                <MessageSquare className="w-3 h-3" />
                <span>Feedback</span>
              </button>
              <span>•</span>
              <button
                id="footer-troubleshoot-btn"
                onClick={() => setIsTroubleshooterOpen(true)}
                className="hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 transition-colors text-amber-700 dark:text-amber-400"
              >
                <Activity className="w-3 h-3" />
                <span>Troubleshooter</span>
              </button>
            </div>

            <div className="text-center md:text-right text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                “IntentBridge doesn’t make people learn complicated systems. It makes complicated systems understandable to people.”
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Independent Civic AI. 256-bit client-side encryption. Zero cloud brokerage.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
