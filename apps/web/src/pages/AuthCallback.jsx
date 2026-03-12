import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');

    if (error) {
      toast.error('Google login failed. Please try again.');
      navigate('/login');
      return;
    }

    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const userId = params.get('userId');
    const email = params.get('email');
    const fullName = params.get('fullName');
    const orgId = params.get('orgId');
    const orgName = params.get('orgName');
    const role = params.get('role');

    if (!accessToken || !userId) {
      toast.error('Authentication failed');
      navigate('/login');
      return;
    }

    // Store refresh token
    localStorage.setItem('refreshToken', refreshToken);

    // Set auth state
    setAuth(
      { id: userId, email, fullName, role },
      { id: orgId, name: orgName, role },
      accessToken
    );

    toast.success(`Welcome, ${fullName}! 🎉`);
    navigate('/dashboard');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 8px 24px rgba(124,58,237,0.4)' }}>
          🧠
        </div>
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground font-medium">Signing you in with Google...</p>
      </div>
    </div>
  );
}