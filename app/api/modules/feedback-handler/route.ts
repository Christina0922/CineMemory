/**
 * API Route: Feedback Handler Module
 */

import { NextRequest, NextResponse } from 'next/server';
import { FeedbackHandler } from '@/lib/api/modules/feedback-handler';
import { APIAuditGate } from '@/lib/gates/api-audit-gate';
import { APIModule } from '@/lib/types/prisma-enums';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiKey = request.headers.get('x-api-key') || undefined;

    // Rate limit check
    if (apiKey) {
      const rateLimit = await APIAuditGate.checkRateLimit(apiKey, APIModule.FEEDBACK_HANDLER);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        );
      }
    }

    const result = await FeedbackHandler.handle(body, apiKey);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

