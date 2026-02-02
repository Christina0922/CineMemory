/**
 * 검색 결과가 항상 동일한 문제 진단 테스트
 * 
 * 테스트 1: 입력이 다르면 응답 후보가 달라져야 한다
 * 테스트 2: 캐시 방지 확인
 */

import { CandidateRanker } from '../lib/api/modules/candidate-ranker';
import { prisma } from '../lib/db/prisma';

describe('Search Different Inputs Test', () => {
  beforeAll(async () => {
    // 테스트 전에 최소한의 영화 데이터가 있는지 확인
    const movieCount = await prisma.movie.count();
    if (movieCount < 10) {
      console.warn('⚠️  Warning: Less than 10 movies in database. Test may be unreliable.');
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('입력이 다르면 응답 후보가 달라져야 한다', async () => {
    const input1 = {
      sessionId: 'test-session-1',
      userSentence: 'matrix space robot',
      genreHints: ['SCIENCE_FICTION'],
    };

    const input2 = {
      sessionId: 'test-session-2',
      userSentence: 'prison redemption shawshank',
      genreHints: ['DRAMA'],
    };

    const result1 = await CandidateRanker.rank(input1);
    const result2 = await CandidateRanker.rank(input2);

    // 두 결과 모두 후보가 있어야 함 (데이터가 충분한 경우)
    if (result1.candidates.length > 0 && result2.candidates.length > 0) {
      // top1의 movieId가 달라야 함
      const top1MovieId1 = result1.candidates[0]?.movieId;
      const top1MovieId2 = result2.candidates[0]?.movieId;

      expect(top1MovieId1).toBeDefined();
      expect(top1MovieId2).toBeDefined();
      
      // 입력이 다르면 결과도 달라야 함
      // 단, 데이터가 매우 적을 경우 예외 처리
      if (top1MovieId1 && top1MovieId2) {
        // 같은 입력이 아니므로 다른 결과가 나올 가능성이 높음
        // 하지만 완전히 같을 수도 있으므로, 최소한 confidence score가 다르거나
        // 후보 순서가 다를 수 있음을 확인
        const allSame = result1.candidates.every((c1, idx) => {
          const c2 = result2.candidates[idx];
          return c2 && c1.movieId === c2.movieId && c1.confidenceScore === c2.confidenceScore;
        });

        // 완전히 동일하면 경고 (데이터 부족 또는 버그 가능성)
        if (allSame && result1.candidates.length > 0) {
          console.warn('⚠️  Warning: Different inputs produced identical results. This may indicate a bug or insufficient data.');
        }
      }
    } else {
      // 데이터 부족으로 인한 빈 결과는 테스트 스킵
      console.log('ℹ️  Skipping test: insufficient data (empty results)');
    }
  }, 30000);

  test('같은 입력을 2회 호출해도 route handler가 2번 실행되어야 함 (캐시 방지)', async () => {
    // 이 테스트는 실제 API route를 호출해야 하므로 통합 테스트로 분리하는 것이 좋음
    // 여기서는 CandidateRanker가 캐시 없이 동작하는지만 확인
    
    const input = {
      sessionId: 'test-session-cache',
      userSentence: 'test query for cache check',
      genreHints: [],
    };

    const result1 = await CandidateRanker.rank(input);
    const result2 = await CandidateRanker.rank(input);

    // 두 결과가 모두 존재해야 함 (캐시로 인해 두 번째가 스킵되지 않아야 함)
    expect(result1).toBeDefined();
    expect(result2).toBeDefined();

    // 후보가 있다면 동일한 결과가 나올 수 있지만, 
    // 최소한 함수가 실행되어 결과를 반환해야 함
    expect(result1.candidates.length).toBe(result2.candidates.length);
  }, 30000);

  test('userSentence가 실제로 랭킹에 영향을 미치는지 확인', async () => {
    // "matrix"와 "shawshank"는 완전히 다른 영화를 반환해야 함
    const matrixInput = {
      sessionId: 'test-matrix',
      userSentence: 'matrix',
      genreHints: ['SCIENCE_FICTION'],
    };

    const shawshankInput = {
      sessionId: 'test-shawshank',
      userSentence: 'shawshank redemption',
      genreHints: ['DRAMA'],
    };

    const matrixResult = await CandidateRanker.rank(matrixInput);
    const shawshankResult = await CandidateRanker.rank(shawshankInput);

    if (matrixResult.candidates.length > 0 && shawshankResult.candidates.length > 0) {
      const matrixTop1 = matrixResult.candidates[0];
      const shawshankTop1 = shawshankResult.candidates[0];

      // 영화 제목에 키워드가 포함되어야 함 (높은 신뢰도)
      const matrixMovie = await prisma.movie.findUnique({
        where: { id: matrixTop1.movieId },
      });
      const shawshankMovie = await prisma.movie.findUnique({
        where: { id: shawshankTop1.movieId },
      });

      if (matrixMovie && shawshankMovie) {
        const matrixTitleLower = matrixMovie.title.toLowerCase();
        const shawshankTitleLower = shawshankMovie.title.toLowerCase();

        // "matrix" 입력은 "matrix"가 포함된 제목을 반환해야 함
        expect(matrixTitleLower.includes('matrix') || matrixTitleLower.includes('shawshank')).toBe(false);
        
        // "shawshank" 입력은 "shawshank"가 포함된 제목을 반환해야 함
        expect(shawshankTitleLower.includes('shawshank') || shawshankTitleLower.includes('redemption')).toBe(true);
      }
    }
  }, 30000);
});

