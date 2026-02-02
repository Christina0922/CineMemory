/**
 * Solver Selection
 * 
 * Solver는 비용/정확도 기준으로 등급화
 * Genre + Tag + Confidence에 의해 자동 선택
 * 
 * 고비용 Solver는 Confidence Threshold 미달 시 호출 금지
 */

import { Genre } from './genre-decider';
import { Tag } from './tag-granularizer';

export enum SolverType {
  // 저비용 Solver
  KEYWORD_MATCH = 'KEYWORD_MATCH',
  RULE_BASED = 'RULE_BASED',
  CACHE_LOOKUP = 'CACHE_LOOKUP',
  
  // 중비용 Solver
  EMBEDDING_SIMILARITY = 'EMBEDDING_SIMILARITY',
  PATTERN_MATCH = 'PATTERN_MATCH',
  
  // 고비용 Solver (Confidence Threshold 필요)
  LLM_REASONING = 'LLM_REASONING',
  MULTI_STAGE_LLM = 'MULTI_STAGE_LLM',
}

export interface SolverConfig {
  type: SolverType;
  costLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  accuracyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidenceThreshold: number; // 이 값 이상일 때만 사용
  maxCandidates: number;
  diversityWeight?: number; // G1에서 중요
  precisionWeight?: number; // G2에서 중요
}

export interface SolverSelectionResult {
  selectedSolver: SolverType;
  config: SolverConfig;
  reasoning: string;
  alternativeSolvers?: Array<{
    solver: SolverType;
    reason: string;
  }>;
}

export class SolverSelector {
  private static readonly SOLVER_CONFIGS: Record<SolverType, SolverConfig> = {
    [SolverType.KEYWORD_MATCH]: {
      type: SolverType.KEYWORD_MATCH,
      costLevel: 'LOW',
      accuracyLevel: 'LOW',
      confidenceThreshold: 0.0,
      maxCandidates: 10,
    },
    [SolverType.RULE_BASED]: {
      type: SolverType.RULE_BASED,
      costLevel: 'LOW',
      accuracyLevel: 'MEDIUM',
      confidenceThreshold: 0.0,
      maxCandidates: 5,
    },
    [SolverType.CACHE_LOOKUP]: {
      type: SolverType.CACHE_LOOKUP,
      costLevel: 'LOW',
      accuracyLevel: 'MEDIUM',
      confidenceThreshold: 0.0,
      maxCandidates: 3,
    },
    [SolverType.EMBEDDING_SIMILARITY]: {
      type: SolverType.EMBEDDING_SIMILARITY,
      costLevel: 'MEDIUM',
      accuracyLevel: 'MEDIUM',
      confidenceThreshold: 0.3,
      maxCandidates: 5,
    },
    [SolverType.PATTERN_MATCH]: {
      type: SolverType.PATTERN_MATCH,
      costLevel: 'MEDIUM',
      accuracyLevel: 'HIGH',
      confidenceThreshold: 0.4,
      maxCandidates: 3,
    },
    [SolverType.LLM_REASONING]: {
      type: SolverType.LLM_REASONING,
      costLevel: 'HIGH',
      accuracyLevel: 'HIGH',
      confidenceThreshold: 0.6,
      maxCandidates: 3,
    },
    [SolverType.MULTI_STAGE_LLM]: {
      type: SolverType.MULTI_STAGE_LLM,
      costLevel: 'HIGH',
      accuracyLevel: 'HIGH',
      confidenceThreshold: 0.7,
      maxCandidates: 3,
    },
  };

  /**
   * Genre + Tag + Confidence → Solver 선택
   */
  static select(
    genre: Genre,
    tags: Tag[],
    confidence: number
  ): SolverSelectionResult {
    // Genre별 Solver 정책
    let selectedSolver: SolverType;
    let reasoning = '';

    switch (genre) {
      case Genre.G1_EXPLORATORY_DISCOVERY:
        // 저비용 다중 후보, 다양성 우선
        selectedSolver = confidence >= 0.4
          ? SolverType.EMBEDDING_SIMILARITY
          : SolverType.KEYWORD_MATCH;
        reasoning = 'Exploratory discovery: diversity over precision, low cost';
        break;

      case Genre.G2_PRECISION_LOOKUP:
        // 정확도 우선, 캐시 적극 활용
        if (confidence >= 0.7) {
          selectedSolver = SolverType.PATTERN_MATCH;
        } else if (confidence >= 0.5) {
          selectedSolver = SolverType.EMBEDDING_SIMILARITY;
        } else {
          selectedSolver = SolverType.CACHE_LOOKUP;
        }
        reasoning = 'Precision lookup: accuracy first, cache preferred';
        break;

      case Genre.G3_COMPARATIVE_DECISION:
        // 비교 기준 구조화 필요
        selectedSolver = confidence >= 0.6
          ? SolverType.LLM_REASONING
          : SolverType.RULE_BASED;
        reasoning = 'Comparative decision: structure criteria first';
        break;

      case Genre.G4_ADVISORY_CURATION:
        // 사용자 히스토리 반영 필요
        selectedSolver = confidence >= 0.6
          ? SolverType.LLM_REASONING
          : SolverType.EMBEDDING_SIMILARITY;
        reasoning = 'Advisory/curation: user history required';
        break;

      case Genre.G5_META_SYSTEM_INQUIRY:
        // Decision Log 참조 필수
        selectedSolver = SolverType.LLM_REASONING;
        reasoning = 'Meta inquiry: decision log reference required';
        break;

      default:
        selectedSolver = SolverType.RULE_BASED;
        reasoning = 'Default solver for unknown genre';
    }

    // Confidence Threshold 체크
    const config = this.SOLVER_CONFIGS[selectedSolver];
    if (confidence < config.confidenceThreshold) {
      // Threshold 미달 시 저비용 Solver로 다운그레이드
      selectedSolver = SolverType.KEYWORD_MATCH;
      reasoning += ` (downgraded due to low confidence: ${confidence.toFixed(2)} < ${config.confidenceThreshold})`;
    }

    const finalConfig = this.SOLVER_CONFIGS[selectedSolver];

    // 대안 Solver 계산
    const alternativeSolvers = this.calculateAlternatives(genre, confidence, selectedSolver);

    return {
      selectedSolver,
      config: finalConfig,
      reasoning,
      alternativeSolvers: alternativeSolvers.length > 0 ? alternativeSolvers : undefined,
    };
  }

  private static calculateAlternatives(
    genre: Genre,
    confidence: number,
    primary: SolverType
  ): Array<{ solver: SolverType; reason: string }> {
    const alternatives: Array<{ solver: SolverType; reason: string }> = [];

    // Confidence가 낮으면 저비용 대안 제시
    if (confidence < 0.5 && primary !== SolverType.KEYWORD_MATCH) {
      alternatives.push({
        solver: SolverType.KEYWORD_MATCH,
        reason: 'Lower cost alternative for low confidence',
      });
    }

    // Confidence가 높으면 고정확도 대안 제시
    if (confidence > 0.7 && primary !== SolverType.LLM_REASONING) {
      alternatives.push({
        solver: SolverType.LLM_REASONING,
        reason: 'Higher accuracy alternative for high confidence',
      });
    }

    return alternatives;
  }
}

