'use client';

import React from 'react';
import { Volume2, Mic, ArrowRight, Monitor, CheckCircle, ExternalLink } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function VirtualAudioGuide({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 text-white">
      <div className="bg-neutral-900 border border-neutral-700 max-w-xl w-full rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-100">Virtual Audio Cable Routing Guide</h3>
              <p className="text-[11px] text-neutral-400">How to route SynapseFlow TTS into Google Meet, Zoom, or Teams</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {/* Visual Routing Pipeline Diagram */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">SOURCE</span>
            <span className="text-xs font-bold text-cyan-400">SynapseFlow Browser TTS</span>
            <span className="text-[10px] text-neutral-400">SpeechSynthesis Audio</span>
          </div>

          <div className="hidden sm:flex items-center text-neutral-600">
            <ArrowRight className="w-5 h-5 text-cyan-400" />
          </div>

          <div className="flex flex-col items-center sm:items-start bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">VIRTUAL DRIVER</span>
            <span className="text-xs font-bold text-purple-400">VB-CABLE / BlackHole</span>
            <span className="text-[10px] text-neutral-400">Virtual Audio Cable Device</span>
          </div>

          <div className="hidden sm:flex items-center text-neutral-600">
            <ArrowRight className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="flex flex-col items-center sm:items-start">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">DESTINATION</span>
            <span className="text-xs font-bold text-emerald-400">Google Meet / Zoom</span>
            <span className="text-[10px] text-neutral-400">Microphone Input Selected</span>
          </div>
        </div>

        {/* 3 Step Instructions */}
        <div className="space-y-3 text-xs">
          <div className="flex gap-3 items-start bg-neutral-950/60 p-3 rounded-xl border border-neutral-800">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">
              1
            </span>
            <div>
              <p className="font-semibold text-neutral-200">Install Free Virtual Audio Device</p>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                On Windows: Install <strong>VB-CABLE</strong> (free). On macOS: Install <strong>BlackHole</strong> (free open source).
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start bg-neutral-950/60 p-3 rounded-xl border border-neutral-800">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">
              2
            </span>
            <div>
              <p className="font-semibold text-neutral-200">Set SynapseFlow Output to Cable Input</p>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                In Chrome settings or Windows sound volume mixer, route the browser output sound to <em>CABLE Input</em>.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start bg-neutral-950/60 p-3 rounded-xl border border-neutral-800">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">
              3
            </span>
            <div>
              <p className="font-semibold text-neutral-200">Select Cable Output as Microphone in Google Meet / Zoom</p>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                Inside Google Meet settings $\to$ Audio $\to$ Microphone, select <em>CABLE Output (VB-Audio)</em>. Now whenever you dwell with your eyes, your teammates hear your voice in crystal-clear digital fidelity!
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition"
        >
          Got It, Ready to Collaborate
        </button>
      </div>
    </div>
  );
}
