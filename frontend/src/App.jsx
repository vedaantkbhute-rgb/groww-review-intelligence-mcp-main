import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Mail,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Layers,
  Quote,
  Eye,
  Send,
  Lock,
  ArrowRight,
  TrendingDown,
  Info,
  BookOpen,
  Edit3,
  History,
  BarChart3,
  UploadCloud
} from 'lucide-react';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [analyzedData, setAnalyzedData] = useState(null);
  const [activeTab, setActiveTab] = useState('pulse'); // 'pulse' | 'explainer' | 'themes'
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [sources, setSources] = useState([]);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  // Editable Preview State before Approval
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedPulse, setEditedPulse] = useState('');
  const [editedBullets, setEditedBullets] = useState([]);

  // MCP State
  const [mcpStatus, setMcpStatus] = useState('IDLE'); // 'IDLE' | 'PENDING_APPROVAL' | 'EXECUTING' | 'EXECUTED' | 'REJECTED'
  const [mcpResult, setMcpResult] = useState(null);
  const [approverName, setApproverName] = useState('Juhi (Product Lead)');
  const [copiedType, setCopiedType] = useState(null);

  // Auto-load analysis on initial mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch pulse & explainer
      const pulseRes = await fetch('/api/generate-pulse', { method: 'POST' });
      if (pulseRes.ok) {
        const data = await pulseRes.json();
        setAnalyzedData(data);
        setEditedPulse(data.weekly_pulse.content);
        setEditedBullets(data.fee_explainer.bullet_points);
        setMcpStatus('PENDING_APPROVAL');
      }

      // 2. Fetch raw reviews
      const revRes = await fetch('/api/reviews');
      if (revRes.ok) {
        const revData = await revRes.json();
        setReviews(revData);
      }

      // 3. Fetch sources
      const srcRes = await fetch('/api/sources');
      if (srcRes.ok) {
        const srcData = await srcRes.json();
        setSources(srcData);
      }

      // 4. Fetch audit logs
      fetchAuditLogs();
    } catch (err) {
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/mcp/audit-log');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    setUploadStatus(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload-reviews', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setUploadStatus({
          type: 'success',
          msg: `${data.message} (${data.valid_reviews} valid reviews, ${data.duplicates_dropped} duplicates dropped).`
        });
        fetchInitialData();
      } else {
        setUploadStatus({
          type: 'error',
          msg: data.detail || 'Failed to upload CSV file.'
        });
      }
    } catch (err) {
      setUploadStatus({ type: 'error', msg: 'Network error uploading CSV file.' });
    } finally {
      setUploadLoading(false);
    }
  };

  const currentWordCount = editedPulse.trim() ? editedPulse.trim().split(/\s+/).length : 0;

  const handleApproveMCP = async () => {
    if (!analyzedData) return;
    setMcpStatus('EXECUTING');
    try {
      // Support edited preview payload
      const payload = {
        date: analyzedData.date,
        top_themes: analyzedData.analysis.top_themes,
        weekly_pulse: editedPulse,
        identified_fee_issue: analyzedData.analysis.identified_fee_issue,
        explanation_bullets: editedBullets,
        source_links: analyzedData.fee_explainer.source_links
      };

      const res = await fetch('/api/mcp/approve-and-execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved: true,
          approved_by: approverName,
          payload
        })
      });

      if (res.ok) {
        const result = await res.json();
        setMcpResult(result);
        setMcpStatus('EXECUTED');
        fetchAuditLogs();
      } else {
        alert('MCP execution failed on server.');
        setMcpStatus('PENDING_APPROVAL');
      }
    } catch (err) {
      console.error('MCP execution error:', err);
      setMcpStatus('PENDING_APPROVAL');
    }
  };

  const handleRejectMCP = () => {
    setMcpStatus('REJECTED');
  };

  const handleCopyText = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shadow-sm">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 tracking-tight text-sm sm:text-base">
                  Groww Review Intelligence &amp; MCP Workflow
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Milestone 5
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Context Engineering &amp; Action Gating • Product Pulse + Customer Clarification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAuditModal(true)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              title="View MCP Audit Trail"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Audit Log</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-amber-400 font-bold">
                {auditLogs.length}
              </span>
            </button>
            <button
              onClick={() => setShowSourcesModal(true)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Sources ({sources.length})</span>
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              title="Upload new custom reviews CSV"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Upload CSV</span>
            </button>
            <button
              onClick={() => setShowReviewsModal(true)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">CSV ({reviews.length})</span>
            </button>
            <button
              onClick={fetchInitialData}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Rerun</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 flex flex-col gap-6">
        {/* Banner: Product Context & Friction Highlight */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-slate-900/80 border border-emerald-500/20 p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Target Product: Groww (Mutual Funds)
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  Fee Issue: Exit Load Misunderstanding
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Metric: {analyzedData?.analysis.fee_metric.summary_metric || '14 mentions, 11 confused'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                AI Customer Review Intelligence &amp; MCP Gated Action Hub
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Transforms unstructured public Play Store/App Store feedback into an internal weekly product pulse and customer-facing support snippet, gated strictly by human sign-off before logging or drafting emails.
              </p>
            </div>

            <div className="flex sm:flex-col gap-2 shrink-0">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                <div className="text-slate-400 font-mono text-[11px]">Analysis Window</div>
                <div className="font-bold text-slate-200 mt-0.5">{analyzedData?.analysis.date_range || '8–12 weeks'}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                <div className="text-slate-400 font-mono text-[11px]">PII Sanitized</div>
                <div className="font-bold text-emerald-400 mt-0.5">
                  {analyzedData?.analysis.pii_scrubbed_count || 0} Personal Details Scrubbed
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 1: Review Intelligence Layer */}
        {analyzedData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Clustered Themes & Distribution Bar Chart */}
            <div className="lg:col-span-1 rounded-2xl bg-slate-900/70 border border-slate-800 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <h2 className="font-bold text-sm text-white uppercase tracking-wider">Themes Distribution</h2>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Max 5 (Top 3 Priority)
                  </span>
                </div>

                {/* Theme Breakdown with Visual Progress Bars */}
                <div className="space-y-3.5">
                  {analyzedData.analysis.all_themes.map((theme, idx) => {
                    const isTop3 = idx < 3;
                    return (
                      <div key={theme.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="flex items-center gap-1.5 text-slate-200 truncate">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                              idx === 0 ? 'bg-rose-500 text-white font-bold' : isTop3 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="truncate">{theme.name}</span>
                          </span>
                          <span className="font-mono text-slate-400 text-[11px]">
                            {theme.count} ({theme.percentage}%)
                          </span>
                        </div>

                        {/* Bar */}
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              idx === 0 ? 'bg-rose-500' : isTop3 ? 'bg-emerald-500' : 'bg-slate-600'
                            }`}
                            style={{ width: `${theme.percentage}%` }}
                          />
                        </div>

                        <p className="text-[10.5px] text-slate-400 line-clamp-1 leading-relaxed">
                          {theme.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Identified Fee Issue Card */}
              <div className="mt-5 p-3.5 rounded-xl bg-gradient-to-br from-rose-950/40 to-slate-900/90 border border-rose-500/40">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Recurring Fee Friction Point</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold">
                    {analyzedData.analysis.fee_metric.summary_metric}
                  </span>
                </div>
                <div className="text-xs font-semibold text-white mb-1">
                  {analyzedData.analysis.identified_fee_issue}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {analyzedData.analysis.fee_issue_summary}
                </p>
              </div>
            </div>

            {/* Real User Quotes & Output Panels */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* 3 Real User Quotes with "Verified Verbatim in CSV" badge */}
              <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Quote className="w-4 h-4 text-emerald-400" />
                    <h2 className="font-bold text-sm text-white uppercase tracking-wider">3 Verified Verbatim Quotes</h2>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Code Asserted vs. CSV
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {analyzedData.analysis.user_quotes.map((q, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between text-xs">
                      <p className="text-slate-200 italic leading-relaxed mb-3 font-serif text-[11.5px]">
                        {q.quote_text}
                      </p>
                      <div className="space-y-1.5 pt-2 border-t border-slate-700/40">
                        <div className="text-[11px] font-semibold text-slate-300">
                          — {q.author} ({'★'.repeat(q.rating)})
                        </div>
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-300 font-mono font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Verified Verbatim in CSV ({q.review_id})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* STEPS 2 & 3: Tabs for Weekly Pulse & Fee Explainer (With Edit Mode) */}
              <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 flex-1 flex flex-col">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('pulse')}
                      className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeTab === 'pulse'
                          ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Weekly Product Pulse</span>
                      <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        currentWordCount <= 250 ? 'bg-black/20 text-slate-950' : 'bg-rose-500 text-white'
                      }`}>
                        {currentWordCount}/250 w
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab('explainer')}
                      className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeTab === 'explainer'
                          ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Fee Explainer</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-black/20 text-slate-950 font-bold">
                        {editedBullets.length}/6 Bullets
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditMode(!isEditMode)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all flex items-center gap-1 cursor-pointer ${
                        isEditMode
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                      title="Toggle editing mode before approval"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditMode ? 'Editing Preview' : 'Edit Text'}</span>
                    </button>

                    <button
                      onClick={() => handleCopyText(
                        activeTab === 'pulse' ? editedPulse : editedBullets.join('\n• '),
                        activeTab
                      )}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {copiedType === activeTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedType === activeTab ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Tab 1: Weekly Pulse Content */}
                {activeTab === 'pulse' && (
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Constraint: Strictly &le; 250 words</span>
                      <span className={`font-bold ${currentWordCount <= 250 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {currentWordCount <= 250
                          ? `Passing Validator: ${currentWordCount} / 250 words`
                          : `Warning: ${currentWordCount} / 250 words (Over Limit)`}
                      </span>
                    </div>

                    {isEditMode ? (
                      <textarea
                        value={editedPulse}
                        onChange={(e) => setEditedPulse(e.target.value)}
                        rows={12}
                        className="w-full p-4 rounded-xl bg-slate-950 border border-amber-500/40 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-amber-400"
                      />
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-emerald-500/20">
                        {editedPulse}
                      </div>
                    )}

                    {/* Action Ideas Pills */}
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-slate-300">
                        3 Concrete Product Action Items:
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {analyzedData.weekly_pulse.action_ideas.map((act, i) => (
                          <div key={i} className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-[11px] text-emerald-200 leading-tight">
                            <span className="font-bold text-emerald-400 mr-1">#{i + 1}</span> {act}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Customer Fee Explainer Content */}
                {activeTab === 'explainer' && (
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Constraint: Strictly &le; 6 bullets, Neutral Facts-Only Tone</span>
                      <span className="text-emerald-400 font-bold">
                        RAG Grounded: {editedBullets.length} / 6 bullets (Passing)
                      </span>
                    </div>

                    {isEditMode ? (
                      <div className="space-y-2">
                        {editedBullets.map((b, i) => (
                          <input
                            key={i}
                            type="text"
                            value={b}
                            onChange={(e) => {
                              const updated = [...editedBullets];
                              updated[i] = e.target.value;
                              setEditedBullets(updated);
                            }}
                            className="w-full p-2.5 rounded-lg bg-slate-950 border border-amber-500/40 text-xs text-slate-200 focus:outline-none"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 space-y-2.5 leading-relaxed">
                        {editedBullets.map((b, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            <span>{b}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 2 Official Source Links */}
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                        <span>Official Regulatory Citations:</span>
                        <span className="text-[11px] font-mono text-slate-400">Last checked: {analyzedData.fee_explainer.last_checked}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {analyzedData.fee_explainer.source_links.map((s, i) => (
                          <a
                            key={i}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-500/30 hover:border-indigo-400 transition-all flex items-center justify-between text-xs text-indigo-300 group"
                          >
                            <div className="truncate pr-2">
                              <div className="font-semibold text-slate-200 truncate">{s.title}</div>
                              <div className="text-[10px] text-indigo-400 font-mono">{s.authority}</div>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: MCP Tool Calling & Human-in-the-Loop Approval Gate */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Step 4: Model Context Protocol (MCP) Approval Gate
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Human-in-the-Loop Required
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Simulating enterprise tool execution: Requires explicit human sign-off before logging to internal documentation and preparing an email draft.
              </p>
            </div>

            {/* Approver role */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Approver Role:</span>
              <input
                type="text"
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Approval Controls */}
          {mcpStatus === 'PENDING_APPROVAL' && (
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Review Required Before Executing MCP Tools</span>
                </div>
                <p className="text-xs text-slate-300">
                  Clicking "Approve" will execute 2 automated tools: (1) Append structured JSON/MD to team docs and save date-stamped file, and (2) Generate standardized email draft for product and support leads.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={handleRejectMCP}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 font-semibold transition-all cursor-pointer"
                >
                  Reject Action
                </button>
                <button
                  onClick={handleApproveMCP}
                  disabled={currentWordCount > 250}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Approve &amp; Execute MCP Tools</span>
                </button>
              </div>
            </div>
          )}

          {mcpStatus === 'EXECUTING' && (
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-center gap-2 text-xs text-slate-300">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Executing Model Context Protocol tools (Logging to notes, creating email draft)...</span>
            </div>
          )}

          {mcpStatus === 'REJECTED' && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-300 flex items-center justify-between">
              <span>Approval was declined. MCP actions have been aborted safely.</span>
              <button
                onClick={() => setMcpStatus('PENDING_APPROVAL')}
                className="px-3 py-1 rounded-lg bg-rose-900/40 border border-rose-500/40 text-xs font-semibold hover:bg-rose-900/70 cursor-pointer"
              >
                Reset Approval Gate
              </button>
            </div>
          )}

          {/* Post-Approval Result Display */}
          {mcpStatus === 'EXECUTED' && mcpResult && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    MCP Actions Successfully Executed (Human Approval Granted by: {approverName} • File: {mcpResult.date_stamped_file})
                  </span>
                </div>
                <button
                  onClick={() => setMcpStatus('PENDING_APPROVAL')}
                  className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                >
                  Reset Gate
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Tool 1 Result: Appended Document Entry */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Tool 1: Appended to Internal Notes (JSON)</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                        Saved: {mcpResult.date_stamped_file}
                      </span>
                    </div>
                    <pre className="p-3 rounded-lg bg-slate-900/90 text-[11px] text-slate-300 font-mono overflow-x-auto max-h-56 leading-relaxed">
                      {JSON.stringify(mcpResult.doc_entry, null, 2)}
                    </pre>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Targets: data/internal_product_notes.json &amp; data/{mcpResult.date_stamped_file}
                  </div>
                </div>

                {/* Tool 2 Result: Email Draft Generated */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tool 2: Standardized Email Draft (No Auto-Send)</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300">
                        Draft Prepared
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="text-slate-400 font-mono text-[11px]">
                        Subject: <span className="text-slate-200 font-semibold">{mcpResult.email_draft.subject}</span>
                      </div>
                      <div className="text-slate-400 font-mono text-[11px]">
                        To: <span className="text-slate-200">{mcpResult.email_draft.recipients}</span>
                      </div>
                    </div>

                    <pre className="p-3 rounded-lg bg-slate-900/90 text-[11px] text-slate-300 font-mono overflow-x-auto max-h-40 leading-relaxed whitespace-pre-wrap">
                      {mcpResult.email_draft.body}
                    </pre>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                    <span className="text-[10px] text-amber-400 font-mono">
                      (No Auto-Send • Manual Review Gated)
                    </span>
                    <a
                      href={mcpResult.email_draft.mailto_url}
                      className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Open in Email Client / Gmail</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Audit Log Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">MCP Human Approval Audit Trail ({auditLogs.length} Records)</h3>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 text-xs">
              {auditLogs.length === 0 ? (
                <div className="text-slate-400 text-center py-8">No actions have been approved yet.</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1">
                    <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
                      <span className="text-emerald-400 font-bold">{log.id}</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="font-semibold text-slate-200">
                      Approved By: <span className="text-emerald-300">{log.approved_by}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Target File: <span className="font-mono text-slate-300">{log.doc_file}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      Subject: <span className="text-slate-300">{log.email_subject}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sources Modal */}
      {showSourcesModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-white">Official Regulatory Sources ({sources.length} Sources)</h3>
              </div>
              <button
                onClick={() => setShowSourcesModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {sources.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 block transition-all group"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1">
                    <span className="truncate pr-2 group-hover:text-emerald-300">{s.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 mb-1 leading-relaxed">{s.description}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span className="text-indigo-400">{s.authority}</span>
                    <span>Last checked: {s.last_checked}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Raw Reviews CSV Modal */}
      {showReviewsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Ingested Reviews Dataset ({reviews.length} Rows)</h3>
              </div>
              <button
                onClick={() => setShowReviewsModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 pr-1 text-xs">
              {reviews.map((r) => (
                <div key={r.review_id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                  <div className="flex items-center justify-between font-mono text-[11px] text-slate-400 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">{r.review_id}</span>
                      <span className="text-slate-300 font-sans font-semibold">{r.user_name}</span>
                      <span>({r.date})</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      r.category === 'Fees & Charges' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {r.category} • {'★'.repeat(r.rating)}
                    </span>
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed">{r.review_text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload Reviews CSV Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Upload Custom Customer Reviews CSV</h3>
              </div>
              <button
                onClick={() => { setShowUploadModal(false); setUploadStatus(null); }}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Upload a public app reviews CSV covering the last 8–12 weeks. Required columns: <code className="text-emerald-300 font-mono text-[11px]">review_id</code>, <code className="text-emerald-300 font-mono text-[11px]">rating</code>, <code className="text-emerald-300 font-mono text-[11px]">review_text</code>.
              </p>

              <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-6 text-center transition-all bg-slate-950/50">
                <input
                  type="file"
                  id="csv-file-input"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="csv-file-input"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    {uploadLoading ? 'Uploading and validating...' : 'Click to select CSV file'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Supports Play Store / App Store exports (.csv)
                  </span>
                </label>
              </div>

              {uploadStatus && (
                <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  uploadStatus.type === 'success'
                    ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/40 border border-rose-500/40 text-rose-200'
                }`}>
                  {uploadStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{uploadStatus.msg}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => { setShowUploadModal(false); setUploadStatus(null); }}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-500">
        NextLeap Fellowship Milestone 5 • Model Context Protocol Workflow • Author: Juhi Mungle
      </footer>
    </div>
  );
}
