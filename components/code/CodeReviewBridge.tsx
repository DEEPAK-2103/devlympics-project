'use client';

import React, { useState } from 'react';
import { QuadrantOption, ToneType } from '@/lib/types';
import { SpeechService } from '@/lib/audio/speechService';
import {
  GitPullRequest,
  Code2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Send,
  Eye,
  FileCode,
  Layers,
  Edit3,
} from 'lucide-react';

interface Props {
  onLoadPRCardsToHUD: (options: QuadrantOption[]) => void;
  tone: ToneType;
  userName?: string;
  userRole?: string;
  onReviewAction?: (comment: string, prTitle: string) => void;
}

interface PRPreset {
  id: string;
  title: string;
  file: string;
  line: number;
  diff: string;
  defaultComments: { line: number; comment: string; timestamp: string }[];
  quickActions: {
    label: string;
    icon: string;
    color: string;
    speech: string;
  }[];
}

const PR_PRESETS: PRPreset[] = [
  {
    id: 'pr-842',
    title: 'PR #842: Add Redis Distributed Lock Lease Timeout',
    file: 'src/auth/sessionLock.ts',
    line: 42,
    diff: `diff --git a/src/auth/sessionLock.ts b/src/auth/sessionLock.ts
index 4b8e21a..912f87c 100644
--- a/src/auth/sessionLock.ts
+++ b/src/auth/sessionLock.ts
@@ -38,7 +38,11 @@ export class SessionLockManager {
   public async acquireDistributedLock(userId: string): Promise<boolean> {
     const lockKey = \`lock:session:\${userId}\`;
-    return await this.redis.set(lockKey, "1", "NX");
+    // Added distributed lease timeout to eliminate deadlock
+    const acquired = await this.redis.set(lockKey, "1", "PX", 5000, "NX");
+    if (acquired) {
+      this.activeLeases.set(userId, Date.now());
+    }
+    return Boolean(acquired);
   }
 }`,
    defaultComments: [
      {
        line: 42,
        comment: "I've reviewed the 5000ms lease duration; verified it handles burst retry loops safely.",
        timestamp: '10:14 AM',
      },
    ],
    quickActions: [
      {
        label: '✅ Approve Diff',
        icon: '✅',
        color: 'border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-300',
        speech:
          "I've verified the Redis PX 5000ms lease duration; tests confirm zero deadlock. Approved!",
      },
      {
        label: '⚠️ Flag Cluster Failover',
        icon: '⚠️',
        color: 'border-amber-500/40 bg-amber-950/40 hover:bg-amber-950/70 text-amber-300',
        speech:
          'What occurs if the Redis cluster undergoes a failover while activeLeases map is set in memory?',
      },
      {
        label: '🔍 Request Benchmark',
        icon: '🔍',
        color: 'border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-950/70 text-cyan-300',
        speech:
          'Could we run a quick concurrency benchmark with 500 parallel workers to verify mutex release latency?',
      },
      {
        label: '🔄 Architecture Sync',
        icon: '🔄',
        color: 'border-purple-500/40 bg-purple-950/40 hover:bg-purple-950/70 text-purple-300',
        speech:
          'I recommend a quick 5-minute architecture huddle on handling split-brain edge cases.',
      },
    ],
  },
  {
    id: 'pr-915',
    title: 'PR #915: JWT Refresh Token Single-Use Rotation & Replay Defense',
    file: 'src/security/jwtRotation.ts',
    line: 56,
    diff: `diff --git a/src/security/jwtRotation.ts b/src/security/jwtRotation.ts
index e83b129..a442cf1 100644
--- a/src/security/jwtRotation.ts
+++ b/src/security/jwtRotation.ts
@@ -52,6 +52,12 @@ export async function rotateRefreshToken(tokenFamilyId: string, oldToken: string
     const family = await db.tokenFamilies.findUnique({ where: { id: tokenFamilyId } });
+    // Detect token reuse: revoke entire family immediately
+    if (family.usedTokens.includes(oldToken)) {
+      await db.tokenFamilies.update({ where: { id: tokenFamilyId }, data: { revoked: true } });
+      throw new SecurityException("Token reuse detected. Session invalidated.");
+    }
+    const newToken = generateSecureCryptographicToken();`,
    defaultComments: [
      {
        line: 56,
        comment: 'Revoking the entire family upon reuse aligns with OAuth 2.0 Security Best Current Practice.',
        timestamp: '10:22 AM',
      },
    ],
    quickActions: [
      {
        label: '🛡️ Approve Replay Defense',
        icon: '🛡️',
        color: 'border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-300',
        speech:
          'The token family revocation logic is rock-solid and prevents token replay attacks. Approved!',
      },
      {
        label: '⏱️ Grace Period Query',
        icon: '⏱️',
        color: 'border-amber-500/40 bg-amber-950/40 hover:bg-amber-950/70 text-amber-300',
        speech:
          'Should we allow a 1.5-second grace window for slow mobile clients that issue parallel network retries?',
      },
      {
        label: '📊 Add Security Telemetry',
        icon: '📊',
        color: 'border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-950/70 text-cyan-300',
        speech:
          'Let us ensure revoked token attempts emit a P1 security event to Datadog with user IP address.',
      },
      {
        label: '✅ Ready for Staging',
        icon: '✅',
        color: 'border-purple-500/40 bg-purple-950/40 hover:bg-purple-950/70 text-purple-300',
        speech:
          'Implementation looks ready to roll to staging for end-to-end client verification.',
      },
    ],
  },
  {
    id: 'pr-1048',
    title: 'PR #1048: Fix PostgreSQL Connection Pool Starvation',
    file: 'src/db/connectionPool.ts',
    line: 88,
    diff: `diff --git a/src/db/connectionPool.ts b/src/db/connectionPool.ts
index c12a77b..ff98012 100644
--- a/src/db/connectionPool.ts
+++ b/src/db/connectionPool.ts
@@ -84,6 +84,10 @@ export const pool = new Pool({
   max: 50,
-  idleTimeoutMillis: 30000,
+  idleTimeoutMillis: 10000,
+  connectionTimeoutMillis: 2000,
+  // Added dynamic reap interval for leaked connections
+  reapIntervalMillis: 1000,
 });`,
    defaultComments: [
      {
        line: 88,
        comment: 'Reduced connection timeout prevents thread starvation when backend DB spikes.',
        timestamp: '10:31 AM',
      },
    ],
    quickActions: [
      {
        label: '⚡ Endorse Pool Tuning',
        icon: '⚡',
        color: 'border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-300',
        speech:
          'The 2-second timeout and 1-second reap interval will prevent pool starvation under traffic spikes. LGTM!',
      },
      {
        label: '⚠️ Check Max Clients',
        icon: '⚠️',
        color: 'border-amber-500/40 bg-amber-950/40 hover:bg-amber-950/70 text-amber-300',
        speech:
          'Does our RDS instance max_connections headroom accommodate 50 connections across all 8 pods?',
      },
      {
        label: '📈 Grafana Metric Check',
        icon: '📈',
        color: 'border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-950/70 text-cyan-300',
        speech:
          'Let us monitor the active connection gauge in Grafana during the canary rollout.',
      },
      {
        label: '🚀 Merge after Canary',
        icon: '🚀',
        color: 'border-purple-500/40 bg-purple-950/40 hover:bg-purple-950/70 text-purple-300',
        speech:
          'I recommend deploying to canary pod first for 15 minutes before global merge.',
      },
    ],
  },
];

export default function CodeReviewBridge({
  onLoadPRCardsToHUD,
  tone,
  userName = 'Alex Rivera',
  userRole = 'Staff Distributed Systems Architect',
  onReviewAction,
}: Props) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('pr-842');
  const [customMode, setCustomMode] = useState(false);
  const [prTitle, setPrTitle] = useState(PR_PRESETS[0].title);
  const [prDiff, setPrDiff] = useState(PR_PRESETS[0].diff);
  const [isIngesting, setIsIngesting] = useState(false);
  const [postedComments, setPostedComments] = useState(PR_PRESETS[0].defaultComments);

  const activePreset = PR_PRESETS.find((p) => p.id === selectedPresetId) || PR_PRESETS[0];

  const handleSelectPreset = (preset: PRPreset) => {
    setSelectedPresetId(preset.id);
    setCustomMode(false);
    setPrTitle(preset.title);
    setPrDiff(preset.diff);
    setPostedComments(preset.defaultComments);
  };

  const handleIngestDiff = async () => {
    setIsIngesting(true);
    try {
      const res = await fetch('/api/ingest-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: 'GitHub Pull Request Diff',
          content: `${prTitle}\n\n${prDiff}`,
          tone,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.options)) {
        onLoadPRCardsToHUD(data.options);
      }
    } catch (err) {
      console.warn('Code diff ingestion failed:', err);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleQuickPostComment = (text: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setPostedComments((prev) => [
      ...prev,
      {
        line: activePreset.line,
        comment: text,
        timestamp,
      },
    ]);
    SpeechService.speakText(text, tone);
    onReviewAction?.(text, prTitle);
  };

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <div>
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
            Bi-Directional Code Review Bridge
          </span>
          <h3 className="text-lg font-extrabold text-white mt-1 flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-cyan-400" />
            <span>Gaze-Driven GitHub PR Review & Pair Programming</span>
          </h3>
          <p className="text-xs text-neutral-400">
            Enabling motor-impaired senior engineers to lead technical code reviews, synthesize spoken reviews, and post line-by-line feedback using eye gaze.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleIngestDiff}
            disabled={isIngesting}
            className="py-2 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isIngesting ? 'Ingesting Code Diff...' : 'Load Diff to Gaze HUD'}</span>
          </button>
        </div>
      </div>

      {/* Preset PR Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> Select Pull Request Scenario:
          </span>
          <button
            onClick={() => setCustomMode(!customMode)}
            className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
          >
            <Edit3 className="w-3 h-3" /> {customMode ? 'Back to Presets' : 'Paste Custom PR Diff'}
          </button>
        </div>

        {!customMode ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {PR_PRESETS.map((p) => {
              const isSelected = selectedPresetId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`p-3 rounded-xl border cursor-pointer transition text-left ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-md shadow-cyan-500/10'
                      : 'bg-neutral-950/70 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <p className="font-bold text-xs truncate">{p.title}</p>
                  <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{p.file}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800 animate-in fade-in duration-100">
            <input
              type="text"
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold"
              placeholder="PR Title (e.g. PR #123: Add Kafka Event Consumer)"
            />
            <textarea
              rows={5}
              value={prDiff}
              onChange={(e) => setPrDiff(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 font-mono text-[11px] text-neutral-300 focus:outline-none focus:border-cyan-400 resize-none"
              placeholder="Paste Git unified diff here..."
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Code Diff Viewer */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-300">
            <span className="font-bold flex items-center gap-1.5 text-white">
              <FileCode className="w-4 h-4 text-cyan-400" /> {prTitle}
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">{activePreset.file}</span>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 font-mono text-xs overflow-x-auto text-neutral-300 space-y-0.5 leading-relaxed max-h-[300px]">
            {prDiff.split('\n').map((line, idx) => {
              const isAdded = line.startsWith('+');
              const isDeleted = line.startsWith('-');
              const isHunk = line.startsWith('@@');
              return (
                <div
                  key={idx}
                  className={`px-1 rounded ${
                    isAdded
                      ? 'bg-emerald-950/40 text-emerald-300'
                      : isDeleted
                      ? 'bg-red-950/40 text-red-300'
                      : isHunk
                      ? 'text-neutral-500'
                      : 'text-neutral-300'
                  }`}
                >
                  {line}
                </div>
              );
            })}
          </div>

          {/* Quick Gaze-Triggered Review Actions */}
          <div className="pt-2 space-y-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              1-Click Gaze Diff Responses (Click or Gaze to Post & Speak):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activePreset.quickActions.map((qa, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickPostComment(qa.speech)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition ${qa.color}`}
                >
                  <span className="font-bold block mb-0.5">{qa.label}</span>
                  <span className="text-[11px] text-neutral-300 line-clamp-2 leading-relaxed">
                    "{qa.speech}"
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live GitHub PR Comments Feed */}
        <div className="lg:col-span-5 bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between min-h-[340px]">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-3">
              <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> Line {activePreset.line} Review Thread
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">Live Sync</span>
            </div>

            <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
              {postedComments.map((c, i) => (
                <div
                  key={i}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs space-y-1 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                      {userName} ({userRole.split(' ')[0]} Reviewer)
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">{c.timestamp}</span>
                  </div>
                  <p className="text-neutral-300 text-[11px] leading-relaxed pl-3.5">
                    "{c.comment}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800/80 text-[10px] text-neutral-500">
            Speaking and commenting synchronized with Google Meet audio channel, Slack webhook, and GitHub Pull Request thread.
          </div>
        </div>
      </div>
    </div>
  );
}
