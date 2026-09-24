-- =========================================================
-- College Event Registrations - Supabase Database Schema
-- Run this in your Supabase Project -> SQL Editor
-- =========================================================

-- 1. Create Events Table
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  category text not null default 'General',
  date date not null,
  time text not null,
  location text not null,
  capacity integer not null default 100,
  image_url text,
  organizer text default 'Student Affairs',
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Create Registrations Table
create table if not exists public.registrations (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  student_name text not null,
  student_email text not null,
  registration_code text not null unique,
  status text not null default 'confirmed', -- 'confirmed', 'verified'
  registered_at timestamptz default timezone('utc'::text, now()) not null,
  verified_at timestamptz
);

-- 3. CRITICAL CONSTRAINT: Prevent duplicate student registrations for the same event!
-- A student can only register once per event based on their email address.
create unique index if not exists idx_unique_event_student_email 
  on public.registrations (event_id, lower(student_email));

-- 4. Enable Row Level Security (RLS)
alter table public.events enable row level security;
alter table public.registrations enable row level security;

-- 5. Set up RLS Policies (Allow public access for students and college verification)
create policy "Allow public read access on events"
  on public.events for select
  using (true);

create policy "Allow public read access on registrations"
  on public.registrations for select
  using (true);

create policy "Allow public student registration"
  on public.registrations for insert
  with check (true);

create policy "Allow verification update on registrations"
  on public.registrations for update
  using (true);

-- 6. Insert Initial Campus Events
insert into public.events (title, description, category, date, time, location, capacity, image_url, organizer)
values
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
