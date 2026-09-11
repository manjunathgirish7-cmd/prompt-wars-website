import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Building, Globe, Phone, FileCheck } from 'lucide-react';

export const InteractiveDemo: React.FC = () => {
  const [activeStage, setActiveStage] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);

  const stages = [
    {
      step: 1,
      name: "Messy Input",
      badge: "Human Voice / Text / Photo",
      title: "Raw Citizen Problem",
      content: "“Water is pouring into my basement on 8th Main Road, the storm drain is choked with debris, and the streetlights are completely out!”",
      detail: "Emotional, disorganized, multi-issue human voice note or photo."
    },
    {
      step: 2,
      name: "Gemini AI Engine",
      badge: "Multimodal Intent Extraction",
      title: "Understanding & Triage",
      content: "Urgency: EMERGENCY (Rising flood + electrical risk)\nIntent: Dewatering dispatch & blocked stormwater culvert clearing\nJurisdiction: Municipal Ward 112 (Bruhat Bengaluru Mahanagara Palike)",
      detail: "Separates civic hazard from routine grievances instantly."
    },
    {
      step: 3,
      name: "Official Verification",
      badge: "NIC & Citizen Charter Grounding",
      title: "Cross-Checked Sources",
      content: "Verified Portal: bbmp.gov.in / ndma.gov.in\nOfficial Office: BBMP East Zone Mayo Hall\nTimings: 24x7 Flood Control Room (Toll-Free 1533 / 1070)\nOpen Status: OPEN NOW",
      detail: "Zero generative hallucination on phone numbers or official URLs."
    },
    {
      step: 4,
      name: "Actionable Outcome",
      badge: "Empowered Citizen",
      title: "Action Plan & Grievance Letter",
      content: "Step 1: Dial 1070 for immediate mobile dewatering pump\nStep 2: Log ticket on bbmp.gov.in (SLA: 2 hours)\nStep 3: Download pre-formatted statutory complaint letter for the Ward Executive Engineer",
      detail: "Turned panic into a concrete, 3-step citizen resolution plan."
    }
  ];

  // Auto-advance every 4 seconds if playing
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveStage(prev => (prev % stages.length) + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPlaying, stages.length]);

  const current = stages[activeStage - 1];

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header bar of demo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-teal-400">
              Live Interactive Architecture
            </span>
          </div>
          <h4 className="text-lg font-bold text-slate-100">
            How IntentBridge Transforms Problems in Real-Time
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-mono"
          >
            {isPlaying ? 'Pause Demo' : 'Auto Play'}
          </button>
        </div>
      </div>

      {/* 4 Pipeline Step Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6">
        {stages.map((stage) => {
          const isActive = stage.step === activeStage;
          return (
            <button
              key={stage.step}
              onClick={() => {
                setActiveStage(stage.step);
                setIsPlaying(false);
              }}
              className={`text-left p-3 rounded-xl border transition-all relative ${
                isActive
                  ? 'bg-slate-800/90 border-teal-500 shadow-md ring-1 ring-teal-500/30'
                  : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-700 text-slate-400'
                }`}>
                  0{stage.step}
                </span>
                {isActive && <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />}
              </div>
              <p className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                {stage.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{stage.badge}</p>
            </button>
          );
        })}
      </div>

      {/* Active Stage Showcase Card */}
      <div className="bg-slate-950/80 rounded-xl p-5 border border-slate-800 transition-all min-h-[140px] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Stage {current.step}: {current.title}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {current.badge}
            </span>
          </div>
          <div className="font-mono text-xs sm:text-sm text-slate-200 bg-slate-900/90 p-3.5 rounded-lg border border-slate-800/80 whitespace-pre-line leading-relaxed shadow-inner">
            {current.content}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span className="italic">{current.detail}</span>
          <div className="flex items-center gap-1 text-teal-400 font-semibold text-[11px]">
            <span>{current.step === 4 ? 'Cycle complete' : 'Next stage processing'}</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
};
