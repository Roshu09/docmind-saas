import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, RefreshCw, CheckCircle, ArrowRight } from 'lucide-react';
import client from '../api/client';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export default function VerifyEmail() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  // Auto-send OTP on mount
  useEffect(() => {
    sendOTP();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendOTP = async () => {
    try {
      await client.post('/api/auth/send-otp');
      toast.success('OTP sent to ' + user?.email);
    } catch {
      toast.error('Failed to send OTP');
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setResending(true);
    setCanResend(false);
    setCountdown(60);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    await sendOTP();
    setResending(false);
  };

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
    // Auto-submit when all filled
    if (val && i === 5 && next.every(d => d)) {
      handleVerify(next.join(''));
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      const next = paste.split('');
      setOtp(next);
      inputRefs.current[5]?.focus();
      setTimeout(() => handleVerify(paste), 100);
    }
  };

  const handleVerify = async (code) => {
    if (loading) return;
    const otpCode = code || otp.join('');
    if (otpCode.length !== 6) return toast.error('Enter all 6 digits');
    setLoading(true);
    try {
      await client.post('/api/auth/verify-otp', { otp: otpCode });
      setVerified(true);
      if (setUser) setUser({ ...user, emailVerified: true });
      setTimeout(() => navigate('/dashboard'), 2500);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  if (verified) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce">
          <CheckCircle size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold">Email Verified! 🎉</h2>
        <p className="text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-8 pb-6 text-center" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(37,99,235,0.08))' }}>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 8px 24px rgba(124,58,237,0.4)' }}>
              <Shield size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Mail size={14} />
              <span>OTP sent to <strong className="text-foreground">{user?.email}</strong></span>
            </div>
          </div>

          <div className="p-8 pt-6 space-y-6">
            <p className="text-sm text-muted-foreground text-center">
              Enter the 6-digit code we sent to your email. It expires in <strong className="text-violet-500">10 minutes</strong>.
            </p>

            {/* OTP inputs */}
            <div className="flex gap-3 justify-center" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-secondary transition-all outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  style={{ borderColor: digit ? '#7c3aed' : undefined }}
                />
              ))}
            </div>

            {/* Verify button */}
            <button
              onClick={() => handleVerify()}
              disabled={loading || otp.some(d => !d)}
              className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 4px 15px rgba(124,58,237,0.35)' }}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Shield size={16} /> Verify Email <ArrowRight size={16} /></>
              )}
            </button>

            {/* Resend */}
            <div className="text-center">
              {canResend ? (
                <button onClick={handleResend} disabled={resending}
                  className="flex items-center gap-2 text-sm text-violet-500 hover:text-violet-400 font-medium mx-auto transition-colors">
                  <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                  Resend OTP
                </button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Resend OTP in <strong className="text-foreground">{countdown}s</strong>
                </p>
              )}
            </div>

            <div className="text-center">
              <button onClick={() => navigate('/dashboard')}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Skip for now →
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          🔐 Powered by AI Doc Intelligence · <a href="https://docmind.space" className="text-violet-500">docmind.space</a>
        </p>
      </div>
    </div>
  );
}