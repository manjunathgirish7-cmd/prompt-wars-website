import React, { useState } from 'react';
import { 
  X, 
  Laptop, 
  Smartphone, 
  Tablet, 
  Monitor, 
  ShieldCheck, 
  ShieldAlert, 
  Globe, 
  Clock, 
  Trash2, 
  Edit3, 
  Check, 
  KeyRound,
  Fingerprint
} from 'lucide-react';
import { ActiveSession } from '../types';

interface DeviceDetailsModalProps {
  session: ActiveSession | null;
  onClose: () => void;
  onToggleTrust: (sessionId: string, currentTrusted: boolean) => Promise<void>;
  onRename: (sessionId: string, newName: string) => Promise<void>;
  onRevoke: (sessionId: string) => Promise<void>;
}

export const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({
  session,
  onClose,
  onToggleTrust,
  onRename,
  onRevoke
}) => {
  if (!session) return null;

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(session.deviceName || session.device);
  const [loading, setLoading] = useState(false);

  const getDeviceIcon = () => {
    switch (session.deviceType) {
      case 'mobile': return <Smartphone className="w-6 h-6 text-teal-600 dark:text-teal-400" />;
      case 'tablet': return <Tablet className="w-6 h-6 text-teal-600 dark:text-teal-400" />;
      case 'laptop': return <Laptop className="w-6 h-6 text-teal-600 dark:text-teal-400" />;
      default: return <Monitor className="w-6 h-6 text-teal-600 dark:text-teal-400" />;
    }
  };

  const handleSaveRename = async () => {
    if (!editedName.trim()) return;
    try {
      setLoading(true);
      await onRename(session.id, editedName.trim());
      setIsEditingName(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/60 flex items-center justify-center shrink-0">
            {getDeviceIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="px-2 py-0.5 text-xs font-bold rounded-lg border border-teal-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveRename}
                    disabled={loading}
                    className="p-1 rounded-md bg-teal-600 text-white"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {session.deviceName || session.device}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Rename Device"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500">{session.os || 'Operating System'} • {session.browser}</p>
          </div>
        </div>

        {/* Authorization & Trust Status Banner */}
        <div className={`p-4 rounded-2xl border ${
          session.trusted 
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              {session.trusted ? <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" /> : <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />}
              <div>
                <span className="text-xs font-bold block">
                  {session.trusted ? 'Authorized & Trusted Device' : 'Standard Session (Unverified)'}
                </span>
                <span className="text-[11px] opacity-80 block">
                  {session.trusted 
                    ? `Protected by 30-day trust authority. Valid until ${session.trustedUntil ? new Date(session.trustedUntil).toLocaleDateString() : '30 days'}.` 
                    : 'Requires 2FA verification on subsequent logins.'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggleTrust(session.id, !session.trusted)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-colors shadow-xs ${
                session.trusted
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {session.trusted ? 'Revoke Trust' : 'Authorize Device'}
            </button>
          </div>
        </div>

        {/* Technical Details Grid */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Device ID:</span>
            <code className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {session.deviceId || session.id}
            </code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">IP Address:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{session.ip}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Location Tag:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{session.location}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Last Active:</span>
            <span className="font-medium text-teal-700 dark:text-teal-400">{session.lastActive}</span>
          </div>
          {session.current && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Current Active Browser Workstation
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          {!session.current && (
            <button
              type="button"
              onClick={() => onRevoke(session.id)}
              className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Revoke Device</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
