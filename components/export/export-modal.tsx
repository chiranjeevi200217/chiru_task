"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet, Building2, X, Check } from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredCount: number;
  search?: string;
  minScore?: number;
}

export function ExportModal({
  isOpen,
  onClose,
  filteredCount,
  search,
  minScore,
}: ExportModalProps) {
  const [format, setFormat] = useState<"csv" | "hubspot">("hubspot");
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setIsExporting(true);
    const params = new URLSearchParams();
    params.set("format", format);
    if (search) params.set("search", search);
    if (minScore != null) params.set("minScore", String(minScore));

    const exportUrl = `/api/export?${params.toString()}`;
    window.location.href = exportUrl;

    setTimeout(() => {
      setIsExporting(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Download className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Export Qualified Targets
            </h2>
            <p className="text-xs text-slate-500">
              Download {filteredCount} filtered targets ready for your CRM and outreach workflows.
            </p>
          </div>
        </div>

        {/* Format Selector */}
        <div className="space-y-3 my-4">
          <div
            onClick={() => setFormat("hubspot")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              format === "hubspot"
                ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-600"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 font-semibold text-xs text-slate-900 dark:text-white">
                <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                HubSpot CRM Format (Recommended)
              </div>
              {format === "hubspot" && <Check className="h-4 w-4 text-indigo-600" />}
            </div>
            <p className="text-[11px] text-slate-500">
              Formatted with standard HubSpot headers (Company Domain Name, Work Email, First/Last Name, Lead Status, Annual Revenue, Acquisition Score).
            </p>
          </div>

          <div
            onClick={() => setFormat("csv")}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              format === "csv"
                ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-600"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 font-semibold text-xs text-slate-900 dark:text-white">
                <FileSpreadsheet className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Standard Clean CSV
              </div>
              {format === "csv" && <Check className="h-4 w-4 text-indigo-600" />}
            </div>
            <p className="text-[11px] text-slate-500">
              Raw analytical export including all raw signals, sub-scores, tech stack arrays, and Claude AI summary rationales.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={isExporting || filteredCount === 0}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Generating Export..." : `Download ${filteredCount} Leads (${format.toUpperCase()})`}
          </button>
        </div>
      </div>
    </div>
  );
}
