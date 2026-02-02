/**
 * 전체 파이프라인 실행
 * 
 * 모든 요청은 예외 없이 아래 순서를 따른다:
 * 1. User Input 수신
 * 2. Intent Classification
 * 3. Genre 결정
 * 4. Genre → Tag 세분화
 * 5. Solver Selection
 * 6. Result Generation
 * 7. Confidence Scoring
 * 8. Decision / Failure Log 저장
 * 
 * 어느 단계도 합치거나 생략하지 않는다.
 */

import { IntentClassifier, IntentType } from './intent-classifier';
import { GenreDecider, Genre } from './genre-decider';
import { TagGranularizer, Tag } from './tag-granularizer';
import { SolverSelector, SolverType } from './solver-selector';
import { DecisionLogger, DecisionLogEntry } from './decision-logger';

export interface PipelineResult {
  // 파이프라인 단계별 결과
  intent: IntentType;
  genre: Genre;
  tags: Tag[];
  selectedSolver: SolverType;
  confidence: number;
  
  // 최종 결과
  result: any;
  resultType: 'SUCCESS' | 'PARTIAL' | 'FAILURE';
  
  // 메타데이터
  processingTimeMs: number;
  costLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  logId: string;
}

export class PipelineExecutor {
  /**
   * 전체 파이프라인 실행
   */
  static async execute(userInput: string): Promise<PipelineResult> {
    const startTime = Date.now();

    try {
      // 1. Intent Classification
      const intentResult = IntentClassifier.classify(userInput);
      const intent = intentResult.intent;

      // 2. Genre 결정
      const genreResult = GenreDecider.decide(intent, userInput);
      const genre = genreResult.genre;

      // 3. Genre → Tag 세분화
      const tagResult = TagGranularizer.granularize(genre, userInput);
      const tags = tagResult.primaryTags;

      // 4. Solver Selection
      const solverResult = SolverSelector.select(
        genre,
        tags,
        genreResult.confidence
      );
      const selectedSolver = solverResult.selectedSolver;

      // 5. Result Generation (Solver 실행)
      const result = await this.executeSolver(selectedSolver, userInput, genre, tags);

      // 6. Confidence Scoring
      const confidence = this.calculateFinalConfidence(
        intentResult.confidence,
        genreResult.confidence,
        result
      );

      // 7. Result Type 결정
      const resultType = this.determineResultType(result, confidence);

      // 8. Decision / Failure Log 저장
      const logEntry: DecisionLogEntry = {
        userInput,
        intent,
        genre,
        tags,
        selectedSolver,
        confidence,
        resultGenerated: result !== null,
        resultType,
        resultData: result,
        processingTimeMs: Date.now() - startTime,
        costLevel: solverResult.config.costLevel,
        timestamp: new Date(),
      };

      if (resultType === 'FAILURE') {
        logEntry.failureType = this.classifyFailure(result, genre);
        logEntry.failureReason = this.getFailureReason(result, genre);
        logEntry.failureTags = this.getFailureTags(result, genre);
      }

      const logId = await DecisionLogger.log(logEntry);

      return {
        intent,
        genre,
        tags,
        selectedSolver,
        confidence,
        result,
        resultType,
        processingTimeMs: Date.now() - startTime,
        costLevel: solverResult.config.costLevel,
        logId,
      };
    } catch (error: any) {
      // 파이프라인 실패도 기록
      const logEntry: DecisionLogEntry = {
        userInput,
        intent: IntentType.UNKNOWN,
        genre: Genre.G1_EXPLORATORY_DISCOVERY,
        tags: [],
        selectedSolver: SolverType.RULE_BASED,
        confidence: 0,
        resultGenerated: false,
        resultType: 'FAILURE',
        failureType: 'PIPELINE_ERROR',
        failureReason: error.message,
        processingTimeMs: Date.now() - startTime,
        costLevel: 'LOW',
        timestamp: new Date(),
      };

      const logId = await DecisionLogger.log(logEntry);

      throw new Error(`Pipeline execution failed: ${error.message}`);
    }
  }

  /**
   * Solver 실행 (실제 구현은 각 Solver에 위임)
   */
  private static async executeSolver(
    solver: SolverType,
    userInput: string,
    genre: Genre,
    tags: Tag[]
  ): Promise<any> {
    // TODO: 실제 Solver 구현
    // 현재는 구조만 제공
    
    switch (solver) {
      case SolverType.KEYWORD_MATCH:
        return { type: 'keyword_match', candidates: [] };
      case SolverType.RULE_BASED:
        return { type: 'rule_based', candidates: [] };
      case SolverType.CACHE_LOOKUP:
        return { type: 'cache_lookup', candidates: [] };
      case SolverType.EMBEDDING_SIMILARITY:
        return { type: 'embedding_similarity', candidates: [] };
      case SolverType.PATTERN_MATCH:
        return { type: 'pattern_match', candidates: [] };
      case SolverType.LLM_REASONING:
        return { type: 'llm_reasoning', candidates: [] };
      default:
        return null;
    }
  }

  /**
   * 최종 Confidence 계산
   */
  private static calculateFinalConfidence(
    intentConfidence: number,
    genreConfidence: number,
    result: any
  ): number {
    // 단계별 Confidence의 가중 평균
    const baseConfidence = (intentConfidence * 0.3 + genreConfidence * 0.7);
    
    // 결과 품질에 따른 조정
    if (result && result.candidates && result.candidates.length > 0) {
      return Math.min(1.0, baseConfidence + 0.1);
    }
    
    return baseConfidence;
  }

  /**
   * Result Type 결정
   */
  private static determineResultType(
    result: any,
    confidence: number
  ): 'SUCCESS' | 'PARTIAL' | 'FAILURE' {
    if (!result || !result.candidates || result.candidates.length === 0) {
      return 'FAILURE';
    }
    
    if (confidence >= 0.7 && result.candidates.length >= 3) {
      return 'SUCCESS';
    }
    
    return 'PARTIAL';
  }

  /**
   * 실패 분류
   */
  private static classifyFailure(result: any, genre: Genre): string {
    if (!result) return 'NO_RESULT';
    if (result.candidates && result.candidates.length === 0) return 'NO_CANDIDATES';
    return 'LOW_CONFIDENCE';
  }

  /**
   * 실패 이유
   */
  private static getFailureReason(result: any, genre: Genre): string {
    if (!result) return 'Solver returned no result';
    if (result.candidates && result.candidates.length === 0) {
      return `No candidates found for genre ${genre}`;
    }
    return 'Low confidence in results';
  }

  /**
   * 실패 태그
   */
  private static getFailureTags(result: any, genre: Genre): string[] {
    const tags: string[] = [];
    
    if (!result) tags.push('SOLVER_FAILURE');
    if (result && result.candidates && result.candidates.length === 0) {
      tags.push('NO_MATCHES');
    }
    tags.push(`GENRE_${genre}`);
    
    return tags;
  }
}

