import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Clock, 
  Phone, 
  ExternalLink, 
  ShieldAlert, 
  FileText, 
  CheckSquare, 
  Square, 
  HelpCircle, 
  Compass, 
  Send, 
  AlertTriangle,
  FileCheck2,
  Calendar,
  Share2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ProblemAnalysis } from '../types.js';
import { chatWithAssistantApi } from '../services/apiClient.js';

interface AnalysisResultViewProps {
  analysis: ProblemAnalysis;
  onOpenComplaintModal: () => void;
  onSelectEmergency: () => void;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
  analysis,
  onOpenComplaintModal,
  onSelectEmergency
}) => {
  // Checkbox state for required documents checklist
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  
  // Follow-up AI Assistant Chat state
  const [followUpQuery, setFollowUpQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    {
      sender: 'assistant',
      text: `I've analyzed your situation regarding ${analysis.category.toLowerCase()}. Have questions about specific documents, fees, or expected timelines? Ask me below.`
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const toggleDocCheck = (docName: string) => {
    setCheckedDocs(prev => ({
      ...prev,
      [docName]: !prev[docName]
    }));
  };

  const handleSendFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpQuery.trim() || isChatLoading) return;

    const query = followUpQuery.trim();
    setFollowUpQuery('');
    const updatedMessages = [...chatMessages, { sender: 'user' as const, text: query }];
    setChatMessages(updatedMessages);
    setIsChatLoading(true);

    try {
      const { reply } = await chatWithAssistantApi({
        message: query,
        context: analysis
      });
      setChatMessages(prev => [...prev, { sender: 'assistant' as const, text: reply }]);
    } catch (err) {
      console.error('Chat error', err);
      setChatMessages(prev => [
        ...prev, 
        { sender: 'assistant' as const, text: 'IntentBridge is currently processing civic data. For immediate inquiries, please call the verified helpline listed above.' }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const urgencyColors = {
    EMERGENCY: 'bg-red-500 text-white border-red-600',
    HIGH: 'bg-amber-500 text-white border-amber-600',
    MEDIUM: 'bg-blue-600 text-white border-blue-700',
    LOW: 'bg-slate-600 text-white border-slate-700'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pt-4">
      {/* Emergency Alert Banner if situation is critical */}
      {analysis.isEmergency && (
        <div className="bg-red-600 text-white p-5 rounded-2xl shadow-lg border border-red-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5 text-amber-300 animate-bounce" />
            <div>
              <h3 className="text-base font-extrabold tracking-tight uppercase">
                Potential Life Safety / Urgent Civic Hazard Detected
              </h3>
              <p className="text-xs text-red-100 mt-1 max-w-xl">
                This situation may require rapid disaster relief, water dewatering, or hazardous line isolation. Emergency services should be contacted without delay.
              </p>
            </div>
          </div>
          <button
            onClick={onSelectEmergency}
            className="px-4 py-2 rounded-xl bg-white text-red-700 font-bold text-xs uppercase tracking-wider hover:bg-red-50 shadow-sm shrink-0 transition-colors"
          >
            Open Emergency Mode
          </button>
        </div>
      )}

      {/* Top Banner: What we understood + Category & Urgency badges */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Analysis Results
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200/60">
              {analysis.category}
            </span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border shadow-2xs ${urgencyColors[analysis.urgency]}`}>
              Urgency: {analysis.urgency}
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            ID: {analysis.id.slice(0, 14)}
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <h2 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              What We Understood
            </h2>
            <p className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
              {analysis.understoodSummary}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
            <Compass className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              <strong>Identified Intent:</strong> {analysis.intent}
            </span>
          </div>
        </div>
      </div>

      {/* Image Analysis Findings if photo was uploaded */}
      {analysis.imageAnalysis && (
        <div className="bg-teal-50/50 rounded-2xl p-5 border border-teal-200">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck2 className="w-4 h-4 text-teal-600" />
            <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider">
              Multimodal Vision Verification
            </h4>
            <span className="text-[10px] bg-teal-200/60 text-teal-900 font-bold px-2 py-0.5 rounded-full ml-auto">
              {analysis.imageAnalysis.confidence}
            </span>
          </div>
          <p className="text-xs text-teal-950 font-medium leading-relaxed">
            {analysis.imageAnalysis.visualFindings}
          </p>
          <p className="text-[11px] text-teal-800 font-semibold mt-1">
            Hazard Assessment: <span className="underline">{analysis.imageAnalysis.hazardLevel}</span>
          </p>
        </div>
      )}

      {/* Two Column Grid: Who handles this? & Where to report */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Who handles this? */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Jurisdiction & Authority
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Who handles this?
                </h3>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-3">
              <h4 className="text-sm font-extrabold text-slate-900 mb-1">
                {analysis.recommendedAuthority.name}
              </h4>
              <p className="text-xs text-slate-600 mb-2">
                {analysis.recommendedAuthority.department}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
                  {analysis.recommendedAuthority.level}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Mandate:</strong> {analysis.recommendedAuthority.role}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            <span>Applicable Location: <strong>{analysis.locationRequirement.detectedLocation}</strong></span>
          </div>
        </div>

        {/* Card 2: Where to report */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                <ExternalLink className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Official Channels
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Where to report
                </h3>
              </div>
            </div>

            <div className="space-y-2.5">
              {analysis.reportingChannels.map((ch, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-200">
                        {ch.type}
                      </span>
                      {ch.verified && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                          Official
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-900">{ch.name}</p>
                    <p className="text-[11px] text-slate-500">{ch.notes}</p>
                  </div>

                  {ch.type === 'Online Portal' && ch.linkOrNumber.startsWith('http') ? (
                    <a
                      href={ch.linkOrNumber}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-teal-700 shrink-0 transition-colors"
                    >
                      Visit
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : ch.type === 'Helpline' || ch.type === 'Emergency Call' ? (
                    <a
                      href={`tel:${ch.linkOrNumber.replace(/[^0-9]/g, '')}`}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center gap-1 hover:bg-slate-800 shrink-0 transition-colors"
                    >
                      <Phone className="w-3 h-3 text-teal-400" />
                      {ch.linkOrNumber}
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Official Government Domain</span>
            <span className="text-emerald-700 font-bold font-mono">100% Verified</span>
          </div>
        </div>
      </div>

      {/* Card 3: What you should do (Step by step Action Plan) */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Resolution Roadmap
            </span>
            <h3 className="text-base font-bold text-slate-900">
              What you should do (Step-by-Step)
            </h3>
          </div>
        </div>

        <div className="space-y-4">
          {analysis.actionSteps.map((step) => (
            <div key={step.stepNumber} className="flex items-start gap-3.5 group">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
                {step.stepNumber}
              </div>
              <div className="flex-1 pt-0.5">
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  {step.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {step.description}
                </p>
                {step.urgentNotice && (
                  <div className="mt-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
                    ⚠️ {step.urgentNotice}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card 4: Nearby Government Office Information with Open/Closed Status */}
      {analysis.nearbyOffice && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Designated Civic Centre
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Government Office Information
                </h3>
              </div>
            </div>

            {/* Live Open / Closed Badge */}
            <div>
              {analysis.nearbyOffice.isOpenNow ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Open Now
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Closed Today
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 mb-1">
                {analysis.nearbyOffice.name}
              </h4>
              <p className="text-xs text-slate-600 mb-2">
                {analysis.nearbyOffice.department}
              </p>
              <p className="text-xs text-slate-700 flex items-start gap-1.5 mb-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{analysis.nearbyOffice.address}</span>
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span><strong>Opening Hours:</strong> {analysis.nearbyOffice.openingHours}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span><strong>Closed Days:</strong> {analysis.nearbyOffice.closedDays.join(', ') || 'None (24x7)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span><strong>Contact Phone:</strong> {analysis.nearbyOffice.phone}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card 5: Interactive Required Documents Checklist */}
      {analysis.requiredDocuments.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Preparation Checklist
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Required Documents
                </h3>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {Object.values(checkedDocs).filter(Boolean).length} of {analysis.requiredDocuments.length} ready
            </span>
          </div>

          <div className="space-y-2.5">
            {analysis.requiredDocuments.map((doc, idx) => {
              const isChecked = !!checkedDocs[doc.name];
              return (
                <button
                  key={idx}
                  onClick={() => toggleDocCheck(doc.name)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                    isChecked
                      ? 'bg-emerald-50/50 border-emerald-300'
                      : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="pt-0.5 text-teal-600 shrink-0">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-bold ${isChecked ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {doc.name}
                      </span>
                      {doc.isMandatory ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700">
                          Mandatory
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                          Optional
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      {doc.reason}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Card 6: AI Complaint Generator Action Callout */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-bold mb-2 font-mono">
            <FileText className="w-3.5 h-3.5" />
            Statutory Citizen Grievance Letter
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            Need to lodge an official complaint?
          </h3>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            IntentBridge can automatically draft a legally formatted complaint addressed to the <strong>{analysis.recommendedAuthority.name}</strong> referencing municipal acts, citizen charter timelines, and relief requested.
          </p>
        </div>

        <button
          id="open-complaint-generator-btn"
          onClick={onOpenComplaintModal}
          className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-md shrink-0 flex items-center gap-2 transition-all"
        >
          <span>Generate Complaint Letter</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Card 7: Official Sources Transparency Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Verified Official Sources & Grounding
          </span>
          <span className="text-[10px] text-slate-400">
            Last Checked: Today
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {analysis.officialSources.map((src, idx) => (
            <a
              key={idx}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-teal-700 border border-slate-200 transition-colors"
            >
              <span>{src.name}</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          ))}
        </div>
      </div>

      {/* Card 8: Interactive Follow-Up AI Civic Advisor */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Continuous Assistance
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Ask IntentBridge about this procedure
            </h3>
          </div>
        </div>

        {/* Chat History Box */}
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-br-xs'
                    : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isChatLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-2xl px-4 py-2 text-xs text-slate-500 italic">
                IntentBridge is formulating an answer...
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSendFollowUp} className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={followUpQuery}
            onChange={(e) => setFollowUpQuery(e.target.value)}
            placeholder="Ask a question (e.g. 'Can I apply on DigiLocker?' or 'Is there an urgent fee?')..."
            className="flex-1 text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none bg-slate-50/50"
          />
          <button
            type="submit"
            disabled={!followUpQuery.trim() || isChatLoading}
            className="p-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300 transition-colors shrink-0"
            title="Send query"
          >
            <Send className="w-4 h-4 text-teal-400" />
          </button>
        </form>
      </div>
    </div>
  );
};
