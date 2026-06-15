import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../data/localDb.json');

// Ensure database file and directory exist
function ensureDbFile() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(
      DB_PATH,
      JSON.stringify({
        users: [],
        user_profiles: [],
        subjects: [],
        tasks: [],
        flashcard_decks: [],
        flashcards: [],
        study_session_logs: [],
        user_badges: [],
        vault_folders: [],
        vault_files: []
      }, null, 2),
      'utf8'
    );
  }
}

export function readDb(): any {
  ensureDbFile();
  try {
    const content = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Failed to read localDb.json, returning empty structure.', err);
    return {
      users: [],
      user_profiles: [],
      subjects: [],
      tasks: [],
      flashcard_decks: [],
      flashcards: [],
      study_session_logs: [],
      user_badges: [],
      vault_folders: [],
      vault_files: []
    };
  }
}

export function writeDb(data: any) {
  ensureDbFile();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write localDb.json', err);
  }
}

function generateUuid() {
  return 'local-uuid-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Seed helper for simulated guest/normal users
export function seedUserDefaults(userId: string, email: string, db: any) {
  // 1. Seed user_profile if missing
  const profileExists = db.user_profiles.some((p: any) => p.id === userId);
  if (!profileExists) {
    db.user_profiles.push({
      id: userId,
      email,
      full_name: email.split('@')[0],
      avatar_url: null,
      streak: 1,
      total_focus_minutes: 0,
      sessions_count: 0,
      daily_goal_minutes: 25,
      buddy_points: 250,
      buddy_species: 'fox',
      alarm_tone: 'singing-bowl',
      sound_volume: 75,
      notifications_enabled: true,
      subscription_plan: 'free',
      created_at: new Date().toISOString()
    });
  }

  // 2. Seed default subjects
  const subjectsExist = db.subjects.some((s: any) => s.user_id === userId);
  if (!subjectsExist) {
    const subMathId = generateUuid();
    const subCsId = generateUuid();
    const subDesignId = generateUuid();
    const subWritingId = generateUuid();
    const subGenId = generateUuid();

    db.subjects.push(
      { id: subMathId, user_id: userId, name: 'Advanced Calculus', color: 'bg-[#E9EDC9] border-[#5A5A40]/10 text-[#5A5A40]', accent_color: '#5A5A40', icon_name: 'Percent', created_at: new Date().toISOString() },
      { id: subCsId, user_id: userId, name: 'Computer Architecture', color: 'bg-[#CCD5AE]/20 border-[#CCD5AE]/50 text-[#4A4A3A]', accent_color: '#4A4A3A', icon_name: 'Cpu', created_at: new Date().toISOString() },
      { id: subDesignId, user_id: userId, name: 'Interface Design & UX', color: 'bg-[#F2E9E1] border-[#D4A373]/30 text-[#B87D4B]', accent_color: '#D4A373', icon_name: 'LayoutGrid', created_at: new Date().toISOString() },
      { id: subWritingId, user_id: userId, name: 'Academic Writing & Literature', color: 'bg-[#FEFAE0] border-[#E9EDC9] text-[#7E7E63]', accent_color: '#7E7E63', icon_name: 'PenTool', created_at: new Date().toISOString() },
      { id: subGenId, user_id: userId, name: 'Autonomous Study', color: 'bg-[#FDFCFB] border-brand-soft-border/80 text-brand-muted', accent_color: '#5A5A40', icon_name: 'Bookmark', created_at: new Date().toISOString() }
    );

    // Seed default tasks
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(); dayAfter.setDate(dayAfter.getDate() + 2);
    const threeDays = new Date(); threeDays.setDate(threeDays.getDate() + 3);
    const fourDays = new Date(); fourDays.setDate(fourDays.getDate() + 4);

    db.tasks.push(
      { id: generateUuid(), user_id: userId, subject_id: subMathId, title: 'Solve double integration exercise set 4B', completed: false, priority: 'high', due_date: tomorrow.toISOString().split('T')[0], created_at: new Date().toISOString() },
      { id: generateUuid(), user_id: userId, subject_id: subCsId, title: 'Implement bitwise operations module in Rust/C', completed: true, priority: 'medium', due_date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
      { id: generateUuid(), user_id: userId, subject_id: subDesignId, title: 'Prototype wireframes for Focus Mode dashboard layout', completed: false, priority: 'high', due_date: dayAfter.toISOString().split('T')[0], created_at: new Date().toISOString() },
      { id: generateUuid(), user_id: userId, subject_id: subGenId, title: 'Read section 2.3 on Spaced Repetition benefits', completed: false, priority: 'low', due_date: threeDays.toISOString().split('T')[0], created_at: new Date().toISOString() },
      { id: generateUuid(), user_id: userId, subject_id: subWritingId, title: 'Draft thesis outline and review bibliography guidelines', completed: false, priority: 'medium', due_date: fourDays.toISOString().split('T')[0], created_at: new Date().toISOString() }
    );
  }

  // 3. Seed default folders
  const foldersExist = db.vault_folders.some((f: any) => f.user_id === userId);
  if (!foldersExist) {
    db.vault_folders.push(
      { id: generateUuid(), user_id: userId, name: 'Mid-Term Projects', color: 'indigo', created_at: new Date().toISOString() },
      { id: generateUuid(), user_id: userId, name: 'Study Notes & Revision Sheets', color: 'emerald', created_at: new Date().toISOString() },
      { id: generateUuid(), user_id: userId, name: 'CSE-201 Coding Labs', color: 'amber', created_at: new Date().toISOString() }
    );
  }

  // 4. Seed default badges
  const badgesExist = db.user_badges.some((b: any) => b.user_id === userId);
  if (!badgesExist) {
    db.user_badges.push(
      { id: generateUuid(), user_id: userId, badge_key: 'badge-1', title: 'First Step Clear', description: 'Complete one Focus session or standard task.', icon_name: 'Compass', criteria: 'sessions:1', unlocked: false, unlocked_at: null },
      { id: generateUuid(), user_id: userId, badge_key: 'badge-2', title: 'Streak Starter', description: 'Keep study consistency for at least 2 days.', icon_name: 'Flame', criteria: 'streak:2', unlocked: false, unlocked_at: null },
      { id: generateUuid(), user_id: userId, badge_key: 'badge-3', title: 'Focus Pioneer', description: 'Accumulate 50 minutes of deep study focus.', icon_name: 'Zap', criteria: 'minutes:50', unlocked: false, unlocked_at: null },
      { id: generateUuid(), user_id: userId, badge_key: 'badge-4', title: 'Deck Scholar', description: 'Perfect score on any active flashcard deck quiz.', icon_name: 'CheckCircle2', criteria: 'quiz:perfect', unlocked: false, unlocked_at: null },
      { id: generateUuid(), user_id: userId, badge_key: 'badge-5', title: 'Breathing Artisan', description: 'Open and follow a full visual breathing guide loop.', icon_name: 'Wind', criteria: 'breathing:1', unlocked: false, unlocked_at: null }
    );
  }
}

export class LocalDbQueryBuilder {
  private table: string;
  private filters: Array<{ field: string; op: 'eq' | 'not' | 'gte'; value: any }> = [];
  private orderCol?: string;
  private orderAscending = true;
  private limitVal?: number;
  private singleRow = false;
  private action: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private payload: any = null;
  private upsertConflictKey?: string;

  constructor(table: string) {
    this.table = table;
  }

  select(cols = '*') {
    // Only switch to 'select' if this is the primary operation (no insert/update/upsert/delete set yet).
    // When chained after insert/update/upsert/delete (e.g. .insert({}).select().single()),
    // it should be a no-op so the original action is preserved and its result is returned.
    if (this.action === 'select') {
      this.action = 'select';
    }
    return this;
  }

  insert(payload: any) {
    this.action = 'insert';
    this.payload = payload;
    return this;
  }

  upsert(payload: any, options?: { onConflict?: string }) {
    this.action = 'upsert';
    this.payload = payload;
    this.upsertConflictKey = options?.onConflict;
    return this;
  }

  update(payload: any) {
    this.action = 'update';
    this.payload = payload;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, op: 'eq', value });
    return this;
  }

  not(field: string, op: string, value: any) {
    this.filters.push({ field, op: 'not', value });
    return this;
  }

  gte(field: string, value: any) {
    this.filters.push({ field, op: 'gte', value });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderCol = field;
    this.orderAscending = options?.ascending !== false;
    return this;
  }

  limit(val: number) {
    this.limitVal = val;
    return this;
  }

  single() {
    this.singleRow = true;
    return this;
  }

  // To support awaiting
  async then(resolve: any, reject: any) {
    try {
      const result = await this.execute();
      resolve(result);
    } catch (err) {
      reject(err);
    }
  }

  async execute() {
    const db = readDb();
    if (!db[this.table]) {
      db[this.table] = [];
    }
    const collection = db[this.table];

    if (this.action === 'select') {
      let data = [...collection];

      // Apply filters
      for (const filter of this.filters) {
        data = data.filter((row: any) => {
          const val = row[filter.field];
          if (filter.op === 'eq') {
            return String(val) === String(filter.value);
          } else if (filter.op === 'not') {
            // Handle specific case like .not('push_subscription', 'is', null)
            if (filter.value === null) {
              return val !== null && val !== undefined;
            }
            return String(val) !== String(filter.value);
          } else if (filter.op === 'gte') {
            return new Date(val) >= new Date(filter.value);
          }
          return true;
        });
      }

      // Apply order
      if (this.orderCol) {
        data.sort((a: any, b: any) => {
          const valA = a[this.orderCol!];
          const valB = b[this.orderCol!];
          if (valA < valB) return this.orderAscending ? -1 : 1;
          if (valA > valB) return this.orderAscending ? 1 : -1;
          return 0;
        });
      }

      // Apply limit
      if (this.limitVal !== undefined) {
        data = data.slice(0, this.limitVal);
      }

      if (this.singleRow) {
        if (data.length === 0) {
          return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
        }
        return { data: data[0], error: null };
      }

      return { data, error: null };
    }

    if (this.action === 'insert') {
      const payloads = Array.isArray(this.payload) ? this.payload : [this.payload];
      const inserted: any[] = [];

      for (const p of payloads) {
        const newRow = {
          id: p.id || generateUuid(),
          created_at: new Date().toISOString(),
          ...p
        };
        collection.push(newRow);
        inserted.push(newRow);
      }

      writeDb(db);

      if (this.singleRow || !Array.isArray(this.payload)) {
        return { data: inserted[0], error: null };
      }
      return { data: inserted, error: null };
    }

    if (this.action === 'upsert') {
      const payloads = Array.isArray(this.payload) ? this.payload : [this.payload];
      const upserted: any[] = [];
      const conflictKey = this.upsertConflictKey || 'id';

      for (const p of payloads) {
        const conflictValue = p[conflictKey];
        const existingIndex = conflictValue !== undefined
          ? collection.findIndex((row: any) => String(row[conflictKey]) === String(conflictValue))
          : -1;

        if (existingIndex >= 0) {
          // Update existing
          collection[existingIndex] = {
            ...collection[existingIndex],
            ...p,
            updated_at: new Date().toISOString()
          };
          upserted.push(collection[existingIndex]);
        } else {
          // Insert new
          const newRow = {
            id: p.id || generateUuid(),
            created_at: new Date().toISOString(),
            ...p
          };
          collection.push(newRow);
          upserted.push(newRow);
        }
      }

      writeDb(db);

      if (this.singleRow || !Array.isArray(this.payload)) {
        return { data: upserted[0], error: null };
      }
      return { data: upserted, error: null };
    }

    if (this.action === 'update') {
      let updatedCount = 0;
      const updatedRows: any[] = [];

      for (let i = 0; i < collection.length; i++) {
        const row = collection[i];
        let matches = true;

        for (const filter of this.filters) {
          const val = row[filter.field];
          if (filter.op === 'eq') {
            if (String(val) !== String(filter.value)) matches = false;
          } else if (filter.op === 'not') {
            if (filter.value === null) {
              if (val === null || val === undefined) matches = false;
            } else if (String(val) === String(filter.value)) {
              matches = false;
            }
          } else if (filter.op === 'gte') {
            if (new Date(val) < new Date(filter.value)) matches = false;
          }
        }

        if (matches) {
          collection[i] = {
            ...row,
            ...this.payload,
            updated_at: new Date().toISOString()
          };
          updatedRows.push(collection[i]);
          updatedCount++;
        }
      }

      if (updatedCount > 0) {
        writeDb(db);
      }

      if (this.singleRow) {
        return { data: updatedRows[0] || null, error: updatedRows.length === 0 ? { message: 'Not found' } : null };
      }
      return { data: updatedRows, error: null };
    }

    if (this.action === 'delete') {
      const originalLength = collection.length;
      const keptRows = collection.filter((row: any) => {
        let matches = true;
        for (const filter of this.filters) {
          const val = row[filter.field];
          if (filter.op === 'eq') {
            if (String(val) !== String(filter.value)) matches = false;
          } else if (filter.op === 'not') {
            if (filter.value === null) {
              if (val === null || val === undefined) matches = false;
            } else if (String(val) === String(filter.value)) {
              matches = false;
            }
          } else if (filter.op === 'gte') {
            if (new Date(val) < new Date(filter.value)) matches = false;
          }
        }
        return !matches; // Keep rows that DO NOT match delete filters
      });

      if (keptRows.length !== originalLength) {
        db[this.table] = keptRows;
        writeDb(db);
      }

      return { data: null, error: null };
    }

    return { data: null, error: { message: 'Invalid action' } };
  }
}

// Mock the Auth endpoints to support simulation completely
export const mockAuth = {
  signInWithPassword: async ({ email, password }: any) => {
    const db = readDb();
    let user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      // Auto create for ease of development/testing
      user = { id: generateUuid(), email, password };
      db.users.push(user);
      writeDb(db);
    }
    seedUserDefaults(user.id, email, db);
    writeDb(db);

    return {
      data: {
        session: { access_token: `simulated-jwt-${user.id}` },
        user: { id: user.id, email: user.email, user_metadata: { full_name: email.split('@')[0] } }
      },
      error: null
    };
  },

  admin: {
    createUser: async ({ email, password, user_metadata }: any) => {
      const db = readDb();
      const existing = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return { data: { user: null }, error: { message: 'User already exists' } };
      }
      const user = {
        id: generateUuid(),
        email,
        password,
        user_metadata
      };
      db.users.push(user);
      seedUserDefaults(user.id, email, db);
      writeDb(db);

      return { data: { user }, error: null };
    },

    listUsers: async ({ page = 1, perPage = 100 }: any) => {
      const db = readDb();
      const users = db.users.map((u: any) => ({
        id: u.id,
        email: u.email,
        user_metadata: u.user_metadata || { full_name: u.email.split('@')[0] }
      }));
      return { data: { users }, error: null };
    },

    updateUserById: async (id: string, attributes: any) => {
      const db = readDb();
      const userIndex = db.users.findIndex((u: any) => u.id === id);
      if (userIndex === -1) {
        return { data: { user: null }, error: { message: 'User not found' } };
      }
      db.users[userIndex] = {
        ...db.users[userIndex],
        ...attributes,
        user_metadata: {
          ...db.users[userIndex].user_metadata,
          ...attributes.user_metadata
        }
      };
      writeDb(db);
      return { data: { user: db.users[userIndex] }, error: null };
    }
  },

  getUser: async (token: string) => {
    const userId = token.replace('Bearer ', '').replace('simulated-jwt-', '');
    const db = readDb();
    const user = db.users.find((u: any) => u.id === userId);
    if (!user) {
      // Default fallback offline student
      return {
        data: {
          user: {
            id: 'simulated-user-id-fallback',
            email: 'offline-student@focusbuddy.local',
            user_metadata: { full_name: 'Offline Student' }
          }
        },
        error: null
      };
    }
    return {
      data: {
        user: {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata || { full_name: user.email.split('@')[0] }
        }
      },
      error: null
    };
  }
};
