"use client";

import React, { useState } from "react";
import { LeadFilterCriteria } from "@/lib/types";
import { Search, Filter, Bookmark, Plus, X, Check } from "lucide-react";

interface LeadFiltersProps {
  criteria: LeadFilterCriteria;
  onCriteriaChange: (criteria: LeadFilterCriteria) => void;
  categories: string[];
}

interface SavedPreset {
  id: string;
  name: string;
  criteria: LeadFilterCriteria;
}

const DEFAULT_PRESETS: SavedPreset[] = [
  {
    id: "preset-prime",
    name: "Prime ETA Candidates",
    criteria: { minScore: 75, contactTypes: ["FOUNDER"], minTeamSize: 6, maxTeamSize: 30 },
  },
  {
    id: "preset-founders",
    name: "Founder Inboxes Only",
    criteria: { contactTypes: ["FOUNDER"] },
  },
  {
    id: "preset-vertical",
    name: "Vertical SaaS Targets",
    criteria: { categories: ["Vertical SaaS"], minScore: 60 },
  },
  {
    id: "preset-all-clean",
    name: "All Clean Leads",
    criteria: { hideDuplicates: true },
  },
];

export function LeadFilters({ criteria, onCriteriaChange, categories }: LeadFiltersProps) {
  const [presets, setPresets] = useState<SavedPreset[]>(DEFAULT_PRESETS);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [activePresetId, setActivePresetId] = useState<string | null>("preset-all-clean");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCriteriaChange({
      ...criteria,
      search: e.target.value,
    });
    setActivePresetId(null);
  };

  const handleScoreFilter = (minScore: number | undefined) => {
    onCriteriaChange({
      ...criteria,
      minScore,
    });
    setActivePresetId(null);
  };

  const handleCategoryToggle = (cat: string) => {
    const current = criteria.categories || [];
    const updated = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat];
    onCriteriaChange({
      ...criteria,
      categories: updated.length > 0 ? updated : undefined,
    });
    setActivePresetId(null);
  };

  const handleContactTypeChange = (type: string | undefined) => {
    onCriteriaChange({
      ...criteria,
      contactTypes: type ? [type as any] : undefined,
    });
    setActivePresetId(null);
  };

  const handleTeamSizeChange = (val: string) => {
    if (val === "sweet-spot") {
      onCriteriaChange({ ...criteria, minTeamSize: 6, maxTeamSize: 25 });
    } else if (val === "small") {
      onCriteriaChange({ ...criteria, minTeamSize: 1, maxTeamSize: 5 });
    } else if (val === "larger") {
      onCriteriaChange({ ...criteria, minTeamSize: 26, maxTeamSize: 60 });
    } else {
      onCriteriaChange({ ...criteria, minTeamSize: undefined, maxTeamSize: undefined });
    }
    setActivePresetId(null);
  };

  const handleApplyPreset = (preset: SavedPreset) => {
    setActivePresetId(preset.id);
    onCriteriaChange({
      ...preset.criteria,
      search: criteria.search,
    });
  };

  const handleSaveCurrentPreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: SavedPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      criteria: { ...criteria },
    };
    setPresets([...presets, newPreset]);
    setActivePresetId(newPreset.id);
    setNewPresetName("");
    setIsSavingPreset(false);
  };

  const hasActiveFilters =
    Boolean(criteria.search) ||
    criteria.minScore != null ||
    (criteria.categories && criteria.categories.length > 0) ||
    (criteria.contactTypes && criteria.contactTypes.length > 0) ||
    criteria.minTeamSize != null;

  const handleClearFilters = () => {
    onCriteriaChange({ hideDuplicates: true });
    setActivePresetId(null);
  };

  return (
    <div className="space-y-3">
      {/* Search and Primary Filters */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={criteria.search || ""}
            onChange={handleSearchChange}
            placeholder="Search company, domain, founder or email..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Quick Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Score Selector */}
          <select
            value={criteria.minScore ?? ""}
            onChange={(e) => handleScoreFilter(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-2 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Acquisition Scores</option>
            <option value="75">High Fit (≥ 75 / 100)</option>
            <option value="50">Medium Fit+ (≥ 50 / 100)</option>
            <option value="85">Tier-1 Targets (≥ 85 / 100)</option>
          </select>

          {/* Contact Quality */}
          <select
            value={criteria.contactTypes?.[0] ?? ""}
            onChange={(e) => handleContactTypeChange(e.target.value ? e.target.value : undefined)}
            className="px-3 py-2 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Contact Types</option>
            <option value="FOUNDER">Founders & Owners Only</option>
            <option value="C_LEVEL">C-Level Executives</option>
            <option value="GENERIC_INBOX">Generic Inboxes</option>
          </select>

          {/* Team Size */}
          <select
            onChange={(e) => handleTeamSizeChange(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Any Team Size</option>
            <option value="sweet-spot">ETA Sweet Spot (6–25)</option>
            <option value="small">Early Team (1–5)</option>
            <option value="larger">Established (26–60)</option>
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline px-2 py-1"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Category Pills & Saved Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Categories:
          </span>
          {categories.map((cat) => {
            const isSelected = criteria.categories?.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => handleCategoryToggle(cat)}
                className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white font-semibold shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Presets Toolbar */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <Bookmark className="h-3 w-3" /> Presets:
          </span>
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                activePresetId === preset.id
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-700 dark:text-indigo-300 font-semibold"
                  : "border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {preset.name}
            </button>
          ))}

          {/* Save Preset Button / Popover */}
          {!isSavingPreset ? (
            <button
              onClick={() => setIsSavingPreset(true)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5 ml-1"
              title="Save current filters as preset"
            >
              <Plus className="h-3 w-3" /> Save Preset
            </button>
          ) : (
            <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded border border-indigo-300 shadow-sm">
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="Preset name..."
                className="text-xs px-1.5 py-0.5 bg-transparent border-none focus:outline-none w-28 text-slate-800 dark:text-slate-200"
                autoFocus
              />
              <button
                onClick={handleSaveCurrentPreset}
                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                onClick={() => setIsSavingPreset(false)}
                className="p-1 text-slate-400 hover:bg-slate-100 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
