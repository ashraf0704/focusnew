import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import WelcomeScreen from './components/WelcomeScreen';
import Dashboard from './components/Dashboard';
import FocusTimer from './components/FocusTimer';
import FocusMode from './components/FocusMode';
import Flashcards from './components/Flashcards';
import Insights from './components/Insights';
import AIDoubtSolver from './components/AIDoubtSolver';
import VaultHub from './components/VaultHub';
import Settings from './components/Settings';
import SubjectOnboardingModal from './components/SubjectOnboardingModal';

import { Subject, Task, FlashcardDeck, Badge, UserProfile, StudySessionLog, Priority } from './types';
import { INITIAL_SUBJECTS, INITIAL_TASKS, INITIAL_DECKS, INITIAL_BADGES } from './data';
import { api, clearJwt, getJwt, setJwt } from './api';
import { 
  LayoutGrid, Clock, BookOpen, Award, 
  LogOut, Flame, Sparkles, BookMarked,
  Eye, ShieldCheck, FolderOpen, Settings as SettingsIcon
} from 'lucide-react';

export default function App() {
  // Global Profile auth gate
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Layout routing views
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timer' | 'decks' | 'insights' | 'vault' | 'settings'>('dashboard');

  const [presetAIFile, setPresetAIFile] = useState<{ content: string; name: string } | null>(null);

  // Core Data models state
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [decks, setDecks] = useState<FlashcardDeck[]>(INITIAL_DECKS);
  const [badges, setBadges] = useState<Badge[]>(INITIAL_BADGES);
  const [sessionLogs, setSessionLogs] = useState<StudySessionLog[]>([]);
  const [isBooting, setIsBooting] = useState(true);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const installPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // Subject onboarding modal: shown for new users or on demand
  const [showSubjectOnboarding, setShowSubjectOnboarding] = useState(false);

  // Selection defaults
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(INITIAL_SUBJECTS[0].id);

  // Immersive Active Timer Overlay state
  const [activeSession, setActiveSession] = useState<{
    totalSeconds: number;
    sound: string;
    subjectId: string;
    mode: 'pomodoro' | 'short_break' | 'long_break' | 'custom';
  } | null>(null);

  const hydrateApp = async (showOnboardingIfNew = false) => {
    const payload = await api.boot();
    setProfile(payload.profile);
    const loadedSubjects = payload.subjects.length ? payload.subjects : INITIAL_SUBJECTS;
    setSubjects(loadedSubjects);
    setTasks(payload.tasks);
    setDecks(payload.decks);
    setBadges(payload.badges.length ? payload.badges : INITIAL_BADGES);
    setSessionLogs(payload.sessionLogs);
    setSelectedSubjectId(loadedSubjects[0]?.id || INITIAL_SUBJECTS[0].id);
    setActiveTab('dashboard');
    // Show onboarding modal for genuinely new accounts (no subjects yet)
    if (showOnboardingIfNew && payload.subjects.length === 0) {
      setShowSubjectOnboarding(true);
    }
  };

  useEffect(() => {
    const boot = async () => {
      if (!getJwt()) {
        setIsBooting(false);
        return;
      }
      try {
        await hydrateApp();
      } catch (err) {
        // Only clear JWT if the error is specifically an auth error (e.g., token expired)
        // Don't clear for network errors – keep the user logged in in offline/simulated mode
        const msg = err instanceof Error ? err.message : '';
        if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('auth')) {
          clearJwt();
          setProfile(null);
        } else {
          // Server is down – boot in simulated mode using cached JWT
          try { await hydrateApp(); } catch { /* ignore */ }
        }
      } finally {
        setIsBooting(false);
      }
    };
    boot();
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const prompt = event as BeforeInstallPromptEvent;
      installPromptRef.current = prompt;
      setInstallPrompt(prompt);
    };
    const handleInstalled = () => {
      installPromptRef.current = null;
      setInstallPrompt(null);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    const prompt = installPromptRef.current;
    if (!prompt) return;
    await prompt.prompt();
    installPromptRef.current = null;
    setInstallPrompt(null);
  };

  // Welcome authenticated sign-in / signup helper
  const handleSignIn = async (fullName: string, email: string, dailyGoal: number, password: string, mode: 'signin' | 'signup' | 'guest') => {
    const result = mode === 'guest'
      ? await api.guestSignIn()
      : mode === 'signup'
        ? await api.signUp({ fullName, email, password, dailyGoal })
        : await api.signIn({ email, password });
    setJwt(result.jwt);
    // Pass true so new users see the subject picker after signing up
    await hydrateApp(true);
    return { ok: true };
  };

  // Save subjects chosen in the onboarding modal (or the edit modal)
  const handleSaveOnboardingSubjects = async (
    selectedNames: Array<{ name: string; color: string; accentColor: string; iconName: string }>
  ) => {
    // Add each chosen subject via the API
    const added: Subject[] = [];
    for (const s of selectedNames) {
      try {
        const newSub = await api.addSubject(s);
        added.push(newSub);
      } catch { /* ignore duplicate errors */ }
    }
    if (added.length > 0) {
      setSubjects(prev => {
        // Keep existing non-default subjects plus new ones
        const nonDefault = prev.filter(s => !INITIAL_SUBJECTS.find(d => d.id === s.id));
        return [...nonDefault, ...added];
      });
      setSelectedSubjectId(added[0].id);
    }
    setShowSubjectOnboarding(false);
  };

  // Profile Log Out helper
  const handleLogOut = async () => {
    try {
      await api.signOut();
    } finally {
      clearJwt();
      setProfile(null);
    }
  };

  // Task events
  const handleAddTask = async (title: string, subjectId: string, priority: Priority, dueDate: string) => {
    const newTask = await api.addTask({ title, subjectId, priority, dueDate });
    setTasks(prev => [newTask, ...prev]);
  };

  const handleToggleTask = async (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    try {
      const updated = await api.toggleTask(id);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    } catch {
      await hydrateApp();
    }
  };

  const handleDeleteTask = async (id: string) => {
    await api.deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Subject events
  const handleAddSubject = async (name: string, color: string, iconName: string) => {
    const accentColor = color.includes('indigo') ? '#183ce6' : color.includes('violet') ? '#632ce5' : color.includes('teal') ? '#0d9488' : color.includes('amber') ? '#d97706' : '#64748b';
    const newSub = await api.addSubject({ name, color, accentColor, iconName });
    setSubjects(prev => [...prev, newSub]);
    setSelectedSubjectId(newSub.id);
  };

  // Deck directory additions
  const handleAddDeck = async (deck: FlashcardDeck) => {
    const createdDeck = await api.addDeck(deck);
    setDecks(prev => [createdDeck, ...prev]);
  };

  // Achievement unlock triggers
  const handleUnlockBadge = async (badgeId: string) => {
    setBadges(prev => prev.map(b => {
      if (b.id === badgeId && !b.unlocked) {
        return {
          ...b,
          unlocked: true,
          unlockedAt: new Date().toISOString(),
        };
      }
      return b;
    }));
    try {
      const updated = await api.unlockBadge(badgeId);
      setBadges(prev => prev.map(b => b.id === badgeId ? updated : b));
    } catch {
      await hydrateApp();
    }
  };

  // Quick launch focus bypass
  const handleTriggerQuickFocus = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setActiveTab('timer');
  };

  // Focus triggers
  const handleStartSession = (totalSeconds: number, sound: string, mode: 'pomodoro' | 'short_break' | 'long_break' | 'custom' = 'pomodoro') => {
    setActiveSession({
      totalSeconds,
      sound,
      subjectId: selectedSubjectId,
      mode,
    });
  };

  const handleFinishSession = async (totalMinutes: number, completed: boolean, focusScore: number = 100) => {
    if (!profile || !activeSession) return;

    const loggedMinutes = totalMinutes;

    const result = await api.finishSession({
      durationMinutes: loggedMinutes,
      subjectId: activeSession.subjectId,
      mode: activeSession.mode,
      completed,
      focusScore,
    });

    setSessionLogs(prev => [result.log, ...prev]);
    setProfile(result.profile);

    // Award achievements dynamically based on newly tracked status
    if (result.profile.sessionsCount >= 1) {
      handleUnlockBadge('badge-1'); // Unlock first step clear
    }
    if (result.profile.totalFocusMinutes >= 50) {
      handleUnlockBadge('badge-3'); // Unlock Pioneer badge
    }

    if (completed) {
      setTimeout(() => {
        alert(`Excellent concentration study session! Focus Score: ${focusScore}%. You earned +${result.pointsEarned} Buddy Points.`);
      }, 250);
    }

    // exit Focus overlay
    setActiveSession(null);
    setActiveTab('insights'); // navigate straight to analytics to show them progress
  };

  const handleProfileUpdated = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
  };

  const handleCancelSession = () => {
    setActiveSession(null);
  };

  if (isBooting) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center text-brand-dark text-sm font-bold">
        Loading Focus Buddy...
      </div>
    );
  }

  // If no logged in profile, render Welcome Gate
  if (!profile) {
    return <WelcomeScreen onSignIn={handleSignIn} />;
  }

  const activeSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col md:flex-row font-sans text-brand-dark">
      
      {/* 2. PERSISTENT LEFT SIDEBAR - Desktop layout */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-brand-primary border-r border-[#5A5A40]/15 shrink-0 sticky top-0 h-screen p-5 select-none z-30 text-brand-bg" id="desktop-sidebar-frame">
        <div className="space-y-8">
          {/* Main Title branding icon on top leftmost corner */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center text-brand-vibrant">
              <Eye size={22} strokeWidth={2.5} className="animate-pulse" />
            </div>
            <span className="font-sans font-extrabold text-[19px] tracking-tight text-white">
              Focus Buddy
            </span>
          </div>

          {/* User profile identifier chip */}
          <div className="p-3 bg-white/10 border border-white/10 rounded-xl flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-brand-vibrant flex items-center justify-center text-sm font-extrabold text-white">
              {profile.fullName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-black block truncate text-white">{profile.fullName}</span>
              <span className="text-[10px] text-brand-bg/70 block truncate mb-1">{profile.email}</span>
              <div className="text-[10px] bg-brand-vibrant text-white font-sans font-black uppercase tracking-wider rounded-md py-1 px-2 border border-white/10 flex items-center gap-1 shadow-sm w-max">
                🪙 {profile.buddyPoints ?? 250} Pts
              </div>
            </div>
          </div>

          {/* Core navigation suite items */}
          <nav className="space-y-1.5" id="desktop-navigation-items">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-all duration-200 pointer-events-auto ${
                activeTab === 'dashboard'
                  ? 'bg-white/15 text-white shadow-sm font-black'
                  : 'text-brand-bg/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutGrid size={16} />
              My Dashboard
            </button>

            <button
              onClick={() => setActiveTab('timer')}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-all duration-200 pointer-events-auto ${
                activeTab === 'timer'
                  ? 'bg-white/15 text-white shadow-sm font-black'
                  : 'text-brand-bg/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock size={16} />
              Focus Timer
            </button>

            <button
              onClick={() => setActiveTab('decks')}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-all duration-200 pointer-events-auto ${
                activeTab === 'decks'
                  ? 'bg-white/15 text-white shadow-sm font-black'
                  : 'text-brand-bg/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen size={16} />
              Study Decks
            </button>

            <button
              onClick={() => setActiveTab('insights')}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-all duration-200 pointer-events-auto ${
                activeTab === 'insights'
                  ? 'bg-white/15 text-white shadow-sm font-black'
                  : 'text-brand-bg/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award size={16} />
              Insights & Growth
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-all duration-200 pointer-events-auto ${
                activeTab === 'vault'
                  ? 'bg-white/15 text-white shadow-sm font-black'
                  : 'text-brand-bg/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <FolderOpen size={16} />
              College Vault
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-3 transition-all duration-200 pointer-events-auto ${
                activeTab === 'settings'
                  ? 'bg-white/15 text-white shadow-sm font-black'
                  : 'text-brand-bg/70 hover:text-white hover:bg-white/5'
              }`}
              id="desktop-settings-nav-button"
            >
              <SettingsIcon size={16} />
              App Settings
            </button>
          </nav>
        </div>

        {/* Desktop support info and Logout anchors */}
        <div className="space-y-4">
          <div className="text-[10px] bg-white/5 border border-white/10 rounded-lg p-3 text-brand-bg/80 font-medium">
            <div className="flex gap-1 items-center mb-1 font-bold text-brand-accent">
              <ShieldCheck size={12} />
              System Secured
            </div>
            Reducing mental distraction triggers optimizes memory retainment.
          </div>

          {installPrompt && (
            <button
              onClick={handleInstallApp}
              className="w-full py-3 px-4 bg-brand-vibrant hover:opacity-95 text-white rounded-xl text-xs font-black flex items-center gap-3 transition pointer-events-auto"
            >
              <Sparkles size={15} />
              Install App
            </button>
          )}

          {/* Change Subjects shortcut */}
          <button
            onClick={() => setShowSubjectOnboarding(true)}
            className="w-full py-3 px-4 border border-brand-vibrant/40 hover:bg-brand-vibrant/10 text-brand-vibrant rounded-xl text-xs font-black flex items-center gap-3 transition pointer-events-auto"
            id="desktop-change-subjects-button"
          >
            <BookMarked size={15} />
            Change Subjects
          </button>

          <button
            onClick={handleLogOut}
            className="w-full py-3 px-4 border border-white/10 hover:bg-rose-500/15 hover:text-rose-100 hover:border-transparent rounded-xl text-xs font-bold text-brand-bg/70 flex items-center gap-3 transition pointer-events-auto"
            id="desktop-logout-button"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* 3. MOBILE HEADER BANNER */}
      <header className="flex md:hidden items-center justify-between p-4 bg-brand-primary border-b border-[#5A5A40]/15 select-none z-30 sticky top-0 text-white" id="mobile-top-header">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center text-brand-vibrant">
            <Eye size={20} strokeWidth={2.5} className="animate-pulse" />
          </div>
          <span className="font-sans font-extrabold text-base tracking-tight text-white">
            Focus Buddy
          </span>
        </div>

        <div className="flex items-center gap-2">
          {installPrompt && (
            <button
              onClick={handleInstallApp}
              className="px-3 py-1.5 bg-brand-vibrant text-white rounded-lg text-[10px] font-black"
            >
              Install
            </button>
          )}
          <button
            onClick={handleLogOut}
            className="p-1.5 text-brand-bg/80 hover:text-rose-200 transition"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* 4. MAIN CENTRAL INTERFACE PORT CO-ORDINATOR */}
      <main className="flex-1 max-w-[1240px] mx-auto w-full px-4 py-6 sm:px-8 sm:py-8 pb-24 md:pb-8">
        {isOffline && (
          <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
            You are offline. Cached screens remain available, and session/task writes will replay when the network returns.
          </div>
        )}
        {localStorage.getItem('focus_buddy_is_simulated') === 'true' && (
          <div className="mb-6 rounded-2xl border border-[#D4A373]/30 bg-[#FAEDCD]/40 backdrop-blur-md px-5 py-3.5 text-xs text-[#5A5A40] flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4A373] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4A373]"></span>
              </div>
              <span className="font-sans leading-relaxed">
                <strong className="font-extrabold uppercase tracking-wider mr-1 text-[#B87D4B]">Offline Simulation Active</strong> 
                The database server is offline. Focus Buddy is running locally, storing all tasks, decks, and achievements securely in this browser.
              </span>
            </div>
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'dashboard' && (
              <Dashboard
                subjects={subjects}
                tasks={tasks}
                totalFocusMinutes={profile.totalFocusMinutes}
                dailyGoal={profile.dailyGoalMinutes}
                profileName={profile.fullName}
                streakCount={profile.streak}
                buddySpecies={profile.buddySpecies || 'fox'}
                buddyPoints={profile.buddyPoints ?? 250}
                onProfileUpdated={handleProfileUpdated}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                onAddSubject={handleAddSubject}
                onTriggerQuickFocus={handleTriggerQuickFocus}
                onOpenSubjectModal={() => setShowSubjectOnboarding(true)}
              />
            )}

            {activeTab === 'timer' && (
              <FocusTimer
                subjects={subjects}
                selectedSubjectId={selectedSubjectId}
                onSelectSubject={setSelectedSubjectId}
                onStartSession={handleStartSession}
                activeSession={activeSession}
                onCancelSession={handleCancelSession}
              />
            )}

            {activeTab === 'decks' && (
              <Flashcards
                subjects={subjects}
                decks={decks}
                onAddDeck={handleAddDeck}
                onUnlockBadge={handleUnlockBadge}
              />
            )}

            {activeTab === 'insights' && (
              <Insights
                badges={badges}
                subjects={subjects}
                sessionLogs={sessionLogs}
                totalFocusMinutes={profile.totalFocusMinutes}
                dailyGoal={profile.dailyGoalMinutes}
                buddyPoints={profile.buddyPoints ?? 250}
                onRedeemBuddyPoints={handleProfileUpdated}
              />
            )}

            {activeTab === 'vault' && (
              <VaultHub
                onSendToAI={(content, name) => {
                  setPresetAIFile({ content, name });
                }}
              />
            )}

            {activeTab === 'settings' && (
              <Settings
                profile={profile}
                onUpdateProfile={(updated) => {
                  setProfile(prev => {
                    if (!prev) return null;
                    return { ...prev, ...updated };
                  });
                }}
                subjectsCount={subjects.length}
                tasksCount={tasks.filter(t => !t.completed).length}
                installPrompt={installPrompt}
                onInstallApp={handleInstallApp}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 5. PERSISTENT NAVIGATION BAR - Touch friendly Mobile Aspect layout */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 bg-brand-primary border-t border-[#5A5A40]/15 justify-around items-center h-16 z-30 select-none px-4 shadow-lg pr-4 text-white" id="mobile-bottom-nav">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center p-2 text-[10px] font-bold transition-all relative pointer-events-auto ${
            activeTab === 'dashboard' ? 'text-brand-vibrant' : 'text-brand-bg/60'
          }`}
        >
          <LayoutGrid size={18} />
          <span className="mt-1">Dashboard</span>
          {activeTab === 'dashboard' && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-vibrant" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('timer')}
          className={`flex flex-col items-center justify-center p-2 text-[10px] font-bold transition-all relative pointer-events-auto ${
            activeTab === 'timer' ? 'text-brand-vibrant' : 'text-brand-bg/60'
          }`}
        >
          <Clock size={18} />
          <span className="mt-1">Timer</span>
          {activeTab === 'timer' && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-vibrant" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('decks')}
          className={`flex flex-col items-center justify-center p-2 text-[10px] font-bold transition-all relative pointer-events-auto ${
            activeTab === 'decks' ? 'text-brand-vibrant' : 'text-brand-bg/60'
          }`}
        >
          <BookOpen size={18} />
          <span className="mt-1">Decks</span>
          {activeTab === 'decks' && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-vibrant" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('insights')}
          className={`flex flex-col items-center justify-center p-2 text-[10px] font-bold transition-all relative pointer-events-auto ${
            activeTab === 'insights' ? 'text-brand-vibrant' : 'text-brand-bg/60'
          }`}
        >
          <Award size={18} />
          <span className="mt-1">Insights</span>
          {activeTab === 'insights' && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-vibrant" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          className={`flex flex-col items-center justify-center p-2 text-[10px] font-bold transition-all relative pointer-events-auto ${
            activeTab === 'vault' ? 'text-brand-vibrant' : 'text-brand-bg/60'
          }`}
        >
          <FolderOpen size={18} />
          <span className="mt-1">Vault</span>
          {activeTab === 'vault' && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-vibrant" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center p-2 text-[10px] font-bold transition-all relative pointer-events-auto ${
            activeTab === 'settings' ? 'text-brand-vibrant' : 'text-brand-bg/60'
          }`}
          id="mobile-settings-nav-button"
        >
          <SettingsIcon size={18} />
          <span className="mt-1">Settings</span>
          {activeTab === 'settings' && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#D4A373]" />
          )}
        </button>
      </nav>

      {/* Immersive Focus overlay room */}
      {activeSession && (
        <FocusMode
          totalSeconds={activeSession.totalSeconds}
          selectedSound={activeSession.sound}
          subject={activeSubject}
          tasks={tasks}
          onToggleTask={handleToggleTask}
          onFinishSession={handleFinishSession}
          onCancelSession={handleCancelSession}
        />
      )}

      {/* Floating Multi-Agent AI Doubt Solver Hub */}
      <AIDoubtSolver 
        subjects={subjects} 
        activeSubjectId={selectedSubjectId} 
        presetContext={presetAIFile}
        onClearPresetContext={() => setPresetAIFile(null)}
      />

      {/* Subject Onboarding / Edit Modal */}
      <SubjectOnboardingModal
        isOpen={showSubjectOnboarding}
        existingSubjects={subjects}
        onClose={() => setShowSubjectOnboarding(false)}
        onSaveSubjects={handleSaveOnboardingSubjects}
      />
    </div>
  );
}
