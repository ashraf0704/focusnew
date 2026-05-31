import {create} from 'zustand';
import {Badge, FlashcardDeck, StudySessionLog, Subject, Task} from '@/types';

interface AppState {
  subjects: Subject[];
  tasks: Task[];
  decks: FlashcardDeck[];
  sessionLogs: StudySessionLog[];
  badges: Badge[];
  selectedSubjectId: string;
  hydrate: (data: Partial<Pick<AppState, 'subjects' | 'tasks' | 'decks' | 'sessionLogs' | 'badges'>>) => void;
  setSelectedSubjectId: (id: string) => void;
  addTask: (task: Task) => void;
  setTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  addSubject: (subject: Subject) => void;
  addDeck: (deck: FlashcardDeck) => void;
  addSessionLog: (log: StudySessionLog) => void;
  unlockBadge: (badge: Badge) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  subjects: [],
  tasks: [],
  decks: [],
  sessionLogs: [],
  badges: [],
  selectedSubjectId: '',
  hydrate: data => set(state => ({...state, ...data, selectedSubjectId: data.subjects?.[0]?.id || state.selectedSubjectId})),
  setSelectedSubjectId: selectedSubjectId => set({selectedSubjectId}),
  addTask: task => set(state => ({tasks: [task, ...state.tasks]})),
  setTask: task => set(state => ({tasks: state.tasks.map(item => (item.id === task.id ? task : item))})),
  deleteTask: id => set(state => ({tasks: state.tasks.filter(task => task.id !== id)})),
  addSubject: subject => set(state => ({subjects: [...state.subjects, subject], selectedSubjectId: subject.id})),
  addDeck: deck => set(state => ({decks: [deck, ...state.decks]})),
  addSessionLog: log => set(state => ({sessionLogs: [log, ...state.sessionLogs]})),
  unlockBadge: badge => set(state => ({badges: state.badges.map(item => (item.id === badge.id ? badge : item))})),
}));
