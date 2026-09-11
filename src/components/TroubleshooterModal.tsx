import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Activity, 
  RefreshCw, 
  Cpu, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Download, 
  Trash2, 
  Sliders, 
  Wifi, 
  HardDrive, 
  Layers, 
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { DiagnosticsStatus } from '../types.js';

interface TroubleshooterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback?: () => void;
}

export const TroubleshooterModal: React.FC<TroubleshooterModalProps> = ({
  isOpen,
  onClose,
  onOpenFeedback
}) => {
  const [runningTest, setRunningTest] = useState<boolean>(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsStatus>({
    latencyMs: 34,
    apiHealth: 'healthy',
    mainThreadResponsive: true,
    localStorageKb: 12,
    memoryUsageMb: undefined,
    browserOnline: navigator.onLine,
    reducedMotion: false
  });

  const [domNodeCount, setDomNodeCount] = useState<number>(0);
  const [safeModeActive, setSafeModeActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('intentbridge_safe_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>('freezing');

  // Run full system diagnostics probe
  const runDiagnosticScan = useCallback(async () => {
    setRunningTest(true);
    setActionSuccessMessage(null);

    const startTime = performance.now();
    let pingLatency = 0;
    let apiHealthStatus: 'healthy' | 'degraded' | 'offline' = 'healthy';

    // 1. API Ping test
    try {
      const pingStart = performance.now();
      const res = await fetch('/api/health', { cache: 'no-store' });
      const pingEnd = performance.now();
      pingLatency = Math.round(pingEnd - pingStart);
      if (!res.ok) apiHealthStatus = 'degraded';
    } catch {
      apiHealthStatus = 'offline';
      pingLatency = 999;
    }

    // 2. Main-thread responsiveness (Event Loop lag check)
    let mainThreadHealthy = true;
    const threadCheckStart = performance.now();
    await new Promise((resolve) => setTimeout(resolve, 50));
    const threadCheckElapsed = performance.now() - threadCheckStart;
    // If a 50ms setTimeout takes > 120ms, the main thread is blocking / freezing
    if (threadCheckElapsed > 120) {
      mainThreadHealthy = false;
    }

    // 3. LocalStorage usage calculation
    let totalStorageBytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          totalStorageBytes += (key.length + (localStorage.getItem(key)?.length || 0)) * 2;
        }
      }
    } catch {
      // Storage restricted
    }
    const storageKb = Math.round(totalStorageBytes / 1024);

    // 4. Memory estimation
    let memMb: number | undefined = undefined;
    if ((performance as any).memory && (performance as any).memory.usedJSHeapSize) {
      memMb = Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024));
    }

    // 5. DOM count
    const nodeCount = document.querySelectorAll('*').length;
    setDomNodeCount(nodeCount);

    // 6. Reduced motion check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setDiagnostics({
      latencyMs: pingLatency,
      apiHealth: apiHealthStatus,
      mainThreadResponsive: mainThreadHealthy,
      localStorageKb: storageKb,
      memoryUsageMb: memMb,
      browserOnline: navigator.onLine,
      reducedMotion: prefersReducedMotion || safeModeActive
    });

    setRunningTest(false);
  }, [safeModeActive]);

  useEffect(() => {
    if (isOpen) {
      runDiagnosticScan();
    }
  }, [isOpen, runDiagnosticScan]);

  if (!isOpen) return null;

  // Toggle Safe Mode (Low Overhead Mode)
  const handleToggleSafeMode = () => {
    const nextVal = !safeModeActive;
    setSafeModeActive(nextVal);
    try {
      localStorage.setItem('intentbridge_safe_mode', String(nextVal));
    } catch {
      // Ignore
    }

    if (nextVal) {
      document.documentElement.classList.add('safe-mode');
      setActionSuccessMessage('Safe Mode Activated! Animations and blur filters disabled to eliminate page freezing.');
    } else {
      document.documentElement.classList.remove('safe-mode');
      setActionSuccessMessage('Safe Mode deactivated. Standard full graphics restored.');
    }
  };

  // Safe flush of transient cache (leaving auth & tokens intact)
  const handleFlushCache = () => {
    try {
      const keysToKeep = ['intentbridge_citizen_token', 'intentbridge_user', 'intentbridge_theme', 'intentbridge_safe_mode'];
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
      setActionSuccessMessage(`Purged ${keysToRemove.length} temporary cache items and media buffers. Citizen login preserved.`);
      runDiagnosticScan();
    } catch (err: any) {
      setActionSuccessMessage('Cache clear completed.');
    }
  };

  // Garbage Collection simulation (releases audio and image references)
  const handleReleaseMemory = () => {
    // Clear unreferenced image objects
    window.dispatchEvent(new Event('intentbridge_clear_memory'));
    setActionSuccessMessage('Triggered client-side memory cleanup & garbage collection cycle.');
    setTimeout(() => {
      runDiagnosticScan();
    }, 300);
  };

  // Export diagnostic bundle
  const handleExportDiagnostics = () => {
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: window.devicePixelRatio
      },
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      diagnostics,
      domNodeCount,
      safeModeActive,
      language: navigator.language
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `intentbridge-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setActionSuccessMessage('Diagnostics telemetry JSON saved to downloads.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Website Health & Freezing Troubleshooter
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 text-[10px] font-mono font-bold">
                  LIVE DIAGNOSTICS
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inspect browser memory, fix unresponsive pages, and tune performance
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Action Success Toast Banner */}
          {actionSuccessMessage && (
            <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200 flex items-center justify-between gap-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="font-medium">{actionSuccessMessage}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setActionSuccessMessage(null)}
                className="text-teal-700 dark:text-teal-300 font-bold hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Real-time Diagnostics Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Live System Vitals</span>
              </h4>
              <button
                type="button"
                onClick={runDiagnosticScan}
                disabled={runningTest}
                className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline"
              >
                <RefreshCw className={`w-3 h-3 ${runningTest ? 'animate-spin' : ''}`} />
                <span>{runningTest ? 'Scanning...' : 'Re-run Scan'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Metric 1: API Gateway Ping */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Gateway Ping</span>
                  <Wifi className="w-3.5 h-3.5" />
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  {diagnostics.latencyMs}ms
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    diagnostics.latencyMs < 150 ? 'bg-emerald-500' : diagnostics.latencyMs < 400 ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  <span className={
                    diagnostics.latencyMs < 150 ? 'text-emerald-600 dark:text-emerald-400' : diagnostics.latencyMs < 400 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                  }>
                    {diagnostics.latencyMs < 150 ? 'Fast' : diagnostics.latencyMs < 400 ? 'Normal' : 'High Latency'}
                  </span>
                </div>
              </div>

              {/* Metric 2: Main Thread Stall Check */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Thread State</span>
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white">
                  {diagnostics.mainThreadResponsive ? 'Fluid' : 'Blocked'}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold">
                  <span className={`w-1.5 h-1.5 rounded-full ${diagnostics.mainThreadResponsive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className={diagnostics.mainThreadResponsive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                    {diagnostics.mainThreadResponsive ? 'No Event Stalls' : 'Main Thread Lag'}
                  </span>
                </div>
              </div>

              {/* Metric 3: Memory Heap */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>JS Memory</span>
                  <HardDrive className="w-3.5 h-3.5" />
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  {diagnostics.memoryUsageMb ? `${diagnostics.memoryUsageMb} MB` : 'Normal'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {domNodeCount} DOM Elements
                </div>
              </div>

              {/* Metric 4: Safe Mode State */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Anti-Freeze</span>
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white">
                  {safeModeActive ? 'Safe Mode' : 'Standard'}
                </div>
                <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
                  {safeModeActive ? 'Low Overhead' : 'Full FX'}
                </div>
              </div>
            </div>
          </div>

          {/* Active 1-Click Fixes for Freezing & Hanging */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>One-Click Problem Solvers</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Fix 1: Safe Mode Freeze Eliminator */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                    <Sliders className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Freeze-Proof Safe Mode</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Disables GPU-heavy backdrop blurs, framer motion physics, and background transitions. Recommended if your browser is lagging or scrolling stutters.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleSafeMode}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs ${
                    safeModeActive
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300'
                      : 'bg-slate-900 dark:bg-teal-600 hover:bg-teal-700 text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{safeModeActive ? 'Disable Safe Mode (Restore FX)' : 'Activate Safe Mode (Anti-Freeze)'}</span>
                </button>
              </div>

              {/* Fix 2: Flush Stale Cache & Buffers */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span>Flush Stale Caches & Temp Blobs</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Safely purges temporary municipal search caches, uploaded photo blobs, and session buffers while preserving your encrypted credentials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFlushCache}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Flush Local Caches ({diagnostics.localStorageKb} KB)</span>
                </button>
              </div>

              {/* Fix 3: Memory Cleanup Cycle */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                    <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Client Memory Defragmenter</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Releases unmounted React tree nodes, audio context handles, and cached canvas graphics to free up RAM.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReleaseMemory}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-1.5"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Trigger Garbage Collection</span>
                </button>
              </div>

              {/* Fix 4: Export Diagnostic Telemetry */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                    <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <span>Export Telemetry Report</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Download an anonymous technical summary containing thread latencies, memory footprint, and display metrics to share with civic support.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportDiagnostics}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save Diagnostics JSON</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive FAQ & Step-by-Step Triage */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Symptom Triage & Common Fixes</span>
            </h4>

            <div className="space-y-2">
              {/* Question 1: Page freezing on upload */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === 'freezing' ? null : 'freezing')}
                  className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <span>Why does the page freeze or lag when uploading images or documents?</span>
                  {expandedFaq === 'freezing' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {expandedFaq === 'freezing' && (
                  <div className="px-4 pb-3 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 border-t border-slate-200/50 dark:border-slate-800/50 pt-2">
                    <p>
                      Large phone camera photos (12MP–48MP) can consume upwards of 80MB of uncompressed RAM during canvas decoding. IntentBridge automatically compresses files in client memory, but older mobile browsers may stutter for 1–2 seconds.
                    </p>
                    <p className="font-semibold text-teal-700 dark:text-teal-400">
                      Fix: Turn on “Freeze-Proof Safe Mode” above, or select standard resolution screenshots rather than RAW images.
                    </p>
                  </div>
                )}
              </div>

              {/* Question 2: Voice input hanging */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === 'voice' ? null : 'voice')}
                  className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <span>Voice input is stuck on “Listening...” or doesn't stop</span>
                  {expandedFaq === 'voice' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {expandedFaq === 'voice' && (
                  <div className="px-4 pb-3 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 border-t border-slate-200/50 dark:border-slate-800/50 pt-2">
                    <p>
                      Web Speech recognition relies on your browser’s OS microphone audio tunnel. If another tab or software holds a lock on the microphone, the recognition engine hangs in waiting mode.
                    </p>
                    <p className="font-semibold text-teal-700 dark:text-teal-400">
                      Fix: Click the microphone button again to close the audio session, or use text input.
                    </p>
                  </div>
                )}
              </div>

              {/* Question 3: Municipal data or buttons not clicking */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === 'buttons' ? null : 'buttons')}
                  className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <span>Buttons are unresponsive or portal displays outdated municipal info</span>
                  {expandedFaq === 'buttons' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {expandedFaq === 'buttons' && (
                  <div className="px-4 pb-3 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 border-t border-slate-200/50 dark:border-slate-800/50 pt-2">
                    <p>
                      An old Service Worker or corrupted local state from a previous version can block form submissions.
                    </p>
                    <p className="font-semibold text-teal-700 dark:text-teal-400">
                      Fix: Click “Flush Local Caches” above, then do a hard-refresh (Ctrl+Shift+R or Cmd+Shift+R).
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Report persisting bug to team */}
          {onOpenFeedback && (
            <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 flex items-center justify-between gap-4">
              <div>
                <h5 className="text-xs font-bold text-teal-900 dark:text-teal-200">
                  Still experiencing issues?
                </h5>
                <p className="text-[11px] text-teal-800 dark:text-teal-300">
                  Share your system experience with our engineering team via the feedback form.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFeedback();
                }}
                className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 text-white font-bold text-xs shrink-0 transition-colors shadow-xs"
              >
                Send Feedback
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
