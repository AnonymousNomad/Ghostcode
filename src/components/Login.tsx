import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';

const validateEmail = (email: string) => {
  if (!email) return "Email is required.";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address.";
  return undefined;
};

const validatePassword = (password: string) => {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters long.";
  return undefined;
};

const Login: React.FC = () => {
  const { login, register, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  useEffect(() => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setFormErrors({
        ...(touched.email && { email: emailError }),
        ...(touched.password && { password: passwordError })
    });
  }, [email, password, touched]);
  
  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({...prev, [field]: true}));
  };

  const canSubmit = !validateEmail(email) && !validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    // Final validation check before submission
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    if(emailError || passwordError) {
        setFormErrors({ email: emailError, password: passwordError });
        setTouched({ email: true, password: true });
        return;
    }

    try {
      if (isLoginView) {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err) {
      setApiError(isLoginView ? 'Invalid credentials.' : 'Email may be taken or invalid.');
    }
  };

  return (
    <div className="text-white">
      <h1 className="text-2xl font-bold text-center mb-1">{isLoginView ? 'Welcome Back' : 'Create Account'}</h1>
      <p className="text-slate-400 text-center mb-6">{isLoginView ? 'Sign in to continue' : 'Get your free ghosts'}</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {apiError && <p className="text-red-400 bg-red-900/50 border border-red-500/50 text-sm p-3 rounded-lg">{apiError}</p>}
        <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input 
                id="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                onBlur={() => handleBlur('email')}
                placeholder="you@example.com" 
                type="email" 
                required 
                className={`w-full bg-slate-700/50 border rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${formErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-cyan-500'}`}
                aria-invalid={!!formErrors.email}
                aria-describedby="email-error"
            />
            {formErrors.email && <p id="email-error" className="text-red-400 text-xs mt-1.5">{formErrors.email}</p>}
        </div>
        <div>
            <label htmlFor="password"className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input 
                id="password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                onBlur={() => handleBlur('password')}
                placeholder="••••••••" 
                type="password" 
                required 
                className={`w-full bg-slate-700/50 border rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${formErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-cyan-500'}`}
                aria-invalid={!!formErrors.password}
                aria-describedby="password-error"
            />
            {formErrors.password && <p id="password-error" className="text-red-400 text-xs mt-1.5">{formErrors.password}</p>}
        </div>
        <button 
            type="submit" 
            disabled={isLoading || !canSubmit}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold p-2.5 rounded-lg transition-colors disabled:bg-cyan-800 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : (isLoginView ? 'Sign In' : 'Create Account')}
        </button>
      </form>
      <button type="button" onClick={() => { setIsLoginView(!isLoginView); setApiError(null); setFormErrors({}); setTouched({}); }} className="text-sm text-cyan-400 hover:text-cyan-300 w-full mt-4">
        {isLoginView ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
      </button>
    </div>
  );
};

export default Login;