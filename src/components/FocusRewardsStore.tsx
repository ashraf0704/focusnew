import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, Sparkles, Check, Lock, Volume2, ShieldCheck, 
  Flame, Award, Trophy, Zap, Compass, Star, Crown, Play, Pause
} from 'lucide-react';
import { UserProfile } from '../types';
import { api } from '../api';

interface FocusRewardsStoreProps {
  profile: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
}

interface RewardItem {
  id: string;
  category: 'avatar' | 'sound' | 'title' | 'powerup';
  name: string;
  cost: number;
  icon: string;
  description: string;
  badge?: string;
  audioPreview?: string;
}

const REWARD_ITEMS: RewardItem[] = [
  // 🦊 Companion Avatars
  {
    id: 'fox',
    category: 'avatar',
    name: 'Barnaby the Fox',
    cost: 0,
    icon: '🦊',
    description: 'Agile & sharp study companion. Keeps your focus sessions on strict pace with high energy.',
    badge: 'Default Starter'
  },
  {
    id: 'owl',
    category: 'avatar',
    name: 'Otis the Wise Owl',
    cost: 100,
    icon: '🦉',
    description: 'Watchful and steady. Encourages deep conceptual reading and structured milestone reviews.',
    badge: 'Popular'
  },
  {
    id: 'panda',
    category: 'avatar',
    name: 'Mei the Zen Panda',
    cost: 150,
    icon: '🐼',
    description: 'Mindful & calm companion. Focused on reducing exam stress and posture stretching.',
    badge: 'Mindful'
  },
  {
    id: 'cat',
    category: 'avatar',
    name: 'Pippin the Cyber Cat',
    cost: 200,
    icon: '🐱',
    description: 'Quiet, comforting companion that curls up next to your workspace during deep work.',
  },
  {
    id: 'penguin',
    category: 'avatar',
    name: 'Astro Space Penguin',
    cost: 250,
    icon: '🐧',
    description: 'Chill cosmic scholar. Boosts study endurance during late-night revision sessions.',
    badge: 'Special'
  },
  {
    id: 'dragon',
    category: 'avatar',
    name: 'Ignis Cosmic Dragon',
    cost: 350,
    icon: '🐉',
    description: 'Legendary companion for elite focus. Radiates intense motivation for competitive exams.',
    badge: 'Legendary'
  },

  // 🎵 Focus Soundscapes & Audio Tones
  {
    id: 'singing-bowl',
    category: 'sound',
    name: '🧘 Tibetan Singing Bowl',
    cost: 0,
    icon: '🧘',
    description: 'Harmonic resonant sweep for smooth transition in and out of deep focus.',
    badge: 'Default'
  },
  {
    id: 'rain-thunder',
    category: 'sound',
    name: '🌧️ Heavy Rain & Thunder',
    cost: 75,
    icon: '🌧️',
    description: 'Soothing thunderstorm ambiance designed to block ambient background noise.',
  },
  {
    id: 'lofi-cafe',
    category: 'sound',
    name: '☕ Deep Lo-Fi Study Cafe',
    cost: 100,
    icon: '☕',
    description: 'Cozy coffee shop acoustics with gentle vinyl crackles and chill beats.',
    badge: 'Best Seller'
  },
  {
    id: 'alpha-waves',
    category: 'sound',
    name: '🧠 432Hz Alpha Brain Waves',
    cost: 125,
    icon: '🧠',
    description: 'Pure binaural frequencies engineered to stimulate concentration and memory retention.',
  },
  {
    id: 'forest-stream',
    category: 'sound',
    name: '🌲 Forest Zen Waterfalls',
    cost: 150,
    icon: '🌲',
    description: 'Cascading river streams and soft woodland breeze for serene studying.',
  },

  // 🏆 Academic Rank Titles
  {
    id: 'title_novice',
    category: 'title',
    name: 'Focus Apprentice',
    cost: 50,
    icon: '📜',
    description: 'Displays the "Focus Apprentice" title badge proudly on your study dashboard.',
  },
  {
    id: 'title_scholar',
    category: 'title',
    name: 'Memory Scholar',
    cost: 150,
    icon: '🧠',
    description: 'Displays the "Memory Scholar" title badge for mastering active recall decks.',
  },
  {
    id: 'title_master',
    category: 'title',
    name: 'Focus Grandmaster',
    cost: 300,
    icon: '👑',
    description: 'Displays the prestigious "Focus Grandmaster" title badge on your profile.',
    badge: 'Prestige'
  },

  // ⚡ Study Power-Ups
  {
    id: 'streak_shield',
    category: 'powerup',
    name: 'Streak Freeze Shield 🛡️',
    cost: 100,
    icon: '🛡️',
    description: 'Protects your daily study streak if you miss a study day due to exams or travel.',
    badge: 'Protection'
  },
  {
    id: 'double_points',
    category: 'powerup',
    name: '2x Points Booster (24 Hours) ⚡',
    cost: 150,
    icon: '⚡',
    description: 'Doubles all Focus Points earned from timer sessions for the next 24 hours!',
    badge: '2x Boost'
  }
];

export default function FocusRewardsStore({ profile, onProfileUpdated }: FocusRewardsStoreProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'avatar' | 'sound' | 'title' | 'powerup'>('all');
  const [notice, setNotice] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);

  const currentPoints = profile.buddyPoints ?? 250;
  const unlockedRewards = profile.unlockedRewards || ['fox', 'singing-bowl'];
  const activeAvatar = profile.buddySpecies || 'fox';
  const activeTone = profile.alarmTone || 'singing-bowl';

  const triggerToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleUnlockOrEquip = async (item: RewardItem) => {
    const isUnlocked = unlockedRewards.includes(item.id) || item.cost === 0;

    // IF ALREADY UNLOCKED -> EQUIP / APPLY IT
    if (isUnlocked) {
      if (item.category === 'avatar') {
        try {
          const updated = await api.updateProfile({ buddySpecies: item.id });
          onProfileUpdated(updated);
          triggerToast(`Equipped ${item.name} as your active companion! 🦊`);
        } catch (e) {
          console.error(e);
        }
      } else if (item.category === 'sound') {
        try {
          const updated = await api.updateProfile({ alarmTone: item.id });
          onProfileUpdated(updated);
          triggerToast(`Set ${item.name} as your focus alarm sound! 🎵`);
        } catch (e) {
          console.error(e);
        }
      } else if (item.category === 'title') {
        try {
          const updated = await api.updateProfile({ rankTitle: item.name });
          onProfileUpdated(updated);
          triggerToast(`Displayed "${item.name}" on your profile! 👑`);
        } catch (e) {
          console.error(e);
        }
      }
      return;
    }

    // IF NOT UNLOCKED -> REDEEM WITH FOCUS POINTS
    if (currentPoints < item.cost) {
      triggerToast(`Not enough Focus Points! Study for ${Math.ceil((item.cost - currentPoints)/5)} more minutes to earn points.`);
      return;
    }

    setIsRedeeming(item.id);
    try {
      const newPoints = currentPoints - item.cost;
      const newUnlocked = [...unlockedRewards, item.id];

      let updatePayload: Partial<UserProfile> = {
        buddyPoints: newPoints,
        unlockedRewards: newUnlocked
      };

      // Auto-equip on unlock
      if (item.category === 'avatar') updatePayload.buddySpecies = item.id;
      if (item.category === 'sound') updatePayload.alarmTone = item.id;
      if (item.category === 'title') updatePayload.rankTitle = item.name;

      const updated = await api.updateProfile(updatePayload);
      onProfileUpdated(updated);
      triggerToast(`Successfully unlocked ${item.name}! 🎉`);
    } catch (e) {
      console.error(e);
      triggerToast('Could not complete redemption.');
    } finally {
      setIsRedeeming(null);
    }
  };

  const filteredItems = REWARD_ITEMS.filter(item => 
    selectedCategory === 'all' ? true : item.category === selectedCategory
  );

  return (
    <div className="space-y-6" id="focus-rewards-hub">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-brand-dark text-white border border-brand-vibrant px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2"
          >
            <Sparkles size={16} className="text-brand-vibrant animate-pulse" />
            <span>{notice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header Banner & Live Points Balance */}
      <div className="bg-gradient-to-r from-brand-primary via-[#4A6B50] to-brand-dark rounded-3xl p-6 text-white shadow-sm relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-vibrant/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-300">
              <Coins size={13} className="text-amber-300 animate-bounce" />
              100% Free Focus Rewards
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-white">
              Focus Points Rewards Store 🎁
            </h1>
            <p className="text-xs text-brand-bg/80 max-w-xl leading-relaxed">
              Earn Focus Points by completing study timer sessions, maintaining your daily streak, and completing subject tasks. Redeem points to unlock avatars, ambient focus audio, and power-ups!
            </p>
          </div>

          {/* Points Counter Box */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center shrink-0 min-w-[200px] space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-brand-bg/70 font-bold block">Available Focus Balance</span>
            <div className="text-3xl font-mono font-black text-amber-300 flex items-center justify-center gap-2">
              <Coins size={28} className="text-amber-300" />
              <span>{currentPoints}</span>
            </div>
            <span className="text-[9px] text-emerald-300 font-semibold block">
              +10 pts per 15m focus session
            </span>
          </div>
        </div>
      </div>

      {/* 2. Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
        {[
          { id: 'all', label: 'All Rewards', icon: Compass },
          { id: 'avatar', label: '🦊 Buddy Companions', icon: Sparkles },
          { id: 'sound', label: '🎵 Focus Soundscapes', icon: Volume2 },
          { id: 'title', label: '🏆 Rank Titles', icon: Crown },
          { id: 'powerup', label: '⚡ Study Power-Ups', icon: Zap },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as any)}
              className={`py-2.5 px-4 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'bg-white border border-brand-outline text-brand-muted hover:text-brand-dark hover:bg-slate-50'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Rewards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => {
          const isUnlocked = unlockedRewards.includes(item.id) || item.cost === 0;
          const isEquipped = (item.category === 'avatar' && activeAvatar === item.id) ||
                            (item.category === 'sound' && activeTone === item.id) ||
                            (item.category === 'title' && profile.rankTitle === item.name);
          const canAfford = currentPoints >= item.cost;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white border rounded-3xl p-5 shadow-xxs hover:shadow-xs transition-all duration-200 flex flex-col justify-between space-y-4 relative ${
                isEquipped ? 'border-brand-primary ring-2 ring-brand-primary/20 bg-emerald-50/10' : 'border-brand-outline'
              }`}
            >
              {/* Badge if available */}
              {item.badge && (
                <div className="absolute top-4 right-4">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-brand-primary/10 text-brand-primary px-2.5 py-0.5 rounded-full border border-brand-primary/20">
                    {item.badge}
                  </span>
                </div>
              )}

              {/* Item Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-brand-outline flex items-center justify-center text-2xl shrink-0 shadow-xs">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-sans font-black text-sm text-brand-dark">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {item.cost === 0 ? (
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          FREE STARTER
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Coins size={11} className="text-amber-500" />
                          {item.cost} Focus Points
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-brand-muted leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Action Button */}
              <div>
                {isEquipped ? (
                  <div className="w-full py-2.5 px-4 bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs">
                    <Check size={14} />
                    <span>ACTIVE &amp; EQUIPPED</span>
                  </div>
                ) : isUnlocked ? (
                  <button
                    onClick={() => handleUnlockOrEquip(item)}
                    className="w-full py-2.5 px-4 bg-brand-primary hover:opacity-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <span>Use / Equip Now</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleUnlockOrEquip(item)}
                    disabled={!canAfford || isRedeeming === item.id}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      canAfford
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    {isRedeeming === item.id ? (
                      <span>Redeeming...</span>
                    ) : canAfford ? (
                      <>
                        <Sparkles size={13} />
                        <span>Unlock for {item.cost} Points</span>
                      </>
                    ) : (
                      <>
                        <Lock size={13} />
                        <span>Needs {item.cost - currentPoints} More Points</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
