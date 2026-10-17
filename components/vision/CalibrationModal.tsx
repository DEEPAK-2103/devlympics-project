'use client';

import React, { useState, useEffect } from 'react';
import { CalibrationManager } from '@/lib/vision/calibration';
import { CalibrationMatrix } from '@/lib/types';
import { CheckCircle2, Crosshair, Sparkles, RefreshCw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rawGaze: { x: number; y: number };
  onCalibrationComplete: (matrix: CalibrationMatrix) => void;
}

type Stage = 'intro' | 'center' | 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'complete';

export default function CalibrationModal({ isOpen, onClose, rawGaze, onCalibrationComplete }: Props) {
  const [stage, setStage] = useState<Stage>('intro');
  const [countdown, setCountdown] = useState<number>(3);
  const [samples, setSamples] = useState<{ [key: string]: { x: number; y: number }[] }>({
    center: [],
    top_left: [],
    top_right: [],
    bottom_left: [],
    bottom_right: [],
  });

  useEffect(() => {
    if (!isOpen) {
      setStage('intro');
      setCountdown(3);
      setSamples({ center: [], top_left: [], top_right: [], bottom_left: [], bottom_right: [] });
    }
  }, [isOpen]);

  // Handle stage transitions
  useEffect(() => {
    if (!isOpen || stage === 'intro' || stage === 'complete') return;

    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 700);
    } else {
      // Advance to next stage
      if (stage === 'center') {
        setStage('top_left');
        setCountdown(3);
      } else if (stage === 'top_left') {
        setStage('top_right');
        setCountdown(3);
      } else if (stage === 'top_right') {
        setStage('bottom_left');
        setCountdown(3);
      } else if (stage === 'bottom_left') {
        setStage('bottom_right');
        setCountdown(3);
      } else if (stage === 'bottom_right') {
        // Compute matrix
        const matrix = CalibrationManager.computeMatrix(
          samples.center,
          samples.top_left,
          samples.top_right,
          samples.bottom_left,
          samples.bottom_right
        );
        onCalibrationComplete(matrix);
        setStage('complete');
      }
    }

    return () => clearTimeout(timer);
  }, [isOpen, stage, countdown, onCalibrationComplete, samples]);

  // Collect samples during active point
  useEffect(() => {
    if (!isOpen || stage === 'intro' || stage === 'complete') return;

    setSamples((prev) => ({
      ...prev,
      [stage]: [...(prev[stage] || []), { x: rawGaze.x, y: rawGaze.y }],
    }));
  }, [isOpen, stage, rawGaze]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md text-white p-4">
      {stage === 'intro' && (
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-700/80 rounded-2xl p-6 text-center shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 mx-auto rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
            <Crosshair className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-100">5-Point Gaze Calibration</h2>
            <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
              To achieve sub-millimeter precision on your standard webcam, you will look at 5 glowing points on the screen for 2 seconds each.
            </p>
          </div>

          <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-xl p-3 text-xs text-neutral-300 text-left space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>Keep your head in a comfortable, steady posture</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>Track the pulsating beacon with your eyes only</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>Zero special hardware required; stored for future visits</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setStage('center');
                setCountdown(3);
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:brightness-110 transition text-sm"
            >
              Start Calibration
            </button>
          </div>
        </div>
      )}

      {/* Calibration Target Points */}
      {stage !== 'intro' && stage !== 'complete' && (
        <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
          {/* Instructions banner */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-neutral-900/90 border border-neutral-700 rounded-full px-6 py-2.5 text-center shadow-lg pointer-events-auto">
            <p className="text-sm font-medium text-cyan-300">
              Look directly at the glowing beacon: <span className="font-bold uppercase tracking-wider">{stage.replace('_', ' ')}</span>
            </p>
          </div>

          {/* Position Target */}
          <div
            className={`absolute flex flex-col items-center justify-center transition-all duration-500 ${
              stage === 'center'
                ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                : stage === 'top_left'
                ? 'top-16 left-16'
                : stage === 'top_right'
                ? 'top-16 right-16'
                : stage === 'bottom_left'
                ? 'bottom-16 left-16'
                : 'bottom-16 right-16'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-cyan-500/20 border-2 border-cyan-400 animate-ping absolute"></div>
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 shadow-[0_0_30px_rgba(6,182,212,0.8)] flex items-center justify-center text-white font-bold text-lg">
                {countdown}
              </div>
            </div>
            <span className="text-xs text-cyan-200 mt-2 font-mono tracking-widest uppercase">{stage.replace('_', ' ')}</span>
          </div>
        </div>
      )}

      {stage === 'complete' && (
        <div className="max-w-md w-full bg-neutral-900 border border-emerald-500/40 rounded-2xl p-6 text-center shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-100">Calibration Successful!</h2>
            <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
              Your iris coordinates are mapped to the 4-quadrant HUD coordinate space. Your calibrated profile has been saved.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setStage('center');
                setCountdown(3);
                setSamples({ center: [], top_left: [], top_right: [], bottom_left: [], bottom_right: [] });
              }}
              className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition text-sm flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Recalibrate
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:brightness-110 transition text-sm"
            >
              Done & Launch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
