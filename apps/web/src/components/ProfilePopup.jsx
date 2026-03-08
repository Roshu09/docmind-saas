import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Mail, Shield, Building2, Calendar, FileText, Brain, Users, X, TrendingUp, Edit3 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import client from '../api/client';
import toast from 'react-hot-toast';

const ROLE_COLORS = {
  owner:  { bg: 'bg-violet-500/15', text: 'text-violet-500', border: 'border-violet-500/30', label: 'Owner' },
  admin:  { bg: 'bg-blue-500/15',   text: 'text-blue-500',   border: 'border-blue-500/30',   label: 'Admin' },
  member: { bg: 'bg-emerald-500/15',text: 'text-emerald-500',border: 'border-emerald-500/30',label: 'Member' },
};

const PLAN_COLORS = {
  free:       { bg: 'bg-gray-500/15',   text: 'text-gray-400',   label: 'Free Plan' },
  pro:        { bg: 'bg-violet-500/15', text: 'text-violet-500', label: 'Pro Plan' },
  enterprise: { bg: 'bg-amber-500/15',  text: 'text-amber-500',  label: 'Enterprise' },
};

function Avatar({ name, size = 40 }) {
  const initials = name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const colors = ['#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706'];
  const color = colors[name?.charCodeAt(0) % colors.length] || '#7c3aed';
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `linear-gradient(135deg, ${color}, ${color}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.35, flexShrink: 0, boxShadow: `0 4px 12px ${color}40` }}>
      {initials}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`flex flex-col items-center gap-1 p-3 rounded-xl ${color} border border-border`}>
      <Icon size={16} className="text-muted-foreground" />
      <span className="text-lg font-bold">{value}</span>
      <span className="text-xs text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}

export default function ProfilePopup() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const popupRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Fetch profile when opened
  useEffect(() => {
    if (!open || profile) return;
    setLoading(true);
    client.get('/api/auth/profile')
      .then(r => setProfile(r.data.data))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [open]);

  const handleLogout = async () => {
    try {
      await client.post('/api/auth/logout');
    } catch {}
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const role = ROLE_COLORS[profile?.role] || ROLE_COLORS.member;
  const plan = PLAN_COLORS[profile?.org_plan] || PLAN_COLORS.free;

  return (
    <div className="relative" ref={popupRef}>
      {/* Trigger button */}
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-secondary transition-all border border-transparent hover:border-border"
        title="View profile">
        <Avatar name={user?.fullName || profile?.full_name} size={30} />
        <div className="text-left hidden sm:block">
          <p className="text-sm font-semibold leading-tight truncate max-w-[100px]">{user?.fullName || 'Profile'}</p>
          <p className="text-xs text-muted-foreground capitalize">{user?.role || 'member'}</p>
        </div>
        <svg width="12" height="12" viewBox="0 0 12 12" className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Popup */}
      {open && (
        <div className="absolute left-0 bottom-full mb-2 w-80 bg-card border border-border rounded-2xl shadow-2xl z-[9999] overflow-hidden"
          style={{ animation: 'slideDown 0.2s ease' }}>
          <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }`}</style>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : profile ? (
            <>
              {/* Header */}
              <div className="relative p-5 pb-4" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(37,99,235,0.08))' }}>
                <button onClick={() => setOpen(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors">
                  <X size={16} />
                </button>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={profile.full_name} size={48} />
                  <div className="min-w-0">
                    <p className="font-bold text-base truncate">{profile.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${role.bg} ${role.text} ${role.border}`}>
                        {role.label}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${plan.bg} ${plan.text}`}>
                        {plan.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="px-4 py-3 grid grid-cols-4 gap-2">
                <StatCard icon={FileText} label="My Docs" value={profile.stats.my_docs} color="bg-blue-500/5" />
                <StatCard icon={TrendingUp} label="Total Docs" value={profile.stats.total_docs} color="bg-violet-500/5" />
                <StatCard icon={Brain} label="AI Queries" value={profile.stats.my_queries} color="bg-emerald-500/5" />
                <StatCard icon={Users} label="Team" value={profile.stats.team_size} color="bg-amber-500/5" />
              </div>

              {/* Details */}
              <div className="px-4 py-2 space-y-2.5 border-t border-border">
                <div className="flex items-center gap-3 text-sm">
                  <Building2 size={14} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground text-xs">Organization</span>
                  <span className="ml-auto font-medium text-xs truncate max-w-[130px]">{profile.org_name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={14} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground text-xs">Joined</span>
                  <span className="ml-auto font-medium text-xs">{formatDate(profile.created_at)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield size={14} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground text-xs">Last Login</span>
                  <span className="ml-auto font-medium text-xs">{formatDate(profile.last_login_at)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-3 border-t border-border space-y-1">
                <button onClick={() => { navigate('/analytics'); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors text-sm font-medium text-left">
                  <TrendingUp size={15} className="text-violet-500" />
                  View My Analytics
                </button>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-colors text-sm font-medium text-red-500 text-left">
                  <LogOut size={15} />
                  Logout
                </button>
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-border bg-secondary/30">
                <p className="text-xs text-muted-foreground text-center">
                  AI Doc Intelligence System · <span className="text-violet-500 font-medium">docmind.space</span>
                </p>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}