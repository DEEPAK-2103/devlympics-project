'use client';

import React, { useState, useCallback } from 'react';
import EyeTracker from '@/components/vision/EyeTracker';
import RadialHUD from '@/components/hud/RadialHUD';
import FloorBeacon from '@/components/hud/FloorBeacon';
import { GazeCoords, QuadrantOption, ToneType } from '@/lib/types';
import { SpeechService } from '@/lib/audio/speechService';
import { Eye, Volume2, ShieldAlert, Zap, Sliders, ExternalLink, Minimize2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const HUD_OPTIONS: QuadrantOption[] = [
  {
    id: 'hud-0',
    quadrant: 0,
    title: 'Approve PR',
    shortLabel: 'Approve',
    category: 'action',
    intentToken: 'Approve PR with verified tests',
    previewText: "I've reviewed the changes and verified the tests; looks solid and ready to merge.",
  },
  {
    id: 'hud-1',
    quadrant: 1,
    title: 'On Track',
    shortLabel: 'On Track',
    category: 'status',
    intentToken: 'Status is on track for staging deployment',
    previewText: 'Everything on my side is progressing smoothly and on track for staging.',
  },
  {
    id: 'hud-2',
    quadrant: 2,
    title: 'Agreed',
    shortLabel: 'Agree',
    category: 'conversational',
    intentToken: 'Agree with approach',
    previewText: 'I completely agree with this direction, let us proceed.',
  },
  {
    id: 'hud-3',
    quadrant: 3,
    title: 'Need Clarification',
    shortLabel: 'Clarify',
    category: 'contextual',
    intentToken: 'Request quick clarification on schema',
    previewText: 'Could someone clarify the token expiration edge case before we proceed?',
  },
];

export default function FloatingHUDPage() {
  const [activeQuadrant, setActiveQuadrant] = useState<number | null>(null);
  const [isProlongedBlink, setIsProlongedBlink] = useState(false);
  const [isFloorReserved, setIsFloorReserved] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingText, setSpeakingText] = useState('');
  const [tone, setTone] = useState<ToneType>('professional');
  const [isSimulatingMouse, setIsSimulatingMouse] = useState(false);

  const handleGazeUpdate = useCallback((coords: GazeCoords, quadrant: 0 | 1 | 2 | 3 | null) => {
    setActiveQuadrant(quadrant);
    setIsProlongedBlink(coords.isProlongedBlink);
  }, []);

  const handleSelectOption = useCallback(
    async (option: QuadrantOption) => {
      setIsFloorReserved(false);
      setIsSpeaking(true);
      const text = option.previewText || option.intentToken;
      setSpeakingText(text);

      SpeechService.speakText(text, tone, () => {
        setIsSpeaking(false);
        setSpeakingText('');
      });
    },
    [tone]
  );

  return (
    <div className="min-h-screen bg-neutral-950/95 text-white flex flex-col justify-between p-3 select-none backdrop-blur-md">
      {/* Floor Beacon Alert */}
      <FloorBeacon
        isFloorReserved={isFloorReserved}
        isSpeaking={isSpeaking}
        speakingText={speakingText}
        userName="Alex Rivera"
      />

      {/* Mini Titlebar */}
      <div className="flex items-center justify-between py-1.5 px-2 bg-neutral-900/80 rounded-xl border border-neutral-800 text-xs">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition"
            title="Return to Main Workspace"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
          <span className="font-bold text-white flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" /> SynapseFlow Floating HUD
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimulatingMouse(!isSimulatingMouse)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${
              isSimulatingMouse
                ? 'bg-purple-600/30 border-purple-500/50 text-purple-300'
                : 'bg-neutral-800 border-neutral-700 text-neutral-400'
            }`}
          >
            {isSimulatingMouse ? 'CURSOR ON' : 'EYE GAZE'}
          </button>
        </div>
      </div>

      {/* Compact HUD Centerpiece */}
      <div className="flex-1 flex items-center justify-center py-4">
        <RadialHUD
          options={HUD_OPTIONS}
          activeQuadrant={activeQuadrant}
          tone={tone}
          onToneChange={setTone}
          onSelectOption={handleSelectOption}
          onFloorReserveChange={setIsFloorReserved}
          dwellDurationMs={350}
          isProlongedBlink={isProlongedBlink}
        />
      </div>

      {/* Mini Embedded Eye Tracker */}
      <div className="max-w-[280px] mx-auto w-full">
        <EyeTracker
          onGazeUpdate={handleGazeUpdate}
          onProlongedBlink={() => setIsProlongedBlink(true)}
          isSimulatingMouse={isSimulatingMouse}
          onToggleMouseSimulation={() => setIsSimulatingMouse(!isSimulatingMouse)}
        />
      </div>
    </div>
  );
}
