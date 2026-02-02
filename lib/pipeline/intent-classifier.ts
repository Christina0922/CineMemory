/**
 * Intent Classification
 * 
 * 질문의 목적 정의
 * - 모든 요청의 첫 단계
 */

export enum IntentType {
  SEARCH = 'SEARCH',           // 영화 찾기
  BROWSE = 'BROWSE',          // 탐색/브라우징
  COMPARE = 'COMPARE',        // 비교
  RECOMMEND = 'RECOMMEND',    // 추천 요청
  EXPLAIN = 'EXPLAIN',        // 설명 요청
  UNKNOWN = 'UNKNOWN',
}

export interface IntentClassificationResult {
  intent: IntentType;
  confidence: number;
  reasoning: string; // 선택 이유 (자연어)
  alternativeIntents?: Array<{
    intent: IntentType;
    confidence: number;
    reason: string;
  }>;
  uncertaintyScore: number; // 0-1, 높을수록 불확실
}

export class IntentClassifier {
  /**
   * Intent 분류
   */
  static classify(userInput: string): IntentClassificationResult {
    const lowerInput = userInput.toLowerCase();
    
    // 키워드 기반 분류 (규칙 우선)
    const intentScores: Record<IntentType, number> = {
      [IntentType.SEARCH]: 0,
      [IntentType.BROWSE]: 0,
      [IntentType.COMPARE]: 0,
      [IntentType.RECOMMEND]: 0,
      [IntentType.EXPLAIN]: 0,
      [IntentType.UNKNOWN]: 0,
    };

    // Search 키워드
    if (lowerInput.match(/\b(find|search|looking for|remember|forgot|what was|what movie)\b/)) {
      intentScores[IntentType.SEARCH] += 0.8;
    }

    // Browse 키워드
    if (lowerInput.match(/\b(show|list|browse|explore|see|what|movies? in|genre)\b/)) {
      intentScores[IntentType.BROWSE] += 0.7;
    }

    // Compare 키워드
    if (lowerInput.match(/\b(vs|versus|compare|difference|better|which|prefer)\b/)) {
      intentScores[IntentType.COMPARE] += 0.8;
    }

    // Recommend 키워드
    if (lowerInput.match(/\b(recommend|suggest|should|what should|advice|opinion)\b/)) {
      intentScores[IntentType.RECOMMEND] += 0.8;
    }

    // Explain 키워드
    if (lowerInput.match(/\b(why|how|explain|reason|because|what is|tell me about)\b/)) {
      intentScores[IntentType.EXPLAIN] += 0.7;
    }

    // 최고 점수 Intent 찾기
    const maxScore = Math.max(...Object.values(intentScores));
    const primaryIntent = Object.entries(intentScores).find(
      ([_, score]) => score === maxScore
    )?.[0] as IntentType || IntentType.UNKNOWN;

    // 대안 Intent 계산
    const alternativeIntents = Object.entries(intentScores)
      .filter(([intent, score]) => intent !== primaryIntent && score > 0.3)
      .map(([intent, score]) => ({
        intent: intent as IntentType,
        confidence: score,
        reason: this.getIntentReason(intent as IntentType, lowerInput),
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 2);

    // 불확실도 계산 (점수 차이가 작을수록 불확실)
    const scores = Object.values(intentScores).sort((a, b) => b - a);
    const uncertaintyScore = scores.length > 1 
      ? 1 - (scores[0] - scores[1]) 
      : 0.5;

    return {
      intent: primaryIntent,
      confidence: maxScore,
      reasoning: this.getIntentReason(primaryIntent, lowerInput),
      alternativeIntents: alternativeIntents.length > 0 ? alternativeIntents : undefined,
      uncertaintyScore: Math.min(1, Math.max(0, uncertaintyScore)),
    };
  }

  private static getIntentReason(intent: IntentType, input: string): string {
    const reasons: Record<IntentType, string> = {
      [IntentType.SEARCH]: 'User is searching for a specific movie they remember',
      [IntentType.BROWSE]: 'User wants to explore or browse movies',
      [IntentType.COMPARE]: 'User wants to compare movies or make a choice',
      [IntentType.RECOMMEND]: 'User is asking for recommendations or advice',
      [IntentType.EXPLAIN]: 'User wants explanation about system decisions',
      [IntentType.UNKNOWN]: 'Intent unclear from input',
    };
    return reasons[intent] || 'Unknown intent';
  }
}

