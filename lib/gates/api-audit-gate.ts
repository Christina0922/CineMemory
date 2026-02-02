/**
 * API 거버넌스: 감사 로그
 * 
 * 모듈별 접근 제어, Rate Limit, API Key 생애주기, 호출 Audit Log
 */

import { APIModule } from '../types/prisma-enums';
import { prisma } from '../db/prisma';

export interface APIAuditLogInput {
  module: APIModule;
  apiKey?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  rateLimitHit?: boolean;
}

export class APIAuditGate {
  /**
   * API 호출 감사 로그 기록
   */
  static async log(input: APIAuditLogInput): Promise<void> {
    // API Key 마스킹 (마지막 4자만 표시)
    const maskedKey = input.apiKey
      ? `${input.apiKey.substring(0, input.apiKey.length - 4)}****`
      : null;

    await prisma.aPIAuditLog.create({
      data: {
        module: input.module,
        apiKey: maskedKey,
        endpoint: input.endpoint,
        method: input.method,
        statusCode: input.statusCode,
        responseTimeMs: input.responseTimeMs,
        rateLimitHit: input.rateLimitHit || false,
        createdAt: new Date(),
      },
    });
  }

  /**
   * Rate Limit 체크
   */
  static async checkRateLimit(
    apiKey: string,
    module: APIModule
  ): Promise<{ allowed: boolean; remaining: number }> {
    const keyRecord = await prisma.aPIKey.findFirst({
      where: {
        keyHash: apiKey, // 실제로는 해시 비교
        isActive: true,
        modules: {
          has: module,
        },
      },
    });

    if (!keyRecord) {
      return { allowed: false, remaining: 0 };
    }

    // 최근 1분간 호출 횟수 확인
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentCalls = await prisma.aPIAuditLog.count({
      where: {
        apiKey: apiKey,
        module,
        createdAt: {
          gte: oneMinuteAgo,
        },
      },
    });

    const remaining = Math.max(0, keyRecord.rateLimitPerMin - recentCalls);
    const allowed = remaining > 0;

    if (!allowed) {
      // Rate limit hit 로그
      await this.log({
        module,
        apiKey,
        endpoint: 'rate-limit-check',
        method: 'GET',
        statusCode: 429,
        responseTimeMs: 0,
        rateLimitHit: true,
      });
    }

    return { allowed, remaining };
  }
}

