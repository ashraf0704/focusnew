import {Badge, CollegeFile, FlashcardDeck, StudySessionLog, Subject, Task, UserProfile, VaultFolder} from '../../src/types.js';

export function profileFromRow(row: any): UserProfile {
  return {
    email: row.email,
    fullName: row.full_name || row.email?.split('@')[0] || 'Student',
    avatarUrl: row.avatar_url,
    streak: row.streak || 0,
    totalFocusMinutes: row.total_focus_minutes || 0,
    sessionsCount: row.sessions_count || 0,
    dailyGoalMinutes: row.daily_goal_minutes || 25,
    buddyPoints: row.buddy_points ?? 250,
    buddySpecies: row.buddy_species || 'fox',
    alarmTone: row.alarm_tone || 'singing-bowl',
    soundVolume: row.sound_volume ?? 75,
    notificationsEnabled: row.notifications_enabled ?? true,
    language: row.language || 'en',
  };
}

export const subjectFromRow = (row: any): Subject => ({
  id: row.id,
  name: row.name,
  color: row.color,
  accentColor: row.accent_color,
  iconName: row.icon_name,
});

export const taskFromRow = (row: any): Task => ({
  id: row.id,
  title: row.title,
  completed: row.completed,
  subjectId: row.subject_id,
  priority: row.priority,
  dueDate: row.due_date,
});

export const deckFromRows = (deck: any, cards: any[]): FlashcardDeck => ({
  id: deck.id,
  name: deck.name,
  subjectId: deck.subject_id,
  description: deck.description || '',
  cards: cards.map(card => ({
    id: card.id,
    deckId: card.deck_id,
    question: card.question,
    answer: card.answer,
    difficultyRating: card.difficulty_rating,
  })),
});

export const sessionFromRow = (row: any): StudySessionLog => ({
  id: row.id,
  timestamp: row.timestamp,
  durationMinutes: row.duration_minutes,
  subjectId: row.subject_id,
  mode: row.mode,
  completed: row.completed,
});

export const badgeFromRow = (row: any): Badge => ({
  id: row.badge_key,
  title: row.title,
  description: row.description,
  iconName: row.icon_name,
  unlocked: row.unlocked,
  unlockedAt: row.unlocked_at || undefined,
  criteria: row.criteria,
});

export const folderFromRow = (row: any): VaultFolder => ({
  id: row.id,
  name: row.name,
  color: row.color,
  createdAt: row.created_at,
});

export const fileFromRow = (row: any): CollegeFile => ({
  id: row.id,
  name: row.name,
  type: row.type,
  size: row.size,
  folderId: row.folder_id || undefined,
  url: row.url || undefined,
  createdAt: row.created_at,
  textContent: row.text_content || undefined,
});
