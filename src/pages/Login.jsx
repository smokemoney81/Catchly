import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Fish, Mail, Lock, Eye, EyeOff, Loader2, User } from 'lucide-react';

export default function Login() {
  const { login, loginWithGoogle, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        navigate('/Dashboard');
      } else {
        await register(email, password, fullName);
        setSuccess('Registrierung erfolgreich! Bitte E-Mail bestätigen.');
        setMode('login');
      }
    } catch (err) {
      setError(err.message ?? 'Fehler aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message ?? 'Google-Login fehlgeschlagen');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 mb-4">
            <Fish className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 text-transparent bg-clip-text">
            Catchly
          </h1>
          <p className="text-gray-400 text-sm mt-1">Dein intelligentes Fangbuch</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          {/* Tab */}
          <div className="flex rounded-xl overflow-hidden border border-gray-700">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'login' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Anmelden
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'register' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Registrieren
            </button>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3 text-green-400 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Vollständiger Name"
                  required
                  className="w-full bg-gray-800 border border-gray-700 text-white pl-10 pr-4 py-3 rounded-xl placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="E-Mail"
                required
                className="w-full bg-gray-800 border border-gray-700 text-white pl-10 pr-4 py-3 rounded-xl placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Passwort"
                required
                minLength={6}
                className="w-full bg-gray-800 border border-gray-700 text-white pl-10 pr-12 py-3 rounded-xl placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800" />
            </div>
            <div className="relative text-center">
              <span className="bg-gray-900 px-3 text-xs text-gray-500">oder</span>
            </div>
          </div>

          <button
            onClick={handleGoogle}
            className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Mit Google anmelden
          </button>

          <button
            onClick={() => navigate('/Dashboard')}
            className="w-full text-gray-500 hover:text-gray-300 text-sm py-2 transition-colors"
          >
            Als Gast fortfahren
          </button>
        </div>
      </div>
    </div>
  );
}
