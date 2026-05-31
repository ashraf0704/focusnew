import axios, {AxiosRequestConfig} from 'axios';
import * as SecureStore from 'expo-secure-store';
import {router} from 'expo-router';
import {BootPayload, CollegeFile, FlashcardDeck, StudySessionLog, Subject, Task, UserProfile, VaultFolder} from '@/types';

export const JWT_KEY = 'focus_buddy_jwt';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000',
  timeout: 30000,
});

api.interceptors.request.use(async config => {
  const jwt = await SecureStore.getItemAsync(JWT_KEY);
  if (jwt) {
    config.headers.Authorization = `Bearer ${jwt}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response.data,
  async error => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync(JWT_KEY);
      router.replace('/(auth)/welcome');
    }
    if (error.response?.data?.error) {
      return Promise.reject(new Error(error.response.data.error));
    }
    return Promise.reject(error);
  },
);

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  return api.request<unknown, T>(config);
}

export const endpoints = {
  signUp: (body: {fullName: string; email: string; password: string; dailyGoal: number}) =>
    request<{jwt: string; profile: UserProfile}>({url: '/api/auth/signup', method: 'POST', data: body}),
  signIn: (body: {email: string; password: string}) =>
    request<{jwt: string; profile: UserProfile}>({url: '/api/auth/signin', method: 'POST', data: body}),
  guestSignIn: () => request<{jwt: string; profile: UserProfile}>({url: '/api/auth/guest', method: 'POST'}),
  signOut: () => request<void>({url: '/api/auth/signout', method: 'POST'}),
  resetPassword: (email: string) => request<{ok: true}>({url: '/api/auth/reset-password', method: 'POST', data: {email}}),
  boot: () => request<BootPayload>({url: '/api/profile'}),
  updateProfile: (data: Partial<UserProfile>) => request<UserProfile>({url: '/api/profile', method: 'PATCH', data}),
  savePushSubscription: (data: unknown) => request<UserProfile>({url: '/api/profile/push-subscription', method: 'POST', data}),
  deletePushSubscription: () => request<UserProfile>({url: '/api/profile/push-subscription', method: 'DELETE'}),
  addTask: (data: {title: string; subjectId: string; priority: string; dueDate: string}) =>
    request<Task>({url: '/api/tasks', method: 'POST', data}),
  toggleTask: (id: string) => request<Task>({url: `/api/tasks/${id}/toggle`, method: 'PATCH'}),
  deleteTask: (id: string) => request<void>({url: `/api/tasks/${id}`, method: 'DELETE'}),
  addSubject: (data: {name: string; color: string; accentColor: string; iconName: string}) =>
    request<Subject>({url: '/api/subjects', method: 'POST', data}),
  addDeck: (data: Partial<FlashcardDeck>) => request<FlashcardDeck>({url: '/api/decks', method: 'POST', data}),
  updateCardDifficulty: (deckId: string, cardId: string, difficultyRating: string) =>
    request<void>({url: `/api/decks/${deckId}/cards/${cardId}`, method: 'PATCH', data: {difficultyRating}}),
  finishSession: (data: {durationMinutes: number; subjectId: string; mode: string; completed: boolean; focusScore: number}) =>
    request<{log: StudySessionLog; profile: UserProfile; pointsEarned: number}>({url: '/api/sessions', method: 'POST', data}),
  unlockBadge: (id: string) => request({url: `/api/badges/${id}/unlock`, method: 'POST'}),
  createVaultFolder: (data: {name: string; color: string}) => request<VaultFolder>({url: '/api/vault/folders', method: 'POST', data}),
  listVaultFolders: () => request<VaultFolder[]>({url: '/api/vault/folders'}),
  deleteVaultFolder: (id: string) => request<void>({url: `/api/vault/folders/${id}`, method: 'DELETE'}),
  listVaultFiles: (folderId?: string | null) =>
    request<CollegeFile[]>({url: `/api/vault/files${folderId ? `?folderId=${encodeURIComponent(folderId)}` : ''}`}),
  uploadVaultFile: (data: FormData) => request<CollegeFile>({url: '/api/vault/files/upload', method: 'POST', data, headers: {'Content-Type': 'multipart/form-data'}}),
  deleteVaultFile: (id: string) => request<void>({url: `/api/vault/files/${id}`, method: 'DELETE'}),
  generateFlashcards: (data: {subjectName: string; contextText?: string; count?: number}) =>
    request<{cards: Array<{question: string; answer: string}>}>({url: '/api/ai/generate-flashcards', method: 'POST', data}),
  createPaymentOrder: (data: {planId: 'pro' | 'guru'; billingCycle: 'monthly' | 'yearly'; applyPoints: boolean}) =>
    request<{orderId?: string; amount: number; currency: 'INR'; keyId: string; pointsApplied: number; profile?: UserProfile}>({
      url: '/api/payments/create-order',
      method: 'POST',
      data,
    }),
  verifyPayment: (data: Record<string, unknown>) => request<UserProfile>({url: '/api/payments/verify', method: 'POST', data}),
};

export async function streamAIChat(body: Record<string, unknown>, onToken: (token: string) => void) {
  const jwt = await SecureStore.getItemAsync(JWT_KEY);
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000'}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(jwt ? {Authorization: `Bearer ${jwt}`} : {}),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok || !response.body) throw new Error('AI stream failed.');

  const reader = response.body.getReader();
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
