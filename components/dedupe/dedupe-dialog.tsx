"use client";

import React, { useState, useEffect } from "react";
import { DuplicateCluster } from "@/lib/types";
import {
  GitMerge,
  X,
  AlertCircle,
  Check,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

interface DedupeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMergeComplete: () => void;
}

export function DedupeDialog({ isOpen, onClose, onMergeComplete }: DedupeDialogProps) {
  const [clusters, setClusters] = useState<DuplicateCluster[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mergingId, setMergingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadClusters();
    }
  }, [isOpen]);

  const loadClusters = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/dedupe/scan");
      const data = await res.json();
      if (data.success) {
        setClusters(data.clusters || []);
      }
    } catch (err) {
      console.error("Failed to load duplicate clusters:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMerge = async (primaryId: string, duplicateId: string) => {
    setMergingId(duplicateId);
    try {
      const res = await fetch("/api/dedupe/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryId, duplicateId }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message);
        setTimeout(() => setSuccessMessage(null), 3500);
        await loadClusters();
        onMergeComplete();
      }
    } catch (err) {
      console.error("Merge failed:", err);
    } finally {
      setMergingId(null);
    }
  };

  const handleDismiss = async (duplicateId: string) => {
    try {
      const res = await fetch("/api/dedupe/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duplicateId }),
      });
      const data = await res.json();
      if (data.success) {
        await loadClusters();
        onMergeComplete();
      }
    } catch (err) {
      console.error("Dismiss failed:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <GitMerge className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Deduplication & Merge Decision Hub
              </h2>
              <p className="text-xs text-slate-500">
                Identify duplicate domain variations and fuzzy company matches before outreach.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" />
            {successMessage}
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <Sparkles className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
              Scanning dataset for canonical domain overlap and fuzzy name matches...
            </div>
          ) : clusters.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                No Duplicate Leads Detected
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your pipeline is currently deduplicated. All domains and company stems are unique.
              </p>
            </div>
          ) : (
            clusters.map((cluster, cIdx) => (
              <div
                key={cIdx}
                className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/40 dark:bg-slate-800/20 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400">
                      Cluster #{cIdx + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {cluster.duplicates[0]?.matchReason || "Duplicate Candidate"}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {Math.round((cluster.duplicates[0]?.confidence || 0.95) * 100)}% Match Confidence
                  </span>
                </div>

                {cluster.duplicates.map((dupItem, dIdx) => (
                  <div
                    key={dIdx}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2"
                  >
                    {/* Primary Card */}
                    <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                        Primary Record
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {cluster.primaryLead.companyName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mb-2">
                        {cluster.primaryLead.domain}
                      </div>
                      <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <strong>Contact:</strong> {cluster.primaryLead.contactName || "None"} (
                          {cluster.primaryLead.contactType})
                        </div>
                        <div>
                          <strong>Email:</strong> {cluster.primaryLead.contactEmail || "N/A"}
                        </div>
                        <div>
                          <strong>Team:</strong> {cluster.primaryLead.estimatedTeamSize} emp ·{" "}
                          <strong>ARR:</strong> {cluster.primaryLead.arrHintString}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          <strong>Tech:</strong> {cluster.primaryLead.techStack.join(", ")}
                        </div>
                      </div>
                    </div>

                    {/* Duplicate Candidate Card */}
                    <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-indigo-200 dark:border-indigo-900/60 relative flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                          Duplicate Candidate
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {dupItem.lead.companyName}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mb-2">
                          {dupItem.lead.domain}
                        </div>
                        <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div>
                            <strong>Contact:</strong> {dupItem.lead.contactName || "None"} (
                            {dupItem.lead.contactType})
                          </div>
                          <div>
                            <strong>Email:</strong> {dupItem.lead.contactEmail || "N/A"}
                          </div>
                          <div>
                            <strong>Team:</strong> {dupItem.lead.estimatedTeamSize} emp ·{" "}
                            <strong>ARR:</strong> {dupItem.lead.arrHintString}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            <strong>Tech:</strong> {dupItem.lead.techStack.join(", ")}
                          </div>
                        </div>
                      </div>

                      {/* Merge / Dismiss Actions */}
                      <div className="flex items-center gap-2 pt-3 mt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => handleMerge(cluster.primaryLead.id, dupItem.lead.id)}
                          disabled={mergingId === dupItem.lead.id}
                          className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                        >
                          <GitMerge className="h-3.5 w-3.5" />
                          {mergingId === dupItem.lead.id ? "Merging..." : "Merge into Primary"}
                        </button>
                        <button
                          onClick={() => handleDismiss(dupItem.lead.id)}
                          className="py-1.5 px-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs transition-colors"
                        >
                          Keep Separate
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
          <span>
            {clusters.length} duplicate cluster{clusters.length === 1 ? "" : "s"} remaining
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
