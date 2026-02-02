/**
 * 가격 방어 3종 세트 (3): PII 삭제·파기 감사로그
 * 
 * 개인정보/유저 문장 데이터는 "정책 문서"가 아니라 "감사로그"로 증빙해야 한다.
 * 운영자 수기 로그는 금지. 시스템이 자동 생성해야 한다.
 */

import { PIIDataType } from '../types/prisma-enums';
import { prisma } from '../db/prisma';

export interface PIIDeleteRequest {
  userId?: string;
  dataType: PIIDataType;
  optInStatus?: boolean;
  maskingApplied?: boolean;
}

export class PIIAuditGate {
  /**
   * PII 삭제 요청 기록 (자동 생성, 수기 금지)
   */
  static async recordDeleteRequest(request: PIIDeleteRequest): Promise<{
    auditLogId: string;
    deleteRequestedAt: Date;
  }> {
    const auditLog = await prisma.pIIAuditLog.create({
      data: {
        userId: request.userId,
        dataType: request.dataType,
        deleteRequestedAt: new Date(),
        optInStatus: request.optInStatus,
        maskingApplied: request.maskingApplied || false,
      },
    });

    return {
      auditLogId: auditLog.id,
      deleteRequestedAt: auditLog.deleteRequestedAt,
    };
  }

  /**
   * PII 삭제 완료 기록 (SLA 산출 가능)
   */
  static async recordDeleteCompleted(
    auditLogId: string
  ): Promise<{
    deleteCompletedAt: Date;
    slaMs: number;
  }> {
    const auditLog = await prisma.pIIAuditLog.findUnique({
      where: { id: auditLogId },
      select: { deleteRequestedAt: true },
    });

    if (!auditLog) {
      throw new Error('Audit log not found');
    }

    const deleteCompletedAt = new Date();
    const slaMs = deleteCompletedAt.getTime() - auditLog.deleteRequestedAt.getTime();

    await prisma.pIIAuditLog.update({
      where: { id: auditLogId },
      data: {
        deleteCompletedAt,
        slaMs,
      },
    });

    return {
      deleteCompletedAt,
      slaMs,
    };
  }

  /**
   * 보관 기간 만료 기록
   */
  static async recordRetentionExpired(
    auditLogId: string,
    retentionExpiredAt: Date
  ): Promise<void> {
    await prisma.pIIAuditLog.update({
      where: { id: auditLogId },
      data: {
        retentionExpiredAt,
      },
    });
  }

  /**
   * 완전 삭제(파기) 완료 기록
   */
  static async recordPurgeCompleted(
    auditLogId: string,
    purgeCompletedAt: Date
  ): Promise<void> {
    await prisma.pIIAuditLog.update({
      where: { id: auditLogId },
      data: {
        purgeCompletedAt,
      },
    });
  }

  /**
   * SLA 통계 조회
   */
  static async getSLAStats(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRequests: number;
    completedRequests: number;
    averageSlaMs: number;
    p95SlaMs: number;
  }> {
    const logs = await prisma.pIIAuditLog.findMany({
      where: {
        deleteRequestedAt: {
          gte: startDate,
          lte: endDate,
        },
        deleteCompletedAt: {
          not: null,
        },
      },
      select: {
        slaMs: true,
      },
    });

    const completedLogs = logs.filter((log: { slaMs: number | null }) => log.slaMs !== null) as Array<{
      slaMs: number;
    }>;

    const slaValues = completedLogs.map(log => log.slaMs).sort((a, b) => a - b);

    return {
      totalRequests: logs.length,
      completedRequests: completedLogs.length,
      averageSlaMs:
        slaValues.length > 0
          ? slaValues.reduce((a, b) => a + b, 0) / slaValues.length
          : 0,
      p95SlaMs:
        slaValues.length > 0
          ? slaValues[Math.floor(slaValues.length * 0.95)]
          : 0,
    };
  }
}

