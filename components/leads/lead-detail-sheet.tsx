"use client";

import React, { useState } from "react";
import { Lead } from "@/lib/types";
import { ScoreBadge } from "./score-badge";
import {
  X,
  ExternalLink,
  Users,
  Calendar,
  DollarSign,
  Mail,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  RefreshCw,
  Globe,
  Layers,
  ShieldCheck,
  Check,
  Copy,
} from "lucide-react";

interface LeadDetailSheetProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onExplanationUpdated?: (leadId: string, newExplanation: string) => void;
}

export function LeadDetailSheet({
  lead,
  isOpen,
  onClose,
  onExplanationUpdated,
}: LeadDetailSheetProps) {
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [enrichmentData, setEnrichmentData] = useState<any>(null);
  const [isEnriching, setIsEnriching] = useState(false);

  if (!isOpen || !lead) return null;

  const handleCopyEmail = () => {
    if (!lead.contactEmail) return;
    navigator.clipboard.writeText(lead.contactEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleRegenerateAi = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch("/api/scoring/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const data = await res.json();
      if (data.success && data.explanation) {
        onExplanationUpdated?.(lead.id, data.explanation);
      }
    } catch (err) {
      console.error("Failed to regenerate AI summary:", err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleEthicalEnrich = async () => {
    setIsEnriching(true);
    try {
      const res = await fetch("/api/enrichment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: lead.domain }),
      });
      const data = await res.json();
      if (data.success) {
        setEnrichmentData(data.result);
      }
    } catch (err) {
      console.error("Enrichment failed:", err);
    } finally {
      setIsEnriching(false);
    }
  };

  const signals = [
    {
      label: "Category Defensibility",
      score: lead.scoreBreakdown?.categoryScore ?? 60,
      detail: lead.category,
      weight: "15%",
    },
    {
      label: "Team Size Scalability",
      score: lead.scoreBreakdown?.teamSizeScore ?? 65,
      detail: `${lead.estimatedTeamSize} employees (Sweet spot 6-25)`,
      weight: "20%",
    },
    {
      label: "Company Vintage & Track Record",
      score: lead.scoreBreakdown?.companyAgeScore ?? 70,
      detail: `${lead.companyAge} years (Founded ${lead.foundedYear})`,
      weight: "15%",
    },
    {
      label: "ARR Target Bracket",
      score: lead.scoreBreakdown?.revenueScore ?? 80,
      detail: lead.arrHintString || "Undisclosed",
      weight: "20%",
    },
    {
      label: "Direct Outreach Quality",
      score: lead.scoreBreakdown?.contactScore ?? 40,
      detail: `${lead.contactTitle || lead.contactType} (${lead.contactEmail ? "Direct email" : "No email"})`,
      weight: "15%",
    },
    {
      label: "Tech Stack & Website Health",
      score: lead.scoreBreakdown?.techHealthScore ?? 50,
      detail: `${lead.websiteStatus} · ${lead.sslValid ? "SSL Verified" : "No SSL"}`,
      weight: "15%",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                  {lead.category}
                </span>
                {lead.mergeStatus === "MERGED" && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                    Merged Duplicate
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {lead.companyName}
                <a
                  href={lead.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {lead.domain}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Score Hero Card */}
            <div className="bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 rounded-xl p-5 border border-indigo-100 dark:border-indigo-950">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  PE / ETA Acquisition Fit
                </div>
                <ScoreBadge score={lead.overallScore} size="lg" />
              </div>

              {/* AI Deal Summary Box */}
              <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-3.5 border border-slate-200/80 dark:border-slate-700 mt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                    AI Deal Rationale
                  </span>
                  <button
                    onClick={handleRegenerateAi}
                    disabled={isGeneratingAi}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${isGeneratingAi ? "animate-spin" : ""}`} />
                    {isGeneratingAi ? "Analyzing..." : "Refresh with Claude"}
                  </button>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed italic">
                  &ldquo;{lead.aiExplanation || "Calculating acquisition fit rationale..."}&rdquo;
                </p>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <Users className="h-3.5 w-3.5" /> Team Size
                </div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  {lead.estimatedTeamSize} <span className="text-xs font-normal text-slate-500">people</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <Calendar className="h-3.5 w-3.5" /> Vintage
                </div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  {lead.companyAge}y <span className="text-xs font-normal text-slate-500">({lead.foundedYear})</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <DollarSign className="h-3.5 w-3.5" /> ARR Hint
                </div>
                <div className="font-semibold text-slate-900 dark:text-white text-xs truncate" title={lead.arrHintString}>
                  {lead.arrHintString || "Undisclosed"}
                </div>
              </div>
            </div>

            {/* Sub-Signals Breakdown */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Signal Breakdown & Sub-Scores
              </h3>
              <div className="space-y-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                {signals.map((sig, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {sig.label} <span className="text-slate-400 text-[10px]">({sig.weight})</span>
                      </span>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {Math.round(sig.score)}/100
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          sig.score >= 75
                            ? "bg-emerald-500"
                            : sig.score >= 50
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                        style={{ width: `${Math.max(5, sig.score)}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {sig.detail}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Quality Card */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
                <span>Key Contact Details</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {lead.contactType}
                </span>
              </h3>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 text-xs">Contact Person</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {lead.contactName || "Unknown"} · <span className="text-slate-500 text-xs">{lead.contactTitle || "Owner"}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 text-xs">Direct Email</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-slate-800 dark:text-slate-200">
                      {lead.contactEmail || "N/A"}
                    </span>
                    {lead.contactEmail && (
                      <button
                        onClick={handleCopyEmail}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Copy email"
                      >
                        {copiedEmail ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 text-xs">Verification</span>
                  <div className="flex items-center gap-1.5 text-xs">
                    {lead.emailStatus === "VALID" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> MX & Syntax Verified
                      </span>
                    ) : lead.emailStatus === "INVALID" ? (
                      <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                        <XCircle className="h-3.5 w-3.5" /> Undeliverable / Invalid MX
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                        <AlertTriangle className="h-3.5 w-3.5" /> Unchecked Syntax
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tech Stack Chips */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" /> Tech Stack Fingerprint
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {lead.techStack.map((tech, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Ethical Homepage Enrichment Tool */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Ethical Homepage Inspector
                </div>
                <button
                  onClick={handleEthicalEnrich}
                  disabled={isEnriching}
                  className="text-xs px-2.5 py-1 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1"
                >
                  <Globe className={`h-3 w-3 ${isEnriching ? "animate-spin" : ""}`} />
                  {isEnriching ? "Checking..." : "Inspect Public Root"}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Checks public robots.txt policy and public homepage metadata without bypassing logins or CAPTCHAs.
              </p>

              {enrichmentData && (
                <div className="text-xs space-y-1.5 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500">robots.txt Status:</span>
                    <span className="font-semibold text-emerald-600">
                      {enrichmentData.allowedByRobotsTxt ? "Crawl Allowed" : "Disallowed"}
                    </span>
                  </div>
                  {enrichmentData.metaTitle && (
                    <div>
                      <span className="text-slate-500">Page Title:</span>
                      <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                        {enrichmentData.metaTitle}
                      </p>
                    </div>
                  )}
                  {enrichmentData.metaDescription && (
                    <div>
                      <span className="text-slate-500">Meta Description:</span>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                        {enrichmentData.metaDescription}
                      </p>
                    </div>
                  )}
                  {enrichmentData.error && (
                    <div className="text-rose-500">Note: {enrichmentData.error}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
