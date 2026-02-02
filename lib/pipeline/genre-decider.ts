/**
 * Genre 결정
 * 
 * Genre는 '어떤 종류의 판단을 요구하는가'에 대한 분류
 * Solver 선택을 결정하는 1차 키
 * 
 * 필수 Genre 세트:
 * - G1: Exploratory Discovery (탐색형)
 * - G2: Precision Lookup (정답 탐색형)
 * - G3: Comparative Decision (비교·선택형)
 * - G4: Advisory / Curation (의견·추천형)
 * - G5: Meta / System Inquiry (시스템·구조 질문)
 */

import { IntentType } from './intent-classifier';

export enum Genre {
  G1_EXPLORATORY_DISCOVERY = 'G1_EXPLORATORY_DISCOVERY',
  G2_PRECISION_LOOKUP = 'G2_PRECISION_LOOKUP',
  G3_COMPARATIVE_DECISION = 'G3_COMPARATIVE_DECISION',
  G4_ADVISORY_CURATION = 'G4_ADVISORY_CURATION',
  G5_META_SYSTEM_INQUIRY = 'G5_META_SYSTEM_INQUIRY',
}

export interface GenreDecisionResult {
  genre: Genre;
  confidence: number;
  reasoning: string;
  alternativeGenres?: Array<{
    genre: Genre;
    confidence: number;
    reason: string;
  }>;
  uncertaintyScore: number;
}

export class GenreDecider {
  /**
   * Intent + User Input → Genre 결정
   */
  static decide(intent: IntentType, userInput: string): GenreDecisionResult {
    const lowerInput = userInput.toLowerCase();

    // Intent → Genre 매핑 규칙
    let primaryGenre: Genre;
    let confidence = 0.8;
    let reasoning = '';

    switch (intent) {
      case IntentType.SEARCH:
        // 정확한 영화 찾기 vs 모호한 탐색 구분
        if (this.isPreciseSearch(lowerInput)) {
          primaryGenre = Genre.G2_PRECISION_LOOKUP;
          reasoning = 'User has specific memory/details about a movie';
        } else {
          primaryGenre = Genre.G1_EXPLORATORY_DISCOVERY;
          reasoning = 'User is exploring without clear target';
        }
        break;

      case IntentType.BROWSE:
        primaryGenre = Genre.G1_EXPLORATORY_DISCOVERY;
        reasoning = 'User wants to browse and discover';
        break;

      case IntentType.COMPARE:
        primaryGenre = Genre.G3_COMPARATIVE_DECISION;
        reasoning = 'User wants to compare or choose between options';
        break;

      case IntentType.RECOMMEND:
        primaryGenre = Genre.G4_ADVISORY_CURATION;
        reasoning = 'User is asking for recommendations or advice';
        break;

      case IntentType.EXPLAIN:
        primaryGenre = Genre.G5_META_SYSTEM_INQUIRY;
        reasoning = 'User wants to understand system decisions';
        break;

      default:
        primaryGenre = Genre.G1_EXPLORATORY_DISCOVERY;
        reasoning = 'Default to exploratory for unknown intent';
        confidence = 0.5;
    }

    // 대안 Genre 계산
    const alternativeGenres = this.calculateAlternatives(intent, lowerInput, primaryGenre);

    // 불확실도 계산
    const uncertaintyScore = alternativeGenres.length > 0 && alternativeGenres[0].confidence > 0.4
      ? 0.4
      : 0.2;

    return {
      genre: primaryGenre,
      confidence,
      reasoning,
      alternativeGenres: alternativeGenres.length > 0 ? alternativeGenres : undefined,
      uncertaintyScore,
    };
  }

  private static isPreciseSearch(input: string): boolean {
    // 구체적인 세부사항이 있는지 확인
    const preciseIndicators = [
      /\b(remember|specific|exactly|definitely|sure)\b/,
      /\b(scene|line|dialogue|character|actor|director)\b/,
      /\d{4}/, // 연도
    ];

    return preciseIndicators.some(pattern => pattern.test(input));
  }

  private static calculateAlternatives(
    intent: IntentType,
    input: string,
    primary: Genre
  ): Array<{ genre: Genre; confidence: number; reason: string }> {
    const alternatives: Array<{ genre: Genre; confidence: number; reason: string }> = [];

    // Intent에 따라 가능한 대안
    if (intent === IntentType.SEARCH) {
      if (primary === Genre.G2_PRECISION_LOOKUP) {
        alternatives.push({
          genre: Genre.G1_EXPLORATORY_DISCOVERY,
          confidence: 0.3,
          reason: 'Could be exploratory if details are vague',
        });
      } else {
        alternatives.push({
          genre: Genre.G2_PRECISION_LOOKUP,
          confidence: 0.3,
          reason: 'Could be precise if user remembers more details',
        });
      }
    }

    return alternatives.filter(alt => alt.confidence > 0.2);
  }
}

