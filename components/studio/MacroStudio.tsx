'use client';

import React, { useState, useEffect } from 'react';
import { QuadrantOption } from '@/lib/types';
import { Layers, Sparkles, Check, Plus, Edit2, RotateCcw, Save } from 'lucide-react';

export interface PresetPack {
  id: string;
  name: string;
  description: string;
  options: QuadrantOption[];
}

export const PRESET_PACKS: PresetPack[] = [
  {
    id: 'standup',
    name: 'Daily Engineering Standup',
    description: 'Sprint status, blocker reporting, and code review coordination.',
    options: [
      {
        id: 'std-0',
        quadrant: 0,
        title: 'Approve PR #412',
        shortLabel: 'Approve',
        category: 'action',
        intentToken: 'Approve auth middleware PR with verified benchmarks',
        previewText: "I've reviewed the implementation and verified the benchmarks; ready to merge.",
      },
      {
        id: 'std-1',
        quadrant: 1,
        title: 'On Track for Staging',
        shortLabel: 'On Track',
        category: 'status',
        intentToken: 'Status is green for staging deployment today',
        previewText: 'Our sprint deliverables remain on track for today’s staging deployment.',
      },
      {
        id: 'std-2',
        quadrant: 2,
        title: 'Agreed, Let’s Roll',
        shortLabel: 'Agree',
        category: 'conversational',
        intentToken: 'Concur with technical direction',
        previewText: 'I fully concur with this strategy and suggest we proceed with rollout.',
      },
      {
        id: 'std-3',
        quadrant: 3,
        title: 'Need Clarification',
        shortLabel: 'Clarify',
        category: 'contextual',
        intentToken: 'Flagged token expiration edge case in auth middleware',
        previewText: 'I noticed an unhandled token expiration edge case; let’s address that first.',
      },
    ],
  },
  {
    id: 'incident',
    name: 'P0 Incident Triage',
    description: 'Urgent production war room responses, rollback coordination, and log analysis.',
    options: [
      {
        id: 'inc-0',
        quadrant: 0,
        title: 'Roll Back Release',
        shortLabel: 'Rollback',
        category: 'action',
        intentToken: 'Initiate immediate rollback of current deployment',
        previewText: 'I recommend we execute an immediate rollback to the previous stable release.',
      },
      {
        id: 'inc-1',
        quadrant: 1,
        title: 'Investigating Telemetry',
        shortLabel: 'Telemetry',
        category: 'status',
        intentToken: 'Analyzing Datadog latency spike and error rates',
        previewText: 'I am actively inspecting Datadog APM traces and error rate spikes.',
      },
      {
        id: 'inc-2',
        quadrant: 2,
        title: 'Update Status Page',
        shortLabel: 'Status Page',
        category: 'action',
        intentToken: 'Publish customer status page incident notice',
        previewText: 'Let us post an official incident update on our customer status dashboard.',
      },
      {
        id: 'inc-3',
        quadrant: 3,
        title: 'Traffic Stabilized',
        shortLabel: 'Stabilized',
        category: 'status',
        intentToken: 'Database connection pool has recovered',
        previewText: 'P99 latencies and database pool connections have returned to normal.',
      },
    ],
  },
  {
    id: 'design',
    name: 'Design & UX Critique',
    description: 'Figma reviews, user experience feedback, and design system alignment.',
    options: [
      {
        id: 'des-0',
        quadrant: 0,
        title: 'Design Approved',
        shortLabel: 'Approved',
        category: 'action',
        intentToken: 'Approve Figma user flows and token hierarchy',
        previewText: 'The proposed layout and color hierarchy align perfectly with our design tokens.',
      },
      {
        id: 'des-1',
        quadrant: 1,
        title: 'Mobile Touch Friction',
        shortLabel: 'Mobile UX',
        category: 'contextual',
        intentToken: 'Touch targets are smaller than 44px on mobile',
        previewText: 'The mobile modal touch targets appear slightly cramped; let us increase padding.',
      },
      {
        id: 'des-2',
        quadrant: 2,
        title: 'Needs User Testing',
        shortLabel: 'Usability Test',
        category: 'status',
        intentToken: 'Recommend running 5 user usability interviews',
        previewText: 'I suggest we validate this checkout flow with 5 unmoderated user sessions.',
      },
      {
        id: 'des-3',
        quadrant: 3,
        title: 'Contrast Accessible',
        shortLabel: 'A11y Validated',
        category: 'conversational',
        intentToken: 'Meets WCAG AAA color contrast criteria',
        previewText: 'Contrast ratios verify WCAG AAA compliance across both light and dark themes.',
      },
    ],
  },
];

const MACRO_PACKS_STORAGE_KEY = 'synapseflow_macro_packs_v1';

interface Props {
  activeOptions: QuadrantOption[];
  onApplyPack: (options: QuadrantOption[]) => void;
}

export default function MacroStudio({ activeOptions, onApplyPack }: Props) {
  const [packs, setPacks] = useState<PresetPack[]>(PRESET_PACKS);
  const [selectedPackId, setSelectedPackId] = useState<string>('standup');
  const [customOptions, setCustomOptions] = useState<QuadrantOption[]>(activeOptions);
  const [editingQuadrant, setEditingQuadrant] = useState<number | null>(null);
  const [saveToast, setSaveToast] = useState(false);

  // Load custom packs from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(MACRO_PACKS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPacks(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load macro packs from localStorage:', e);
    }
  }, []);

  const handleSelectPack = (pack: PresetPack) => {
    setSelectedPackId(pack.id);
    setCustomOptions(pack.options);
    onApplyPack(pack.options);
  };

  const handleUpdateOption = (quad: number, title: string, previewText: string) => {
    const updated = customOptions.map((opt) =>
      opt.quadrant === quad ? { ...opt, title, previewText, intentToken: previewText } : opt
    );
    setCustomOptions(updated);
    onApplyPack(updated);

    // Save updated pack into packs list and localStorage
    const updatedPacks = packs.map((p) =>
      p.id === selectedPackId ? { ...p, options: updated } : p
    );
    setPacks(updatedPacks);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(MACRO_PACKS_STORAGE_KEY, JSON.stringify(updatedPacks));
      } catch (e) {
        console.warn('Failed to save updated packs:', e);
      }
    }

    setEditingQuadrant(null);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleResetDefaults = () => {
    setPacks(PRESET_PACKS);
    setSelectedPackId('standup');
    setCustomOptions(PRESET_PACKS[0].options);
    onApplyPack(PRESET_PACKS[0].options);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(MACRO_PACKS_STORAGE_KEY);
    }
  };

  return (
    <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Macro Wheel Studio & Category Packs</span>
          </h3>
          <p className="text-xs text-neutral-400">
            Instantly switch or customize your 4-quadrant response wheels for different meeting types.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveToast && (
            <span className="text-[11px] text-emerald-400 font-semibold animate-in fade-in duration-150">
              ✓ Saved to Wheel!
            </span>
          )}
          <button
            onClick={handleResetDefaults}
            className="py-1.5 px-3 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300 hover:text-white transition flex items-center gap-1.5"
            title="Reset preset packs to original defaults"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Packs</span>
          </button>
        </div>
      </div>

      {/* Preset Packs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {packs.map((pack) => {
          const isSelected = selectedPackId === pack.id;
          return (
            <div
              key={pack.id}
              onClick={() => handleSelectPack(pack)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-gradient-to-br from-cyan-950/70 to-neutral-900 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                  : 'bg-neutral-900/90 border-neutral-800 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">{pack.name}</span>
                {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed line-clamp-2">
                {pack.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Active Wheel Editor */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Active Wheel Layout (Click to edit any quadrant):
          </h4>
          <span className="text-[10px] text-neutral-500 font-mono">
            Automatically applies to Gaze Cockpit & Floating HUD
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {customOptions.map((opt) => (
            <div
              key={opt.id}
              className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5 relative group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                  Quadrant {opt.quadrant} • {opt.category}
                </span>
                <button
                  onClick={() => setEditingQuadrant(opt.quadrant)}
                  className="text-neutral-500 hover:text-cyan-400 text-xs flex items-center gap-1 transition"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              </div>

              {editingQuadrant === opt.quadrant ? (
                <div className="space-y-2 pt-1 animate-in fade-in duration-100">
                  <input
                    type="text"
                    defaultValue={opt.title}
                    id={`title-${opt.quadrant}`}
                    className="w-full text-xs font-semibold bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white focus:outline-none focus:border-cyan-400"
                    placeholder="Short Title"
                  />
                  <textarea
                    defaultValue={opt.previewText}
                    id={`preview-${opt.quadrant}`}
                    rows={2}
                    className="w-full text-[11px] bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-neutral-300 focus:outline-none focus:border-cyan-400 resize-none"
                    placeholder="Spoken Response Sentence"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const t = (document.getElementById(`title-${opt.quadrant}`) as HTMLInputElement)?.value;
                        const p = (document.getElementById(`preview-${opt.quadrant}`) as HTMLTextAreaElement)?.value;
                        handleUpdateOption(opt.quadrant, t || opt.title, p || opt.previewText || '');
                      }}
                      className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingQuadrant(null)}
                      className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-[11px] transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold text-neutral-100">{opt.title}</p>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                    "{opt.previewText || opt.intentToken}"
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
