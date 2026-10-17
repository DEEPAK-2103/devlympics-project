'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import EyeTracker from '@/components/vision/EyeTracker';
import RadialHUD from '@/components/hud/RadialHUD';
import FloorBeacon from '@/components/hud/FloorBeacon';
import { GazeCoords, QuadrantOption, ToneType, GestureType, VoiceProfile } from '@/lib/types';
import { SpeechService, DEFAULT_VOICE_PROFILE } from '@/lib/audio/speechService';
import { Eye, Volume2, ShieldAlert, Zap, Sliders, ExternalLink, Minimize2, ArrowLeft, Radio } from 'lucide-react';
import Link from 'next/link';

const DEFAULT_HUD_OPTIONS: QuadrantOption[] = [
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
  const [options, setOptions] = useState<QuadrantOption[]>(DEFAULT_HUD_OPTIONS);
  const [activeQuadrant, setActiveQuadrant] = useState<number | null>(null);
  const [isProlongedBlink, setIsProlongedBlink] = useState(false);
  const [isFloorReserved, setIsFloorReserved] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingText, setSpeakingText] = useState('');
  const [tone, setTone] = useState<ToneType>('professional');
  const [isSimulatingMouse, setIsSimulatingMouse] = useState(false);
  const [profile, setProfile] = useState<VoiceProfile>(DEFAULT_VOICE_PROFILE);
  const [isSyncedWithCockpit, setIsSyncedWithCockpit] = useState(false);

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Initialize Voice Profile and Cross-Window Bus
  useEffect(() => {
    const saved = SpeechService.loadSavedVoiceProfile();
    setProfile(saved);

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('synapseflow_bus');
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        const data = event.data;
        if (!data) return;

        if (data.type === 'SYNC_STATE' || data.type === 'OPTIONS_UPDATE') {
          if (Array.isArray(data.options) && data.options.length === 4) {
            setOptions(data.options);
          }
          if (data.tone) setTone(data.tone);
          if (data.profile) setProfile(data.profile);
          setIsSyncedWithCockpit(true);
        } else if (data.type === 'TONE_UPDATE') {
          if (data.tone) setTone(data.tone);
        } else if (data.type === 'PROFILE_UPDATE') {
          if (data.profile) setProfile(data.profile);
        }
      };

      // Request current state from main cockpit
      channel.postMessage({ type: 'REQUEST_SYNC' });

      return () => {
        channel.close();
      };
    }
  }, []);

  const handleGazeUpdate = useCallback((coords: GazeCoords, quadrant: 0 | 1 | 2 | 3 | null) => {
    setActiveQuadrant(quadrant);
    setIsProlongedBlink(coords.isProlongedBlink);
  }, []);

  // Multi-modal gesture handling in floating HUD
  const handleGesture = useCallback(
    (gesture: GestureType) => {
      if (gesture === 'browRaise') {
        setIsFloorReserved(true);
        SpeechService.playGestureChime('brow');
        broadcastChannelRef.current?.postMessage({
          type: 'FLOOR_RESERVE',
          isReserved: true,
        });
      } else if (gesture === 'nod') {
        SpeechService.playGestureChime('nod');
        // Quick Affirmation
        const affirmText = "Yes, exactly, I completely agree.";
        setIsSpeaking(true);
        setSpeakingText(affirmText);
        SpeechService.speakText(affirmText, tone, () => {
          setIsSpeaking(false);
          setSpeakingText('');
        }, profile);
        broadcastChannelRef.current?.postMessage({
          type: 'SPOKEN_PHRASE',
          text: affirmText,
        });
      } else if (gesture === 'shake') {
        SpeechService.playGestureChime('shake');
        setIsFloorReserved(false);
        setActiveQuadrant(null);
        broadcastChannelRef.current?.postMessage({
          type: 'FLOOR_RESERVE',
          isReserved: false,
        });
      }
    },
    [tone, profile]
  );

  const handleSelectOption = useCallback(
    async (option: QuadrantOption) => {
      setIsFloorReserved(false);
      setIsSpeaking(true);
      const fallback = option.previewText || option.intentToken;
      setSpeakingText(fallback);

      try {
        const res = await fetch('/api/expand-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intentToken: option.intentToken,
            category: option.category,
            tone,
            userName: profile.userName,
            userRole: profile.role,
            techStack: profile.techStack,
          }),
        });

        const data = await res.json();
        const speechOutput = data.expandedSpeech || fallback;

        setSpeakingText(speechOutput);
        SpeechService.speakText(
          speechOutput,
          tone,
          () => {
            setIsSpeaking(false);
            setSpeakingText('');
          },
          profile
        );

        // Notify main cockpit of spoken phrase
        broadcastChannelRef.current?.postMessage({
          type: 'SPOKEN_PHRASE',
          text: speechOutput,
        });
      } catch (err) {
        console.warn('HUD intent expand fallback:', err);
        SpeechService.speakText(
          fallback,
          tone,
          () => {
            setIsSpeaking(false);
            setSpeakingText('');
          },
          profile
        );
      }
    },
    [tone, profile]
  );

  return (
    <div className="min-h-screen bg-neutral-950/95 text-white flex flex-col justify-between p-3 select-none backdrop-blur-md">
      {/* Floor Beacon Alert */}
      <FloorBeacon
        isFloorReserved={isFloorReserved}
        isSpeaking={isSpeaking}
        speakingText={speakingText}
        userName={profile.userName}
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
          {isSyncedWithCockpit && (
            <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded font-mono flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 animate-pulse" /> SYNCED
            </span>
          )}
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
          options={options}
          activeQuadrant={activeQuadrant}
          tone={tone}
          onToneChange={(newTone) => {
            setTone(newTone);
            broadcastChannelRef.current?.postMessage({ type: 'TONE_UPDATE', tone: newTone });
          }}
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
          onGesture={handleGesture}
          isSimulatingMouse={isSimulatingMouse}
          onToggleMouseSimulation={() => setIsSimulatingMouse(!isSimulatingMouse)}
        />
      </div>
    </div>
  );
}
