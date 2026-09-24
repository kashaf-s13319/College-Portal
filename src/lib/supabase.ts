import { CollegeEvent, StudentRegistration, RegistrationOutcome, VerificationLookupResult } from '../types';

export interface DatabaseHealthStatus {
  connected: boolean;
  provider: string;
  serverTime?: string;
  connectionStringMasked?: string;
  lastError?: string | null;
  totalEvents?: number;
  totalRegistrations?: number;
}

export async function checkDatabaseConnection(): Promise<DatabaseHealthStatus> {
  try {
    const res = await fetch('/api/supabase/status');
    if (res.ok) {
      const data = await res.json();
      return {
        connected: !!data.connected,
        provider: data.provider || (data.connected ? 'Supabase PostgreSQL' : 'Local Persistent Storage'),
        connectionStringMasked: data.connection_string_masked,
        lastError: data.last_error,
        totalEvents: data.total_events,
        totalRegistrations: data.total_registrations,
      };
    }
  } catch (err) {
    console.warn('API /api/supabase/status unavailable:', err);
  }

  return {
    connected: false,
    provider: 'Local Storage Fallback',
    lastError: 'Server starting or offline',
  };
}

export async function connectSupabaseDatabase(connectionString: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  advice?: string;
}> {
  try {
    const res = await fetch('/api/supabase/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connection_string: connectionString }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error while attempting to connect to Supabase.',
    };
  }
}

export const isSupabaseConfigured = (): boolean => {
  return true;
};

// -------------------------------------------------------------
// PUBLIC REPOSITORY API
// -------------------------------------------------------------

/**
 * Fetch all college events with live registration counts
 */
export async function getEvents(): Promise<CollegeEvent[]> {
  try {
    const res = await fetch('/api/events');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend /api/events error:', err);
  }
  return [];
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

    return {
      success: false,
      error: data.error || 'Failed to submit registration. Please check your input and try again.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Connection error. Please try again.',
    };
  }
}

/**
 * Look up student registrations by email or ticket code
 */
export async function verifyRegistration(query: string): Promise<VerificationLookupResult> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return { found: false, registrations: [], message: 'Please enter your student email or registration ticket code.' };
  }

  try {
    const res = await fetch(`/api/verify?query=${encodeURIComponent(cleanQuery)}`);
    if (res.ok) {
      const data = await res.json();
      return {
        found: !!data.found,
        registrations: data.registrations || [],
        message: data.message,
      };
    }
  } catch (err: any) {
    console.warn('Backend /api/verify unavailable:', err);
  }

  return {
    found: false,
    registrations: [],
    message: 'Could not connect to verify tickets. Please try again in a moment.',
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
    console.warn('Backend /api/registrations error:', err);
  }
  return [];
}
