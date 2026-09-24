import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Copy,
  Check,
  QrCode,
  Printer,
  Sparkles,
  ArrowRight,
  AlertCircle,
  BadgeCheck,
} from 'lucide-react';
import { StudentRegistration } from '../types';
import { verifyRegistration, markAsVerified } from '../lib/supabase';

interface VerificationViewProps {
  initialQuery?: string;
  onNavigateToEvents: () => void;
}

export const VerificationView: React.FC<VerificationViewProps> = ({
  initialQuery = '',
  onNavigateToEvents,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  // Auto-search if initialQuery is provided
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setSearchQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setErrorMessage(null);
    setHasSearched(true);

    try {
      const res = await verifyRegistration(query);
      if (res.found && res.registrations.length > 0) {
        setRegistrations(res.registrations);
      } else {
        setRegistrations([]);
        setErrorMessage(res.message || 'No active registration found for this query.');
      }
    } catch (err: any) {
      setRegistrations([]);
      setErrorMessage(err.message || 'Verification search encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCheckIn = async (regId: string) => {
    setCheckingInId(regId);
    try {
      const ok = await markAsVerified(regId);
      if (ok) {
        setRegistrations((prev) =>
          prev.map((r) =>
            r.id === regId
              ? { ...r, status: 'verified', verified_at: new Date().toISOString() }
              : r
          )
        );
      }
    } finally {
      setCheckingInId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Student Registration Verification Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Verify Event Registration
        </h1>
        <p className="text-slate-600 text-sm mt-2">
          Enter your registered student email or registration ticket code to verify your college event pass and admission status.
        </p>
      </div>

      {/* Verification Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 mb-8">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="verification-query-input"
              type="text"
              required
              placeholder="Enter Student Email (e.g., student@commecs.edu) or Ticket Code (e.g., EVT-7392-8A)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            id="search-verify-btn"
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2 shrink-0"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Registration</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Pre-fill Links */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Quick Test Examples:</span>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('alex.rivera@commecs.edu');
              performSearch('alex.rivera@commecs.edu');
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition-colors"
          >
            alex.rivera@commecs.edu
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('sophia.c@commecs.edu');
              performSearch('sophia.c@commecs.edu');
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition-colors"
          >
            sophia.c@commecs.edu
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('EVT-7392-8A');
              performSearch('EVT-7392-8A');
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition-colors font-mono"
          >
            EVT-7392-8A
          </button>
        </div>
      </div>

      {/* SEARCH RESULTS */}
      {hasSearched && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {registrations.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BadgeCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-lg">
                    Found {registrations.length} Active {registrations.length === 1 ? 'Registration' : 'Registrations'}
                  </h3>
                </div>
                <span className="text-xs text-slate-500">Verified against college database</span>
              </div>

              {registrations.map((reg) => {
                const event = reg.event;
                const isVerified = reg.status === 'verified';

                return (
                  <div
                    key={reg.id}
                    id={`registration-card-${reg.id}`}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                  >
                    {/* Top status bar */}
                    <div
                      className={`px-5 py-3 border-b flex items-center justify-between ${
                        isVerified
                          ? 'bg-emerald-50/80 border-emerald-100 text-emerald-900'
                          : 'bg-indigo-50/70 border-indigo-100 text-indigo-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {isVerified ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Ticket className="w-4 h-4 text-indigo-600" />
                        )}
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {isVerified ? 'Verified & Checked-In at Venue' : 'Confirmed Registration Pass'}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold bg-white/80 px-2.5 py-0.5 rounded-full border border-slate-200">
                        {reg.registration_code}
                      </span>
                    </div>

                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        {/* Event & Student Details */}
                        <div className="space-y-3 flex-1">
                          <div>
                            {event?.category && (
                              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                {event.category}
                              </span>
                            )}
                            <h4 className="text-xl font-extrabold text-slate-900 mt-1">
                              {event?.title || 'College Event'}
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400">Student Name</p>
                              <p className="font-bold text-slate-800 text-sm">{reg.student_name}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400">Registered Email</p>
                              <p className="font-semibold text-slate-700 truncate">{reg.student_email}</p>
                            </div>
                            <div className="flex items-center space-x-1.5 col-span-1 sm:col-span-2">
                              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{event?.date || 'Scheduled'}</span>
                              <span className="mx-1 text-slate-300">•</span>
                              <Clock className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{event?.time || 'TBD'}</span>
                            </div>
                            <div className="flex items-center space-x-1.5 col-span-1 sm:col-span-2">
                              <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{event?.location || 'Campus'}</span>
                            </div>
                          </div>

                          {/* Timestamp logs */}
                          <div className="text-[11px] text-slate-400 flex flex-wrap gap-4">
                            <span>
                              Registered:{' '}
                              {new Date(reg.registered_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {reg.verified_at && (
                              <span className="text-emerald-600 font-medium">
                                Checked-In:{' '}
                                {new Date(reg.verified_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Ticket Code & QR Pass Card */}
                        <div className="w-full md:w-56 bg-gradient-to-b from-slate-900 to-slate-800 text-white rounded-xl p-4 flex flex-col items-center text-center shrink-0 shadow-sm">
                          <div className="w-24 h-24 bg-white p-2 rounded-lg mb-3 shadow-inner flex items-center justify-center">
                            {/* Visual QR Code Generator */}
                            <svg
                              className="w-full h-full text-slate-900"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect x="3" y="3" width="7" height="7" rx="1" />
                              <rect x="14" y="3" width="7" height="7" rx="1" />
                              <rect x="3" y="14" width="7" height="7" rx="1" />
                              <circle cx="6.5" cy="6.5" r="1.5" fill="currentColor" />
                              <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
                              <circle cx="6.5" cy="17.5" r="1.5" fill="currentColor" />
                              <path d="M14 14h3v3h-3z" />
                              <path d="M20 14v3h-3" />
                              <path d="M14 20h7" />
                            </svg>
                          </div>

                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            Official Ticket Code
                          </span>
                          <span className="font-mono font-bold text-sm text-emerald-400 mt-0.5 mb-2">
                            {reg.registration_code}
                          </span>

                          <div className="w-full flex items-center gap-1.5">
                            <button
                              onClick={() => handleCopy(reg.registration_code)}
                              className="flex-1 bg-slate-700 hover:bg-slate-600 text-[11px] py-1.5 px-2 rounded-md font-medium flex items-center justify-center space-x-1 transition-colors"
                            >
                              {copiedCode === reg.registration_code ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-slate-300" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => window.print()}
                              className="bg-slate-700 hover:bg-slate-600 text-[11px] p-1.5 rounded-md text-slate-300 transition-colors"
                              title="Print ticket pass"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Coordinator / Venue Desk Actions */}
                      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <span className="text-xs text-slate-500">
                          {isVerified
                            ? '✅ Student identity and ticket verified at entry desk.'
                            : '⚡ Ready for campus desk verification.'}
                        </span>

                        {!isVerified && (
                          <button
                            id={`checkin-btn-${reg.id}`}
                            onClick={() => handleCheckIn(reg.id)}
                            disabled={checkingInId === reg.id}
                            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm flex items-center justify-center space-x-1.5 transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {checkingInId === reg.id ? 'Checking In...' : 'Verify & Check In Student'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Not Found Alert */
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-lg mx-auto shadow-sm">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">No Registration Found</h3>
              <p className="text-slate-600 text-xs sm:text-sm mt-1.5 max-w-md mx-auto leading-relaxed">
                {errorMessage ||
                  `We could not find any active event registration matching "${searchQuery}". Ensure your email or ticket code is spelled correctly.`}
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setSearchQuery('')}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Try Another Search
                </button>
                <button
                  onClick={onNavigateToEvents}
                  className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm transition-colors"
                >
                  <span>Browse & Register Events</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
