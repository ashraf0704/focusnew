export interface Subject {
  id: string;
  name: string;
  color: string; // Tailwind color class name or hex
  accentColor: string;
  iconName: string; // Lucide icon identifier
}

export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  subjectId: string;
  priority: Priority;
  dueDate: string;
}

export interface Flashcard {
  id: string;
  deckId: string;
  question: string;
  answer: string;
  difficultyRating?: 'easy' | 'medium' | 'hard';
}

export interface FlashcardDeck {
  id: string;
  name: string;
  subjectId: string;
  description: string;
  cards: Flashcard[];
}

export interface StudySessionLog {
  id: string;
  timestamp: string; // ISO String
  durationMinutes: number;
  subjectId: string;
  mode: 'pomodoro' | 'custom';
  completed: boolean;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  unlocked: boolean;
  unlockedAt?: string;
  criteria: string;
}

export interface UserProfile {
  email: string;
  fullName: string;
  avatarUrl?: string;
  streak: number;
  totalFocusMinutes: number;
  sessionsCount: number;
  dailyGoalMinutes: number;
  buddyPoints?: number;
  buddySpecies?: string;
  alarmTone?: string;
  soundVolume?: number;
  notificationsEnabled?: boolean;
}

export interface VaultFolder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface CollegeFile {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'image' | 'code' | 'zip';
  size: string;
  folderId?: string;
  url?: string;
  createdAt: string;
  textContent?: string;
}
