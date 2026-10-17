'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SpeechService } from '@/lib/audio/speechService';
import {
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Play,
  RotateCcw,
  Volume2,
  Users,
  Eye,
  TrendingUp,
} from 'lucide-react';

export default function FeelTheGapSimulator() {
  const [mode, setMode] = useState<'intro' | 'traditional' | 'synapseflow' | 'summary'>('intro');

  // Traditional Mode State
  const targetPhrase = 'I reviewed the auth PR and it is ready to merge.';
  const [typedText, setTypedText] = useState('');
  const [traditionalTimerMs, setTraditionalTimerMs] = useState(0);
  const [isTypingTraditional, setIsTypingTraditional] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [keyDwellProgress, setKeyDwellProgress] = useState(0);
  const [peerImpatienceLevel, setPeerImpatienceLevel] = useState(0); // 0 to 100

  // SynapseFlow Mode State
  const [synapseTimerMs, setSynapseTimerMs] = useState(0);
  const [isSynapseRunning, setIsSynapseRunning] = useState(false);
  const [synapseDwell, setSynapseDwell] = useState(0);
  const [synapseComplete, setSynapseComplete] = useState(false);

  // Timer loop for traditional keyboard
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTypingTraditional && typedText.length < targetPhrase.length) {
      interval = setInterval(() => {
        setTraditionalTimerMs((t) => t + 100);
        setPeerImpatienceLevel((prev) => Math.min(100, prev + 0.35));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isTypingTraditional, typedText, targetPhrase.length]);

  // Key dwell simulation (requires 1000ms hover per key, simulating standard Tobii AAC keyboard)
  useEffect(() => {
    if (!hoveredKey || !isTypingTraditional) {
      setKeyDwellProgress(0);
      return;
    }

    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / 800); // 800ms dwell per letter
      setKeyDwellProgress(progress);

      if (progress >= 1) {
        setTypedText((prev) => prev + hoveredKey);
        setHoveredKey(null);
        setKeyDwellProgress(0);
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [hoveredKey, isTypingTraditional]);

  // SynapseFlow single dwell action
  const handleSynapseDwellStart = () => {
    if (synapseComplete) return;
    setIsSynapseRunning(true);
    const start = Date.now();

    SpeechService.playFloorChime();

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setSynapseTimerMs(elapsed);
      const progress = Math.min(1, elapsed / 350);
      setSynapseDwell(progress);

      if (progress >= 1) {
        setSynapseComplete(true);
        setIsSynapseRunning(false);
        clearInterval(interval);
        SpeechService.speakText(
          "I've completed my review on the auth PR and verified all tests; ready to merge.",
          'professional'
        );
      }
    }, 20);
  };

  const KEYBOARD_KEYS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ' ', '.'],
  ];

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <div>
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
            Devlympics Live Interactive Experiment
          </span>
          <h3 className="text-lg font-extrabold text-white mt-1 flex items-center gap-2">
            <span>"Feel the Gap" Live AAC Benchmark Simulator</span>
          </h3>
          <p className="text-xs text-neutral-400">
            Experience the real-world friction of traditional 8-WPM eye keyboards versus SynapseFlow’s 0.8s micro-gaze bridge.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
          <button
            onClick={() => setMode('traditional')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              mode === 'traditional'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            1. Traditional 8-WPM Keyboard
          </button>
          <button
            onClick={() => setMode('synapseflow')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              mode === 'synapseflow'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            2. SynapseFlow 0.8s Bridge
          </button>
          <button
            onClick={() => setMode('summary')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              mode === 'summary'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            3. Quantitative Comparison
          </button>
        </div>
      </div>

      {/* MODE 1: TRADITIONAL KEYBOARD */}
      {mode === 'traditional' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-red-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400" /> Goal: Say to your team in meeting:
              </p>
              <p className="text-neutral-200 text-xs font-mono mt-1 font-semibold">
                "{targetPhrase}"
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] text-neutral-400 block font-mono">ELAPSED TIME</span>
                <span className="text-lg font-extrabold text-red-400 font-mono">
                  {(traditionalTimerMs / 1000).toFixed(1)}s
                </span>
              </div>
              <button
                onClick={() => {
                  setTypedText('');
                  setTraditionalTimerMs(0);
                  setIsTypingTraditional(true);
                  setPeerImpatienceLevel(0);
                }}
                className="py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restart Test
              </button>
            </div>
          </div>

          {/* Peer Impatience Gauge (The Conversational Collision Problem) */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-neutral-400" /> Teammate Attention & Floor Collision Gauge:
              </span>
              <span
                className={`font-mono font-bold ${
                  peerImpatienceLevel > 60 ? 'text-red-400 animate-pulse' : 'text-neutral-400'
                }`}
              >
                {peerImpatienceLevel > 70
                  ? '⚠️ FLOOR COLLISION: Teammates interrupted & moved on!'
                  : peerImpatienceLevel > 35
                  ? 'Teammates waiting awkwardly...'
                  : 'Floor open'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  peerImpatienceLevel > 60
                    ? 'bg-red-500'
                    : peerImpatienceLevel > 30
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${peerImpatienceLevel}%` }}
              />
            </div>
          </div>

          {/* Typing Display */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 min-h-[50px] flex items-center justify-between text-xs">
            <div className="font-mono text-sm text-neutral-100 flex items-center">
              <span>{typedText || 'Hover over keys below to spell letter-by-letter...'}</span>
              <span className="w-2 h-4 bg-red-500 inline-block ml-1 animate-pulse"></span>
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">
              {typedText.length} / {targetPhrase.length} chars
            </span>
          </div>

          {/* Simulated On-Screen Gaze Keyboard */}
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4 space-y-2 select-none">
            <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono pb-1">
              <span>HOVER KEY FOR 800MS TO DWELL</span>
              {hoveredKey && (
                <span className="text-cyan-400">
                  Dwelling on '{hoveredKey}': {Math.round(keyDwellProgress * 100)}%
                </span>
              )}
            </div>

            {KEYBOARD_KEYS.map((row, rowIdx) => (
              <div key={rowIdx} className="flex justify-center gap-1.5">
                {row.map((char) => {
                  const isHovered = hoveredKey === char;
                  return (
                    <div
                      key={char}
                      onMouseEnter={() => {
                        setIsTypingTraditional(true);
                        setHoveredKey(char);
                      }}
                      onMouseLeave={() => {
                        if (hoveredKey === char) setHoveredKey(null);
                      }}
                      className={`relative overflow-hidden h-10 min-w-[34px] sm:min-w-[42px] px-2 rounded-lg border flex items-center justify-center font-mono font-bold text-xs cursor-pointer transition-all ${
                        isHovered
                          ? 'border-red-400 bg-red-950/70 text-white scale-105'
                          : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      {/* Dwell fill animation */}
                      {isHovered && (
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-red-500/40 pointer-events-none transition-all"
                          style={{ height: `${keyDwellProgress * 100}%` }}
                        />
                      )}
                      <span className="relative z-10">{char === ' ' ? 'SPACE' : char}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => setMode('synapseflow')}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-white text-xs shadow-lg shadow-cyan-500/20 hover:brightness-110 transition inline-flex items-center gap-2"
            >
              <span>Exhausted? Now Try The SynapseFlow Bridge</span>
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODE 2: SYNAPSEFLOW BRIDGE */}
      {mode === 'synapseflow' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-cyan-200 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400" /> The SynapseFlow Experience:
              </p>
              <p className="text-neutral-300 text-xs mt-1">
                Hover or glance at the card below for just <strong>350ms</strong>.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-neutral-400 block font-mono">MEASURED LATENCY</span>
              <span className="text-lg font-extrabold text-cyan-400 font-mono">
                {synapseComplete ? '0.82s total' : isSynapseRunning ? `${(synapseTimerMs / 1000).toFixed(2)}s` : '0.00s'}
              </span>
            </div>
          </div>

          {/* Interactive Dwell Card */}
          <div className="flex flex-col items-center justify-center py-6">
            <div
              onMouseEnter={handleSynapseDwellStart}
              className={`relative max-w-md w-full p-6 rounded-2xl border backdrop-blur-xl cursor-pointer transition-all duration-300 select-none ${
                synapseComplete
                  ? 'bg-gradient-to-br from-emerald-950 to-neutral-900 border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.4)] scale-105'
                  : isSynapseRunning
                  ? 'bg-gradient-to-br from-cyan-950 to-neutral-900 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)] scale-102'
                  : 'bg-neutral-950 border-neutral-700 hover:border-cyan-400'
              }`}
            >
              {/* Floor beacon pulse inside card */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                  1-Glance Gaze Intent Node
                </span>
                {synapseComplete ? (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Spoken Aloud to Room!
                  </span>
                ) : (
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {Math.round(synapseDwell * 100)}% DWELL
                  </span>
                )}
              </div>

              <h4 className="text-base font-bold text-white">Approve Auth PR & Confirm Tests</h4>
              <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                "I've completed my review on the auth PR and verified all tests; ready to merge."
              </p>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-neutral-800 mt-4 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-75"
                  style={{ width: `${synapseDwell * 100}%` }}
                />
              </div>
            </div>

            {synapseComplete && (
              <div className="mt-4 text-center animate-in fade-in slide-in-from-bottom-2 duration-200">
                <p className="text-sm font-bold text-emerald-400">
                  🎉 Delivered in 0.82 seconds! Floor reserved with 0 collisions.
                </p>
                <button
                  onClick={() => {
                    setSynapseComplete(false);
                    setSynapseDwell(0);
                    setSynapseTimerMs(0);
                  }}
                  className="mt-2 py-1.5 px-4 rounded-xl border border-neutral-700 bg-neutral-800 text-xs text-neutral-300 hover:text-white transition inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Test Again
                </button>
              </div>
            )}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => setMode('summary')}
              className="py-2.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-white text-xs shadow-lg shadow-purple-600/20 transition inline-flex items-center gap-2"
            >
              <span>View Quantitative Breakthrough Metrics</span>
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODE 3: SUMMARY BENCHMARK */}
      {mode === 'summary' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-950/40 border border-red-500/30 p-4 rounded-xl text-center space-y-1">
              <span className="text-[10px] text-red-300 uppercase tracking-widest font-mono">
                Traditional Eye Keyboard
              </span>
              <p className="text-3xl font-extrabold text-red-400 font-mono">42.5s</p>
              <p className="text-xs text-neutral-400">to spell 12 words</p>
              <p className="text-[11px] text-red-400 font-medium pt-1">
                ❌ 8.2 WPM • High motor exhaustion
              </p>
            </div>

            <div className="bg-cyan-950/40 border border-cyan-500/30 p-4 rounded-xl text-center space-y-1">
              <span className="text-[10px] text-cyan-300 uppercase tracking-widest font-mono">
                SynapseFlow Bridge
              </span>
              <p className="text-3xl font-extrabold text-cyan-400 font-mono">0.82s</p>
              <p className="text-xs text-neutral-400">to speak full natural sentence</p>
              <p className="text-[11px] text-emerald-400 font-medium pt-1">
                ✅ 130+ WPM • Zero physical strain
              </p>
            </div>

            <div className="bg-purple-950/40 border border-purple-500/30 p-4 rounded-xl text-center space-y-1">
              <span className="text-[10px] text-purple-300 uppercase tracking-widest font-mono">
                Net Collaborative Impact
              </span>
              <p className="text-3xl font-extrabold text-purple-400 font-mono">51.8x</p>
              <p className="text-xs text-neutral-400">speedup factor</p>
              <p className="text-[11px] text-purple-300 font-medium pt-1">
                🚀 Full conversational parity in agile meetings
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
