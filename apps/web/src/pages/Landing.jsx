import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon: '🔍', title: 'Semantic Search', desc: 'Find anything across your documents using natural language. No keywords needed — just ask.' },
  { icon: '🤖', title: 'Smart Summarizer', desc: 'Get TL;DR, key points, action items, sentiment analysis and difficulty score instantly.' },
  { icon: '❓', title: 'Q&A Generator', desc: 'Auto-generate questions from any document. Filter by difficulty. Export as PDF.' },
  { icon: '💬', title: 'Knowledge Chat', desc: 'Chat with multiple documents at once. AI answers with per-document source attribution.' },
  { icon: '⚖️', title: 'Document Comparison', desc: 'AI-powered side-by-side analysis — similarities, differences and key insights.' },
  { icon: '📊', title: 'Usage Analytics', desc: 'Track feature adoption, daily queries, most used documents and team activity.' },
];

const STEPS = [
  { num: '01', title: 'Upload Documents', desc: 'Upload PDFs, DOCX or TXT files. Stored securely on AWS S3.' },
  { num: '02', title: 'AI Processes & Indexes', desc: 'Our pipeline chunks, embeds and indexes your content using 768-dim vectors.' },
  { num: '03', title: 'Ask, Search & Compare', desc: 'Use any AI feature instantly — search, summarize, chat or compare.' },
];

const STATS = [
  { value: '768', label: 'Vector Dimensions', sub: 'for semantic similarity' },
  { value: '512', label: 'Token Chunk Size', sub: 'with 50 token overlap' },
  { value: '<200ms', label: 'Search Latency', sub: 'pgvector cosine similarity' },
  { value: '100%', label: 'Multi-Tenant', sub: 'org-isolated data' },
];

const TECH = [
  { name: 'PostgreSQL + pgvector', icon: '🐘', desc: 'Vector similarity search' },
  { name: 'Groq LLM', icon: '⚡', desc: 'llama-3.3-70b-versatile' },
  { name: 'AWS S3 + EC2', icon: '☁️', desc: 'Cloud infrastructure' },
  { name: 'Redis + BullMQ', icon: '🔄', desc: 'Async job processing' },
  { name: 'React 18 + Vite', icon: '⚛️', desc: 'Modern frontend' },
  { name: 'Node.js 22', icon: '🟢', desc: 'ESM backend runtime' },
];

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function Section({ children, className = '' }) {
  const [ref, inView] = useInView();
  return (
    <section ref={ref} className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>
      {children}
    </section>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', 'Sora', sans-serif", background: '#020617', color: '#e2e8f0', minHeight: '100vh', overflowX: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #7c3aed40; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #020617; } ::-webkit-scrollbar-thumb { background: #7c3aed; border-radius: 2px; }
        .grad-text { background: linear-gradient(135deg, #a78bfa, #60a5fa, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .glow-btn { position: relative; overflow: hidden; }
        .glow-btn::before { content: ''; position: absolute; inset: -2px; background: linear-gradient(135deg, #7c3aed, #2563eb, #7c3aed); border-radius: inherit; z-index: -1; opacity: 0; transition: opacity 0.3s; }
        .glow-btn:hover::before { opacity: 1; }
        .card-hover { transition: transform 0.3s, box-shadow 0.3s; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px #7c3aed20; }
        .noise { background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E"); }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse-glow { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
        @keyframes grid-move { 0%{transform:translateY(0)} 100%{transform:translateY(60px)} }
        .floating { animation: float 6s ease-in-out infinite; }
        .pulse { animation: pulse-glow 3s ease-in-out infinite; }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 2rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(2,6,23,0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(124,58,237,0.2)' : 'none',
        transition: 'all 0.3s'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🧠</div>
          <span style={{ fontFamily: "'Sora'", fontWeight: 700, fontSize: '1.1rem', color: '#f8fafc', letterSpacing: '-0.02em' }}>DocMind</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="https://github.com/Roshu09/docmind-saas" target="_blank" rel="noreferrer"
            style={{ color: '#94a3b8', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
            ⭐ GitHub
          </a>
          <button onClick={() => navigate('/login')}
            style={{ padding: '8px 18px', background: 'transparent', border: '1px solid rgba(124,58,237,0.5)', color: '#a78bfa', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
            Login
          </button>
          <button onClick={() => navigate('/register')}
            className="glow-btn"
            style={{ padding: '8px 18px', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            Get Started
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 1.5rem', overflow: 'hidden' }}>
        {/* Grid bg */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px)', backgroundSize: '60px 60px', animation: 'grid-move 20s linear infinite' }} />
        {/* Glow orbs */}
        <div className="pulse" style={{ position: 'absolute', top: '20%', left: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%)', filter: 'blur(40px)' }} />
        <div className="pulse" style={{ position: 'absolute', bottom: '20%', right: '15%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.15), transparent 70%)', filter: 'blur(40px)', animationDelay: '1.5s' }} />

        <div style={{ position: 'relative', maxWidth: 780, zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 100, marginBottom: 32, fontSize: '0.8rem', color: '#a78bfa' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', boxShadow: '0 0 8px #34d399' }} />
            Live at docmind.space · Powered by Groq llama-3.3-70b
          </div>

          <h1 className="floating" style={{ fontFamily: "'Sora'", fontSize: 'clamp(2.5rem, 7vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#f8fafc', marginBottom: 24 }}>
            Turn Your Documents<br />
            Into <span className="grad-text">Intelligence</span>
          </h1>

          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: '#94a3b8', lineHeight: 1.7, maxWidth: 580, margin: '0 auto 40px', fontWeight: 300 }}>
            AI-powered document platform with semantic search, smart summarization, Q&A generation, multi-document chat and comparison. Built for serious knowledge work.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')}
              style={{ padding: '14px 32px', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: '1rem', fontWeight: 600, boxShadow: '0 0 30px rgba(124,58,237,0.4)', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 0 50px rgba(124,58,237,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(124,58,237,0.4)'; }}>
              🚀 Get Started Free
            </button>
            <a href="https://github.com/Roshu09/docmind-saas" target="_blank" rel="noreferrer"
              style={{ padding: '14px 32px', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, cursor: 'pointer', fontSize: '1rem', fontWeight: 500, textDecoration: 'none', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
              ⭐ View Source Code
            </a>
          </div>

          <div style={{ marginTop: 48, display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[['AWS EC2', 'Deployed'], ['Let\'s Encrypt', 'SSL/HTTPS'], ['Groq AI', 'Powered'], ['pgvector', 'Vector Search']].map(([label, sub]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{sub}</div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 500 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STATS */}
      <Section>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>SYSTEM CAPABILITIES</p>
            <h2 style={{ fontFamily: "'Sora'", fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>⚡ Built for Performance</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {STATS.map((s, i) => (
              <div key={i} className="card-hover" style={{ padding: '28px 24px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 16, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Sora'", fontSize: '2.2rem', fontWeight: 800, color: '#a78bfa', letterSpacing: '-0.03em', marginBottom: 6 }}>{s.value}</div>
                <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{s.label}</div>
                <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* FEATURES */}
      <Section>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>FEATURES</p>
            <h2 style={{ fontFamily: "'Sora'", fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              Everything You Need to<br /><span className="grad-text">Master Your Documents</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="card-hover" style={{ padding: '28px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #7c3aed, #2563eb)', opacity: 0.6 }} />
                <div style={{ fontSize: '2rem', marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontFamily: "'Sora'", color: '#f1f5f9', fontWeight: 700, fontSize: '1rem', marginBottom: 10, letterSpacing: '-0.01em' }}>{f.title}</h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>HOW IT WORKS</p>
            <h2 style={{ fontFamily: "'Sora'", fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>Up & Running in 3 Steps</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 0, position: 'relative' }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ padding: '32px 28px', textAlign: 'center', position: 'relative' }}>
                {i < STEPS.length - 1 && (
                  <div style={{ position: 'absolute', top: '42px', right: '-20px', width: 40, color: '#7c3aed', fontSize: '1.5rem', zIndex: 1, display: 'none' }}>→</div>
                )}
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(37,99,235,0.2))', border: '2px solid rgba(124,58,237,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontFamily: "'DM Mono'", fontWeight: 700, color: '#a78bfa', fontSize: '0.9rem' }}>
                  {s.num}
                </div>
                <h3 style={{ fontFamily: "'Sora'", color: '#f1f5f9', fontWeight: 700, fontSize: '1.05rem', marginBottom: 10 }}>{s.title}</h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.7 }}>{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div style={{ position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)', color: '#7c3aed', fontSize: '1.2rem' }}>↓</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ARCHITECTURE */}
      <Section>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>ARCHITECTURE</p>
            <h2 style={{ fontFamily: "'Sora'", fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>🏗️ System Design</h2>
          </div>
          <div style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 20, padding: '40px', fontFamily: "'DM Mono'", fontSize: '0.8rem', color: '#94a3b8', lineHeight: 2, overflowX: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'React 18 SPA', color: '#60a5fa', arrow: '↕' },
                { label: 'Nginx Reverse Proxy + SSL', color: '#a78bfa', arrow: '↕' },
                { label: 'Express API · Node.js 22 · PM2', color: '#34d399', arrow: '↕' },
                { label: 'PostgreSQL 16 + pgvector  ·  Redis + BullMQ  ·  AWS S3', color: '#f59e0b', arrow: '↕' },
                { label: 'Worker · Text Extraction → Chunking → Embeddings → Groq LLM', color: '#f472b6', arrow: null },
              ].map((row, i) => (
                <div key={i}>
                  <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${row.color}30`, borderRadius: 10, color: row.color, textAlign: 'center' }}>
                    {row.label}
                  </div>
                  {row.arrow && <div style={{ textAlign: 'center', color: '#475569', fontSize: '1.2rem', lineHeight: 1.5 }}>{row.arrow}</div>}
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <a href="https://github.com/Roshu09/docmind-saas#readme" target="_blank" rel="noreferrer"
                style={{ color: '#7c3aed', fontSize: '0.78rem', textDecoration: 'none' }}>
                📖 View full architecture in README →
              </a>
            </div>
          </div>
        </div>
      </Section>

      {/* TECH STACK */}
      <Section>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>TECH STACK</p>
            <h2 style={{ fontFamily: "'Sora'", fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>⚡ Powered By Serious Engineering</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {TECH.map((t, i) => (
              <div key={i} className="card-hover" style={{ padding: '24px 20px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>{t.icon}</div>
                <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>{t.name}</div>
                <div style={{ color: '#475569', fontSize: '0.75rem' }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '80px 1.5rem 100px', textAlign: 'center' }}>
          <div style={{ padding: '60px 40px', background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(37,99,235,0.1))', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-50%', left: '-20%', width: '60%', height: '200%', background: 'radial-gradient(ellipse, rgba(124,58,237,0.08), transparent 70%)', pointerEvents: 'none' }} />
            <h2 style={{ fontFamily: "'Sora'", fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, color: '#f8fafc', marginBottom: 16, letterSpacing: '-0.02em' }}>
              Start Exploring Your<br /><span className="grad-text">Documents With AI</span>
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: 36, lineHeight: 1.6 }}>
              Free to use. No credit card required. Upload your first document in seconds.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/register')}
                style={{ padding: '14px 32px', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: '1rem', fontWeight: 600, boxShadow: '0 0 30px rgba(124,58,237,0.4)', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                🚀 Get Started Free
              </button>
              <button onClick={() => navigate('/login')}
                style={{ padding: '14px 32px', background: 'transparent', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 12, cursor: 'pointer', fontSize: '1rem', fontWeight: 500, transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                Login
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#7c3aed,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🧠</div>
            <span style={{ fontFamily: "'Sora'", fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>DocMind</span>
          </div>
          <p style={{ color: '#334155', fontSize: '0.8rem' }}>
            Built with ❤️ by <a href="https://github.com/Roshu09" target="_blank" rel="noreferrer" style={{ color: '#7c3aed', textDecoration: 'none', fontWeight: 600 }}>Roshan</a> · MCA Student · AI/Cloud/MERN
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="https://github.com/Roshu09/docmind-saas" target="_blank" rel="noreferrer" style={{ color: '#475569', fontSize: '0.8rem', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
              onMouseLeave={e => e.currentTarget.style.color = '#475569'}>
              GitHub
            </a>
            <a href="https://docmind.space" style={{ color: '#475569', fontSize: '0.8rem', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
              onMouseLeave={e => e.currentTarget.style.color = '#475569'}>
              Live Demo
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}