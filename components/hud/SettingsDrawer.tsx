'use client';

import React from 'react';
import { ToneType } from '@/lib/types';
import { Settings, Sliders, Volume2, Shield, Eye, KeyRound } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tone: ToneType;
  onToneChange: (tone: ToneType) => void;
  dwellTimeMs: number;
  onDwellTimeChange: (time: number) => void;
  isSimulatingMouse: boolean;
  onToggleMouseSimulation: () => void;
}

export default function SettingsDrawer({
  isOpen,
  onClose,
  tone,
  onToneChange,
  dwellTimeMs,
  onDwellTimeChange,
  isSimulatingMouse,
  onToggleMouseSimulation,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 text-white">
      <div className="bg-neutral-900 border border-neutral-700 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-base text-neutral-100">SynapseFlow Ergonomic Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {/* Tone Persona Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-cyan-400" /> Spoken Persona & Tone
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['professional', 'direct', 'casual'] as ToneType[]).map((t) => (
              <button
                key={t}
                onClick={() => onToneChange(t)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition ${
                  tone === t
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : 'bg-neutral-800/80 border-neutral-700/80 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-neutral-500">
            {tone === 'professional' && 'High-signal, polished engineering team tone with complete context.'}
            {tone === 'direct' && 'Ultra-concise, rapid-fire executive updates without filler.'}
            {tone === 'casual' && 'Friendly, relaxed standup conversational phrasing.'}
          </p>
        </div>

        {/* Dwell Duration Tuning */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-neutral-300 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-cyan-400" /> Gaze Dwell Duration
            </label>
            <span className="font-mono text-cyan-400 font-bold">{dwellTimeMs} ms</span>
          </div>
          <input
            type="range"
            min="250"
            max="700"
            step="25"
            value={dwellTimeMs}
            onChange={(e) => onDwellTimeChange(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
            <span>250ms (Expert)</span>
            <span>350ms (Optimal)</span>
            <span>700ms (Deliberate)</span>
          </div>
        </div>

        {/* Cursor Simulation Toggle */}
        <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-200">Mouse Cursor Simulation</p>
            <p className="text-[11px] text-neutral-400">Control gaze vector with mouse pointer for testing</p>
          </div>
          <button
            onClick={onToggleMouseSimulation}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              isSimulatingMouse ? 'bg-cyan-500' : 'bg-neutral-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                isSimulatingMouse ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Environment API Key note */}
        <div className="bg-neutral-800/60 border border-neutral-700/60 rounded-xl p-3 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
            <KeyRound className="w-3.5 h-3.5" /> Google Gemini Intelligence Engine
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            SynapseFlow automatically detects <code className="text-cyan-300 bg-neutral-900 px-1 py-0.5 rounded">GEMINI_API_KEY</code> from your <code className="text-cyan-300 bg-neutral-900 px-1 py-0.5 rounded">.env.local</code>. When unset, high-performance contextual dynamic generation runs with zero latency.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-white text-xs shadow-lg shadow-cyan-500/20 hover:brightness-110 transition"
        >
          Save & Apply
        </button>
      </div>
    </div>
  );
}
