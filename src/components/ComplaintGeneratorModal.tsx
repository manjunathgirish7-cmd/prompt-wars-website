import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Printer, 
  RefreshCw, 
  FileText, 
  Sparkles, 
  Building2, 
  User, 
  MapPin, 
  AlertCircle 
} from 'lucide-react';
import { ProblemAnalysis, ComplaintLetter } from '../types.js';
import { generateComplaintApi } from '../services/apiClient.js';

interface ComplaintGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis?: ProblemAnalysis | null;
}

export const ComplaintGeneratorModal: React.FC<ComplaintGeneratorModalProps> = ({
  isOpen,
  onClose,
  analysis
}) => {
  const [applicantName, setApplicantName] = useState('Rahul Sharma');
  const [applicantContact, setApplicantContact] = useState('+91 98765 43210');
  const [applicantAddress, setApplicantAddress] = useState('Flat 402, Green Glen Layout, Bellandur, Bengaluru');
  const [tone, setTone] = useState<'formal' | 'urgent' | 'detailed'>('formal');
  const [specificDetails, setSpecificDetails] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [complaintLetter, setComplaintLetter] = useState<ComplaintLetter | null>(null);
  const [copied, setCopied] = useState(false);
  const [editableBody, setEditableBody] = useState('');

  // Initial generation when opened with an analysis
  useEffect(() => {
    if (isOpen && analysis) {
      handleGenerate();
    }
  }, [isOpen, analysis]);

  const handleGenerate = async (customTone?: 'formal' | 'urgent' | 'detailed') => {
    setIsGenerating(true);
    try {
      const activeTone = customTone || tone;
      const result = await generateComplaintApi({
        problemSummary: analysis?.understoodSummary || 'Civic infrastructure defect',
        category: analysis?.category || 'Civic Infrastructure',
        authorityName: analysis?.recommendedAuthority?.name || 'Bruhat Bengaluru Mahanagara Palike',
        department: analysis?.recommendedAuthority?.department || 'Executive Engineering Ward Office',
        location: analysis?.locationRequirement?.detectedLocation || 'Bengaluru',
        applicantName,
        applicantContact,
        applicantAddress,
        tone: activeTone,
        specificDetails: specificDetails || undefined
      });

      setComplaintLetter(result);
      setEditableBody(result.body);
    } catch (err) {
      console.warn('Complaint generation notice:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const fullLetterText = complaintLetter ? `
TO:
${complaintLetter.recipient.designation}
${complaintLetter.recipient.department}
${complaintLetter.recipient.officeAddress}
${complaintLetter.recipient.city}

FROM:
${applicantName || complaintLetter.applicantInfo.name}
${applicantContact || complaintLetter.applicantInfo.contact}
${applicantAddress || complaintLetter.applicantInfo.address}

DATE: ${complaintLetter.generatedDate}

SUBJECT: ${complaintLetter.subject}

${editableBody}

INCIDENT PARTICULARS:
- Exact Location: ${complaintLetter.incidentDetails.location}
- Duration of Issue: ${complaintLetter.incidentDetails.dateOrDuration}
- Safety/Public Impact: ${complaintLetter.incidentDetails.impactDescription}

STATUTORY RELIEF REQUESTED:
${complaintLetter.reliefRequested.map((r, i) => `${i + 1}. ${r}`).join('\n')}

STATUTORY CHARTER REFERENCE:
${complaintLetter.referenceLawOrCharter || 'Citizen Charter and Municipal Governance Regulations'}

Yours faithfully,

${applicantName || complaintLetter.applicantInfo.name}
  `.trim() : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(fullLetterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([fullLetterText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Grievance_Letter_${analysis?.category?.replace(/\s+/g, '_') || 'Civic'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Official Grievance Letter</title>
            <style>
              body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; font-size: 14pt; }
              pre { white-space: pre-wrap; font-family: inherit; }
            </style>
          </head>
          <body>
            <pre>${fullLetterText}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Official Citizen Grievance & Application Generator
              </h3>
              <p className="text-[11px] text-slate-500">
                Formatted for submission to {analysis?.recommendedAuthority?.name || 'Local Authority'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Customizer Panel */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Letter Settings & Applicant Identity
              </span>
              <div className="flex items-center gap-1.5">
                {(['formal', 'urgent', 'detailed'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTone(t);
                      handleGenerate(t);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold capitalize transition-all ${
                      tone === t
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t} Tone
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Applicant Name</label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  placeholder="Your Full Name"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone / Contact</label>
                <input
                  type="text"
                  value={applicantContact}
                  onChange={(e) => setApplicantContact(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  placeholder="+91 Mobile"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={applicantAddress}
                  onChange={(e) => setApplicantAddress(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  placeholder="Street, Area, Pincode"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Additional Landmark / Reference Details (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={specificDetails}
                  onChange={(e) => setSpecificDetails(e.target.value)}
                  placeholder="e.g. Opposite Metro Pillar 142, persisting for 3 weeks..."
                  className="flex-1 text-xs p-2 rounded-lg border border-slate-200 bg-white"
                />
                <button
                  onClick={() => handleGenerate()}
                  disabled={isGenerating}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
              </div>
            </div>
          </div>

          {/* Letter Document Preview Box */}
          <div className="relative border border-slate-300 rounded-xl bg-slate-50/30 p-6 font-mono text-xs text-slate-800 shadow-inner">
            {isGenerating ? (
              <div className="py-16 text-center text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                <p className="font-sans text-xs font-semibold">
                  Generating formal complaint letter with Gemini AI...
                </p>
              </div>
            ) : complaintLetter ? (
              <div className="space-y-4">
                {/* Formal Letterhead */}
                <div className="border-b border-slate-200 pb-3">
                  <p className="font-bold text-slate-900">TO:</p>
                  <p className="text-slate-800">{complaintLetter.recipient.designation}</p>
                  <p className="text-slate-800">{complaintLetter.recipient.department}</p>
                  <p className="text-slate-800">{complaintLetter.recipient.officeAddress}</p>
                  <p className="text-slate-800">{complaintLetter.recipient.city}</p>
                </div>

                <div className="border-b border-slate-200 pb-3">
                  <p className="font-bold text-slate-900">FROM:</p>
                  <p className="text-slate-800">{applicantName || complaintLetter.applicantInfo.name}</p>
                  <p className="text-slate-800">{applicantContact || complaintLetter.applicantInfo.contact}</p>
                  <p className="text-slate-800">{applicantAddress || complaintLetter.applicantInfo.address}</p>
                  <p className="text-slate-500 mt-1">DATE: {complaintLetter.generatedDate}</p>
                </div>

                <div>
                  <p className="font-bold text-slate-900 mb-2">
                    SUBJECT: <span className="underline">{complaintLetter.subject}</span>
                  </p>
                </div>

                {/* Editable Body Text */}
                <div>
                  <textarea
                    rows={8}
                    value={editableBody}
                    onChange={(e) => setEditableBody(e.target.value)}
                    className="w-full bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs leading-relaxed focus:border-teal-500 outline-none"
                    title="You can edit this letter directly before downloading"
                  />
                  <span className="text-[10px] text-slate-400 font-sans italic">
                    ✏️ Click inside to edit the letter text directly if needed.
                  </span>
                </div>

                {/* Particulars & Relief */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-900">SPECIFIC RELIEF DEMANDED:</p>
                  {complaintLetter.reliefRequested.map((r, i) => (
                    <p key={i} className="text-slate-700 pl-2">
                      {i + 1}. {r}
                    </p>
                  ))}
                  <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    Statutory Rule: {complaintLetter.referenceLawOrCharter || 'Citizen Service Charter'}
                  </p>
                </div>

                <div className="pt-2">
                  <p>Yours faithfully,</p>
                  <p className="font-bold mt-4">{applicantName || complaintLetter.applicantInfo.name}</p>
                  <p className="text-slate-500">(Complainant / Citizen)</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Submission Notice & Disclaimer */}
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p>
              <strong>Important Citizen Notice:</strong> IntentBridge provides verified drafting assistance but does not automatically submit complaints to government departments. Please download or copy this letter and lodge it via the verified municipal portal, citizen helpline, or physical ward office.
            </p>
          </div>
        </div>

        {/* Footer Actions: Copy, Download, Print */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-800 border border-slate-200 hover:bg-slate-100 flex items-center gap-1.5 transition-all shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Letter'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-800 border border-slate-200 hover:bg-slate-100 flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              <span>Download (.txt)</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-800 border border-slate-200 hover:bg-slate-100 flex items-center gap-1.5 transition-all shadow-2xs"
              title="Print letter"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
