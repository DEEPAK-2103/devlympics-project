'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, MessageSquare, AlertCircle, Hash, ExternalLink } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  slackEnabled: boolean;
  onToggleSlack: (enabled: boolean) => void;
  channel: string;
  onChannelChange: (channel: string) => void;
  webhookUrl: string;
  onWebhookUrlChange: (url: string) => void;
  lastDispatchedMessage?: string;
}

export default function SlackIntegrationModal({
  isOpen,
  onClose,
  slackEnabled,
  onToggleSlack,
  channel,
  onChannelChange,
  webhookUrl,
  onWebhookUrlChange,
  lastDispatchedMessage,
}: Props) {
  const [testSent, setTestSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSendTest = async () => {
    setIsSending(true);
    setTestSent(false);

    try {
      await fetch('/api/slack-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Alex Rivera (via SynapseFlow): I have verified PR #412 and tests are passing; ready for staging deployment.',
          channel,
          webhookUrl,
          tone: 'professional',
        }),
      });
      setTestSent(true);
    } catch (e) {
      console.warn('Slack test send failed', e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 text-white">
      <div className="bg-neutral-900 border border-neutral-700 max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              #
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-100">Slack & Team Channel Bridge</h3>
              <p className="text-[11px] text-neutral-400">Synchronize eye-spoken updates directly into team chat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {/* Enable Slack Broadcast Toggle */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-200">Auto-Broadcast to Slack</p>
            <p className="text-[11px] text-neutral-400">Post spoken phrases into Slack channel simultaneously</p>
          </div>
          <button
            onClick={() => onToggleSlack(!slackEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              slackEnabled ? 'bg-emerald-500' : 'bg-neutral-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                slackEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Channel & Webhook Configuration */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 mb-1">
              <Hash className="w-3.5 h-3.5 text-cyan-400" /> Target Channel Name
            </label>
            <input
              type="text"
              value={channel}
              onChange={(e) => onChannelChange(e.target.value)}
              placeholder="#engineering-standup"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 font-mono focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 mb-1">
              <span>Slack Incoming Webhook URL (Optional)</span>
            </label>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => onWebhookUrlChange(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 font-mono focus:outline-none focus:border-cyan-400"
            />
            <p className="text-[10px] text-neutral-500 mt-1">
              When left empty, updates are captured and simulated locally in real-time.
            </p>
          </div>
        </div>

        {/* Live Slack Message Preview Card */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 space-y-2">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
            Slack Feed Preview:
          </span>
          <div className="flex gap-2.5 items-start text-xs">
            <div className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center text-white font-bold text-[10px]">
              SF
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-100">SynapseFlow (Alex Rivera)</span>
                <span className="text-[10px] bg-neutral-800 text-cyan-300 px-1.5 rounded font-mono">APP</span>
                <span className="text-[10px] text-neutral-500">Just now</span>
              </div>
              <p className="text-neutral-300 text-xs mt-0.5 leading-relaxed">
                {lastDispatchedMessage ||
                  "I've completed my review on the auth middleware and flagged token expiration cases."}
              </p>
            </div>
          </div>
        </div>

        {/* Test Send Button */}
        <div className="flex gap-2">
          <button
            onClick={handleSendTest}
            disabled={isSending}
            className="flex-1 py-2 px-3 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSending ? 'Sending...' : 'Send Test Notification'}</span>
          </button>
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
          >
            Done
          </button>
        </div>

        {testSent && (
          <p className="text-xs text-emerald-400 flex items-center gap-1.5 justify-center">
            <CheckCircle2 className="w-4 h-4" /> Test dispatch succeeded to {channel}!
          </p>
        )}
      </div>
    </div>
  );
}
