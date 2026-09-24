export interface CollegeEvent {
  id: string;
  title: string;
  description: string;
  category: 'Technology' | 'Cultural' | 'Academic' | 'Sports' | 'Career' | 'Workshop' | string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  image_url?: string;
  organizer?: string;
  created_at?: string;
  registered_count?: number;
}

export interface StudentRegistration {
  id: string;
  event_id: string;
  student_name: string;
  student_email: string;
  registration_code: string;
  status: 'confirmed' | 'verified';
  registered_at: string;
  verified_at?: string | null;
  event?: CollegeEvent;
}

export interface RegisterStudentParams {
  eventId: string;
  studentName: string;
  studentEmail: string;
}

export interface RegistrationOutcome {
  success: boolean;
  registration?: StudentRegistration;
  error?: string;
  alreadyRegistered?: boolean;
  existingRegistration?: StudentRegistration;
}

export interface VerificationLookupResult {
  found: boolean;
  registrations: StudentRegistration[];
  message?: string;
}
