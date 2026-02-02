/**
 * API Module 4: Feedback Handler
 * 
 * 피드백 처리 모듈
 * - 확정/실패/제보 처리
 * - Failure Refinery 연동
 */

import { FeedbackType, FailureType, SessionEndStatus } from '@prisma/client';
import { SessionEndGate } from '../../gates/session-end-gate';
import { APIAuditGate } from '../../gates/api-audit-gate';
import { prisma } from '../../db/prisma';

export interface FeedbackInput {
  sessionId: string;
  feedbackType: FeedbackType;
  content?: string;
  confirmedMovieId?: string;
}

export interface FeedbackResult {
  success: boolean;
  endStatus: SessionEndStatus;
  failureLogged?: boolean;
}

export class FeedbackHandler {
  /**
   * 피드백 처리
   */
  static async handle(
    input: FeedbackInput,
    apiKey?: string
  ): Promise<FeedbackResult> {
    const startTime = Date.now();

    try {
      // 피드백 저장
      await prisma.feedback.create({
        data: {
          sessionId: input.sessionId,
          feedbackType: input.feedbackType,
          content: input.content,
          confirmedMovieId: input.confirmedMovieId,
        },
      });

      // 피드백 타입에 따라 세션 종료 상태 결정 (Gate A)
      let endStatus: SessionEndStatus;
      let failureLogged = false;

      switch (input.feedbackType) {
        case 'CONFIRMED':
          endStatus = SessionEndStatus.SUCCESS_CONFIRMED;
          break;
        case 'LOW_CONFIDENCE':
          endStatus = SessionEndStatus.LOW_CONFIDENCE;
          failureLogged = await this.logFailure(input.sessionId, FailureType.LOW_CONFIDENCE_ALL);
          break;
        case 'NOT_FOUND':
          endStatus = SessionEndStatus.FAILED_AFTER_QUESTIONS;
          failureLogged = await this.logFailure(input.sessionId, FailureType.USER_REJECTED_ALL);
          break;
        case 'SUBMITTED_HINT':
          endStatus = SessionEndStatus.SUBMITTED_HINT;
          break;
        default:
          endStatus = SessionEndStatus.FAILED_AFTER_QUESTIONS;
      }

      // Gate A: 세션 종료 상태 설정
      await SessionEndGate.setEndStatus(
        input.sessionId,
        endStatus,
        `Feedback: ${input.feedbackType}`
      );

      const processingTime = Date.now() - startTime;

      await APIAuditGate.log({
        module: 'FEEDBACK_HANDLER',
        apiKey,
        endpoint: '/api/modules/feedback-handler',
        method: 'POST',
        statusCode: 200,
        responseTimeMs: processingTime,
      });

      return {
        success: true,
        endStatus,
        failureLogged,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      await APIAuditGate.log({
        module: 'FEEDBACK_HANDLER',
        apiKey,
        endpoint: '/api/modules/feedback-handler',
        method: 'POST',
        statusCode: 500,
        responseTimeMs: processingTime,
      });

      throw error;
    }
  }

  /**
   * 실패 로그 기록 (Failure Refinery)
   */
  private static async logFailure(
    sessionId: string,
    failureType: FailureType
  ): Promise<boolean> {
    try {
      const session = await prisma.searchSession.findUnique({
        where: { id: sessionId },
        select: { userMemorySentence: true },
      });

      await prisma.failureLog.create({
        data: {
          sessionId,
          failureType,
          userSentence: session?.userMemorySentence || null,
          context: {
            sessionId,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return true;
    } catch {
      return false;
    }
  }
}

