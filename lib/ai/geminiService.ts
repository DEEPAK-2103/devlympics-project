// Gemini AI Service for Context-Aware Intent Expansion & Dialogue Distillation
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ToneType, QuadrantOption } from '../types';

export interface ExpandIntentParams {
  intentToken: string;
  category: string;
  tone: ToneType;
  meetingContext?: string;
  activeTopic?: string;
}

export interface DistillMeetingParams {
  recentTranscript: string;
  speakerName?: string;
  tone?: ToneType;
}

export class GeminiService {
  private static getClient(): GoogleGenerativeAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return null;
    }
    return new GoogleGenerativeAI(apiKey);
  }

  /**
   * Expands sparse intent into a professional, tone-calibrated verbal statement in real time.
   */
  public static async expandIntent(params: ExpandIntentParams): Promise<string> {
    const client = this.getClient();
    const toneInstructions = {
      professional: 'polished, executive, clear, collaborative and respectful',
      direct: 'concise, fast, high-signal, minimum words without unnecessary pleasantries',
      casual: 'warm, friendly, relaxed team tone with natural conversational phrasing',
    }[params.tone];

    if (client) {
      try {
        const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `You are SynapseFlow, an ultra-fast speech proxy for a non-verbal engineer communicating in a live team meeting.
Convert this sparse intent into ONE natural spoken sentence.

[Parameters]:
- Intent: "${params.intentToken}"
- Category: "${params.category}"
- Tone: ${params.tone} (${toneInstructions})
- Recent Meeting Dialogue: "${params.meetingContext || 'Active software team sprint & engineering discussion'}"
- Active Topic: "${params.activeTopic || 'General Standup'}"

[Rules]:
1. Return ONLY the spoken sentence. Do NOT wrap in quotes. Do NOT add conversational preambles like "Here is what you could say".
2. Must sound completely human, confident, and natural when read aloud by Text-to-Speech.
3. Length: 1 to 2 sentences max (10 to 25 words).`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim().replace(/^["']|["']$/g, '');
        if (text) return text;
      } catch (err) {
        console.warn('Gemini API call error, using contextual fallback engine:', err);
      }
    }

    // Dynamic Context-Aware Fallback Engine (Runs instantaneously when API key is not yet set)
    return this.generateDynamicFallback(params);
  }

  /**
   * Distills rapid meeting dialogue into 4 quick-glance response cards for the Radial HUD.
   */
  public static async distillDialogueIntoCards(params: DistillMeetingParams): Promise<QuadrantOption[]> {
    const client = this.getClient();

    if (client && params.recentTranscript.trim().length > 5) {
      try {
        const model = client.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: { responseMimeType: 'application/json' },
        });

        const prompt = `You are SynapseFlow's Real-Time Gaze Distiller.
Analyze the recent team dialogue and generate exactly 4 distinct, highly relevant response options for a non-verbal participant to select with eye gaze.

Meeting snippet:
"${params.recentTranscript}"

Output JSON array with exactly 4 objects:
[
  {
    "quadrant": 0,
    "title": "Short title (2-3 words)",
    "shortLabel": "Punchy label",
    "category": "action",
    "intentToken": "Key intent summary",
    "previewText": "Full sentence the user would speak aloud"
  },
  {
    "quadrant": 1,
    "title": "Short title",
    "shortLabel": "Punchy label",
    "category": "status",
    "intentToken": "Key intent summary",
    "previewText": "Full sentence the user would speak aloud"
  },
  {
    "quadrant": 2,
    "title": "Short title",
    "shortLabel": "Punchy label",
    "category": "conversational",
    "intentToken": "Key intent summary",
    "previewText": "Full sentence the user would speak aloud"
  },
  {
    "quadrant": 3,
    "title": "Short title",
    "shortLabel": "Punchy label",
    "category": "contextual",
    "intentToken": "Key intent summary",
    "previewText": "Full sentence the user would speak aloud"
  }
]`;

        const result = await model.generateContent(prompt);
        const jsonText = result.response.text();
        const parsed = JSON.parse(jsonText);
        if (Array.isArray(parsed) && parsed.length === 4) {
          return parsed.map((item, idx) => ({
            id: `card-${idx}-${Date.now()}`,
            quadrant: (idx % 4) as 0 | 1 | 2 | 3,
            title: item.title || 'Response',
            shortLabel: item.shortLabel || item.title,
            category: item.category || 'action',
            intentToken: item.intentToken || item.previewText,
            previewText: item.previewText,
          }));
        }
      } catch (err) {
        console.warn('Gemini dialogue distillation error, using dynamic heuristic cards:', err);
      }
    }

    // Dynamic contextual cards based on transcript keywords
    return this.generateHeuristicCards(params.recentTranscript);
  }

  private static generateDynamicFallback(params: ExpandIntentParams): string {
    const { intentToken, tone, activeTopic } = params;
    const topic = activeTopic ? ` on ${activeTopic}` : '';

    if (tone === 'direct') {
      if (intentToken.toLowerCase().includes('approve')) return `Approved${topic}. Ready to ship.`;
      if (intentToken.toLowerCase().includes('change')) return `Changes required${topic}; check my PR comments.`;
      if (intentToken.toLowerCase().includes('blocked')) return `Currently blocked${topic}; need API credentials.`;
      if (intentToken.toLowerCase().includes('on track')) return `Status is green${topic}, on schedule.`;
      if (intentToken.toLowerCase().includes('agree')) return `Agreed. Let's proceed.`;
      if (intentToken.toLowerCase().includes('disagree')) return `Disagree with this approach; let's reconsider the latency.`;
      if (intentToken.toLowerCase().includes('moment')) return `Give me a quick moment, drafting thoughts.`;
      return `${intentToken}. Let's execute.`;
    }

    if (tone === 'casual') {
      if (intentToken.toLowerCase().includes('approve')) return `Looks super clean team, happy to approve${topic}!`;
      if (intentToken.toLowerCase().includes('change')) return `Caught a couple quick edge cases${topic}, left notes on the diff!`;
      if (intentToken.toLowerCase().includes('blocked')) return `A bit stuck on my end${topic}, could use a hand when someone has 5 mins.`;
      if (intentToken.toLowerCase().includes('on track')) return `All good on my side${topic}, wrapping it up today!`;
      if (intentToken.toLowerCase().includes('agree')) return `Totally with you on that, let's roll with it.`;
      if (intentToken.toLowerCase().includes('disagree')) return `Hmm, I'm slightly hesitant about that direction, want to chat alternative?`;
      if (intentToken.toLowerCase().includes('moment')) return `Just a sec everyone, pulling up the notes.`;
      return `Hey everyone, ${intentToken.toLowerCase()}${topic}!`;
    }

    // Professional (default)
    if (intentToken.toLowerCase().includes('approve')) {
      return `I've reviewed the implementation${topic} and verified the benchmarks; everything looks solid to merge.`;
    }
    if (intentToken.toLowerCase().includes('change')) {
      return `I've completed my review${topic} and flagged a few token expiration edge cases; let's address those prior to merge.`;
    }
    if (intentToken.toLowerCase().includes('blocked')) {
      return `My progress${topic} is temporarily blocked pending the updated API endpoints and authorization keys.`;
    }
    if (intentToken.toLowerCase().includes('on track')) {
      return `Our deliverables${topic} remain firmly on track to hit today's staging deployment milestone.`;
    }
    if (intentToken.toLowerCase().includes('agree')) {
      return `I fully concur with this strategy and suggest we proceed with rollout as outlined.`;
    }
    if (intentToken.toLowerCase().includes('disagree')) {
      return `I recommend caution with this proposal due to potential regression risks in the database layer.`;
    }
    if (intentToken.toLowerCase().includes('moment')) {
      return `Please give me a brief moment to synthesize my feedback on this topic.`;
    }

    return `Regarding ${intentToken}${topic}: I recommend we coordinate on this during our next iteration cycle.`;
  }

  private static generateHeuristicCards(transcript: string): QuadrantOption[] {
    const lower = transcript.toLowerCase();

    // Check if meeting asks for a review/code
    if (lower.includes('review') || lower.includes('pr') || lower.includes('pull request') || lower.includes('commit')) {
      return [
        {
          id: 'card-0',
          quadrant: 0,
          title: 'Approve PR',
          shortLabel: 'Approve',
          category: 'action',
          intentToken: 'Approve PR with verified tests',
          previewText: "I've reviewed the pull request changes and test suites; looks great and ready to merge.",
        },
        {
          id: 'card-1',
          quadrant: 1,
          title: 'Request Changes',
          shortLabel: 'Request Changes',
          category: 'action',
          intentToken: 'Request changes on error handling',
          previewText: 'I noticed an unhandled edge case in the error handler; let us fix that before merging.',
        },
        {
          id: 'card-2',
          quadrant: 2,
          title: 'Reviewing Now',
          shortLabel: 'In Progress',
          category: 'status',
          intentToken: 'Currently reviewing diff',
          previewText: 'I am halfway through the diff right now; expect my feedback within 15 minutes.',
        },
        {
          id: 'card-3',
          quadrant: 3,
          title: 'Need Walkthrough',
          shortLabel: 'Clarify Context',
          category: 'contextual',
          intentToken: 'Request 5 min code walkthrough',
          previewText: 'Could someone provide a quick walkthrough of the schema migration changes?',
        },
      ];
    }

    // Check if meeting asks for sprint/status/blockers
    if (lower.includes('status') || lower.includes('block') || lower.includes('standup') || lower.includes('update') || lower.includes('progress')) {
      return [
        {
          id: 'card-0',
          quadrant: 0,
          title: 'On Track',
          shortLabel: 'All Green',
          category: 'status',
          intentToken: 'Milestone on schedule',
          previewText: 'Everything on my side is progressing smoothly and on track for end of sprint.',
        },
        {
          id: 'card-1',
          quadrant: 1,
          title: 'Blocked on API',
          shortLabel: 'Blocked',
          category: 'status',
          intentToken: 'Blocked on external API payload',
          previewText: 'I am currently blocked waiting on the backend team to finalize the GraphQL schema.',
        },
        {
          id: 'card-2',
          quadrant: 2,
          title: 'Ready for Staging',
          shortLabel: 'Deploy Ready',
          category: 'action',
          intentToken: 'Ready to deploy to staging',
          previewText: 'The build has passed all automated tests and is ready to deploy to staging.',
        },
        {
          id: 'card-3',
          quadrant: 3,
          title: 'Take Offline',
          shortLabel: 'Discuss Offline',
          category: 'conversational',
          intentToken: 'Sync offline in Slack',
          previewText: "Let's take the architecture details offline into the team Slack channel to save standup time.",
        },
      ];
    }

    // Default high-utility meeting cards
    return [
      {
        id: 'card-0',
        quadrant: 0,
        title: 'Strongly Agree',
        shortLabel: 'Agree',
        category: 'conversational',
        intentToken: 'Agree with proposal',
        previewText: 'I completely agree with this direction, makes total sense.',
      },
      {
        id: 'card-1',
        quadrant: 1,
        title: 'Have Concerns',
        shortLabel: 'Alternative Idea',
        category: 'conversational',
        intentToken: 'Express architectural concern',
        previewText: 'I have some reservations regarding the scalability here; let us consider caching first.',
      },
      {
        id: 'card-2',
        quadrant: 2,
        title: 'Give me a Sec',
        shortLabel: 'One Moment',
        category: 'status',
        intentToken: 'Formulating response',
        previewText: 'Give me just one moment to pull up the relevant documentation.',
      },
      {
        id: 'card-3',
        quadrant: 3,
        title: 'Action Item Mine',
        shortLabel: 'I will take this',
        category: 'action',
        intentToken: 'Assign action item to myself',
        previewText: 'I will take ownership of this ticket and follow up before end of day.',
      },
    ];
  }
}
