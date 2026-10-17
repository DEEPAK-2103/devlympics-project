import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, channel, userName, webhookUrl, tone } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    const payload = {
      username: `SynapseFlow (${userName || 'Alex Rivera'})`,
      icon_emoji: ':speech_balloon:',
      text: message,
      attachments: [
        {
          color: '#06b6d4',
          footer: 'SynapseFlow Assistive Collaboration Bridge • GDG NSUT 2026',
          ts: Math.floor(Date.now() / 1000),
          fields: [
            {
              title: 'Delivery Channel',
              value: channel || '#engineering-standup',
              short: true,
            },
            {
              title: 'Voice Persona',
              value: (tone || 'professional').toUpperCase(),
              short: true,
            },
          ],
        },
      ],
    };

    // If custom incoming webhook is provided, dispatch HTTP POST to Slack
    if (webhookUrl && webhookUrl.startsWith('https://hooks.slack.com')) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (slackErr) {
        console.warn('Direct Slack dispatch warning:', slackErr);
      }
    }

    return NextResponse.json({
      success: true,
      deliveredAt: new Date().toISOString(),
      payload,
    });
  } catch (error) {
    console.error('API Error /api/slack-broadcast:', error);
    return NextResponse.json(
      { error: 'Failed to broadcast message to Slack', details: (error as Error).message },
      { status: 500 }
    );
  }
}
