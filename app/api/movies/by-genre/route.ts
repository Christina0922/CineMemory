/**
 * 장르별 영화 조회 API
 * 
 * 탐색 축: 장르 / 국가 / A–Z / 연도 / 무드 / 오브제
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

type MovieGenreRow = {
  primaryGenre: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const genre = searchParams.get('genre');
    const country = searchParams.get('country');
    const year = searchParams.get('year');
    const sort = searchParams.get('sort') || 'title'; // title, year, createdAt
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 필터 조건 구성
    const where: any = {};

    if (genre) {
      where.OR = [
        { primaryGenre: genre },
        { secondaryGenres: { has: genre } },
        { subgenres: { has: genre } },
      ];
    }

    if (country) {
      where.country = country;
    }

    if (year) {
      const yearNum = parseInt(year);
      where.releaseDate = {
        gte: new Date(yearNum, 0, 1),
        lt: new Date(yearNum + 1, 0, 1),
      };
    }

    // 정렬 조건
    const orderBy: any = {};
    if (sort === 'year') {
      orderBy.releaseDate = 'desc';
    } else if (sort === 'createdAt') {
      orderBy.createdAt = 'desc';
    } else {
      orderBy.title = 'asc';
    }

    // 영화 조회
    const movies = await prisma.movie.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      select: {
        id: true,
        title: true,
        originalTitle: true,
        releaseDate: true,
        primaryGenre: true,
        secondaryGenres: true,
        subgenres: true,
        country: true,
        year: true,
      },
    });

    // 전체 개수
    const total = await prisma.movie.count({ where });

    // 사용 가능한 장르 목록
    const genres = await prisma.movie.findMany({
      select: { primaryGenre: true },
      distinct: ['primaryGenre'],
    });

    const availableGenres = (genres as Array<{ primaryGenre: string | null }>)
      .map((m) => m.primaryGenre)
      .filter((g): g is string => g !== null);

    return NextResponse.json({
      movies,
      total,
      limit,
      offset,
      availableGenres: [...new Set(availableGenres)].sort(),
    });
  } catch (error: any) {
    console.error('Movies by genre error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

