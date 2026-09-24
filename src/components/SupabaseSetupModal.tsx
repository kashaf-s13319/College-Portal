import React, { useState, useEffect } from 'react';
import {
  Database,
  Check,
  Copy,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Server,
  Zap,
  CheckCircle,
} from 'lucide-react';
import { checkDatabaseConnection, connectSupabaseDatabase, DatabaseHealthStatus } from '../lib/supabase';

const SCHEMA_SQL = `-- =========================================================
-- College Event Registrations - Supabase Database Schema
-- Run this in your Supabase Project -> SQL Editor
-- =========================================================

-- 1. Create Events Table
create table if not exists public.events (
  id text primary key,
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
  id text primary key,
  event_id text references public.events(id) on delete cascade not null,
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
  const [dbStatus, setDbStatus] = useState<DatabaseHealthStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Connection form state
  const [inputUrl, setInputUrl] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectResult, setConnectResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
    advice?: string;
  } | null>(null);

  const refreshStatus = async () => {
    setLoadingStatus(true);
    try {
      const status = await checkDatabaseConnection();
      setDbStatus(status);
      if (status.connectionStringMasked && !inputUrl) {
        setInputUrl(status.connectionStringMasked);
      }
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const isConnected = dbStatus?.connected === true;

  const handleCopy = () => {
    navigator.clipboard.writeText(SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setTestingConnection(true);
    setConnectResult(null);

    try {
      const res = await connectSupabaseDatabase(inputUrl.trim());
      setConnectResult(res);
      if (res.success) {
        await refreshStatus();
      }
    } catch (err: any) {
      setConnectResult({
        success: false,
        error: err.message || 'Failed to connect.',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200 mb-3">
          <Database className="w-4 h-4 text-emerald-600" />
          <span>Supabase Database Management</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Supabase Database Connection & Schema
        </h1>
        <p className="text-slate-600 text-sm mt-2">
          Your college event registrations app supports direct Supabase PostgreSQL connectivity with enforced duplicate prevention constraints and instant fallback protection.
        </p>
      </div>

      {/* Connection Status Card */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          isConnected
            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950 shadow-xs'
            : 'bg-amber-50/90 border-amber-200 text-amber-950 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isConnected ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
              }`}
            >
              {isConnected ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base sm:text-lg">
                  {isConnected
                    ? 'Connected to Supabase PostgreSQL'
                    : 'Active with Persistent Storage Engine'}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isConnected ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {isConnected ? 'Live Supabase' : 'Offline Safe Fallback'}
                </span>
              </div>

              <p className="text-xs sm:text-sm mt-1 text-slate-700 leading-relaxed">
                {isConnected
                  ? 'Your app is actively communicating with your Supabase PostgreSQL database. Tables public.events and public.registrations are live with unique registration constraint idx_unique_event_student_email.'
                  : 'Student registrations, event listings, and verification passes are currently running with zero interruption via our persistent local storage engine. Registrations will never fail!'}
              </p>

              {dbStatus?.lastError && !isConnected && (
                <div className="mt-2 p-2.5 bg-amber-100/70 border border-amber-300/80 rounded-xl text-xs text-amber-900 font-mono">
                  <span className="font-bold">Diagnostic Status: </span>
                  {dbStatus.lastError}
                </div>
              )}

              {dbStatus?.connectionStringMasked && (
                <p className="text-xs font-mono text-slate-500 mt-2 truncate">
                  Configured Pooler: {dbStatus.connectionStringMasked}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={refreshStatus}
            disabled={loadingStatus}
            className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white/80 hover:bg-white text-slate-700 transition-colors shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin' : ''}`} />
            <span>Check Status</span>
          </button>
        </div>
      </div>

      {/* Supabase Connection Setup Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2.5">
          <Server className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="font-bold text-slate-900 text-base">Connect or Update Supabase Database</h3>
            <p className="text-xs text-slate-500">
              Provide your Supabase connection string from <strong>Project Settings → Database → Connection string</strong>.
            </p>
          </div>
        </div>

        <form onSubmit={handleTestAndConnect} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              PostgreSQL URI (Transaction or Session Pooler)
            </label>
            <input
              type="text"
              required
              placeholder="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full font-mono text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Example: <code className="bg-slate-100 px-1 py-0.5 rounded">postgresql://postgres.yourprojectref:yourpassword@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres</code>
            </p>
          </div>

          {connectResult && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                connectResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {connectResult.success ? (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{connectResult.message}</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Connection Attempt Failed</span>
                  </div>
                  <p className="font-mono text-[11px] text-rose-800">{connectResult.error}</p>
                  {connectResult.advice && <p className="text-slate-700 mt-1">{connectResult.advice}</p>}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={testingConnection || !inputUrl.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold text-xs py-2.5 px-5 rounded-xl shadow-xs transition-colors flex items-center space-x-2"
            >
              {testingConnection ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Testing Connection...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Test & Connect Database</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3 Step Integration Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Supabase Project</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Ensure your Supabase project at{' '}
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 font-semibold inline-flex items-center hover:underline"
            >
              supabase.com <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>{' '}
            is active and unpaused.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Execute SQL Schema</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Open the <strong>SQL Editor</strong> tab in Supabase, paste the schema below, and click{' '}
            <strong>Run</strong> to create tables and unique duplicate prevention index.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Copy Connection String</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            In <strong>Project Settings → Database</strong>, select <strong>Connection Pooling</strong> and copy the URI into the box above.
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
              Strict Single Registration Guarantee
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              We enforce duplicate rejection across all storage modes:
            </p>
            <ul className="text-xs text-slate-600 list-disc list-inside space-y-1 pt-1">
              <li>
                <strong>Application Layer:</strong> Both the frontend and backend proactively check if a registration matching <code className="bg-slate-100 px-1 py-0.5 rounded">event_id</code> and <code className="bg-slate-100 px-1 py-0.5 rounded">lower(student_email)</code> already exists.
              </li>
              <li>
                <strong>Database Engine Layer:</strong> In Supabase PostgreSQL, the unique index <code className="bg-slate-100 px-1 py-0.5 rounded">idx_unique_event_student_email</code> strictly rejects any duplicate attempt with error code <strong>23505 (unique_violation)</strong>.
              </li>
              <li>
                <strong>Student Experience:</strong> If a student attempts to re-register for the same event, they receive an immediate 409 Conflict rejection with a link to view and print their existing ticket pass.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
