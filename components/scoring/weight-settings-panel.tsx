"use client";

import React from "react";
import { ScoringWeights, DEFAULT_WEIGHTS } from "@/lib/types";
import { Sliders, RotateCcw, Zap, Sparkles } from "lucide-react";

interface WeightSettingsPanelProps {
  weights: ScoringWeights;
  onWeightsChange: (weights: ScoringWeights) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function WeightSettingsPanel({
  weights,
  onWeightsChange,
  isOpen,
  onClose,
}: WeightSettingsPanelProps) {
  if (!isOpen) return null;

  const handleSliderChange = (key: keyof ScoringWeights, value: number) => {
    onWeightsChange({
      ...weights,
      [key]: value,
    });
  };

  const handlePreset = (preset: ScoringWeights) => {
    onWeightsChange(preset);
  };

  const PRESETS: { name: string; desc: string; config: ScoringWeights }[] = [
    {
      name: "ETA Standard Balanced",
      desc: "Balanced search fund weighting across all 6 core deal criteria.",
      config: DEFAULT_WEIGHTS,
    },
    {
      name: "Founder-First Outreach",
      desc: "Prioritizes direct founder email access for proprietary deal flow.",
      config: {
        categoryWeight: 10,
        teamSizeWeight: 15,
        companyAgeWeight: 10,
        revenueWeight: 15,
        contactWeight: 35,
        healthTechWeight: 15,
      },
    },
    {
      name: "Revenue & Scale Focus",
      desc: "Heavily weights $1M-$3M ARR target bracket and 10+ person teams.",
      config: {
        categoryWeight: 15,
        teamSizeWeight: 25,
        companyAgeWeight: 10,
        revenueWeight: 35,
        contactWeight: 10,
        healthTechWeight: 5,
      },
    },
    {
      name: "Defensive Vertical SaaS",
      desc: "Emphasizes sticky, high-margin industry vertical software.",
      config: {
        categoryWeight: 35,
        teamSizeWeight: 15,
        companyAgeWeight: 15,
        revenueWeight: 15,
        contactWeight: 10,
        healthTechWeight: 10,
      },
    },
  ];

  const total =
    weights.categoryWeight +
    weights.teamSizeWeight +
    weights.companyAgeWeight +
    weights.revenueWeight +
    weights.contactWeight +
    weights.healthTechWeight;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xl transition-all duration-200">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Acquisition Scoring Weight Calibrator
            </h3>
            <p className="text-xs text-slate-500">
              Adjust sliders to dynamically re-rank all leads in real time. Total weight: {total}
            </p>
          </div>
        </div>

        <button
          onClick={() => handlePreset(DEFAULT_WEIGHTS)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset Defaults
        </button>
      </div>

      {/* Preset Buttons */}
      <div className="my-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Investment Thesis Presets
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handlePreset(p.config)}
              className="text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-indigo-50/30 transition-all text-xs group"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {p.name}
              </div>
              <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                {p.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
        {/* Category */}
        <div className="space-y-1.5 bg-slate-50/60 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              1. SaaS Category Defensibility
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {weights.categoryWeight}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            value={weights.categoryWeight}
            onChange={(e) => handleSliderChange("categoryWeight", Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
          <div className="text-[10px] text-slate-400">Rewards Vertical SaaS & B2B Workflows</div>
        </div>

        {/* Team Size */}
        <div className="space-y-1.5 bg-slate-50/60 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              2. Team Size Fit (6–25 Sweet Spot)
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {weights.teamSizeWeight}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            value={weights.teamSizeWeight}
            onChange={(e) => handleSliderChange("teamSizeWeight", Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
          <div className="text-[10px] text-slate-400">Penalizes solo founder key-man risk</div>
        </div>

        {/* Company Vintage */}
        <div className="space-y-1.5 bg-slate-50/60 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              3. Vintage & Durability (4–9 Years)
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {weights.companyAgeWeight}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            value={weights.companyAgeWeight}
            onChange={(e) => handleSliderChange("companyAgeWeight", Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
          <div className="text-[10px] text-slate-400">Targets proven PMF and founder liquidity</div>
        </div>

        {/* Revenue Range */}
        <div className="space-y-1.5 bg-slate-50/60 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              4. ARR Bracket ($1M–$3M Sweet Spot)
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {weights.revenueWeight}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            value={weights.revenueWeight}
            onChange={(e) => handleSliderChange("revenueWeight", Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
          <div className="text-[10px] text-slate-400">Sweet spot for search fund financing</div>
        </div>

        {/* Founder Contact */}
        <div className="space-y-1.5 bg-slate-50/60 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              5. Founder Direct Contact Quality
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {weights.contactWeight}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            value={weights.contactWeight}
            onChange={(e) => handleSliderChange("contactWeight", Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
          <div className="text-[10px] text-slate-400">Named Founder/CEO email vs info@ inboxes</div>
        </div>

        {/* Web Health & Tech */}
        <div className="space-y-1.5 bg-slate-50/60 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              6. Website Health & Modern Tech
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {weights.healthTechWeight}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            value={weights.healthTechWeight}
            onChange={(e) => handleSliderChange("healthTechWeight", Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
          <div className="text-[10px] text-slate-400">SSL status and modern maintainable stacks</div>
        </div>
      </div>
    </div>
  );
}
