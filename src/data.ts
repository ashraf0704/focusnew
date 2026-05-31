import { Subject, Task, FlashcardDeck, Badge } from './types';

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'subj-math',
    name: 'Advanced Calculus',
    color: 'bg-[#E9EDC9] border-[#5A5A40]/10 text-[#5A5A40]',
    accentColor: '#5A5A40',
    iconName: 'Percent',
  },
  {
    id: 'subj-cs',
    name: 'Computer Architecture',
    color: 'bg-[#CCD5AE]/20 border-[#CCD5AE]/50 text-[#4A4A3A]',
    accentColor: '#4A4A3A',
    iconName: 'Cpu',
  },
  {
    id: 'subj-design',
    name: 'Interface Design & UX',
    color: 'bg-[#F2E9E1] border-[#D4A373]/30 text-[#B87D4B]',
    accentColor: '#D4A373',
    iconName: 'LayoutGrid',
  },
  {
    id: 'subj-writing',
    name: 'Academic Writing & Literature',
    color: 'bg-[#FEFAE0] border-[#E9EDC9] text-[#7E7E63]',
    accentColor: '#7E7E63',
    iconName: 'PenTool',
  },
  {
    id: 'subj-general',
    name: 'Autonomous Study',
    color: 'bg-[#FDFCFB] border-brand-soft-border/80 text-brand-muted',
    accentColor: '#5A5A40',
    iconName: 'Bookmark',
  },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Solve double integration exercise set 4B',
    completed: false,
    subjectId: 'subj-math',
    priority: 'high',
    dueDate: '2026-05-22',
  },
  {
    id: 'task-2',
    title: 'Implement bitwise operations module in Rust/C',
    completed: true,
    subjectId: 'subj-cs',
    priority: 'medium',
    dueDate: '2026-05-21',
  },
  {
    id: 'task-3',
    title: 'Prototype wireframes for Focus Mode dashboard layout',
    completed: false,
    subjectId: 'subj-design',
    priority: 'high',
    dueDate: '2026-05-23',
  },
  {
    id: 'task-4',
    title: 'Read section 2.3 on Spaced Repetition benefits',
    completed: false,
    subjectId: 'subj-general',
    priority: 'low',
    dueDate: '2026-05-24',
  },
  {
    id: 'task-5',
    title: 'Draft thesis outline and review bibliography guidelines',
    completed: false,
    subjectId: 'subj-writing',
    priority: 'medium',
    dueDate: '2026-05-25',
  },
];

export const INITIAL_DECKS: FlashcardDeck[] = [
  {
    id: 'deck-1',
    name: 'Limits & Series',
    subjectId: 'subj-math',
    description: 'Fundamental calculus sequences, L\'Hôpital\'s Rule, and convergence criteria.',
    cards: [
      {
        id: 'card-1-1',
        deckId: 'deck-1',
        question: 'What is the definition of absolute convergence of a series?',
        answer: 'A series ∑ a_n is absolutely convergent if the series of absolute values ∑ |a_n| converges.',
      },
      {
        id: 'card-1-2',
        deckId: 'deck-1',
        question: 'Under what conditions is L\'Hôpital\'s Rule valid?',
        answer: 'When evaluating the limit of f(x)/g(x) results in an indeterminate form (0/0 or ∞/∞), and both functions are differentiable with g\'(x) ≠ 0 near the limit point.',
      },
      {
        id: 'card-1-3',
        deckId: 'deck-1',
        question: 'What does the Ratio Test determine for convergence?',
        answer: 'It checks the limit L = lim_{n→∞} |a_{n+1}/a_n|. If L < 1, the series converges absolutely. If L > 1, the series diverges. If L = 1, the test is inconclusive.',
      },
    ],
  },
  {
    id: 'deck-2',
    name: 'CPU Assembly & Cache',
    subjectId: 'subj-cs',
    description: 'Instruction sets, assembly mnemonics, multi-level caches (L1, L2, L3) and cache-hits.',
    cards: [
      {
        id: 'card-2-1',
        deckId: 'deck-2',
        question: 'What is the utility of a Cache-Line tag?',
        answer: 'A Cache-Line tag stores the address prefix of memory associated with that cache entry, so the controller confirms if there is a cache hit.',
      },
      {
        id: 'card-2-2',
        deckId: 'deck-2',
        question: 'Explain the spatial locality of CPU caches.',
        answer: 'Spatial locality is the tendency of a processor to access memory locations close to recently accessed locations (e.g., contiguous blocks or arrays).',
      },
    ],
  },
  {
    id: 'deck-3',
    name: 'Fitts\'s Law & Grids',
    subjectId: 'subj-design',
    description: 'Visual ergonomics, touch targets, hierarchy grids, and user flow alignment.',
    cards: [
      {
        id: 'card-3-1',
        deckId: 'deck-3',
        question: 'State Fitts\'s Law in simple terms.',
        answer: 'The time required to move to a target is a function of the target\'s distance and size. Larger and closer targets are faster and easier to select.',
      },
      {
        id: 'card-3-2',
        deckId: 'deck-3',
        question: 'What is the optimal layout grid frequency for responsive alignment?',
        answer: 'The 8pt grid system. It uses increments of 8px to define sizes, spacing, margins, and layouts consistently.',
      },
    ],
  },
];

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'badge-1',
    title: 'First Step Clear',
    description: 'Complete one Focus session or standard task.',
    iconName: 'Compass',
    unlocked: true,
    unlockedAt: '2026-05-21T10:00:00Z',
    criteria: 'sessions:1',
  },
  {
    id: 'badge-2',
    title: 'Streak Starter',
    description: 'Keep study consistency for at least 2 days.',
    iconName: 'Flame',
    unlocked: false,
    criteria: 'streak:2',
  },
  {
    id: 'badge-3',
    title: 'Focus Pioneer',
    description: 'Accumulate 50 minutes of deep study focus.',
    iconName: 'Zap',
    unlocked: false,
    criteria: 'minutes:50',
  },
  {
    id: 'badge-4',
    title: 'Deck Scholar',
    description: 'Perfect score on any active flashcard deck quiz.',
    iconName: 'CheckCircle2',
    unlocked: false,
    criteria: 'quiz:perfect',
  },
  {
    id: 'badge-5',
    title: 'Breathing Artisan',
    description: 'Open and follow a full visual breathing guide loop.',
    iconName: 'Wind',
    unlocked: false,
    criteria: 'breathing:1',
  },
];
