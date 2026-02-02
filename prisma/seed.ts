/**
 * Seed script for CineMemory database
 * 
 * 최소 50개 영화 데이터를 생성하여 검색 테스트 가능하게 함
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const movies = [
  // Science Fiction
  { id: 'movie-1', tmdbId: 603, title: 'The Matrix', originalTitle: 'The Matrix', year: 1999, primaryGenre: 'SCIENCE_FICTION', secondaryGenres: ['ACTION'], subgenres: ['CYBERPUNK'] },
  { id: 'movie-2', tmdbId: 27205, title: 'Inception', originalTitle: 'Inception', year: 2010, primaryGenre: 'SCIENCE_FICTION', secondaryGenres: ['THRILLER'], subgenres: ['MIND_BEND'] },
  { id: 'movie-3', tmdbId: 157336, title: 'Interstellar', originalTitle: 'Interstellar', year: 2014, primaryGenre: 'SCIENCE_FICTION', secondaryGenres: ['DRAMA'], subgenres: ['SPACE_OPERA'] },
  { id: 'movie-4', tmdbId: 181808, title: 'Star Wars: The Last Jedi', originalTitle: 'Star Wars: Episode VIII - The Last Jedi', year: 2017, primaryGenre: 'SCIENCE_FICTION', secondaryGenres: ['ACTION'], subgenres: ['SPACE_OPERA'] },
  { id: 'movie-5', tmdbId: 335983, title: 'Blade Runner 2049', originalTitle: 'Blade Runner 2049', year: 2017, primaryGenre: 'SCIENCE_FICTION', secondaryGenres: ['THRILLER'], subgenres: ['CYBERPUNK'] },
  { id: 'movie-6', tmdbId: 78, title: 'Blade Runner', originalTitle: 'Blade Runner', year: 1982, primaryGenre: 'SCIENCE_FICTION', secondaryGenres: ['THRILLER'], subgenres: ['CYBERPUNK'] },
  { id: 'movie-7', tmdbId: 348, title: 'Alien', originalTitle: 'Alien', year: 1979, primaryGenre: 'SCIENCE_FICTION', secondaryGenres: ['HORROR'], subgenres: ['SPACE_HORROR'] },
  { id: 'movie-8', tmdbId: 1891, title: 'The Empire Strikes Back', originalTitle: 'Star Wars: Episode V - The Empire Strikes Back', year: 1980, primaryGenre: 'SCIENCE_FICTION', secondaryGenres: ['ACTION'], subgenres: ['SPACE_OPERA'] },
  { id: 'movie-9', tmdbId: 11, title: 'Star Wars', originalTitle: 'Star Wars', year: 1977, primaryGenre: 'SCIENCE_FICTION', secondaryGenres: ['ACTION'], subgenres: ['SPACE_OPERA'] },
  { id: 'movie-10', tmdbId: 550, title: 'Fight Club', originalTitle: 'Fight Club', year: 1999, primaryGenre: 'DRAMA', secondaryGenres: ['THRILLER'], subgenres: ['PSYCHOLOGICAL'] },
  
  // Drama
  { id: 'movie-11', tmdbId: 278, title: 'The Shawshank Redemption', originalTitle: 'The Shawshank Redemption', year: 1994, primaryGenre: 'DRAMA', secondaryGenres: [], subgenres: ['PRISON'] },
  { id: 'movie-12', tmdbId: 238, title: 'The Godfather', originalTitle: 'The Godfather', year: 1972, primaryGenre: 'DRAMA', secondaryGenres: ['CRIME'], subgenres: ['CRIME_FAMILY'] },
  { id: 'movie-13', tmdbId: 240, title: 'The Godfather: Part II', originalTitle: 'The Godfather: Part II', year: 1974, primaryGenre: 'DRAMA', secondaryGenres: ['CRIME'], subgenres: ['CRIME_FAMILY'] },
  { id: 'movie-14', tmdbId: 424, title: 'Schindler\'s List', originalTitle: 'Schindler\'s List', year: 1993, primaryGenre: 'DRAMA', secondaryGenres: ['HISTORY'], subgenres: ['WAR'] },
  { id: 'movie-15', tmdbId: 497, title: 'The Green Mile', originalTitle: 'The Green Mile', year: 1999, primaryGenre: 'DRAMA', secondaryGenres: ['FANTASY'], subgenres: ['PRISON'] },
  { id: 'movie-16', tmdbId: 13, title: 'Forrest Gump', originalTitle: 'Forrest Gump', year: 1994, primaryGenre: 'DRAMA', secondaryGenres: ['COMEDY'], subgenres: ['HISTORICAL'] },
  { id: 'movie-17', tmdbId: 11216, title: 'Cinema Paradiso', originalTitle: 'Nuovo Cinema Paradiso', year: 1988, primaryGenre: 'DRAMA', secondaryGenres: ['ROMANCE'], subgenres: ['COMING_OF_AGE'] },
  { id: 'movie-18', tmdbId: 1422, title: 'The Departed', originalTitle: 'The Departed', year: 2006, primaryGenre: 'DRAMA', secondaryGenres: ['CRIME'], subgenres: ['UNDERCOVER'] },
  { id: 'movie-19', tmdbId: 680, title: 'Pulp Fiction', originalTitle: 'Pulp Fiction', year: 1994, primaryGenre: 'CRIME', secondaryGenres: ['DRAMA'], subgenres: ['NEO_NOIR'] },
  { id: 'movie-20', tmdbId: 429, title: 'The Good, the Bad and the Ugly', originalTitle: 'Il buono, il brutto, il cattivo', year: 1966, primaryGenre: 'WESTERN', secondaryGenres: ['ADVENTURE'], subgenres: ['SPAGHETTI_WESTERN'] },
  
  // Action
  { id: 'movie-21', tmdbId: 155, title: 'The Dark Knight', originalTitle: 'The Dark Knight', year: 2008, primaryGenre: 'ACTION', secondaryGenres: ['CRIME'], subgenres: ['SUPERHERO'] },
  { id: 'movie-22', tmdbId: 49026, title: 'The Dark Knight Rises', originalTitle: 'The Dark Knight Rises', year: 2012, primaryGenre: 'ACTION', secondaryGenres: ['CRIME'], subgenres: ['SUPERHERO'] },
  { id: 'movie-23', tmdbId: 272, title: 'Batman Begins', originalTitle: 'Batman Begins', year: 2005, primaryGenre: 'ACTION', secondaryGenres: ['CRIME'], subgenres: ['SUPERHERO'] },
  { id: 'movie-24', tmdbId: 245891, title: 'John Wick', originalTitle: 'John Wick', year: 2014, primaryGenre: 'ACTION', secondaryGenres: ['THRILLER'], subgenres: ['REVENGE'] },
  { id: 'movie-25', tmdbId: 324857, title: 'Spider-Man: Into the Spider-Verse', originalTitle: 'Spider-Man: Into the Spider-Verse', year: 2018, primaryGenre: 'ACTION', secondaryGenres: ['ANIMATION'], subgenres: ['SUPERHERO'] },
  { id: 'movie-26', tmdbId: 181, title: 'Return of the Jedi', originalTitle: 'Star Wars: Episode VI - Return of the Jedi', year: 1983, primaryGenre: 'ACTION', secondaryGenres: ['SCIENCE_FICTION'], subgenres: ['SPACE_OPERA'] },
  { id: 'movie-27', tmdbId: 122, title: 'The Lord of the Rings: The Return of the King', originalTitle: 'The Lord of the Rings: The Return of the King', year: 2003, primaryGenre: 'ACTION', secondaryGenres: ['FANTASY'], subgenres: ['EPIC'] },
  { id: 'movie-28', tmdbId: 120, title: 'The Lord of the Rings: The Fellowship of the Ring', originalTitle: 'The Lord of the Rings: The Fellowship of the Ring', year: 2001, primaryGenre: 'ACTION', secondaryGenres: ['FANTASY'], subgenres: ['EPIC'] },
  { id: 'movie-29', tmdbId: 121, title: 'The Lord of the Rings: The Two Towers', originalTitle: 'The Lord of the Rings: The Two Towers', year: 2002, primaryGenre: 'ACTION', secondaryGenres: ['FANTASY'], subgenres: ['EPIC'] },
  { id: 'movie-30', tmdbId: 475557, title: 'Joker', originalTitle: 'Joker', year: 2019, primaryGenre: 'DRAMA', secondaryGenres: ['CRIME'], subgenres: ['PSYCHOLOGICAL'] },
  
  // Thriller
  { id: 'movie-31', tmdbId: 550988, title: 'Free Guy', originalTitle: 'Free Guy', year: 2021, primaryGenre: 'COMEDY', secondaryGenres: ['SCIENCE_FICTION'], subgenres: ['ACTION_COMEDY'] },
  { id: 'movie-32', tmdbId: 496243, title: 'Parasite', originalTitle: '기생충', year: 2019, primaryGenre: 'THRILLER', secondaryGenres: ['DRAMA'], subgenres: ['SOCIAL_SATIRE'] },
  { id: 'movie-33', tmdbId: 4967, title: 'Goodfellas', originalTitle: 'Goodfellas', year: 1990, primaryGenre: 'CRIME', secondaryGenres: ['DRAMA'], subgenres: ['MAFIA'] },
  { id: 'movie-34', tmdbId: 694, title: 'The Shining', originalTitle: 'The Shining', year: 1980, primaryGenre: 'HORROR', secondaryGenres: ['THRILLER'], subgenres: ['PSYCHOLOGICAL_HORROR'] },
  { id: 'movie-35', tmdbId: 539, title: 'Psycho', originalTitle: 'Psycho', year: 1960, primaryGenre: 'HORROR', secondaryGenres: ['THRILLER'], subgenres: ['SLASHER'] },
  { id: 'movie-36', tmdbId: 62, title: '2001: A Space Odyssey', originalTitle: '2001: A Space Odyssey', year: 1968, primaryGenre: 'SCIENCE_FICTION', secondaryGenres: ['MYSTERY'], subgenres: ['PHILOSOPHICAL'] },
  { id: 'movie-37', tmdbId: 857, title: 'Saving Private Ryan', originalTitle: 'Saving Private Ryan', year: 1998, primaryGenre: 'WAR', secondaryGenres: ['DRAMA'], subgenres: ['WORLD_WAR_II'] },
  { id: 'movie-38', tmdbId: 475430, title: 'Once Upon a Time... in Hollywood', originalTitle: 'Once Upon a Time... in Hollywood', year: 2019, primaryGenre: 'COMEDY', secondaryGenres: ['DRAMA'], subgenres: ['PERIOD'] },
  { id: 'movie-39', tmdbId: 122917, title: 'The Hobbit: An Unexpected Journey', originalTitle: 'The Hobbit: An Unexpected Journey', year: 2012, primaryGenre: 'FANTASY', secondaryGenres: ['ADVENTURE'], subgenres: ['EPIC'] },
  { id: 'movie-40', tmdbId: 49051, title: 'The Hobbit: The Desolation of Smaug', originalTitle: 'The Hobbit: The Desolation of Smaug', year: 2013, primaryGenre: 'FANTASY', secondaryGenres: ['ADVENTURE'], subgenres: ['EPIC'] },
  
  // Comedy
  { id: 'movie-41', tmdbId: 105, title: 'Back to the Future', originalTitle: 'Back to the Future', year: 1985, primaryGenre: 'COMEDY', secondaryGenres: ['SCIENCE_FICTION'], subgenres: ['TIME_TRAVEL'] },
  { id: 'movie-42', tmdbId: 862, title: 'Toy Story', originalTitle: 'Toy Story', year: 1995, primaryGenre: 'COMEDY', secondaryGenres: ['ANIMATION'], subgenres: ['FAMILY'] },
  { id: 'movie-43', tmdbId: 313369, title: 'La La Land', originalTitle: 'La La Land', year: 2016, primaryGenre: 'ROMANCE', secondaryGenres: ['COMEDY'], subgenres: ['MUSICAL'] },
  { id: 'movie-44', tmdbId: 19404, title: 'Dilwale Dulhania Le Jayenge', originalTitle: 'दिलवाले दुल्हनिया ले जायेंगे', year: 1995, primaryGenre: 'ROMANCE', secondaryGenres: ['COMEDY'], subgenres: ['MUSICAL'] },
  { id: 'movie-45', tmdbId: 11216, title: 'Cinema Paradiso', originalTitle: 'Nuovo Cinema Paradiso', year: 1988, primaryGenre: 'DRAMA', secondaryGenres: ['ROMANCE'], subgenres: ['COMING_OF_AGE'] },
  { id: 'movie-46', tmdbId: 372058, title: 'Your Name', originalTitle: '君の名は。', year: 2016, primaryGenre: 'ROMANCE', secondaryGenres: ['ANIMATION'], subgenres: ['SUPERNATURAL'] },
  { id: 'movie-47', tmdbId: 129, title: 'Spirited Away', originalTitle: '千と千尋の神隠し', year: 2001, primaryGenre: 'FANTASY', secondaryGenres: ['ANIMATION'], subgenres: ['MAGICAL_REALISM'] },
  { id: 'movie-48', tmdbId: 13, title: 'Forrest Gump', originalTitle: 'Forrest Gump', year: 1994, primaryGenre: 'DRAMA', secondaryGenres: ['COMEDY'], subgenres: ['HISTORICAL'] },
  { id: 'movie-49', tmdbId: 24428, title: 'The Avengers', originalTitle: 'The Avengers', year: 2012, primaryGenre: 'ACTION', secondaryGenres: ['SCIENCE_FICTION'], subgenres: ['SUPERHERO'] },
  { id: 'movie-50', tmdbId: 299536, title: 'Avengers: Infinity War', originalTitle: 'Avengers: Infinity War', year: 2018, primaryGenre: 'ACTION', secondaryGenres: ['SCIENCE_FICTION'], subgenres: ['SUPERHERO'] },
];

async function main() {
  console.log('🌱 Starting seed...');

  // 기존 영화 삭제 (선택사항 - 개발 환경에서만)
  // await prisma.movie.deleteMany({});

  for (const movieData of movies) {
    const movie = await prisma.movie.upsert({
      where: { id: movieData.id },
      update: {
        title: movieData.title,
        originalTitle: movieData.originalTitle,
        releaseDate: new Date(movieData.year, 0, 1),
        primaryGenre: movieData.primaryGenre,
        secondaryGenres: movieData.secondaryGenres,
        subgenres: movieData.subgenres,
        year: movieData.year,
        tmdbId: movieData.tmdbId,
      },
      create: {
        id: movieData.id,
        title: movieData.title,
        originalTitle: movieData.originalTitle,
        releaseDate: new Date(movieData.year, 0, 1),
        primaryGenre: movieData.primaryGenre,
        secondaryGenres: movieData.secondaryGenres,
        subgenres: movieData.subgenres,
        year: movieData.year,
        tmdbId: movieData.tmdbId,
      },
    });
    console.log(`✅ Seeded: ${movie.title} (${movie.year})`);
  }

  const count = await prisma.movie.count();
  console.log(`\n✨ Seed completed! Total movies: ${count}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

