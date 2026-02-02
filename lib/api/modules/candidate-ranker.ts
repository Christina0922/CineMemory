/**
 * API Module 2: Candidate Ranker
 * 
 * 후보 랭킹 모듈
 * - 후보는 기본 3개
 * - Confidence Cutoff 미만이면 '억지 후보' 금지 -> 보상 경로
 */

import { prisma } from '../../db/prisma';
import { APIAuditGate } from '../../gates/api-audit-gate';

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
        module: 'CANDIDATE_RANKER',
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
        module: 'CANDIDATE_RANKER',
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
    // MVP: 간단한 키워드 매칭 기반 랭킹
    // 실제로는 장르/무드/오브제 매칭, 신뢰도 점수 계산 필요
    
    // 예시 영화 데이터 (실제로는 DB에서 조회)
    const exampleMovies = [
      { id: 'movie-1', title: 'The Matrix', genre: 'SCIENCE_FICTION', score: 0.85 },
      { id: 'movie-2', title: 'Inception', genre: 'SCIENCE_FICTION', score: 0.78 },
      { id: 'movie-3', title: 'Interstellar', genre: 'SCIENCE_FICTION', score: 0.72 },
      { id: 'movie-4', title: 'The Shawshank Redemption', genre: 'DRAMA', score: 0.90 },
      { id: 'movie-5', title: 'Pulp Fiction', genre: 'CRIME', score: 0.88 },
    ];

    // 장르 힌트가 있으면 필터링
    let filteredMovies = exampleMovies;
    if (input.genreHints && input.genreHints.length > 0) {
      // 장르 매칭 (간단한 예시)
      filteredMovies = exampleMovies.filter(m => 
        input.genreHints!.some(hint => m.genre.includes(hint) || hint.includes(m.genre))
      );
    }

    // 신뢰도 점수 기준 정렬 및 상위 3개 선택
    const ranked = filteredMovies
      .sort((a, b) => b.score - a.score)
      .slice(0, this.MAX_CANDIDATES)
      .map((movie, index) => ({
        movieId: movie.id,
        rank: index + 1,
        confidenceScore: movie.score,
      }));

    // Confidence Cutoff 체크
    const hasLowConfidence = ranked.length === 0 || 
      ranked[0].confidenceScore < this.CONFIDENCE_CUTOFF;

    if (hasLowConfidence) {
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

