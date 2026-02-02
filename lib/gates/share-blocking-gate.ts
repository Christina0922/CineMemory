/**
 * 가격 방어 3종 세트 (2): 공유/캐시 재배포 차단
 * 
 * 공유 카드 / 썸네일 / OG 이미지 / 캐시·CDN 경로에서 포스터/스틸 URL이 절대 섞이면 안 된다.
 * 
 * 구현 요구:
 * - 공유용 응답은 이미지 필드를 null 또는 안전한 자체 아이콘/컬러/텍스트만 허용
 * - 이미지 화이트리스트(허용 도메인/패턴) 강제
 */

import { ShareType } from '../types/prisma-enums';
import { prisma } from '../db/prisma';

// TMDb 이미지 URL 패턴 (차단 대상)
const TMDB_IMAGE_PATTERNS = [
  /image\.tmdb\.org\/.*\/poster/,
  /image\.tmdb\.org\/.*\/still/,
  /image\.tmdb\.org\/.*\/backdrop/,
  /themoviedb\.org\/.*\/poster/,
  /themoviedb\.org\/.*\/still/,
];

// 허용된 이미지 도메인 (자체 아이콘/컬러/텍스트만)
const ALLOWED_IMAGE_DOMAINS = [
  /^data:image\//, // Data URI (자체 생성 이미지)
  /^\/images\//, // 자체 이미지 경로
  /^\/icons\//, // 자체 아이콘 경로
];

export class ShareBlockingGate {
  /**
   * 공유 콘텐츠에서 TMDb 이미지 URL 검사 및 차단
   */
  static async validateAndBlock(content: string, shareType: ShareType): Promise<{
    blocked: boolean;
    detectedUrls: string[];
    sanitizedContent?: string;
  }> {
    const detectedUrls: string[] = [];

    // TMDb 이미지 URL 패턴 검사
    for (const pattern of TMDB_IMAGE_PATTERNS) {
      const matches = content.match(new RegExp(pattern, 'gi'));
      if (matches) {
        detectedUrls.push(...matches);
      }
    }

    // JSON 필드 내 URL 검사 (poster, still, backdrop 등)
    try {
      const json = JSON.parse(content);
      const urlFields = ['poster', 'posterUrl', 'still', 'stillUrl', 'backdrop', 'backdropUrl', 'image', 'imageUrl'];
      
      for (const field of urlFields) {
        const value = json[field];
        if (typeof value === 'string') {
          for (const pattern of TMDB_IMAGE_PATTERNS) {
            if (pattern.test(value)) {
              detectedUrls.push(value);
            }
          }
        }
      }
    } catch {
      // JSON이 아니면 HTML/텍스트로 처리
    }

    // HTML <img> 태그 검사
    const imgTagPattern = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;
    while ((match = imgTagPattern.exec(content)) !== null) {
      const url = match[1];
      for (const pattern of TMDB_IMAGE_PATTERNS) {
        if (pattern.test(url)) {
          detectedUrls.push(url);
        }
      }
    }

    const blocked = detectedUrls.length > 0;

    // 감사 로그 기록
    await prisma.shareAudit.create({
      data: {
        shareType,
        content: content.substring(0, 10000), // 최대 10KB
        detectedUrls: [...new Set(detectedUrls)], // 중복 제거
        blocked,
        createdAt: new Date(),
      },
    });

    // 차단된 경우 sanitized content 생성 (이미지 필드 null 처리)
    let sanitizedContent: string | undefined;
    if (blocked) {
      try {
        const json = JSON.parse(content);
        const urlFields = ['poster', 'posterUrl', 'still', 'stillUrl', 'backdrop', 'backdropUrl', 'image', 'imageUrl'];
        for (const field of urlFields) {
          if (json[field]) {
            json[field] = null; // null로 대체
          }
        }
        sanitizedContent = JSON.stringify(json);
      } catch {
        // HTML의 경우 이미지 태그 제거
        sanitizedContent = content.replace(/<img[^>]+>/gi, '');
      }
    }

    return {
      blocked,
      detectedUrls: [...new Set(detectedUrls)],
      sanitizedContent,
    };
  }

  /**
   * 공유용 응답 생성 (이미지 필드 자동 제거)
   */
  static sanitizeForShare(data: any): any {
    const sanitized = { ...data };
    
    // TMDb 이미지 필드 제거
    const imageFields = ['poster', 'posterUrl', 'still', 'stillUrl', 'backdrop', 'backdropUrl'];
    for (const field of imageFields) {
      if (sanitized[field]) {
        delete sanitized[field];
      }
    }

    // 중첩 객체 처리
    if (Array.isArray(sanitized)) {
      return sanitized.map(item => this.sanitizeForShare(item));
    }

    if (typeof sanitized === 'object' && sanitized !== null) {
      for (const key in sanitized) {
        if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
          sanitized[key] = this.sanitizeForShare(sanitized[key]);
        }
      }
    }

    return sanitized;
  }
}

