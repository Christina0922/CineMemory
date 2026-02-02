'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Candidate {
  id: string;
  movie: {
    id: string;
    title: string;
    originalTitle: string | null;
    releaseDate: string | null;
    primaryGenre: string | null;
  };
  rank: number;
  confidenceScore: number;
}

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  order: number;
}

export default function HomePage() {
  const [userSentence, setUserSentence] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [hasLowConfidence, setHasLowConfidence] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmedMovieId, setConfirmedMovieId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userSentence.trim()) return;

    // [DIAGNOSTIC] 입력 텍스트 로그
    console.log('[search] query:', userSentence);

    const url = '/api/search';
    const requestBody = { userSentence, sessionId };
    
    // [DIAGNOSTIC] 요청 URL 및 바디 로그
    console.log('[search] request:', { url, bodyOrParams: requestBody });

    setLoading(true);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      // [DIAGNOSTIC] 응답의 후보 1위 제목과 confidence 로그
      const top1 = data.candidates?.[0];
      console.log('[search] response top1:', top1 ? {
        title: top1.movie?.title,
        confidence: top1.confidenceScore,
        movieId: top1.movie?.id
      } : 'no candidates');
      
      if (response.ok) {
        setSessionId(data.sessionId);
        setCandidates(data.candidates || []);
        setQuestions(data.questions || []);
        setHasLowConfidence(data.hasLowConfidence || false);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (movieId: string) => {
    if (!sessionId) return;

    try {
      const response = await fetch('/api/search/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          feedbackType: 'CONFIRMED',
          confirmedMovieId: movieId,
        }),
      });

      if (response.ok) {
        setConfirmedMovieId(movieId);
        alert('Movie confirmed! Thank you for using CineMemory.');
      }
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  const handleNotFound = async () => {
    if (!sessionId) return;

    try {
      await fetch('/api/search/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          feedbackType: 'NOT_FOUND',
        }),
      });

      alert('Thank you for your feedback. We\'ll keep improving!');
      // Reset
      setCandidates([]);
      setQuestions([]);
      setUserSentence('');
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(to bottom, var(--bg-subtle-gradient-start), var(--bg-subtle-gradient-end))' }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, var(--bg-subtle-gradient-start), var(--bg-primary))' }}></div>
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* 영화 필름 스트립 */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                {/* 필름 스트립 본체 (차콜 블랙/다크 그레이) */}
                <div 
                  className="relative shadow-2xl"
                  style={{ 
                    width: '360px', 
                    height: '72px',
                    background: 'linear-gradient(to bottom, #1A1A1A 0%, #222222 50%, #1A1A1A 100%)',
                    borderTop: '1px solid rgba(156, 163, 175, 0.2)',
                    borderBottom: '1px solid rgba(156, 163, 175, 0.2)',
                  }}
                >
                  {/* 왼쪽 스프로킷 홀 라인 */}
                  <div className="absolute left-0 top-0 bottom-0 w-4 flex flex-col items-center justify-center gap-1.5 py-1">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: 'radial-gradient(circle, #9CA3AF 0%, #4B5563 100%)',
                          boxShadow: 'inset 0 0 2px rgba(0, 0, 0, 0.5)',
                        }}
                      ></div>
                    ))}
                  </div>
                  
                  {/* 오른쪽 스프로킷 홀 라인 */}
                  <div className="absolute right-0 top-0 bottom-0 w-4 flex flex-col items-center justify-center gap-1.5 py-1">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: 'radial-gradient(circle, #9CA3AF 0%, #4B5563 100%)',
                          boxShadow: 'inset 0 0 2px rgba(0, 0, 0, 0.5)',
                        }}
                      ></div>
                    ))}
                  </div>
                  
                  {/* 프레임들 (가로로 연결) */}
                  <div className="absolute inset-y-0 left-4 right-4 flex">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 relative"
                        style={{
                          animation: `flicker ${2.5 + i * 0.12}s infinite`,
                          animationDelay: `${i * 0.12}s`,
                        }}
                      >
                        {/* 프레임 경계선 (오른쪽) */}
                        {i < 4 && (
                          <div 
                            className="absolute right-0 top-0 bottom-0 w-px"
                            style={{ background: 'linear-gradient(to bottom, transparent, rgba(156, 163, 175, 0.3), transparent)' }}
                          ></div>
                        )}
                        {/* 프레임 내부 이미지 영역 (어두운 그라데이션) */}
                        <div 
                          className="absolute inset-0.5 rounded-sm"
                          style={{
                            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(30, 30, 30, 0.3) 50%, rgba(0, 0, 0, 0.4) 100%)',
                            border: '1px solid rgba(156, 163, 175, 0.1)',
                          }}
                        ></div>
                      </div>
                    ))}
                  </div>
                  
                  {/* 필름 광택 효과 (미세한 하이라이트) */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(to right, transparent, rgba(156, 163, 175, 0.15), transparent)' }}
                  ></div>
                </div>
              </div>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--accent-pink), var(--accent-pink-bright))' }}>
              CineMemory
            </h1>
            <p className="text-xl md:text-2xl font-light tracking-wide mb-2" style={{ color: 'var(--text-primary)' }}>
              Find the film you forgot
            </p>
            <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
              A scene. A line. A feeling. Describe what you remember.
            </p>
            
            <nav className="mb-8 flex items-center justify-center gap-6">
              <Link 
                href="/genres" 
                className="px-6 py-2 rounded-full text-sm transition-all border"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'var(--border-card)',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'var(--border-card-subtle)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'var(--border-card)';
                }}
              >
                Browse by Genre
              </Link>
              <Link 
                href="/about" 
                className="text-sm transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-pink)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                About
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Search Interface - Card Surface */}
      <div className="container mx-auto px-4 pb-16 max-w-4xl">
        <div 
          className="backdrop-blur-sm rounded-2xl p-8 shadow-xl"
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-card)',
          }}
        >
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-4">
              <input
                type="text"
                value={userSentence}
                onChange={(e) => setUserSentence(e.target.value)}
                placeholder="Describe what you remember... (e.g., 'A man wakes up in a pod, discovers reality is a simulation')"
                className="flex-1 px-6 py-4 rounded-xl transition-all"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-violet)';
                  e.currentTarget.style.outline = 'none';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(124, 58, 237, 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-card)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                disabled={loading}
              />
              <style jsx>{`
                input::placeholder {
                  color: var(--text-secondary);
                }
              `}</style>
              <button
                type="submit"
                disabled={loading || !userSentence.trim()}
                className="px-8 py-4 font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: loading || !userSentence.trim() 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'linear-gradient(to right, var(--accent-pink), var(--accent-pink-bright))',
                  color: loading || !userSentence.trim() ? 'var(--text-muted)' : '#000',
                }}
                onMouseEnter={(e) => {
                  if (!loading && userSentence.trim()) {
                    e.currentTarget.style.background = 'linear-gradient(to right, var(--accent-pink-bright), var(--accent-violet-bright))';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && userSentence.trim()) {
                    e.currentTarget.style.background = 'linear-gradient(to right, var(--accent-pink), var(--accent-pink-bright))';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {/* Low Confidence Message */}
          {hasLowConfidence && (
            <div 
              className="mb-6 p-6 rounded-xl border"
              style={{
                background: 'rgba(124, 58, 237, 0.08)',
                borderColor: 'var(--accent-violet)',
              }}
            >
              <p className="font-semibold mb-2" style={{ color: 'var(--accent-violet-bright)' }}>Not enough information</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We couldn&apos;t find confident matches. Try adding more details about the movie, 
                or use external search engines.
              </p>
              <button
                onClick={handleNotFound}
                className="mt-4 px-4 py-2 rounded-lg text-sm transition-colors"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-card)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                Submit Additional Info
              </button>
            </div>
          )}

          {/* Candidates */}
          {candidates.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Candidates</h2>
              <div className="grid gap-4">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="rounded-xl p-6 transition-all border"
                    style={{
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderColor: 'var(--border-card)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                      e.currentTarget.style.borderColor = 'var(--border-card-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)';
                      e.currentTarget.style.borderColor = 'var(--border-card)';
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl font-bold" style={{ color: 'var(--accent-pink)' }}>
                            #{candidate.rank}
                          </span>
                          <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{candidate.movie.title}</h3>
                        </div>
                        {candidate.movie.originalTitle && candidate.movie.originalTitle !== candidate.movie.title && (
                          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{candidate.movie.originalTitle}</p>
                        )}
                        {candidate.movie.primaryGenre && (
                          <Link
                            href={`/genres?genre=${encodeURIComponent(candidate.movie.primaryGenre)}`}
                            className="inline-block px-3 py-1 rounded-full text-xs mr-2 transition-colors"
                            style={{
                              background: 'rgba(124, 58, 237, 0.15)',
                              color: 'var(--accent-violet-bright)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(124, 58, 237, 0.25)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(124, 58, 237, 0.15)';
                            }}
                          >
                            {candidate.movie.primaryGenre.replace('_', ' ')}
                          </Link>
                        )}
                        {candidate.movie.releaseDate && (
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {new Date(candidate.movie.releaseDate).getFullYear()}
                          </span>
                        )}
                        <div className="mt-3">
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Confidence: {(candidate.confidenceScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleConfirm(candidate.movie.id)}
                        disabled={confirmedMovieId === candidate.movie.id}
                        className="ml-4 px-6 py-2 font-semibold rounded-lg transition-all disabled:opacity-50"
                        style={{
                          background: confirmedMovieId === candidate.movie.id
                            ? 'rgba(124, 58, 237, 0.2)'
                            : 'linear-gradient(to right, var(--accent-violet), var(--accent-violet-bright))',
                          color: confirmedMovieId === candidate.movie.id ? 'var(--accent-violet-bright)' : '#000',
                        }}
                        onMouseEnter={(e) => {
                          if (confirmedMovieId !== candidate.movie.id) {
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {confirmedMovieId === candidate.movie.id ? 'Confirmed ✓' : 'This is it!'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {candidates.length > 0 && (
                <button
                  onClick={handleNotFound}
                  className="mt-4 text-sm transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-pink)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  None of these match
                </button>
              )}
            </div>
          )}

          {/* Questions */}
          {questions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-pink-400">Questions</h2>
              <div className="space-y-4">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-6"
                  >
                    <p className="text-lg mb-4">{question.questionText}</p>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                        Answer
                      </button>
                      <button className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-sm text-gray-400">
                        I don&apos;t remember
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && candidates.length === 0 && !hasLowConfidence && userSentence && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎬</div>
              <p style={{ color: 'var(--text-secondary)' }}>No results found. Try adding more details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

