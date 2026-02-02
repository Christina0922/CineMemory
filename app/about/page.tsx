/**
 * Gate C: TMDb 컴플라이언스 UI
 * 
 * About/Credits 페이지를 반드시 만들고, 아래 문구를 문자열 그대로 노출한다:
 * "This product uses the TMDB API but is not endorsed or certified by TMDB."
 * 
 * TMDb 어트리뷰션은 About/Credits에 고정한다.
 */

import React from 'react';

export default function AboutPage() {
  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(to bottom, var(--bg-subtle-gradient-start), var(--bg-subtle-gradient-end))' }}>
      {/* 영화관 느낌의 헤더 */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, var(--bg-subtle-gradient-start), var(--bg-primary))' }}></div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* 영화 필름 스트립 */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                {/* 필름 스트립 본체 (차콜 블랙/다크 그레이) */}
                <div 
                  className="relative shadow-2xl"
                  style={{ 
                    width: '320px', 
                    height: '64px',
                    background: 'linear-gradient(to bottom, #1A1A1A 0%, #222222 50%, #1A1A1A 100%)',
                    borderTop: '1px solid rgba(156, 163, 175, 0.2)',
                    borderBottom: '1px solid rgba(156, 163, 175, 0.2)',
                  }}
                >
                  {/* 왼쪽 스프로킷 홀 라인 */}
                  <div className="absolute left-0 top-0 bottom-0 w-3.5 flex flex-col items-center justify-center gap-1.5 py-1">
                    {[...Array(7)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: 'radial-gradient(circle, #9CA3AF 0%, #4B5563 100%)',
                          boxShadow: 'inset 0 0 2px rgba(0, 0, 0, 0.5)',
                        }}
                      ></div>
                    ))}
                  </div>
                  
                  {/* 오른쪽 스프로킷 홀 라인 */}
                  <div className="absolute right-0 top-0 bottom-0 w-3.5 flex flex-col items-center justify-center gap-1.5 py-1">
                    {[...Array(7)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: 'radial-gradient(circle, #9CA3AF 0%, #4B5563 100%)',
                          boxShadow: 'inset 0 0 2px rgba(0, 0, 0, 0.5)',
                        }}
                      ></div>
                    ))}
                  </div>
                  
                  {/* 프레임들 (가로로 연결) */}
                  <div className="absolute inset-y-0 left-3.5 right-3.5 flex">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 relative"
                        style={{
                          animation: `flicker ${2.5 + i * 0.12}s infinite`,
                          animationDelay: `${i * 0.12}s`,
                        }}
                      >
                        {/* 프레임 경계선 (오른쪽) */}
                        {i < 3 && (
                          <div 
                            className="absolute right-0 top-0 bottom-0 w-px"
                            style={{ background: 'linear-gradient(to bottom, transparent, rgba(156, 163, 175, 0.3), transparent)' }}
                          ></div>
                        )}
                        {/* 프레임 내부 이미지 영역 */}
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
                  
                  {/* 필름 광택 효과 */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(to right, transparent, rgba(156, 163, 175, 0.15), transparent)' }}
                  ></div>
                </div>
              </div>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-400">
              CineMemory
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 font-light tracking-wide">
              Where forgotten films find their way home
            </p>
          </div>
        </div>
        
        {/* 영화관 좌석 패턴 배경 */}
        <div className="absolute bottom-0 left-0 right-0 h-32 opacity-10">
          <div className="flex justify-center gap-8">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="w-1 h-full bg-white rounded-t-full"></div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* What is CineMemory? */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-1 w-20 bg-gradient-to-r from-yellow-400 to-transparent"></div>
            <h2 className="text-4xl font-bold text-yellow-400">What is CineMemory?</h2>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-2xl">
            <p className="text-lg leading-relaxed text-gray-200 mb-6">
              You know that feeling. A scene flashes in your mind—a line of dialogue, 
              a moment of silence, a color, an emotion. But the title? It&apos;s gone, 
              lost in the vast archive of your memory.
            </p>
            <p className="text-lg leading-relaxed text-gray-200 mb-6">
              <span className="text-yellow-400 font-semibold">CineMemory</span> is more 
              than a search engine. It&apos;s a bridge between your memories and the films 
              that shaped them. Describe what you remember—a fragment, a feeling, a detail 
              that stuck with you—and we&apos;ll help you find that movie again.
            </p>
            <p className="text-lg leading-relaxed text-gray-200">
              Because every film deserves to be remembered. And every memory deserves to 
              find its way back to the screen.
            </p>
          </div>
        </section>

        {/* Our Mission */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-1 w-20 bg-gradient-to-r from-pink-500 to-transparent"></div>
            <h2 className="text-4xl font-bold text-pink-400">Our Mission</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-4xl mb-4">🎬</div>
              <h3 className="text-xl font-semibold mb-3 text-yellow-400">Preserve Memories</h3>
              <p className="text-gray-300">
                Every search session is a story. We help you reconnect with films that 
                left an impression, no matter how faint the memory.
              </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-3 text-purple-400">Beyond Keywords</h3>
              <p className="text-gray-300">
                We understand that finding a film isn&apos;t about titles or actors. 
                It&apos;s about the moments that stayed with you.
              </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold mb-3 text-pink-400">Global Cinema</h3>
              <p className="text-gray-300">
                From Hollywood blockbusters to hidden gems from every corner of the world. 
                Language is no barrier to memory.
              </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="text-xl font-semibold mb-3 text-yellow-400">Data Integrity</h3>
              <p className="text-gray-300">
                Built with precision and care. Every tag, every decision, every log is 
                meticulously tracked—because quality matters.
              </p>
            </div>
          </div>
        </section>

        {/* Credits & Data Sources - Gate C */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-1 w-20 bg-gradient-to-r from-purple-400 to-transparent"></div>
            <h2 className="text-4xl font-bold text-purple-400">Credits & Data Sources</h2>
          </div>
          
          {/* Gate C: TMDb 어트리뷰션 (문자열 그대로) */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-6">
            <p className="text-sm text-gray-400 mb-4 italic">
              This product uses the TMDB API but is not endorsed or certified by TMDB.
            </p>
            
            {/* TMDb 로고 (승인 로고만, 덜 두드러지게) */}
            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <span className="text-xs text-gray-500">Powered by</span>
              <a
                href="https://www.themoviedb.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-60 hover:opacity-80 transition-opacity"
                aria-label="TMDB"
              >
                <div className="text-xs text-gray-400 font-mono">TMDB</div>
              </a>
            </div>
          </div>

          <p className="text-gray-400 text-sm leading-relaxed">
            Movie data and images are provided by The Movie Database (TMDB). 
            CineMemory is an independent service and is not affiliated with, 
            endorsed by, or certified by TMDB.
          </p>
        </section>

        {/* Privacy & Data */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-1 w-20 bg-gradient-to-r from-blue-400 to-transparent"></div>
            <h2 className="text-4xl font-bold text-blue-400">Privacy & Data</h2>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <p className="text-lg text-gray-200 leading-relaxed mb-4">
              Your memories are personal. We treat them with the respect they deserve.
            </p>
            <p className="text-gray-300 leading-relaxed">
              All search sessions and user data are handled according to our privacy policy. 
              You can request deletion of your data at any time. Every deletion is logged 
              and audited—transparency is not optional, it&apos;s fundamental.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-1 w-20 bg-gradient-to-r from-green-400 to-transparent"></div>
            <h2 className="text-4xl font-bold text-green-400">Join the Journey</h2>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 text-center">
            <p className="text-xl text-gray-200 mb-6">
              Have questions? Found a bug? Want to share your story?
            </p>
            <p className="text-gray-400">
              We&apos;re building something special, and your feedback makes it better. 
              Reach out through our support channels—we&apos;d love to hear from you.
            </p>
          </div>
        </section>

        {/* Footer Quote */}
        <div className="text-center py-12 border-t border-white/10">
          <p className="text-2xl text-gray-400 italic font-light">
            &quot;Every film is a memory waiting to be rediscovered.&quot;
          </p>
        </div>
      </div>
    </div>
  );
}

