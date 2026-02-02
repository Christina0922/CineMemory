# CineMemory Color System

## 색상 전략 요약

**목표**: 인수자(고급/신뢰) + 사용자(가독성/집중) + 영화 애호가(시네마 감성) 모두 만족

**핵심 원칙**: 배경은 1개의 세계관으로 통일 ("Dark Cinema / Archive"), 포인트 컬러는 제한적 사용

## CSS 변수 (색상 토큰)

### Base Background - Dark Cinema / Archive
```css
--bg-primary: #0B1020          /* Primary background */
--bg-secondary: #0B0F1A        /* Secondary background */
--bg-subtle-gradient-start: #070A14  /* Gradient start */
--bg-subtle-gradient-end: #0B1020    /* Gradient end */
```

### Surface / Card
```css
--surface-card: #111827       /* Card background */
--surface-card-alt: #0F172A   /* Alternative card */
--border-card: #243046        /* Card border */
--border-card-subtle: #2B3650 /* Subtle border */
```

### Text
```css
--text-primary: #E5E7EB       /* Primary text */
--text-secondary: #9CA3AF     /* Secondary text */
--text-muted: #6B7280         /* Muted text */
```

### Accent (제한적 사용 - 10% 이하)
```css
--accent-pink: #FF4D8D        /* Primary accent */
--accent-pink-bright: #FF5AA5 /* Bright pink */
--accent-violet: #7C3AED      /* Focus/violet */
--accent-violet-bright: #8B5CF6 /* Bright violet */
```

### Film Strip
```css
--film-base: #1A1A1A          /* Film base color */
--film-base-alt: #222222      /* Film alternate */
--film-sprocket: #9CA3AF      /* Sprocket holes */
--film-border: rgba(156, 163, 175, 0.2) /* Film border */
```

## 주요 변경 사항

### Before → After

#### 1. 배경 통일
- **Before**: `bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900` (과한 보라색)
- **After**: `linear-gradient(to bottom, #070A14, #0B1020)` (near-black navy, 통일된 세계관)

#### 2. 검색 영역 재정의
- **Before**: `bg-white/5` (반투명 배경)
- **After**: `var(--surface-card)` (명확한 카드 표면, 배경과 분리)

#### 3. 포인트 컬러 제한
- **Before**: 보라색이 하단 전체에 깔림
- **After**: 버튼/링/로고에만 제한적 사용 (전체 면적의 10% 이하)

#### 4. 텍스트 대비 확보
- **Before**: `text-gray-300`, `text-gray-400` (일관성 부족)
- **After**: CSS 변수 기반 (`--text-primary`, `--text-secondary`) 명확한 대비

#### 5. CTA 버튼
- **Before**: `from-yellow-400 to-pink-500` (노란색 포함)
- **After**: `var(--accent-pink)` → `var(--accent-pink-bright)` (로고 톤과 일치)

#### 6. 포커스 링
- **Before**: `focus:ring-yellow-400` (노란색)
- **After**: `var(--accent-violet)` (미세한 보라색 링)

## 사용 규칙

### ✅ 허용
- 배경: Base background 톤만 사용
- 카드: Surface color로 명확히 분리
- 포인트: 버튼, 링크, 로고, 포커스 상태에만 사용
- 텍스트: 명확한 대비 확보

### ❌ 금지
- 보라색/핑크색을 배경 면적의 10% 이상 사용
- 갈색/오렌지/카멜 계열 사용
- 포인트 컬러를 대면적 그라데이션으로 사용
- 배경이 콘텐츠보다 튀는 디자인

## 완료 기준 체크리스트

- ✅ 인수자 관점: "제품이 고급스럽고 신뢰가 간다"
- ✅ 사용자 관점: "눈이 편하고 입력이 집중된다"
- ✅ 영화 애호가 관점: "시네마/필름 감성"
- ✅ 하단이 보라 덩어리로 튀지 않음
- ✅ Accent가 배경을 점령하지 않음

