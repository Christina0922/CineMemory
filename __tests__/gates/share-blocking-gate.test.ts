/**
 * 가격 방어 3종 세트 (2) 테스트: 공유 차단
 */

import { ShareBlockingGate } from '@/lib/gates/share-blocking-gate';
import { ShareType } from '@prisma/client';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    shareAudit: {
      create: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    ShareType: {
      OG_IMAGE: 'OG_IMAGE',
      TWITTER_CARD: 'TWITTER_CARD',
    },
  };
});

describe('Share Blocking Gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should detect and block TMDb poster URLs in JSON', async () => {
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    const content = JSON.stringify({
      title: 'Test Movie',
      posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
      stillUrl: 'https://image.tmdb.org/t/p/w500/still.jpg',
    });

    mockPrisma.shareAudit.create.mockResolvedValue({ id: 'audit-1' });

    const result = await ShareBlockingGate.validateAndBlock(content, ShareType.OG_IMAGE);

    expect(result.blocked).toBe(true);
    expect(result.detectedUrls.length).toBeGreaterThan(0);
    expect(result.sanitizedContent).toBeDefined();

    const sanitized = JSON.parse(result.sanitizedContent!);
    expect(sanitized.posterUrl).toBeNull();
    expect(sanitized.stillUrl).toBeNull();
  });

  test('should detect TMDb URLs in HTML img tags', async () => {
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    const content = '<html><img src="https://image.tmdb.org/t/p/w500/poster.jpg" /></html>';

    mockPrisma.shareAudit.create.mockResolvedValue({ id: 'audit-1' });

    const result = await ShareBlockingGate.validateAndBlock(content, ShareType.TWITTER_CARD);

    expect(result.blocked).toBe(true);
    expect(result.detectedUrls.some(url => url.includes('poster'))).toBe(true);
  });

  test('should allow non-TMDb images', async () => {
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    const content = JSON.stringify({
      title: 'Test Movie',
      icon: '/icons/movie-icon.png',
      color: '#FF0000',
    });

    mockPrisma.shareAudit.create.mockResolvedValue({ id: 'audit-1' });

    const result = await ShareBlockingGate.validateAndBlock(content, ShareType.OG_IMAGE);

    expect(result.blocked).toBe(false);
    expect(result.detectedUrls.length).toBe(0);
  });

  test('should sanitize nested objects', () => {
    const data = {
      movie: {
        title: 'Test',
        posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
      },
      other: {
        nested: {
          stillUrl: 'https://image.tmdb.org/t/p/w500/still.jpg',
        },
      },
    };

    const sanitized = ShareBlockingGate.sanitizeForShare(data);

    expect(sanitized.movie.posterUrl).toBeUndefined();
    expect(sanitized.other.nested.stillUrl).toBeUndefined();
  });
});

