import { NextRequest, NextResponse } from 'next/server';
import { GeminiService, DistillMeetingParams } from '@/lib/ai/geminiService';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DistillMeetingParams;

    const cards = await GeminiService.distillDialogueIntoCards({
      recentTranscript: body.recentTranscript || '',
      speakerName: body.speakerName,
      tone: body.tone || 'professional',
    });

    return NextResponse.json({
      success: true,
      options: cards,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('API Error /api/distill-meeting:', error);
    return NextResponse.json(
      { error: 'Failed to distill meeting dialogue', details: (error as Error).message },
      { status: 500 }
    );
  }
}
