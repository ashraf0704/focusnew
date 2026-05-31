import {Badge, CollegeFile, FlashcardDeck, StudySessionLog, Subject, Task, UserProfile, VaultFolder} from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const JWT_KEY = 'focus_buddy_jwt';

export const getJwt = () => localStorage.getItem(JWT_KEY);
export const setJwt = (jwt: string) => localStorage.setItem(JWT_KEY, jwt);
export const clearJwt = () => localStorage.removeItem(JWT_KEY);

type ApiOptions = RequestInit & {auth?: boolean};

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (options.auth !== false) {
    const jwt = getJwt();
    if (jwt) headers.set('Authorization', `Bearer ${jwt}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {...options, headers});
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || `Request failed with ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
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
