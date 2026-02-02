/**
 * 검색 세션 API
 * 
 * 1. 기억 문장 입력
 * 2. Genre Classifier → 장르 분류
 * 3. Candidate Ranker → 후보 3개
 * 4. Question Selector → 질문 1~2개
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { GenreClassifier } from '@/lib/api/modules/genre-classifier';
import { CandidateRanker } from '@/lib/api/modules/candidate-ranker';
import { QuestionSelector } from '@/lib/api/modules/question-selector';

// [DIAGNOSTIC] 캐시 방지 설정
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userSentence, sessionId } = body;

    // [DIAGNOSTIC] 요청 method 및 입력 문장 로그
    console.log('[search-api] method: POST');
    console.log('[search-api] input:', { raw: userSentence, sessionId });

    if (!userSentence) {
      return NextResponse.json(
        { error: 'User sentence is required' },
        { status: 400 }
      );
    }

    // 기존 세션이 있으면 조회, 없으면 생성
    let session;
    if (sessionId) {
      session = await prisma.searchSession.findUnique({
        where: { id: sessionId },
        include: {
          candidates: {
            include: { movie: true },
            orderBy: { rank: 'asc' },
          },
          questions: {
            orderBy: { order: 'asc' },
          },
        },
      });
    }

    if (!session) {
      // 새 세션 생성
      session = await prisma.searchSession.create({
        data: {
          userMemorySentence: userSentence,
        },
        include: {
          candidates: {
            include: { movie: true },
            orderBy: { rank: 'asc' },
          },
          questions: {
            orderBy: { order: 'asc' },
          },
        },
      });

      const startTime = Date.now();

      // 1. Genre Classifier
      const genreResult = await GenreClassifier.classify({
        userSentence,
        sessionId: session.id,
      });

      // 2. Candidate Ranker
      const normalizedQuery = userSentence.trim().toLowerCase();
      console.log('[search-api] normalized query:', normalizedQuery);
      
      const candidateResult = await CandidateRanker.rank({
        sessionId: session.id,
        userSentence,
        genreHints: [genreResult.primaryGenre, ...genreResult.secondaryGenres],
      });
      
      console.log('[search-api] candidate result:', {
        count: candidateResult.candidates.length,
        top1: candidateResult.candidates[0]?.movieId,
        hasLowConfidence: candidateResult.hasLowConfidence
      });

      // 3. 후보 영화 저장 (DB에서 조회한 영화 사용)
      if (candidateResult.candidates.length > 0 && !candidateResult.hasLowConfidence) {
        for (const candidate of candidateResult.candidates) {
          // 영화가 DB에 존재하는지 확인 (candidate-ranker가 반환한 movieId는 DB에 있는 영화)
          const movie = await prisma.movie.findUnique({
            where: { id: candidate.movieId },
          });

          if (!movie) {
            console.warn('[search-api] movie not found:', candidate.movieId);
            continue; // 영화가 없으면 스킵
          }

          // Candidate 생성 (중복 방지)
          await prisma.candidate.upsert({
            where: {
              sessionId_rank: {
                sessionId: session.id,
                rank: candidate.rank,
              },
            },
            create: {
              sessionId: session.id,
              movieId: movie.id,
              rank: candidate.rank,
              confidenceScore: candidate.confidenceScore,
            },
            update: {
              movieId: movie.id,
              confidenceScore: candidate.confidenceScore,
            },
          });
        }
      }

      // 4. Question Selector
      const questionResult = await QuestionSelector.select({
        sessionId: session.id,
        userSentence,
        currentCandidates: candidateResult.candidates,
      });

      // 질문 저장
      for (const question of questionResult.questions) {
        await prisma.question.create({
          data: {
            sessionId: session.id,
            questionText: question.questionText,
            questionType: question.questionType,
            order: question.order,
          },
        });
      }

      // 성능 추적
      const processingTime = Date.now() - startTime;
      await prisma.searchSession.update({
        where: { id: session.id },
        data: {
          internalProcessingMs: processingTime,
          externalApiCalls: 0, // TMDb API 호출 없음 (예시)
        },
      });

      // 세션 다시 조회 (후보/질문 포함)
      session = await prisma.searchSession.findUnique({
        where: { id: session.id },
        include: {
          candidates: {
            include: { movie: true },
            orderBy: { rank: 'asc' },
          },
          questions: {
            orderBy: { order: 'asc' },
          },
        },
      });
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Failed to create or retrieve session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      candidates: session.candidates.map((c: any) => ({
        id: c.id,
        movie: {
          id: c.movie.id,
          title: c.movie.title,
          originalTitle: c.movie.originalTitle,
          releaseDate: c.movie.releaseDate,
          primaryGenre: c.movie.primaryGenre,
        },
        rank: c.rank,
        confidenceScore: c.confidenceScore,
      })),
      questions: session.questions.map((q: any) => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        order: q.order,
      })),
      hasLowConfidence: session.candidates.length === 0,
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

