/**
 * 파이프라인 API
 * 
 * 전체 파이프라인 실행:
 * 1. User Input 수신
 * 2. Intent Classification
 * 3. Genre 결정
 * 4. Genre → Tag 세분화
 * 5. Solver Selection
 * 6. Result Generation
 * 7. Confidence Scoring
 * 8. Decision / Failure Log 저장
 */

import { NextRequest, NextResponse } from 'next/server';
import { PipelineExecutor } from '@/lib/pipeline/pipeline-executor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userInput } = body;

    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json(
        { error: 'userInput is required and must be a string' },
        { status: 400 }
      );
    }

    // 전체 파이프라인 실행
    const result = await PipelineExecutor.execute(userInput);

    return NextResponse.json({
      success: true,
      pipeline: {
        intent: result.intent,
        genre: result.genre,
        tags: result.tags.map(t => ({
          code: t.code,
          name: t.name,
          confidence: t.confidence,
        })),
        solver: result.selectedSolver,
        confidence: result.confidence,
        resultType: result.resultType,
      },
      result: result.result,
      metadata: {
        processingTimeMs: result.processingTimeMs,
        costLevel: result.costLevel,
        logId: result.logId,
      },
    });
  } catch (error: any) {
    console.error('Pipeline execution error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Pipeline execution failed',
        success: false,
      },
      { status: 500 }
    );
  }
}

