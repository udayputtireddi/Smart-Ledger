import React, { useState } from 'react';
import { User } from '../types';
import { Wallet, ArrowRight, Lock, Mail, User as UserIcon, Loader2, Check } from 'lucide-react';

// ⬇️ NEW: Firebase imports
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

interface LoginPageProps {
  onLogin: (user: User, rememberMe: boolean) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate slight delay for UI animation
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      let firebaseUser;

      if (isLogin) {
        // 🔐 Firebase LOGIN
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        firebaseUser = userCred.user;

      } else {
        // 🆕 Firebase SIGNUP
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = userCred.user;
      }

      // Pass user info to App
      onLogin(
        {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: name || firebaseUser.email!.split('@')[0],
        },
        rememberMe
      );

    } catch (err: any) {
      console.error(err);
      let message = "Authentication failed. Please try again.";

      // Friendly errors
      if (err.code === "auth/email-already-in-use") message = "This email is already registered.";
      if (err.code === "auth/invalid-credential") message = "Invalid email or password.";
      if (err.code === "auth/weak-password") message = "Password must be at least 6 characters.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-900/40" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-indigo-500 p-2 rounded-xl">
              <Wallet size={24} className="text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Smart Ledger</span>
          </div>
          
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Master your money,<br />
            <span className="text-indigo-400">effortlessly.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-md">
            Join thousands of users who track their daily expenses and visualize financial growth with automated categorization.
          </p>
        </div>

        <div className="relative z-10 text-sm text-slate-500">
          © {new Date().getFullYear()} Smart Ledger Inc. All rights reserved. v1.1
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="bg-indigo-600 p-2 rounded-xl inline-block">
                <Wallet size={32} className="text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="mt-2 text-slate-500">
              {isLogin
                ? 'Enter your credentials to access your ledger.'
                : 'Start tracking your finances in seconds.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 group-hover:border-indigo-500'}`}>
                  {rememberMe && <Check size={12} className="text-white" />}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="ml-2 text-sm text-slate-600 select-none">Keep me logged in</span>
              </label>

              {isLogin && (
                <button type="button" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot password?
                </button>
              )}
            </div>

            {error && (
              <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-white font-semibold bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} className="ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-slate-500">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setEmail('');
                  setPassword('');
                }}
                className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                {isLogin ? 'Sign up for free' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
