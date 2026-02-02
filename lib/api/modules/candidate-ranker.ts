/**
 * API Module 2: Candidate Ranker
 * 
 * 후보 랭킹 모듈
 * - 후보는 기본 3개
 * - Confidence Cutoff 미만이면 '억지 후보' 금지 -> 보상 경로
 */

import { prisma } from '../../db/prisma';
import { APIAuditGate } from '../../gates/api-audit-gate';
import { APIModule } from '../../types/prisma-enums';

export interface CandidateRankingInput {
  sessionId: string;
  userSentence: string;
  genreHints?: string[];
  moodHints?: string[];
  objectHints?: string[];
}

export interface CandidateRankingResult {
  candidates: Array<{
    movieId: string;
    rank: number;
    confidenceScore: number;
  }>;
  hasLowConfidence: boolean; // Confidence Cutoff 미만 여부
}

export class CandidateRanker {
  private static readonly CONFIDENCE_CUTOFF = 0.5; // K1 목표: >= 50%
  private static readonly MAX_CANDIDATES = 3;

  /**
   * 후보 랭킹 (규칙+데이터 기반)
   */
  static async rank(
    input: CandidateRankingInput,
    apiKey?: string
  ): Promise<CandidateRankingResult> {
    const startTime = Date.now();

    try {
      // TODO: 실제 랭킹 로직 구현
      // 현재는 MVP 구조만 제공
      
      const candidates = await this.rankCandidates(input);

      const processingTime = Date.now() - startTime;

      await APIAuditGate.log({
        module: APIModule.CANDIDATE_RANKER,
        apiKey,
        endpoint: '/api/modules/candidate-ranker',
        method: 'POST',
        statusCode: 200,
        responseTimeMs: processingTime,
      });

      return candidates;
    } catch (error) {
      const processingTime = Date.now() - startTime;

      await APIAuditGate.log({
        module: APIModule.CANDIDATE_RANKER,
        apiKey,
        endpoint: '/api/modules/candidate-ranker',
        method: 'POST',
        statusCode: 500,
        responseTimeMs: processingTime,
      });

      throw error;
    }
  }

  /**
   * 후보 랭킹 로직
   */
  private static async rankCandidates(
    input: CandidateRankingInput
  ): Promise<CandidateRankingResult> {
    // [DIAGNOSTIC] 입력값 로그
    console.log('[candidate-ranker] input:', {
      raw: input.userSentence,
      normalized: input.userSentence.trim().toLowerCase(),
      genreHints: input.genreHints
    });

    // DB에서 영화 조회
    const whereClause: any = {};
    
    // 장르 힌트가 있으면 필터링
    if (input.genreHints && input.genreHints.length > 0) {
      whereClause.OR = [
        { primaryGenre: { in: input.genreHints } },
        { secondaryGenres: { hasSome: input.genreHints } },
      ];
    }

    // DB에서 영화 조회 (최대 100개 후보 중에서 랭킹)
    const movies = await prisma.movie.findMany({
      where: whereClause,
      take: 100, // 랭킹 후보 풀
      orderBy: { createdAt: 'desc' }, // 최신순 우선
    });

    console.log('[candidate-ranker] db movies found:', movies.length);

    // 데이터가 없으면 빈 결과 반환
    if (movies.length === 0) {
      console.log('[candidate-ranker] NO_DATA: no movies in database');
      return {
        candidates: [],
        hasLowConfidence: true,
      };
    }

    // userSentence 기반 키워드 매칭 점수 계산
    const normalizedQuery = input.userSentence.trim().toLowerCase();
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2); // 2글자 이상 단어만

    const scoredMovies = movies.map(movie => {
      let score = 0.5; // 기본 점수

      // 제목 매칭 (높은 가중치)
      const titleLower = (movie.title || '').toLowerCase();
      const originalTitleLower = (movie.originalTitle || '').toLowerCase();
      
      if (titleLower.includes(normalizedQuery) || originalTitleLower.includes(normalizedQuery)) {
        score += 0.4; // 완전 일치
      } else {
        // 단어별 부분 매칭
        const titleWords = (titleLower + ' ' + originalTitleLower).split(/\s+/);
        const matchedWords = queryWords.filter(qw => 
          titleWords.some(tw => tw.includes(qw) || qw.includes(tw))
        );
        score += (matchedWords.length / Math.max(queryWords.length, 1)) * 0.3;
      }

      // 장르 매칭 (보조 점수)
      if (input.genreHints && input.genreHints.length > 0) {
        const genreMatch = 
          (movie.primaryGenre && input.genreHints.includes(movie.primaryGenre)) ||
          movie.secondaryGenres.some(g => input.genreHints!.includes(g));
        if (genreMatch) {
          score += 0.1;
        }
      }

      // 점수 정규화 (0.0 ~ 1.0)
      score = Math.min(1.0, Math.max(0.0, score));

      return {
        movieId: movie.id,
        score,
        movie,
      };
    });

    // 점수 기준 정렬 및 상위 3개 선택
    const ranked = scoredMovies
      .sort((a, b) => b.score - a.score)
      .slice(0, this.MAX_CANDIDATES)
      .map((item, index) => ({
        movieId: item.movieId,
        rank: index + 1,
        confidenceScore: item.score,
      }));

    console.log('[candidate-ranker] ranked top3:', ranked.map(r => ({
      movieId: r.movieId,
      confidence: r.confidenceScore
    })));

    // Confidence Cutoff 체크
    const hasLowConfidence = ranked.length === 0 || 
      ranked[0].confidenceScore < this.CONFIDENCE_CUTOFF;

    if (hasLowConfidence) {
      console.log('[candidate-ranker] LOW_CONFIDENCE: top score', ranked[0]?.confidenceScore, '< cutoff', this.CONFIDENCE_CUTOFF);
      // 보상 경로: 모호함 안내 + 외부 검색/OTT 티켓 + 제보 저장
      return {
        candidates: [],
        hasLowConfidence: true,
      };
    }

    return {
      candidates: ranked,
      hasLowConfidence: false,
    };
  }
}

