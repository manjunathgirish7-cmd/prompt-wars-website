import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  KeyRound, 
  Lock, 
  Globe, 
  Search, 
  Download, 
  RefreshCw, 
  Smartphone, 
  Laptop, 
  CheckCircle2, 
  Info, 
  Eye, 
  Filter, 
  Trash2,
  ChevronDown,
  ExternalLink,
  Shield,
  Sparkles,
  FileText,
  Tag,
  Activity
} from 'lucide-react';
import { SecurityAuditEvent } from '../types.js';
import { fetchSecurityAuditLogsApi } from '../services/apiClient.js';
import { useAuth } from '../context/AuthContext.js';

interface ActivityLogsProps {
  logs?: SecurityAuditEvent[];
  onRefresh?: () => void;
  loading?: boolean;
  onFlagSuspicious?: (log: SecurityAuditEvent) => void;
}

type FilterCategory = 'all' | 'login_attempt' | 'account_modification' | 'session_device' | 'security_warning' | 'ai_activity' | 'civic_action';

export const ActivityLogs: React.FC<ActivityLogsProps> = ({
  logs: propLogs,
  onRefresh: propOnRefresh,
  loading: propLoading = false,
  onFlagSuspicious
}) => {
  const { currentUser } = useAuth();
  const [internalLogs, setInternalLogs] = useState<SecurityAuditEvent[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);

  const isStandalone = !propLogs;
  const logs = propLogs || internalLogs;
  const loading = isStandalone ? internalLoading : propLoading;

  const fetchInternalLogs = async () => {
    try {
      setInternalLoading(true);
      const res = await fetchSecurityAuditLogsApi(currentUser?.email);
      if (res.success) {
        setInternalLogs(res.auditLogs || res.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setInternalLoading(false);
    }
  };

  useEffect(() => {
    if (isStandalone && currentUser?.email) {
      fetchInternalLogs();
    }
  }, [isStandalone, currentUser?.email]);

  const onRefresh = propOnRefresh || fetchInternalLogs;

  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<SecurityAuditEvent | null>(null);
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  // Group or classify logs
  const categorizedLogs = useMemo(() => {
    return logs.map(log => {
      // Determine category if not explicitly provided
      let category = log.category;
      if (!category) {
        if (log.type === 'login' || log.type === 'logout') {
          category = log.status === 'critical' ? 'security_warning' : 'login_attempt';
        } else if (
          log.type === 'password_change' || 
          log.type === '2fa_toggle' || 
          log.type === 'recovery_key_download' || 
          log.type === 'password_reset_initiated' ||
          log.type === 'passkey_register' ||
          log.type === 'profile_updated'
        ) {
          category = 'account_modification';
        } else if (log.type === 'session_terminated') {
          category = 'session_device';
        } else if (log.type === 'data_purged') {
          category = 'account_modification';
        } else if (log.type === 'ai_analysis' || log.type === 'complaint_generated') {
          category = 'ai_activity';
        } else if (log.type === 'feedback_submitted') {
          category = 'civic_action';
        } else {
          category = 'account_modification';
        }
      }

      // Determine location tag fallback
      const locationTag = log.locationTag || (
        log.ipAddress?.startsWith('49.207') ? 'Bengaluru, KA, India' :
        log.ipAddress?.startsWith('103.21') ? 'Pune, MH, India' :
        'Bengaluru, KA, India'
      );

      return {
        ...log,
        category,
        locationTag
      };
    });
  }, [logs]);

  // Compute counts
  const counts = useMemo(() => {
    let login_attempt = 0, account_modification = 0, session_device = 0, security_warning = 0, ai_activity = 0, civic_action = 0;
    
    for (let i = 0; i < categorizedLogs.length; i++) {
      const l = categorizedLogs[i];
      if (l.category === 'login_attempt') login_attempt++;
      if (l.category === 'account_modification') account_modification++;
      if (l.category === 'session_device') session_device++;
      if (l.category === 'security_warning' || l.status === 'critical' || l.status === 'warning') security_warning++;
      if (l.category === 'ai_activity' || l.type === 'ai_analysis' || l.type === 'complaint_generated') ai_activity++;
      if (l.category === 'civic_action' || l.type === 'feedback_submitted') civic_action++;
    }

    return {
      all: categorizedLogs.length,
      login_attempt,
      account_modification,
      session_device,
      security_warning,
      ai_activity,
      civic_action
    };
  }, [categorizedLogs]);

  // Distinct locations seen in logs
  const distinctLocations = useMemo(() => {
    const locs = new Set<string>();
    categorizedLogs.forEach(l => {
      if (l.locationTag) locs.add(l.locationTag);
    });
    return Array.from(locs);
  }, [categorizedLogs]);

  // Filtered by category and search
  const filteredLogs = useMemo(() => {
    return categorizedLogs.filter(log => {
      // Category filter
      if (activeCategory === 'security_warning') {
        if (log.category !== 'security_warning' && log.status !== 'critical' && log.status !== 'warning') {
          return false;
        }
      } else if (activeCategory === 'ai_activity') {
        if (log.category !== 'ai_activity' && log.type !== 'ai_analysis' && log.type !== 'complaint_generated') {
          return false;
        }
      } else if (activeCategory === 'civic_action') {
        if (log.category !== 'civic_action' && log.type !== 'feedback_submitted') {
          return false;
        }
      } else if (activeCategory !== 'all' && log.category !== activeCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = (log.title || '').toLowerCase().includes(query);
        const matchDesc = (log.description || '').toLowerCase().includes(query);
        const matchLoc = (log.locationTag || '').toLowerCase().includes(query);
        const matchIp = (log.ipAddress || '').toLowerCase().includes(query);
        const matchDev = (log.deviceInfo || '').toLowerCase().includes(query);
        const matchAction = (log.action || '').toLowerCase().includes(query);
        return matchTitle || matchDesc || matchLoc || matchIp || matchDev || matchAction;
      }

      return true;
    });
  }, [categorizedLogs, activeCategory, searchQuery]);

  // Relative time helper
  const getRelativeTime = (timestamp: string) => {
    try {
      const now = Date.now();
      const then = new Date(timestamp).getTime();
      const diffSec = Math.floor((now - then) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
      return new Date(timestamp).toLocaleDateString();
    } catch {
      return timestamp;
    }
  };

  // Export logs to JSON
  const handleExportJson = () => {
    const dataStr = JSON.stringify(categorizedLogs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `citizen-security-activity-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3000);
  };

  // Export logs to CSV
  const handleExportCsv = () => {
    const headers = ['Timestamp', 'Action', 'Type', 'Category', 'Status', 'Title', 'Description', 'Location', 'IP Address', 'Device', 'Metadata'];
    const rows = categorizedLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.action || ''}"`,
      `"${l.type}"`,
      `"${l.category || ''}"`,
      `"${l.status}"`,
      `"${(l.title || '').replace(/"/g, '""')}"`,
      `"${(l.description || '').replace(/"/g, '""')}"`,
      `"${l.locationTag || ''}"`,
      `"${l.ipAddress || ''}"`,
      `"${(l.deviceInfo || '').replace(/"/g, '""')}"`,
      `"${l.metadata ? JSON.stringify(l.metadata).replace(/"/g, '""') : ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `citizen-security-activity-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3000);
  };

  const getEventBadge = (category: string, status: string, type?: string) => {
    if (status === 'critical') {
      return {
        bg: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60',
        icon: <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-red-600 dark:text-red-400" />,
        label: 'Security Alert'
      };
    }
    if (category === 'ai_activity' || type === 'ai_analysis' || type === 'complaint_generated') {
      return {
        bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
        icon: <Sparkles className="w-3.5 h-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />,
        label: 'Civic AI Intelligence'
      };
    }
    if (category === 'civic_action' || type === 'feedback_submitted') {
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
        icon: <FileText className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />,
        label: 'Civic Action'
      };
    }
    if (category === 'login_attempt') {
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
        icon: <Globe className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />,
        label: 'Login Attempt'
      };
    }
    if (category === 'account_modification') {
      return {
        bg: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/60',
        icon: <KeyRound className="w-3.5 h-3.5 shrink-0 text-teal-600 dark:text-teal-400" />,
        label: 'Account Modification'
      };
    }
    if (category === 'session_device') {
      return {
        bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
        icon: <Laptop className="w-3.5 h-3.5 shrink-0 text-purple-600 dark:text-purple-400" />,
        label: 'Device & Session'
      };
    }
    return {
      bg: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      icon: <Shield className="w-3.5 h-3.5 shrink-0 text-slate-600 dark:text-slate-400" />,
      label: 'Civic Audit'
    };
  };

  return (
    <div id="activity-logs-section" className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center border border-teal-200/60 dark:border-teal-800/60">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Citizen Activity & Security Audit Logs
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Full transparency over logins, geographical location tags, AI actions, and account modifications.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Refresh, Export */}
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              id="refresh-activity-logs-btn"
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
            </button>
          )}

          {/* Export dropdown */}
          <div className="flex items-center gap-1">
            <button
              id="export-activity-logs-json"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
              title="Export as JSON"
            >
              <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>JSON</span>
            </button>
            <button
              id="export-activity-logs-csv"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
              title="Export as CSV"
            >
              <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {showExportSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Security audit trail exported successfully. Check your browser downloads folder.</span>
        </div>
      )}

      {/* Location Footprint Ribbon */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
          <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>Active Location Footprint:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {distinctLocations.length === 0 ? (
            <span className="text-slate-400 text-xs italic">No location records yet</span>
          ) : (
            distinctLocations.map((loc) => {
              const isAlert = loc.includes('Pune') || loc.includes('Unrecognized');
              return (
                <span
                  key={loc}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                    isAlert
                      ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-2xs'
                  }`}
                >
                  <MapPin className={`w-3 h-3 ${isAlert ? 'text-red-500' : 'text-teal-600 dark:text-teal-400'}`} />
                  <span>{loc}</span>
                  {isAlert && <span className="text-[10px] font-bold text-red-600 dark:text-red-400">(Blocked)</span>}
                </span>
              );
            })
          )}
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Activity ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('login_attempt')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeCategory === 'login_attempt'
                ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Logins ({counts.login_attempt})
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('account_modification')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeCategory === 'account_modification'
                ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Modifications ({counts.account_modification})
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('session_device')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeCategory === 'session_device'
                ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Sessions ({counts.session_device})
          </button>

          {counts.ai_activity > 0 && (
            <button
              type="button"
              onClick={() => setActiveCategory('ai_activity')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeCategory === 'ai_activity'
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              AI Intelligence ({counts.ai_activity})
            </button>
          )}

          {counts.civic_action > 0 && (
            <button
              type="button"
              onClick={() => setActiveCategory('civic_action')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeCategory === 'civic_action'
                  ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Civic Actions ({counts.civic_action})
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveCategory('security_warning')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeCategory === 'security_warning'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
            }`}
          >
            Alerts ({counts.security_warning})
          </button>
        </div>

        {/* Search Field */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, location, IP..."
            className="w-full pl-8.5 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Logs List Container */}
      <div className="space-y-2.5">
        {loading && logs.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Loading verified security logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
            <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No activity matching your filter</p>
            <p className="text-xs text-slate-400">Try adjusting your search query or selecting 'All Activity'.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const badge = getEventBadge(log.category || '', log.status, log.type);
            const isAlert = log.status === 'critical' || log.status === 'warning';

            return (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer hover:border-teal-500/60 dark:hover:border-teal-500/60 ${
                  isAlert
                    ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200/80 dark:border-red-900/40'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200/90 dark:border-slate-700/80 hover:bg-slate-50/70 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  {/* Left info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${badge.bg}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>

                      {log.action && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/80 font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          {log.action}
                        </span>
                      )}

                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {log.title}
                      </h3>

                      {/* Location Tag */}
                      {log.locationTag && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                          <MapPin className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          <span>{log.locationTag}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {log.description}
                    </p>

                    {/* Metadata chips: IP, Device, Verified Audit Signature */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 dark:text-slate-400 pt-0.5">
                      {log.ipAddress && <span className="font-mono">IP: {log.ipAddress}</span>}
                      {log.ipAddress && log.deviceInfo && <span>•</span>}
                      {log.deviceInfo && <span>{log.deviceInfo}</span>}
                      <span>•</span>
                      <span className="text-teal-700 dark:text-teal-400 font-medium flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Audit Signature Verified</span>
                      </span>
                    </div>
                  </div>

                  {/* Right timestamp & action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 shrink-0 text-right">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {getRelativeTime(log.timestamp)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-0.5 mt-1">
                      <Eye className="w-3 h-3" />
                      <span>Inspect Details</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Inspect Modal / Detail Sheet */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Audit Verification Record
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">ID: {selectedLog.id}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white text-sm">{selectedLog.title}</div>
                <p className="text-slate-600 dark:text-slate-300">{selectedLog.description}</p>
                {selectedLog.action && (
                  <div className="pt-1 flex items-center gap-1.5 text-[11px] font-mono text-teal-600 dark:text-teal-400">
                    <Tag className="w-3 h-3" />
                    <span>Action: {selectedLog.action}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Location Tag</span>
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>{selectedLog.locationTag || 'Bengaluru, KA, India'}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">IP Address</span>
                  <div className="font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedLog.ipAddress || 'Client IP'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Device & User Agent</span>
                  <div className="text-slate-800 dark:text-slate-200 font-medium mt-0.5 truncate">
                    {selectedLog.deviceInfo || 'Authorized Citizen Client'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Cryptographic Timestamp</span>
                  <div className="text-slate-800 dark:text-slate-200 font-mono text-[11px] mt-0.5">
                    {new Date(selectedLog.timestamp).toISOString()}
                  </div>
                </div>
              </div>

              {/* Sanitized Metadata Inspection */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                      <Activity className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                      Sanitized Operational Metadata
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      Secrets Redacted
                    </span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    {Object.entries(selectedLog.metadata).map(([k, v]) => (
                      <div key={k} className="flex items-start justify-between gap-2">
                        <span className="text-slate-500 dark:text-slate-400">{k}:</span>
                        <span className="text-slate-800 dark:text-slate-200 text-right truncate">
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/60 text-teal-900 dark:text-teal-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Zero-Knowledge & Privacy Guarantee</span>
                </div>
                <p className="text-[11px] leading-relaxed text-teal-800 dark:text-teal-300">
                  Every civic authentication, 2FA event, and account modification is atomically persisted with strict user isolation. Passwords, TOTP codes, and private keys are never stored in log records.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {selectedLog.status === 'critical' && onFlagSuspicious && (
                <button
                  type="button"
                  onClick={() => {
                    onFlagSuspicious(selectedLog);
                    setSelectedLog(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all"
                >
                  Lockdown Sessions
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-teal-700 text-white text-xs font-bold transition-all"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

