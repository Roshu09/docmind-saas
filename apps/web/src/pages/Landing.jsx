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

const NAV_LINKS = ['Features', 'How It Works', 'Architecture', 'Tech Stack'];

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
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      o: Math.random() * 0.4 + 0.1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = dark ? `rgba(167,139,250,${p.o})` : `rgba(124,58,237,${p.o * 0.6})`;
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      // Draw connections
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(q => {
          const dist = Math.hypot(p.x - q.x, p.y - q.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = dark
              ? `rgba(124,58,237,${0.06 * (1 - dist / 120)})`
              : `rgba(124,58,237,${0.04 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
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
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id.toLowerCase().replace(/ /g, '-'))?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenu(false);
  };

  // Theme tokens
  const t = dark ? {
    bg: '#020617', surface: 'rgba(15,23,42,0.9)', surfaceHover: 'rgba(30,41,59,0.9)',
    border: 'rgba(124,58,237,0.2)', borderLight: 'rgba(255,255,255,0.07)',
    text: '#e2e8f0', textMuted: '#94a3b8', textFaint: '#475569',
    navBg: 'rgba(2,6,23,0.92)', accent: '#a78bfa', accentDim: 'rgba(124,58,237,0.1)',
    cardBg: 'rgba(15,23,42,0.85)', statBg: 'rgba(124,58,237,0.07)',
  } : {
    bg: '#f8fafc', surface: 'rgba(255,255,255,0.95)', surfaceHover: '#f1f5f9',
    border: 'rgba(124,58,237,0.15)', borderLight: 'rgba(0,0,0,0.06)',
    text: '#0f172a', textMuted: '#475569', textFaint: '#94a3b8',
    navBg: 'rgba(248,250,252,0.95)', accent: '#7c3aed', accentDim: 'rgba(124,58,237,0.07)',
    cardBg: 'rgba(255,255,255,0.9)', statBg: 'rgba(124,58,237,0.05)',
  };

  const gradText = { background: 'linear-gradient(135deg, #7c3aed, #2563eb, #0891b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: t.bg, color: t.text, minHeight: '100vh', overflowX: 'hidden', transition: 'background 0.4s, color 0.4s' }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Favicon injector */}
      {useEffect(() => {
        const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
        link.type = 'image/svg+xml'; link.rel = 'icon';
        link.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%237c3aed'/><stop offset='100%25' stop-color='%232563eb'/></linearGradient></defs><rect width='100' height='100' rx='22' fill='url(%23g)'/><text y='0.9em' font-size='60' text-anchor='middle' x='50'>🧠</text></svg>`;
        document.head.appendChild(link);
        document.title = 'AI Doc Intelligence System';
      }, []) && null}

      <style>{`
        * { box-sizing: border-box; }
        ::selection { background: rgba(124,58,237,0.25); }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: ${t.bg}; } ::-webkit-scrollbar-thumb { background: #7c3aed55; border-radius: 2px; }
        .grad-text { background: linear-gradient(135deg, #7c3aed, #2563eb, #0891b2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .card-hover { transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s; }
        .card-hover:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(124,58,237,0.12); border-color: rgba(124,58,237,0.35) !important; }
        .btn-primary { transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s; }
        .btn-primary:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 8px 30px rgba(124,58,237,0.45) !important; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes badge-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,0.4)} 50%{box-shadow:0 0 0 6px rgba(52,211,153,0)} }
        .floating { animation: float 7s ease-in-out infinite; }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: '0 2rem', height: '62px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? t.navBg : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? `1px solid ${t.border}` : 'none',
        transition: 'all 0.35s',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 4px 12px rgba(124,58,237,0.35)' }}>🧠</div>
          <div>
            <div style={{ fontFamily: "'Sora'", fontWeight: 800, fontSize: '0.95rem', color: t.text, letterSpacing: '-0.02em', lineHeight: 1.1 }}>AI Doc Intelligence</div>
            <div style={{ fontSize: '0.6rem', color: t.accent, fontWeight: 600, letterSpacing: '0.05em' }}>SYSTEM</div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {NAV_LINKS.map(link => (
            <button key={link} onClick={() => scrollTo(link)}
              style={{ padding: '6px 14px', background: 'transparent', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: '0.83rem', fontWeight: 500, borderRadius: 8, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = t.accent; e.currentTarget.style.background = t.accentDim; }}
              onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.background = 'transparent'; }}>
              {link}
            </button>
          ))}

          {/* Theme toggle */}
          <button onClick={() => setDark(!dark)}
            style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${t.border}`, background: t.accentDim, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 8, transition: 'all 0.2s' }}
            title="Toggle theme">
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
      </nav>

      {/* HERO */}
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 1.5rem 60px', overflow: 'hidden' }}>
        <ParticleCanvas dark={dark} />

        {/* Grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${dark ? 'rgba(124,58,237,0.04)' : 'rgba(124,58,237,0.035)'} 1px, transparent 1px), linear-gradient(90deg, ${dark ? 'rgba(124,58,237,0.04)' : 'rgba(124,58,237,0.035)'} 1px, transparent 1px)`, backgroundSize: '56px 56px', zIndex: 0 }} />

        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '15%', left: '10%', width: 320, height: 320, borderRadius: '50%', background: dark ? 'radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)' : 'radial-gradient(circle, rgba(124,58,237,0.07), transparent 70%)', filter: 'blur(50px)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: 280, height: 280, borderRadius: '50%', background: dark ? 'radial-gradient(circle, rgba(37,99,235,0.12), transparent 70%)' : 'radial-gradient(circle, rgba(37,99,235,0.07), transparent 70%)', filter: 'blur(50px)', zIndex: 0 }} />

        <div style={{ position: 'relative', maxWidth: 820, zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 18px', background: t.accentDim, border: `1px solid ${t.border}`, borderRadius: 100, marginBottom: 36, fontSize: '0.78rem', color: t.accent, animation: 'badge-pulse 2.5s infinite' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', display: 'inline-block', boxShadow: '0 0 8px #34d399' }} />
            Live at docmind.space · Powered by Groq llama-3.3-70b
          </div>

          <h1 className="floating" style={{ fontFamily: "'Sora'", fontSize: 'clamp(2.8rem, 7vw, 5rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.035em', color: t.text, marginBottom: 28 }}>
            Turn Your Documents<br />
            Into <span className="grad-text">Intelligence</span>
          </h1>

          <p style={{ fontSize: 'clamp(1rem, 2.2vw, 1.15rem)', color: t.textMuted, lineHeight: 1.75, maxWidth: 600, margin: '0 auto 44px', fontWeight: 400 }}>
            AI-powered document intelligence platform with semantic search, summarization, Q&A, multi-document chat and comparison.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')} className="btn-primary"
              style={{ padding: '14px 34px', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: '1rem', fontWeight: 700, boxShadow: '0 0 28px rgba(124,58,237,0.4)' }}>
              🚀 Get Started Free
            </button>
            <a href="https://github.com/Roshu09/docmind-saas" target="_blank" rel="noreferrer"
              style={{ padding: '14px 34px', background: t.surface, color: t.text, border: `1px solid ${t.borderLight}`, borderRadius: 12, fontSize: '1rem', fontWeight: 500, textDecoration: 'none', transition: 'background 0.2s, border-color 0.2s', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.border; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = t.borderLight; }}>
              ⭐ View Source Code
            </a>
          </div>

          <div style={{ marginTop: 56, display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[['AWS EC2', 'DEPLOYED ON'], ["Let's Encrypt", 'SSL/HTTPS'], ['Groq AI', 'POWERED BY'], ['pgvector', 'VECTOR SEARCH']].map(([label, sub]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.62rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 3 }}>{sub}</div>
                <div style={{ fontSize: '0.88rem', color: t.textMuted, fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STATS */}
      <Section id="stats">
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: '0.7rem', color: t.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>SYSTEM CAPABILITIES</p>
            <h2 style={{ fontFamily: "'Sora'", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: t.text, letterSpacing: '-0.025em' }}>⚡ Built for Performance</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
            {STATS.map((s, i) => (
              <div key={i} className="card-hover" style={{ padding: '30px 24px', background: t.statBg, border: `1px solid ${t.border}`, borderRadius: 18, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Sora'", fontSize: '2.4rem', fontWeight: 800, ...gradText, marginBottom: 8 }}>{s.value}</div>
                <div style={{ color: t.text, fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{s.label}</div>
                <div style={{ color: t.textFaint, fontSize: '0.77rem' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* FEATURES */}
      <Section id="features">
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: '0.7rem', color: t.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>FEATURES</p>
            <h2 style={{ fontFamily: "'Sora'", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: t.text, letterSpacing: '-0.025em' }}>
              Everything to <span className="grad-text">Master Your Documents</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="card-hover" style={{ padding: '30px', background: t.cardBg, border: `1px solid ${t.borderLight}`, borderRadius: 18, position: 'relative', overflow: 'hidden', backdropFilter: 'blur(8px)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #7c3aed, #2563eb, #0891b2)', opacity: 0.7 }} />
                <div style={{ fontSize: '2.2rem', marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontFamily: "'Sora'", color: t.text, fontWeight: 700, fontSize: '1.02rem', marginBottom: 10 }}>{f.title}</h3>
                <p style={{ color: t.textMuted, fontSize: '0.875rem', lineHeight: 1.75 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section id="how-it-works">
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '80px 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: '0.7rem', color: t.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>HOW IT WORKS</p>
            <h2 style={{ fontFamily: "'Sora'", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: t.text, letterSpacing: '-0.025em' }}>Up & Running in 3 Steps</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, position: 'relative' }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ padding: '36px 28px', textAlign: 'center', background: t.cardBg, border: `1px solid ${t.borderLight}`, borderRadius: 18, position: 'relative' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: `linear-gradient(135deg, rgba(124,58,237,0.15), rgba(37,99,235,0.15))`, border: `2px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '1.8rem' }}>
                  {s.icon}
                </div>
                <div style={{ fontFamily: "'DM Mono'", fontSize: '0.7rem', color: t.accent, fontWeight: 700, marginBottom: 8, letterSpacing: '0.1em' }}>STEP {s.num}</div>
                <h3 style={{ fontFamily: "'Sora'", color: t.text, fontWeight: 700, fontSize: '1.05rem', marginBottom: 10 }}>{s.title}</h3>
                <p style={{ color: t.textMuted, fontSize: '0.875rem', lineHeight: 1.75 }}>{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div style={{ position: 'absolute', right: -18, top: '45%', color: t.accent, fontSize: '1.4rem', zIndex: 2, display: 'block' }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ARCHITECTURE */}
      <Section id="architecture">
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontSize: '0.7rem', color: t.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>ARCHITECTURE</p>
            <h2 style={{ fontFamily: "'Sora'", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: t.text, letterSpacing: '-0.025em' }}>🏗️ System Design</h2>
          </div>
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 22, padding: '40px 36px', backdropFilter: 'blur(8px)' }}>
            {[
              { label: 'React 18 SPA · Vite · Tailwind CSS · Zustand', color: '#60a5fa' },
              { label: 'Nginx Reverse Proxy · SSL/TLS · Custom Domain', color: '#a78bfa' },
              { label: 'Express API · Node.js 22 ESM · PM2 Cluster · JWT Auth', color: '#34d399' },
              { label: 'PostgreSQL 16 + pgvector  ·  Redis + BullMQ  ·  AWS S3', color: '#f59e0b' },
              { label: 'Worker · Text Extraction → Smart Chunking → 768-dim Embeddings → Groq LLM', color: '#f472b6' },
            ].map((row, i, arr) => (
              <div key={i}>
                <div style={{ padding: '14px 22px', background: dark ? 'rgba(255,255,255,0.03)' : `${row.color}0d`, border: `1px solid ${row.color}30`, borderRadius: 12, color: row.color, textAlign: 'center', fontFamily: "'DM Mono'", fontSize: '0.78rem', fontWeight: 500 }}>
                  {row.label}
                </div>
                {i < arr.length - 1 && <div style={{ textAlign: 'center', color: t.textFaint, fontSize: '1.1rem', lineHeight: 1.8 }}>↕</div>}
              </div>
            ))}
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <a href="https://github.com/Roshu09/docmind-saas#readme" target="_blank" rel="noreferrer"
                style={{ color: t.accent, fontSize: '0.8rem', textDecoration: 'none', fontWeight: 500 }}>
                📖 View full architecture in README →
              </a>
            </div>
          </div>
        </div>
      </Section>

      {/* TECH STACK */}
      <Section id="tech-stack">
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: '0.7rem', color: t.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>TECH STACK</p>
            <h2 style={{ fontFamily: "'Sora'", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, color: t.text, letterSpacing: '-0.025em' }}>⚡ Powered By Serious Engineering</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {TECH.map((tc, i) => (
              <div key={i} className="card-hover" style={{ padding: '26px 20px', background: t.cardBg, border: `1px solid ${t.borderLight}`, borderRadius: 16, textAlign: 'center', backdropFilter: 'blur(8px)' }}>
                <div style={{ fontSize: '2.2rem', marginBottom: 12 }}>{tc.icon}</div>
                <div style={{ color: t.text, fontWeight: 700, fontSize: '0.875rem', marginBottom: 5 }}>{tc.name}</div>
                <div style={{ color: t.textFaint, fontSize: '0.75rem' }}>{tc.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 1.5rem 100px', textAlign: 'center' }}>
          <div style={{ padding: '64px 44px', background: dark ? 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(37,99,235,0.1))' : 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(37,99,235,0.06))', border: `1px solid ${t.border}`, borderRadius: 26, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-40%', left: '-10%', width: '50%', height: '180%', background: 'radial-gradient(ellipse, rgba(124,58,237,0.07), transparent 70%)', pointerEvents: 'none' }} />
            <h2 style={{ fontFamily: "'Sora'", fontSize: 'clamp(1.6rem, 4vw, 2.3rem)', fontWeight: 800, color: t.text, marginBottom: 16, letterSpacing: '-0.025em' }}>
              Start Exploring Your<br /><span className="grad-text">Documents With AI</span>
            </h2>
            <p style={{ color: t.textMuted, fontSize: '1rem', marginBottom: 40, lineHeight: 1.7 }}>
              Free to use. No credit card required.<br />Upload your first document in seconds.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/register')} className="btn-primary"
                style={{ padding: '14px 34px', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', border: 'none', borderRadius: 13, cursor: 'pointer', fontSize: '1rem', fontWeight: 700, boxShadow: '0 0 28px rgba(124,58,237,0.4)' }}>
                🚀 Get Started Free
              </button>
              <button onClick={() => navigate('/login')}
                style={{ padding: '14px 34px', background: 'transparent', color: t.accent, border: `1px solid ${t.border}`, borderRadius: 13, cursor: 'pointer', fontSize: '1rem', fontWeight: 600, transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = t.accentDim}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                Login →
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${t.borderLight}`, padding: '40px 2rem 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 28 }}>
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
          <div style={{ borderTop: `1px solid ${t.borderLight}`, paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ color: t.textFaint, fontSize: '0.78rem' }}>
              Built with ❤️ by{' '}
              <a href="https://www.linkedin.com/in/roshan-gupta-340887227/" target="_blank" rel="noreferrer"
                style={{ color: t.accent, textDecoration: 'none', fontWeight: 700 }}>Roshan</a>
              {' '}· MCA Student · MERN · Cloud · AI/ML
            </p>
            <p style={{ color: t.textFaint, fontSize: '0.78rem' }}>
              Stack: React · Node.js · PostgreSQL · pgvector · Groq · AWS · Redis
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}