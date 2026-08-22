import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      } else {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: name,
              phone: phone
            }
          }
        });
        if (error) throw error;
        
        // If auto-logged in, manually update phone in profile (since trigger only did full_name)
        if (data.session) {
          await supabase.from('profiles').update({ phone }).eq('id', data.user?.id);
        }
        
        alert('Account created! Check your email for a confirmation link if required.');
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-cream-dark w-full max-w-md rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
        
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-serif font-bold text-maroon-dark">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600 mt-2 text-sm">
              {isLogin 
                ? 'Sign in to access your orders and saved items.' 
                : 'Join Panchganga Traders to track orders and save your favorites.'}
            </p>
          </div>

          <div className="flex bg-white rounded-lg p-1 mb-6 border border-gray-200">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${isLogin ? 'bg-maroon text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${!isLogin ? 'bg-maroon text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full border-gray-200 bg-white border rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-maroon focus:border-maroon outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full border-gray-200 bg-white border rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-maroon focus:border-maroon outline-none transition-all"
                    placeholder="+91 9876543210"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border-gray-200 bg-white border rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-maroon focus:border-maroon outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border-gray-200 bg-white border rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-maroon focus:border-maroon outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full border-gray-200 bg-white border rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-maroon focus:border-maroon outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            )}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-maroon hover:bg-maroon-dark text-white py-3 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <span className="border-b w-1/5 lg:w-1/4 border-gray-300"></span>
            <span className="text-xs text-gray-400 uppercase font-medium">Or continue with</span>
            <span className="border-b w-1/5 lg:w-1/4 border-gray-300"></span>
          </div>

          <button 
            onClick={handleGoogleLogin}
            type="button" 
            className="mt-6 w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 py-3 rounded-lg font-medium transition-colors shadow-sm"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
        </div>
      </div>
    </div>
  );
};
