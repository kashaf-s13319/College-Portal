import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const { Pool } = pg;
const app = express();
const PORT = 3000;

app.use(express.json());

// Sanitizes and prepares the connection string
function getDatabaseConnectionString(): string {
  const raw =
    process.env.DATABASE_URL ||
    'postgresql://postgres.yfimfccknuwviloxxnjf:kashafnaeem13319@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres';
  // Remove accidental enclosing brackets around password if provided like [password]
  return raw.replace(/:\[([^\]]+)\]@/, ':$1@');
}

const pool = new Pool({
  connectionString: getDatabaseConnectionString(),
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Generate ticket code EVT-XXXX-XX
function generateRegistrationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomPart1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const randomPart2 = Array.from({ length: 2 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `EVT-${randomPart1}-${randomPart2}`;
}

// Auto-initialize tables and seed data if needed
async function initDatabase() {
  try {
    const client = await pool.connect();
    try {
      // 1. Events table
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.events (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
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

      // 2. Registrations table
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.registrations (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
          student_name text NOT NULL,
          student_email text NOT NULL,
          registration_code text NOT NULL UNIQUE,
          status text NOT NULL DEFAULT 'confirmed',
          registered_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
          verified_at timestamptz
        );
      `);

      // 3. Unique index for single registration per event per email
      await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_event_student_email 
        ON public.registrations (event_id, lower(student_email));
      `);

      // 4. Seed if empty
      const countRes = await client.query('SELECT count(*) FROM public.events');
      if (parseInt(countRes.rows[0].count, 10) === 0) {
        await client.query(`
          INSERT INTO public.events (title, description, category, date, time, location, capacity, image_url, organizer)
          VALUES
          (
            'Annual College Tech Hackathon 2026',
            'Join 200+ fellow student coders and designers for an intensive 24-hour sprint building AI, Web, and Mobile solutions. Mentorship, food, and cash prizes provided!',
            'Technology',
            '2026-10-18',
            '09:00 AM - 09:00 AM (Next Day)',
            'Innovation Hub & Labs 3-4',
            150,
            'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
            'Computing & Robotics Club'
          ),
          (
            'Commecs Campus Cultural Gala & Music Night',
            'An evening celebrating diversity, theater, acoustic musical performances, and delicious street food stalls hosted by student societies.',
            'Cultural',
            '2026-10-24',
            '05:30 PM - 10:00 PM',
            'Central Amphitheater & Lawn',
            350,
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
            'Arts & Dramatic Society'
          ),
          (
            'AI & Machine Learning Industry Masterclass',
            'Keynote talks by lead researchers and industry alumni on foundation models, agentic workflows, and career roadmaps in modern AI engineering.',
            'Academic',
            '2026-11-02',
            '02:00 PM - 05:00 PM',
            'Auditorium Hall B',
            120,
            'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
            'Data Science Society'
          ),
          (
            'Inter-Department Football Championship',
            'Annual knock-out sports tournament. Cheer for your department or compete in the varsity 7-a-side matches. Refreshments and trophies for winners.',
            'Sports',
            '2026-11-07',
            '08:30 AM - 04:00 PM',
            'University Sports Complex Turf',
            200,
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
            'College Sports Board'
          ),
          (
            'Career Fair & Internship Networking Expo',
            'Connect directly with recruiters and hiring managers from over 40 leading tech firms, banks, and creative agencies. Bring printed resumes!',
            'Career',
            '2026-11-15',
            '10:00 AM - 04:30 PM',
            'Student Center Hall A & B',
            400,
            'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
            'Career Placement Cell'
          );
        `);
      }
      console.log('Supabase PostgreSQL database initialized successfully.');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Database connection / init notice:', err);
  }
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as db_time, current_database() as db_name;');
    res.json({
      status: 'ok',
      database: 'connected',
      provider: 'Supabase PostgreSQL',
      server_time: result.rows[0].db_time,
      database_name: result.rows[0].db_name,
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: err.message,
    });
  }
});

// List all events with live registration count
app.get('/api/events', async (req, res) => {
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
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err: any) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Failed to fetch events', details: err.message });
  }
});

// Create a new event (Coordinator)
app.post('/api/events', async (req, res) => {
  const { title, description, category, date, time, location, capacity, image_url, organizer } = req.body;

  if (!title || !description || !date || !time || !location) {
    return res.status(400).json({ error: 'Missing required event fields.' });
  }

  try {
    const query = `
      INSERT INTO public.events (title, description, category, date, time, location, capacity, image_url, organizer)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, title, description, category, to_char(date, 'YYYY-MM-DD') as date, time, location, capacity, image_url, organizer, created_at;
    `;
    const values = [
      title.trim(),
      description.trim(),
      category || 'General',
      date,
      time.trim(),
      location.trim(),
      capacity ? parseInt(capacity, 10) : 100,
      image_url || null,
      organizer || 'Student Affairs',
    ];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Failed to create event', details: err.message });
  }
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

  try {
    // 1. Proactive check for existing duplicate registration
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
    const checkResult = await pool.query(checkQuery, [event_id, normalizedEmail]);

    if (checkResult.rows.length > 0) {
      const existing = checkResult.rows[0];
      return res.status(409).json({
        success: false,
        alreadyRegistered: true,
        error: `Registration Denied: Student with email "${normalizedEmail}" has already registered for this event. A student can only register once per event.`,
        existingRegistration: existing,
      });
    }

    // 2. Insert new registration
    const code = generateRegistrationCode();
    const insertQuery = `
      INSERT INTO public.registrations (event_id, student_name, student_email, registration_code, status, registered_at)
      VALUES ($1, $2, $3, $4, 'confirmed', NOW())
      RETURNING id, event_id, student_name, student_email, registration_code, status, registered_at, verified_at;
    `;
    const insertResult = await pool.query(insertQuery, [event_id, trimmedName, normalizedEmail, code]);
    const newReg = insertResult.rows[0];

    // Fetch associated event details for the return pass
    const eventQuery = `SELECT * FROM public.events WHERE id = $1;`;
    const eventRes = await pool.query(eventQuery, [event_id]);
    newReg.event = eventRes.rows[0] || null;

    res.status(201).json({
      success: true,
      registration: newReg,
    });
  } catch (err: any) {
    // Postgres Unique Violation constraint error code 23505
    if (err.code === '23505' || err.message?.includes('unique') || err.message?.includes('duplicate key')) {
      return res.status(409).json({
        success: false,
        alreadyRegistered: true,
        error: `Registration Denied: Student with email "${normalizedEmail}" is already registered for this event. A student can only register once.`,
      });
    }

    console.error('Error during student registration:', err);
    res.status(500).json({ success: false, error: 'Failed to process registration. Please try again later.' });
  }
});

// Verification lookup by student email or registration ticket code
app.get('/api/verify', async (req, res) => {
  const queryParam = (req.query.query as string || '').trim();

  if (!queryParam) {
    return res.status(400).json({
      found: false,
      registrations: [],
      message: 'Please provide a student email or registration ticket code to search.',
    });
  }

  const isEmail = queryParam.includes('@');
  const normalizedParam = queryParam.toLowerCase();

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
    const result = await pool.query(searchQuery, [normalizedParam, queryParam]);

    if (result.rows.length > 0) {
      res.json({
        found: true,
        registrations: result.rows,
      });
    } else {
      res.json({
        found: false,
        registrations: [],
        message: isEmail
          ? `No registered events found for email "${queryParam}". Ensure you used this email to register.`
          : `Registration ticket code "${queryParam}" was not found in the database.`,
      });
    }
  } catch (err: any) {
    console.error('Error verifying registration:', err);
    res.status(500).json({
      found: false,
      registrations: [],
      error: 'Failed to query database for verification.',
    });
  }
});

// Check-in / mark ticket as verified
app.post('/api/verify/:id/checkin', async (req, res) => {
  const { id } = req.params;

  try {
    const updateQuery = `
      UPDATE public.registrations
      SET status = 'verified', verified_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const result = await pool.query(updateQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Registration record not found.' });
    }

    res.json({
      success: true,
      registration: result.rows[0],
    });
  } catch (err: any) {
    console.error('Error marking as verified:', err);
    res.status(500).json({ success: false, error: 'Failed to update check-in status.' });
  }
});

// Get all registrations (Coordinator View)
app.get('/api/registrations', async (req, res) => {
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
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err: any) {
    console.error('Error fetching all registrations:', err);
    res.status(500).json({ error: 'Failed to fetch registrations', details: err.message });
  }
});

// -------------------------------------------------------------
// VITE MIDDLEWARE & SERVER STARTUP
// -------------------------------------------------------------
async function startServer() {
  await initDatabase();

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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
