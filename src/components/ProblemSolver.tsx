import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Image as ImageIcon, 
  X, 
  Sparkles, 
  MapPin, 
  UploadCloud, 
  ArrowRight, 
  FileText, 
  AlertCircle, 
  Clock, 
  Search, 
  ShieldCheck,
  Building,
  CheckCircle2,
  RefreshCw,
  Compass
} from 'lucide-react';
import { ProblemAnalysis, ComplaintLetter } from '../types.js';
import { analyzeProblemApi } from '../services/apiClient.js';
import { demoScenarios, DemoScenario } from '../data/sampleProblems.js';
import { AnalysisResultView } from './AnalysisResultView.js';

interface ProblemSolverProps {
  currentCity: string;
  onSelectCity: (city: string) => void;
  onOpenComplaintModal: (analysis: ProblemAnalysis) => void;
  onNavigateTab: (tab: 'solve' | 'services' | 'offices' | 'complaint' | 'emergency' | 'sources') => void;
  onTriggerEmergency: () => void;
  onOpenOnboarding: () => void;
}

export const ProblemSolver: React.FC<ProblemSolverProps> = ({
  currentCity,
  onSelectCity,
  onOpenComplaintModal,
  onNavigateTab,
  onTriggerEmergency,
  onOpenOnboarding
}) => {
  const [problemText, setProblemText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [activeAnalysis, setActiveAnalysis] = useState<ProblemAnalysis | null>(null);
  const [history, setHistory] = useState<ProblemAnalysis[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load problem history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('intentbridge_problem_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Default to Indian English or user locale

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setProblemText(prev => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }
  }, []);

  const toggleSpeech = () => {
    if (!speechSupported) {
      alert('Speech Recognition is not supported by this browser. You can type your problem directly.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Mic start error', err);
        setIsRecording(false);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds 15MB limit. Please upload a smaller image.');
      return;
    }

    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setSelectedImage(uploadEvent.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyScenario = (scenario: DemoScenario) => {
    setProblemText(scenario.prompt);
    if (scenario.hasSampleImage && scenario.sampleImageData) {
      setSelectedImage(scenario.sampleImageData);
      setImageName(scenario.sampleImageName || 'demo_evidence.png');
    } else {
      setSelectedImage(null);
      setImageName('');
    }
    setErrorMessage(null);
  };

  const clearForm = () => {
    setProblemText('');
    setSelectedImage(null);
    setImageName('');
    setErrorMessage(null);
  };

  const loadingSteps = [
    "Understanding your messy problem...",
    "Categorizing civic urgency & public hazard level...",
    "Cross-referencing official government portals & citizen charters...",
    "Matching nearby office timings and verified contacts...",
    "Your action plan is ready!"
  ];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!problemText.trim() && !selectedImage) {
      setErrorMessage('Please describe what is wrong or upload a photo of the issue.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStep(0);

    // Progress interval animation
    const progressTimer = setInterval(() => {
      setLoadingStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 700);

    try {
      const result = await analyzeProblemApi({
        problem: problemText.trim(),
        imageBase64: selectedImage || undefined,
        location: {
          city: currentCity
        }
      });

      clearInterval(progressTimer);
      setActiveAnalysis(result);
      setIsLoading(false);

      // Save to recent problem history
      const updatedHistory = [result, ...history.filter(h => h.id !== result.id)].slice(0, 6);
      setHistory(updatedHistory);
      try {
        localStorage.setItem('intentbridge_problem_history', JSON.stringify(updatedHistory));
      } catch (err) {
        console.warn('Could not save history to storage', err);
      }

      // Smooth scroll down to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

      // Check for emergency
      if (result.isEmergency) {
        // Highlight emergency
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      setIsLoading(false);
      console.error('Analysis error:', err);
      setErrorMessage('IntentBridge encountered an issue connecting with the civic intelligence server. Please try again.');
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative pt-6 pb-2 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold mb-6 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Universal Citizen-to-Government AI Bridge</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-4">
          Turn messy problems into <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">clear actions.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
          You don’t need to understand government terminology or complicated procedures. Describe what’s wrong in your own words, upload a photo, or speak naturally. IntentBridge figures out the verified path.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="#problem-input-card"
            className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-md hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            Solve a problem
            <ArrowRight className="w-4 h-4 text-teal-400" />
          </a>
          <button
            onClick={onOpenOnboarding}
            className="px-6 py-3 rounded-xl bg-white text-slate-700 font-bold text-sm border border-slate-200 shadow-2xs hover:bg-slate-50 transition-all"
          >
            See how it works
          </button>
        </div>
      </section>

      {/* Main Interactive Input Card */}
      <div 
        id="problem-input-card"
        className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 max-w-4xl mx-auto relative"
      >
        {/* Card Header & Location Permission Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-600"></div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Civic Intake Console
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
            <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>Jurisdiction: <strong className="text-slate-800">{currentCity}</strong></span>
            <button
              onClick={() => {
                const newCity = prompt('Enter your City or Municipal District:', currentCity);
                if (newCity && newCity.trim()) onSelectCity(newCity.trim());
              }}
              className="text-teal-700 hover:underline font-semibold ml-1"
            >
              Change
            </button>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Text Area */}
          <div className="relative">
            <textarea
              id="problem-description-input"
              rows={4}
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
              placeholder="What problem can we solve today? Describe what is happening in your own words... (e.g. 'There is a dangerous crater pothole on my street and scooters keep skidding' or 'Water is entering our houses after the storm drain backed up')"
              className="w-full text-slate-800 placeholder-slate-400 text-sm sm:text-base p-4 rounded-2xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all resize-none bg-slate-50/50"
            />

            {/* Clear Button */}
            {(problemText || selectedImage) && (
              <button
                type="button"
                onClick={clearForm}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Active Image Preview if attached */}
          {selectedImage && (
            <div className="flex items-center justify-between p-3 bg-teal-50/60 border border-teal-200 rounded-xl">
              <div className="flex items-center gap-3">
                <img 
                  src={selectedImage} 
                  alt="Evidence Preview" 
                  className="w-14 h-14 object-cover rounded-lg border border-teal-300"
                />
                <div>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    Visual Evidence Attached
                  </p>
                  <p className="text-[11px] text-slate-500 truncate max-w-xs">{imageName || 'hazard_photo.jpg'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedImage(null); setImageName(''); }}
                className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-white transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Controls Bar: Voice, Photo, File, and Submit */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              {/* Voice Input Button */}
              <button
                type="button"
                id="voice-record-btn"
                onClick={toggleSpeech}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isRecording 
                    ? 'bg-red-600 text-white animate-pulse shadow-md' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title="Speak your problem"
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-teal-600" />}
                <span>{isRecording ? 'Listening... (Speak)' : 'Speak Problem'}</span>
              </button>

              {/* Photo Upload Button */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
                id="photo-upload-input"
              />
              <button
                type="button"
                id="attach-photo-btn"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-2 transition-all"
                title="Upload photo of hazard or document"
              >
                <ImageIcon className="w-4 h-4 text-teal-600" />
                <span>Attach Photo</span>
              </button>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              id="analyze-problem-btn"
              disabled={isLoading || (!problemText.trim() && !selectedImage)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center gap-2 shadow-md ${
                isLoading || (!problemText.trim() && !selectedImage)
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-teal-600 hover:bg-teal-700 shadow-teal-700/20 active:scale-98'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Analyze Problem</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error message if any */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Quick Example Prompts */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Try a Realistic Demo Scenario
            </span>
            <span className="text-[11px] text-slate-400">Click to autofill with verified data</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {demoScenarios.map((demo) => (
              <button
                key={demo.id}
                onClick={() => handleApplyScenario(demo)}
                className="text-left p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-teal-50/50 hover:border-teal-300 transition-all group flex items-start justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      {demo.badge}
                    </span>
                    {demo.hasSampleImage && (
                      <span className="text-[10px] text-teal-700 font-semibold bg-teal-100/60 px-1.5 py-0.5 rounded">
                        + Photo Evidence
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-800 line-clamp-1 group-hover:text-teal-800">
                    "{demo.prompt}"
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 shrink-0 mt-1" />
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Quick Actions */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Quick Civic Tools
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 transition-colors"
            >
              <ImageIcon className="w-4 h-4 mx-auto mb-1 text-teal-600" />
              <span className="text-xs font-semibold text-slate-700 block">Analyze Photo</span>
            </button>

            <button
              onClick={toggleSpeech}
              className="p-3 text-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 transition-colors"
            >
              <Mic className="w-4 h-4 mx-auto mb-1 text-teal-600" />
              <span className="text-xs font-semibold text-slate-700 block">Speak Problem</span>
            </button>

            <button
              onClick={() => onNavigateTab('services')}
              className="p-3 text-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 transition-colors"
            >
              <Search className="w-4 h-4 mx-auto mb-1 text-teal-600" />
              <span className="text-xs font-semibold text-slate-700 block">Find Service</span>
            </button>

            <button
              onClick={() => onNavigateTab('offices')}
              className="p-3 text-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 transition-colors"
            >
              <Building className="w-4 h-4 mx-auto mb-1 text-teal-600" />
              <span className="text-xs font-semibold text-slate-700 block">Nearby Offices</span>
            </button>

            <button
              onClick={() => onNavigateTab('complaint')}
              className="p-3 text-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 transition-colors"
            >
              <FileText className="w-4 h-4 mx-auto mb-1 text-teal-600" />
              <span className="text-xs font-semibold text-slate-700 block">Create Complaint</span>
            </button>

            <button
              onClick={() => {
                handleApplyScenario(demoScenarios[3]);
              }}
              className="p-3 text-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-teal-600" />
              <span className="text-xs font-semibold text-slate-700 block">Understand Notice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Meaningful Loading State Banner */}
      {isLoading && (
        <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 shadow-lg border border-teal-200 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                  Gemini Civic Engine Processing
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Step {loadingStep + 1} of {loadingSteps.length}
                </span>
              </div>
              <p className="text-base font-bold text-slate-800 mb-2">
                {loadingSteps[loadingStep]}
              </p>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results View */}
      <div ref={resultsRef}>
        {activeAnalysis && (
          <AnalysisResultView
            analysis={activeAnalysis}
            onOpenComplaintModal={() => onOpenComplaintModal(activeAnalysis)}
            onSelectEmergency={onTriggerEmergency}
          />
        )}
      </div>

      {/* Previous History Section if available */}
      {history.length > 0 && !activeAnalysis && (
        <div className="max-w-4xl mx-auto pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Recent Civic Inquiries
              </h3>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('intentbridge_problem_history');
                setHistory([]);
              }}
              className="text-xs text-slate-400 hover:text-red-600 transition-colors"
            >
              Clear History
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {history.map((h) => (
              <button
                key={h.id}
                onClick={() => {
                  setActiveAnalysis(h);
                  setTimeout(() => {
                    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 50);
                }}
                className="text-left p-4 rounded-xl bg-white border border-slate-200 hover:border-teal-400 shadow-2xs hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {h.category}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    h.urgency === 'EMERGENCY' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {h.urgency}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-900 line-clamp-2 mb-2">
                  {h.understoodSummary}
                </p>
                <p className="text-[11px] text-teal-700 font-medium flex items-center gap-1">
                  View resolution plan <ArrowRight className="w-3 h-3" />
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
