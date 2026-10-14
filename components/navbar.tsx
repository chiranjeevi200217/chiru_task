"use client";

import React from "react";
import {
  Layers,
  UploadCloud,
  GitMerge,
  Sliders,
  Download,
  ShieldCheck,
  Moon,
  Sun,
  Database,
  Sparkles,
} from "lucide-react";

interface NavbarProps {
  onOpenUpload: () => void;
  onOpenDedupe: () => void;
  onOpenWeights: () => void;
  onOpenExport: () => void;
  onRunBatchValidate: () => void;
  isValidating: boolean;
  duplicateCount: number;
  stats: {
    totalLeads: number;
    highFitCount: number;
    mediumFitCount: number;
    lowFitCount: number;
    duplicateCount: number;
    avgScore: number;
  };
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isWeightsOpen: boolean;
}

export function Navbar({
  onOpenUpload,
  onOpenDedupe,
  onOpenWeights,
  onOpenExport,
  onRunBatchValidate,
  isValidating,
  duplicateCount,
  stats,
  isDarkMode,
  onToggleDarkMode,
  isWeightsOpen,
}: NavbarProps) {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        {/* Top Branding & Main Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  LeadLens
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  ETA Dealflow
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                AI Lead Scoring & Clean-up Layer · Caprae Capital / SaaSquatch
              </p>
            </div>
          </div>

          {/* Stepper & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Step 1: Upload */}
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
            >
              <UploadCloud className="h-3.5 w-3.5 text-indigo-500" />
              1. Import / Seed
            </button>

            {/* Step 2: Dedupe Review */}
            <button
              onClick={onOpenDedupe}
              className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
            >
              <GitMerge className="h-3.5 w-3.5 text-indigo-500" />
              2. Clean-up & Dedupe
              {duplicateCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                  {duplicateCount}
                </span>
              )}
            </button>

            {/* Step 3: Sliders */}
            <button
              onClick={onOpenWeights}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isWeightsOpen
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              Tune Weights
            </button>

            {/* Step 4: Batch Validation */}
            <button
              onClick={onRunBatchValidate}
              disabled={isValidating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
              title="Verify Email MX records and check live homepage HTTP status"
            >
              <ShieldCheck className={`h-3.5 w-3.5 text-emerald-500 ${isValidating ? "animate-spin" : ""}`} />
              {isValidating ? "Validating..." : "Validate MX & Web"}
            </button>

            {/* Step 5: Export */}
            <button
              onClick={onOpenExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Export CRM
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Total Leads:</span>
            <strong className="text-slate-800 dark:text-slate-100 font-bold tabular-nums">
              {stats.totalLeads}
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">High Fit (≥75):</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
              {stats.highFitCount} targets
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Avg Lead Score:</span>
            <strong className="text-indigo-600 dark:text-indigo-400 font-bold tabular-nums">
              {stats.avgScore}/100
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Duplicates Detected:</span>
            <strong className="text-amber-600 dark:text-amber-400 font-bold tabular-nums">
              {duplicateCount} flagged
            </strong>
          </div>
        </div>
      </div>
    </header>
  );
}
