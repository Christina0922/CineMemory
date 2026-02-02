# 검색 결과 진단 가이드

## 문제 원인 판정 결과

**케이스 C: 더미/폴백/고정 후보** ✅ 해결됨

### 근거
- `lib/api/modules/candidate-ranker.ts`에서 하드코딩된 5개 영화 배열을 제거
- `app/api/search/route.ts`에서 하드코딩된 `exampleMovies` 배열 제거
- 실제 DB 조회로 변경하여 `userSentence` 기반 키워드 매칭 랭킹 구현

## 수정 사항

### 1. 하드코딩된 더미 데이터 제거
- `candidate-ranker.ts`: 하드코딩된 `exampleMovies` 배열 제거
- `app/api/search/route.ts`: 하드코딩된 `exampleMovies` 배열 제거

### 2. 실제 DB 조회로 변경
- `CandidateRanker.rankCandidates()`가 Prisma를 통해 DB에서 영화 조회
- `userSentence`를 실제로 사용하여 키워드 매칭 점수 계산
- 제목 매칭, 단어별 부분 매칭, 장르 매칭을 통한 점수 계산

### 3. 캐시 방지 설정
- `app/api/search/route.ts`에 `export const dynamic = 'force-dynamic'` 추가
- `export const revalidate = 0` 추가

### 4. 진단 로그 추가
- 프론트엔드: 입력값, 요청 URL/바디, 응답 top1 로그
- API 라우트: 요청 method, 입력 문장, normalized query 로그
- CandidateRanker: 입력값, DB 조회 결과, 랭킹 결과 로그

### 5. Seed 스크립트 추가
- `prisma/seed.ts`: 최소 50개 영화 데이터 생성
- 다양한 장르 (SCIENCE_FICTION, DRAMA, ACTION, THRILLER, COMEDY 등)

## 재현/검증 방법

### 1. Seed 데이터 적재
```bash
npm run db:seed
```

### 2. 테스트 URL
- 개발 서버: `http://localhost:3000`
- 검색 페이지에서 서로 다른 입력 테스트:
  - "matrix space robot" → The Matrix 관련 영화
  - "prison redemption" → The Shawshank Redemption
  - "inception dream" → Inception

### 3. 정상 동작 확인 로그

#### 프론트엔드 콘솔 (브라우저 개발자 도구)
```
[search] query: matrix space robot
[search] request: { url: '/api/search', bodyOrParams: { userSentence: 'matrix space robot', sessionId: null } }
[search] response top1: { title: 'The Matrix', confidence: 0.9, movieId: 'movie-1' }
```

#### 서버 콘솔 (터미널)
```
[search-api] method: POST
[search-api] input: { raw: 'matrix space robot', sessionId: null }
[search-api] normalized query: matrix space robot
[candidate-ranker] input: { raw: 'matrix space robot', normalized: 'matrix space robot', genreHints: ['SCIENCE_FICTION'] }
[candidate-ranker] db movies found: 10
[candidate-ranker] ranked top3: [ { movieId: 'movie-1', confidence: 0.9 }, ... ]
[search-api] candidate result: { count: 3, top1: 'movie-1', hasLowConfidence: false }
```

### 4. 자동 테스트 실행
```bash
npm test -- __tests__/search-different-inputs.test.ts
```

테스트 통과 조건:
- 서로 다른 입력에서 top1 movieId가 달라야 함 (데이터 충분한 경우)
- 같은 입력을 2회 호출해도 함수가 실행되어야 함 (캐시 없음)
- userSentence가 실제로 랭킹에 영향을 미쳐야 함

## 문제 해결 체크리스트

- [x] 하드코딩된 더미 데이터 제거
- [x] 실제 DB 조회로 변경
- [x] userSentence 기반 키워드 매칭 구현
- [x] 캐시 방지 설정 추가
- [x] 진단 로그 추가
- [x] Seed 스크립트 생성 (50개 영화)
- [x] 자동 테스트 추가

