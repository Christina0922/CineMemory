/**
 * Gate B: Tag Decision Log 100% (태깅 결정 로그 강제)
 * 
 * 영화 메타/태그(장르/무드/오브제/서사 힌트) 저장 시 reason(사유 1줄) 없으면 저장 불가.
 * author, created_at, version을 항상 기록한다.
 */

import { TagType, ConfidenceLevel } from '../types/prisma-enums';
import { z } from 'zod';
import { prisma } from '../db/prisma';

// Gate B: reason 필수 검증 스키마
const TagDecisionSchema = z.object({
  movieId: z.string(),
  tagType: z.nativeEnum(TagType),
  tagCode: z.string(),
  reason: z.string().min(1, 'Reason is required (Gate B)'), // 필수
  author: z.string().min(1, 'Author is required'),
  confidenceLevel: z.nativeEnum(ConfidenceLevel).optional(),
  nodeId: z.string().optional(),
});

export type TagDecisionInput = z.infer<typeof TagDecisionSchema>;

export class TagDecisionGate {
  /**
   * 태그 저장 (Gate B 검증 강제)
   */
  static async createTag(input: TagDecisionInput): Promise<{ id: string }> {
    // Gate B: reason 없으면 저장 불가
    const validated = TagDecisionSchema.parse(input);

    const tag = await prisma.movieTag.create({
      data: {
        movieId: validated.movieId,
        tagType: validated.tagType,
        tagCode: validated.tagCode,
        reason: validated.reason, // 필수
        author: validated.author, // 필수
        confidenceLevel: validated.confidenceLevel || ConfidenceLevel.MEDIUM,
        nodeId: validated.nodeId,
        version: 1,
        createdAt: new Date(),
      },
    });

    return { id: tag.id };
  }

  /**
   * 태그 업데이트 (reason 필수 유지)
   */
  static async updateTag(
    tagId: string,
    updates: Partial<Pick<TagDecisionInput, 'reason' | 'confidenceLevel'>> & {
      author: string; // 업데이트 시에도 author 필수
    }
  ): Promise<void> {
    // reason이 제공되면 검증
    if (updates.reason !== undefined) {
      if (!updates.reason || updates.reason.trim().length === 0) {
        throw new Error('Reason cannot be empty (Gate B)');
      }
    }

    const existing = await prisma.movieTag.findUnique({
      where: { id: tagId },
      select: { reason: true, version: true },
    });

    if (!existing) {
      throw new Error('Tag not found');
    }

    await prisma.movieTag.update({
      where: { id: tagId },
      data: {
        reason: updates.reason || existing.reason, // 기존 reason 유지
        confidenceLevel: updates.confidenceLevel,
        author: updates.author,
        version: existing.version + 1,
      },
    });
  }

  /**
   * reason 누락 태그 감지 (모니터링/테스트용)
   */
  static async detectMissingReason(): Promise<{
    count: number;
    tags: Array<{ id: string; movieId: string; tagType: string }>;
  }> {
    // Prisma는 스키마 레벨에서 reason을 필수로 강제하므로,
    // 이 함수는 빈 문자열만 체크 (데이터 무결성 확인)
    const tags = await prisma.movieTag.findMany({
      where: {
        reason: '',
      },
      select: {
        id: true,
        movieId: true,
        tagType: true,
      },
    });

    return {
      count: tags.length,
      tags: tags.map(t => ({
        id: t.id,
        movieId: t.movieId,
        tagType: t.tagType as string,
      })),
    };
  }
}

