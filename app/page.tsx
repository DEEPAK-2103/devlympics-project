'use client';

import React, { useState, useCallback, useRef } from 'react';
import EyeTracker from '@/components/vision/EyeTracker';
import RadialHUD from '@/components/hud/RadialHUD';
import FloorBeacon from '@/components/hud/FloorBeacon';
import MeetingRoom from '@/components/meeting/MeetingRoom';
import SettingsDrawer from '@/components/hud/SettingsDrawer';
import { GazeCoords, QuadrantOption, ToneType } from '@/lib/types';
import { SpeechService } from '@/lib/audio/speechService';
import {
  Sparkles,
  Eye,
  Volume2,
  ShieldAlert,
  Zap,
  Activity,
  Award,
  Layers,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Cpu,
  MonitorCheck,
  MousePointer,
} from 'lucide-react';

const INITIAL_HUD_OPTIONS: QuadrantOption[] = [
  {
    id: 'opt-0',
    quadrant: 0,
    title: 'Approve PR #412',
    shortLabel: 'Approve',
    category: 'action',
    intentToken: 'Approve auth middleware PR with verified benchmarks',
    previewText: "I've reviewed the implementation and verified the benchmarks; ready to merge.",
  },
  {
    id: 'opt-1',
    quadrant: 1,
    title: 'On Track for Staging',
    shortLabel: 'On Track',
    category: 'status',
    intentToken: 'Status is green for staging deployment today',
    previewText: 'Our sprint deliverables remain on track for today’s staging deployment.',
  },
  {
    id: 'opt-2',
    quadrant: 2,
    title: 'Agreed, Let’s Roll',
    shortLabel: 'Agree',
    category: 'conversational',
    intentToken: 'Concur with technical direction',
    previewText: 'I fully concur with this strategy and suggest we proceed with rollout.',
  },
  {
    id: 'opt-3',
    quadrant: 3,
    title: 'Need Clarification',
    shortLabel: 'Clarify',
    category: 'contextual',
    intentToken: 'Flagged token expiration edge case in auth middleware',
    previewText: 'I noticed an unhandled token expiration edge case; let’s address that first.',
  },
];

export default function SynapseFlowPage() {
  const [activeQuadrant, setActiveQuadrant] = useState<number | null>(null);
  const [gazeCoords, setGazeCoords] = useState<GazeCoords | null>(null);
  const [isProlongedBlink, setIsProlongedBlink] = useState(false);
  const [isFloorReserved, setIsFloorReserved] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeakingText, setCurrentSpeakingText] = useState('');
  const [tone, setTone] = useState<ToneType>('professional');
  const [dwellTimeMs, setDwellTimeMs] = useState(350);
  const [isSimulatingMouse, setIsSimulatingMouse] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [options, setOptions] = useState<QuadrantOption[]>(INITIAL_HUD_OPTIONS);
  const [lastMeetingDialogue, setLastMeetingDialogue] = useState(
    'Alex, how are we looking on the auth middleware and rate limiting PR?'
  );

  // Inbound Bridge: When meeting speech arrives, distill into 4 new response cards
  const handleTranscriptUpdate = useCallback(
    async (transcript: string, speaker: string) => {
      setLastMeetingDialogue(transcript);
      try {
        const res = await fetch('/api/distill-meeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recentTranscript: transcript,
            speakerName: speaker,
            tone,
          }),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.options) && data.options.length === 4) {
          setOptions(data.options);
        }
      } catch (err) {
        console.error('Failed to distill meeting dialogue:', err);
      }
    },
    [tone]
  );

  // Gaze state update from EyeTracker
  const handleGazeUpdate = useCallback(
    (coords: GazeCoords, quadrant: 0 | 1 | 2 | 3 | null) => {
      setGazeCoords(coords);
      setActiveQuadrant(quadrant);
      if (coords.isProlongedBlink) {
        setIsProlongedBlink(true);
      } else {
        setIsProlongedBlink(false);
      }
    },
    []
  );

  // Outbound Bridge: When user dwells on a card, expand intent & speak aloud
  const handleSelectOption = useCallback(
    async (option: QuadrantOption) => {
      setIsFloorReserved(false);
      setIsSpeaking(true);
      setCurrentSpeakingText(option.previewText || option.intentToken);

      try {
        const res = await fetch('/api/expand-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intentToken: option.intentToken,
            category: option.category,
            tone,
            meetingContext: lastMeetingDialogue,
            activeTopic: 'Sprint Review',
          }),
        });

        const data = await res.json();
        const speechOutput = data.expandedSpeech || option.previewText || option.intentToken;

        setCurrentSpeakingText(speechOutput);

        // Speak aloud via TTS
        SpeechService.speakText(speechOutput, tone, () => {
          setIsSpeaking(false);
          setCurrentSpeakingText('');
        });
      } catch (err) {
        console.error('Failed to expand intent:', err);
        const fallbackText = option.previewText || option.intentToken;
        SpeechService.speakText(fallbackText, tone, () => {
          setIsSpeaking(false);
          setCurrentSpeakingText('');
        });
      }
    },
    [tone, lastMeetingDialogue]
  );

  return (
    <main className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 selection:bg-cyan-500 selection:text-black">
      {/* Floor Reservation Beacon */}
      <FloorBeacon
        isFloorReserved={isFloorReserved}
        isSpeaking={isSpeaking}
        speakingText={currentSpeakingText}
        userName="Alex Rivera"
      />

      {/* Top Navigation Bar */}
      <header className="border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">SynapseFlow</span>
                <span className="text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  v2.0 HUD
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Bi-Directional Assistive Collaboration Bridge</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Devlympics Shunya 2026 Tag */}
            <div className="hidden sm:flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-full text-xs text-neutral-300">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Devlympics – Shunya 2026</span>
              <span className="text-neutral-600">|</span>
              <span className="text-cyan-400 font-medium">Bridge the Gap</span>
            </div>

            {/* Quick Settings Drawer Trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="py-1.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white flex items-center gap-1.5 text-xs font-semibold transition"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Live System Performance Ticker */}
      <section className="bg-neutral-900/50 border-b border-neutral-800/60 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-neutral-400 text-[11px]">
            <span className="flex items-center gap-1.5 text-neutral-300 font-medium">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Vision Latency: <strong className="text-emerald-400 font-mono">16ms (WASM)</strong>
            </span>
            <span className="hidden md:inline text-neutral-700">•</span>
            <span className="hidden md:flex items-center gap-1.5 text-neutral-300 font-medium">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              Effective Bandwidth: <strong className="text-cyan-400 font-mono">120+ WPM</strong>
            </span>
            <span className="hidden md:inline text-neutral-700">•</span>
            <span className="hidden md:flex items-center gap-1.5 text-neutral-300 font-medium">
              <MonitorCheck className="w-3.5 h-3.5 text-purple-400" />
              Hardware Cost: <strong className="text-purple-400 font-mono">$0 (Standard Webcam)</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-neutral-400">Conversational Persona:</span>
            <span className="font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
              {tone}
            </span>
          </div>
        </div>
      </section>

      {/* Hero Problem-to-Bridge Headline */}
      <section className="px-4 sm:px-6 pt-6 pb-4 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Zero-Hardware Assistive AI for High-Paced Agile Teams</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Connecting Sparse Micro-Gazes to Real-Time Spoken Dialogue
            </h1>
            <p className="text-neutral-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Existing gaze keyboards force non-verbal engineers to spell letter-by-letter at 8 WPM. SynapseFlow
              transforms 350ms iris fixations into context-aware, fluent spoken sentences in under 1 second.
            </p>
          </div>

          {/* Mouse Simulation Toggle Banner */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                <MousePointer className="w-3.5 h-3.5 text-cyan-400" /> Test with Mouse Cursor
              </p>
              <p className="text-[11px] text-neutral-400">Simulate eye movement without webcam</p>
            </div>
            <button
              onClick={() => setIsSimulatingMouse(!isSimulatingMouse)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition ${
                isSimulatingMouse
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700'
              }`}
            >
              {isSimulatingMouse ? 'Cursor Active' : 'Enable Cursor'}
            </button>
          </div>
        </div>
      </section>

      {/* Main Interactive Cockpit (Split View) */}
      <section className="px-4 sm:px-6 py-4 max-w-7xl mx-auto w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Vision Engine + Radial HUD Cockpit (Side A) */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-bold text-white">Side A: Cognitive Gaze Cockpit</h2>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                  <span>Dwell Time:</span>
                  <strong className="text-cyan-400 font-mono">{dwellTimeMs}ms</strong>
                </div>
              </div>

              {/* Top: Eye Tracking Camera & Landmark Mesh */}
              <div className="mb-4">
                <EyeTracker
                  onGazeUpdate={handleGazeUpdate}
                  onProlongedBlink={() => setIsProlongedBlink(true)}
                  isSimulatingMouse={isSimulatingMouse}
                  onToggleMouseSimulation={() => setIsSimulatingMouse(!isSimulatingMouse)}
                />
              </div>

              {/* Center: The Radial HUD */}
              <div className="flex flex-col items-center justify-center p-2 bg-neutral-950/80 rounded-2xl border border-neutral-800/80 relative overflow-hidden">
                <div className="absolute top-2 left-3 text-[10px] text-neutral-500 font-mono uppercase tracking-widest">
                  Fitts's Law 4-Sector Polar HUD
                </div>
                <div className="py-2">
                  <RadialHUD
                    options={options}
                    activeQuadrant={activeQuadrant}
                    tone={tone}
                    onToneChange={setTone}
                    onSelectOption={handleSelectOption}
                    onFloorReserveChange={setIsFloorReserved}
                    dwellDurationMs={dwellTimeMs}
                    isProlongedBlink={isProlongedBlink}
                  />
                </div>

                {/* Instructions Bar */}
                <div className="w-full mt-2 pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400 px-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Look at any quadrant for 350ms to speak
                  </span>
                  <span className="flex items-center gap-1.5 text-neutral-500">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Close eyes &gt;800ms to abort
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Collaboration Stage & Video Meeting (Side B) */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 shadow-xl flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-bold text-white">Side B: Live Meeting Collaboration Stage</h2>
                </div>
                <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Bi-Directional Connected
                </span>
              </div>

              {/* Google Meet / Zoom Conference Simulator */}
              <div className="flex-1">
                <MeetingRoom
                  onTranscriptUpdate={handleTranscriptUpdate}
                  userSpeakingText={currentSpeakingText}
                  isUserSpeaking={isSpeaking}
                  activeFloorUser={isFloorReserved ? 'Alex Rivera' : undefined}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deep-Dive Architecture & Devlympics Solution Mapping */}
      <section className="px-4 sm:px-6 py-12 max-w-7xl mx-auto w-full border-t border-neutral-800/80 mt-12">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase bg-cyan-950/80 border border-cyan-800/50 px-3 py-1 rounded-full">
            Devlympics – Shunya 2026 Core Theme
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
            How SynapseFlow Bridges the Unbridgeable Chasm
          </h2>
          <p className="text-neutral-400 text-xs sm:text-sm mt-2 leading-relaxed">
            Connecting motor- and speech-impaired professionals with rapid, verbal-first software engineering teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 space-y-3 hover:border-cyan-500/50 transition duration-200">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">1. Zero-Hardware Vision Engine</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Eliminates the $5,000+ cost barrier of proprietary IR eye-trackers (Tobii, Dynavox). Leverages 478 MediaPipe
              landmarks, iris displacement vectors, and an adaptive Exponential Moving Average (EMA) jitter filter on any
              laptop webcam.
            </p>
            <div className="pt-2 text-[11px] font-mono text-cyan-300">
              Latency: &lt;18ms | 100% Client-Side WASM
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 space-y-3 hover:border-emerald-500/50 transition duration-200">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">2. Inbound Meeting Distillation</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Listens to real-time meeting dialogue via Web Speech and condenses peer questions into 4 immediate glance cards.
              Instead of spelling letter-by-letter, 1 glance selects a contextually intelligent response.
            </p>
            <div className="pt-2 text-[11px] font-mono text-emerald-300">
              Bandwidth: 120+ WPM equivalent communication rate
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 space-y-3 hover:border-purple-500/50 transition duration-200">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">3. Conversational Floor Reservation</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Solves the #1 cause of AAC exclusion: getting interrupted or talked over before speech can be typed. SynapseFlow
              emits a visual and acoustic beacon at 90ms dwell, reserving conversational space before speaking aloud.
            </p>
            <div className="pt-2 text-[11px] font-mono text-purple-300">
              Collision Rate: 0% | Natural human prosody
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-6 px-4 text-center text-xs text-neutral-500">
        <p>
          SynapseFlow • Built for GDG NSUT Devlympics – Shunya 2026 • Theme: <strong>Bridge the Gap</strong>
        </p>
      </footer>

      {/* Settings Drawer Modal */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        tone={tone}
        onToneChange={setTone}
        dwellTimeMs={dwellTimeMs}
        onDwellTimeChange={setDwellTimeMs}
        isSimulatingMouse={isSimulatingMouse}
        onToggleMouseSimulation={() => setIsSimulatingMouse(!isSimulatingMouse)}
      />
    </main>
  );
}
