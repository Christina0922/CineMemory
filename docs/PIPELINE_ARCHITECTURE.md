# CineMemory Pipeline Architecture

## 시스템 정체성

이 시스템은 **LLM 기반 멀티 레이어 검색·의사결정 엔진**이다.

목적: "좋은 답변 생성"이 아니라 **의사결정 → 실패 → 데이터 축적 → 신뢰도 상승의 반복**

출력보다 **구조·로그·재현성**이 우선이다.

## 전체 파이프라인 (절대 고정)

모든 요청은 예외 없이 아래 순서를 따른다:

```
1. User Input 수신
2. Intent Classification (질문의 목적 정의)
3. Genre 결정 (의사결정 레벨 분류)
4. Genre → Tag 세분화
5. Solver Selection
6. Result Generation
7. Confidence Scoring
8. Decision / Failure Log 저장
```

**어느 단계도 합치거나 생략하지 않는다.**

## Genre의 정확한 정의

### ❌ 금지
- "영화 / 드라마 / 추천" 같은 UI 메뉴용 분류
- 결과 정렬용 카테고리

### ✅ 정의
Genre는 **'어떤 종류의 판단을 요구하는가'**에 대한 분류다.
즉, **Solver 선택을 결정하는 1차 키**다.

## 필수 Genre 세트 (삭제 불가)

### 🎯 G1. Exploratory Discovery (탐색형 / 취향 확장)
- 사용자는 정확한 답을 모른다
- "비슷한 거", "이런 느낌", "새로운 거"
- 실패 허용도 높음

**Solver 정책:**
- 저비용 다중 후보 생성
- 다양성 우선
- Confidence 낮아도 실행 가능

### 🎯 G2. Precision Lookup (정답 탐색형)
- 명확한 대상 또는 조건 존재
- 틀리면 바로 불만 발생

**Solver 정책:**
- 정확도 우선
- 캐시 적극 활용
- Confidence 미달 시 응답 보류 또는 재질문

### 🎯 G3. Comparative Decision (비교·선택형)
- A vs B, Top N, 순위 요구
- 기준 정의가 핵심

**Solver 정책:**
- 비교 기준을 먼저 구조화
- Solver는 "결과"보다 "근거"를 생성
- 기준 불명확 시 실패 로그 기록

### 🎯 G4. Advisory / Curation (의견·추천형)
- 주관적 판단 요구
- "네 생각", "추천해줘"

**Solver 정책:**
- 사용자 히스토리 반영
- Confidence와 주관성 분리 기록
- 추천 실패 시 원인 태깅

### 🎯 G5. Meta / System Inquiry (시스템·구조 질문)
- "왜 이렇게 추천했어?"
- "기준이 뭐야?"

**Solver 정책:**
- Decision Log 참조 필수
- 추론 설명 가능해야 함
- 설명 불가 시 시스템 실패로 기록

## Genre → Tag 세분화 규칙

- 모든 Genre는 복수 Tag를 가진다
- Tag는 결과 설명용이 아니라 **Solver 제어 신호**다
- 각 Tag 판단 시 반드시 기록:
  - 선택된 Tag
  - 대안 Tag
  - 선택 이유 (자연어)
  - 불확실도 점수

**Tag 기록 없는 응답은 무효다.**

## Solver 선택 원칙

- Solver는 비용/정확도 기준으로 등급화
- Genre + Tag + Confidence에 의해 자동 선택
- 고비용 Solver는 Confidence Threshold 미달 시 호출 금지

**OpenAI, 특정 LLM 이름을 비즈니스 로직에 직접 쓰는 행위 금지**

## 실패 우선 기록 원칙

- 틀린 답, 애매한 답, 사용자 불만 → 전부 자산
- 실패는 삭제·은폐하지 않는다
- 실패 유형을 Tag로 분류한다

**이 시스템은 "정답 생성기"가 아니라 "실패 축적기"다.**

## 인수인계 기준 (48시간 룰)

다음 조건을 만족하지 못하면 설계 실패다:

신규 엔지니어가
- 파이프라인 다이어그램
- 최근 Decision Log 100건

만으로 구조를 이해할 수 있어야 한다.

특정 개인 설명 없이는 이해 불가하면 → 개인 의존 시스템으로 간주

## 인수 실사 방어 문장

이 시스템의 IP는
코드가 아니라 **의사결정 구조 + 실패 로그 축적 방식**이다.

따라서
"2주 안에 재구현 가능"이라는 질문은
구조를 이해하지 못한 전제다.

## 구현 파일

- `lib/pipeline/intent-classifier.ts` - Intent 분류
- `lib/pipeline/genre-decider.ts` - Genre 결정
- `lib/pipeline/tag-granularizer.ts` - Tag 세분화
- `lib/pipeline/solver-selector.ts` - Solver 선택
- `lib/pipeline/decision-logger.ts` - Decision Log 저장
- `lib/pipeline/pipeline-executor.ts` - 전체 파이프라인 실행

## API 엔드포인트

- `POST /api/pipeline` - 파이프라인 실행

