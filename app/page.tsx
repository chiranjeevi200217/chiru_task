"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Lead, ScoringWeights, DEFAULT_WEIGHTS, LeadFilterCriteria } from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { LeadTable } from "@/components/leads/lead-table";
import { LeadFilters } from "@/components/leads/lead-filters";
import { LeadDetailSheet } from "@/components/leads/lead-detail-sheet";
import { WeightSettingsPanel } from "@/components/scoring/weight-settings-panel";
import { DedupeDialog } from "@/components/dedupe/dedupe-dialog";
import { CsvUploadDialog } from "@/components/upload/csv-upload-dialog";
import { ExportModal } from "@/components/export/export-modal";

const AVAILABLE_CATEGORIES = [
  "Vertical SaaS",
  "B2B Workflow",
  "DevTools & Infra",
  "Cybersecurity & RegTech",
  "Sales & MarTech",
  "Consumer & Agency Utility",
];

export default function LeadLensDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [sortBy, setSortBy] = useState<"score" | "teamSize" | "arr" | "age" | "name">("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filtering & Live Sliders
  const [criteria, setCriteria] = useState<LeadFilterCriteria>({ hideDuplicates: true });
  const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);

  // Stats & Duplicates
  const [stats, setStats] = useState({
    totalLeads: 0,
    highFitCount: 0,
    mediumFitCount: 0,
    lowFitCount: 0,
    duplicateCount: 0,
    avgScore: 0,
  });
  const [duplicateClusterCount, setDuplicateClusterCount] = useState(0);

  // Modals & Drawers
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDedupeOpen, setIsDedupeOpen] = useState(false);
  const [isWeightsOpen, setIsWeightsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  };

  // Fetch Duplicate Count
  const fetchDuplicatesCount = useCallback(async () => {
    try {
      const res = await fetch("/api/dedupe/scan");
      const data = await res.json();
      if (data.success) {
        setDuplicateClusterCount(data.clusterCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch duplicate clusters:", err);
    }
  }, []);

  // Fetch Leads
  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      // Scoring Weights
      params.set("categoryWeight", String(weights.categoryWeight));
      params.set("teamSizeWeight", String(weights.teamSizeWeight));
      params.set("companyAgeWeight", String(weights.companyAgeWeight));
      params.set("revenueWeight", String(weights.revenueWeight));
      params.set("contactWeight", String(weights.contactWeight));
      params.set("healthTechWeight", String(weights.healthTechWeight));

      // Filters
      if (criteria.search) params.set("search", criteria.search);
      if (criteria.minScore != null) params.set("minScore", String(criteria.minScore));
      if (criteria.maxScore != null) params.set("maxScore", String(criteria.maxScore));
      if (criteria.categories && criteria.categories.length > 0) {
        params.set("categories", criteria.categories.join(","));
      }
      if (criteria.contactTypes && criteria.contactTypes.length > 0) {
        params.set("contactTypes", criteria.contactTypes.join(","));
      }
      if (criteria.minTeamSize != null) params.set("minTeamSize", String(criteria.minTeamSize));
      if (criteria.maxTeamSize != null) params.set("maxTeamSize", String(criteria.maxTeamSize));
      if (criteria.hideDuplicates !== undefined) {
        params.set("hideDuplicates", String(criteria.hideDuplicates));
      }

      const res = await fetch(`/api/leads?${params.toString()}`);
      const data = await res.json();

      if (data.leads) {
        setLeads(data.leads);
        setTotalLeads(data.total);
        setTotalPages(data.totalPages);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error("Failed to load leads:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, weights, criteria]);

  useEffect(() => {
    fetchLeads();
    fetchDuplicatesCount();
  }, [fetchLeads, fetchDuplicatesCount]);

  // Lead selection & Drawer
  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailOpen(true);
  };

  const handleToggleSelectId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (leads.length > 0 && leads.every((l) => selectedIds.includes(l.id))) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map((l) => l.id));
    }
  };

  const handleSortChange = (column: "score" | "teamSize" | "arr" | "age" | "name") => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  // Batch Validation Trigger
  const handleRunBatchValidate = async () => {
    setIsValidating(true);
    try {
      const idsToValidate = selectedIds.length > 0 ? selectedIds : leads.map((l) => l.id);
      const res = await fetch("/api/validate/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: idsToValidate }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchLeads();
      }
    } catch (err) {
      console.error("Validation failed:", err);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenDedupe={() => setIsDedupeOpen(true)}
        onOpenWeights={() => setIsWeightsOpen(!isWeightsOpen)}
        onOpenExport={() => setIsExportOpen(true)}
        onRunBatchValidate={handleRunBatchValidate}
        isValidating={isValidating}
        duplicateCount={duplicateClusterCount}
        stats={stats}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        isWeightsOpen={isWeightsOpen}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Live Weight Sliders Drawer / Panel */}
        <WeightSettingsPanel
          weights={weights}
          onWeightsChange={setWeights}
          isOpen={isWeightsOpen}
          onClose={() => setIsWeightsOpen(false)}
        />

        {/* Filter Controls Bar */}
        <LeadFilters
          criteria={criteria}
          onCriteriaChange={(newCrit) => {
            setCriteria(newCrit);
            setPage(1);
          }}
          categories={AVAILABLE_CATEGORIES}
        />

        {/* Ranked Lead Matrix Table */}
        <LeadTable
          leads={leads}
          isLoading={isLoading}
          selectedLeadId={selectedLead?.id ?? null}
          onSelectLead={handleSelectLead}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          totalLeads={totalLeads}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          selectedIds={selectedIds}
          onToggleSelectId={handleToggleSelectId}
          onToggleSelectAll={handleToggleSelectAll}
        />
      </main>

      {/* Detail Slide-over Panel */}
      <LeadDetailSheet
        lead={selectedLead}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onExplanationUpdated={(id, newExplanation) => {
          setSelectedLead((prev) => (prev ? { ...prev, aiExplanation: newExplanation } : null));
          setLeads((prev) =>
            prev.map((l) => (l.id === id ? { ...l, aiExplanation: newExplanation } : l))
          );
        }}
      />

      {/* Modals */}
      <DedupeDialog
        isOpen={isDedupeOpen}
        onClose={() => setIsDedupeOpen(false)}
        onMergeComplete={() => {
          fetchLeads();
          fetchDuplicatesCount();
        }}
      />

      <CsvUploadDialog
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          fetchLeads();
          fetchDuplicatesCount();
        }}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        filteredCount={totalLeads}
        search={criteria.search}
        minScore={criteria.minScore}
      />
    </div>
  );
}
