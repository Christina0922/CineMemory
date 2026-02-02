/**
 * Gate B 테스트: Tag Decision Log 100%
 */

import { TagDecisionGate } from '@/lib/gates/tag-decision-gate';
import { TagType, ConfidenceLevel } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    movieTag: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    TagType: {
      GENRE_PRIMARY: 'GENRE_PRIMARY',
      MOOD: 'MOOD',
    },
    ConfidenceLevel: {
      HIGH: 'HIGH',
      MEDIUM: 'MEDIUM',
      LOW: 'LOW',
    },
  };
});

describe('Gate B: Tag Decision Gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create tag with required reason', async () => {
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    mockPrisma.movieTag.create.mockResolvedValue({ id: 'tag-1' });

    const input = {
      movieId: 'movie-1',
      tagType: TagType.GENRE_PRIMARY,
      tagCode: 'DRAMA',
      reason: 'User confirmed genre',
      author: 'system',
      confidenceLevel: ConfidenceLevel.HIGH,
    };

    const result = await TagDecisionGate.createTag(input);

    expect(result.id).toBe('tag-1');
    expect(mockPrisma.movieTag.create).toHaveBeenCalledWith({
      data: {
        movieId: input.movieId,
        tagType: input.tagType,
        tagCode: input.tagCode,
        reason: input.reason,
        author: input.author,
        confidenceLevel: input.confidenceLevel,
        version: 1,
        createdAt: expect.any(Date),
      },
    });
  });

  test('should reject tag creation without reason', async () => {
    const input = {
      movieId: 'movie-1',
      tagType: TagType.GENRE_PRIMARY,
      tagCode: 'DRAMA',
      reason: '', // 빈 reason
      author: 'system',
    };

    await expect(TagDecisionGate.createTag(input as any)).rejects.toThrow('Reason is required');
  });

  test('should update tag while preserving reason', async () => {
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    mockPrisma.movieTag.findUnique.mockResolvedValue({
      id: 'tag-1',
      reason: 'Original reason',
      version: 1,
    });

    mockPrisma.movieTag.update.mockResolvedValue({ id: 'tag-1' });

    await TagDecisionGate.updateTag('tag-1', {
      author: 'admin',
      confidenceLevel: ConfidenceLevel.HIGH,
    });

    expect(mockPrisma.movieTag.update).toHaveBeenCalledWith({
      where: { id: 'tag-1' },
      data: {
        reason: 'Original reason', // 기존 reason 유지
        confidenceLevel: ConfidenceLevel.HIGH,
        author: 'admin',
        version: 2,
      },
    });
  });

  test('should reject update with empty reason', async () => {
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    mockPrisma.movieTag.findUnique.mockResolvedValue({
      id: 'tag-1',
      reason: 'Original reason',
      version: 1,
    });

    await expect(
      TagDecisionGate.updateTag('tag-1', {
        reason: '', // 빈 reason
        author: 'admin',
      })
    ).rejects.toThrow('Reason cannot be empty');
  });
});

