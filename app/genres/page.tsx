'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Movie {
  id: string;
  title: string;
  originalTitle: string | null;
  releaseDate: string | null;
  primaryGenre: string | null;
  secondaryGenres: string[];
  subgenres: string[];
  country: string | null;
  year: number | null;
}

export default function GenresPage() {
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [sort, setSort] = useState<string>('title');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadGenres = useCallback(async () => {
    try {
      const response = await fetch('/api/movies/by-genre?limit=0');
      const data = await response.json();
      if (response.ok) {
        setAvailableGenres(data.availableGenres || []);
      }
    } catch (error) {
      console.error('Failed to load genres:', error);
    }
  }, []);

  const loadMovies = useCallback(async () => {
    if (!selectedGenre) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        genre: selectedGenre,
        sort,
        limit: '20',
      });
      if (selectedYear) {
        params.append('year', selectedYear);
      }

      const response = await fetch(`/api/movies/by-genre?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setMovies(data.movies || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to load movies:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedGenre, selectedYear, sort]);

  useEffect(() => {
    loadGenres();
    
    // URL 파라미터에서 장르 읽기
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const genreParam = params.get('genre');
      if (genreParam) {
        setSelectedGenre(genreParam);
      }
    }
  }, [loadGenres]);

  useEffect(() => {
    if (selectedGenre) {
      loadMovies();
    } else {
      setMovies([]);
      setTotal(0);
    }
  }, [selectedGenre, selectedYear, sort, loadMovies]);

  const genreColors: Record<string, string> = {
    'SCIENCE_FICTION': 'from-blue-400 to-cyan-400',
    'DRAMA': 'from-purple-400 to-pink-400',
    'ACTION': 'from-red-400 to-orange-400',
    'THRILLER': 'from-gray-400 to-slate-400',
    'HORROR': 'from-red-600 to-black',
    'COMEDY': 'from-yellow-400 to-orange-400',
    'CRIME': 'from-gray-600 to-black',
  };

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(to bottom, var(--bg-subtle-gradient-start), var(--bg-subtle-gradient-end))' }}>
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <Link href="/" className="text-yellow-400 hover:text-yellow-300 mb-2 inline-block">
                  ← Back to Search
                </Link>
                <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-400">
                  Browse by Genre
                </h1>
                <p className="text-gray-400 mt-2">
                  Explore movies organized by genre, year, and more
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16 max-w-6xl">
        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-2xl mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Genre Selector */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-yellow-400">
                Genre
              </label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="">Select a genre...</option>
                {availableGenres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-pink-400">
                Year
              </label>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                placeholder="e.g., 1999"
                min="1900"
                max={new Date().getFullYear()}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-purple-400">
                Sort By
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="title">Title (A-Z)</option>
                <option value="year">Year (Newest)</option>
                <option value="createdAt">Recently Added</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {selectedGenre && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {selectedGenre.replace('_', ' ')} Movies
                {total > 0 && (
                  <span className="text-gray-400 text-lg ml-2">({total})</span>
                )}
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🎬</div>
                <p className="text-gray-400">Loading movies...</p>
              </div>
            ) : movies.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {movies.map((movie) => (
                  <div
                    key={movie.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
                  >
                    <h3 className="text-xl font-semibold mb-2">{movie.title}</h3>
                    {movie.originalTitle && movie.originalTitle !== movie.title && (
                      <p className="text-gray-400 text-sm mb-2">{movie.originalTitle}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {movie.primaryGenre && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${
                            genreColors[movie.primaryGenre] || 'from-gray-400 to-gray-600'
                          }`}
                        >
                          {movie.primaryGenre.replace('_', ' ')}
                        </span>
                      )}
                      {movie.year && (
                        <span className="px-3 py-1 bg-white/10 rounded-full text-xs">
                          {movie.year}
                        </span>
                      )}
                      {movie.country && (
                        <span className="px-3 py-1 bg-white/10 rounded-full text-xs">
                          {movie.country}
                        </span>
                      )}
                    </div>
                    {movie.secondaryGenres.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {movie.secondaryGenres.map((genre, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🎬</div>
                <p className="text-gray-400">No movies found for this genre.</p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!selectedGenre && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/10 shadow-2xl text-center">
            <div className="text-6xl mb-6">🎭</div>
            <h2 className="text-2xl font-bold mb-4 text-yellow-400">Select a Genre</h2>
            <p className="text-gray-300 mb-8">
              Choose a genre from the dropdown above to explore movies.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {availableGenres.slice(0, 8).map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm"
                >
                  {genre.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

