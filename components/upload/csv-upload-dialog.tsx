"use client";

import React, { useState } from "react";
import Papa from "papaparse";
import { UploadCloud, Database, X, Check, AlertCircle, FileText } from "lucide-react";

interface CsvUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export function CsvUploadDialog({
  isOpen,
  onClose,
  onUploadSuccess,
}: CsvUploadDialogProps) {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSeedDemo = async () => {
    setIsSeeding(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/leads/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: "success", text: data.message });
        setTimeout(() => {
          onUploadSuccess();
          onClose();
        }, 1200);
      } else {
        setStatusMessage({ type: "error", text: data.message || "Failed to seed demo data" });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Network error seeding data" });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatusMessage(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rawLeads = results.data.map((row: any) => ({
            companyName: row["Company Name"] || row.companyName || row.name || "Unknown Company",
            domain: row["Domain"] || row.domain || "",
            websiteUrl: row["Website URL"] || row.websiteUrl || `https://${row.domain}`,
            category: row["Category"] || row.category || "B2B Workflow",
            description: row["Description"] || row.description || "",
            estimatedTeamSize: Number(row["Estimated Team Size"] || row.estimatedTeamSize || row.teamSize || 10),
            foundedYear: Number(row["Founded Year"] || row.foundedYear || 2019),
            estimatedArrMin: row["Estimated ARR Min"] ? Number(row["Estimated ARR Min"]) : null,
            estimatedArrMax: row["Estimated ARR Max"] ? Number(row["Estimated ARR Max"]) : null,
            arrHintString: row["ARR Hint"] || row.arrHintString || "",
            techStack: typeof row["Tech Stack"] === "string" ? row["Tech Stack"].split(";") : ["React", "PostgreSQL"],
            contactName: row["Contact Name"] || row.contactName || "",
            contactTitle: row["Contact Title"] || row.contactTitle || "",
            contactEmail: row["Contact Email"] || row.contactEmail || "",
            contactType: row["Contact Type"] || "UNKNOWN",
          })).filter((l: any) => l.domain || l.companyName);

          const res = await fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(rawLeads),
          });

          const data = await res.json();
          if (data.success) {
            setStatusMessage({
              type: "success",
              text: `Successfully ingested and scored ${data.count} new leads!`,
            });
            setTimeout(() => {
              onUploadSuccess();
              onClose();
            }, 1200);
          } else {
            setStatusMessage({ type: "error", text: data.error || "Upload failed" });
          }
        } catch (err: any) {
          setStatusMessage({ type: "error", text: err.message || "Failed to process CSV" });
        } finally {
          setIsUploading(false);
        }
      },
      error: (err) => {
        setIsUploading(false);
        setStatusMessage({ type: "error", text: `CSV parsing error: ${err.message}` });
      },
    });
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
            <UploadCloud className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Import & Ingest SaaS Leads
            </h2>
            <p className="text-xs text-slate-500">
              Upload raw leads from SaaSquatch or one-click seed 310+ realistic targets.
            </p>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 mb-4 ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
            }`}
          >
            {statusMessage.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {statusMessage.text}
          </div>
        )}

        <div className="space-y-4">
          {/* Quick Demo Seed Card */}
          <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-950 bg-indigo-50/40 dark:bg-indigo-950/20 flex items-center justify-between">
            <div>
              <div className="font-semibold text-xs text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                Benchmark Synthetic Dataset
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Loads 310+ pre-calculated SaaS targets with duplicate clusters and MX records.
              </p>
            </div>
            <button
              onClick={handleSeedDemo}
              disabled={isSeeding}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isSeeding ? "Seeding..." : "Load 310+ Leads"}
            </button>
          </div>

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold absolute">
              Or Upload Custom CSV
            </span>
          </div>

          {/* Drag & Drop Zone */}
          <label className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30 group">
            <FileText className="h-8 w-8 text-slate-400 group-hover:text-indigo-500 transition-colors mb-2" />
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isUploading ? "Parsing & Scoring Leads..." : "Click or drag CSV file to upload"}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Supports standard SaaS lead exports with Company Name, Domain, Team Size, Contact Email
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
