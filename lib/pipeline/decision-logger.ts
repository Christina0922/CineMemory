/**
 * Decision / Failure Log 저장
 * 
 * 모든 의사결정과 실패를 기록
 * 실패는 삭제·은폐하지 않는다
 * 실패 유형을 Tag로 분류한다
 */

import { prisma } from '../db/prisma';
import { FailureType } from '../types/prisma-enums';
import { IntentType } from './intent-classifier';
import { Genre } from './genre-decider';
import { Tag } from './tag-granularizer';
import { SolverType } from './solver-selector';

export interface DecisionLogEntry {
  // 파이프라인 단계별 결과
  userInput: string;
  intent: IntentType;
  genre: Genre;
  tags: Tag[];
  selectedSolver: SolverType;
  confidence: number;
  
  // 결과
  resultGenerated: boolean;
  resultType?: 'SUCCESS' | 'PARTIAL' | 'FAILURE';
  resultData?: any;
  
  // 실패 정보
  failureType?: string;
  failureReason?: string;
  failureTags?: string[];
  
  // 메타데이터
  processingTimeMs: number;
  costLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: Date;
}

export class DecisionLogger {
  /**
   * Decision Log 저장
   */
  static async log(entry: DecisionLogEntry): Promise<string> {
    try {
      // Decision Log를 DB에 저장 (새 테이블 필요)
      // 현재는 FailureLog에 통합 저장
      
      const logData = {
        sessionId: null, // 파이프라인 로그는 세션과 독립적일 수 있음
        failureType: (entry.resultType === 'FAILURE' 
          ? (entry.failureType ? (entry.failureType as FailureType) : FailureType.API_ERROR)
          : FailureType.NO_CANDIDATES) as FailureType,
        userSentence: entry.userInput,
        context: {
          intent: entry.intent,
          genre: entry.genre,
          tags: entry.tags.map(t => ({ code: t.code, name: t.name })),
          solver: entry.selectedSolver,
          confidence: entry.confidence,
          resultType: entry.resultType,
          failureType: entry.failureType,
          failureReason: entry.failureReason,
          failureTags: entry.failureTags,
          processingTimeMs: entry.processingTimeMs,
          costLevel: entry.costLevel,
        },
        detectedPattern: entry.failureType || undefined,
      };

      const failureLog = await prisma.failureLog.create({
        data: logData,
      });

      return failureLog.id;
    } catch (error) {
      console.error('Failed to log decision:', error);
      // 로그 실패는 시스템 오류로 기록
      throw new Error('Decision logging failed');
    }
  }

  /**
   * 최근 Decision Log 조회 (인수인계용)
   */
  static async getRecentLogs(limit: number = 100): Promise<any[]> {
    try {
      const logs = await prisma.failureLog.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userSentence: true,
          context: true,
          failureType: true,
          createdAt: true,
        },
      });

      return logs.map((log: { id: string; userSentence: string | null; context: any; failureType: string | null; createdAt: Date }) => ({
        id: log.id,
        input: log.userSentence,
        context: log.context,
        failureType: log.failureType,
        timestamp: log.createdAt,
      }));
    } catch (error) {
      console.error('Failed to retrieve decision logs:', error);
      return [];
    }
  }
}

