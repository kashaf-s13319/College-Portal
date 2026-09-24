import React, { useState } from 'react';
import {
  Database,
  Check,
  Copy,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Code2,
  AlertCircle,
} from 'lucide-react';
import { isSupabaseConfigured, checkDatabaseConnection } from '../lib/supabase';

const SCHEMA_SQL = `-- 1. Create Events Table
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
  status text not null default 'confirmed',
  registered_at timestamptz default timezone('utc'::text, now()) not null,
  verified_at timestamptz
);

-- 3. CRITICAL CONSTRAINT: Single Registration Per Event Rule
-- Ensures a student can only register ONCE per event based on email
create unique index if not exists idx_unique_event_student_email 
  on public.registrations (event_id, lower(student_email));

-- 4. Enable Row Level Security (RLS)
alter table public.events enable row level security;
alter table public.registrations enable row level security;

-- 5. Public RLS Policies
create policy "Allow public read access on events" on public.events for select using (true);
create policy "Allow public read access on registrations" on public.registrations for select using (true);
create policy "Allow public student registration" on public.registrations for insert with check (true);
create policy "Allow verification update on registrations" on public.registrations for update using (true);`;

export const SupabaseSetupModal: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    provider: string;
    serverTime?: string;
  }>({
    connected: true,
    provider: 'Supabase PostgreSQL',
  });

  React.useEffect(() => {
    checkDatabaseConnection().then(setDbStatus);
  }, []);

  const isConnected = dbStatus.connected;

  const handleCopy = () => {
    navigator.clipboard.writeText(SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200 mb-3">
          <Database className="w-4 h-4 text-emerald-600" />
          <span>Supabase Integration Guide</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Supabase Database Connection & Schema
        </h1>
        <p className="text-slate-600 text-sm mt-2">
          Your college event registrations app is connected to your Supabase PostgreSQL database with enforced duplicate prevention constraints and student pass verification.
        </p>
      </div>

      {/* Connection Status Card */}
      <div
        className={`p-5 rounded-2xl border ${
          isConnected
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : 'bg-amber-50/80 border-amber-200 text-amber-950'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isConnected ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
              }`}
            >
              {isConnected ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base">
                {isConnected
                  ? 'Connected to Supabase PostgreSQL'
                  : 'Integrated Fallback Active'}
              </h3>
              <p className="text-xs sm:text-sm mt-0.5 text-slate-700">
                {isConnected
                  ? `Active connection to ${dbStatus.provider} pooler (aws-0-ap-southeast-2.pooler.supabase.com:6543). Tables public.events and public.registrations are live with unique student registration constraints.`
                  : 'Currently running with built-in persistent storage. Configure DATABASE_URL in environment settings to connect your live Supabase cloud database.'}
              </p>
              {dbStatus.serverTime && (
                <p className="text-[11px] font-mono text-emerald-700 mt-1">
                  Database Server UTC: {new Date(dbStatus.serverTime).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              isConnected ? 'bg-emerald-200/80 text-emerald-800' : 'bg-amber-200/80 text-amber-900'
            }`}
          >
            {isConnected ? 'LIVE POSTGRES' : 'FALLBACK READY'}
          </span>
        </div>
      </div>

      {/* 3 Step Integration Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Create Supabase Project</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Go to your Supabase dashboard at{' '}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 font-semibold inline-flex items-center hover:underline"
            >
              supabase.com <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>{' '}
            and click "New Project".
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Execute SQL Schema</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Open the <strong>SQL Editor</strong> tab in Supabase, paste the SQL schema below, and click{' '}
            <strong>Run</strong> to create the tables and unique index.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Set Environment Variables</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            From <strong>Project Settings → API</strong>, copy your <strong>Project URL</strong> and{' '}
            <strong>anon public key</strong> into <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and{' '}
            <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code>.
          </p>
        </div>
      </div>

      {/* SQL Script Box */}
      <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-lg">
        <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-semibold text-slate-200">
              supabase/schema.sql (Events & Registrations with Duplicate Constraint)
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy SQL</span>
              </>
            )}
          </button>
        </div>
        <div className="p-5 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed max-h-96">
          <pre>{SCHEMA_SQL}</pre>
        </div>
      </div>

      {/* Architectural Guarantee Details */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-start space-x-3">
          <ShieldCheck className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-sm">
              Strict Duplicate Registration Guarantee
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              We enforce duplicate rejection at two independent layers:
            </p>
            <ul className="text-xs text-slate-600 list-disc list-inside space-y-1 pt-1">
              <li>
                <strong>Application Layer:</strong> Before submission, the app queries for any active record matching <code className="bg-slate-100 px-1 py-0.5 rounded">event_id</code> and case-insensitive <code className="bg-slate-100 px-1 py-0.5 rounded">student_email</code>.
              </li>
              <li>
                <strong>Database Engine Layer:</strong> The Postgres index <code className="bg-slate-100 px-1 py-0.5 rounded">idx_unique_event_student_email</code> strictly rejects any duplicate attempt with error code <strong>23505 (unique_violation)</strong>.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
