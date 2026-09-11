import React, { useState } from 'react';
import { 
  X, 
  Send, 
  CheckCircle2, 
  MessageSquare, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  Cpu,
  HelpCircle,
  ThumbsUp
} from 'lucide-react';
import { submitFeedbackApi } from '../services/apiClient.js';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTroubleshooter?: () => void;
}

const EMOJI_OPTIONS = [
  { emoji: '😡', rating: 1, label: 'Frustrated', desc: 'Broken / Unhelpful' },
  { emoji: '🙁', rating: 2, label: 'Poor', desc: 'Confusing or slow' },
  { emoji: '😐', rating: 3, label: 'Neutral', desc: 'Okay / Average' },
  { emoji: '😊', rating: 4, label: 'Good', desc: 'Helpful guidance' },
  { emoji: '🤩', rating: 5, label: 'Excellent', desc: 'Solved my civic problem!' },
];

const CATEGORIES = [
  'Civic Problem Understanding',
  'Grievance Letter Generator',
  'Department & Office Directory',
  'Website Speed & Freezing',
  'Design & Usability',
  'Other Suggestion'
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onOpenTroubleshooter
}) => {
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [selectedCategory, setSelectedCategory] = useState<string>('Civic Problem Understanding');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [experiencedLag, setExperiencedLag] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [referenceId, setReferenceId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentEmojiObj = EMOJI_OPTIONS.find(o => o.rating === selectedRating) || EMOJI_OPTIONS[4];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      setError('Please share a short thought or suggestion before submitting.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await submitFeedbackApi({
        emoji: currentEmojiObj.emoji,
        rating: selectedRating,
        category: selectedCategory,
        feedbackText: feedbackText.trim(),
        email: email.trim() || undefined,
        experiencedLag
      });

      setReferenceId(res.id || `FB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Unable to submit feedback. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setFeedbackText('');
    setSelectedRating(5);
    setSelectedCategory('Civic Problem Understanding');
    setExperiencedLag(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Citizen Feedback & Experience
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Help improve IntentBridge’s civic guidance & stability
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

        {/* Content Body */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6 space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Thank You for Your Feedback!
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  Your feedback helps ensure ordinary citizens get transparent, unhindered access to public services.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[11px] font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 w-fit mx-auto">
                Reference Tag: <span className="font-bold text-teal-600 dark:text-teal-400">{referenceId}</span>
              </div>

              {experiencedLag && onOpenTroubleshooter && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-left space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>You reported performance lag or freezing</span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    Run our built-in Diagnostic Troubleshooter to test browser memory pressure, flush caches, or toggle safe mode.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenTroubleshooter();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Launch Diagnostic Troubleshooter</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all shadow-xs"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Emoji Faces Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 text-center">
                  How was your experience with IntentBridge?
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {EMOJI_OPTIONS.map((item) => {
                    const isSelected = selectedRating === item.rating;
                    return (
                      <button
                        key={item.rating}
                        type="button"
                        onClick={() => setSelectedRating(item.rating)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 dark:border-teal-400 scale-105 shadow-md shadow-teal-500/10'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <span className="text-2xl sm:text-3xl filter drop-shadow-xs transition-transform transform group-hover:scale-110">
                          {item.emoji}
                        </span>
                        <span className={`text-[11px] font-bold mt-1 ${
                          isSelected ? 'text-teal-900 dark:text-teal-200' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-center text-[11px] text-teal-700 dark:text-teal-400 font-medium mt-1.5">
                  {currentEmojiObj.desc}
                </p>
              </div>

              {/* Category Pills */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Topic / Category
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        selectedCategory === cat
                          ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Input Feedback */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Your Thoughts & Observations
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {feedbackText.length}/1000
                  </span>
                </div>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value.slice(0, 1000))}
                  placeholder="What was helpful? Did you encounter any confusing municipal instructions, wrong office locations, or bugs?"
                  rows={3}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all resize-none"
                  required
                />
              </div>

              {/* Freezing / Lagging Checkbox */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="experienced-lag-checkbox"
                  checked={experiencedLag}
                  onChange={(e) => setExperiencedLag(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <div className="flex-1">
                  <label htmlFor="experienced-lag-checkbox" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer block">
                    I experienced website hanging, freezing, or slow responsiveness
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Checking this enables our diagnostic team to inspect client-side thread stalls and GPU rendering bottlenecks.
                  </p>
                </div>
              </div>

              {/* Optional Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email / Contact (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="citizen@example.org (if you'd like follow-up updates)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2.5 rounded-xl bg-slate-900 dark:bg-teal-600 hover:bg-teal-700 dark:hover:bg-teal-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Transmitting...</span>
                    </span>
                  ) : (
                    <>
                      <span>Submit Feedback</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Privacy Guarantee */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Zero marketing tracking. Submissions are strictly used to improve civic accessibility.</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
