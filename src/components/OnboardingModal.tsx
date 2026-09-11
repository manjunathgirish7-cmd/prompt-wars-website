import React, { useState } from 'react';
import { MessageSquareText, Cpu, Compass, CheckCircle2, ArrowRight, X } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "1. Tell us what's wrong",
      tagline: "In your own words, voice, or photo",
      icon: MessageSquareText,
      iconColor: "text-sky-500",
      bgColor: "bg-sky-50 border-sky-200",
      description: "You don't need to know government terminology, ministry names, or legal sections. Type your messy problem, speak into your mic, or upload a photo of the hazard or notice."
    },
    {
      title: "2. IntentBridge understands",
      tagline: "Gemini AI multimodal parsing",
      icon: Cpu,
      iconColor: "text-purple-500",
      bgColor: "bg-purple-50 border-purple-200",
      description: "Gemini AI analyzes what happened, measures urgency (like flash flooding or live wires vs. routine license renewal), identifies your intent, and extracts the core facts."
    },
    {
      title: "3. Find the right path",
      tagline: "Verified departments & portals",
      icon: Compass,
      iconColor: "text-teal-500",
      bgColor: "bg-teal-50 border-teal-200",
      description: "IntentBridge maps your problem to the exact municipal ward, state department, or central portal with verified opening timings, closed days, and required document checklists."
    },
    {
      title: "4. Take action",
      tagline: "Clear steps & 1-click letters",
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-50 border-emerald-200",
      description: "Receive a simple action plan, dial verified emergency numbers directly, or generate a formal legal complaint letter ready to download or submit."
    }
  ];

  const handleFinish = () => {
    localStorage.setItem('intentbridge_onboarding_completed', 'true');
    onClose();
  };

  const current = steps[currentStep];
  const IconComponent = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Welcome to IntentBridge
            </span>
            <span className="text-xs text-slate-400 font-medium">Step {currentStep + 1} of 4</span>
          </div>
          <button 
            onClick={handleFinish}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-2xl ${current.bgColor} border flex items-center justify-center mb-4 shadow-sm`}>
              <IconComponent className={`w-8 h-8 ${current.iconColor}`} />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {current.title}
            </h3>
            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-3">
              {current.tagline}
            </p>
            <p className="text-sm text-slate-600 leading-relaxed max-w-md">
              {current.description}
            </p>
          </div>

          {/* Stepper Dots */}
          <div className="flex justify-center items-center gap-2 mt-8">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep ? 'w-6 bg-teal-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleFinish}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Skip Tutorial
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Back
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
              >
                Get Started
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
