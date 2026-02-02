/**
 * Gate A 테스트: 세션 종료 로그 100% 적재 검증
 */

import { PrismaClient } from '@prisma/client';
import { SessionEndGate } from '@/lib/gates/session-end-gate';
import { SessionEndStatus } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    searchSession: {
      update: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
    SessionEndStatus: {
      SUCCESS_CONFIRMED: 'SUCCESS_CONFIRMED',
      LOW_CONFIDENCE: 'LOW_CONFIDENCE',
      FAILED_AFTER_QUESTIONS: 'FAILED_AFTER_QUESTIONS',
      SUBMITTED_HINT: 'SUBMITTED_HINT',
    },
  };
});

describe('Gate A: Session End Gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should set end status for session', async () => {
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    mockPrisma.searchSession.update.mockResolvedValue({
      id: 'session-1',
      endStatus: SessionEndStatus.SUCCESS_CONFIRMED,
    });

    await SessionEndGate.setEndStatus('session-1', SessionEndStatus.SUCCESS_CONFIRMED);

    expect(mockPrisma.searchSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: {
        endStatus: SessionEndStatus.SUCCESS_CONFIRMED,
        endStatusReason: expect.any(String),
        updatedAt: expect.any(Date),
      },
    });
  });

  test('should detect missing end status', async () => {
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    const mockSessions = [
      { id: 'session-1', createdAt: new Date(Date.now() - 10 * 60 * 1000) },
      { id: 'session-2', createdAt: new Date(Date.now() - 15 * 60 * 1000) },
    ];

    mockPrisma.searchSession.findMany.mockResolvedValue(mockSessions);

    const result = await SessionEndGate.detectMissingEndStatus();

    expect(result.count).toBe(2);
    expect(result.sessions).toEqual(mockSessions);
    expect(mockPrisma.searchSession.findMany).toHaveBeenCalledWith({
      where: {
        endStatus: null,
        createdAt: {
          lt: expect.any(Date),
        },
      },
      select: {
        id: true,
        createdAt: true,
      },
    });
  });

  test('should validate session with end status', async () => {
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    mockPrisma.searchSession.findUnique.mockResolvedValue({
      endStatus: SessionEndStatus.SUCCESS_CONFIRMED,
    });

    const result = await SessionEndGate.validateSession('session-1');

    expect(result.valid).toBe(true);
    expect(result.endStatus).toBe(SessionEndStatus.SUCCESS_CONFIRMED);
  });

  test('should fail validation when end status is missing', async () => {
    const { PrismaClient } = require('@prisma/client');
    const mockPrisma = new PrismaClient();

    mockPrisma.searchSession.findUnique.mockResolvedValue({
      endStatus: null,
    });

    const result = await SessionEndGate.validateSession('session-1');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Gate A violation');
  });
});

