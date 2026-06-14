import {Badge, CollegeFile, FlashcardDeck, StudySessionLog, Subject, Task, UserProfile, VaultFolder} from './types';
import { INITIAL_SUBJECTS, INITIAL_TASKS, INITIAL_DECKS, INITIAL_BADGES } from './data';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const JWT_KEY = 'focus_buddy_jwt';

export const getJwt = () => localStorage.getItem(JWT_KEY);
export const setJwt = (jwt: string) => localStorage.setItem(JWT_KEY, jwt);
export const clearJwt = () => {
  localStorage.removeItem(JWT_KEY);
  localStorage.removeItem('focus_buddy_is_simulated');
};

const STORAGE_KEYS = {
  PROFILE: 'focus_buddy_sim_profile',
  SUBJECTS: 'focus_buddy_sim_subjects',
  TASKS: 'focus_buddy_sim_tasks',
  DECKS: 'focus_buddy_sim_decks',
  LOGS: 'focus_buddy_sim_logs',
  BADGES: 'focus_buddy_sim_badges',
  FOLDERS: 'focus_buddy_sim_folders',
  FILES: 'focus_buddy_sim_files',
};

function getLocalItem<T>(key: string, defaultValue: T): T {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return defaultValue;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

let isSimulatedActive = localStorage.getItem('focus_buddy_is_simulated') === 'true';
export const isSimulated = () => isSimulatedActive;

type ApiOptions = RequestInit & {auth?: boolean};

async function handleSimulatedOfflineRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  isSimulatedActive = true;
  localStorage.setItem('focus_buddy_is_simulated', 'true');

  const method = options.method || 'GET';
  const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};

  // Sign Up
  if (path === '/api/auth/signup' && method === 'POST') {
    const { email, fullName, dailyGoal } = body;
    const profile: UserProfile = {
      email,
      fullName: fullName || email.split('@')[0],
      streak: 1,
      totalFocusMinutes: 0,
      sessionsCount: 0,
      dailyGoalMinutes: dailyGoal || 25,
      buddyPoints: 250,
      buddySpecies: 'fox',
    };
    setLocalItem(STORAGE_KEYS.PROFILE, profile);
    getLocalItem(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
    getLocalItem(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    getLocalItem(STORAGE_KEYS.DECKS, INITIAL_DECKS);
    getLocalItem(STORAGE_KEYS.BADGES, INITIAL_BADGES);
    return { jwt: 'simulated-offline-jwt-token', profile } as unknown as T;
  }

  // Sign In
  if (path === '/api/auth/signin' && method === 'POST') {
    const { email } = body;
    let profile: UserProfile = getLocalItem(STORAGE_KEYS.PROFILE, null as any);
    if (!profile || profile.email !== email) {
      profile = {
        email,
        fullName: email.split('@')[0],
        streak: 1,
        totalFocusMinutes: 0,
        sessionsCount: 0,
        dailyGoalMinutes: 25,
        buddyPoints: 250,
        buddySpecies: 'fox',
      };
      setLocalItem(STORAGE_KEYS.PROFILE, profile);
    }
    return { jwt: 'simulated-offline-jwt-token', profile } as unknown as T;
  }

  // Guest Sign In
  if (path === '/api/auth/guest' && method === 'POST') {
    let profile: UserProfile = getLocalItem(STORAGE_KEYS.PROFILE, null as any);
    if (!profile || profile.email !== 'guest@focusbuddy.local') {
      profile = {
        email: 'guest@focusbuddy.local',
        fullName: 'Guest Student',
        streak: 1,
        totalFocusMinutes: 0,
        sessionsCount: 0,
        dailyGoalMinutes: 25,
        buddyPoints: 250,
        buddySpecies: 'fox',
      };
      setLocalItem(STORAGE_KEYS.PROFILE, profile);
    }
    return { jwt: 'simulated-offline-jwt-token', profile } as unknown as T;
  }

  // Sign Out / Reset Password
  if (path === '/api/auth/signout' && method === 'POST') {
    return {} as T;
  }
  if (path === '/api/auth/reset-password' && method === 'POST') {
    return { ok: true } as unknown as T;
  }

  // Profile
  if (path === '/api/profile' && method === 'GET') {
    const profile = getLocalItem(STORAGE_KEYS.PROFILE, {
      email: 'student@focusbuddy.local',
      fullName: 'Offline Student',
      streak: 1,
      totalFocusMinutes: 0,
      sessionsCount: 0,
      dailyGoalMinutes: 25,
      buddyPoints: 250,
      buddySpecies: 'fox',
    });
    const subjects = getLocalItem(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
    const tasks = getLocalItem(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    const decks = getLocalItem(STORAGE_KEYS.DECKS, INITIAL_DECKS);
    const badges = getLocalItem(STORAGE_KEYS.BADGES, INITIAL_BADGES);
    const sessionLogs = getLocalItem(STORAGE_KEYS.LOGS, []);
    return {
      profile,
      subjects,
      tasks,
      decks,
      badges,
      sessionLogs,
    } as unknown as T;
  }

  if (path === '/api/profile' && method === 'PATCH') {
    const profile = getLocalItem(STORAGE_KEYS.PROFILE, {} as UserProfile);
    const updated = { ...profile, ...body };
    setLocalItem(STORAGE_KEYS.PROFILE, updated);
    return updated as unknown as T;
  }

  if (path === '/api/profile/buddy-points' && method === 'PATCH') {
    const profile = getLocalItem(STORAGE_KEYS.PROFILE, {} as UserProfile);
    const currentPoints = profile.buddyPoints ?? 250;
    profile.buddyPoints = Math.max(0, currentPoints - (body.deduct || 0));
    setLocalItem(STORAGE_KEYS.PROFILE, profile);
    return profile as unknown as T;
  }

  if (path.startsWith('/api/profile/push-subscription')) {
    const profile = getLocalItem(STORAGE_KEYS.PROFILE, {} as UserProfile);
    return profile as unknown as T;
  }

  // Tasks
  if (path === '/api/tasks' && method === 'POST') {
    const tasks = getLocalItem<Task[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    const newTask: Task = {
      id: `task-sim-${Date.now()}`,
      title: body.title,
      completed: false,
      subjectId: body.subjectId,
      priority: body.priority || 'medium',
      dueDate: body.dueDate || new Date().toISOString().split('T')[0],
    };
    tasks.unshift(newTask);
    setLocalItem(STORAGE_KEYS.TASKS, tasks);
    return newTask as unknown as T;
  }

  if (path.match(/^\/api\/tasks\/[^/]+\/toggle$/) && method === 'PATCH') {
    const taskId = path.split('/')[3];
    const tasks = getLocalItem<Task[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    let updatedTask: Task | null = null;
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        updatedTask = { ...t, completed: !t.completed };
        return updatedTask;
      }
      return t;
    });
    setLocalItem(STORAGE_KEYS.TASKS, updatedTasks);
    return updatedTask as unknown as T;
  }

  if (path.match(/^\/api\/tasks\/[^/]+$/) && method === 'DELETE') {
    const taskId = path.split('/')[3];
    const tasks = getLocalItem<Task[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    const filtered = tasks.filter(t => t.id !== taskId);
    setLocalItem(STORAGE_KEYS.TASKS, filtered);
    return {} as T;
  }

  // Subjects
  if (path === '/api/subjects' && method === 'POST') {
    const subjects = getLocalItem<Subject[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
    const newSubject: Subject = {
      id: `subj-sim-${Date.now()}`,
      name: body.name,
      color: body.color || 'bg-slate-100 border-slate-300 text-slate-700',
      accentColor: body.accentColor || '#64748b',
      iconName: body.iconName || 'Bookmark',
    };
    subjects.push(newSubject);
    setLocalItem(STORAGE_KEYS.SUBJECTS, subjects);
    return newSubject as unknown as T;
  }
  if (path.startsWith('/api/subjects/') && method === 'DELETE') {
    const subjectId = path.split('/')[3];
    const subjects = getLocalItem<Subject[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
    const filtered = subjects.filter(s => s.id !== subjectId);
    setLocalItem(STORAGE_KEYS.SUBJECTS, filtered);
    return {} as T;
  }

  // Decks
  if (path === '/api/decks' && method === 'POST') {
    const decks = getLocalItem<FlashcardDeck[]>(STORAGE_KEYS.DECKS, INITIAL_DECKS);
    const newDeck: FlashcardDeck = {
      id: body.id || `deck-sim-${Date.now()}`,
      name: body.name,
      subjectId: body.subjectId,
      description: body.description,
      cards: body.cards || [],
    };
    decks.unshift(newDeck);
    setLocalItem(STORAGE_KEYS.DECKS, decks);
    return newDeck as unknown as T;
  }

  if (path.match(/^\/api\/decks\/[^/]+\/cards\/[^/]+$/) && method === 'PATCH') {
    const parts = path.split('/');
    const deckId = parts[3];
    const cardId = parts[5];
    const decks = getLocalItem<FlashcardDeck[]>(STORAGE_KEYS.DECKS, INITIAL_DECKS);
    const updatedDecks = decks.map(d => {
      if (d.id === deckId) {
        return {
          ...d,
          cards: d.cards.map(c => {
            if (c.id === cardId) {
              return { ...c, difficultyRating: body.difficultyRating };
            }
            return c;
          }),
        };
      }
      return d;
    });
    setLocalItem(STORAGE_KEYS.DECKS, updatedDecks);
    return {} as T;
  }

  // Sessions
  if (path === '/api/sessions' && method === 'POST') {
    const logs = getLocalItem<StudySessionLog[]>(STORAGE_KEYS.LOGS, []);
    const profile = getLocalItem<UserProfile>(STORAGE_KEYS.PROFILE, {} as UserProfile);

    const duration = body.durationMinutes || 0;
    const pointsEarned = body.completed ? Math.round(duration * 10) : Math.round(duration * 2);

    const newLog: StudySessionLog = {
      id: `log-sim-${Date.now()}`,
      timestamp: new Date().toISOString(),
      durationMinutes: duration,
      subjectId: body.subjectId,
      mode: body.mode || 'pomodoro',
      completed: body.completed || false,
    };
    logs.unshift(newLog);
    setLocalItem(STORAGE_KEYS.LOGS, logs);

    profile.totalFocusMinutes = (profile.totalFocusMinutes || 0) + duration;
    profile.sessionsCount = (profile.sessionsCount || 0) + 1;
    profile.buddyPoints = (profile.buddyPoints || 0) + pointsEarned;
    profile.streak = profile.streak || 1;
    setLocalItem(STORAGE_KEYS.PROFILE, profile);

    return {
      log: newLog,
      profile,
      pointsEarned,
    } as unknown as T;
  }

  // Badges
  if (path.match(/^\/api\/badges\/[^/]+\/unlock$/) && method === 'POST') {
    const badgeId = path.split('/')[3];
    const badges = getLocalItem<Badge[]>(STORAGE_KEYS.BADGES, INITIAL_BADGES);
    let updatedBadge: Badge | null = null;
    const updatedBadges = badges.map(b => {
      if (b.id === badgeId) {
        updatedBadge = { ...b, unlocked: true, unlockedAt: new Date().toISOString() };
        return updatedBadge;
      }
      return b;
    });
    setLocalItem(STORAGE_KEYS.BADGES, updatedBadges);
    return updatedBadge as unknown as T;
  }

  // Vault Folders
  if (path === '/api/vault/folders') {
    if (method === 'GET') {
      return getLocalItem(STORAGE_KEYS.FOLDERS, []) as unknown as T;
    }
    if (method === 'POST') {
      const folders = getLocalItem<VaultFolder[]>(STORAGE_KEYS.FOLDERS, []);
      const newFolder: VaultFolder = {
        id: `folder-sim-${Date.now()}`,
        name: body.name,
        color: body.color || '#CCD5AE',
        createdAt: new Date().toISOString(),
      };
      folders.push(newFolder);
      setLocalItem(STORAGE_KEYS.FOLDERS, folders);
      return newFolder as unknown as T;
    }
  }

  if (path.match(/^\/api\/vault\/folders\/[^/]+$/) && method === 'DELETE') {
    const folderId = path.split('/')[4];
    const folders = getLocalItem<VaultFolder[]>(STORAGE_KEYS.FOLDERS, []);
    const filtered = folders.filter(f => f.id !== folderId);
    setLocalItem(STORAGE_KEYS.FOLDERS, filtered);
    const files = getLocalItem<CollegeFile[]>(STORAGE_KEYS.FILES, []);
    const remainingFiles = files.filter(f => f.folderId !== folderId);
    setLocalItem(STORAGE_KEYS.FILES, remainingFiles);
    return {} as T;
  }

  // Vault Files
  if (path.startsWith('/api/vault/files')) {
    const files = getLocalItem<CollegeFile[]>(STORAGE_KEYS.FILES, []);
    if (method === 'GET') {
      const urlObj = new URL(path, 'http://localhost');
      const folderId = urlObj.searchParams.get('folderId');
      if (folderId) {
        return files.filter(f => f.folderId === folderId) as unknown as T;
      }
      return files as unknown as T;
    }
    if (path.includes('/upload') && method === 'POST') {
      const newFile: CollegeFile = {
        id: `file-sim-${Date.now()}`,
        name: 'Simulated File.pdf',
        type: 'pdf',
        size: '1.2 MB',
        createdAt: new Date().toISOString(),
        url: '#',
      };
      files.unshift(newFile);
      setLocalItem(STORAGE_KEYS.FILES, files);
      return newFile as unknown as T;
    }
  }

  if (path.match(/^\/api\/vault\/files\/[^/]+$/) && method === 'DELETE') {
    const fileId = path.split('/')[4];
    const files = getLocalItem<CollegeFile[]>(STORAGE_KEYS.FILES, []);
    const filtered = files.filter(f => f.id !== fileId);
    setLocalItem(STORAGE_KEYS.FILES, filtered);
    return {} as T;
  }

  // Payments
  if (path === '/api/payments/create-order' && method === 'POST') {
    const profile = getLocalItem<UserProfile>(STORAGE_KEYS.PROFILE, {} as UserProfile);
    return {
      orderId: `order-sim-${Date.now()}`,
      amount: body.planId === 'pro' ? 29900 : 59900,
      currency: 'INR',
      keyId: 'rzp_test_simulated',
      pointsApplied: body.applyPoints ? 100 : 0,
      profile,
    } as unknown as T;
  }

  if (path === '/api/payments/verify' && method === 'POST') {
    const profile = getLocalItem<UserProfile>(STORAGE_KEYS.PROFILE, {} as UserProfile);
    return profile as unknown as T;
  }

  return {} as T;
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (options.auth !== false) {
    const jwt = getJwt();
    if (jwt) headers.set('Authorization', `Bearer ${jwt}`);
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {...options, headers});
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      if (path === '/api/auth/guest') {
        console.warn(`Guest auth failed (${res.status}). Falling back to local guest mode.`);
        return handleSimulatedOfflineRequest<T>(path, options);
      }
      // For auth routes (sign in / sign up), always throw so the user sees the real error
      if (path.startsWith('/api/auth')) {
        throw new Error(payload.error || `Request failed with ${res.status}`);
      }
      // For all other routes (profile, tasks, etc.) fall back to simulated mode on any error
      console.warn(`Server error (${res.status}) on ${path}. Falling back to local offline simulation mode.`);
      return handleSimulatedOfflineRequest<T>(path, options);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  } catch (error) {
    if (error instanceof TypeError || (error instanceof Error && error.message.includes('fetch'))) {
      console.warn(`API server offline. Falling back to local offline simulation mode for: ${path}`);
      return handleSimulatedOfflineRequest<T>(path, options);
    }
    throw error;
  }
}


export interface BootPayload {
  profile: UserProfile;
  subjects: Subject[];
  tasks: Task[];
  decks: FlashcardDeck[];
  sessionLogs: StudySessionLog[];
  badges: Badge[];
}

export const api = {
  signUp: (body: {fullName: string; email: string; password: string; dailyGoal: number}) =>
    request<{jwt: string; profile: UserProfile}>('/api/auth/signup', {method: 'POST', body: JSON.stringify(body), auth: false}),
  signIn: (body: {email: string; password: string}) =>
    request<{jwt: string; profile: UserProfile}>('/api/auth/signin', {method: 'POST', body: JSON.stringify(body), auth: false}),
  guestSignIn: () =>
    request<{jwt: string; profile: UserProfile}>('/api/auth/guest', {method: 'POST', auth: false}),
  signOut: () => request<void>('/api/auth/signout', {method: 'POST'}),
  resetPassword: (email: string) =>
    request<{ok: true}>('/api/auth/reset-password', {method: 'POST', body: JSON.stringify({email}), auth: false}),
  boot: () => request<BootPayload>('/api/profile'),
  updateProfile: (body: Partial<UserProfile>) =>
    request<UserProfile>('/api/profile', {method: 'PATCH', body: JSON.stringify(body)}),
  deductBuddyPoints: (deduct: number) =>
    request<UserProfile>('/api/profile/buddy-points', {method: 'PATCH', body: JSON.stringify({deduct})}),
  savePushSubscription: (subscription: PushSubscriptionJSON) =>
    request<UserProfile>('/api/profile/push-subscription', {method: 'POST', body: JSON.stringify(subscription)}),
  deletePushSubscription: () => request<UserProfile>('/api/profile/push-subscription', {method: 'DELETE'}),
  addTask: (body: {title: string; subjectId: string; priority: string; dueDate: string}) =>
    request<Task>('/api/tasks', {method: 'POST', body: JSON.stringify(body)}),
  toggleTask: (id: string) => request<Task>(`/api/tasks/${id}/toggle`, {method: 'PATCH'}),
  deleteTask: (id: string) => request<void>(`/api/tasks/${id}`, {method: 'DELETE'}),
  addSubject: (body: {name: string; color: string; accentColor: string; iconName: string}) =>
    request<Subject>('/api/subjects', {method: 'POST', body: JSON.stringify(body)}),
  deleteSubject: (id: string) =>
    request<void>(`/api/subjects/${id}`, {method: 'DELETE'}),
  addDeck: (deck: FlashcardDeck) => request<FlashcardDeck>('/api/decks', {method: 'POST', body: JSON.stringify(deck)}),
  updateCardDifficulty: (deckId: string, cardId: string, difficultyRating: string) =>
    request(`/api/decks/${deckId}/cards/${cardId}`, {method: 'PATCH', body: JSON.stringify({difficultyRating})}),
  finishSession: (body: {durationMinutes: number; subjectId: string; mode: string; completed: boolean; focusScore: number}) =>
    request<{log: StudySessionLog; profile: UserProfile; pointsEarned: number}>('/api/sessions', {method: 'POST', body: JSON.stringify(body)}),
  unlockBadge: (id: string) => request<Badge>(`/api/badges/${id}/unlock`, {method: 'POST'}),
  listVaultFolders: () => request<VaultFolder[]>('/api/vault/folders'),
  createVaultFolder: (body: {name: string; color: string}) =>
    request<VaultFolder>('/api/vault/folders', {method: 'POST', body: JSON.stringify(body)}),
  deleteVaultFolder: (id: string) => request<void>(`/api/vault/folders/${id}`, {method: 'DELETE'}),
  listVaultFiles: (folderId?: string | null) =>
    request<CollegeFile[]>(`/api/vault/files${folderId ? `?folderId=${encodeURIComponent(folderId)}` : ''}`),
  uploadVaultFile: (formData: FormData) =>
    request<CollegeFile>('/api/vault/files/upload', {method: 'POST', body: formData}),
  deleteVaultFile: (id: string) => request<void>(`/api/vault/files/${id}`, {method: 'DELETE'}),
  createPaymentOrder: (body: {planId: 'pro' | 'guru'; billingCycle: 'monthly' | 'yearly'; applyPoints: boolean}) =>
    request<{orderId?: string; amount: number; currency: 'INR'; keyId: string; pointsApplied: number; profile?: UserProfile}>(
      '/api/payments/create-order',
      {method: 'POST', body: JSON.stringify(body)}
    ),
  verifyPayment: (body: Record<string, unknown>) =>
    request<UserProfile>('/api/payments/verify', {method: 'POST', body: JSON.stringify(body)}),
};

export async function streamAIChat(
  body: Record<string, unknown>,
  onToken: (token: string) => void,
): Promise<void> {
  const headers = new Headers({'Content-Type': 'application/json'});
  const jwt = getJwt();
  if (jwt) headers.set('Authorization', `Bearer ${jwt}`);

  const res = await fetch(`${API_BASE}/api/ai/chat`, {method: 'POST', headers, body: JSON.stringify(body)});
  if (!res.ok || !res.body) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || 'AI request failed');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const {value, done} = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, {stream: true});
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';
    for (const event of events) {
      const line = event.split('\n').find(item => item.startsWith('data: '));
      if (!line) continue;
      const data = line.slice(6);
      if (data === '[DONE]') return;
      const parsed = JSON.parse(data);
      if (parsed.token) onToken(parsed.token);
    }
  }
}

export function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64Safe);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}
