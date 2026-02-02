/**
 * Gate A: 세션 종료 로그 100% 적재 검증
 * 
 * 모든 검색 세션은 반드시 아래 상태 중 하나로 종료 로그가 남아야 한다:
 * 1) success_confirmed (확정)
 * 2) low_confidence (컷 미만)
 * 3) failed_after_questions (질문 후 실패)
 * 4) submitted_hint (제보/추가정보 제출)
 * 
 * 종료 상태가 없으면 버그로 간주한다.
 */

import { SessionEndStatus } from '../types/prisma-enums';
import { prisma } from '../db/prisma';

export class SessionEndGate {
  /**
   * 세션 종료 상태 설정 (강제 검증)
   */
  static async setEndStatus(
    sessionId: string,
    status: SessionEndStatus,
    reason?: string
  ): Promise<void> {
    await prisma.searchSession.update({
      where: { id: sessionId },
      data: {
        endStatus: status,
        endStatusReason: reason || `Session ended with status: ${status}`,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * 종료 상태 누락 감지 (모니터링/테스트용)
   */
  static async detectMissingEndStatus(): Promise<{
    count: number;
    sessions: Array<{ id: string; createdAt: Date }>;
  }> {
    const sessions = await prisma.searchSession.findMany({
      where: {
        endStatus: null,
        // 5분 이상 된 세션만 체크 (진행 중인 세션 제외)
        createdAt: {
          lt: new Date(Date.now() - 5 * 60 * 1000),
        },
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    return {
      count: sessions.length,
      sessions,
    };
  }

  /**
   * 세션 종료 상태 검증 (테스트용)
   */
  static async validateSession(sessionId: string): Promise<{
    valid: boolean;
    endStatus: SessionEndStatus | null;
    error?: string;
  }> {
    const session = await prisma.searchSession.findUnique({
      where: { id: sessionId },
      select: { endStatus: true },
    });

    if (!session) {
      return {
        valid: false,
        endStatus: null,
        error: 'Session not found',
      };
    }

    if (!session.endStatus) {
      return {
        valid: false,
        endStatus: null,
        error: 'Session missing end status (Gate A violation)',
      };
    }

    return {
      valid: true,
      endStatus: session.endStatus as SessionEndStatus,
    };
  }
}

