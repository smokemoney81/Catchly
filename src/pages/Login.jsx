import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const session = supabase.auth.session();
    if (session) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setSuccess('Registration successful! Please log in.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };

  return (
    <div className="bg-gray-950 h-screen flex flex-col justify-center items-center text-white">
      <h1 className="text-5xl bg-gradient-to-r from-cyan-400 to-emerald-400">Catchly</h1>
      {success && <p className="text-green-500">{success}</p>}
      {error && <p className="text-red-500">{error}</p>}
      <button className="bg-white text-black flex items-center space-x-2 py-2 px-4 rounded">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 2.49.92 4.79 2.46 6.6L6 22l1.74-1.06C10.42 22 12 20.25 12 18h-1.5c-1.11 0-2-.89-2-2s.89-2 2-2h1.5c1.55 0 2.97.85 3.67 2.11A7.916 7.916 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 4c2.66 0 4.95 1.4 6.09 3.52h-4.09c-1.11 0-2 .89-2 2s.89 2 2 2h2.5C18.11 15 20 13.11 20 11s-1.9-3-4.5-3h-3z" />
        </svg>
        <span>Mit Google anmelden</span>
      </button>
      <form onSubmit={handleSubmit} className="flex flex-col mt-4">
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-gray-900 text-white mb-2 p-2" required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-gray-900 text-white mb-2 p-2" required />
        <button type="submit" className="bg-gradient-to-r from-cyan-500 to-emerald-500 py-2 rounded">{isRegister ? 'Registrieren' : 'Anmelden'}</button>
        <button type="button" onClick={() => setIsRegister(prev => !prev)} className="text-white mt-2">oder {isRegister ? 'zum Anmelden wechseln' : 'Registrieren'}</button>
      </form>
    </div>
  );
};

export default Login;