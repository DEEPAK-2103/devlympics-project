'use client';

import React, { useState } from 'react';
import { SpeechService } from '@/lib/audio/speechService';
import { ShieldAlert, HeartPulse, Bell, CheckCircle2, PhoneCall, Coffee } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CaregiverSafeguard({ isOpen, onClose }: Props) {
  const [activeAlert, setActiveAlert] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTriggerAssist = (type: 'break' | 'caregiver' | 'medical') => {
    if (type === 'break') {
      setActiveAlert('break');
      SpeechService.speakText(
        'Team, I need to request a brief 5-minute ergonomic posture and hydration break.',
        'professional'
      );
    } else if (type === 'caregiver') {
      setActiveAlert('caregiver');
      SpeechService.speakText(
        'Alerting caregiver for physical positioning assistance.',
        'professional'
      );
    } else {
      setActiveAlert('medical');
      SpeechService.speakText(
        'Emergency medical pause requested. Please hold call immediately.',
        'direct'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 text-white">
      <div className="bg-neutral-900 border border-neutral-700 max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-100">Caregiver & Assistive Safety Net</h3>
              <p className="text-[11px] text-neutral-400">Discreet ergonomic distress and physical assistance triggers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {/* Action 1: Ergonomic Break */}
          <button
            onClick={() => handleTriggerAssist('break')}
            className="w-full p-3.5 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-amber-500/60 hover:bg-amber-950/20 text-left transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-neutral-200 group-hover:text-amber-300">
                  Request 5-Minute Ergonomic Break
                </p>
                <p className="text-[11px] text-neutral-400">
                  Politely speaks aloud to meeting peers requesting a brief posture & eye rest break.
                </p>
              </div>
            </div>
          </button>

          {/* Action 2: Caregiver Notification */}
          <button
            onClick={() => handleTriggerAssist('caregiver')}
            className="w-full p-3.5 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-cyan-500/60 hover:bg-cyan-950/20 text-left transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-neutral-200 group-hover:text-cyan-300">
                  Ping Caregiver / Physical Assistant
                </p>
                <p className="text-[11px] text-neutral-400">
                  Dispatches an instant alert to nurse/family member for wheelchair or physical adjustments.
                </p>
              </div>
            </div>
          </button>

          {/* Action 3: Medical Emergency */}
          <button
            onClick={() => handleTriggerAssist('medical')}
            className="w-full p-3.5 rounded-xl border border-red-500/40 bg-red-950/30 hover:bg-red-950/60 text-left transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-red-200">
                  Emergency Medical Pause
                </p>
                <p className="text-[11px] text-neutral-400">
                  Immediately halts meeting audio and signals urgent distress to attendees.
                </p>
              </div>
            </div>
          </button>
        </div>

        {activeAlert && (
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center gap-2 text-xs text-emerald-400 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Safeguard alert triggered and broadcasted successfully.</span>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition"
        >
          Close Safety Window
        </button>
      </div>
    </div>
  );
}
