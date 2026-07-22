import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const USERS_KEY = 'app_users';
const SESSION_KEY = 'app_session';

const hashPassword = async (password) => {
  try {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password
    );
  } catch (err) {
    throw new Error('Password hashing failed.');
  }
};

export const signup = async ({ name, email, password }) => {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    const users = raw ? JSON.parse(raw) : [];

    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) throw new Error('An account with this email already exists.');

    const passwordHash = await hashPassword(password);
    const newUser = { id: Date.now().toString(), name, email, passwordHash };
    users.push(newUser);
    
    try {
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch {
      throw new Error('Failed to save user database.');
    }

    const session = { id: newUser.id, email, name };
    try {
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    } catch {
      throw new Error('Failed to save session data.');
    }

    return session;
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Signup failed.');
  }
};

export const login = async ({ email, password }) => {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    const users = raw ? JSON.parse(raw) : [];

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('No account found with this email.');

    const passwordHash = await hashPassword(password);
    if (passwordHash !== user.passwordHash) throw new Error('Incorrect password.');

    const session = { id: user.id, email: user.email, name: user.name };
    try {
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    } catch {
      throw new Error('Failed to save session data.');
    }

    return session;
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error('Login failed.');
  }
};

export const logout = async () => {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch (err) {
    // Silently ignore or log
  }
};

export const getSession = async () => {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
