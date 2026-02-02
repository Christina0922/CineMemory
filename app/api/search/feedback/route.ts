/**
 * 피드백 API
 * 
 * 확정/실패/제보 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { FeedbackHandler } from '@/lib/api/modules/feedback-handler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, feedbackType, content, confirmedMovieId } = body;

    if (!sessionId || !feedbackType) {
      return NextResponse.json(
        { error: 'Session ID and feedback type are required' },
        { status: 400 }
      );
    }

    const result = await FeedbackHandler.handle({
      sessionId,
      feedbackType,
      content,
      confirmedMovieId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

