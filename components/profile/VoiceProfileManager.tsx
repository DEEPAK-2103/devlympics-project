'use client';

import React, { useState, useEffect } from 'react';
import { ToneType } from '@/lib/types';
import { SpeechService } from '@/lib/audio/speechService';
import { User, Volume2, Sparkles, Sliders, CheckCircle2, Mic, Play } from 'lucide-react';

interface Props {
  tone: ToneType;
  onToneChange: (tone: ToneType) => void;
}

export default function VoiceProfileManager({ tone, onToneChange }: Props) {
  const [userName, setUserName] = useState('Alex Rivera');
  const [role, setRole] = useState('Staff Distributed Systems Architect');
  const [techStack, setTechStack] = useState('Distributed Systems, TypeScript, Go, Redis');
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const updateVoices = () => {
        const v = window.speechSynthesis.getVoices().filter((voice) => voice.lang.startsWith('en'));
        setAvailableVoices(v);
        if (v.length > 0 && !selectedVoice) {
          setSelectedVoice(v[0].name);
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [selectedVoice]);

  const handleTestVoice = () => {
    SpeechService.speakText(
      `Hello team, this is ${userName}, ${role}. SynapseFlow is active and tracking my gaze.`,
      tone
    );
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <div>
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
            Dignity & Self-Expression
          </span>
          <h3 className="text-lg font-extrabold text-white mt-1 flex items-center gap-2">
            <User className="w-5 h-5 text-purple-400" />
            <span>Professional Identity & Neural Voice Calibrator</span>
          </h3>
          <p className="text-xs text-neutral-400">
            Customize your unique conversational persona, technical domain vocabulary, and synthesized vocal timbre.
          </p>
        </div>

        <button
          onClick={handleTestVoice}
          className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 transition shrink-0"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Test Vocal Persona</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Professional Identity */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              Your Professional Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400 font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              Role & Seniority
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              Technical Focus & Jargon Dictionary
            </label>
            <input
              type="text"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400 font-mono text-[11px]"
            />
            <p className="text-[10px] text-neutral-500 mt-1">
              The Gemini engine ingests this technical domain to ensure generated responses use authentic engineering phrasing.
            </p>
          </div>
        </div>

        {/* Right: Vocal Tone & Prosody */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              Active Conversational Persona
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['professional', 'direct', 'casual'] as ToneType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => onToneChange(t)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition ${
                    tone === t
                      ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-md shadow-purple-500/10'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              Synthetic Speech Engine Voice
            </label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
            >
              {availableVoices.length === 0 ? (
                <option value="">Default System Natural Voice</option>
              ) : (
                availableVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                <span>Vocal Pitch</span>
                <span className="font-mono text-purple-400 font-bold">{speechPitch.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.2"
                step="0.05"
                value={speechPitch}
                onChange={(e) => setSpeechPitch(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                <span>Speech Speed</span>
                <span className="font-mono text-purple-400 font-bold">{speechRate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.05"
                value={speechRate}
                onChange={(e) => setSpeechRate(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          onClick={handleSave}
          className="py-2 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition flex items-center gap-1.5"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Profile Calibrated & Saved!</span>
            </>
          ) : (
            <span>Save Profile Preferences</span>
          )}
        </button>
      </div>
    </div>
  );
}
