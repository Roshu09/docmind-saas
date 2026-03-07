// components/RateLimitCountdown.jsx
import { useState, useEffect } from 'react';
import { Clock, RefreshCw } from 'lucide-react';

export default function RateLimitCountdown({ resetAt, onRetry }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!resetAt) return;
    const target = new Date(resetAt).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setTimeLeft(null); onRetry?.(); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ h, m, s, diff });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [resetAt]);

  if (!resetAt) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-center space-y-4">
      <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
        <Clock size={20} />
        <span className="font-bold text-base">Groq Daily Limit Reached</span>
      </div>
      <p className="text-sm text-muted-foreground">Free tier: 100k tokens/day. Resets in:</p>

      {timeLeft ? (
        <div className="flex items-center justify-center gap-3">
          {timeLeft.h > 0 && (
            <div className="bg-card border border-border rounded-xl px-4 py-3 min-w-16 text-center">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{String(timeLeft.h).padStart(2,'0')}</p>
              <p className="text-xs text-muted-foreground mt-1">hours</p>
            </div>
          )}
          <div className="bg-card border border-border rounded-xl px-4 py-3 min-w-16 text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{String(timeLeft.m).padStart(2,'0')}</p>
            <p className="text-xs text-muted-foreground mt-1">mins</p>
          </div>
          <div className="bg-card border border-border rounded-xl px-4 py-3 min-w-16 text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{String(timeLeft.s).padStart(2,'0')}</p>
            <p className="text-xs text-muted-foreground mt-1">secs</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 text-green-500 font-semibold">
          <RefreshCw size={16} className="animate-spin" />
          <span>Limit reset! Retrying...</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        💡 Tip: The limit resets at midnight UTC daily
      </p>
    </div>
  );
}