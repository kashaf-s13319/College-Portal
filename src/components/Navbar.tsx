import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Database, ShieldCheck, Users } from 'lucide-react';
import { checkDatabaseConnection, DatabaseHealthStatus } from '../lib/supabase';

interface NavbarProps {
  activeTab: 'events' | 'verify' | 'admin' | 'setup';
  setActiveTab: (tab: 'events' | 'verify' | 'admin' | 'setup') => void;
  onOpenVerify: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenVerify }) => {
  const [dbStatus, setDbStatus] = useState<DatabaseHealthStatus>({
    connected: true,
    provider: 'Supabase PostgreSQL',
  });

  useEffect(() => {
    checkDatabaseConnection().then(setDbStatus);
  }, []);

  const isConnected = dbStatus.connected;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('events')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">CampusEvents</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                  College Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Student Event Registrations & Verification</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              id="nav-events-btn"
              onClick={() => setActiveTab('events')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'events'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Browse Events
            </button>

            <button
              id="nav-verify-btn"
              onClick={() => setActiveTab('verify')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'verify'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verify Registration</span>
            </button>

            <button
              id="nav-admin-btn"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'admin'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Coordinator View</span>
            </button>

            <button
              id="nav-setup-btn"
              onClick={() => setActiveTab('setup')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'setup'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Supabase Guide</span>
            </button>
          </nav>

          {/* Right Action & Database Status */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab('setup')}
              title={isConnected ? `Connected to ${dbStatus.provider}` : 'Click to inspect database status'}
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{isConnected ? 'Supabase Live' : 'Database Setup'}</span>
            </button>

            <button
              id="header-verify-cta"
              onClick={onOpenVerify}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Verify My Ticket</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => setActiveTab('events')}
            className={`py-1.5 px-2 rounded font-medium ${
              activeTab === 'events' ? 'text-indigo-600 font-bold' : 'text-slate-600'
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`py-1.5 px-2 rounded font-medium ${
              activeTab === 'verify' ? 'text-indigo-600 font-bold' : 'text-slate-600'
            }`}
          >
            Verify Pass
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`py-1.5 px-2 rounded font-medium ${
              activeTab === 'admin' ? 'text-indigo-600 font-bold' : 'text-slate-600'
            }`}
          >
            Coordinator
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`py-1.5 px-2 rounded font-medium ${
              activeTab === 'setup' ? 'text-indigo-600 font-bold' : 'text-slate-600'
            }`}
          >
            Supabase
          </button>
        </div>
      </div>
    </header>
  );
};
