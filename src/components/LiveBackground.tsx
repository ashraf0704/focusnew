import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Palette, Moon, Sun, CloudRain, Flame, Waves, Trees, X, Check } from 'lucide-react';

export type LiveThemeId = 'zen-forest' | 'cosmic-aurora' | 'rainy-window' | 'golden-sunset' | 'ocean-waves' | 'classic-sage';

interface LiveBackgroundProps {
  currentTheme: LiveThemeId;
  onThemeChange: (theme: LiveThemeId) => void;
}

export interface LiveThemeOption {
  id: LiveThemeId;
  name: string;
  category: string;
  icon: string;
  previewGradient: string;
  desc: string;
}

export const LIVE_THEMES: LiveThemeOption[] = [
  {
    id: 'zen-forest',
    name: '🌿 Zen Bamboo Forest',
    category: 'Peaceful Nature',
    icon: '🌿',
    previewGradient: 'from-[#1b2a1e] via-[#2d4a34] to-[#122015]',
    desc: 'Deep emerald bamboo canopy with floating glowing leaves & sunbeams.'
  },
  {
    id: 'rainy-window',
    name: '🌧️ Cozy Rainy Window',
    category: 'Peaceful Rain',
    icon: '🌧️',
    previewGradient: 'from-[#1e293b] via-[#0f172a] to-[#334155]',
    desc: 'Soft slate misty ambient with falling rain streaks & water ripples.'
  },
  {
    id: 'cosmic-aurora',
    name: '🌌 Deep Space Aurora',
    category: 'Peaceful Night',
    icon: '🌌',
    previewGradient: 'from-[#0f172a] via-[#1e1b4b] to-[#31103f]',
    desc: 'Undulating violet aurora borealis waves & twinkling starlight.'
  },
  {
    id: 'golden-sunset',
    name: '🌅 Golden Dusk Horizon',
    category: 'Warm Serenity',
    icon: '🌅',
    previewGradient: 'from-[#2a1b18] via-[#4a2c20] to-[#1e1210]',
    desc: 'Tranquil golden sunbeams & floating ambient dust bokeh orbs.'
  },
  {
    id: 'ocean-waves',
    name: '🌊 Oceanic Deep Water',
    category: 'Calm Depth',
    icon: '🌊',
    previewGradient: 'from-[#0b1d28] via-[#16384c] to-[#08151e]',
    desc: 'Calm deep sea teal water caustics & rhythmic wave pulses.'
  },
  {
    id: 'classic-sage',
    name: '🍃 Classic Focus Sage',
    category: 'Clean Minimal',
    icon: '🍃',
    previewGradient: 'from-[#E9EDC9] via-[#FAEDCD] to-[#E9EDC9]',
    desc: 'Original clean, distraction-free study layout style.'
  }
];

export default function LiveBackground({ currentTheme, onThemeChange }: LiveBackgroundProps) {
  
  if (currentTheme === 'classic-sage') {
    return null; // Uses default background
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" id="live-background-canvas">
      
      {/* 1. ZEN BAMBOO FOREST */}
      {currentTheme === 'zen-forest' && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#122015] via-[#1b2a1e] to-[#2d4a34]">
          {/* Animated sunbeam light rays */}
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-[140px] animate-pulse style={{ animationDuration: '8s' }}" />
          <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px] animate-pulse style={{ animationDuration: '10s' }}" />
          
          {/* Floating glowing leaves / particles */}
          {[...Array(16)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-emerald-300/30 blur-xs"
              style={{
                width: Math.random() * 8 + 4,
                height: Math.random() * 8 + 4,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -40, 0],
                x: [0, Math.random() * 30 - 15, 0],
                opacity: [0.2, 0.7, 0.2],
              }}
              transition={{
                duration: Math.random() * 6 + 6,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.4,
              }}
            />
          ))}
        </div>
      )}

      {/* 2. COZY RAINY WINDOW */}
      {currentTheme === 'rainy-window' && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#090d16]">
          {/* Rain mist overlay */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[150px] animate-pulse" />

          {/* Vertical rain streaks */}
          {[...Array(24)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-[1.5px] bg-gradient-to-b from-transparent via-cyan-200/40 to-transparent"
              style={{
                height: Math.random() * 60 + 40,
                left: `${(i / 24) * 100}%`,
                top: '-10%',
              }}
              animate={{
                y: ['0vh', '110vh'],
              }}
              transition={{
                duration: Math.random() * 1.5 + 1.2,
                repeat: Infinity,
                ease: 'linear',
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      )}

      {/* 3. DEEP SPACE AURORA */}
      {currentTheme === 'cosmic-aurora' && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#080d1a] via-[#1e1b4b] to-[#140a28]">
          {/* Undulating Aurora Waves */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-r from-emerald-500/15 via-teal-400/20 to-purple-600/15 blur-[120px]"
            animate={{
              x: [-40, 40, -40],
              opacity: [0.4, 0.8, 0.4],
              scaleY: [1, 1.2, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Twinkling stars */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 3 + 1,
                height: Math.random() * 3 + 1,
                top: `${Math.random() * 90}%`,
                left: `${Math.random() * 95}%`,
              }}
              animate={{
                opacity: [0.1, 0.9, 0.1],
                scale: [0.8, 1.3, 0.8],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
      )}

      {/* 4. GOLDEN DUSK HORIZON */}
      {currentTheme === 'golden-sunset' && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e1210] via-[#2a1b18] to-[#4a2c20]">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-amber-500/15 rounded-full blur-[160px] animate-pulse" />

          {/* Floating bokeh dust */}
          {[...Array(14)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-amber-400/25 blur-xs"
              style={{
                width: Math.random() * 12 + 6,
                height: Math.random() * 12 + 6,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.random() * 20 - 10, 0],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: Math.random() * 7 + 5,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          ))}
        </div>
      )}

      {/* 5. OCEANIC DEEP WATER */}
      {currentTheme === 'ocean-waves' && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#08151e] via-[#0b1d28] to-[#16384c]">
          <motion.div
            className="absolute -bottom-20 left-0 right-0 h-[400px] bg-cyan-500/10 blur-[130px]"
            animate={{
              y: [-20, 20, -20],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── Theme Selector Modal Component ──
interface ThemeSelectorModalProps {
  isOpen: boolean;
  currentTheme: LiveThemeId;
  onClose: () => void;
  onSelectTheme: (theme: LiveThemeId) => void;
}

export function ThemeSelectorModal({ isOpen, currentTheme, onClose, onSelectTheme }: ThemeSelectorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border border-brand-outline rounded-3xl p-6 shadow-xl max-w-xl w-full space-y-5"
      >
        <div className="flex items-center justify-between border-b border-brand-outline pb-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-brand-primary" />
            <h3 className="font-heading font-black text-lg text-brand-dark">
              Peaceful Live Background Themes
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-brand-dark hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-brand-muted leading-relaxed">
          Transform your focus environment with tranquil live ambient themes. Select a theme below to apply instant GPU-accelerated peaceful background movement.
        </p>

        {/* Themes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
          {LIVE_THEMES.map(theme => {
            const isSelected = currentTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => {
                  onSelectTheme(theme.id);
                }}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden group ${
                  isSelected 
                    ? 'border-brand-primary ring-2 ring-brand-primary/20 bg-emerald-50/20 font-bold shadow-xs'
                    : 'border-brand-outline bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{theme.icon}</span>
                    <div>
                      <h4 className="font-sans font-extrabold text-xs text-brand-dark">
                        {theme.name}
                      </h4>
                      <span className="text-[9px] text-brand-muted block font-mono">
                        {theme.category}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="p-1 bg-brand-primary text-white rounded-full">
                      <Check size={12} />
                    </span>
                  )}
                </div>

                {/* Color gradient preview strip */}
                <div className={`h-8 rounded-xl bg-gradient-to-r ${theme.previewGradient} shadow-inner flex items-center justify-center`}>
                  <span className="text-[10px] font-mono text-white/80 font-bold tracking-wider">
                    {isSelected ? 'ACTIVE THEME' : 'TAP TO APPLY'}
                  </span>
                </div>

                <p className="text-[10px] text-brand-muted leading-tight">
                  {theme.desc}
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="py-2.5 px-6 bg-brand-primary hover:opacity-95 text-white text-xs font-black rounded-xl transition shadow-xs cursor-pointer"
          >
            Done &amp; Save Preference
          </button>
        </div>
      </motion.div>
    </div>
  );
}
