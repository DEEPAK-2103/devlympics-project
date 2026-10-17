'use client';

import React, { useState } from 'react';
import { Eye, Volume2, ShieldCheck, Zap, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onStartCalibration: () => void;
}

export default function OnboardingModal({ isOpen, onClose, onStartCalibration }: Props) {
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 text-white">
      <div className="bg-neutral-900 border border-neutral-700 max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Progress dots */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-neutral-200">SynapseFlow Quickstart Guide</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`w-2 h-2 rounded-full transition-all ${
                  step === s ? 'bg-cyan-400 w-4' : step > s ? 'bg-cyan-600' : 'bg-neutral-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Welcome & Value Proposition */}
        {step === 1 && (
          <div className="space-y-4 text-center py-2 animate-in fade-in duration-150">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">Welcome to SynapseFlow</h3>
              <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                The bi-directional assistive bridge connecting non-verbal professionals to fast-paced agile engineering teams.
              </p>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero extra hardware ($0) — uses standard laptop webcam</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>120+ WPM equivalent communication rate (vs 8 WPM keyboards)</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Floor Reservation Beacon prevents conversational interruptions</span>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-semibold text-white text-xs flex items-center justify-center gap-2 transition"
            >
              <span>Next: How to Control with Your Eyes</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Gaze & Safety Guard Controls */}
        {step === 2 && (
          <div className="space-y-4 py-2 animate-in fade-in duration-150">
            <div className="text-center">
              <h3 className="text-base font-extrabold text-white">Ergonomic Gaze Mechanics</h3>
              <p className="text-xs text-neutral-400 mt-1">3 natural gestures are all you need:</p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <div>
                  <p className="font-bold text-neutral-200">350ms Dwell to Speak</p>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Simply look at any of the 4 quadrants on the HUD. The ring fills smoothly and synthesizes your full sentence.
                  </p>
                </div>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold">
                  2
                </div>
                <div>
                  <p className="font-bold text-neutral-200">Floor Reservation at 90ms</p>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    A visual pulse alerts peers that you are responding, holding the conversational floor so nobody interrupts.
                  </p>
                </div>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-xl flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 font-bold">
                  3
                </div>
                <div>
                  <p className="font-bold text-neutral-200">Prolonged Eye Closure Abort (&gt;800ms)</p>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Close your eyes for nearly a second or look away to the resting deadzone to immediately cancel any action.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="py-2.5 px-4 rounded-xl border border-neutral-700 text-neutral-300 text-xs font-semibold hover:bg-neutral-800 transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-semibold text-white text-xs flex items-center justify-center gap-2 transition"
              >
                <span>Next: Webcam Calibration</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Launch & Calibration */}
        {step === 3 && (
          <div className="space-y-4 text-center py-2 animate-in fade-in duration-150">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-lg">
              <Eye className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Ready for High-Accuracy Calibration</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Run the quick 5-point calibration now for personalized sub-millimeter eye tracking, or jump straight into the cockpit with intelligent auto-default calibration.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  onClose();
                  onStartCalibration();
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-white text-xs shadow-lg shadow-cyan-500/25 hover:brightness-110 transition"
              >
                Start 5-Point Calibration (Recommended)
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 font-semibold text-neutral-300 text-xs transition"
              >
                Continue with Auto-Calibration
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
