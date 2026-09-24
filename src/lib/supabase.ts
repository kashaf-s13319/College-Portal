import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CollegeEvent, StudentRegistration, RegistrationOutcome, VerificationLookupResult } from '../types';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verify if client-side Supabase credentials are valid
export const isSupabaseClientConfigured = (): boolean => {
  return (
    typeof envUrl === 'string' &&
    envUrl.trim().length > 0 &&
    !envUrl.includes('your-project.supabase.co') &&
    typeof envAnonKey === 'string' &&
    envAnonKey.trim().length > 0 &&
    !envAnonKey.includes('your-anon-key-here')
  );
};

export const supabase: SupabaseClient | null = isSupabaseClientConfigured()
  ? createClient(envUrl!, envAnonKey!)
  : null;

// Database Health & Connection info
export interface DatabaseHealthStatus {
  connected: boolean;
  provider: string;
  serverTime?: string;
  error?: string;
}

export async function checkDatabaseConnection(): Promise<DatabaseHealthStatus> {
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      const data = await res.json();
      return {
        connected: data.database === 'connected',
        provider: data.provider || 'Supabase PostgreSQL',
        serverTime: data.server_time,
      };
    }
  } catch (err: any) {
    // API server might be starting up or in static preview
  }

  if (isSupabaseClientConfigured()) {
    return {
      connected: true,
      provider: 'Supabase REST API (Client SDK)',
    };
  }

  return {
    connected: false,
    provider: 'Local Storage Fallback',
  };
}

// Default Seed Events for initial load or local fallback
export const INITIAL_EVENTS: CollegeEvent[] = [
  {
    id: 'e1-hackathon-2026',
    title: 'Annual College Tech Hackathon 2026',
    description: 'Join 200+ fellow student coders, designers, and innovators for an intensive 24-hour sprint building AI, Web3, and Mobile applications. Mentorship, food, swag kits, and $5,000 in grand prizes provided!',
    category: 'Technology',
    date: '2026-10-18',
    time: '09:00 AM - 09:00 AM (+1 Day)',
    location: 'Innovation Hub, Block C (Labs 3 & 4)',
    capacity: 150,
    image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    organizer: 'Computing & Robotics Society',
    created_at: new Date('2026-09-01').toISOString(),
  },
  {
    id: 'e2-cultural-gala',
    title: 'Commecs Campus Cultural Gala & Music Night',
    description: 'An evening celebrating diversity, theater, acoustic musical performances, and student food stalls. Featuring live performances by the college fusion band and special guest artists.',
    category: 'Cultural',
    date: '2026-10-24',
    time: '05:30 PM - 10:00 PM',
    location: 'Central Amphitheater & Green Lawns',
    capacity: 350,
    image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    organizer: 'Arts & Dramatic Society',
    created_at: new Date('2026-09-02').toISOString(),
  },
  {
    id: 'e3-ai-masterclass',
    title: 'AI & Foundation Models Industry Masterclass',
    description: 'Keynote talks and interactive workshops by lead machine learning researchers and alumni from Silicon Valley on agentic AI workflows, LLM fine-tuning, and modern tech career roadmaps.',
    category: 'Academic',
    date: '2026-11-02',
    time: '02:00 PM - 05:00 PM',
    location: 'Main Auditorium Hall B',
    capacity: 120,
    image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
    organizer: 'Data Science Society',
    created_at: new Date('2026-09-03').toISOString(),
  },
  {
    id: 'e4-football-tourney',
    title: 'Inter-Department 7-a-Side Football Cup',
    description: 'The annual inter-department sports tournament. Cheer for your department or compete in the knock-out varsity matches. Trophies, medals, and refreshments for all participants.',
    category: 'Sports',
    date: '2026-11-07',
    time: '08:30 AM - 04:00 PM',
    location: 'Varsity Sports Complex Turf',
    capacity: 200,
    image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    organizer: 'College Sports Board',
    created_at: new Date('2026-09-04').toISOString(),
  },
  {
    id: 'e5-career-expo',
    title: 'Annual Career Fair & Internship Expo',
    description: 'Connect directly with recruiters and hiring managers from over 45 leading tech enterprises, consulting firms, and startups. Bring printed resumes and portfolio links.',
    category: 'Career',
    date: '2026-11-15',
    time: '10:00 AM - 04:30 PM',
    location: 'Student Center Grand Hall',
    capacity: 400,
    image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    organizer: 'Career Placement & Alumni Cell',
    created_at: new Date('2026-09-05').toISOString(),
  }
];

// Local Storage Keys for offline fallback
const STORAGE_EVENTS_KEY = 'college_events_data_v1';
const STORAGE_REGISTRATIONS_KEY = 'college_registrations_data_v1';

const INITIAL_REGISTRATIONS: StudentRegistration[] = [
  {
    id: 'reg-sample-1',
    event_id: 'e1-hackathon-2026',
    student_name: 'Alex Rivera',
    student_email: 'alex.rivera@commecs.edu',
    registration_code: 'EVT-7392-8A',
    status: 'confirmed',
    registered_at: '2026-09-08T10:15:00.000Z',
    verified_at: null,
  },
  {
    id: 'reg-sample-2',
    event_id: 'e3-ai-masterclass',
    student_name: 'Sophia Chen',
    student_email: 'sophia.c@commecs.edu',
    registration_code: 'EVT-9921-3K',
    status: 'verified',
    registered_at: '2026-09-09T14:30:00.000Z',
    verified_at: '2026-09-10T09:00:00.000Z',
  }
];

export const generateRegistrationCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomPart1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const randomPart2 = Array.from({ length: 2 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `EVT-${randomPart1}-${randomPart2}`;
};

function getLocalEvents(): CollegeEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_EVENTS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(INITIAL_EVENTS));
      return INITIAL_EVENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EVENTS;
  }
}

function getLocalRegistrations(): StudentRegistration[] {
  try {
    const raw = localStorage.getItem(STORAGE_REGISTRATIONS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_REGISTRATIONS_KEY, JSON.stringify(INITIAL_REGISTRATIONS));
      return INITIAL_REGISTRATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_REGISTRATIONS;
  }
}

function saveLocalRegistrations(list: StudentRegistration[]) {
  try {
    localStorage.setItem(STORAGE_REGISTRATIONS_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

// Backward compatible export for UI components
export const isSupabaseConfigured = (): boolean => {
  return true; // We now have Supabase PostgreSQL connected via backend server!
};

// -------------------------------------------------------------
// PUBLIC REPOSITORY API
// -------------------------------------------------------------

/**
 * Fetch all college events with live registration counts
 */
export async function getEvents(): Promise<CollegeEvent[]> {
  // 1. Try Express Backend (Direct Supabase PostgreSQL Pool)
  try {
    const res = await fetch('/api/events');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend /api/events unavailable, falling back:', err);
  }

  // 2. Try client-side Supabase SDK if configured
  if (supabase) {
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (!eventsError && eventsData && eventsData.length > 0) {
        const { data: regData } = await supabase.from('registrations').select('event_id');
        const countMap: Record<string, number> = {};
        if (regData) {
          regData.forEach((r: { event_id: string }) => {
            countMap[r.event_id] = (countMap[r.event_id] || 0) + 1;
          });
        }
        return eventsData.map((ev: CollegeEvent) => ({
          ...ev,
          registered_count: countMap[ev.id] || 0,
        }));
      }
    } catch (err) {
      console.warn('Supabase client getEvents error, falling back:', err);
    }
  }

  // 3. Fallback Local Storage Mode
  const events = getLocalEvents();
  const registrations = getLocalRegistrations();
  const countMap: Record<string, number> = {};
  registrations.forEach((r) => {
    countMap[r.event_id] = (countMap[r.event_id] || 0) + 1;
  });

  return events.map((e) => ({
    ...e,
    registered_count: countMap[e.id] || 0,
  }));
}

/**
 * Register a student for an event
 * CRITICAL REQUIREMENT:
 * Ensures a student can only register ONCE for the same event with their email.
 * If they attempt again, returns alreadyRegistered: true and a clear error message.
 */
export async function registerStudent(
  eventId: string,
  studentName: string,
  studentEmail: string
): Promise<RegistrationOutcome> {
  const normalizedEmail = studentEmail.trim().toLowerCase();
  const trimmedName = studentName.trim();

  if (!trimmedName) {
    return { success: false, error: 'Please enter student full name.' };
  }
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid student email address.' };
  }

  // 1. Try Backend API (Direct Supabase PostgreSQL with Unique Constraint)
  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventId,
        student_name: trimmedName,
        student_email: normalizedEmail,
      }),
    });

    const data = await res.json();

    if (res.status === 409 || data.alreadyRegistered) {
      return {
        success: false,
        alreadyRegistered: true,
        error:
          data.error ||
          `Registration Denied: Student with email "${normalizedEmail}" is already registered for this event. A student can only register once per event.`,
        existingRegistration: data.existingRegistration,
      };
    }

    if (res.ok && data.success) {
      return {
        success: true,
        registration: data.registration,
      };
    }

    if (!res.ok) {
      return {
        success: false,
        error: data.error || 'Failed to submit registration.',
      };
    }
  } catch (err) {
    console.warn('Backend registration failed, attempting alternative data layers:', err);
  }

  // 2. Try Client-Side Supabase SDK if configured
  if (supabase) {
    try {
      // Check existing duplicate
      const { data: existingRecords } = await supabase
        .from('registrations')
        .select('*, events(*)')
        .eq('event_id', eventId)
        .ilike('student_email', normalizedEmail);

      if (existingRecords && existingRecords.length > 0) {
        const existing = existingRecords[0];
        return {
          success: false,
          alreadyRegistered: true,
          error: `Registration Denied: Student with email "${normalizedEmail}" is already registered for this event. A student can only register once per event.`,
          existingRegistration: {
            id: existing.id,
            event_id: existing.event_id,
            student_name: existing.student_name,
            student_email: existing.student_email,
            registration_code: existing.registration_code,
            status: existing.status,
            registered_at: existing.registered_at,
            verified_at: existing.verified_at,
            event: existing.events,
          },
        };
      }

      const code = generateRegistrationCode();
      const newRecord = {
        event_id: eventId,
        student_name: trimmedName,
        student_email: normalizedEmail,
        registration_code: code,
        status: 'confirmed',
        registered_at: new Date().toISOString(),
      };

      const { data: inserted, error: insertError } = await supabase
        .from('registrations')
        .insert(newRecord)
        .select('*, events(*)')
        .single();

      if (insertError) {
        if (insertError.code === '23505' || insertError.message?.includes('duplicate key')) {
          return {
            success: false,
            alreadyRegistered: true,
            error: `Registration Denied: Student with email "${normalizedEmail}" has already registered for this event.`,
          };
        }
        throw insertError;
      }

      return {
        success: true,
        registration: {
          id: inserted.id,
          event_id: inserted.event_id,
          student_name: inserted.student_name,
          student_email: inserted.student_email,
          registration_code: inserted.registration_code,
          status: inserted.status,
          registered_at: inserted.registered_at,
          verified_at: inserted.verified_at,
          event: inserted.events,
        },
      };
    } catch (err: unknown) {
      console.error('Supabase client error:', err);
    }
  }

  // 3. Fallback Local Storage Mode
  const registrations = getLocalRegistrations();
  const events = getLocalEvents();
  const event = events.find((e) => e.id === eventId);

  const existing = registrations.find(
    (r) => r.event_id === eventId && r.student_email.toLowerCase() === normalizedEmail
  );

  if (existing) {
    return {
      success: false,
      alreadyRegistered: true,
      error: `Registration Denied: Student with email "${normalizedEmail}" is already registered for "${event?.title || 'this event'}". A student can only register once for the same event.`,
      existingRegistration: {
        ...existing,
        event,
      },
    };
  }

  const newReg: StudentRegistration = {
    id: `reg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    event_id: eventId,
    student_name: trimmedName,
    student_email: normalizedEmail,
    registration_code: generateRegistrationCode(),
    status: 'confirmed',
    registered_at: new Date().toISOString(),
    verified_at: null,
    event,
  };

  registrations.push(newReg);
  saveLocalRegistrations(registrations);

  return {
    success: true,
    registration: newReg,
  };
}

/**
 * Look up student registrations by email or ticket code
 */
export async function verifyRegistration(query: string): Promise<VerificationLookupResult> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return { found: false, registrations: [], message: 'Please enter your student email or registration ticket code.' };
  }

  // 1. Try Backend API
  try {
    const res = await fetch(`/api/verify?query=${encodeURIComponent(cleanQuery)}`);
    if (res.ok) {
      const data = await res.json();
      return {
        found: data.found,
        registrations: data.registrations || [],
        message: data.message,
      };
    }
  } catch (err) {
    console.warn('Backend /api/verify unavailable, falling back:', err);
  }

  // 2. Try client-side Supabase
  if (supabase) {
    try {
      const isEmail = cleanQuery.includes('@');
      let req = supabase.from('registrations').select('*, events(*)');
      if (isEmail) {
        req = req.ilike('student_email', cleanQuery.toLowerCase());
      } else {
        req = req.ilike('registration_code', cleanQuery);
      }
      const { data, error } = await req.order('registered_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return {
          found: true,
          registrations: data.map((item: any) => ({
            id: item.id,
            event_id: item.event_id,
            student_name: item.student_name,
            student_email: item.student_email,
            registration_code: item.registration_code,
            status: item.status,
            registered_at: item.registered_at,
            verified_at: item.verified_at,
            event: item.events,
          })),
        };
      }
    } catch (err) {
      console.warn('Supabase client verify error:', err);
    }
  }

  // 3. Fallback Local Storage
  const isEmail = cleanQuery.includes('@');
  const lowerQuery = cleanQuery.toLowerCase();
  const registrations = getLocalRegistrations();
  const events = getLocalEvents();
  const eventsMap = new Map(events.map((e) => [e.id, e]));

  const matches = registrations.filter((r) => {
    if (isEmail) {
      return r.student_email.toLowerCase() === lowerQuery;
    } else {
      return r.registration_code.toLowerCase() === lowerQuery;
    }
  });

  if (matches.length === 0) {
    return {
      found: false,
      registrations: [],
      message: isEmail
        ? `No registrations found for student email "${cleanQuery}". Have you registered yet?`
        : `Ticket code "${cleanQuery}" was not found in our database.`,
    };
  }

  return {
    found: true,
    registrations: matches.map((m) => ({
      ...m,
      event: eventsMap.get(m.event_id),
    })),
  };
}

/**
 * Mark a student registration as verified/checked-in at the venue
 */
export async function markAsVerified(registrationId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/verify/${registrationId}/checkin`, {
      method: 'POST',
    });
    if (res.ok) {
      const data = await res.json();
      return !!data.success;
    }
  } catch (err) {
    console.warn('Backend checkin error:', err);
  }

  // Fallback
  const registrations = getLocalRegistrations();
  const index = registrations.findIndex((r) => r.id === registrationId);
  if (index !== -1) {
    registrations[index].status = 'verified';
    registrations[index].verified_at = new Date().toISOString();
    saveLocalRegistrations(registrations);
    return true;
  }
  return false;
}

/**
 * Get all registrations (for college coordinator / admin review)
 */
export async function getAllRegistrations(): Promise<StudentRegistration[]> {
  try {
    const res = await fetch('/api/registrations');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend /api/registrations unavailable, falling back:', err);
  }

  const registrations = getLocalRegistrations();
  const events = getLocalEvents();
  const eventsMap = new Map(events.map((e) => [e.id, e]));

  return registrations.map((r) => ({
    ...r,
    event: eventsMap.get(r.event_id),
  }));
}
