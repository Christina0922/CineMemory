# CineMemory

Unified movie search engine powered by memory sentences.

## Project Identity

CineMemory is a **data infrastructure + modular search engine**, not just an app. It helps users find movies by describing what they remember (without the title), showing 3 candidates + 1-2 questions to reach confirmation.

## Core Principles

1. **Logging before features**: All functionality must be logged and auditable
2. **Gate enforcement**: Critical gates (A, B, C) are enforced at code/schema/test level
3. **DD/M&A ready**: Designed for due diligence and M&A audits from MVP
4. **MVP focus**: Accuracy threshold K1 (session confirmation rate) >= 50%

## Critical Gates

### Gate A: Session End Log (100% required)
Every search session must end with one of:
- `SUCCESS_CONFIRMED`
- `LOW_CONFIDENCE`
- `FAILED_AFTER_QUESTIONS`
- `SUBMITTED_HINT`

### Gate B: Tag Decision Log (100% required)
All movie tags must include:
- `reason` (required, 1 line)
- `author`
- `createdAt`
- `version`

### Gate C: TMDb Compliance UI
- About/Credits page with required attribution text
- TMDb logo usage restrictions enforced

## Price Defense Set

1. **TMDb Commercialization Trigger**: Tracks when commercial transition is required
2. **Share/Cache Redistribution Blocking**: Prevents TMDb poster/still URLs in shared content
3. **PII Deletion Audit Logs**: Automatic audit trail for data deletion

## API Modules

The engine is split into 4 modules:

1. **Genre Classifier**: Classifies genres from user sentences
2. **Candidate Ranker**: Ranks movie candidates (max 3)
3. **Question Selector**: Selects clarifying questions (max 2)
4. **Feedback Handler**: Processes user feedback and session end states

Each module has:
- Access control
- Rate limiting
- Audit logging
- API key lifecycle management

## Development

### Prerequisites

- Node.js 18+
- PostgreSQL
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database URL
```

3. Set up database:
```bash
npx prisma generate
npx prisma db push
```

4. Run development server:
```bash
npm run dev
```

### Testing

Run gate tests:
```bash
npm run test:gate
```

Run all tests:
```bash
npm test
```

## Data Premium Features

- **Confidence Levels**: HIGH/MEDIUM/LOW for all tags
- **Language-Agnostic Nodes**: Cross-locale mapping for global expansion
- **Cost Ceiling**: Performance/cost limits enforced (external API <= 1 call, internal <= 100ms)

## License

[To be determined]

