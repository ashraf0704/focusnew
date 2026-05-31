import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Sparkles, BookOpen, GraduationCap, Github, Apple, Grid, Loader2, Plus, LogIn, ArrowLeft } from 'lucide-react';

interface WelcomeScreenProps {
  onSignIn: (
    fullName: string,
    email: string,
    dailyGoal: number,
    password: string,
    mode: 'signin' | 'signup' | 'guest'
  ) => Promise<{ok: boolean}>;
}

interface SSOAccount {
  name: string;
  email: string;
  avatarText: string;
  avatarBg: string;
  isCustom?: boolean;
}

export default function WelcomeScreen({ onSignIn }: WelcomeScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(25); // minutes
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  // SSO selection states
  const [activeSSOProvider, setActiveSSOProvider] = useState<'google' | 'apple' | 'github' | 'microsoft' | null>(null);
  const [isSSOLoading, setIsSSOLoading] = useState<string | null>(null); // email being logged in
  const [showAddCustomAccount, setShowAddCustomAccount] = useState(false);
  const [customNameInput, setCustomNameInput] = useState('');
  const [customEmailInput, setCustomEmailInput] = useState('');

  // Personalized on-device simulation accounts
  const [simulatedAccounts, setSimulatedAccounts] = useState<Record<string, SSOAccount[]>>({
    google: [
      { name: 'Ashraf S.', email: 'ashrafsk0704@gmail.com', avatarText: 'AS', avatarBg: 'bg-blue-600' },
      { name: 'Ashraf (Work)', email: 'ashraf.buddystudents@gmail.com', avatarText: 'AW', avatarBg: 'bg-emerald-600' },
      { name: 'Zoe Focus Companion', email: 'zoe.companion@gmail.com', avatarText: 'ZC', avatarBg: 'bg-purple-600' },
    ],
    apple: [
      { name: 'Ashraf S.', email: 'ashrafsk0704@icloud.com', avatarText: '', avatarBg: 'bg-zinc-900' },
      { name: 'Ashraf Pro Studies', email: 'ashraf.studies@apple.com', avatarText: 'AP', avatarBg: 'bg-indigo-600' },
    ],
    github: [
      { name: 'Ashraf S. (Coder)', email: 'ashrafsk0704@github.com', avatarText: 'GH', avatarBg: 'bg-neutral-800' },
      { name: 'ashraf-coder-bot', email: 'ashraf-coder-bot@github.com', avatarText: 'CB', avatarBg: 'bg-slate-600' },
    ],
    microsoft: [
      { name: 'Ashraf S.', email: 'ashrafsk0704@outlook.com', avatarText: 'MS', avatarBg: 'bg-sky-600' },
      { name: 'Ashraf Academic Tenant', email: 'ashraf.s@student.edu.onmicrosoft.com', avatarText: 'AT', avatarBg: 'bg-teal-600' },
    ],
  });

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !fullName)) {
      setErrorMsg('Please fill in all fields correctly.');
      return;
    }
    setErrorMsg('');
    // Derive name from email if not registering (e.g. "john.doe@gmail.com" -> "John")
    const derivedName = email.split('@')[0].split('.')[0].replace(/^\w/, (c) => c.toUpperCase());
    try {
      await onSignIn(isSignUp ? fullName : (fullName || derivedName || 'Student'), email, dailyGoal, password, isSignUp ? 'signup' : 'signin');
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Authentication failed.');
    }
  };

  const handleSelectSSOAccount = (accountName: string, accountEmail: string) => {
    setIsSSOLoading(accountEmail);
    setTimeout(() => {
      setIsSSOLoading(null);
      setActiveSSOProvider(null);
      onSignIn(accountName, accountEmail, dailyGoal, 'focusbuddy-demo-password', 'signup').catch(error => {
        setErrorMsg(error instanceof Error ? error.message : 'Authentication failed.');
      });
    }, 1000);
  };

  const handleGuestSignIn = async () => {
    setIsGuestLoading(true);
    setErrorMsg('');
    try {
      await onSignIn('Guest Student', 'guest@focusbuddy.local', dailyGoal, '', 'guest');
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Guest sign in failed.');
    } finally {
      setIsGuestLoading(false);
    }
  };

  const handleAddNewCustomAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNameInput || !customEmailInput || !activeSSOProvider) return;

    const newAccount: SSOAccount = {
      name: customNameInput,
      email: customEmailInput,
      avatarText: customNameInput.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      avatarBg: 'bg-rose-500',
      isCustom: true
    };

    setSimulatedAccounts(prev => ({
      ...prev,
      [activeSSOProvider]: [newAccount, ...prev[activeSSOProvider]]
    }));

    setCustomNameInput('');
    setCustomEmailInput('');
    setShowAddCustomAccount(false);
  };

  const activeAccounts = activeSSOProvider ? simulatedAccounts[activeSSOProvider] : [];

  const providerThemes = {
    google: {
      title: 'Google Account Chooser',
      desc: 'Sign in with your Google Account',
      headerBg: 'bg-slate-50',
      themeColor: '#4285F4',
      logo: (
        <svg width="22" height="22" viewBox="0 0 18 18" className="shrink-0">
          <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7l2.78 2.16c1.63-1.5 2.57-3.71 2.57-6.23z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.78-2.16c-.77.52-1.75.83-2.92.83-2.25 0-4.14-1.52-4.82-3.57L1.6 13.04C3.08 16 6.13 18 9 18z" />
          <path fill="#FBBC05" d="M4.18 11.08c-.17-.52-.27-1.07-.27-1.64s.1-1.12.27-1.64V5.64H1.47C.9 6.78.58 8.08.58 9.47s.32 2.69.89 3.83l2.71-2.22z" />
          <path fill="#EA4335" d="M9 3.6c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47 1.05 11.43.5 9.17.5c-3.04 0-5.92 2-7.4 4.97l2.71 2.22C5.16 5.12 7.05 3.6 9 3.6z" />
        </svg>
      )
    },
    apple: {
      title: 'Sign in with Apple ID',
      desc: 'Use your Apple ID to sign in',
      headerBg: 'bg-zinc-950',
      themeColor: '#18181b',
      textColor: 'text-white',
      logo: <Apple size={22} className="text-white fill-current shrink-0" />
    },
    github: {
      title: 'Authorize GitHub Integration',
      desc: 'Use active GitHub workspace secrets',
      headerBg: 'bg-slate-900',
      themeColor: '#0f172a',
      textColor: 'text-white',
      logo: <Github size={22} className="text-white shrink-0" />
    },
    microsoft: {
      title: 'Microsoft Live Account Chooser',
      desc: 'Select academic, personal or tenant ID',
      headerBg: 'bg-[#F2F2F2]',
      themeColor: '#0284c7',
      logo: <Grid size={20} className="text-sky-600 fill-current shrink-0" />
    }
  };

  const selectedTheme = activeSSOProvider ? providerThemes[activeSSOProvider] : null;

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-between p-6 select-none relative overflow-hidden">
      {/* Dynamic ambient shapes to fit "Natural Tones" theme without clutter */}
      <div className="absolute top-[-20%] right-[-10%] w-[350px] h-[350px] rounded-full bg-[#CCD5AE]/20 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-15%] w-[400px] h-[400px] rounded-full bg-[#E9EDC9]/30 blur-[100px] pointer-events-none" />

      {/* Header Branding */}
      <div className="flex items-center gap-1.5 z-10">
        <div className="flex items-center justify-center text-brand-primary">
          <Eye size={22} strokeWidth={2.5} className="animate-pulse" id="brand-eye-icon" />
        </div>
        <span className="font-sans font-extrabold text-[20px] tracking-tight text-brand-primary">
          Focus Buddy
        </span>
      </div>

      {/* Main Content Area */}
      <div className="my-auto max-w-[420px] w-full mx-auto py-8 z-10">
        {/* Welcome Block */}
        <div className="flex flex-col items-center text-center combine-header-block mb-10">
          {/* Lavender App Icon Cover */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-20 h-20 rounded-2xl bg-brand-accent flex items-center justify-center shadow-sm mb-6 relative hover:scale-105 transition-transform duration-300"
            id="app-icon-container"
          >
            <div className="absolute w-12 h-12 rounded-xl bg-white/40 border border-white/60 flex items-center justify-center shadow-inner">
              <GraduationCap className="text-brand-primary" size={28} strokeWidth={2} />
            </div>
            <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-brand-vibrant animate-ping" />
            <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-brand-vibrant" />
          </motion.div>

          <h1 className="font-sans font-bold text-[32px] leading-10 tracking-tight text-brand-dark mb-2" id="welcome-title-text">
            {isSignUp ? 'Create Your Account' : 'Welcome Back'}
          </h1>
          <p className="font-sans text-[15px] leading-6 text-brand-muted max-w-[280px]" id="welcome-subtitle-text">
            {isSignUp 
              ? 'Start custom tailored learning schedules today.' 
              : 'Continue your focused learning journey.'}
          </p>
        </div>

        {/* Input Form Module */}
        <motion.form 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          onSubmit={handleAuthSubmit} 
          className="space-y-4"
          id="credentials-form"
        >
          {isSignUp && (
            <div className="relative group">
              <input
                id="sign-up-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-4 py-4 rounded-xl border border-brand-soft-border bg-white/80 backdrop-blur-sm shadow-sm text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all duration-300 group-hover:border-brand-muted/40"
                required
              />
            </div>
          )}

          <div className="relative group">
            <input
              id="sign-in-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full px-4 py-4 rounded-xl border border-brand-soft-border bg-white/80 backdrop-blur-sm shadow-sm text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all duration-300 group-hover:border-brand-muted/40"
              required
            />
          </div>

          <div className="relative group">
            <div className="flex items-center">
              <input
                id="sign-in-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-4 rounded-xl border border-brand-soft-border bg-white/80 backdrop-blur-sm shadow-sm text-sm pr-12 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all duration-300 group-hover:border-brand-muted/40"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 p-1 text-brand-muted hover:text-brand-dark transition-colors focus:outline-none"
                id="password-visibility-toggle"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <p className="text-rose-600 text-xs font-medium pl-1 animate-shake" id="form-error-message">
              {errorMsg}
            </p>
          )}

          {/* Helper Forgotten Anchor */}
          {!isSignUp && (
            <div className="flex justify-end pr-1">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-brand-primary hover:text-brand-vibrant text-sm font-semibold transition-colors focus:outline-none"
                id="forgot-password-link"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Action Call Trigger */}
          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-brand-primary text-white font-semibold text-[15px] shadow-[0_4px_12px_rgba(90,90,64,0.15)] hover:opacity-95 active:scale-[0.98] transition-all duration-300 pointer-events-auto"
            id="auth-submit-button"
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={handleGuestSignIn}
            disabled={isGuestLoading}
            className="w-full py-3.5 rounded-xl border border-brand-soft-border bg-white text-brand-primary font-semibold text-[14px] shadow-sm hover:bg-brand-bg active:scale-[0.98] transition-all duration-300 pointer-events-auto disabled:opacity-60"
            id="guest-signin-button"
          >
            {isGuestLoading ? 'Starting Guest Session...' : 'Continue as Guest'}
          </button>
        </motion.form>

        {/* Brand Alternates Divider */}
        <div className="my-6 z-10 flex items-center justify-between" id="divider-row">
          <div className="w-1/3 border-b border-brand-soft-border h-px"></div>
          <span className="text-[10px] font-bold text-brand-muted/60 tracking-wider font-sans uppercase">
            Or continue with
          </span>
          <div className="w-1/3 border-b border-brand-soft-border h-px"></div>
        </div>

        {/* Dynamic Provider Account Chooser Triggers */}
        <div className="space-y-3 z-10">
          <button
            onClick={() => setActiveSSOProvider('google')}
            className="w-full py-3.5 px-4 rounded-xl border border-brand-soft-border bg-white text-brand-dark hover:bg-brand-bg font-sans font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-all duration-300 pointer-events-auto cursor-pointer"
            id="google-signin-button"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7l2.78 2.16c1.63-1.5 2.57-3.71 2.57-6.23z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.78-2.16c-.77.52-1.75.83-2.92.83-2.25 0-4.14-1.52-4.82-3.57L1.6 13.04C3.08 16 6.13 18 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M4.18 11.08c-.17-.52-.27-1.07-.27-1.64s.1-1.12.27-1.64V5.64H1.47C.9 6.78.58 8.08.58 9.47s.32 2.69.89 3.83l2.71-2.22z"
              />
              <path
                fill="#EA4335"
                d="M9 3.6c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47 1.05 11.43.5 9.17.5c-3.04 0-5.92 2-7.4 4.97l2.71 2.22C5.16 5.12 7.05 3.6 9 3.6z"
              />
            </svg>
            Sign in with Google
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setActiveSSOProvider('apple')}
              className="py-2.5 px-3 rounded-xl border border-brand-soft-border bg-white text-brand-dark hover:bg-brand-bg font-sans font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all duration-300 pointer-events-auto cursor-pointer"
              id="apple-signin-button"
              title="Sign in with Apple"
            >
              <Apple size={14} className="text-black fill-current" />
              Apple
            </button>

            <button
              type="button"
              onClick={() => setActiveSSOProvider('github')}
              className="py-2.5 px-3 rounded-xl border border-brand-soft-border bg-white text-brand-dark hover:bg-[#F3F4F6] font-sans font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all duration-300 pointer-events-auto cursor-pointer"
              id="github-signin-button"
              title="Sign in with GitHub"
            >
              <Github size={14} className="text-black" />
              GitHub
            </button>

            <button
              type="button"
              onClick={() => setActiveSSOProvider('microsoft')}
              className="py-2.5 px-3 rounded-xl border border-brand-soft-border bg-white text-brand-dark hover:bg-brand-bg font-sans font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all duration-300 pointer-events-auto cursor-pointer"
              id="microsoft-signin-button"
              title="Sign in with Microsoft"
            >
              <Grid size={13} className="text-sky-600 fill-current" />
              Microsoft
            </button>
          </div>
        </div>

        {/* Sign In / Sign Up Selector footer inline */}
        <div className="pt-6 text-center text-sm" id="auth-switch-footer">
          <span className="text-brand-muted">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          </span>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-brand-vibrant hover:text-brand-primary font-bold transition-all ml-1 duration-200 focus:outline-none"
            id="auth-mode-toggle"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="text-center font-sans text-[11px] text-brand-muted/70 tracking-tight mt-6 z-10 flex items-center justify-center gap-1.5">
        <span>© 2026 Focus Buddy. Crafted for Cognitive Clarity.</span>
      </div>

      {/* REAL-TIME SIMULATED SSO CHOOSER MODAL (The user's requested options feature) */}
      <AnimatePresence>
        {activeSSOProvider && selectedTheme && (
          <div 
            className="fixed inset-0 bg-[#4A4A3A]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            id="sso-account-chooser-overlay"
            onClick={() => {
              if (!isSSOLoading) {
                setActiveSSOProvider(null);
                setShowAddCustomAccount(false);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-sm rounded-3xl border border-brand-soft-border shadow-2xl overflow-hidden flex flex-col"
              id="sso-chooser-container"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header section themed uniquely for Google/Apple/GitHub/Microsoft */}
              <div className={`p-5 flex items-center gap-3.5 border-b border-slate-100 ${selectedTheme.headerBg}`}>
                <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-xs">
                  {selectedTheme.logo}
                </div>
                <div className="text-left">
                  <h3 className={`text-xs font-extrabold uppercase tracking-widest text-[#4A4A3A] font-sans`}>
                    {selectedTheme.title}
                  </h3>
                  <p className="text-[10px] text-brand-muted mt-0.5">
                    {selectedTheme.desc}
                  </p>
                </div>
              </div>

              {/* Main Content Pane */}
              <div className="p-5 max-h-[350px] overflow-y-auto space-y-2">
                {!showAddCustomAccount ? (
                  <>
                    <p className="text-[11px] font-bold text-slate-500 font-sans uppercase tracking-wider text-left mb-2.5">
                      Accounts Logged In On This Device
                    </p>

                    <div className="space-y-1.5">
                      {activeAccounts.map((account) => {
                        const isLoadingThis = isSSOLoading === account.email;
                        return (
                          <button
                            type="button"
                            key={account.email}
                            disabled={isSSOLoading !== null}
                            onClick={() => handleSelectSSOAccount(account.name, account.email)}
                            className="w-full p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-brand-primary hover:shadow-xs transition-all duration-300 text-left flex items-center justify-between group cursor-pointer disabled:opacity-50"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-xl ${account.avatarBg} text-white font-extrabold text-xs flex items-center justify-center shrink-0`}>
                                {account.avatarText}
                              </div>
                              <div className="min-w-0">
                                <span className="block text-xs font-black text-brand-dark group-hover:text-brand-primary truncate">
                                  {account.name}
                                </span>
                                <span className="block text-[10px] text-brand-muted truncate">
                                  {account.email}
                                </span>
                              </div>
                            </div>

                            {isLoadingThis ? (
                              <Loader2 size={15} className="text-brand-vibrant animate-spin" />
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 shadow-sm" title="Logged in session available on this browser/device" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Add visual secondary option */}
                    <button
                      type="button"
                      onClick={() => setShowAddCustomAccount(true)}
                      className="w-full p-3 rounded-2xl border border-dashed border-slate-200 hover:border-brand-primary hover:bg-brand-bg/20 text-xs font-extrabold text-brand-primary transition flex items-center justify-center gap-2 mt-3 cursor-pointer"
                    >
                      <Plus size={14} />
                      Add / Simulate Custom Device Account
                    </button>
                  </>
                ) : (
                  <form onSubmit={handleAddNewCustomAccount} className="space-y-4 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <button
                        type="button"
                        onClick={() => setShowAddCustomAccount(false)}
                        className="text-[11px] font-bold text-brand-muted hover:text-brand-dark flex items-center gap-1"
                      >
                        <ArrowLeft size={12} />
                        Back to accounts
                      </button>
                      <span className="text-[10px] font-bold text-brand-vibrant uppercase tracking-wider">New Device Mail</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Account Owner Name</label>
                        <input
                          type="text"
                          required
                          value={customNameInput}
                          onChange={(e) => setCustomNameInput(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-brand-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Account Email Residence</label>
                        <input
                          type="email"
                          required
                          value={customEmailInput}
                          onChange={(e) => setCustomEmailInput(e.target.value)}
                          placeholder="e.g. john@device.com"
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-brand-primary outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-brand-primary text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:opacity-95 items-center justify-center flex gap-1.5"
                      >
                        <LogIn size={13} />
                        Sync to Device Mail List
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Secure footer disclaimer info */}
              <div className="border-t border-slate-100 p-4 bg-slate-50 text-[9px] text-[#A3A37C] text-center leading-relaxed">
                By choosing an account, you share simulated OAuth credentials securely with Focus Buddy.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Reset Modal Mock */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lg border border-brand-soft-border"
          >
            <div className="flex items-center gap-2 text-brand-primary mb-4">
              <Sparkles size={20} />
              <h3 className="font-bold text-lg">Reset Password</h3>
            </div>
            <p className="text-sm text-brand-muted mb-4">
              We will send a password reset code to your registered email address. This mimics a live Cognito/OAuth directory environment.
            </p>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-brand-soft-border text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 text-sm text-brand-muted hover:text-brand-dark transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert(`Demo: Password reset instructions dispatched to ${email}`);
                    setShowForgotModal(false);
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-primary text-white hover:opacity-90 transition shadow-sm"
                >
                  Send Link
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
