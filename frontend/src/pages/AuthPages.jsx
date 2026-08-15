import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import MicroscopicField from '../components/landing/MicroscopicField';

export function Login() {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      // Retrieve redirect target or default to assess
      const redirect = sessionStorage.getItem('mantra_auth_redirect') || '#assess';
      sessionStorage.removeItem('mantra_auth_redirect');
      window.location.hash = redirect;
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await loginWithGoogle();
      const redirect = sessionStorage.getItem('mantra_auth_redirect') || '#assess';
      sessionStorage.removeItem('mantra_auth_redirect');
      window.location.hash = redirect;
    } catch (err) {
      setError(err.message || 'Google authentication failed.');
    }
  };

  return (
    <div className="bg-cream dark:bg-night-dark min-h-screen text-night-blue dark:text-cream font-grotesk flex flex-col justify-center items-center relative overflow-hidden px-6 transition-colors duration-500">
      
      {/* Background Microscopic field */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
        <MicroscopicField mouseReactive={false} density="low" mode="drift" bioForms={true} />
      </div>

      <div className="w-full max-w-md border border-border-light dark:border-border-dark bg-cream/90 dark:bg-night-blue/90 p-8 rounded-sm shadow-sm relative z-10 space-y-6">
        
        <div className="text-center space-y-2">
          <span className="font-sans text-[10px] text-marigold bg-marigold/10 border border-marigold/20 px-2 py-0.5 font-bold tracking-[0.2em] rounded-sm uppercase inline-block">
            MantraAI Login
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-normal tracking-tight text-night-blue dark:text-cream">
            Welcome Back
          </h2>
          <p className="text-xs text-night-blue/50 dark:text-cream/50 leading-relaxed max-w-xs mx-auto">
            Access your private pre-clinical health profile and assessment history.
          </p>
        </div>

        {error && (
          <div className="border border-red-500/20 bg-red-500/[0.03] text-red-500 text-xs px-4 py-3 rounded-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-night-blue/50 dark:text-cream/50 font-bold">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full bg-cream-dark/30 dark:bg-night-dark/50 text-night-blue dark:text-cream px-4 py-3 border border-border-light dark:border-border-dark rounded-sm focus:outline-none focus:ring-1 focus:ring-marigold text-xs font-semibold"
              placeholder="e.g. name@domain.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-night-blue/50 dark:text-cream/50 font-bold">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full bg-cream-dark/30 dark:bg-night-dark/50 text-night-blue dark:text-cream px-4 py-3 border border-border-light dark:border-border-dark rounded-sm focus:outline-none focus:ring-1 focus:ring-marigold text-xs font-semibold"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-marigold hover:bg-marigold-light text-night-blue font-bold text-xs uppercase tracking-wider transition-colors rounded-sm cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-border-light dark:border-border-dark"></div>
          <span className="flex-shrink mx-4 text-[9px] uppercase tracking-wider text-night-blue/40 dark:text-cream/40 font-bold">or</span>
          <div className="flex-grow border-t border-border-light dark:border-border-dark"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full py-3 border border-border-light dark:border-border-dark text-xs uppercase tracking-wider font-semibold text-night-blue dark:text-cream hover:border-marigold transition-all rounded-sm cursor-pointer bg-transparent"
        >
          Continue with Google
        </button>

        <div className="flex justify-between items-center text-[10px] pt-4 font-semibold text-night-blue/60 dark:text-cream/65 border-t border-border-light dark:border-border-dark">
          <a href="#forgot-password" className="hover:text-marigold transition-colors">Forgot password?</a>
          <a href="#signup" className="hover:text-marigold transition-colors">Create account</a>
        </div>

      </div>
    </div>
  );
}

export function Signup() {
  const { registerWithEmail, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all input fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    
    setLoading(true);
    try {
      await registerWithEmail(email, password);
      const redirect = sessionStorage.getItem('mantra_auth_redirect') || '#assess';
      sessionStorage.removeItem('mantra_auth_redirect');
      window.location.hash = redirect;
    } catch (err) {
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await loginWithGoogle();
      const redirect = sessionStorage.getItem('mantra_auth_redirect') || '#assess';
      sessionStorage.removeItem('mantra_auth_redirect');
      window.location.hash = redirect;
    } catch (err) {
      setError(err.message || 'Google registration failed.');
    }
  };

  return (
    <div className="bg-cream dark:bg-night-dark min-h-screen text-night-blue dark:text-cream font-grotesk flex flex-col justify-center items-center relative overflow-hidden px-6 transition-colors duration-500">
      
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
        <MicroscopicField mouseReactive={false} density="low" mode="drift" bioForms={true} />
      </div>

      <div className="w-full max-w-md border border-border-light dark:border-border-dark bg-cream/90 dark:bg-night-blue/90 p-8 rounded-sm shadow-sm relative z-10 space-y-6">
        
        <div className="text-center space-y-2">
          <span className="font-sans text-[10px] text-marigold bg-marigold/10 border border-marigold/20 px-2 py-0.5 font-bold tracking-[0.2em] rounded-sm uppercase inline-block">
            MantraAI Registration
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-normal tracking-tight text-night-blue dark:text-cream">
            Create Account
          </h2>
          <p className="text-xs text-night-blue/50 dark:text-cream/50 leading-relaxed max-w-xs mx-auto">
            Establish a private, pre-clinical profile to persistent assessment records securely.
          </p>
        </div>

        {error && (
          <div className="border border-red-500/20 bg-red-500/[0.03] text-red-500 text-xs px-4 py-3 rounded-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-night-blue/50 dark:text-cream/50 font-bold">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full bg-cream-dark/30 dark:bg-night-dark/50 text-night-blue dark:text-cream px-4 py-3 border border-border-light dark:border-border-dark rounded-sm focus:outline-none focus:ring-1 focus:ring-marigold text-xs font-semibold"
              placeholder="name@domain.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-night-blue/50 dark:text-cream/50 font-bold">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full bg-cream-dark/30 dark:bg-night-dark/50 text-night-blue dark:text-cream px-4 py-3 border border-border-light dark:border-border-dark rounded-sm focus:outline-none focus:ring-1 focus:ring-marigold text-xs font-semibold"
              placeholder="•••••••• (Min 6 chars)"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-night-blue/50 dark:text-cream/50 font-bold">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="w-full bg-cream-dark/30 dark:bg-night-dark/50 text-night-blue dark:text-cream px-4 py-3 border border-border-light dark:border-border-dark rounded-sm focus:outline-none focus:ring-1 focus:ring-marigold text-xs font-semibold"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-marigold hover:bg-marigold-light text-night-blue font-bold text-xs uppercase tracking-wider transition-colors rounded-sm cursor-pointer"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-border-light dark:border-border-dark"></div>
          <span className="flex-shrink mx-4 text-[9px] uppercase tracking-wider text-night-blue/40 dark:text-cream/40 font-bold">or</span>
          <div className="flex-grow border-t border-border-light dark:border-border-dark"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full py-3 border border-border-light dark:border-border-dark text-xs uppercase tracking-wider font-semibold text-night-blue dark:text-cream hover:border-marigold transition-all rounded-sm cursor-pointer bg-transparent"
        >
          Continue with Google
        </button>

        <div className="text-center text-[10px] pt-4 font-semibold border-t border-border-light dark:border-border-dark text-night-blue/60 dark:text-cream/65">
          Already have an account?{' '}
          <a href="#login" className="text-marigold hover:underline">Sign In</a>
        </div>

      </div>
    </div>
  );
}

export function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setMessage('Password reset email sent successfully. Check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to dispatch reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-cream dark:bg-night-dark min-h-screen text-night-blue dark:text-cream font-grotesk flex flex-col justify-center items-center relative overflow-hidden px-6 transition-colors duration-500">
      
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
        <MicroscopicField mouseReactive={false} density="low" mode="drift" bioForms={true} />
      </div>

      <div className="w-full max-w-md border border-border-light dark:border-border-dark bg-cream/90 dark:bg-night-blue/90 p-8 rounded-sm shadow-sm relative z-10 space-y-6">
        
        <div className="text-center space-y-2">
          <span className="font-sans text-[10px] text-marigold bg-marigold/10 border border-marigold/20 px-2 py-0.5 font-bold tracking-[0.2em] rounded-sm uppercase inline-block">
            Reset Password
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-normal tracking-tight text-night-blue dark:text-cream">
            Forgot Password
          </h2>
          <p className="text-xs text-night-blue/50 dark:text-cream/50 leading-relaxed max-w-xs mx-auto">
            Provide your registered email to receive a secure password reset link.
          </p>
        </div>

        {error && (
          <div className="border border-red-500/20 bg-red-500/[0.03] text-red-500 text-xs px-4 py-3 rounded-sm text-center">
            {error}
          </div>
        )}

        {message && (
          <div className="border border-ashoka-green/20 bg-ashoka-green/[0.03] text-ashoka-green dark:text-ashoka-green-light text-xs px-4 py-3 rounded-sm text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-night-blue/50 dark:text-cream/50 font-bold">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full bg-cream-dark/30 dark:bg-night-dark/50 text-night-blue dark:text-cream px-4 py-3 border border-border-light dark:border-border-dark rounded-sm focus:outline-none focus:ring-1 focus:ring-marigold text-xs font-semibold"
              placeholder="name@domain.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-marigold hover:bg-marigold-light text-night-blue font-bold text-xs uppercase tracking-wider transition-colors rounded-sm cursor-pointer"
          >
            {loading ? 'Dispatching Link...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="text-center text-[10px] pt-4 font-semibold border-t border-border-light dark:border-border-dark text-night-blue/60 dark:text-cream/65">
          <a href="#login" className="text-marigold hover:underline">Back to Login</a>
        </div>

      </div>
    </div>
  );
}
