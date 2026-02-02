# CineMemory Gates 빠른 참조

## Gate A: 세션 종료 로그 100% 적재

### 필수 요구사항
모든 검색 세션은 반드시 아래 상태 중 하나로 종료 로그가 남아야 함:
- `SUCCESS_CONFIRMED` - 확정
- `LOW_CONFIDENCE` - 컷 미만
- `FAILED_AFTER_QUESTIONS` - 질문 후 실패
- `SUBMITTED_HINT` - 제보/추가정보 제출

### 사용법
```typescript
import { SessionEndGate } from '@/lib/gates/session-end-gate';

// 세션 종료 상태 설정 (강제)
await SessionEndGate.setEndStatus(
  sessionId,
  SessionEndStatus.SUCCESS_CONFIRMED,
  'User confirmed movie'
);

// 누락 감지 (모니터링)
const missing = await SessionEndGate.detectMissingEndStatus();
if (missing.count > 0) {
  // 알림/경고 처리
}

// 검증 (테스트)
const validation = await SessionEndGate.validateSession(sessionId);
if (!validation.valid) {
  throw new Error(validation.error);
}
```

### 스키마
```prisma
model SearchSession {
  endStatus SessionEndStatus?  // null이면 Gate A 위반
  endStatusReason String?
}
```

---

## Gate B: Tag Decision Log 100%

### 필수 요구사항
영화 메타/태그 저장 시 다음 필드 필수:
- `reason` - 사유 1줄 (없으면 저장 불가)
- `author` - 태깅 결정자
- `createdAt` - 생성 시각
- `version` - 버전 번호

### 사용법
```typescript
import { TagDecisionGate } from '@/lib/gates/tag-decision-gate';

// 태그 생성 (reason 필수)
await TagDecisionGate.createTag({
  movieId: 'movie-1',
  tagType: TagType.GENRE_PRIMARY,
  tagCode: 'DRAMA',
  reason: 'User confirmed genre', // 필수!
  author: 'system',
  confidenceLevel: ConfidenceLevel.HIGH,
});

// 누락 감지
const missing = await TagDecisionGate.detectMissingReason();
```

### 스키마
```prisma
model MovieTag {
  reason String  // 필수 (스키마 레벨)
  author String  // 필수
  version Int @default(1)
  createdAt DateTime @default(now())
}
```

---

## Gate C: TMDb 컴플라이언스 UI

### 필수 요구사항
1. About/Credits 페이지 필수
2. 다음 문구를 문자열 그대로 노출:
   > "This product uses the TMDB API but is not endorsed or certified by TMDB."
3. TMDb 로고:
   - 앱 주 로고보다 덜 두드러지게
   - 승인 로고만 사용
   - endorsement처럼 보이게 암시 금지

### 구현 위치
- `app/about/page.tsx` - About/Credits 페이지

### 검증
- UI 컴포넌트로 고정 (나중에 추가 금지)
- 필수 문구 포함 여부 확인

---

## 가격 방어 1: TMDb 상업화 전환 트리거

### 트리거 조건
- 광고 ON
- 유료 기능 ON
- 제휴 링크 수익 발생

### 사용법
```typescript
import { CommercialTransitionGate } from '@/lib/gates/commercial-transition-gate';

// 트리거 체크 및 기록
const result = await CommercialTransitionGate.checkAndRecord(
  {
    adsEnabled: true,
    paidFeaturesEnabled: false,
    affiliateRevenueOccurred: false,
  },
  'admin@example.com',
  'Ads enabled on homepage'
);

if (result.commercialTransitionRequired) {
  // 상업 계약 필요 알림
}

// 릴리즈 체크리스트 검증 (CI/CD)
const validation = await CommercialTransitionGate.validateReleaseChecklist();
if (!validation.valid) {
  throw new Error(validation.error);
}
```

---

## 가격 방어 2: 공유/캐시 재배포 차단

### 필수 요구사항
공유 카드/썸네일/OG 이미지/캐시·CDN 경로에서 포스터/스틸 URL이 절대 섞이면 안 됨.

### 사용법
```typescript
import { ShareBlockingGate } from '@/lib/gates/share-blocking-gate';

// 검사 및 차단
const result = await ShareBlockingGate.validateAndBlock(
  jsonContent,
  ShareType.OG_IMAGE
);

if (result.blocked) {
  // TMDb URL 발견 -> sanitizedContent 사용
  return result.sanitizedContent;
}

// 공유용 응답 생성 (이미지 필드 자동 제거)
const sanitized = ShareBlockingGate.sanitizeForShare(movieData);
```

### 자동 테스트
```typescript
// 공유 카드 응답에 poster/still URL 패턴이 발견되면 빌드 실패
const test = await ShareBlockingGate.validateAndBlock(
  JSON.stringify({ posterUrl: 'https://image.tmdb.org/...' }),
  ShareType.OG_IMAGE
);
expect(test.blocked).toBe(true);
```

---

## 가격 방어 3: PII 삭제·파기 감사로그

### 필수 요구사항
- 운영자 수기 로그 금지
- 시스템 자동 생성
- 필수 필드: deleteRequestedAt, deleteCompletedAt, retentionExpiredAt, purgeCompletedAt

### 사용법
```typescript
import { PIIAuditGate } from '@/lib/gates/pii-audit-gate';

// 삭제 요청 기록
const audit = await PIIAuditGate.recordDeleteRequest({
  userId: 'user-1',
  dataType: PIIDataType.USER_MEMORY_SENTENCE,
  optInStatus: true,
});

// 삭제 완료 기록 (SLA 산출)
await PIIAuditGate.recordDeleteCompleted(audit.auditLogId);

// SLA 통계
const stats = await PIIAuditGate.getSLAStats(startDate, endDate);
console.log(`Average SLA: ${stats.averageSlaMs}ms`);
```

---

## DD 체크리스트 실행

### 사용법
```typescript
import { DDChecklist } from '@/lib/utils/dd-checklist';

// 전체 체크리스트 실행
const result = await DDChecklist.run();

// 결과 출력
console.log(DDChecklist.formatResult(result));

// CI/CD 통합
if (!result.passed) {
  process.exit(1);
}
```

### 체크 항목
1. Gate A: Session End Log
2. Gate B: Tag Decision Log
3. Price Defense 1: Commercial Transition
4. Price Defense 2: Share Blocking
5. Price Defense 3: PII Audit Log

