'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MeetingTranscriptEntry, QuadrantOption, ToneType } from '@/lib/types';
import { SpeechService } from '@/lib/audio/speechService';
import {
  Mic,
  MicOff,
  Video,
  PhoneOff,
  Sparkles,
  Users,
  MessageSquare,
  Volume2,
  Send,
  PlayCircle,
  Radio,
  Zap,
} from 'lucide-react';

interface Props {
  onTranscriptUpdate: (newTranscript: string, speaker: string) => void;
  userSpeakingText?: string;
  isUserSpeaking: boolean;
  activeFloorUser?: string;
}

const INITIAL_PEERS = [
  {
    name: 'Sarah Chen',
    role: 'Staff Architect',
    avatar: 'bg-emerald-600',
    status: 'Speaking',
    isSpeaking: false,
  },
  {
    name: 'Marcus Vance',
    role: 'Senior Backend',
    avatar: 'bg-blue-600',
    status: 'Listening',
    isSpeaking: false,
  },
  {
    name: 'Priya Sharma',
    role: 'Product Lead',
    avatar: 'bg-purple-600',
    status: 'Listening',
    isSpeaking: false,
  },
];

export default function MeetingRoom({
  onTranscriptUpdate,
  userSpeakingText,
  isUserSpeaking,
  activeFloorUser,
}: Props) {
  const [messages, setMessages] = useState<MeetingTranscriptEntry[]>([
    {
      id: 'm-1',
      speaker: 'Sarah Chen',
      role: 'Staff Architect',
      avatarColor: 'bg-emerald-600',
      text: "Morning team! Let's kick off the sprint review. Alex, how are we looking on the auth middleware and rate limiting PR?",
      timestamp: '10:01 AM',
      isUser: false,
    },
  ]);

  const [isMicListening, setIsMicListening] = useState(false);
  const [micTranscript, setMicTranscript] = useState('');
  const [simulatedSpeakers, setSimulatedSpeakers] = useState(INITIAL_PEERS);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // If user speaks, append message to transcript
  useEffect(() => {
    if (userSpeakingText && isUserSpeaking) {
      const newEntry: MeetingTranscriptEntry = {
        id: `user-${Date.now()}`,
        speaker: 'Alex Rivera (You)',
        role: 'Assistive Voice Bridge',
        avatarColor: 'bg-cyan-600',
        text: userSpeakingText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isUser: true,
      };

      setMessages((prev) => {
        // Avoid duplicate identical consecutive user messages
        if (prev.length > 0 && prev[prev.length - 1].text === userSpeakingText) {
          return prev;
        }
        return [...prev, newEntry];
      });
    }
  }, [userSpeakingText, isUserSpeaking]);

  const audioCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Audio FFT Spectrum Loop
  const startAudioSpectrum = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const canvas = audioCanvasRef.current;
      if (!canvas) return;
      const canvasCtx = canvas.getContext('2d');
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!canvasCtx || !analyserRef.current) return;
        animFrameRef.current = requestAnimationFrame(draw);
        analyserRef.current.getByteFrequencyData(dataArray);

        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          canvasCtx.fillStyle = '#06b6d4';
          canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
      };

      draw();
    } catch (e) {
      console.warn('Audio spectrum capture notice:', e);
    }
  };

  const stopAudioSpectrum = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
  };

  // Real-Time Microphone Listener (Side B -> Side A)
  const toggleMicListening = () => {
    if (isMicListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopAudioSpectrum();
      setIsMicListening(false);
      return;
    }

    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Web Speech Recognition API is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsMicListening(true);
        startAudioSpectrum();
      };

      recognition.onresult = (event: any) => {
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          }
        }

        if (final.trim()) {
          setMicTranscript(final);
          const newEntry: MeetingTranscriptEntry = {
            id: `mic-${Date.now()}`,
            speaker: 'Live Teammate (Mic)',
            role: 'Meeting Participant',
            avatarColor: 'bg-indigo-600',
            text: final.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isUser: false,
          };
          setMessages((prev) => [...prev, newEntry]);
          onTranscriptUpdate(final.trim(), 'Teammate');
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsMicListening(false);
      };

      recognition.onend = () => {
        setIsMicListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setIsMicListening(false);
    }
  };

  // Quick prompt injection for testing without speaking aloud
  const injectPeerQuestion = (speaker: string, role: string, avatarColor: string, text: string) => {
    // Animate peer tile speaking
    setSimulatedSpeakers((prev) =>
      prev.map((p) => ({
        ...p,
        isSpeaking: p.name === speaker,
      }))
    );

    // Play subtle audio speech of the peer
    SpeechService.speakText(text, 'professional', () => {
      setSimulatedSpeakers((prev) =>
        prev.map((p) => ({
          ...p,
          isSpeaking: false,
        }))
      );
    });

    const newEntry: MeetingTranscriptEntry = {
      id: `peer-${Date.now()}`,
      speaker,
      role,
      avatarColor,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUser: false,
    };

    setMessages((prev) => [...prev, newEntry]);
    onTranscriptUpdate(text, speaker);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Meeting Header */}
      <div className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
          <div>
            <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
              Sprint Standup & Architecture Sync
              <span className="text-[10px] bg-neutral-800 text-neutral-400 font-mono px-2 py-0.5 rounded-full border border-neutral-700">
                MEET-ID: SYN-2026
              </span>
            </h3>
            <p className="text-[11px] text-neutral-400">4 Active Participants • Zero-Hardware Bridge Active</p>
          </div>
        </div>

        {/* Live Mic Listener Button & Real-Time FFT Audio Visualizer */}
        <div className="flex items-center gap-2">
          {isMicListening && (
            <canvas
              ref={audioCanvasRef}
              width={80}
              height={26}
              className="rounded-lg bg-neutral-950 border border-neutral-700/80 shadow-inner"
              title="Real-Time Web Audio FFT Spectrum"
            />
          )}

          <button
            onClick={toggleMicListening}
            className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
              isMicListening
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 animate-pulse'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
            }`}
            title="Listen to real ambient microphone audio and distill into HUD glance cards"
          >
            {isMicListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5 text-neutral-400" />}
            <span>{isMicListening ? 'Listening...' : 'Listen via Mic'}</span>
          </button>
        </div>
      </div>

      {/* Video Grid Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-3 bg-neutral-950/60 border-b border-neutral-800/80">
        {/* User Tile (Alex) */}
        <div
          className={`relative aspect-video rounded-xl overflow-hidden bg-neutral-900 border flex flex-col justify-between p-2.5 transition-all duration-300 ${
            isUserSpeaking
              ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)] ring-2 ring-cyan-400/40'
              : activeFloorUser
              ? 'border-amber-400 ring-2 ring-amber-400/30'
              : 'border-neutral-800'
          }`}
        >
          <div className="flex items-center justify-between z-10">
            <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
              SYNAPSE BRIDGE
            </span>
            {isUserSpeaking && (
              <span className="flex items-center gap-1 text-[10px] text-cyan-300 font-semibold bg-cyan-900/60 px-1.5 py-0.5 rounded">
                <Volume2 className="w-3 h-3 animate-bounce" /> Speaking
              </span>
            )}
          </div>

          <div className="flex flex-col items-center justify-center my-auto">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              AR
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-300 z-10">
            <span className="font-semibold text-white">Alex Rivera (You)</span>
            <span className="text-[10px] text-neutral-400">TTS Proxy</span>
          </div>
        </div>

        {/* Peer Video Tiles */}
        {simulatedSpeakers.map((peer, idx) => (
          <div
            key={idx}
            className={`relative aspect-video rounded-xl overflow-hidden bg-neutral-900 border flex flex-col justify-between p-2.5 transition-all duration-300 ${
              peer.isSpeaking
                ? 'border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400/40'
                : 'border-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between z-10">
              <span className="text-[10px] text-neutral-400 font-mono">1080p</span>
              {peer.isSpeaking && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-300 font-semibold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/40">
                  <Volume2 className="w-3 h-3 animate-bounce" /> Talking
                </span>
              )}
            </div>

            <div className="flex flex-col items-center justify-center my-auto">
              <div
                className={`w-10 h-10 rounded-full ${peer.avatar} flex items-center justify-center text-white font-bold text-sm shadow-md`}
              >
                {peer.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-300 z-10">
              <span className="font-semibold text-white truncate max-w-[90px]">{peer.name}</span>
              <span className="text-[10px] text-neutral-400 truncate">{peer.role}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Live Transcript & Quick Scenario Ingestion */}
      <div className="flex-1 flex flex-col min-h-[220px] max-h-[320px] p-3 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> Live Meeting Transcript Stream
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">Auto-Distills to HUD</span>
        </div>

        {/* Scrollable messages */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-2.5 rounded-xl border text-xs leading-relaxed animate-in fade-in duration-200 ${
                m.isUser
                  ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-100 ml-4'
                  : 'bg-neutral-900/70 border-neutral-800 text-neutral-200 mr-4'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${m.avatarColor}`}></span>
                  <span className="font-bold text-neutral-100">{m.speaker}</span>
                  <span className="text-[10px] text-neutral-400">({m.role})</span>
                </div>
                <span className="text-[10px] text-neutral-500 font-mono">{m.timestamp}</span>
              </div>
              <p className="pl-3.5 text-neutral-200 font-normal">{m.text}</p>
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>
      </div>

      {/* Quick Interactive Scenario Feed (Allows testing meeting questions without having to speak) */}
      <div className="p-2.5 bg-neutral-900 border-t border-neutral-800 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" /> Interactive Teammate Questions (Click to Ask Alex):
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() =>
              injectPeerQuestion(
                'Sarah Chen',
                'Staff Architect',
                'bg-emerald-600',
                'Alex, could you approve the auth middleware PR #412 so we can deploy to staging today?'
              )
            }
            className="py-1 px-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white transition text-[11px]"
          >
            "Approve Auth PR #412?"
          </button>
          <button
            onClick={() =>
              injectPeerQuestion(
                'Marcus Vance',
                'Senior Backend',
                'bg-blue-600',
                'Hey Alex, are you seeing any blockers on the Redis caching benchmark tests?'
              )
            }
            className="py-1 px-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white transition text-[11px]"
          >
            "Any Redis Blockers?"
          </button>
          <button
            onClick={() =>
              injectPeerQuestion(
                'Priya Sharma',
                'Product Lead',
                'bg-purple-600',
                'Alex, do you think we can commit to finishing the checkout flow redesign this sprint?'
              )
            }
            className="py-1 px-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white transition text-[11px]"
          >
            "Commit to Checkout Flow?"
          </button>
        </div>
      </div>
    </div>
  );
}
