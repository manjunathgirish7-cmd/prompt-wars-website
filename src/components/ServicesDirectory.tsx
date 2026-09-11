import React, { useState, useEffect } from 'react';
import { 
  Search, 
  BookOpen, 
  ExternalLink, 
  Clock, 
  FileText, 
  ArrowRight, 
  Filter, 
  CheckCircle2, 
  Sparkles,
  Building,
  ShieldCheck,
  ChevronDown,
  X
} from 'lucide-react';
import { fetchServicesApi } from '../services/apiClient.js';
import { GovernmentService } from '../types.js';

interface ServicesDirectoryProps {
  onSelectServiceForAI: (service: GovernmentService) => void;
}

export const ServicesDirectory: React.FC<ServicesDirectoryProps> = ({ onSelectServiceForAI }) => {
  const [services, setServices] = useState<GovernmentService[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [activeModalService, setActiveModalService] = useState<GovernmentService | null>(null);

  const categories = [
    'All',
    'Civic Infrastructure',
    'Identity & Documents',
    'Disaster & Emergency',
    'Public Grievance',
    'Revenue & Land',
    'Transport & RTO',
    'Water & Utilities'
  ];

  useEffect(() => {
    loadServices();
  }, [selectedCategory]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await fetchServicesApi(selectedCategory, searchQuery);
      setServices(data);
    } catch (err) {
      console.error('Error fetching services', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadServices();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in py-4">
      {/* Directory Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-xs font-bold mb-2">
              <BookOpen className="w-3.5 h-3.5 text-teal-600" />
              Verified Citizen Services Directory
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Official Government Services & Procedures
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Cross-checked against the National Citizen Charter and official municipal portals (.gov.in). Find required documents, processing fees, SLAs, and official application portals.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
              {services.length} Services Catalogued
            </span>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services (e.g., 'Aadhaar address update', 'pothole', 'property tax', 'water leak')..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none bg-slate-50/50"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
            >
              Search
            </button>
          </form>

          {/* Categories Horizontal Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 font-mono text-xs">
          Loading verified government services...
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <p className="text-slate-600 text-sm font-semibold mb-2">
            No specific service found matching your query.
          </p>
          <p className="text-slate-400 text-xs mb-4">
            Try searching with broader terms or use IntentBridge AI to automatically map your natural description.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-teal-400 hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {srv.category}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Verified
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors mb-1.5">
                  {srv.name}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                  {srv.description}
                </p>

                <div className="space-y-1.5 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4">
                  <div className="flex items-center justify-between">
                    <span>Authority Level:</span>
                    <strong className="text-slate-700">{srv.level}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Target SLA:</span>
                    <strong className="text-slate-700">{srv.turnaroundTime}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Statutory Fee:</span>
                    <strong className="text-slate-700">{srv.feeStructure}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setActiveModalService(srv)}
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  View Details & Docs
                </button>

                <button
                  onClick={() => onSelectServiceForAI(srv)}
                  className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold flex items-center gap-1 transition-colors"
                  title="Ask IntentBridge AI to solve this for you"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Solve with AI</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service Detail Modal */}
      {activeModalService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {activeModalService.category}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  {activeModalService.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalService(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Service Description</h4>
                <p className="text-slate-600 leading-relaxed">{activeModalService.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <div>
                  <span className="text-slate-400 block mb-0.5">Official Portal</span>
                  <a
                    href={activeModalService.officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-teal-700 hover:underline flex items-center gap-1"
                  >
                    {activeModalService.portalName}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Toll-Free Helpline</span>
                  <span className="font-bold text-slate-900 font-mono">{activeModalService.helplinePhone || '1800-NIC-CITIZEN'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Citizen Charter SLA</span>
                  <span className="font-bold text-slate-900">{activeModalService.turnaroundTime}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Official Fee</span>
                  <span className="font-bold text-slate-900">{activeModalService.feeStructure}</span>
                </div>
              </div>

              {/* Required Documents */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Mandatory Documents Checklist:</h4>
                <div className="space-y-1.5">
                  {activeModalService.requiredDocuments.map((doc, dIdx) => (
                    <div key={dIdx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900">{doc.name}</span>
                        {doc.mandatory && (
                          <span className="ml-2 text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded">
                            Required
                          </span>
                        )}
                        <p className="text-[11px] text-slate-500 mt-0.5">{doc.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Procedure Steps */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Official Procedural Steps:</h4>
                <div className="space-y-2">
                  {activeModalService.procedures.map((proc, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {proc.step || sIdx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">{proc.title}</p>
                        <p className="text-slate-700 leading-normal">{proc.instruction}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <a
                href={activeModalService.officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
              >
                <span>Visit Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => {
                  const s = activeModalService;
                  setActiveModalService(null);
                  onSelectServiceForAI(s);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Solve This with IntentBridge AI</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
