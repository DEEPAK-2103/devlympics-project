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
} from 'lucide-react';

interface Props {
  onLoadPRCardsToHUD: (options: QuadrantOption[]) => void;
  tone: ToneType;
}

const SAMPLE_PR_DIFF = `diff --git a/src/auth/sessionLock.ts b/src/auth/sessionLock.ts
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
 }`;

export default function CodeReviewBridge({ onLoadPRCardsToHUD, tone }: Props) {
  const [prTitle, setPrTitle] = useState('PR #842: Add Redis Distributed Lock Lease Timeout');
  const [prDiff, setPrDiff] = useState(SAMPLE_PR_DIFF);
  const [isIngesting, setIsIngesting] = useState(false);
  const [postedComments, setPostedComments] = useState<
    { line: number; comment: string; timestamp: string }[]
  >([
    {
      line: 42,
      comment: "I've reviewed the 5000ms lease duration; verified it handles burst retry loops safely.",
      timestamp: '10:14 AM',
    },
  ]);

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
    setPostedComments((prev) => [
      ...prev,
      {
        line: 42,
        comment: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    SpeechService.speakText(text, tone);
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
            Enabling motor-impaired senior engineers to lead technical code reviews and post line-by-line feedback using eye gaze.
          </p>
        </div>

        <button
          onClick={handleIngestDiff}
          disabled={isIngesting}
          className="py-2 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isIngesting ? 'Ingesting Code Diff...' : 'Load Diff to Gaze HUD'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Code Diff Viewer */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-300">
            <span className="font-bold flex items-center gap-1.5 text-white">
              <FileCode className="w-4 h-4 text-cyan-400" /> {prTitle}
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">auth/sessionLock.ts</span>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 font-mono text-xs overflow-x-auto text-neutral-300 space-y-0.5 leading-relaxed">
            <div className="text-neutral-500 select-none">// @@ -38,7 +38,11 @@ acquireDistributedLock</div>
            <div className="text-neutral-400">&nbsp;&nbsp;const lockKey = `lock:session:$&#123;userId&#125;`;</div>
            <div className="bg-red-950/40 text-red-300 px-1 rounded">- return await this.redis.set(lockKey, "1", "NX");</div>
            <div className="bg-emerald-950/40 text-emerald-300 px-1 rounded">+ // Added distributed lease timeout to eliminate deadlock</div>
            <div className="bg-emerald-950/40 text-emerald-300 px-1 rounded">+ const acquired = await this.redis.set(lockKey, "1", "PX", 5000, "NX");</div>
            <div className="bg-emerald-950/40 text-emerald-300 px-1 rounded">+ if (acquired) &#123; this.activeLeases.set(userId, Date.now()); &#125;</div>
            <div className="text-neutral-400">&nbsp;&nbsp;return Boolean(acquired);</div>
          </div>

          {/* Quick Gaze-Triggered Review Actions */}
          <div className="pt-2 space-y-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              1-Click Gaze Diff Responses (Click or Gaze to Post & Speak):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() =>
                  handleQuickPostComment(
                    "I've verified the Redis PX 5000ms lease duration; tests confirm zero deadlock. Approved!"
                  )
                }
                className="p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-950/70 text-left text-xs transition"
              >
                <span className="font-bold text-emerald-300 block mb-0.5">✅ Approve Diff</span>
                <span className="text-[11px] text-neutral-300">
                  "Verified Redis PX 5000ms lease duration; tests confirm zero deadlock."
                </span>
              </button>

              <button
                onClick={() =>
                  handleQuickPostComment(
                    'What occurs if the Redis cluster undergoes a failover while activeLeases map is set in memory?'
                  )
                }
                className="p-2.5 rounded-xl border border-amber-500/40 bg-amber-950/40 hover:bg-amber-950/70 text-left text-xs transition"
              >
                <span className="font-bold text-amber-300 block mb-0.5">⚠️ Flag Cluster Failover</span>
                <span className="text-[11px] text-neutral-300">
                  "What occurs if the Redis cluster fails over while in-memory lease is set?"
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Live GitHub PR Comments Feed */}
        <div className="lg:col-span-5 bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-3">
              <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> Line 42 Review Thread
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">Live Sync</span>
            </div>

            <div className="space-y-2.5">
              {postedComments.map((c, i) => (
                <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                      Alex Rivera (Staff Reviewer)
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
            Speaking and commenting synchronized with Google Meet audio channel and GitHub Webhook.
          </div>
        </div>
      </div>
    </div>
  );
}
