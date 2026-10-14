"use client";

import React from "react";
import { Lead } from "@/lib/types";
import { ScoreBadge } from "./score-badge";
import {
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpDown,
  Mail,
  UserCheck,
} from "lucide-react";

interface LeadTableProps {
  leads: Lead[];
  isLoading: boolean;
  selectedLeadId: string | null;
  onSelectLead: (lead: Lead) => void;
  page: number;
  pageSize: number;
  totalPages: number;
  totalLeads: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (column: "score" | "teamSize" | "arr" | "age" | "name") => void;
  selectedIds: string[];
  onToggleSelectId: (id: string) => void;
  onToggleSelectAll: () => void;
}

export function LeadTable({
  leads,
  isLoading,
  selectedLeadId,
  onSelectLead,
  page,
  pageSize,
  totalPages,
  totalLeads,
  onPageChange,
  onPageSizeChange,
  sortBy,
  sortOrder,
  onSortChange,
  selectedIds,
  onToggleSelectId,
  onToggleSelectAll,
}: LeadTableProps) {
  const allSelected = leads.length > 0 && leads.every((l) => selectedIds.includes(l.id));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Table Container */}
      <div className="overflow-x-auto min-h-[450px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 font-semibold select-none">
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="py-3 px-2 w-12 text-center">Rank</th>
              <th
                onClick={() => onSortChange("name")}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1">
                  Company Target
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>
              <th
                onClick={() => onSortChange("score")}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  Acquisition Score
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>
              <th className="py-3 px-3">SaaS Category</th>
              <th
                onClick={() => onSortChange("teamSize")}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  Team Size
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>
              <th
                onClick={() => onSortChange("arr")}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center gap-1">
                  ARR Bracket
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>
              <th className="py-3 px-3">Key Contact & Outreach</th>
              <th className="py-3 px-3 text-center">Data Quality</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              // Loading Skeleton State
              Array.from({ length: 8 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-3.5 px-3 text-center">
                    <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                  </td>
                  <td className="py-3.5 px-2 text-center">
                    <div className="h-4 w-6 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded mb-1" />
                    <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-1" />
                    <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                  </td>
                </tr>
              ))
            ) : leads.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={9} className="py-16 text-center text-slate-500">
                  <div className="max-w-sm mx-auto space-y-2">
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full w-12 h-12 mx-auto flex items-center justify-center text-slate-400">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      No matching leads found
                    </div>
                    <p className="text-xs text-slate-400">
                      Try clearing your search query or loosening your filter criteria.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              // Leads Rows
              leads.map((lead, idx) => {
                const rank = (page - 1) * pageSize + idx + 1;
                const isSelected = selectedLeadId === lead.id;
                const isChecked = selectedIds.includes(lead.id);

                return (
                  <tr
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? "bg-indigo-50/70 dark:bg-indigo-950/40"
                        : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    {/* Checkbox */}
                    <td
                      className="py-3.5 px-3 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelectId(lead.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    {/* Rank */}
                    <td className="py-3.5 px-2 text-center font-mono font-medium text-slate-400 text-[11px]">
                      #{rank}
                    </td>

                    {/* Company */}
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                        {lead.companyName}
                        <a
                          href={lead.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Open website"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {lead.domain}
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-3 text-center">
                      <ScoreBadge score={lead.overallScore} size="sm" />
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-3">
                      <span className="inline-block text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        {lead.category}
                      </span>
                    </td>

                    {/* Team Size */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                        {lead.estimatedTeamSize}
                      </div>
                      {lead.estimatedTeamSize >= 6 && lead.estimatedTeamSize <= 25 && (
                        <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium tracking-tight">
                          ETA Sweet Spot
                        </div>
                      )}
                    </td>

                    {/* ARR Hint */}
                    <td className="py-3.5 px-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {lead.arrHintString || "Undisclosed"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {lead.companyAge}y vintage ({lead.foundedYear})
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1">
                        {lead.contactType === "FOUNDER" && (
                          <UserCheck className="h-3 w-3 text-indigo-500" />
                        )}
                        {lead.contactName || "Inquiries Desk"}
                        <span className="text-[10px] text-slate-400 font-normal">
                          · {lead.contactTitle || lead.contactType}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                        <Mail className="h-2.5 w-2.5 opacity-60" />
                        {lead.contactEmail || "N/A"}
                      </div>
                    </td>

                    {/* Verification Badges */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Email MX Status */}
                        {lead.emailStatus === "VALID" ? (
                          <span title="Email syntax & MX verified">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          </span>
                        ) : lead.emailStatus === "INVALID" ? (
                          <span title="Undeliverable / Missing MX">
                            <XCircle className="h-3.5 w-3.5 text-rose-500" />
                          </span>
                        ) : (
                          <span title="Unverified email">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          </span>
                        )}

                        {/* Website Status */}
                        {lead.websiteStatus === "ONLINE" ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-medium">
                            200 OK
                          </span>
                        ) : lead.websiteStatus === "REDIRECT" ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 font-medium">
                            301
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 font-medium">
                            Offline
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="py-3 px-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-slate-800 dark:text-slate-200">{leads.length > 0 ? (page - 1) * pageSize + 1 : 0}</strong> to{" "}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.min(page * pageSize, totalLeads)}
            </strong>{" "}
            of <strong className="text-slate-800 dark:text-slate-200">{totalLeads}</strong> leads
          </span>
          {selectedIds.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
              {selectedIds.length} selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Rows per page */}
          <div className="flex items-center gap-1.5">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-1 text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          {/* Page navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-medium">
              Page {page} of {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
