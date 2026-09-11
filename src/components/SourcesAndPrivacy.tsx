import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  ExternalLink, 
  CheckCircle2, 
  EyeOff, 
  AlertCircle, 
  FileCheck, 
  Clock, 
  Database,
  Compass
} from 'lucide-react';
import { fetchSourcesApi } from '../services/apiClient.js';
import { OfficialSourceItem } from '../types.js';

export const SourcesAndPrivacy: React.FC = () => {
  const [sources, setSources] = useState<OfficialSourceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSourcesApi()
      .then(res => {
        setSources(res.sources);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load sources', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in py-4">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Verified Citizen Charter & Trust Registry
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Official Sources Grounding & Privacy Commitments
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
          IntentBridge operates under a strict anti-hallucination architecture. All helplines, official URLs (.gov.in / .nic.in), opening hours, and statutory procedures are grounded against audited public sector registries and the Citizen Charter.
        </p>
      </div>

      {/* Trust & Independence Disclaimer */}
      <div className="bg-amber-50/80 rounded-2xl p-5 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold">Important Civic Independence Disclaimer</h4>
          <p className="leading-relaxed">
            IntentBridge is an independent, citizen-centric AI bridge built to simplify access to government procedures and public services. IntentBridge is <strong>not an official government agency</strong> and does not unilaterally approve applications, issue statutory documents, or file complaints without citizen consent. Always verify critical legal actions against the official portals listed below.
          </p>
        </div>
      </div>

      {/* Privacy Standards Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-600" />
            Citizen Privacy & Data Protection
          </h2>
          <p className="text-xs text-slate-500">
            How IntentBridge treats your personal statements, uploaded evidence photos, and location coordinates
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <EyeOff className="w-4 h-4 text-teal-600" />
              <span>Zero Account Surveillance</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              You do not need to register, provide your real phone number, or share Aadhaar numbers to use IntentBridge. All problem analysis runs in a private session.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Compass className="w-4 h-4 text-teal-600" />
              <span>Optional Location Permission</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              GPS location is never accessed without explicit user authorization. You can always manually type or select your municipal city from the dropdown anytime.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Database className="w-4 h-4 text-teal-600" />
              <span>Ephemeral Media Processing</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Uploaded hazard photos are analyzed in-flight by Gemini to detect road/water damage or read legal notices. Media is not stored on public servers or shared with advertisers.
            </p>
          </div>
        </div>
      </div>

      {/* Verified Government Sources Table */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Audited Official Government Portals (.gov.in / .nic.in)
            </h2>
            <p className="text-xs text-slate-500">
              Only authentic National Informatics Centre (NIC) and municipal domains are referenced
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Standard: NIC Compliance 2026
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 font-mono">
            Loading verified sources registry...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-mono text-[10px]">
                  <th className="py-2.5 pr-4">Authority / System</th>
                  <th className="py-2.5 px-4">Jurisdiction</th>
                  <th className="py-2.5 px-4">Verified Portal</th>
                  <th className="py-2.5 pl-4 text-right">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sources.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pr-4 font-bold text-slate-900">
                      {s.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {s.jurisdiction}
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-700 hover:underline flex items-center gap-1 font-mono font-semibold"
                      >
                        {s.url.replace(/^https?:\/\//, '')}
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
