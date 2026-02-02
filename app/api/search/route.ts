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
import { SessionEndStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userSentence, sessionId } = body;

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
      const candidateResult = await CandidateRanker.rank({
        sessionId: session.id,
        userSentence,
        genreHints: [genreResult.primaryGenre, ...genreResult.secondaryGenres],
      });

      // 3. 후보 영화 저장 (예시 데이터 - 실제로는 DB에서 조회)
      if (candidateResult.candidates.length > 0 && !candidateResult.hasLowConfidence) {
        // 예시 영화 데이터 (실제로는 TMDb API 또는 DB에서 조회)
        const exampleMovies = [
          { id: 'movie-1', title: 'The Matrix', originalTitle: 'The Matrix', year: 1999, genre: 'SCIENCE_FICTION' },
          { id: 'movie-2', title: 'Inception', originalTitle: 'Inception', year: 2010, genre: 'SCIENCE_FICTION' },
          { id: 'movie-3', title: 'Interstellar', originalTitle: 'Interstellar', year: 2014, genre: 'SCIENCE_FICTION' },
          { id: 'movie-4', title: 'The Shawshank Redemption', originalTitle: 'The Shawshank Redemption', year: 1994, genre: 'DRAMA' },
          { id: 'movie-5', title: 'Pulp Fiction', originalTitle: 'Pulp Fiction', year: 1994, genre: 'CRIME' },
        ];

        for (const candidate of candidateResult.candidates) {
          // 예시 영화 찾기
          const exampleMovie = exampleMovies.find(m => m.id === candidate.movieId);
          
          if (exampleMovie) {
            // 영화가 없으면 생성
            let movie = await prisma.movie.findFirst({
              where: { id: candidate.movieId },
            });

            if (!movie) {
              movie = await prisma.movie.create({
                data: {
                  id: exampleMovie.id,
                  title: exampleMovie.title,
                  originalTitle: exampleMovie.originalTitle,
                  releaseDate: new Date(exampleMovie.year, 0, 1),
                  primaryGenre: exampleMovie.genre,
                  secondaryGenres: genreResult.secondaryGenres,
                  subgenres: genreResult.subgenres,
                },
              });
            }

            await prisma.candidate.create({
              data: {
                sessionId: session.id,
                movieId: movie.id,
                rank: candidate.rank,
                confidenceScore: candidate.confidenceScore,
              },
            });
          }
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

    return NextResponse.json({
      sessionId: session.id,
      candidates: session.candidates.map(c => ({
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
      questions: session.questions.map(q => ({
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

