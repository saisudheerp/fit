import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function NewLanding() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Elite Digital Styles */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .font-geist {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          letter-spacing: -0.02em;
        }

        .glass-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .glass-card:hover {
          background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
          border-color: rgba(16,185,129,0.3);
          transform: translateY(-5px);
        }

        .emerald-glow {
          box-shadow: 0 0 30px rgba(16,185,129,0.15);
        }
      `}</style>

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-emerald-500/20 rounded-full mix-blend-multiply filter blur-[120px] animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-[120px] animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-[120px] animate-pulse animation-delay-4000"></div>
      </div>

      {/* Header / Nav */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/80 backdrop-blur-md border-b border-white/10' : 'bg-transparent'
      }`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tighter font-geist">Next Rep</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#manifesto" className="text-sm text-white/70 hover:text-white transition font-geist">Manifesto</a>
              <a href="#features" className="text-sm text-white/70 hover:text-white transition font-geist">Features</a>
            </div>

            <Link to="/auth" className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all font-geist">
              Sign In
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </Link>
          </div>
        </nav>
      </header>

      <div className="relative">
        {/* Hero */}
        <section className="min-h-screen flex items-center justify-center px-6 pt-20">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70 backdrop-blur mb-8 font-geist animate-on-scroll">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              NOW IN EARLY ACCESS
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 font-geist animate-on-scroll" style={{ animationDelay: '0.1s' }}>
              Train with <br />
              <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">Intelligence</span>
            </h1>

            <p className="text-lg sm:text-xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed font-geist animate-on-scroll" style={{ animationDelay: '0.2s' }}>
              Your workouts tracked. Your performance analyzed. Your potential unlocked. Meet the AI-powered training system that adapts to you.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-on-scroll" style={{ animationDelay: '0.3s' }}>
              <Link to="/auth" className="group relative inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500 px-10 py-5 text-base font-bold text-black hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] hover:-translate-y-1 font-geist">
                <span className="relative">
                  <span className="group-hover:opacity-0 transition-opacity">Start Training</span>
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">Let's Go →</span>
                </span>
              </Link>
              
              <a href="#manifesto" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-10 py-5 text-base font-semibold text-white hover:bg-white/10 transition-all backdrop-blur font-geist">
                Learn More
              </a>
            </div>
          </div>
        </section>

        {/* Trusted By / Stats */}
        <section className="px-6 pb-24 max-w-7xl mx-auto">
          <p className="text-center text-sm font-medium text-white/40 mb-8 font-geist animate-on-scroll">POWERING ATHLETES WORLDWIDE</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-50 animate-on-scroll">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-white font-geist">100+</span>
              <span className="text-xs text-white/60 uppercase tracking-wider mt-1">Exercises</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-white font-geist">AI</span>
              <span className="text-xs text-white/60 uppercase tracking-wider mt-1">Powered Coaching</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-white font-geist">PR</span>
              <span className="text-xs text-white/60 uppercase tracking-wider mt-1">Auto-Detection</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-white font-geist">24/7</span>
              <span className="text-xs text-white/60 uppercase tracking-wider mt-1">Availability</span>
            </div>
          </div>
        </section>

        {/* Manifesto */}
        <section id="manifesto" className="py-32 border-y border-white/5 bg-white/[0.02]">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-xs font-bold tracking-widest text-emerald-500 uppercase mb-6 font-geist animate-on-scroll">The Manifesto</h2>
            <h3 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-12 font-geist animate-on-scroll">
              The Hard Truth: <br />
              Your Workouts Lack Direction.
            </h3>
            
            <div className="relative bg-neutral-900/50 border border-white/10 rounded-2xl p-8 md:p-12 animate-on-scroll">
              <svg className="absolute top-8 left-8 w-8 h-8 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-lg md:text-xl text-white/80 leading-relaxed font-geist md:pl-12 pl-0">
                Most fitness apps are just digital notebooks. They record what you did, but they don't tell you what to do next. You don't need another logbook. You need a system. We don't guess; we analyze your data to engineer your perfect workout. Stop training blind.
              </p>
              <div className="mt-8 flex items-center justify-center gap-4">
                <div className="h-px w-12 bg-white/20"></div>
                <span className="text-sm font-medium text-white/50 font-geist">Next Rep Team</span>
                <div className="h-px w-12 bg-white/20"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Us vs Them */}
        <section className="py-32 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter font-geist">The Next Rep Standard</h2>
            <p className="mt-4 text-white/60 font-geist">Do not compare features. Compare results.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 animate-on-scroll">
            {/* Them */}
            <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col gap-6 opacity-60 grayscale transition hover:opacity-80 hover:grayscale-0">
              <h3 className="text-xl font-medium text-white/50 font-geist">Generic Fitness Apps</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-white/50 font-geist">
                  <span className="text-red-500/50">✕</span> Static PDF Plans
                </li>
                <li className="flex items-center gap-3 text-white/50 font-geist">
                  <span className="text-red-500/50">✕</span> Manual PR Tracking
                </li>
                <li className="flex items-center gap-3 text-white/50 font-geist">
                  <span className="text-red-500/50">✕</span> "One Size Fits All" Advice
                </li>
                <li className="flex items-center gap-3 text-white/50 font-geist">
                  <span className="text-red-500/50">✕</span> Cluttered Interface
                </li>
              </ul>
            </div>

            {/* Us */}
            <div className="relative p-8 rounded-2xl border border-emerald-500/30 bg-emerald-900/10 flex flex-col gap-6 emerald-glow">
              <div className="absolute -top-3 -right-3">
                <span className="relative flex h-6 w-6">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500 items-center justify-center">
                    <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </span>
                </span>
              </div>
              <h3 className="text-xl font-medium text-white font-geist">Next Rep</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-white font-geist">
                  <div className="bg-emerald-500/20 p-1 rounded-full"><svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></div>
                  <span className="font-medium">AI-Powered Personalization</span>
                </li>
                <li className="flex items-center gap-3 text-white font-geist">
                  <div className="bg-emerald-500/20 p-1 rounded-full"><svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></div>
                  <span className="font-medium">Auto-Progressive Overload</span>
                </li>
                <li className="flex items-center gap-3 text-white font-geist">
                  <div className="bg-emerald-500/20 p-1 rounded-full"><svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></div>
                  <span className="font-medium">Real-time Muscle Analytics</span>
                </li>
                <li className="flex items-center gap-3 text-white font-geist">
                  <div className="bg-emerald-500/20 p-1 rounded-full"><svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></div>
                  <span className="font-medium">Focus on Strength & ROI</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Ecosystem */}
        <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="mb-16 animate-on-scroll">
            <p className="text-sm font-medium text-white/50 font-geist mb-2">TOTAL ECOSYSTEM</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter font-geist text-white">Ecosystem of Gains</h2>
            <p className="mt-4 text-white/60 font-geist">The three pillars of your physical transformation.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="glass-card rounded-2xl p-8 animate-on-scroll group">
              <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl w-fit">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              </div>
              <h3 className="text-xl font-medium text-white font-geist mb-3">Smart Logging</h3>
              <p className="text-sm text-white/60 leading-relaxed font-geist">
                Effortlessly capture every rep. Our system adapts to your training style, whether it's bodybuilding, powerlifting, or calisthenics.
              </p>
            </div>

            {/* Card 2 */}
            <div className="glass-card rounded-2xl p-8 animate-on-scroll group" style={{ animationDelay: '0.1s' }}>
              <div className="mb-6 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl w-fit">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
              </div>
              <h3 className="text-xl font-medium text-white font-geist mb-3">AI Intelligence</h3>
              <p className="text-sm text-white/60 leading-relaxed font-geist">
                Meet Sai and Daisy. Two distinct AI coaching personalities that analyze your data to provide personalized advice and motivation.
              </p>
            </div>

            {/* Card 3 */}
            <div className="glass-card rounded-2xl p-8 animate-on-scroll group" style={{ animationDelay: '0.2s' }}>
              <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl w-fit">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              </div>
              <h3 className="text-xl font-medium text-white font-geist mb-3">Visual Analytics</h3>
              <p className="text-sm text-white/60 leading-relaxed font-geist">
                See your progress. Muscle heatmaps and volume charts show you exactly where you're growing and where you're lagging.
              </p>
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="py-32 border-y border-white/5 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20 animate-on-scroll">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter font-geist text-white">From Effort to Excellence</h2>
              <p className="mt-4 text-white/60 font-geist">The path to your new physique.</p>
            </div>

            <div className="relative grid md:grid-cols-3 gap-12">
              <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

              <div className="relative flex flex-col items-center text-center animate-on-scroll">
                <div className="w-16 h-16 rounded-full bg-black border border-white/20 flex items-center justify-center relative z-10 mb-6 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  <span className="text-xl font-bold text-white font-geist">01</span>
                </div>
                <h3 className="text-xl font-medium text-white font-geist mb-2">Log & Track</h3>
                <p className="text-sm text-white/60 font-geist max-w-xs">Input your workouts. Let the system capture the data points that matter.</p>
              </div>

              <div className="relative flex flex-col items-center text-center animate-on-scroll" style={{ animationDelay: '0.1s' }}>
                <div className="w-16 h-16 rounded-full bg-black border border-emerald-500/50 flex items-center justify-center relative z-10 mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <span className="text-xl font-bold text-emerald-400 font-geist">02</span>
                </div>
                <h3 className="text-xl font-medium text-white font-geist mb-2">Analyze & Adapt</h3>
                <p className="text-sm text-white/60 font-geist max-w-xs">AI analyzes your performance, suggesting weight increases and form corrections.</p>
              </div>

              <div className="relative flex flex-col items-center text-center animate-on-scroll" style={{ animationDelay: '0.2s' }}>
                <div className="w-16 h-16 rounded-full bg-black border border-white/20 flex items-center justify-center relative z-10 mb-6 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                  <span className="text-xl font-bold text-white font-geist">03</span>
                </div>
                <h3 className="text-xl font-medium text-white font-geist mb-2">Evolve & Conquer</h3>
                <p className="text-sm text-white/60 font-geist max-w-xs">Hit new PRs. Watch your physique transform as you follow a data-driven path.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 px-6 relative overflow-hidden bg-cover" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80)' }}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
          <div className="max-w-3xl mx-auto relative z-10 text-center animate-on-scroll" style={{ animation: 'fadeSlideIn 1s ease-out 0.1s both' }}>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70 backdrop-blur font-geist">Early Access</span>
            <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-geist tracking-tighter text-white">Start Your Transformation</h2>
            <p className="mt-4 text-lg text-white/70 font-geist">Join athletes who train with intelligence.</p>
            
            <Link to="/auth" className="mt-8 inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500 px-10 py-5 text-base font-semibold text-black hover:bg-emerald-400 transition-all font-geist shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              Create Free Account
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 relative bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-lg font-bold tracking-tighter font-geist">Next Rep</span>
                <p className="mt-2 text-sm text-white/70 font-geist">Built for those who train smart.</p>
              </div>
              <p className="text-xs text-white/50 font-geist">© 2025 Next Rep. All Rights Reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default NewLanding;
