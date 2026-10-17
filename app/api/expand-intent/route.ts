import { NextRequest, NextResponse } from 'next/server';
import { GeminiService, ExpandIntentParams } from '@/lib/ai/geminiService';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ExpandIntentParams;

    if (!body.intentToken) {
      return NextResponse.json({ error: 'Missing intentToken' }, { status: 400 });
    }

    const expandedSpeech = await GeminiService.expandIntent({
      intentToken: body.intentToken,
      category: body.category || 'action',
      tone: body.tone || 'professional',
      meetingContext: body.meetingContext || '',
      activeTopic: body.activeTopic || '',
    });

    return NextResponse.json({
      success: true,
      expandedSpeech,
      tone: body.tone || 'professional',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('API Error /api/expand-intent:', error);
    return NextResponse.json(
      { error: 'Failed to expand intent', details: (error as Error).message },
      { status: 500 }
    );
  }
}
