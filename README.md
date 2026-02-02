# CineMemory

Unified movie search engine powered by memory sentences.

## 검색 결과 진단 및 수정

검색 결과가 항상 동일한 문제를 진단하고 수정했습니다. 자세한 내용은 [docs/SEARCH_DIAGNOSTICS.md](./docs/SEARCH_DIAGNOSTICS.md)를 참조하세요.

### 빠른 시작

1. **데이터베이스 설정**
   ```bash
   npm run db:push
   npm run db:seed
   ```

2. **개발 서버 실행**
   ```bash
   npm run dev
   ```

3. **테스트 실행**
   ```bash
   npm test
   ```

### 검색 테스트

브라우저에서 `http://localhost:3000`에 접속하여 서로 다른 검색어로 테스트:
- "matrix space robot" → The Matrix 관련 영화
- "prison redemption" → The Shawshank Redemption
- "inception dream" → Inception

브라우저 콘솔과 서버 로그에서 진단 로그를 확인할 수 있습니다. 
