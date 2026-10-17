'use client';

import React from 'react';
import { Volume2, Sparkles, MessageSquare, Radio } from 'lucide-react';

interface Props {
  isFloorReserved: boolean;
  isSpeaking: boolean;
  speakingText?: string;
  userName?: string;
}

export default function FloorBeacon({
  isFloorReserved,
  isSpeaking,
  speakingText,
  userName = 'Alex',
}: Props) {
  if (!isFloorReserved && !isSpeaking) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-200">
      <div
        className={`px-4 py-2.5 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-3 transition-all duration-200 ${
          isSpeaking
            ? 'bg-gradient-to-r from-cyan-950/90 to-blue-950/90 border-cyan-400/80 shadow-[0_0_35px_rgba(6,182,212,0.5)]'
            : 'bg-gradient-to-r from-amber-950/90 to-neutral-900/90 border-amber-500/80 shadow-[0_0_35px_rgba(245,158,11,0.4)]'
        }`}
      >
        {/* Pulsing indicator */}
        <div className="relative flex items-center justify-center">
          <span
            className={`animate-ping absolute inline-flex h-4 w-4 rounded-full opacity-75 ${
              isSpeaking ? 'bg-cyan-400' : 'bg-amber-400'
            }`}
          ></span>
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-white ${
              isSpeaking ? 'bg-cyan-500' : 'bg-amber-500'
            }`}
          >
            {isSpeaking ? <Volume2 className="w-4 h-4 animate-bounce" /> : <Radio className="w-4 h-4 animate-spin" />}
          </div>
        </div>

        {/* Content text */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white tracking-wide">
              {userName}
            </span>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                isSpeaking
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/30'
                  : 'bg-amber-500/30 text-amber-200 border border-amber-400/30'
              }`}
            >
              {isSpeaking ? 'Speaking to Room' : 'Floor Reserved (Drafting Response)'}
            </span>
          </div>

          <p className="text-xs text-neutral-200 font-medium truncate mt-0.5 max-w-sm sm:max-w-md">
            {isSpeaking ? `"${speakingText}"` : 'Please hold the floor for a moment...'}
          </p>
        </div>

        {/* Animated Audio Equalizer Bars */}
        <div className="flex items-center gap-0.5 h-4">
          <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3"></span>
          <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite_0.2s] h-4"></span>
          <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.1s] h-2"></span>
        </div>
      </div>
    </div>
  );
}
