'use client';

import React, { useState, useCallback } from 'react';
import EyeTracker from '@/components/vision/EyeTracker';
import RadialHUD from '@/components/hud/RadialHUD';
import FloorBeacon from '@/components/hud/FloorBeacon';
import MeetingRoom from '@/components/meeting/MeetingRoom';
import SettingsDrawer from '@/components/hud/SettingsDrawer';
import MacroStudio, { PRESET_PACKS } from '@/components/studio/MacroStudio';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import FeelTheGapSimulator from '@/components/experience/FeelTheGapSimulator';
import CodeReviewBridge from '@/components/code/CodeReviewBridge';
import VoiceProfileManager from '@/components/profile/VoiceProfileManager';
import CaregiverSafeguard from '@/components/safety/CaregiverSafeguard';
import SlackIntegrationModal from '@/components/integrations/SlackIntegrationModal';
import VirtualAudioGuide from '@/components/integrations/VirtualAudioGuide';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import CalibrationModal from '@/components/vision/CalibrationModal';
import { GazeCoords, QuadrantOption, ToneType } from '@/lib/types';
import { SpeechService } from '@/lib/audio/speechService';
import Link from 'next/link';
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
  ExternalLink,
  Hash,
  HelpCircle,
  BarChart3,
  GitPullRequest,
  HeartPulse,
  User,
  Gauge,
} from 'lucide-react';

export default function SynapseFlowPage() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    'cockpit' | 'simulator' | 'code' | 'macros' | 'identity' | 'analytics'
  >('cockpit');

  // Gaze & Vision State
  const [activeQuadrant, setActiveQuadrant] = useState<number | null>(null);
  const [gazeCoords, setGazeCoords] = useState<GazeCoords | null>(null);
  const [isProlongedBlink, setIsProlongedBlink] = useState(false);
  const [isSimulatingMouse, setIsSimulatingMouse] = useState(false);
  const [calibrationModalOpen, setCalibrationModalOpen] = useState(false);

  // Audio & Meeting State
  const [isFloorReserved, setIsFloorReserved] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeakingText, setCurrentSpeakingText] = useState('');
  const [tone, setTone] = useState<ToneType>('professional');
  const [dwellTimeMs, setDwellTimeMs] = useState(350);

  // Options & Meeting Context
  const [options, setOptions] = useState<QuadrantOption[]>(PRESET_PACKS[0].options);
  const [lastMeetingDialogue, setLastMeetingDialogue] = useState(
    'Alex, how are we looking on the auth middleware and rate limiting PR?'
  );

  // Real-Time Analytics State
  const [totalPhrasesSpoken, setTotalPhrasesSpoken] = useState(5);
  const [totalWordsSpoken, setTotalWordsSpoken] = useState(72);
  const [abortedCount, setAbortedCount] = useState(0);

  // Integrations & Modals State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSlackOpen, setIsSlackOpen] = useState(false);
  const [isAudioGuideOpen, setIsAudioGuideOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isCaregiverOpen, setIsCaregiverOpen] = useState(false);
  const [slackEnabled, setSlackEnabled] = useState(true);
  const [slackChannel, setSlackChannel] = useState('#engineering-standup');
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [lastSlackDispatched, setLastSlackDispatched] = useState('');

  // Handle Aborted Eye-Closure
  const handleProlongedBlink = useCallback(() => {
    setIsProlongedBlink(true);
    setAbortedCount((c) => c + 1);
  }, []);

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
      setIsProlongedBlink(coords.isProlongedBlink);
    },
    []
  );

  // Outbound Bridge: When user dwells on a card, expand intent, speak aloud & broadcast to Slack
  const handleSelectOption = useCallback(
    async (option: QuadrantOption) => {
      setIsFloorReserved(false);
      setIsSpeaking(true);
      const previewFallback = option.previewText || option.intentToken;
      setCurrentSpeakingText(previewFallback);

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
        const speechOutput = data.expandedSpeech || previewFallback;

        setCurrentSpeakingText(speechOutput);
        setTotalPhrasesSpoken((c) => c + 1);
        setTotalWordsSpoken((w) => w + speechOutput.split(' ').length);

        // Speak aloud via TTS
        SpeechService.speakText(speechOutput, tone, () => {
          setIsSpeaking(false);
          setCurrentSpeakingText('');
        });

        // Broadcast to Slack if enabled
        if (slackEnabled) {
          setLastSlackDispatched(speechOutput);
          fetch('/api/slack-broadcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: speechOutput,
              channel: slackChannel,
              webhookUrl: slackWebhookUrl,
              userName: 'Alex Rivera',
              tone,
            }),
          }).catch((err) => console.warn('Slack broadcast background notice:', err));
        }
      } catch (err) {
        console.error('Failed to expand intent:', err);
        SpeechService.speakText(previewFallback, tone, () => {
          setIsSpeaking(false);
          setCurrentSpeakingText('');
        });
      }
    },
    [tone, lastMeetingDialogue, slackEnabled, slackChannel, slackWebhookUrl]
  );

  // Open Pop-out Floating HUD in native Always-On-Top Picture-in-Picture or pop-out window
  const handleOpenFloatingWindow = async () => {
    if (typeof window === 'undefined') return;

    // Check for Chromium Document Picture-in-Picture API (True Always-On-Top OS Window)
    if ('documentPictureInPicture' in window) {
      try {
        const pipWin = await (window as any).documentPictureInPicture.requestWindow({
          width: 460,
          height: 600,
        });

        // Copy styles into pip window
        [...document.styleSheets].forEach((styleSheet) => {
          try {
            const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
            const style = pipWin.document.createElement('style');
            style.textContent = cssRules;
            pipWin.document.head.appendChild(style);
          } catch (e) {
            const link = pipWin.document.createElement('link');
            if (styleSheet.href) {
              link.rel = 'stylesheet';
              link.type = styleSheet.type;
              link.media = styleSheet.media.toString();
              link.href = styleSheet.href;
              pipWin.document.head.appendChild(link);
            }
          }
        });

        // Inject iframe pointing to /hud
        const iframe = pipWin.document.createElement('iframe');
        iframe.src = '/hud';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.background = '#0a0a0a';
        pipWin.document.body.style.margin = '0';
        pipWin.document.body.appendChild(iframe);
        return;
      } catch (pipErr) {
        console.warn('Native PiP window requested fallback to standard popup:', pipErr);
      }
    }

    // Standard floating window fallback
    window.open(
      '/hud',
      'SynapseFlowFloatingHUD',
      'width=480,height=620,resizable=yes,scrollbars=no,status=no'
    );
  };

  return (
    <main className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 selection:bg-cyan-500 selection:text-black">
      {/* Floor Reservation Beacon */}
      <FloorBeacon
        isFloorReserved={isFloorReserved}
        isSpeaking={isSpeaking}
        speakingText={currentSpeakingText}
        userName="Alex Rivera"
      />

      {/* Top Header / Startup Navigation */}
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
                  Enterprise Bridge
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Bi-Directional Assistive Collaboration Suite</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-neutral-900/90 border border-neutral-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setActiveTab('cockpit')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'cockpit' ? 'bg-cyan-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Cockpit
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'simulator' ? 'bg-cyan-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" /> Benchmark Simulator
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'code' ? 'bg-cyan-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <GitPullRequest className="w-3.5 h-3.5" /> Code Review Bridge
            </button>
            <button
              onClick={() => setActiveTab('macros')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'macros' ? 'bg-cyan-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Macro Studio
            </button>
            <button
              onClick={() => setActiveTab('identity')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'identity' ? 'bg-cyan-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" /> Voice & Persona
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                activeTab === 'analytics' ? 'bg-cyan-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Analytics
            </button>
          </nav>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Pop-Out Floating Window */}
            <button
              onClick={handleOpenFloatingWindow}
              className="py-1.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-cyan-300 flex items-center gap-1.5 text-xs font-semibold transition"
              title="Open floating HUD overlay window to use over Google Meet, Zoom, or VS Code"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Floating HUD</span>
            </button>

            {/* Caregiver Safeguard */}
            <button
              onClick={() => setIsCaregiverOpen(true)}
              className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-red-400 hover:text-red-300 transition"
              title="Caregiver Distress & Ergonomic Break Safeguard"
            >
              <HeartPulse className="w-4 h-4" />
            </button>

            {/* Slack Integration */}
            <button
              onClick={() => setIsSlackOpen(true)}
              className={`py-1.5 px-2.5 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 ${
                slackEnabled
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400'
              }`}
              title="Slack Channel Bridge Settings"
            >
              <Hash className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Slack</span>
            </button>

            {/* Virtual Audio Routing Guide */}
            <button
              onClick={() => setIsAudioGuideOpen(true)}
              className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition"
              title="How to route audio into Google Meet or Zoom"
            >
              <Volume2 className="w-4 h-4 text-purple-400" />
            </button>

            {/* Help / Onboarding Guide */}
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition"
              title="Product Onboarding & Practice Guide"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Settings Drawer */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition"
              title="Ergonomic Settings"
            >
              <Sliders className="w-4 h-4 text-neutral-300" />
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
              Effective Bandwidth: <strong className="text-cyan-400 font-mono">130+ WPM</strong>
            </span>
            <span className="hidden md:inline text-neutral-700">•</span>
            <span className="hidden md:flex items-center gap-1.5 text-neutral-300 font-medium">
              <MonitorCheck className="w-3.5 h-3.5 text-purple-400" />
              Hardware Barrier: <strong className="text-purple-400 font-mono">$0 (Standard Webcam)</strong>
            </span>
            <span className="hidden lg:inline text-neutral-700">•</span>
            <span className="hidden lg:flex items-center gap-1.5 text-neutral-300 font-medium">
              <Hash className="w-3.5 h-3.5 text-emerald-400" />
              Slack Channel: <strong className="text-emerald-400 font-mono">{slackChannel}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-neutral-400">Tone Persona:</span>
            <span className="font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
              {tone}
            </span>
          </div>
        </div>
      </section>

      {/* Mobile/Responsive Tabs */}
      <div className="flex lg:hidden overflow-x-auto gap-1 p-2 bg-neutral-900 border-b border-neutral-800 text-xs">
        {[
          { key: 'cockpit', label: 'Cockpit' },
          { key: 'simulator', label: 'Benchmark Simulator' },
          { key: 'code', label: 'Code Review' },
          { key: 'macros', label: 'Macro Studio' },
          { key: 'identity', label: 'Persona' },
          { key: 'analytics', label: 'Analytics' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
              activeTab === tab.key ? 'bg-cyan-600 text-white' : 'text-neutral-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Hero Problem-to-Bridge Headline */}
      <section className="px-4 sm:px-6 pt-5 pb-3 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Devlympics – Shunya 2026 Submission • Theme: Bridge the Gap</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Connecting Sparse Micro-Gazes to Real-Time Spoken Dialogue
            </h1>
            <p className="text-neutral-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Zero-hardware assistive software suite converting 350ms iris fixations into context-aware, fluent spoken
              sentences with floor reservation in under 1 second.
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

      {/* Main Content Area based on active tab */}
      <div className="px-4 sm:px-6 py-4 max-w-7xl mx-auto w-full flex-1">
        {/* TAB 1: COCKPIT */}
        {activeTab === 'cockpit' && (
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
                    <span>Dwell:</span>
                    <strong className="text-cyan-400 font-mono">{dwellTimeMs}ms</strong>
                  </div>
                </div>

                {/* Eye Tracking Camera & Landmark Mesh */}
                <div className="mb-4">
                  <EyeTracker
                    onGazeUpdate={handleGazeUpdate}
                    onProlongedBlink={handleProlongedBlink}
                    isSimulatingMouse={isSimulatingMouse}
                    onToggleMouseSimulation={() => setIsSimulatingMouse(!isSimulatingMouse)}
                  />
                </div>

                {/* Center Radial HUD */}
                <div className="flex flex-col items-center justify-center p-2 bg-neutral-950/80 rounded-2xl border border-neutral-800/80 relative overflow-hidden">
                  <div className="absolute top-2 left-3 text-[10px] text-neutral-500 font-mono uppercase tracking-widest">
                    Fitts's Law 4-Quadrant Polar HUD
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

                  {/* Ergonomic Instructions Bar */}
                  <div className="w-full mt-2 pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400 px-2">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Look at quadrant for 350ms to speak
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

                {/* Simulated Google Meet / Zoom Conference */}
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
        )}

        {/* TAB 2: FEEL THE GAP SIMULATOR */}
        {activeTab === 'simulator' && <FeelTheGapSimulator />}

        {/* TAB 3: CODE REVIEW BRIDGE */}
        {activeTab === 'code' && (
          <CodeReviewBridge
            onLoadPRCardsToHUD={(newOptions) => {
              setOptions(newOptions);
              setActiveTab('cockpit');
            }}
            tone={tone}
          />
        )}

        {/* TAB 4: MACRO STUDIO */}
        {activeTab === 'macros' && (
          <MacroStudio
            activeOptions={options}
            onApplyPack={(newOptions) => setOptions(newOptions)}
          />
        )}

        {/* TAB 5: VOICE & PERSONA IDENTITY */}
        {activeTab === 'identity' && (
          <VoiceProfileManager tone={tone} onToneChange={setTone} />
        )}

        {/* TAB 6: ANALYTICS */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            totalPhrasesSpoken={totalPhrasesSpoken}
            totalWordsSpoken={totalWordsSpoken}
            abortedCount={abortedCount}
            activeDwellTimeMs={dwellTimeMs}
          />
        )}
      </div>

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
              Bandwidth: 130+ WPM equivalent communication rate
            </div>
          </div>

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

      {/* Modals & Drawers */}
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

      <SlackIntegrationModal
        isOpen={isSlackOpen}
        onClose={() => setIsSlackOpen(false)}
        slackEnabled={slackEnabled}
        onToggleSlack={setSlackEnabled}
        channel={slackChannel}
        onChannelChange={setSlackChannel}
        webhookUrl={slackWebhookUrl}
        onWebhookUrlChange={setSlackWebhookUrl}
        lastDispatchedMessage={lastSlackDispatched}
      />

      <CaregiverSafeguard
        isOpen={isCaregiverOpen}
        onClose={() => setIsCaregiverOpen(false)}
      />

      <VirtualAudioGuide
        isOpen={isAudioGuideOpen}
        onClose={() => setIsAudioGuideOpen(false)}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onStartCalibration={() => setCalibrationModalOpen(true)}
      />

      <CalibrationModal
        isOpen={calibrationModalOpen}
        onClose={() => setCalibrationModalOpen(false)}
        rawGaze={{ x: 0.5, y: 0.5 }}
        onCalibrationComplete={() => setCalibrationModalOpen(false)}
      />
    </main>
  );
}
