/**
 * API Route: Genre Classifier Module
 */

import { NextRequest, NextResponse } from 'next/server';
import { GenreClassifier } from '@/lib/api/modules/genre-classifier';
import { APIAuditGate } from '@/lib/gates/api-audit-gate';
import { APIModule } from '@/lib/types/prisma-enums';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiKey = request.headers.get('x-api-key') || undefined;

    // Rate limit check
    if (apiKey) {
      const rateLimit = await APIAuditGate.checkRateLimit(apiKey, APIModule.GENRE_CLASSIFIER);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        );
      }
    }

    const result = await GenreClassifier.classify(body, apiKey);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

