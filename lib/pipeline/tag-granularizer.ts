/**
 * Genre → Tag 세분화
 * 
 * Tag는 결과 설명용이 아니라 Solver 제어 신호
 * 각 Tag 판단 시 반드시 기록:
 * - 선택된 Tag
 * - 대안 Tag
 * - 선택 이유 (자연어)
 * - 불확실도 점수
 */

import { Genre } from './genre-decider';

export interface Tag {
  code: string;
  name: string;
  confidence: number;
  reasoning: string;
}

export interface TagGranularizationResult {
  primaryTags: Tag[];
  alternativeTags: Tag[];
  uncertaintyScore: number;
  genre: Genre;
}

export class TagGranularizer {
  /**
   * Genre → Tag 세분화
   */
  static granularize(genre: Genre, userInput: string): TagGranularizationResult {
    const lowerInput = userInput.toLowerCase();

    switch (genre) {
      case Genre.G1_EXPLORATORY_DISCOVERY:
        return this.granularizeG1(lowerInput);
      case Genre.G2_PRECISION_LOOKUP:
        return this.granularizeG2(lowerInput);
      case Genre.G3_COMPARATIVE_DECISION:
        return this.granularizeG3(lowerInput);
      case Genre.G4_ADVISORY_CURATION:
        return this.granularizeG4(lowerInput);
      case Genre.G5_META_SYSTEM_INQUIRY:
        return this.granularizeG5(lowerInput);
      default:
        return {
          primaryTags: [],
          alternativeTags: [],
          uncertaintyScore: 1.0,
          genre,
        };
    }
  }

  /**
   * G1: Exploratory Discovery Tags
   */
  private static granularizeG1(input: string): TagGranularizationResult {
    const tags: Tag[] = [];

    // 다양성 요구 태그
    if (input.match(/\b(similar|like|same|kind of|type of)\b/)) {
      tags.push({
        code: 'G1_TAG_SIMILARITY',
        name: 'Similarity-based exploration',
        confidence: 0.8,
        reasoning: 'User wants similar movies',
      });
    }

    // 새로운 발견 태그
    if (input.match(/\b(new|different|other|explore|discover)\b/)) {
      tags.push({
        code: 'G1_TAG_NOVELTY',
        name: 'Novelty-seeking',
        confidence: 0.7,
        reasoning: 'User wants to discover new movies',
      });
    }

    // 장르 기반 탐색
    if (input.match(/\b(genre|type|category)\b/)) {
      tags.push({
        code: 'G1_TAG_GENRE_BASED',
        name: 'Genre-based exploration',
        confidence: 0.8,
        reasoning: 'User exploring by genre',
      });
    }

    return {
      primaryTags: tags.length > 0 ? tags : [{
        code: 'G1_TAG_GENERIC',
        name: 'Generic exploration',
        confidence: 0.5,
        reasoning: 'Generic exploratory request',
      }],
      alternativeTags: [],
      uncertaintyScore: 0.3,
      genre: Genre.G1_EXPLORATORY_DISCOVERY,
    };
  }

  /**
   * G2: Precision Lookup Tags
   */
  private static granularizeG2(input: string): TagGranularizationResult {
    const tags: Tag[] = [];

    // 구체적 세부사항 태그
    if (input.match(/\b(scene|dialogue|line|quote)\b/)) {
      tags.push({
        code: 'G2_TAG_CONTENT_MEMORY',
        name: 'Content-based memory',
        confidence: 0.9,
        reasoning: 'User remembers specific content',
      });
    }

    // 인물 기반
    if (input.match(/\b(actor|actress|director|character|star)\b/)) {
      tags.push({
        code: 'G2_TAG_PERSON_BASED',
        name: 'Person-based lookup',
        confidence: 0.8,
        reasoning: 'User remembers people involved',
      });
    }

    // 시간/연도 기반
    if (input.match(/\d{4}|\b(year|decade|old|recent|new)\b/)) {
      tags.push({
        code: 'G2_TAG_TEMPORAL',
        name: 'Temporal memory',
        confidence: 0.7,
        reasoning: 'User remembers time period',
      });
    }

    return {
      primaryTags: tags.length > 0 ? tags : [{
        code: 'G2_TAG_GENERIC',
        name: 'Generic precision lookup',
        confidence: 0.6,
        reasoning: 'Generic precise search',
      }],
      alternativeTags: [],
      uncertaintyScore: 0.2,
      genre: Genre.G2_PRECISION_LOOKUP,
    };
  }

  /**
   * G3: Comparative Decision Tags
   */
  private static granularizeG3(input: string): TagGranularizationResult {
    const tags: Tag[] = [];

    // 직접 비교
    if (input.match(/\b(vs|versus|compare|between)\b/)) {
      tags.push({
        code: 'G3_TAG_DIRECT_COMPARE',
        name: 'Direct comparison',
        confidence: 0.9,
        reasoning: 'User comparing specific items',
      });
    }

    // 순위/선택
    if (input.match(/\b(best|top|worst|better|prefer|choose)\b/)) {
      tags.push({
        code: 'G3_TAG_RANKING',
        name: 'Ranking/selection',
        confidence: 0.8,
        reasoning: 'User wants ranking or selection',
      });
    }

    return {
      primaryTags: tags.length > 0 ? tags : [{
        code: 'G3_TAG_GENERIC',
        name: 'Generic comparison',
        confidence: 0.6,
        reasoning: 'Generic comparison request',
      }],
      alternativeTags: [],
      uncertaintyScore: 0.3,
      genre: Genre.G3_COMPARATIVE_DECISION,
    };
  }

  /**
   * G4: Advisory / Curation Tags
   */
  private static granularizeG4(input: string): TagGranularizationResult {
    const tags: Tag[] = [];

    // 개인화 추천
    if (input.match(/\b(like|enjoy|watched|seen|favorite)\b/)) {
      tags.push({
        code: 'G4_TAG_PERSONALIZED',
        name: 'Personalized recommendation',
        confidence: 0.8,
        reasoning: 'User wants personalized suggestions',
      });
    }

    // 상황 기반
    if (input.match(/\b(mood|feel|want|need|looking for)\b/)) {
      tags.push({
        code: 'G4_TAG_CONTEXTUAL',
        name: 'Contextual recommendation',
        confidence: 0.7,
        reasoning: 'User wants context-based suggestions',
      });
    }

    return {
      primaryTags: tags.length > 0 ? tags : [{
        code: 'G4_TAG_GENERIC',
        name: 'Generic recommendation',
        confidence: 0.6,
        reasoning: 'Generic recommendation request',
      }],
      alternativeTags: [],
      uncertaintyScore: 0.4,
      genre: Genre.G4_ADVISORY_CURATION,
    };
  }

  /**
   * G5: Meta / System Inquiry Tags
   */
  private static granularizeG5(input: string): TagGranularizationResult {
    const tags: Tag[] = [];

    // 의사결정 설명
    if (input.match(/\b(why|how|reason|because|explain)\b/)) {
      tags.push({
        code: 'G5_TAG_DECISION_EXPLANATION',
        name: 'Decision explanation',
        confidence: 0.9,
        reasoning: 'User wants to understand decision',
      });
    }

    // 기준 질문
    if (input.match(/\b(criteria|standard|basis|how did|what made)\b/)) {
      tags.push({
        code: 'G5_TAG_CRITERIA_INQUIRY',
        name: 'Criteria inquiry',
        confidence: 0.8,
        reasoning: 'User asking about criteria',
      });
    }

    return {
      primaryTags: tags.length > 0 ? tags : [{
        code: 'G5_TAG_GENERIC',
        name: 'Generic system inquiry',
        confidence: 0.6,
        reasoning: 'Generic system question',
      }],
      alternativeTags: [],
      uncertaintyScore: 0.2,
      genre: Genre.G5_META_SYSTEM_INQUIRY,
    };
  }
}

