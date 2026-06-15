import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check, Trash2, Sparkles, GraduationCap, X, Search } from 'lucide-react';
import { Subject } from '../types';

interface SubjectOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSubjects: (selectedNames: Array<{ name: string; color: string; accentColor: string; iconName: string }>) => Promise<void>;
  existingSubjects?: Subject[];
}

const PRESET_OPTIONS = [
  { name: 'Advanced Calculus', color: 'bg-[#E9EDC9] border-[#5A5A40]/10 text-[#5A5A40]', accentColor: '#5A5A40', iconName: 'Percent' },
  { name: 'Computer Architecture', color: 'bg-[#CCD5AE]/20 border-[#CCD5AE]/50 text-[#4A4A3A]', accentColor: '#4A4A3A', iconName: 'Cpu' },
  { name: 'Interface Design & UX', color: 'bg-[#F2E9E1] border-[#D4A373]/30 text-[#B87D4B]', accentColor: '#D4A373', iconName: 'LayoutGrid' },
  { name: 'Academic Writing & Literature', color: 'bg-[#FEFAE0] border-[#E9EDC9] text-[#7E7E63]', accentColor: '#7E7E63', iconName: 'PenTool' },
  { name: 'Physics & Thermodynamics', color: 'bg-[#E0F2FE] border-[#bae6fd] text-[#0369a1]', accentColor: '#0284c7', iconName: 'Zap' },
  { name: 'Organic Chemistry', color: 'bg-[#DCFCE7] border-[#bbf7d0] text-[#15803d]', accentColor: '#16a34a', iconName: 'Flask' },
  { name: 'Macroeconomics', color: 'bg-[#FEE2E2] border-[#fecaca] text-[#b91c1c]', accentColor: '#dc2626', iconName: 'TrendingUp' },
  { name: 'World History', color: 'bg-[#F3E8FF] border-[#e9d5ff] text-[#6b21a8]', accentColor: '#8b5cf6', iconName: 'Globe' },
];

// Extended subject suggestion database for autocomplete
const ALL_SUBJECT_SUGGESTIONS = [
  // Mathematics
  'Algebra', 'Advanced Calculus', 'Linear Algebra', 'Discrete Mathematics', 'Statistics', 'Probability Theory', 'Trigonometry', 'Geometry', 'Number Theory', 'Real Analysis',
  // Computer Science
  'Computer Architecture', 'Data Structures & Algorithms', 'Operating Systems', 'Database Systems', 'Computer Networks', 'Machine Learning', 'Artificial Intelligence', 'Web Development', 'Cybersecurity', 'Software Engineering', 'Data Science', 'Cloud Computing', 'Mobile App Development',
  // Sciences
  'Physics & Thermodynamics', 'Quantum Mechanics', 'Astrophysics', 'Organic Chemistry', 'Inorganic Chemistry', 'Biochemistry', 'Biology', 'Genetics & Molecular Biology', 'Cell Biology', 'Ecology & Environmental Science', 'Microbiology', 'Anatomy & Physiology',
  // Engineering
  'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering', 'Structural Analysis', 'Control Systems', 'Signal Processing', 'Thermodynamics',
  // Humanities & Social Sciences
  'World History', 'Ancient Civilizations', 'Modern History', 'Philosophy', 'Ethics & Moral Philosophy', 'Sociology', 'Psychology', 'Cognitive Psychology', 'Political Science', 'International Relations', 'Anthropology', 'Geography',
  // Languages & Literature
  'Academic Writing & Literature', 'English Grammar', 'Creative Writing', 'Public Speaking', 'Journalism', 'Linguistics',
  // Business & Economics
  'Macroeconomics', 'Microeconomics', 'Business Administration', 'Accounting', 'Finance & Investment', 'Marketing', 'Entrepreneurship', 'Supply Chain Management',
  // Design & Arts
  'Interface Design & UX', 'Graphic Design', 'Photography', 'Fine Arts', 'Music Theory', 'Film Studies', 'Architecture',
  // Medicine & Health
  'Medicine', 'Pharmacology', 'Nursing', 'Public Health', 'Nutrition', 'Sports Science',
  // Law
  'Constitutional Law', 'Criminal Law', 'Business Law', 'International Law',
];

const PASTEL_PALETTES = [
  { color: 'bg-[#E9EDC9] border-[#5A5A40]/10 text-[#5A5A40]', accentColor: '#5A5A40' },
  { color: 'bg-[#CCD5AE]/20 border-[#CCD5AE]/50 text-[#4A4A3A]', accentColor: '#4A4A3A' },
  { color: 'bg-[#F2E9E1] border-[#D4A373]/30 text-[#B87D4B]', accentColor: '#D4A373' },
  { color: 'bg-[#FEFAE0] border-[#E9EDC9] text-[#7E7E63]', accentColor: '#7E7E63' },
  { color: 'bg-[#E0F2FE] border-[#bae6fd] text-[#0369a1]', accentColor: '#0284c7' },
  { color: 'bg-[#DCFCE7] border-[#bbf7d0] text-[#15803d]', accentColor: '#16a34a' },
  { color: 'bg-[#FEE2E2] border-[#fecaca] text-[#b91c1c]', accentColor: '#dc2626' },
  { color: 'bg-[#F3E8FF] border-[#e9d5ff] text-[#6b21a8]', accentColor: '#8b5cf6' },
];

export default function SubjectOnboardingModal({ isOpen, onClose, onSaveSubjects, existingSubjects }: SubjectOnboardingModalProps) {
  const [selectedPresets, setSelectedPresets] = useState<number[]>([]);
  const [customSubjects, setCustomSubjects] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  // Filter suggestions based on input
  const filteredSuggestions = customInput.trim().length >= 1
    ? ALL_SUBJECT_SUGGESTIONS.filter(s =>
        s.toLowerCase().includes(customInput.toLowerCase()) &&
        !customSubjects.includes(s) &&
        !PRESET_OPTIONS.some(p => p.name.toLowerCase() === s.toLowerCase() && selectedPresets.includes(PRESET_OPTIONS.indexOf(p)))
      ).slice(0, 8)
    : [];

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!inputRef.current?.contains(e.target as Node) && !suggestionsRef.current?.contains(e.target as Node)) {
        setShowSuggestions(false);
        setHighlightedIdx(-1);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      if (existingSubjects && existingSubjects.length > 0) {
        const presets: number[] = [];
        const customs: string[] = [];
        existingSubjects.forEach(sub => {
          const idx = PRESET_OPTIONS.findIndex(p => p.name.toLowerCase() === sub.name.toLowerCase());
          if (idx !== -1) {
            presets.push(idx);
          } else {
            customs.push(sub.name);
          }
        });
        setSelectedPresets(presets);
        setCustomSubjects(customs);
      } else {
        setSelectedPresets([]);
        setCustomSubjects([]);
      }
    }
  }, [isOpen, existingSubjects]);

  const handleTogglePreset = (index: number) => {
    setSelectedPresets(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomSubject(customInput);
  };

  const addCustomSubject = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (customSubjects.includes(trimmed)) return;
    setCustomSubjects(prev => [...prev, trimmed]);
    setCustomInput('');
    setShowSuggestions(false);
    setHighlightedIdx(-1);
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx(prev => (prev + 1) % filteredSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
    } else if (e.key === 'Enter' && highlightedIdx >= 0) {
      e.preventDefault();
      addCustomSubject(filteredSuggestions[highlightedIdx]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIdx(-1);
    }
  };

  const handleRemoveCustom = (name: string) => {
    setCustomSubjects(prev => prev.filter(n => n !== name));
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const finalSubjects: Array<{ name: string; color: string; accentColor: string; iconName: string }> = [];

      // Add selected presets
      selectedPresets.forEach(idx => {
        finalSubjects.push(PRESET_OPTIONS[idx]);
      });

      // Add custom subjects with random pastel styles
      customSubjects.forEach((name, idx) => {
        const style = PASTEL_PALETTES[idx % PASTEL_PALETTES.length];
        finalSubjects.push({
          name,
          color: style.color,
          accentColor: style.accentColor,
          iconName: 'Bookmark',
        });
      });

      // Fallback if they didn't pick anything (always add Autonomous Study as default)
      if (finalSubjects.length === 0) {
        finalSubjects.push({
          name: 'Autonomous Study',
          color: 'bg-[#FDFCFB] border-brand-soft-border/80 text-brand-muted',
          accentColor: '#5A5A40',
          iconName: 'Bookmark',
        });
      }

      await onSaveSubjects(finalSubjects);
      onClose();
    } catch (error) {
      console.error('Failed to save preferred subjects during onboarding:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-[#4A4A3A]/40 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-pointer"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-xl rounded-3xl border border-brand-outline shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-hidden cursor-default relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Top-Right Exit button */}
          <button 
            type="button" 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
            title="Exit"
          >
            <X size={18} />
          </button>
          {/* Header Branding */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 bg-brand-accent rounded-2xl flex items-center justify-center shadow-xs mb-3.5 relative">
              <GraduationCap className="text-brand-primary" size={24} />
              <Sparkles className="text-brand-vibrant absolute top-1 right-1" size={12} />
            </div>
            <h2 className="font-sans font-black text-xl text-brand-dark">
              Customize Your Study Subjects
            </h2>
            <p className="text-xs text-brand-muted mt-1 max-w-md">
              Select what you are studying to automatically customize study guides, flashcard decks, and related YouTube resources.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 pr-1">
            {/* 1. Presets grid */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-3 text-left">
                Select Your Subjects (Tap to Select)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRESET_OPTIONS.map((preset, idx) => {
                  const isSelected = selectedPresets.includes(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleTogglePreset(idx)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all duration-300 cursor-pointer ${
                        isSelected
                          ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary/20 shadow-xs font-semibold'
                          : 'border-brand-outline bg-white hover:border-[#CCD5AE] hover:bg-brand-bg/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-brand-vibrant animate-pulse' : 'bg-slate-300'}`} />
                        <span className="text-xs text-brand-dark">{preset.name}</span>
                      </div>
                      {isSelected && (
                        <div className="w-4.5 h-4.5 bg-brand-primary text-white rounded-full flex items-center justify-center shrink-0">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Unlimited Custom addition option */}
            <div className="pt-2 border-t border-brand-outline/60">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-3 text-left">
                Add Unlimited Custom Subjects
              </label>

              <form onSubmit={handleAddCustom} className="flex gap-2 relative">
                <div className="flex-1 relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none">
                    <Search size={12} />
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={customInput}
                    onChange={e => {
                      setCustomInput(e.target.value);
                      setShowSuggestions(true);
                      setHighlightedIdx(-1);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Type a subject to search suggestions..."
                    autoComplete="off"
                    className="w-full bg-slate-50 border border-brand-outline rounded-xl py-2.5 pl-8 pr-3.5 text-xs text-brand-dark font-medium focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition"
                  />
                  {/* Autocomplete dropdown */}
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <ul
                      ref={suggestionsRef}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-brand-outline rounded-xl shadow-xl z-50 overflow-hidden max-h-52 overflow-y-auto"
                    >
                      {filteredSuggestions.map((suggestion, idx) => {
                        const matchStart = suggestion.toLowerCase().indexOf(customInput.toLowerCase());
                        const before = suggestion.slice(0, matchStart);
                        const match = suggestion.slice(matchStart, matchStart + customInput.length);
                        const after = suggestion.slice(matchStart + customInput.length);
                        return (
                          <li
                            key={suggestion}
                            onMouseDown={e => { e.preventDefault(); addCustomSubject(suggestion); }}
                            onMouseEnter={() => setHighlightedIdx(idx)}
                            className={`px-3.5 py-2.5 cursor-pointer text-xs flex items-center gap-2 transition-colors ${
                              highlightedIdx === idx ? 'bg-brand-primary/8 text-brand-dark' : 'hover:bg-slate-50 text-brand-dark'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-vibrant/60 shrink-0" />
                            <span>
                              {before}
                              <strong className="text-brand-primary font-black">{match}</strong>
                              {after}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-4 bg-brand-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition hover:opacity-95 cursor-pointer shrink-0"
                >
                  <Plus size={14} />
                  Add
                </button>
              </form>

              {/* Render custom tag chips list */}
              {customSubjects.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 bg-slate-50/50 p-3.5 border border-brand-outline rounded-2xl">
                  {customSubjects.map((name, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 bg-white border border-brand-outline text-brand-dark rounded-xl text-[11px] font-bold flex items-center gap-2 shadow-2xs"
                    >
                      <span>{name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustom(name)}
                        className="text-slate-400 hover:text-rose-500 transition focus:outline-none"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action trigger footer */}
          <div className="pt-4 border-t border-brand-outline/60 mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 bg-white border border-brand-outline text-brand-muted hover:text-slate-700 hover:bg-slate-50 font-sans font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
            >
              Cancel / Exit
            </button>
            <button
              onClick={handleFinish}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 bg-brand-primary text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
            >
              {isSubmitting ? 'Configuring Study Space...' : 'Finish Setup & Enter'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
