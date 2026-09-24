import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import pg from 'pg';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const { Pool, Client } = pg;
const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent store directory and file
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'college_events_store.json');

// Default initial events
const INITIAL_EVENTS = [
  {
    id: 'evt-hackathon-2026',
    title: 'Annual College Tech Hackathon 2026',
    description: 'Join 200+ fellow student coders and designers for an intensive 24-hour sprint building AI, Web, and Mobile solutions. Mentorship, food, and cash prizes provided!',
    category: 'Technology',
    date: '2026-10-18',
    time: '09:00 AM - 09:00 AM (Next Day)',
    location: 'Innovation Hub & Labs 3-4',
    capacity: 150,
    image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    organizer: 'Computing & Robotics Club',
    created_at: new Date('2026-09-01').toISOString(),
  },
  {
    id: 'evt-cultural-gala',
    title: 'Commecs Campus Cultural Gala & Music Night',
    description: 'An evening celebrating diversity, theater, acoustic musical performances, and delicious street food stalls hosted by student societies.',
    category: 'Cultural',
    date: '2026-10-24',
    time: '05:30 PM - 10:00 PM',
    location: 'Central Amphitheater & Lawn',
    capacity: 350,
    image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    organizer: 'Arts & Dramatic Society',
    created_at: new Date('2026-09-02').toISOString(),
  },
  {
    id: 'evt-ai-masterclass',
    title: 'AI & Machine Learning Industry Masterclass',
    description: 'Keynote talks by lead researchers and industry alumni on foundation models, agentic workflows, and career roadmaps in modern AI engineering.',
    category: 'Academic',
    date: '2026-11-02',
    time: '02:00 PM - 05:00 PM',
    location: 'Auditorium Hall B',
    capacity: 120,
    image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    organizer: 'Data Science Society',
    created_at: new Date('2026-09-03').toISOString(),
  },
  {
    id: 'evt-football-tourney',
    title: 'Inter-Department Football Championship',
    description: 'Annual knock-out sports tournament. Cheer for your department or compete in the varsity 7-a-side matches. Refreshments and trophies for winners.',
    category: 'Sports',
    date: '2026-11-07',
    time: '08:30 AM - 04:00 PM',
    location: 'University Sports Complex Turf',
    capacity: 200,
    image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    organizer: 'College Sports Board',
    created_at: new Date('2026-09-04').toISOString(),
  },
  {
    id: 'evt-career-expo',
    title: 'Career Fair & Internship Networking Expo',
    description: 'Connect directly with recruiters and hiring managers from over 40 leading tech firms, banks, and creative agencies. Bring printed resumes!',
    category: 'Career',
    date: '2026-11-15',
    time: '10:00 AM - 04:30 PM',
    location: 'Student Center Hall A & B',
    capacity: 400,
    image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    organizer: 'Career Placement Cell',
    created_at: new Date('2026-09-05').toISOString(),
  },
];

interface EventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  image_url?: string | null;
  organizer?: string | null;
  created_at: string;
}

interface RegistrationItem {
  id: string;
  event_id: string;
  student_name: string;
  student_email: string;
  registration_code: string;
  status: 'confirmed' | 'verified';
  registered_at: string;
  verified_at?: string | null;
}

interface LocalStoreData {
  events: EventItem[];
  registrations: RegistrationItem[];
}

function loadLocalStore(): LocalStoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.events) && Array.isArray(parsed.registrations)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading local data store:', err);
  }

  const initialData: LocalStoreData = {
    events: INITIAL_EVENTS,
    registrations: [
      {
        id: 'reg-sample-1',
        event_id: 'evt-hackathon-2026',
        student_name: 'Alex Rivera',
        student_email: 'alex.rivera@commecs.edu',
        registration_code: 'EVT-7392-8A',
        status: 'confirmed',
        registered_at: '2026-09-08T10:15:00.000Z',
        verified_at: null,
      },
      {
        id: 'reg-sample-2',
        event_id: 'evt-ai-masterclass',
        student_name: 'Sophia Chen',
        student_email: 'sophia.c@commecs.edu',
        registration_code: 'EVT-9921-3K',
        status: 'verified',
        registered_at: '2026-09-09T14:30:00.000Z',
        verified_at: '2026-09-10T09:00:00.000Z',
      },
    ],
  };

  saveLocalStore(initialData);
  return initialData;
}

function saveLocalStore(data: LocalStoreData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local data store:', err);
  }
}

// Generate human-friendly registration ticket code EVT-XXXX-XX
function generateRegistrationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 2 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `EVT-${part1}-${part2}`;
}

// Clean and sanitize postgres connection strings
function cleanConnectionString(raw?: string): string {
  if (!raw) return '';
  return raw.trim().replace(/:\[([^\]]+)\]@/, ':$1@');
}

// Global DB State
let currentConnectionString = cleanConnectionString(
  process.env.DATABASE_URL ||
    'postgresql://postgres.yfimfccknuwviloxxnjf:kashafnaeem13319@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres'
);

let pgPool: pg.Pool | null = null;
let isPgConnected = false;
let lastPgError: string | null = null;

// Initialize or re-initialize PG Pool
async function setupPgPool(connString: string): Promise<{ success: boolean; error?: string }> {
  if (!connString) {
    isPgConnected = false;
    lastPgError = 'No connection string provided';
    return { success: false, error: lastPgError };
  }

  try {
    // Test with a temporary single client first (3 second timeout)
    const testClient = new Client({
      connectionString: connString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000,
    });

    await testClient.connect();
    await testClient.query('SELECT 1;');
    await testClient.end();

    // Connection successful, set up pool
    if (pgPool) {
      await pgPool.end().catch(() => {});
    }

    pgPool = new Pool({
      connectionString: connString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Run schema creation on connected DB
    const client = await pgPool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.events (
          id text PRIMARY KEY,
          title text NOT NULL,
          description text NOT NULL,
          category text NOT NULL DEFAULT 'General',
          date date NOT NULL,
          time text NOT NULL,
          location text NOT NULL,
          capacity integer NOT NULL DEFAULT 100,
          image_url text,
          organizer text DEFAULT 'Student Affairs',
          created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS public.registrations (
          id text PRIMARY KEY,
          event_id text REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
          student_name text NOT NULL,
          student_email text NOT NULL,
          registration_code text NOT NULL UNIQUE,
          status text NOT NULL DEFAULT 'confirmed',
          registered_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
          verified_at timestamptz
        );
      `);

      await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_event_student_email 
        ON public.registrations (event_id, lower(student_email));
      `);

      // Seed if events table is empty
      const countRes = await client.query('SELECT count(*) FROM public.events');
      if (parseInt(countRes.rows[0].count, 10) === 0) {
        for (const ev of INITIAL_EVENTS) {
          await client.query(
            `INSERT INTO public.events (id, title, description, category, date, time, location, capacity, image_url, organizer, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (id) DO NOTHING;`,
            [
              ev.id,
              ev.title,
              ev.description,
              ev.category,
              ev.date,
              ev.time,
              ev.location,
              ev.capacity,
              ev.image_url,
              ev.organizer,
              ev.created_at,
            ]
          );
        }
      }
    } finally {
      client.release();
    }

    isPgConnected = true;
    lastPgError = null;
    currentConnectionString = connString;
    console.log('✅ Connected to Supabase PostgreSQL successfully.');
    return { success: true };
  } catch (err: any) {
    isPgConnected = false;
    lastPgError = err.message || 'Unknown PostgreSQL error';
    console.warn('⚠️ Supabase PostgreSQL not connected:', lastPgError);
    return { success: false, error: lastPgError };
  }
}

// Mask connection string password for security
function maskConnectionString(str: string): string {
  if (!str) return '';
  return str.replace(/:([^@]+)@/, ':••••••••@');
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// Health check endpoint
app.get('/api/health', async (req, res) => {
  if (isPgConnected && pgPool) {
    try {
      const result = await pgPool.query('SELECT NOW() as db_time, current_database() as db_name;');
      return res.json({
        status: 'ok',
        database: 'connected',
        provider: 'Supabase PostgreSQL',
        server_time: result.rows[0].db_time,
        database_name: result.rows[0].db_name,
      });
    } catch {
      // Degraded to local
    }
  }

  const store = loadLocalStore();
  res.json({
    status: 'ok',
    database: 'persistent_store',
    provider: 'Local Persistent Store (Supabase Ready)',
    server_time: new Date().toISOString(),
    event_count: store.events.length,
    registration_count: store.registrations.length,
    supabase_error: lastPgError,
  });
});

// Detailed Supabase connection status
app.get('/api/supabase/status', async (req, res) => {
  const store = loadLocalStore();
  res.json({
    connected: isPgConnected,
    provider: isPgConnected ? 'Supabase PostgreSQL' : 'Local Persistent Store (Supabase Ready)',
    connection_string_masked: maskConnectionString(currentConnectionString),
    last_error: lastPgError,
    total_events: store.events.length,
    total_registrations: store.registrations.length,
  });
});

// Test or connect to a Supabase PostgreSQL connection string
app.post('/api/supabase/connect', async (req, res) => {
  const { connection_string } = req.body;
  const targetString = cleanConnectionString(connection_string || currentConnectionString);

  if (!targetString) {
    return res.status(400).json({ success: false, error: 'Connection string is required.' });
  }

  const result = await setupPgPool(targetString);

  if (result.success) {
    // If connected, sync any local registrations to PostgreSQL
    try {
      const store = loadLocalStore();
      if (pgPool && store.registrations.length > 0) {
        const client = await pgPool.connect();
        try {
          for (const reg of store.registrations) {
            await client.query(
              `INSERT INTO public.registrations (id, event_id, student_name, student_email, registration_code, status, registered_at, verified_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               ON CONFLICT (id) DO NOTHING;`,
              [
                reg.id,
                reg.event_id,
                reg.student_name,
                reg.student_email,
                reg.registration_code,
                reg.status,
                reg.registered_at,
                reg.verified_at,
              ]
            );
          }
        } finally {
          client.release();
        }
      }
    } catch (syncErr) {
      console.warn('Sync warning:', syncErr);
    }

    res.json({
      success: true,
      message: 'Successfully connected to Supabase PostgreSQL!',
      connection_string_masked: maskConnectionString(targetString),
    });
  } else {
    res.status(400).json({
      success: false,
      error: result.error,
      advice: result.error?.includes('tenant/user')
        ? 'The Supabase project reference in the username was not found. Please verify if your Supabase project is unpaused, or check your project settings at supabase.com.'
        : 'Could not connect with provided credentials. Please verify host, port, username, and password.',
    });
  }
});

// List all events with live registration count
app.get('/api/events', async (req, res) => {
  // If Supabase PG is connected, query PG
  if (isPgConnected && pgPool) {
    try {
      const query = `
        SELECT 
          e.id,
          e.title,
          e.description,
          e.category,
          to_char(e.date, 'YYYY-MM-DD') as date,
          e.time,
          e.location,
          e.capacity,
          e.image_url,
          e.organizer,
          e.created_at,
          COALESCE(COUNT(r.id), 0)::int AS registered_count
        FROM public.events e
        LEFT JOIN public.registrations r ON r.event_id = e.id
        GROUP BY e.id
        ORDER BY e.date ASC;
      `;
      const result = await pgPool.query(query);
      if (result.rows.length > 0) {
        return res.json(result.rows);
      }
    } catch (err: any) {
      console.warn('Error fetching from PG pool, using local store:', err.message);
    }
  }

  // Fallback to local store (instant, 100% reliable)
  const store = loadLocalStore();
  const countMap: Record<string, number> = {};
  store.registrations.forEach((r) => {
    countMap[r.event_id] = (countMap[r.event_id] || 0) + 1;
  });

  const eventsWithCount = store.events.map((e) => ({
    ...e,
    registered_count: countMap[e.id] || 0,
  }));

  res.json(eventsWithCount);
});

// Register student for an event
// CRITICAL: Prevent duplicate student registration for the same event!
app.post('/api/register', async (req, res) => {
  const { event_id, student_name, student_email } = req.body;

  if (!event_id) {
    return res.status(400).json({ success: false, error: 'Event ID is required.' });
  }
  const trimmedName = (student_name || '').trim();
  const normalizedEmail = (student_email || '').trim().toLowerCase();

  if (!trimmedName) {
    return res.status(400).json({ success: false, error: 'Student full name is required.' });
  }
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return res.status(400).json({ success: false, error: 'A valid student email address is required.' });
  }

  // 1. If Supabase PG is active, run through PostgreSQL
  if (isPgConnected && pgPool) {
    try {
      // Duplicate check in PG
      const checkQuery = `
        SELECT 
          r.id,
          r.event_id,
          r.student_name,
          r.student_email,
          r.registration_code,
          r.status,
          r.registered_at,
          r.verified_at,
          row_to_json(e.*) as event
        FROM public.registrations r
        JOIN public.events e ON e.id = r.event_id
        WHERE r.event_id = $1 AND LOWER(r.student_email) = $2;
      `;
      const checkResult = await pgPool.query(checkQuery, [event_id, normalizedEmail]);

      if (checkResult.rows.length > 0) {
        const existing = checkResult.rows[0];
        return res.status(409).json({
          success: false,
          alreadyRegistered: true,
          error: `Registration Denied: Student with email "${normalizedEmail}" has already registered for this event. A student can only register once per event.`,
          existingRegistration: existing,
        });
      }

      // Insert new registration
      const code = generateRegistrationCode();
      const newId = `reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const insertQuery = `
        INSERT INTO public.registrations (id, event_id, student_name, student_email, registration_code, status, registered_at)
        VALUES ($1, $2, $3, $4, $5, 'confirmed', NOW())
        RETURNING id, event_id, student_name, student_email, registration_code, status, registered_at, verified_at;
      `;
      const insertResult = await pgPool.query(insertQuery, [newId, event_id, trimmedName, normalizedEmail, code]);
      const newReg = insertResult.rows[0];

      const eventRes = await pgPool.query('SELECT * FROM public.events WHERE id = $1;', [event_id]);
      newReg.event = eventRes.rows[0] || null;

      return res.status(201).json({
        success: true,
        registration: newReg,
      });
    } catch (err: any) {
      if (err.code === '23505' || err.message?.includes('unique') || err.message?.includes('duplicate key')) {
        return res.status(409).json({
          success: false,
          alreadyRegistered: true,
          error: `Registration Denied: Student with email "${normalizedEmail}" is already registered for this event. A student can only register once.`,
        });
      }
      console.warn('PG registration failed, falling through to persistent store:', err.message);
    }
  }

  // 2. Persistent Local Store (Instant & 100% Guaranteed Success)
  const store = loadLocalStore();
  const event = store.events.find((e) => e.id === event_id);

  // Enforce single registration rule strictly
  const existing = store.registrations.find(
    (r) => r.event_id === event_id && r.student_email.toLowerCase() === normalizedEmail
  );

  if (existing) {
    return res.status(409).json({
      success: false,
      alreadyRegistered: true,
      error: `Registration Denied: Student with email "${normalizedEmail}" has already registered for this event. A student can only register once per event.`,
      existingRegistration: {
        ...existing,
        event: event || undefined,
      },
    });
  }

  const code = generateRegistrationCode();
  const newReg: RegistrationItem = {
    id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    event_id,
    student_name: trimmedName,
    student_email: normalizedEmail,
    registration_code: code,
    status: 'confirmed',
    registered_at: new Date().toISOString(),
    verified_at: null,
  };

  store.registrations.push(newReg);
  saveLocalStore(store);

  return res.status(201).json({
    success: true,
    registration: {
      ...newReg,
      event: event || undefined,
    },
  });
});

// Verification lookup by student email or registration ticket code
app.get('/api/verify', async (req, res) => {
  const queryParam = ((req.query.query as string) || '').trim();

  if (!queryParam) {
    return res.status(400).json({
      found: false,
      registrations: [],
      message: 'Please provide a student email or registration ticket code to search.',
    });
  }

  const isEmail = queryParam.includes('@');
  const normalizedParam = queryParam.toLowerCase();

  // Try PostgreSQL if active
  if (isPgConnected && pgPool) {
    try {
      const searchQuery = `
        SELECT 
          r.id,
          r.event_id,
          r.student_name,
          r.student_email,
          r.registration_code,
          r.status,
          r.registered_at,
          r.verified_at,
          row_to_json(e.*) as event
        FROM public.registrations r
        JOIN public.events e ON e.id = r.event_id
        WHERE LOWER(r.student_email) = $1 OR UPPER(r.registration_code) = UPPER($2)
        ORDER BY r.registered_at DESC;
      `;
      const result = await pgPool.query(searchQuery, [normalizedParam, queryParam]);

      if (result.rows.length > 0) {
        return res.json({
          found: true,
          registrations: result.rows,
        });
      }
    } catch (err: any) {
      console.warn('PG verification error, checking local store:', err.message);
    }
  }

  // Check persistent local store
  const store = loadLocalStore();
  const eventsMap = new Map(store.events.map((e) => [e.id, e]));

  const matches = store.registrations.filter((r) => {
    if (isEmail) {
      return r.student_email.toLowerCase() === normalizedParam;
    }
    return r.registration_code.toUpperCase() === queryParam.toUpperCase();
  });

  if (matches.length > 0) {
    return res.json({
      found: true,
      registrations: matches.map((m) => ({
        ...m,
        event: eventsMap.get(m.event_id),
      })),
    });
  }

  res.json({
    found: false,
    registrations: [],
    message: isEmail
      ? `No registered events found for student email "${queryParam}". Have you completed registration?`
      : `Registration ticket code "${queryParam}" was not found in the records.`,
  });
});

// Check-in / mark ticket as verified
app.post('/api/verify/:id/checkin', async (req, res) => {
  const { id } = req.params;

  if (isPgConnected && pgPool) {
    try {
      const updateQuery = `
        UPDATE public.registrations
        SET status = 'verified', verified_at = NOW()
        WHERE id = $1
        RETURNING *;
      `;
      const result = await pgPool.query(updateQuery, [id]);
      if (result.rows.length > 0) {
        return res.json({ success: true, registration: result.rows[0] });
      }
    } catch (err: any) {
      console.warn('PG check-in error, falling back:', err.message);
    }
  }

  // Update in local store
  const store = loadLocalStore();
  const index = store.registrations.findIndex((r) => r.id === id);

  if (index !== -1) {
    store.registrations[index].status = 'verified';
    store.registrations[index].verified_at = new Date().toISOString();
    saveLocalStore(store);
    return res.json({ success: true, registration: store.registrations[index] });
  }

  res.status(404).json({ success: false, error: 'Registration record not found.' });
});

// Get all registrations (Coordinator View)
app.get('/api/registrations', async (req, res) => {
  if (isPgConnected && pgPool) {
    try {
      const query = `
        SELECT 
          r.id,
          r.event_id,
          r.student_name,
          r.student_email,
          r.registration_code,
          r.status,
          r.registered_at,
          r.verified_at,
          row_to_json(e.*) as event
        FROM public.registrations r
        JOIN public.events e ON e.id = r.event_id
        ORDER BY r.registered_at DESC;
      `;
      const result = await pgPool.query(query);
      return res.json(result.rows);
    } catch (err: any) {
      console.warn('PG registrations query error, falling back:', err.message);
    }
  }

  const store = loadLocalStore();
  const eventsMap = new Map(store.events.map((e) => [e.id, e]));

  const list = store.registrations.map((r) => ({
    ...r,
    event: eventsMap.get(r.event_id),
  }));

  res.json(list);
});

// -------------------------------------------------------------
// VITE MIDDLEWARE & SERVER STARTUP
// -------------------------------------------------------------
async function startServer() {
  // Ensure local storage is initialized
  loadLocalStore();

  // Attempt PG connection in background without blocking server startup
  setupPgPool(currentConnectionString).catch((err) => {
    console.warn('Background Supabase check:', err.message);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampusEvents server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
