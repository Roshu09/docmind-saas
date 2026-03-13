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
  { num: '01', icon: '📁', title: 'Upload Documents', desc: 'Upload PDFs, DOCX or TXT files. Stored securely on AWS S3 with org-level isolation.' },
  { num: '02', icon: '⚙️', title: 'AI Processes & Indexes', desc: 'Pipeline chunks, embeds and indexes your content using 768-dim pgvector embeddings.' },
  { num: '03', icon: '🧠', title: 'Ask, Search & Compare', desc: 'Use any AI feature instantly — semantic search, summarize, chat or compare docs.' },
];

const STATS = [
  { value: '768', label: 'Vector Dimensions', sub: 'semantic similarity' },
  { value: '512', label: 'Token Chunk Size', sub: '50 token overlap' },
  { value: '<200ms', label: 'Search Latency', sub: 'cosine similarity' },
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

const NAV_LINKS = ['Features', 'API Keys', 'How It Works', 'Architecture', 'Tech Stack'];

function ParticleCanvas({ dark }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5, dx: (Math.random() - 0.5) * 0.3, dy: (Math.random() - 0.5) * 0.3,
      o: Math.random() * 0.4 + 0.1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = dark ? `rgba(167,139,250,${p.o})` : `rgba(124,58,237,${p.o * 0.6})`; ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(q => {
          const dist = Math.hypot(p.x - q.x, p.y - q.y);
          if (dist < 120) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = dark ? `rgba(124,58,237,${0.06 * (1 - dist / 120)})` : `rgba(124,58,237,${0.04 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, [dark]);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }} />;
}

function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function Section({ id, children, style = {} }) {
  const [ref, inView] = useInView();
  return (
    <section id={id} ref={ref} style={{ transition: 'all 0.7s ease', opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(32px)', ...style }}>
      {children}
    </section>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMobileMenu(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id.toLowerCase().replace(/ /g, '-'));
    if (el) { const y = el.getBoundingClientRect().top + window.scrollY - 70; window.scrollTo({ top: y, behavior: 'smooth' }); }
    setMobileMenu(false);
  };

  const t = dark ? {
    bg: '#020617', surface: 'rgba(15,23,42,0.9)', surfaceHover: 'rgba(30,41,59,0.9)',
    border: 'rgba(124,58,237,0.2)', borderLight: 'rgba(255,255,255,0.07)',
    text: '#e2e8f0', textMuted: '#94a3b8', textFaint: '#475569',
    navBg: 'rgba(2,6,23,0.96)', accent: '#a78bfa', accentDim: 'rgba(124,58,237,0.1)',
    cardBg: 'rgba(15,23,42,0.85)', statBg: 'rgba(124,58,237,0.07)', drawerBg: 'rgba(4,10,30,0.98)',
  } : {
    bg: '#f8fafc', surface: 'rgba(255,255,255,0.95)', surfaceHover: '#f1f5f9',
    border: 'rgba(124,58,237,0.15)', borderLight: 'rgba(0,0,0,0.06)',
    text: '#0f172a', textMuted: '#475569', textFaint: '#94a3b8',
    navBg: 'rgba(248,250,252,0.97)', accent: '#7c3aed', accentDim: 'rgba(124,58,237,0.07)',
    cardBg: 'rgba(255,255,255,0.9)', statBg: 'rgba(124,58,237,0.05)', drawerBg: 'rgba(248,250,252,0.99)',
  };

  const gradText = { background: 'linear-gradient(135deg, #7c3aed, #2563eb, #0891b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: t.bg, color: t.text, minHeight: '100vh', overflowX: 'hidden', transition: 'background 0.4s, color 0.4s' }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {useEffect(() => {
        const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
        link.type = 'image/svg+xml'; link.rel = 'icon';
        link.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%237c3aed'/><stop offset='100%25' stop-color='%232563eb'/></linearGradient></defs><rect width='100' height='100' rx='22' fill='url(%23g)'/><text y='0.9em' font-size='60' text-anchor='middle' x='50'>🧠</text></svg>`;
        document.head.appendChild(link);
        document.title = 'AI Doc Intelligence System';
      }, []) && null}

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(124,58,237,0.25); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${t.bg}; }
        ::-webkit-scrollbar-thumb { background: #7c3aed55; border-radius: 2px; }
        .grad-text { background: linear-gradient(135deg, #7c3aed, #2563eb, #0891b2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .card-hover { transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s; }
        .card-hover:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(124,58,237,0.12); border-color: rgba(124,58,237,0.35) !important; }
        .btn-primary { transition: transform 0.2s, box-shadow 0.2s; }
        .btn-primary:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 8px 30px rgba(124,58,237,0.45) !important; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes badge-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,0.4)} 50%{box-shadow:0 0 0 6px rgba(52,211,153,0)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        .floating { animation: float 7s ease-in-out infinite; }
        .desktop-nav { display: flex; }
        .mobile-controls { display: none; }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-controls { display: flex !important; }
          .hero-cta-row { flex-direction: column !important; }
          .hero-cta-row button, .hero-cta-row a { width: 100% !important; justify-content: center; box-sizing: border-box; }
          .hero-stats { gap: 18px !important; }
        }
        @media (max-width: 480px) {
          .arch-label { font-size: 0.7rem !important; padding: 10px 12px !important; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: '0 1.2rem', height: '62px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? t.navBg : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? `1px solid ${t.border}` : 'none',
        transition: 'all 0.35s',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 4px 12px rgba(124,58,237,0.35)', flexShrink: 0 }}>🧠</div>
          <div>
            <div style={{ fontFamily: "'Sora'", fontWeight: 800, fontSize: '0.95rem', color: t.text, letterSpacing: '-0.02em', lineHeight: 1.1 }}>AI Doc Intelligence</div>
            <div style={{ fontSize: '0.6rem', color: t.accent, fontWeight: 600, letterSpacing: '0.05em' }}>SYSTEM</div>
          </div>
        </div>

        {/* Desktop nav */}
        <div className="desktop-nav" style={{ gap: 4, alignItems: 'center' }}>
          {NAV_LINKS.map(link => (
            <button key={link} onClick={() => scrollTo(link)}
              style={{ padding: '6px 14px', background: 'transparent', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: '0.83rem', fontWeight: 500, borderRadius: 8, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = t.accent; e.currentTarget.style.background = t.accentDim; }}
              onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.background = 'transparent'; }}>
              {link}
            </button>
          ))}
          <button onClick={() => setDark(!dark)}
            style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${t.border}`, background: t.accentDim, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 6 }}>
            {dark ? '☀️' : '🌙'}
          </button>
          <a href="https://github.com/Roshu09/docmind-saas" target="_blank" rel="noreferrer"
            style={{ padding: '6px 14px', color: t.textMuted, fontSize: '0.83rem', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = t.accent}
            onMouseLeave={e => e.currentTarget.style.color = t.textMuted}>
            ⭐ GitHub
          </a>
          <button onClick={() => navigate('/login')}
            style={{ padding: '7px 16px', background: 'transparent', border: `1px solid ${t.border}`, color: t.accent, borderRadius: 9, cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = t.accentDim; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
            Login
          </button>
          <button onClick={() => navigate('/register')} className="btn-primary"
            style={{ padding: '7px 18px', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: '0.83rem', fontWeight: 700, boxShadow: '0 4px 15px rgba(124,58,237,0.35)' }}>
            Get Started
          </button>
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="mobile-controls" style={{ alignItems: 'center', gap: 8 }}>
          <button onClick={() => setDark(!dark)}
            style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${t.border}`, background: t.accentDim, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {dark ? '☀️' : '🌙'}
          </button>
          <button onClick={() => setMobileMenu(m => !m)} aria-label="Toggle menu"
            style={{ width: 38, height: 38, borderRadius: 9, border: `1px solid ${t.border}`, background: t.accentDim, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 8 }}>
            <span style={{ display: 'block', width: 18, height: 2, background: t.text, borderRadius: 2, transition: 'all 0.3s', transform: mobileMenu ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
            <span style={{ display: 'block', width: 18, height: 2, background: t.text, borderRadius: 2, transition: 'opacity 0.3s', opacity: mobileMenu ? 0 : 1 }} />
            <span style={{ display: 'block', width: 18, height: 2, background: t.text, borderRadius: 2, transition: 'all 0.3s', transform: mobileMenu ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenu && (
        <div style={{
          position: 'fixed', top: 62, left: 0, right: 0, zIndex: 999,
          background: t.drawerBg, backdropFilter: 'blur(24px)',
          borderBottom: `1px solid ${t.border}`,
          padding: '1rem 1.2rem 1.5rem',
          display: 'flex', flexDirection: 'column', gap: 10,
          animation: 'slideDown 0.2s ease',
        }}>
          {NAV_LINKS.map(link => (
            <button key={link} onClick={() => scrollTo(link)}
              style={{ padding: '13px 16px', background: t.accentDim, border: `1px solid ${t.border}`, color: t.text, cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500, borderRadius: 12, textAlign: 'left' }}>
              {link}
            </button>
          ))}
          <a href="https://github.com/Roshu09/docmind-saas" target="_blank" rel="noreferrer"
            onClick={() => setMobileMenu(false)}
            style={{ padding: '13px 16px', background: t.accentDim, border: `1px solid ${t.border}`, color: t.textMuted, fontSize: '0.95rem', fontWeight: 500, borderRadius: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            ⭐ GitHub
          </a>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={() => { navigate('/login'); setMobileMenu(false); }}
              style={{ flex: 1, padding: '13px', background: 'transparent', border: `2px solid ${t.accent}`, color: t.accent, borderRadius: 12, cursor: 'pointer', fontSize: '1rem', fontWeight: 700 }}>
              Login
            </button>
            <button onClick={() => { navigate('/register'); setMobileMenu(false); }}
              style={{ flex: 1, padding: '13px', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', border: 'none', color: '#fff', borderRadius: 12, cursor: 'pointer', fontSize: '1rem', fontWeight: 700, boxShadow: '0 4px 15px rgba(124,58,237,0.4)' }}>
              Get Started 🚀
            </button>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '100px 1.2rem 60px', overflow: 'hidden' }}>
        <ParticleCanvas dark={dark} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${dark ? 'rgba(124,58,237,0.04)' : 'rgba(124,58,237,0.035)'} 1px, transparent 1px), linear-gradient(90deg, ${dark ? 'rgba(124,58,237,0.04)' : 'rgba(124,58,237,0.035)'} 1px, transparent 1px)`, backgroundSize: '56px 56px', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '15%', left: '10%', width: 320, height: 320, borderRadius: '50%', background: dark ? 'radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)' : 'radial-gradient(circle, rgba(124,58,237,0.07), transparent 70%)', filter: 'blur(50px)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: 280, height: 280, borderRadius: '50%', background: dark ? 'radial-gradient(circle, rgba(37,99,235,0.12), transparent 70%)' : 'radial-gradient(circle, rgba(37,99,235,0.07), transparent 70%)', filter: 'blur(50px)', zIndex: 0 }} />

        <div style={{ position: 'relative', maxWidth: 820, zIndex: 1, width: '100%' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: t.accentDim, border: `1px solid ${t.border}`, borderRadius: 100, marginBottom: 32, fontSize: 'clamp(0.68rem, 2vw, 0.78rem)', color: t.accent, animation: 'badge-pulse 2.5s infinite', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', display: 'inline-block', boxShadow: '0 0 8px #34d399', flexShrink: 0 }} />
            Live at docmind.space · Powered by Groq llama-3.3-70b
          </div>

          <h1 className="floating" style={{ fontFamily: "'Sora'", fontSize: 'clamp(1.9rem, 6vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.035em', color: t.text, marginBottom: 24 }}>
            Turn Your Documents<br />
            Into <span className="grad-text">Intelligence</span>
          </h1>

          <p style={{ fontSize: 'clamp(0.92rem, 2.5vw, 1.12rem)', color: t.textMuted, lineHeight: 1.75, maxWidth: 600, margin: '0 auto 36px', fontWeight: 400 }}>
            AI-powered document intelligence platform with semantic search, summarization, Q&A, multi-document chat and comparison.
          </p>

          <div className="hero-cta-row" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} className="btn-primary"
              style={{ padding: '13px 30px', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: '1rem', fontWeight: 700, boxShadow: '0 0 28px rgba(124,58,237,0.4)' }}>
              🚀 Get Started Free
            </button>
            <a href="https://github.com/Roshu09/docmind-saas" target="_blank" rel="noreferrer"
              style={{ padding: '13px 30px', background: t.surface, color: t.text, border: `1px solid ${t.borderLight}`, borderRadius: 12, fontSize: '1rem', fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              ⭐ View Source Code
            </a>
          </div>

          <div className="hero-stats" style={{ marginTop: 48, display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[['AWS EC2', 'DEPLOYED ON'], ["Let's Encrypt", 'SSL/HTTPS'], ['Groq AI', 'POWERED BY'], ['pgvector', 'VECTOR SEARCH']].map(([label, sub]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.6rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 3 }}>{sub}</div>
                <div style={{ fontSize: '0.85rem', color: t.textMuted, fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <Section id="stats">
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 1.2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: '0.7rem', color: t.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>SYSTEM CAPABILITIES</p>
            <h2 style={{ fontFamily: "'Sora'", fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', fontWeight: 800, color: t.text, letterSpacing: '-0.025em' }}>⚡ Built for Performance</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            {STATS.map((s, i) => (
              <div key={i} className="card-hover" style={{ padding: '26px 18px', background: t.statBg, border: `1px solid ${t.border}`, borderRadius: 18, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Sora'", fontSize: '2.1rem', fontWeight: 800, ...gradText, marginBottom: 8 }}>{s.value}</div>
                <div style={{ color: t.text, fontWeight: 700, fontSize: '0.85rem', marginBottom: 4 }}>{s.label}</div>
                <div style={{ color: t.textFaint, fontSize: '0.73rem' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── FEATURES ── */}
      <Section id="api-keys">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 800, color: t.text, marginBottom: 16 }}>
            🔑 Developer API Keys
          </h2>
          <p style={{ color: t.textMuted, fontSize: '1.05rem', maxWidth: 560, margin: '0 auto 36px' }}>
            Generate scoped API keys to integrate DocMind into your own apps. Set expiry, control permissions, track usage.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', maxWidth: 800, margin: '0 auto' }}>
            {[
              { icon: '🎯', title: 'Scoped Access', desc: 'Limit keys to search, summarize, Q&A, chat or compare' },
              { icon: '⏱️', title: 'Expiry Control', desc: 'Set keys to expire in 30, 90, 365 days or never' },
              { icon: '📊', title: 'Usage Tracking', desc: 'Monitor request counts and last used timestamp per key' },
              { icon: '🔒', title: 'SHA-256 Hashed', desc: 'Keys stored as hashes — shown only once at creation' },
            ].map((item, i) => (
              <div key={i} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: '20px 24px', width: 175, textAlign: 'left' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontWeight: 700, color: t.text, fontSize: '0.95rem', marginBottom: 6 }}>{item.title}</div>
                <div style={{ color: t.textMuted, fontSize: '0.82rem', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 28, background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: '14px 22px', display: 'inline-block', fontFamily: 'monospace', fontSize: '0.85rem', color: t.textMuted, textAlign: 'left' }}>
            <span style={{ color: '#a78bfa' }}>curl</span> -H <span style={{ color: '#34d399' }}>"X-API-Key: aifi_live_xxxxxxxxxxxx"</span> https://docmind.space/api/search
          </div>
        </div>
      </Section>
      <Section id="features">
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 1.2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: '0.7rem', color: t.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>FEATURES</p>
            <h2 style={{ fontFamily: "'Sora'", fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', fontWeight: 800, color: t.text, letterSpacing: '-0.025em' }}>
              Everything to <span className="grad-text">Master Your Documents</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="card-hover" style={{ padding: '28px', background: t.cardBg, border: `1px solid ${t.borderLight}`, borderRadius: 18, position: 'relative', overflow: 'hidden', backdropFilter: 'blur(8px)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #7c3aed, #2563eb, #0891b2)', opacity: 0.7 }} />
                <div style={{ fontSize: '2.2rem', marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontFamily: "'Sora'", color: t.text, fontWeight: 700, fontSize: '1rem', marginBottom: 10 }}>{f.title}</h3>
                <p style={{ color: t.textMuted, fontSize: '0.875rem', lineHeight: 1.75 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── HOW IT WORKS ── */}
      <Section id="how-it-works">
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '80px 1.2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: '0.7rem', color: t.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>HOW IT WORKS</p>
            <h2 style={{ fontFamily: "'Sora'", fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', fontWeight: 800, color: t.text, letterSpacing: '-0.025em' }}>Up & Running in 3 Steps</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ padding: '32px 22px', textAlign: 'center', background: t.cardBg, border: `1px solid ${t.borderLight}`, borderRadius: 18, position: 'relative' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg, rgba(124,58,237,0.15), rgba(37,99,235,0.15))`, border: `2px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: '1.6rem' }}>
                  {s.icon}
                </div>
                <div style={{ fontFamily: "'DM Mono'", fontSize: '0.7rem', color: t.accent, fontWeight: 700, marginBottom: 8, letterSpacing: '0.1em' }}>STEP {s.num}</div>
                <h3 style={{ fontFamily: "'Sora'", color: t.text, fontWeight: 700, fontSize: '1rem', marginBottom: 10 }}>{s.title}</h3>
                <p style={{ color: t.textMuted, fontSize: '0.875rem', lineHeight: 1.75 }}>{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div style={{ position: 'absolute', right: -14, top: '44%', color: t.accent, fontSize: '1.4rem', zIndex: 2 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── ARCHITECTURE ── */}
      <Section id="architecture">
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 1.2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontSize: '0.7rem', color: t.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>ARCHITECTURE</p>
            <h2 style={{ fontFamily: "'Sora'", fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', fontWeight: 800, color: t.text, letterSpacing: '-0.025em' }}>🏗️ System Design</h2>
          </div>
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 22, padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,36px)', backdropFilter: 'blur(8px)' }}>
            {[
              { label: 'React 18 SPA · Vite · Tailwind CSS · Zustand', color: '#60a5fa' },
              { label: 'Nginx Reverse Proxy · SSL/TLS · Custom Domain', color: '#a78bfa' },
              { label: 'Express API · Node.js 22 ESM · PM2 Cluster · JWT Auth', color: '#34d399' },
              { label: 'PostgreSQL 16 + pgvector  ·  Redis + BullMQ  ·  AWS S3', color: '#f59e0b' },
              { label: 'Worker · Chunking → 768-dim Embeddings → Groq LLM', color: '#f472b6' },
            ].map((row, i, arr) => (
              <div key={i}>
                <div className="arch-label" style={{ padding: 'clamp(10px,2vw,14px) clamp(12px,3vw,22px)', background: dark ? 'rgba(255,255,255,0.03)' : `${row.color}0d`, border: `1px solid ${row.color}30`, borderRadius: 12, color: row.color, textAlign: 'center', fontFamily: "'DM Mono'", fontSize: 'clamp(0.66rem,1.8vw,0.78rem)', fontWeight: 500, wordBreak: 'break-word' }}>
                  {row.label}
                </div>
                {i < arr.length - 1 && <div style={{ textAlign: 'center', color: t.textFaint, fontSize: '1.1rem', lineHeight: 1.8 }}>↕</div>}
              </div>
            ))}
            <div style={{ textAlign: 'center', marginTop: 22 }}>
              <a href="https://github.com/Roshu09/docmind-saas#readme" target="_blank" rel="noreferrer"
                style={{ color: t.accent, fontSize: '0.8rem', textDecoration: 'none', fontWeight: 500 }}>
                📖 View full architecture in README →
              </a>
            </div>
          </div>
        </div>
      </Section>

      {/* ── TECH STACK ── */}
      <Section id="tech-stack">
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 1.2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: '0.7rem', color: t.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>TECH STACK</p>
            <h2 style={{ fontFamily: "'Sora'", fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', fontWeight: 800, color: t.text, letterSpacing: '-0.025em' }}>⚡ Powered By Serious Engineering</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
            {TECH.map((tc, i) => (
              <div key={i} className="card-hover" style={{ padding: '22px 14px', background: t.cardBg, border: `1px solid ${t.borderLight}`, borderRadius: 16, textAlign: 'center', backdropFilter: 'blur(8px)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>{tc.icon}</div>
                <div style={{ color: t.text, fontWeight: 700, fontSize: '0.82rem', marginBottom: 4 }}>{tc.name}</div>
                <div style={{ color: t.textFaint, fontSize: '0.72rem' }}>{tc.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── CTA ── */}
      <Section>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 1.2rem 100px', textAlign: 'center' }}>
          <div style={{ padding: 'clamp(32px,6vw,64px) clamp(18px,5vw,44px)', background: dark ? 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(37,99,235,0.1))' : 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(37,99,235,0.06))', border: `1px solid ${t.border}`, borderRadius: 26, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-40%', left: '-10%', width: '50%', height: '180%', background: 'radial-gradient(ellipse, rgba(124,58,237,0.07), transparent 70%)', pointerEvents: 'none' }} />
            <h2 style={{ fontFamily: "'Sora'", fontSize: 'clamp(1.4rem, 4vw, 2.3rem)', fontWeight: 800, color: t.text, marginBottom: 16, letterSpacing: '-0.025em' }}>
              Start Exploring Your<br /><span className="grad-text">Documents With AI</span>
            </h2>
            <p style={{ color: t.textMuted, fontSize: 'clamp(0.88rem,2vw,1rem)', marginBottom: 36, lineHeight: 1.7 }}>
              Free to use. No credit card required.<br />Upload your first document in seconds.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/register')} className="btn-primary"
                style={{ padding: '13px 30px', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', border: 'none', borderRadius: 13, cursor: 'pointer', fontSize: '1rem', fontWeight: 700, boxShadow: '0 0 28px rgba(124,58,237,0.4)' }}>
                🚀 Get Started Free
              </button>
              <button onClick={() => navigate('/login')}
                style={{ padding: '13px 30px', background: 'transparent', color: t.accent, border: `1px solid ${t.border}`, borderRadius: 13, cursor: 'pointer', fontSize: '1rem', fontWeight: 600, transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = t.accentDim}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                Login →
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${t.borderLight}`, padding: '36px 1.2rem 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🧠</div>
              <div>
                <div style={{ fontFamily: "'Sora'", fontWeight: 800, color: t.text, fontSize: '0.9rem', letterSpacing: '-0.02em' }}>AI Doc Intelligence System</div>
                <div style={{ fontSize: '0.65rem', color: t.textFaint }}>Production AI SaaS · docmind.space</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              {[
                { href: 'https://github.com/Roshu09/docmind-saas', label: '⭐ GitHub' },
                { href: 'https://www.linkedin.com/in/roshan-gupta-340887227/', label: '💼 LinkedIn' },
                { href: 'https://docmind.space', label: '🌐 Live Demo' },
              ].map(link => (
                <a key={link.label} href={link.href} target="_blank" rel="noreferrer"
                  style={{ color: t.textFaint, fontSize: '0.82rem', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = t.accent}
                  onMouseLeave={e => e.currentTarget.style.color = t.textFaint}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${t.borderLight}`, paddingTop: 18, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <p style={{ color: t.textFaint, fontSize: '0.78rem' }}>
              Built with ❤️ by{' '}
              <a href="https://www.linkedin.com/in/roshan-gupta-340887227/" target="_blank" rel="noreferrer"
                style={{ color: t.accent, textDecoration: 'none', fontWeight: 700 }}>Roshan</a>
              {' '}· MCA Student · MERN · Cloud · AI/ML
            </p>
            <p style={{ color: t.textFaint, fontSize: '0.78rem' }}>
              React · Node.js · PostgreSQL · pgvector · Groq · AWS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}