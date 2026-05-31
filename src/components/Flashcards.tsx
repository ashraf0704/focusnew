import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, FolderPlus, Compass, ArrowRight, CornerDownRight, RotateCw, Plus, Trash, Check, HelpCircle, CheckCircle2, ChevronLeft, Award } from 'lucide-react';
import { Subject, FlashcardDeck, Flashcard } from '../types';

interface FlashcardsProps {
  subjects: Subject[];
  decks: FlashcardDeck[];
  onAddDeck: (deck: FlashcardDeck) => void;
  onUnlockBadge: (badgeId: string) => void;
}

export default function Flashcards({
  subjects,
  decks,
  onAddDeck,
  onUnlockBadge,
}: FlashcardsProps) {
  // Navigation & Study States
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizScore, setQuizScore] = useState<Record<string, 'easy'|'medium'|'hard'>>({});

  // Creator state
  const [showCreator, setShowCreator] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [newDeckSubjectId, setNewDeckSubjectId] = useState(subjects[0]?.id || '');
  const [newCardsList, setNewCardsList] = useState<{ question: string; answer: string }[]>([
    { question: '', answer: '' },
  ]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const startQuiz = (deck: FlashcardDeck) => {
    setSelectedDeck(deck);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setQuizFinished(false);
    setQuizScore({});
  };

  const handleCardRating = (rating: 'easy'|'medium'|'hard') => {
    if (!selectedDeck) return;
    const cardId = selectedDeck.cards[currentCardIndex].id;
    setQuizScore(prev => ({ ...prev, [cardId]: rating }));

    if (currentCardIndex + 1 < selectedDeck.cards.length) {
      setIsFlipped(false);
      // Let flip-back animation finish slightly before changing index
      setTimeout(() => {
        setCurrentCardIndex(prev => prev + 1);
      }, 150);
    } else {
      setQuizFinished(true);
      // Evaluate if perfect score (all graded Easy) to reward the scholar badge
      const scores = Object.values({ ...quizScore, [cardId]: rating });
      const easyCount = scores.filter(s => s === 'easy').length;
      if (easyCount === selectedDeck.cards.length) {
        onUnlockBadge('badge-4'); // Scholar Achievement
      }
    }
  };

  const handleAddCardRow = () => {
    setNewCardsList(prev => [...prev, { question: '', answer: '' }]);
  };

  const handleCardRowChange = (index: number, field: 'question' | 'answer', value: string) => {
    setNewCardsList(prev => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const handleRemoveCardRow = (index: number) => {
    if (newCardsList.length <= 1) return;
    setNewCardsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateDeckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName) return;

    const deckId = `deck-${Date.now()}`;
    const cleanCards: Flashcard[] = newCardsList
      .filter(c => c.question.trim() && c.answer.trim())
      .map((c, i) => ({
        id: `card-${deckId}-${i}`,
        deckId,
        question: c.question.trim(),
        answer: c.answer.trim(),
      }));

    if (cleanCards.length === 0) {
      alert('Please add at least one complete question & answer pair.');
      return;
    }

    const createdDeck: FlashcardDeck = {
      id: deckId,
      name: newDeckName,
      subjectId: newDeckSubjectId,
      description: newDeckDesc || 'Custom study cards folder',
      cards: cleanCards,
    };

    onAddDeck(createdDeck);

    // Reset and exit
    setNewDeckName('');
    setNewDeckDesc('');
    setNewCardsList([{ question: '', answer: '' }]);
    setShowCreator(false);
  };

  return (
    <div className="space-y-6" id="flashcards-deck-wrapper">
      <AnimatePresence mode="wait">
        {selectedDeck ? (
          /* ACTIVE revision deck quiz overlay screen */
          <motion.div
            key="quiz-deck-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-6 bg-white border border-brand-outline rounded-3xl shadow-sm space-y-6"
          >
            {/* Header toolbar */}
            <div className="flex justify-between items-center pb-4 border-b border-brand-outline">
              <button
                onClick={() => setSelectedDeck(null)}
                className="flex items-center gap-1.5 text-xs font-bold text-brand-muted hover:text-brand-primary transition"
              >
                <ChevronLeft size={16} />
                Return to Decks
              </button>
              <div className="font-sans font-bold text-sm text-brand-dark">
                {selectedDeck.name} ({currentCardIndex + 1}/{selectedDeck.cards.length})
              </div>
            </div>

            {!quizFinished ? (
              <div className="flex flex-col items-center space-y-6">
                {/* Visual Flashcard Flip Container */}
                <div 
                  className="w-full max-w-[400px] h-60 cursor-pointer select-none group relative perspective-1000"
                  onClick={handleFlip}
                >
                  <div className={`w-full h-full duration-500 rounded-3xl border transition-all text-center flex flex-col justify-between p-6 ${
                    isFlipped 
                      ? 'bg-[#E9EDC9]/25 border-[#CCD5AE]' 
                      : 'bg-white border-brand-outline hover:border-brand-primary shadow-sm'
                  }`}>
                    {/* Corner badge direction indicator */}
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-sans font-black text-brand-primary tracking-wider uppercase bg-[#E9EDC9]/30 px-2.5 py-1 rounded-full">
                        {isFlipped ? 'Reveal Answer' : 'Question Card'}
                      </span>
                      <RotateCw size={14} className="text-brand-muted group-hover:rotate-45 transition-transform" />
                    </div>

                    {/* Centered content queries */}
                    <div className="py-2 px-1">
                      <p className="font-sans font-semibold text-lg sm:text-lg text-brand-dark leading-7">
                        {isFlipped 
                          ? selectedDeck.cards[currentCardIndex].answer 
                          : selectedDeck.cards[currentCardIndex].question}
                      </p>
                    </div>

                    <p className="text-[11px] text-brand-muted font-bold italic">
                      {isFlipped ? 'Click card to see question' : 'Click card to verify answer'}
                    </p>
                  </div>
                </div>

                {/* Score rating triggers (only visible when flipped answer) */}
                <div className="w-full max-w-[400px] text-center space-y-3">
                  <span className="text-xs font-bold text-brand-muted uppercase tracking-widest block">
                    How well did you recall this card?
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleCardRating('easy')}
                      className="py-3 px-2 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition shadow-sm active:scale-95"
                    >
                      😊 Easy
                    </button>
                    <button
                      onClick={() => handleCardRating('medium')}
                      className="py-3 px-2 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition shadow-sm active:scale-95"
                    >
                      😐 Medium
                    </button>
                    <button
                      onClick={() => handleCardRating('hard')}
                      className="py-3 px-2 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition shadow-sm active:scale-95"
                    >
                      🥵 Hard
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Quiz Score Result */
              <div className="text-center py-8 space-y-6 max-w-[420px] mx-auto">
                <div className="w-16 h-16 rounded-full bg-[#E9EDC9]/30 flex items-center justify-center text-brand-primary mx-auto">
                  <CheckCircle2 size={36} className="animate-bounce" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-2xl text-brand-dark">Revision Completed!</h3>
                  <p className="text-xs text-brand-muted mt-1.5 leading-5">
                    Way to go! Consistently self-quizzing reinforces long-term information retrieval and speeds up learning.
                  </p>
                </div>

                {/* Simulated review scorecard breakdown details */}
                <div className="p-4 bg-brand-bg border border-brand-outline rounded-2xl text-left space-y-2 text-xs text-brand-muted">
                  <div className="flex justify-between font-bold text-brand-dark border-b border-brand-outline pb-1.5 mb-1.5">
                    <span>Performance Rating</span>
                    <span>Count</span>
                  </div>
                  <div className="flex justify-between">
                    <span>😊 Easy Recalls (Perfect)</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {Object.values(quizScore).filter(v => v === 'easy').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>😐 Medium (Requires attention)</span>
                    <span className="font-mono font-bold text-amber-600">
                      {Object.values(quizScore).filter(v => v === 'medium').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>🥵 Hard Recalls (Study again soon)</span>
                    <span className="font-mono font-bold text-rose-600">
                      {Object.values(quizScore).filter(v => v === 'hard').length}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setSelectedDeck(null)}
                    className="px-5 py-2.5 rounded-xl border border-brand-outline hover:bg-brand-bg text-xs font-bold text-brand-muted transition"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => startQuiz(selectedDeck)}
                    className="px-5 py-2.5 rounded-xl bg-brand-primary text-white hover:opacity-90 text-xs font-bold transition shadow-md"
                  >
                    Study Again
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ) : showCreator ? (
          /* DECK BUILDER FORM VIEW */
          <motion.form
            key="deck-creator-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onSubmit={handleCreateDeckSubmit}
            className="p-6 bg-white border border-brand-outline rounded-3xl shadow-sm space-y-5"
            id="deck-builder-panel"
          >
            <div className="flex justify-between items-center pb-3 border-b border-brand-outline">
              <h3 className="font-sans font-bold text-lg text-brand-dark flex items-center gap-1.5">
                <FolderPlus size={20} className="text-brand-primary" />
                Build Custom Study Deck
              </h3>
              <button
                type="button"
                onClick={() => setShowCreator(false)}
                className="text-xs text-brand-muted hover:text-brand-dark font-bold focus:outline-none"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-muted">Deck Folder Name</label>
                <input
                  type="text"
                  placeholder="e.g. Newton Laws of Motion"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-outline text-xs focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none transition"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-muted">Related Subject Course</label>
                <select
                  value={newDeckSubjectId}
                  onChange={(e) => setNewDeckSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-outline bg-white text-xs focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none transition"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-muted">Description / Study Intent</label>
              <input
                type="text"
                placeholder="Briefly describe what these cards will evaluate..."
                value={newDeckDesc}
                onChange={(e) => setNewDeckDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-outline text-xs focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none transition"
              />
            </div>

            <div className="space-y-3.5 pt-2">
              <div className="flex justify-between items-center bg-brand-bg border-y border-brand-outline py-2 px-1">
                <span className="text-xs font-bold text-brand-muted tracking-wide uppercase">Question & Answer Catalog</span>
                <button
                  type="button"
                  onClick={handleAddCardRow}
                  className="text-xs font-bold text-brand-primary hover:text-brand-vibrant flex items-center gap-1 focus:outline-none"
                >
                  <Plus size={14} />
                  Add Row
                </button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {newCardsList.map((card, i) => (
                  <div key={i} className="flex gap-2 items-start bg-[#E9EDC9]/10 p-3 rounded-2xl border border-brand-outline">
                    <span className="text-xs font-mono font-bold text-brand-muted mt-3">#{i + 1}</span>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <input
                        type="text"
                        placeholder="Interrogative question..."
                        value={card.question}
                        onChange={(e) => handleCardRowChange(i, 'question', e.target.value)}
                        className="p-2.5 bg-white rounded-xl border border-brand-outline text-xs outline-none focus:border-brand-primary"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Absolute correct answer..."
                        value={card.answer}
                        onChange={(e) => handleCardRowChange(i, 'answer', e.target.value)}
                        className="p-2.5 bg-white rounded-xl border border-brand-outline text-xs outline-none focus:border-brand-primary"
                        required
                      />
                    </div>
                    {newCardsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCardRow(i)}
                        className="text-brand-muted hover:text-rose-500 p-2 focus:outline-none"
                        title="Remove Card row"
                      >
                        <Trash size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3.5 pt-4">
              <button
                type="button"
                onClick={() => setShowCreator(false)}
                className="px-4 py-2.5 border border-brand-outline rounded-xl text-xs font-bold text-brand-muted hover:bg-brand-bg transition"
              >
                Discard
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-bold hover:opacity-95 transition shadow-md"
              >
                Compile and Deploy Deck
              </button>
            </div>
          </motion.form>
        ) : (
          /* PRIMARY DECKS DIRECTORY SECTOR */
          <motion.div
            key="decks-catalog-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Folder Header Row */}
            <div className="flex justify-between items-center bg-[#CCD5AE]/20 border border-[#5A5A40]/10 p-6 rounded-3xl shadow-sm">
              <div>
                <h3 className="font-sans font-bold text-xl text-brand-dark">Study Revision Folders</h3>
                <p className="text-xs text-brand-muted mt-1 pr-4">
                  Boost storage retrieval and trigger active muscle memory through spaced interval cards.
                </p>
              </div>

              <button
                onClick={() => setShowCreator(true)}
                className="px-4 py-3 rounded-xl bg-brand-primary hover:opacity-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all duration-300 select-none whitespace-nowrap pointer-events-auto"
                id="create-deck-trigger-btn"
              >
                <FolderPlus size={15} />
                New Study Deck
              </button>
            </div>

            {/* List grid of Decks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="decks-visual-list">
              {decks.map(deck => {
                const sub = subjects.find(s => s.id === deck.subjectId) || subjects[subjects.length - 1];
                return (
                  <div
                    key={deck.id}
                    className="p-5 bg-white border border-brand-outline rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase truncate max-w-[150px] ${sub.color}`}>
                          {sub.name}
                        </span>
                        <div className="text-[10px] font-bold text-brand-primary bg-[#E9EDC9]/35 border border-[#5A5A40]/10 px-2 py-0.5 rounded">
                          {deck.cards.length} Cards
                        </div>
                      </div>

                      <div>
                        <h4 className="font-sans font-bold text-base text-brand-dark tracking-tight leading-5">
                          {deck.name}
                        </h4>
                        <p className="text-xs text-brand-muted mt-1.5 leading-5 line-clamp-3 min-h-[40px]">
                          {deck.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-brand-outline flex justify-end">
                      <button
                        onClick={() => startQuiz(deck)}
                        className="py-2 px-4 rounded-xl bg-brand-bg text-brand-primary hover:bg-brand-primary hover:text-white text-xs font-bold transition flex items-center gap-1 select-none pointer-events-auto"
                      >
                        Start Review
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
