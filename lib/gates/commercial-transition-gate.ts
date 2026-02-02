/**
 * 가격 방어 3종 세트 (1): TMDb 상업화 전환 트리거
 * 
 * 상업화 트리거 조건을 코드/문서로 고정한다:
 * - 광고 ON
 * - 유료 기능 ON
 * - 제휴 링크 수익 발생
 * 
 * 위 조건 중 하나라도 true -> commercial_transition_required=true 로 기록
 */

import { prisma } from '../db/prisma';

export interface CommercialTrigger {
  adsEnabled: boolean;
  paidFeaturesEnabled: boolean;
  affiliateRevenueOccurred: boolean;
}

export class CommercialTransitionGate {
  /**
   * 상업화 트리거 체크 및 기록
   */
  static async checkAndRecord(
    triggers: CommercialTrigger,
    checkedBy: string,
    notes?: string
  ): Promise<{
    commercialTransitionRequired: boolean;
    recordId: string;
  }> {
    const commercialTransitionRequired =
      triggers.adsEnabled ||
      triggers.paidFeaturesEnabled ||
      triggers.affiliateRevenueOccurred;

    const record = await prisma.commercialTransition.create({
      data: {
        commercialTransitionRequired,
        adsEnabled: triggers.adsEnabled,
        paidFeaturesEnabled: triggers.paidFeaturesEnabled,
        affiliateRevenueOccurred: triggers.affiliateRevenueOccurred,
        checkedAt: new Date(),
        checkedBy,
        notes,
      },
    });

    return {
      commercialTransitionRequired,
      recordId: record.id,
    };
  }

  /**
   * 최신 상업화 상태 조회
   */
  static async getLatestStatus(): Promise<{
    commercialTransitionRequired: boolean;
    triggers: CommercialTrigger;
    checkedAt: Date;
    checkedBy: string;
  } | null> {
    const latest = await prisma.commercialTransition.findFirst({
      orderBy: { checkedAt: 'desc' },
    });

    if (!latest) {
      return null;
    }

    return {
      commercialTransitionRequired: latest.commercialTransitionRequired,
      triggers: {
        adsEnabled: latest.adsEnabled,
        paidFeaturesEnabled: latest.paidFeaturesEnabled,
        affiliateRevenueOccurred: latest.affiliateRevenueOccurred,
      },
      checkedAt: latest.checkedAt,
      checkedBy: latest.checkedBy,
    };
  }

  /**
   * 릴리즈 체크리스트 검증 (CI/CD용)
   */
  static async validateReleaseChecklist(): Promise<{
    valid: boolean;
    error?: string;
  }> {
    const status = await this.getLatestStatus();

    if (!status) {
      return {
        valid: false,
        error: 'No commercial transition record found',
      };
    }

    if (status.commercialTransitionRequired) {
      // 상업화 전환이 필요한 경우, 최근 7일 이내 확인 필요
      const daysSinceCheck = (Date.now() - status.checkedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCheck > 7) {
        return {
          valid: false,
          error: `Commercial transition required but not confirmed within 7 days (last checked: ${status.checkedAt.toISOString()})`,
        };
      }
    }

    return { valid: true };
  }
}

