import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const USERS_KEY = 'app_users';
const SESSION_KEY = 'app_session';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LocalUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

export interface Session {
  id: string;
  email: string;
  name: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const hashPassword = async (password: string): Promise<string> => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password,
  );
};

const readUsers = async (): Promise<LocalUser[]> => {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as LocalUser[]) : [];
  } catch {
    return [];
  }
};

const writeUsers = async (users: LocalUser[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Failed to write users to storage.');
  }
};

// ── Public API ────────────────────────────────────────────────────────────────

export const signup = async ({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}): Promise<Session> => {
  try {
    const users = await readUsers();

    const exists = users.find(
      u => u.email.toLowerCase() === email.toLowerCase(),
    );
    if (exists) throw new Error('An account with this email already exists.');

    const passwordHash = await hashPassword(password);
    const newUser: LocalUser = {
      id: Date.now().toString(),
      name,
      email,
      passwordHash,
    };
    users.push(newUser);
    await writeUsers(users);

    const session: Session = {id: newUser.id, email, name};
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    return session;
  } catch (err) {
    // Re-throw meaningful errors as-is; wrap unexpected ones
    if (err instanceof Error) throw err;
    throw new Error('Signup failed. Please try again.');
  }
};

export const login = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<Session> => {
  try {
    const users = await readUsers();

    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase(),
    );
    if (!user) throw new Error('No account found with this email.');

    const passwordHash = await hashPassword(password);
    if (passwordHash !== user.passwordHash)
      throw new Error('Incorrect password.');

    const session: Session = {
      id: user.id,
      email: user.email,
      name: user.name,
    };
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    return session;
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Login failed. Please try again.');
  }
};

export const logout = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch {
    // Silently ignore — session is effectively cleared on app side
  }
};

export const getSession = async (): Promise<Session | null> => {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
};
