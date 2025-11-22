import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Box, UserPlus, Lock, Mail, User, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';

type ViewState = 'LOGIN' | 'SIGNUP' | 'FORGOT_EMAIL' | 'FORGOT_OTP';

export const Login: React.FC = () => {
  const { login, signup, requestOtp, resetPassword } = useAuth();
  const [view, setView] = useState<ViewState>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
        await login(email, password);
    } catch (err: any) {
        setError(err.message);
        setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);
      try {
          await signup(name, email, password);
      } catch (err: any) {
          setError(err.message);
          setIsLoading(false);
      }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);
      try {
          await requestOtp(email);
          setView('FORGOT_OTP');
          setSuccessMsg(`OTP sent to ${email}`);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setIsLoading(false);
      }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);
      try {
          await resetPassword(email, otp, newPassword);
          setSuccessMsg('Password reset successfully! Please login.');
          setView('LOGIN');
          // Clear sensitive fields
          setPassword('');
          setNewPassword('');
          setOtp('');
      } catch (err: any) {
          setError(err.message);
      } finally {
          setIsLoading(false);
      }
  };

  const switchView = (newView: ViewState) => {
      setView(newView);
      setError('');
      setSuccessMsg('');
  };

  const renderForm = () => {
      switch (view) {
          case 'LOGIN':
              return (
                <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input 
                                    type="email" 
                                    required
                                    placeholder="name@company.com"
                                    className="w-full pl-12 pr-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-violet-100 focus:border-violet-500 transition-all font-medium"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Password</label>
                                <button type="button" onClick={() => switchView('FORGOT_EMAIL')} className="text-sm font-bold text-violet-600 hover:underline">Forgot?</button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input 
                                    type="password" 
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-violet-100 focus:border-violet-500 transition-all font-medium"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : (
                            <>
                                Sign In <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                    
                    <div className="pt-4 text-center">
                        <p className="text-slate-500">Don't have an account?</p>
                        <button type="button" onClick={() => switchView('SIGNUP')} className="text-violet-600 font-bold hover:underline mt-1">Create Account</button>
                    </div>
                </form>
              );
          
          case 'SIGNUP':
              return (
                <form onSubmit={handleSignup} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Alex Morgan"
                                    className="w-full pl-12 pr-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-violet-100 focus:border-violet-500 transition-all font-medium"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input 
                                    type="email" 
                                    required
                                    placeholder="name@company.com"
                                    className="w-full pl-12 pr-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-violet-100 focus:border-violet-500 transition-all font-medium"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input 
                                    type="password" 
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-violet-100 focus:border-violet-500 transition-all font-medium"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-violet-600 text-white font-bold py-4 rounded-2xl hover:bg-violet-700 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-violet-200 disabled:opacity-70"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : (
                            <>
                                <UserPlus size={20} /> Create Account
                            </>
                        )}
                    </button>

                    <div className="pt-4 text-center">
                        <p className="text-slate-500">Already have an account?</p>
                        <button type="button" onClick={() => switchView('LOGIN')} className="text-slate-900 font-bold hover:underline mt-1">Back to Sign In</button>
                    </div>
                </form>
              );
          
          case 'FORGOT_EMAIL':
              return (
                <form onSubmit={handleRequestOtp} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                    <button type="button" onClick={() => switchView('LOGIN')} className="text-slate-400 hover:text-slate-900 flex items-center gap-2 text-sm font-bold mb-4 transition-colors">
                        <ArrowLeft size={16} /> Back to Login
                    </button>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-900">Reset Password</h3>
                        <p className="text-slate-500 text-sm">Enter your email to receive a One-Time Password (OTP).</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                                type="email" 
                                required
                                placeholder="name@company.com"
                                className="w-full pl-12 pr-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-violet-100 focus:border-violet-500 transition-all font-medium"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Send OTP Code'}
                    </button>
                </form>
              );

          case 'FORGOT_OTP':
              return (
                <form onSubmit={handleResetPassword} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                     <button type="button" onClick={() => switchView('FORGOT_EMAIL')} className="text-slate-400 hover:text-slate-900 flex items-center gap-2 text-sm font-bold mb-4 transition-colors">
                        <ArrowLeft size={16} /> Change Email
                    </button>
                     <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-900">Verify & Reset</h3>
                        <p className="text-slate-500 text-sm">Enter the code sent to <span className="font-bold text-slate-900">{email}</span></p>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">OTP Code</label>
                            <input 
                                type="text" 
                                required
                                maxLength={4}
                                placeholder="0000"
                                className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-violet-100 focus:border-violet-500 transition-all font-black text-2xl tracking-[0.5em] text-center"
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input 
                                    type="password" 
                                    required
                                    placeholder="New password"
                                    className="w-full pl-12 pr-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-violet-100 focus:border-violet-500 transition-all font-medium"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-70"
                    >
                         {isLoading ? <Loader2 className="animate-spin" /> : (
                            <>
                                <CheckCircle2 size={20} /> Reset Password
                            </>
                        )}
                    </button>
                </form>
              );
      }
  };

  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* Left Hero Section */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden p-16 flex-col justify-between">
        <div className="relative z-10">
            <div className="bg-violet-600 h-12 w-12 rounded-xl flex items-center justify-center mb-8">
                <Box className="text-white" size={28} />
            </div>
            <h1 className="text-6xl font-black text-white tracking-tighter leading-tight mb-6">
                Manage stock <br/>
                <span className="text-violet-400">without limits.</span>
            </h1>
            <p className="text-slate-400 text-xl max-w-md leading-relaxed">
                The next generation Inventory Management System designed for speed, clarity, and modular operations.
            </p>
        </div>

        <div className="relative z-10">
            <div className="flex items-center gap-4">
                <div className="flex -space-x-4">
                    <div className="h-12 w-12 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-white font-bold text-sm z-30">AM</div>
                    <div className="h-12 w-12 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-white font-bold text-sm z-20">JS</div>
                    <div className="h-12 w-12 rounded-full bg-slate-600 border-2 border-slate-900 flex items-center justify-center text-white font-bold text-sm z-10">KD</div>
                </div>
                <div>
                    <p className="text-white font-bold">Trusted by 2,000+ teams</p>
                    <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(i => <div key={i} className="w-4 h-4 text-emerald-500 fill-emerald-500">★</div>)}
                    </div>
                </div>
            </div>
        </div>

        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[80px] -translate-x-1/4 translate-y-1/4"></div>
      </div>

      {/* Right Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
            <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl font-black text-slate-900 mb-2">
                    {view === 'LOGIN' && 'Welcome back'}
                    {view === 'SIGNUP' && 'Join the team'}
                    {(view === 'FORGOT_EMAIL' || view === 'FORGOT_OTP') && 'Account Recovery'}
                </h2>
                <p className="text-slate-500 font-medium">
                    {view === 'LOGIN' && 'Please enter your details to access the dashboard.'}
                    {view === 'SIGNUP' && 'Start your inventory journey in seconds.'}
                    {view === 'FORGOT_EMAIL' && 'We will help you get back into your account.'}
                    {view === 'FORGOT_OTP' && 'Secure your account with a new password.'}
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-bold text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div> {error}
                </div>
            )}

            {successMsg && (
                <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 font-bold text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                    <CheckCircle2 size={18} /> {successMsg}
                </div>
            )}

            {renderForm()}
            
            <p className="mt-8 text-center text-slate-300 text-xs font-bold uppercase tracking-widest">
                Protected by StockMaster Secure
            </p>
        </div>
      </div>
    </div>
  );
};
