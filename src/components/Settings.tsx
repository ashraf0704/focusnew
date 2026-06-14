import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Bell, Sparkles, Sliders, Volume2, Save, RotateCcw, 
  HelpCircle, Check, CircleAlert, Smartphone, Trophy, Globe,
  Download, Laptop
} from 'lucide-react';
import { UserProfile } from '../types';
import { api, urlBase64ToUint8Array } from '../api';

interface SettingsProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  subjectsCount: number;
  tasksCount: number;
  installPrompt?: any;
  onInstallApp?: () => Promise<void>;
}

export default function Settings({ 
  profile, 
  onUpdateProfile,
  subjectsCount,
  tasksCount,
  installPrompt,
  onInstallApp
}: SettingsProps) {
  // Local state for forms initialized with current loaded profile
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(profile.dailyGoalMinutes);
  
  // Custom companion settings
  const [buddySpecies, setBuddySpecies] = useState(profile.buddySpecies || 'fox');
  const [alarmTone, setAlarmTone] = useState(profile.alarmTone || 'singing-bowl');
  const [soundVolume, setSoundVolume] = useState(profile.soundVolume ?? 75);
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile.notificationsEnabled ?? true);
  const [language, setLanguage] = useState(profile.language || 'en');

  // Success indicator state
  const [isSaved, setIsSaved] = useState(false);
  const [soundTested, setSoundTested] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const buddies = [
    { 
      id: 'fox', 
      name: 'Barnaby the Fox', 
      icon: '🦊', 
      description: 'Zippy, sharp, and agile. He keeps your sessions structured with high energy and prompt alerts.' 
    },
    { 
      id: 'owl', 
      name: 'Otis the Owl', 
      icon: '🦉', 
      description: 'Wise, steady, and watchful. Recommends deliberate, slow reading breaks and reviews.' 
    },
    { 
      id: 'panda', 
      name: 'Mei the Panda', 
      icon: '🐼', 
      description: 'Extremely calm and mindful. Gentle, slow companion focused on reducing anxiety and stretching during breaks.' 
    },
    { 
      id: 'dog', 
      name: 'Buster the Retriever', 
      icon: '🐶', 
      description: 'Enthusiastic and eager. Celebrates every task crossed off with major cheers and extra buddy points.' 
    },
    { 
      id: 'cat', 
      name: 'Pippin the Cat', 
      icon: '🐱', 
      description: 'Quiet, independent, but comforting. Nestles curled up next to your desk while you study in deep focus.' 
    }
  ];

  const alarmTones = [
    { id: 'classic-bell', name: '🔔 Classic Service Bell', desc: 'Crisp, cheerful high-frequency stroke' },
    { id: 'singing-bowl', name: '🧘 Tibetan Singing Bowl', desc: 'Resonating deep, ambient harmonic sweep' },
    { id: 'digital-chime', name: '📡 Vintage Digital Chime', desc: 'Retro synthetic arcade tone chime' },
    { id: 'birdsong', name: '🍃 Soft Forest Birdsong', desc: 'Melodic nature chirp to wind down' },
    { id: 'ocean-wave', name: '🌊 Single Ocean Surf Splash', desc: 'Gentle, therapeutic wave-crest crash' }
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSettingsError(null);
    try {
      const updated = await api.updateProfile({
        fullName,
        dailyGoalMinutes: Number(dailyGoalMinutes),
        buddySpecies,
        alarmTone,
        soundVolume,
        notificationsEnabled,
        language
      });
      localStorage.setItem('focus_buddy_language', language);
      onUpdateProfile(updated);
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
      }, 4000);
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : 'Could not save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm("Restore system configuration guidelines back to classic factory defaults?")) {
      setFullName(profile.fullName);
      setEmail(profile.email);
      setDailyGoalMinutes(25);
      setBuddySpecies('fox');
      setAlarmTone('singing-bowl');
      setSoundVolume(75);
      setNotificationsEnabled(true);
      setLanguage('en');
      localStorage.setItem('focus_buddy_language', 'en');
      
      api.updateProfile({
        dailyGoalMinutes: 25,
        buddySpecies: 'fox',
        alarmTone: 'singing-bowl',
        soundVolume: 75,
        notificationsEnabled: true,
        language: 'en'
      }).then(onUpdateProfile).catch(error => {
        setSettingsError(error instanceof Error ? error.message : 'Could not reset settings.');
      });
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    setSettingsError(null);

    try {
      if (!enabled) {
        const registration = await navigator.serviceWorker?.ready;
        const subscription = await registration?.pushManager.getSubscription();
        await subscription?.unsubscribe();
        const updated = await api.deletePushSubscription();
        onUpdateProfile(updated);
        return;
      }

      if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications are not supported in this browser.');
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setNotificationsEnabled(false);
        throw new Error('Notification permission was not granted.');
      }

      const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error('VITE_VAPID_PUBLIC_KEY is not configured.');

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const updated = await api.savePushSubscription(subscription.toJSON());
      onUpdateProfile(updated);
    } catch (error) {
      setNotificationsEnabled(false);
      setSettingsError(error instanceof Error ? error.message : 'Could not update notification settings.');
    }
  };

  const testTriggerSound = () => {
    setSoundTested(true);
    // Simulate real sound feedback visual cues
    setTimeout(() => {
      setSoundTested(false);
    }, 1200);
  };

  const selectedBuddy = buddies.find(b => b.id === buddySpecies) || buddies[0];

  return (
    <div className="space-y-6" id="applet-settings-suite">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-brand-outline rounded-3xl shadow-xs">
        <div>
          <h2 className="font-sans font-extrabold text-2xl text-brand-dark flex items-center gap-2">
            <Sliders size={22} className="text-brand-vibrant" />
            Control Center & Preferences
          </h2>
          <p className="text-xs text-brand-muted mt-1">
            Personalize your study environment, configure smart notifications, and choose your Focus Buddy.
          </p>
        </div>
        <div className="mt-3 sm:mt-0 px-3.5 py-1.5 bg-brand-accent/30 rounded-xl text-xs font-bold text-brand-muted flex items-center gap-1.5 border border-brand-outline/20">
          <Trophy size={13} className="text-brand-vibrant" />
          <span>Core System Configuration</span>
        </div>
      </div>

      <AnimatePresence>
        {isSaved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 shadow-xs"
            id="settings-save-success-banner"
          >
            <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
              <Check size={14} strokeWidth={3} />
            </div>
            <div>
              <p className="text-xs font-bold font-sans">Settings updated successfully!</p>
              <p className="text-[10px] text-emerald-700/80">Your metrics, profile configurations, and sound parameters are synchronized globally.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {settingsError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-3 text-xs font-bold">
          <CircleAlert size={16} />
          <span>{settingsError}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT SECTION - Profile Details & App Goals */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* 1. Companion selection bento card */}
            <div className="p-6 bg-white border border-brand-outline rounded-3xl shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-sans font-bold text-[#4A4A3A] mb-1 flex items-center gap-2 text-md">
                  <Sparkles size={16} className="text-brand-vibrant" />
                  1. Customize Focus Companion Buddy
                </h3>
                <p className="text-xs text-brand-muted mb-4">
                  Your companion responds during focus timers, cheers you up on streak milestones, and organizes rewards!
                </p>

                {/* Buddies list picker */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 mb-5" id="buddy-selection-cards">
                  {buddies.map((b) => {
                    const isSelected = buddySpecies === b.id;
                    return (
                      <button
                        type="button"
                        key={b.id}
                        onClick={() => setBuddySpecies(b.id)}
                        className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center transition-all duration-300 relative group cursor-pointer ${
                          isSelected
                            ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary shadow-xs'
                            : 'border-brand-outline bg-white hover:border-[#CCD5AE] hover:bg-brand-bg/40'
                        }`}
                      >
                        <span className="text-3xl mb-1.5 block transition-transform group-hover:scale-115">
                          {b.icon}
                        </span>
                        <span className="text-[11px] font-black leading-tight text-brand-dark block truncate max-w-full">
                          {b.name.split(' ')[0]}
                        </span>
                        <div className={`mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                          isSelected 
                            ? 'bg-brand-primary text-white' 
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {isSelected ? 'Active' : 'Choose'}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Buddy Details Display panel */}
                <div className="p-4 bg-brand-bg/50 border border-brand-outline/80 rounded-2xl flex gap-3.5 items-center">
                  <div className="w-16 h-16 bg-white border border-brand-outline rounded-2xl flex items-center justify-center text-4xl shadow-xs shrink-0 select-none animate-bounce">
                    {selectedBuddy.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-brand-primary font-sans">
                      {selectedBuddy.name} (Active Companion)
                    </h4>
                    <p className="text-[11px] text-brand-muted leading-relaxed mt-0.5 max-w-lg">
                      {selectedBuddy.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. User Profile form */}
            <div className="p-6 bg-white border border-brand-outline rounded-3xl shadow-xs">
              <h3 className="font-sans font-bold text-[#4A4A3A] mb-1 flex items-center gap-2 text-md">
                <User size={16} className="text-brand-vibrant" />
                2. User Account Details & Goals
              </h3>
              <p className="text-xs text-brand-muted mb-5">
                Keep your profile details sharp to regulate analytical comparisons and daily achievement badges.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark/85">
                    Full Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-brand-outline rounded-xl py-3 px-3.5 text-xs text-brand-dark placeholder-slate-400 font-medium focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition"
                    placeholder="e.g. Ashraf"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark/85">
                    Email Residence
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-brand-outline rounded-xl py-3 px-3.5 text-xs text-brand-dark placeholder-slate-400 font-medium focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition"
                    placeholder="e.g. user@domain.com"
                  />
                </div>
              </div>

              {/* Concentration Daily Goal (Slider + Field) */}
              <div className="mt-6 p-4.5 bg-brand-bg/40 border border-[#5A5A40]/5 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-brand-dark font-sans uppercase tracking-wider">
                      Daily Focal Study Goal range
                    </h4>
                    <p className="text-[10px] text-brand-muted">
                      Target duration metric for achieving perfect streak badges every individual afternoon.
                    </p>
                  </div>
                  <div className="bg-brand-primary text-white font-sans font-black px-3 py-1 rounded-xl text-xs flex items-center gap-1">
                    ⏱️ {dailyGoalMinutes} Minutes
                  </div>
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min="5"
                    max="180"
                    step="5"
                    value={dailyGoalMinutes}
                    onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-vibrant"
                  />
                  
                  <div className="flex justify-between text-[10px] text-brand-muted font-mono">
                    <span>5 Min (Sprint)</span>
                    <span>45 Min</span>
                    <span>90 Min (Deep Work)</span>
                    <span>180 Min (Maximum)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT SECTION: Sounds presets & Notification configuration */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* 3. Audio / Alarm Tone Preferences */}
            <div className="p-6 bg-white border border-brand-outline rounded-3xl shadow-xs">
              <h3 className="font-sans font-bold text-[#4A4A3A] mb-1 flex items-center gap-2 text-md">
                <Volume2 size={16} className="text-brand-vibrant" />
                3. Alarm Tone Ambient Control
              </h3>
              <p className="text-xs text-brand-muted mb-4">
                Pick the acoustics that indicate your concentration timeframe is completed.
              </p>

              <div className="space-y-3.5">
                {/* Tone Select box */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-brand-dark/80 block">
                    Choose Completed Signal Sound
                  </label>
                  <select
                    value={alarmTone}
                    onChange={(e) => setAlarmTone(e.target.value)}
                    className="w-full bg-slate-50 border border-brand-outline rounded-xl py-2.5 px-3 text-xs text-brand-dark font-semibold focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition"
                  >
                    {alarmTones.map((tone) => (
                      <option key={tone.id} value={tone.id}>
                        {tone.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tone Description Info */}
                <div className="text-[10px] bg-brand-bg/50 border border-brand-outline text-brand-dark/95 p-3 rounded-xl italic leading-relaxed">
                  {alarmTones.find(t => t.id === alarmTone)?.desc}
                </div>

                {/* Volume slider control */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider text-brand-dark/80">
                    <span>Signal Sound Volume</span>
                    <span className="font-mono font-bold text-brand-primary">{soundVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={soundVolume}
                    onChange={(e) => setSoundVolume(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  />
                </div>

                {/* Test button with animated feedback */}
                <button
                  type="button"
                  onClick={testTriggerSound}
                  className="w-full py-2 px-3 border border-brand-primary/20 hover:border-brand-primary text-brand-primary font-sans font-black text-[11px] uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 bg-brand-primary/5 cursor-pointer relative overflow-hidden"
                >
                  <Volume2 size={13} className={soundTested ? 'animate-bounce text-brand-vibrant' : ''} />
                  {soundTested ? 'Playing Signal Demo...' : 'Test Alarm Sound'}
                  
                  {soundTested && (
                    <span className="absolute inset-0 bg-brand-vibrant/5 animate-pulse" />
                  )}
                </button>
              </div>
            </div>

            {/* 4. Push reminders & Simulated integrations */}
            <div className="p-6 bg-white border border-brand-outline rounded-3xl shadow-xs">
              <h3 className="font-sans font-bold text-[#4A4A3A] mb-1 flex items-center gap-2 text-md">
                <Smartphone size={16} className="text-brand-vibrant" />
                4. Routine & Notifications
              </h3>
              <p className="text-xs text-brand-muted mb-4">
                Toggle simulation routines for maintaining distraction-free workspace rules.
              </p>

              <div className="space-y-4">
                {/* Checkbox item */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => handleNotificationToggle(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer w-4 h-4"
                  />
                  <div className="text-left select-none">
                    <span className="text-[11px] font-black text-brand-dark block group-hover:text-brand-primary transition">
                      Simulate Desktop Reminders
                    </span>
                    <span className="text-[10px] text-brand-muted leading-relaxed block mt-0.5">
                      Sends quiet visual alert reminders in popups when idle intervals surpass 45 minutes to prompt focus!
                    </span>
                  </div>
                </label>

                {/* Technical safety disclaimer note */}
                <div className="p-3 bg-[#FAEDCD]/20 border border-[#D4A373]/30 rounded-xl text-[10px] text-brand-muted leading-relaxed flex items-start gap-1.5">
                  <CircleAlert size={14} className="text-brand-vibrant shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-brand-dark block">Offline Local Isolation</span>
                    No analytics metrics or personal schedule information leaves this browser window. Your private focus space remains fully contained.
                  </div>
                </div>
              </div>
            </div>

            {/* 5. App Interface Language Customization */}
            <div className="p-6 bg-white border border-brand-outline rounded-3xl shadow-xs">
              <h3 className="font-sans font-bold text-[#4A4A3A] mb-1 flex items-center gap-2 text-md">
                <Globe size={16} className="text-brand-vibrant" />
                5. Interface Language
              </h3>
              <p className="text-xs text-brand-muted mb-4">
                Customize the language of Focus Buddy to stay comfortable.
              </p>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-brand-dark/80 block">
                    Select Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-slate-50 border border-brand-outline rounded-xl py-2.5 px-3 text-xs text-brand-dark font-semibold focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition animate-none cursor-pointer"
                  >
                    <option value="en">English (English)</option>
                    <option value="es">Español (Spanish)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="fr">Français (French)</option>
                    <option value="de">Deutsch (German)</option>
                    <option value="ar">العربية (Arabic)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 6. Mobile & Desktop App Center */}
            <div className="p-6 bg-white border border-brand-outline rounded-3xl shadow-xs space-y-4">
              <h3 className="font-sans font-bold text-[#4A4A3A] mb-1 flex items-center gap-2 text-md">
                <Laptop size={16} className="text-brand-vibrant" />
                6. App Download & Installation Center
              </h3>
              <p className="text-xs text-brand-muted">
                Run Focus Buddy as a standalone app on your laptop or download it directly onto your mobile device.
              </p>

              <div className="space-y-3 pt-1">
                {/* 1. Progressive Web App (PWA) Install Trigger */}
                <div className="p-4 bg-slate-50 border border-brand-outline rounded-2xl space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Laptop className="text-brand-primary shrink-0 mt-0.5" size={16} />
                    <div className="text-left">
                      <span className="text-[11px] font-black text-brand-dark block">
                        Desktop & Laptop (PWA)
                      </span>
                      <span className="text-[10px] text-brand-muted leading-relaxed block mt-0.5">
                        Installs instantly on Windows, macOS, Linux, and Chromebooks. Running as a PWA gives you a clean borderless window, quick launch icon, and optimal offline performance.
                      </span>
                    </div>
                  </div>

                  {installPrompt ? (
                    <button
                      type="button"
                      onClick={onInstallApp}
                      className="w-full py-2.5 px-4 bg-brand-vibrant hover:opacity-95 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer active:scale-98 shadow-xs"
                    >
                      <Sparkles size={13} />
                      Install Standalone Web App (PWA)
                    </button>
                  ) : (
                    <div className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 rounded-xl p-2.5 text-center font-bold">
                      💡 Installed! (Or access via your browser's address bar + icon to launch anytime)
                    </div>
                  )}
                </div>

                {/* 2. Direct Android APK Download Trigger */}
                <div className="p-4 bg-rose-50/30 border border-rose-100/60 rounded-2xl space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Smartphone className="text-rose-600 shrink-0 mt-0.5" size={16} />
                    <div className="text-left">
                      <span className="text-[11px] font-black text-brand-dark block">
                        Native Android Mobile App
                      </span>
                      <span className="text-[10px] text-brand-muted leading-relaxed block mt-0.5">
                        Download the direct Android APK package to share with your friends or load onto your physical phone. Or scan QR using Expo Go to live-test developer runs.
                      </span>
                    </div>
                  </div>

                  <a
                    href="/focus-buddy.apk"
                    download="focus-buddy.apk"
                    className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer active:scale-98 text-center text-white"
                  >
                    <Download size={13} />
                    Download Android APK Package (Direct)
                  </a>
                </div>

                {/* Developer / Sharing Instructions */}
                <div className="p-3 bg-brand-bg/50 border border-brand-outline rounded-xl text-[10px] text-brand-muted leading-relaxed">
                  <div className="font-extrabold text-brand-dark mb-1">🚀 Sharing and Custom Builds</div>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>To test local native features instantly on any phone, run <code className="bg-slate-100 text-brand-primary px-1 rounded">npx expo start</code> in the mobile folder and scan QR with Expo Go.</li>
                    <li>To generate a fresh custom APK build remotely, execute <code className="bg-slate-100 text-brand-primary px-1 rounded">npx eas build -p android --profile preview</code> in your console.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Profile Statistics overview widget */}
            <div className="p-5.5 bg-brand-primary text-[#F7F4F0] rounded-3xl shadow-xs space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-accent">
                Study Profile Overview
              </h4>
              
              <div className="grid grid-cols-2 gap-2 text-center text-white">
                <div className="bg-white/10 p-2.5 rounded-2xl border border-white/5">
                  <span className="block text-lg font-black">{subjectsCount}</span>
                  <span className="text-[9px] uppercase tracking-wider text-[#F7F4F0]/70">Subjects Loaded</span>
                </div>
                <div className="bg-white/10 p-2.5 rounded-2xl border border-white/5">
                  <span className="block text-lg font-black">{tasksCount}</span>
                  <span className="text-[9px] uppercase tracking-wider text-[#F7F4F0]/70">Active Tasks</span>
                </div>
              </div>

              <div className="pt-2 text-[10px] font-bold text-center text-brand-accent/90">
                ⭐ Current consecutive streak: {profile.streak} Days active ⭐
              </div>
            </div>

          </div>

        </div>

        {/* Action Button Strip */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end items-center pt-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="w-full sm:w-auto px-5 py-3 border border-[#5A5A40]/15 bg-white text-brand-dark font-sans font-black text-xs uppercase tracking-wider rounded-xl hover:bg-slate-50 hover:border-brand-muted/40 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
            title="Restore preferences to initial safe presets"
          >
            <RotateCcw size={14} />
            Revert Defaults
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-7 py-3.5 bg-brand-primary border border-transparent text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
            title="Apply all updated account and buddy configurations"
            id="settings-save-button"
          >
            <Save size={14} />
            {isSaving ? 'Saving...' : 'Apply Settings Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
