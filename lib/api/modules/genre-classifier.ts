/**
 * API Module 1: Genre Classifier
 * 
 * 장르 분류 모듈
 * - LLM은 보조 도구, 규칙+데이터 기반 우선
 */

import { TagType, ConfidenceLevel, APIModule } from '../../types/prisma-enums';
import { TagDecisionGate } from '../../gates/tag-decision-gate';
import { APIAuditGate } from '../../gates/api-audit-gate';

export interface GenreClassificationInput {
  userSentence: string;
  sessionId: string;
}

export interface GenreClassificationResult {
  primaryGenre: string;
  secondaryGenres: string[]; // 최대 2개
  subgenres: string[]; // 1~3개
  confidence: ConfidenceLevel;
}

export class GenreClassifier {
  /**
   * 장르 분류 (규칙 기반 우선, LLM 보조)
   */
  static async classify(
    input: GenreClassificationInput,
    apiKey?: string
  ): Promise<GenreClassificationResult> {
    const startTime = Date.now();

    try {
      // TODO: 실제 분류 로직 구현
      // 현재는 MVP 구조만 제공
      
      // 규칙 기반 분류 (우선)
      const ruleBasedResult = await this.ruleBasedClassification(input.userSentence);
      
      // LLM 보조 (필요 시)
      // const llmResult = await this.llmAssist(input.userSentence, ruleBasedResult);

      const processingTime = Date.now() - startTime;

      // API 감사 로그
      await APIAuditGate.log({
        module: APIModule.GENRE_CLASSIFIER,
        apiKey,
        endpoint: '/api/modules/genre-classifier',
        method: 'POST',
        statusCode: 200,
        responseTimeMs: processingTime,
      });

      return ruleBasedResult;
    } catch (error) {
      const processingTime = Date.now() - startTime;

      await APIAuditGate.log({
        module: APIModule.GENRE_CLASSIFIER,
        apiKey,
        endpoint: '/api/modules/genre-classifier',
        method: 'POST',
        statusCode: 500,
        responseTimeMs: processingTime,
      });

      throw error;
    }
  }

  /**
   * 규칙 기반 분류 (우선)
   */
  private static async ruleBasedClassification(
    sentence: string
  ): Promise<GenreClassificationResult> {
    // MVP: 간단한 키워드 매칭 기반 장르 분류
    const lowerSentence = sentence.toLowerCase();
    
    // 장르 키워드 매칭
    const genreKeywords: Record<string, string[]> = {
      'SCIENCE_FICTION': ['space', 'future', 'robot', 'ai', 'alien', 'time travel', 'simulation', 'matrix', 'inception', 'interstellar'],
      'DRAMA': ['emotional', 'sad', 'tragic', 'family', 'relationship', 'love', 'loss'],
      'ACTION': ['fight', 'chase', 'explosion', 'gun', 'battle', 'war', 'combat'],
      'THRILLER': ['suspense', 'mystery', 'murder', 'crime', 'detective', 'investigation'],
      'HORROR': ['scary', 'ghost', 'monster', 'zombie', 'haunted', 'fear', 'nightmare'],
      'COMEDY': ['funny', 'laugh', 'joke', 'humor', 'comic', 'hilarious'],
    };

    let matchedGenres: Array<{ genre: string; score: number }> = [];

    for (const [genre, keywords] of Object.entries(genreKeywords)) {
      const matches = keywords.filter(keyword => lowerSentence.includes(keyword)).length;
      if (matches > 0) {
        matchedGenres.push({ genre, score: matches / keywords.length });
      }
    }

    // 점수 기준 정렬
    matchedGenres.sort((a, b) => b.score - a.score);

    const primaryGenre = matchedGenres[0]?.genre || 'DRAMA';
    const secondaryGenres = matchedGenres.slice(1, 3).map(g => g.genre);
    const confidence = matchedGenres[0]?.score > 0.3 ? ConfidenceLevel.MEDIUM : ConfidenceLevel.LOW;

    return {
      primaryGenre,
      secondaryGenres,
      subgenres: [],
      confidence,
    };
  }
}

