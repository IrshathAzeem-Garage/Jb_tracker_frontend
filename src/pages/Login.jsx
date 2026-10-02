import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBackendHealth } from '../hooks/useBackendHealth';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isColdStartError, setIsColdStartError] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Lightweight wake-up check for Render Free tier cold start
  const { backendStatus, isChecking, isReady, isUnavailable } = useBackendHealth();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setIsColdStartError(false);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      if (err.status === 401) {
        setError('Invalid credentials. Please verify your email and password.');
      } else if (
        err.isNetworkError ||
        err.code === 'ECONNABORTED' ||
        err.message?.includes('timeout') ||
        [502, 503, 504].includes(err.status)
      ) {
        // Cold start timeout or server spinning up
        setIsColdStartError(true);
        setError('Server is starting up. Please try again in a few seconds.');
      } else {
        setError(err.message || 'Unable to connect to server. Please check your internet connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden pt-safe pb-safe">
      {/* Background geometric accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-slate-800/40 blur-3xl rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <img
          src="/logo.png"
          alt="Just Business Things"
          className="inline-block w-16 h-16 rounded-2xl object-contain bg-black shadow-2xl border border-slate-800 mb-3"
        />
        <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
          Just Business Things
        </h2>
        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          JB Tracker
        </h1>
        <p className="mt-1.5 text-xs text-slate-400 max-w-xs mx-auto">
          Internal business management & financial tracking system
        </p>

        {/* Server Connection Status (Subtle & Non-blocking) */}
        <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] font-medium text-slate-400">
          {isChecking && (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Connecting to server...</span>
            </>
          )}
          {isReady && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-400/90 font-semibold">Connected</span>
            </>
          )}
          {isUnavailable && (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>Server unavailable (you can still try signing in)</span>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 sm:mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-950/80 backdrop-blur-md py-7 px-5 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="truncate">{error}</span>
              </div>
              {isColdStartError && (
                <button
                  type="button"
                  onClick={() => handleLogin()}
                  className="px-2.5 py-1 bg-white text-slate-950 rounded-lg font-bold text-[11px] hover:bg-slate-100 flex items-center gap-1 shrink-0 shadow-sm"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@company.com"
                  className="w-full min-h-[44px] pl-10 pr-3 py-2.5 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full min-h-[44px] pl-10 pr-11 py-2.5 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors touch-target-44"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 min-h-[48px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-slate-950 bg-white hover:bg-slate-100 transition-colors shadow-lg disabled:opacity-60 touch-manipulation"
            >
              {loading ? (
                'Signing In...'
              ) : (
                <>
                  <span>Sign In to JB Tracker</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
