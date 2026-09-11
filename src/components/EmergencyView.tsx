import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  PhoneCall, 
  ShieldAlert, 
  Flame, 
  Zap, 
  Droplets, 
  LifeBuoy, 
  CheckCircle2, 
  ArrowLeft,
  Info
} from 'lucide-react';
import { fetchEmergencyApi } from '../services/apiClient.js';
import { EmergencyContact } from '../types.js';

interface EmergencyViewProps {
  onBackToMain: () => void;
}

export const EmergencyView: React.FC<EmergencyViewProps> = ({ onBackToMain }) => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmergencyApi()
      .then(res => {
        setContacts(res.contacts);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load emergency data', err);
        setLoading(false);
      });
  }, []);

  const emergencyProtocols = [
    {
      category: 'Urban Flooding / Waterlogging',
      icon: Droplets,
      color: 'text-sky-500 bg-sky-50 border-sky-200',
      tips: [
        'Turn off main electrical breakers immediately if water enters the premises.',
        'Never walk or drive through flowing water; open drains/culverts become invisible.',
        'Boil drinking water or use water purification tablets to avoid water-borne infections.',
        'Call 1916 / 1070 for emergency tractor extraction and dewatering pumps.'
      ]
    },
    {
      category: 'Fallen Live Electric Wires',
      icon: Zap,
      color: 'text-amber-500 bg-amber-50 border-amber-200',
      tips: [
        'Stay at least 35 feet (10 meters) away from any fallen or sparking electrical wires.',
        'Do not touch damp metal fences, gates, or lampposts in the vicinity.',
        'Call 1912 immediately to demand emergency feeder line trip from the substation.'
      ]
    },
    {
      category: 'Fire / Gas Leak / Building Structural Hazard',
      icon: Flame,
      color: 'text-red-500 bg-red-50 border-red-200',
      tips: [
        'Evacuate immediately via stairwells; never use elevators during fire alarms.',
        'Do not operate electrical switches or strike matches if you smell LPG/gas.',
        'Call 101 / 112 with exact building name, cross street, and trapped occupant count.'
      ]
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in py-4">
      {/* Emergency Alert Banner */}
      <div className="bg-red-600 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-red-700 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-7 h-7 text-white animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-white/20 text-xs font-extrabold uppercase tracking-wider mb-2 font-mono">
                Priority 1 Civic & Disaster Dispatch
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Emergency Civic Assistance
              </h1>
              <p className="text-xs sm:text-sm text-red-100 max-w-2xl mt-1 leading-relaxed">
                For active disasters, severe flooding, gas leaks, sparking lines, or life safety hazards. Use verified toll-free helplines below for immediate rescue and municipal intervention.
              </p>
            </div>
          </div>

          <button
            onClick={onBackToMain}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-2 self-start sm:self-center border border-white/20 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Console</span>
          </button>
        </div>
      </div>

      {/* Grid of Verified Emergency Numbers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Verified Emergency Call Directory
            </h2>
            <p className="text-xs text-slate-500">
              Government-monitored 24x7 control rooms with toll-free priority routing
            </p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            All 24x7 Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-100">
                    {c.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {c.hours}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  {c.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {c.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Dial Direct
                  </span>
                  <span className="text-lg font-black text-slate-900 font-mono tracking-wider">
                    {c.number}
                  </span>
                </div>

                <a
                  href={`tel:${c.number.replace(/[^0-9]/g, '')}`}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-teal-400" />
                  <span>Call</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Protocols Guide */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-1">
            Immediate Citizen Safety Action Guides
          </h2>
          <p className="text-xs text-slate-500">
            What to do in the first 15 minutes of a civic hazard while rescue teams are en route
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {emergencyProtocols.map((protocol, idx) => {
            const IconComp = protocol.icon;
            return (
              <div key={idx} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg ${protocol.color} border flex items-center justify-center`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 leading-tight">
                    {protocol.category}
                  </h3>
                </div>

                <ul className="space-y-2 text-xs text-slate-600">
                  {protocol.tips.map((tip, tIdx) => (
                    <li key={tIdx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Dispatcher Checklist Card */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-2">
          <h4 className="font-bold flex items-center gap-1.5 text-amber-950">
            <Info className="w-4 h-4 text-amber-700" />
            What to tell the emergency operator when they answer:
          </h4>
          <p className="leading-relaxed">
            1. <strong>Exact Landmark:</strong> Street name, nearest landmark / junction, building number.<br />
            2. <strong>Nature of Hazard:</strong> Rising water, trapped elders/children, open live wire sparking, gas smell.<br />
            3. <strong>Immediate Danger:</strong> Any injuries or people trapped in basements.
          </p>
        </div>
      </div>
    </div>
  );
};
