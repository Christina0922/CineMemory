/**
 * API Module 3: Question Selector
 * 
 * 질문 선택 모듈
 * - 질문은 최대 2개
 * - "기억 안 남" 옵션은 항상 제공
 */

import { QuestionType, APIModule } from '../../types/prisma-enums';
import { prisma } from '../../db/prisma';
import { APIAuditGate } from '../../gates/api-audit-gate';

export interface QuestionSelectionInput {
  sessionId: string;
  userSentence: string;
  currentCandidates: Array<{ movieId: string; confidenceScore: number }>;
  previousQuestions?: Array<{ questionType: QuestionType; answer?: string }>;
}

export interface QuestionSelectionResult {
  questions: Array<{
    questionText: string;
    questionType: QuestionType;
    order: number;
  }>;
  maxQuestions: number; // 항상 2
}

export class QuestionSelector {
  private static readonly MAX_QUESTIONS = 2;

  /**
   * 질문 선택 (규칙+데이터 기반)
   */
  static async select(
    input: QuestionSelectionInput,
    apiKey?: string
  ): Promise<QuestionSelectionResult> {
    const startTime = Date.now();

    try {
      // 이미 질문이 2개면 더 이상 질문하지 않음
      const previousCount = input.previousQuestions?.length || 0;
      if (previousCount >= this.MAX_QUESTIONS) {
        return {
          questions: [],
          maxQuestions: this.MAX_QUESTIONS,
        };
      }

      const questions = await this.selectQuestions(input);

      const processingTime = Date.now() - startTime;

      await APIAuditGate.log({
        module: APIModule.QUESTION_SELECTOR,
        apiKey,
        endpoint: '/api/modules/question-selector',
        method: 'POST',
        statusCode: 200,
        responseTimeMs: processingTime,
      });

      return {
        questions,
        maxQuestions: this.MAX_QUESTIONS,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      await APIAuditGate.log({
        module: APIModule.QUESTION_SELECTOR,
        apiKey,
        endpoint: '/api/modules/question-selector',
        method: 'POST',
        statusCode: 500,
        responseTimeMs: processingTime,
      });

      throw error;
    }
  }

  /**
   * 질문 선택 로직
   */
  private static async selectQuestions(
    input: QuestionSelectionInput
  ): Promise<Array<{ questionText: string; questionType: QuestionType; order: number }>> {
    // MVP: 후보가 있으면 질문 생성
    // 실제로는 후보 간 차별화 포인트 식별 필요

    const questions: Array<{ questionText: string; questionType: QuestionType; order: number }> = [];

    if (input.currentCandidates.length > 0) {
      // 후보가 있으면 장르/연도/무드 질문 생성
      questions.push({
        questionText: 'What genre does this movie belong to?',
        questionType: QuestionType.GENRE_CLARIFICATION,
        order: 1,
      });

      if (input.currentCandidates.length >= 2) {
        questions.push({
          questionText: 'What year was this movie released?',
          questionType: QuestionType.YEAR_CLARIFICATION,
          order: 2,
        });
      }
    } else {
      // 후보가 없으면 기본 질문
      questions.push({
        questionText: 'Can you remember any specific scene or dialogue?',
        questionType: QuestionType.OTHER,
        order: 1,
      });
    }

    // 최대 2개로 제한
    return questions.slice(0, this.MAX_QUESTIONS);
  }
}

