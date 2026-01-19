import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import api from '../utils/api';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(formData.email, formData.password);
    if (result.success) {
      toast.success('Access Granted');
      navigate('/profile');
    } else {
      toast.error(result.message || 'Authentication failed');
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      return toast.error("Please enter your email address first");
    }
    const loadId = toast.loading("Sending reset link...");
    try {
      await api.post('/auth/forgot-password', { email: formData.email });
      toast.success("Reset link sent!", { id: loadId });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send link", { id: loadId });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 to-black z-0" />
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] z-0 animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] z-0" />

      <div className="w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in-95 duration-500">

        {/* Brand Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-2xl shadow-indigo-500/30 mb-6 rotate-3 hover:rotate-6 transition-transform duration-300">
            <Zap className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">Welcome Back</h1>
          <p className="text-gray-400 text-sm font-medium">Secure access to your dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl ring-1 ring-white/5">

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <a href="http://localhost:5000/api/auth/google" className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl transition-all border border-white/5 hover:border-white/10 font-medium text-sm group">
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </a>
            <a href="http://localhost:5000/api/auth/github" className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl transition-all border border-white/5 hover:border-white/10 font-medium text-sm group">
              <svg className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>

          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute w-full border-t border-white/10"></div>
            <span className="relative px-3 bg-[#0d0d12] text-[10px] uppercase font-bold text-gray-500 tracking-widest">Or continue with email</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-widest font-bold text-gray-500 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <input
                  type="email"
                  className="w-full bg-gray-950/50 text-white pl-11 pr-4 py-4 rounded-xl border border-gray-800 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:bg-gray-900 transition-all outline-none placeholder:text-gray-700 font-medium"
                  placeholder="name@company.com"
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[11px] uppercase tracking-widest font-bold text-gray-500">Password</label>
                <button type="button" onClick={handleForgotPassword} className="text-[11px] uppercase tracking-widest font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot Password?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <input
                  type="password"
                  className="w-full bg-gray-950/50 text-white pl-11 pr-4 py-4 rounded-xl border border-gray-800 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:bg-gray-900 transition-all outline-none placeholder:text-gray-700 font-medium font-mono tracking-widest"
                  placeholder="••••••••"
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-4 rounded-xl font-bold text-sm tracking-wide transition-all transform active:scale-[0.98] shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Connect <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-gray-500 text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-4 text-xs text-gray-600 font-medium uppercase tracking-wider">
          <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure</span>
          <span className="flex items-center gap-1">•</span>
          <span className="flex items-center gap-1">Encrypted</span>
          <span className="flex items-center gap-1">•</span>
          <span className="flex items-center gap-1">Private</span>
        </div>
      </div>
    </div>
  );
};

export default Login;