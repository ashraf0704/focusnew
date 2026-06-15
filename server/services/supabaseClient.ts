import {createClient} from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LocalDbQueryBuilder, mockAuth } from './localDb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || '';
const anonKey = process.env.SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

let isDatabaseOffline = false;

// Direct check on startup to determine if we should fall back to local JSON database
if (!supabaseUrl || !anonKey) {
  console.warn('Supabase env vars are missing. API routes will fail back to local simulation mode.');
  isDatabaseOffline = true;
} else {
  // Test connection to Supabase host
  try {
    const parsedUrl = new URL(supabaseUrl);
    // Since dns lookup can hang or fail synchronously, let's do a quick fetch check
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const check = await fetch(`${parsedUrl.origin}/health`, {
      method: 'GET',
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeoutId);
    
    if (!check || !check.ok) {
      console.warn(`Could not connect to Supabase at ${supabaseUrl}. Falling back to local simulated database.`);
      isDatabaseOffline = true;
    } else {
      console.log('Supabase database connectivity verified. Running in Cloud Database mode.');
    }
  } catch (err) {
    console.warn(`Supabase connection test failed. Running in local simulated database mode.`, err);
    isDatabaseOffline = true;
  }
}

const realSupabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', anonKey || 'placeholder', {
  auth: {persistSession: false, autoRefreshToken: false},
});

const realSupabaseAdmin = createClient(supabaseUrl || 'https://placeholder.supabase.co', serviceRoleKey || 'placeholder', {
  auth: {persistSession: false, autoRefreshToken: false},
});

// Mock Storage simulation layer
const mockStorage = {
  from: (bucket: string) => ({
    upload: async (storagePath: string, buffer: Buffer, options: any) => {
      try {
        const targetPath = path.resolve(__dirname, '../../public/vault-files', storagePath);
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, buffer);
        return { data: { path: storagePath }, error: null };
      } catch (err) {
        console.error('Local storage upload simulation failed:', err);
        return { data: null, error: err };
      }
    },
    getPublicUrl: (storagePath: string) => {
      return { data: { publicUrl: `/vault-files/${storagePath}` } };
    },
    remove: async (paths: string[]) => {
      try {
        for (const p of paths) {
          const targetPath = path.resolve(__dirname, '../../public/vault-files', p);
          if (fs.existsSync(targetPath)) {
            fs.unlinkSync(targetPath);
          }
        }
        return { data: null, error: null };
      } catch (err) {
        return { data: null, error: err };
      }
    }
  })
};

// Proxied handlers for transparent fallback routing
const clientHandler = (realClient: any) => ({
  get(target: any, prop: string, receiver: any) {
    if (isDatabaseOffline) {
      if (prop === 'from') {
        return (table: string) => new LocalDbQueryBuilder(table);
      }
      if (prop === 'auth') {
        return mockAuth;
      }
      if (prop === 'storage') {
        return mockStorage;
      }
    }
    return Reflect.get(target, prop, receiver);
  }
});

export const supabase = new Proxy(realSupabase, clientHandler(realSupabase));
export const supabaseAdmin = new Proxy(realSupabaseAdmin, clientHandler(realSupabaseAdmin));

