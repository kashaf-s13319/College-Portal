import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Download,
  Calendar,
  ShieldCheck,
  RefreshCw,
  Ticket,
} from 'lucide-react';
import { StudentRegistration, CollegeEvent } from '../types';
import { getAllRegistrations, getEvents, markAsVerified } from '../lib/supabase';

export const AdminRegistrationsView: React.FC = () => {
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'verified'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [regsData, eventsData] = await Promise.all([
        getAllRegistrations(),
        getEvents(),
      ]);
      setRegistrations(regsData);
      setEvents(eventsData);
    } catch (err) {
      console.error('Error loading registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    try {
      const success = await markAsVerified(id);
      if (success) {
        setRegistrations((prev) =>
          prev.map((r) =>
            r.id === id
              ? { ...r, status: 'verified', verified_at: new Date().toISOString() }
              : r
          )
        );
      }
    } finally {
      setVerifyingId(null);
    }
  };

  // Filter registrations
  const filteredRegistrations = registrations.filter((r) => {
    const matchesEvent = selectedEventId === 'all' || r.event_id === selectedEventId;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.student_name.toLowerCase().includes(q) ||
      r.student_email.toLowerCase().includes(q) ||
      r.registration_code.toLowerCase().includes(q) ||
      (r.event?.title && r.event.title.toLowerCase().includes(q));

    return matchesEvent && matchesStatus && matchesSearch;
  });

  // Calculate stats
  const totalRegs = registrations.length;
  const verifiedCount = registrations.filter((r) => r.status === 'verified').length;
  const uniqueEmails = new Set(registrations.map((r) => r.student_email.toLowerCase())).size;
  const checkInRate = totalRegs > 0 ? Math.round((verifiedCount / totalRegs) * 100) : 0;

  // Export CSV
  const handleExportCSV = () => {
    if (filteredRegistrations.length === 0) return;

    const headers = [
      'Registration Code',
      'Event Title',
      'Student Name',
      'Student Email',
      'Status',
      'Registered At',
      'Verified At',
    ];

    const rows = filteredRegistrations.map((r) => [
      `"${r.registration_code}"`,
      `"${r.event?.title || r.event_id}"`,
      `"${r.student_name}"`,
      `"${r.student_email}"`,
      `"${r.status}"`,
      `"${r.registered_at}"`,
      `"${r.verified_at || 'Not Checked-in'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `college_event_registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Event Coordinators & Admissions Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Registered Students Directory
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Monitor real-time student registrations, perform venue check-ins, and prevent duplicate admissions.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={loadData}
            title="Refresh records"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filteredRegistrations.length === 0}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-300" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Registrations</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalRegs}</span>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              Across all events
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Verified at Venue</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{verifiedCount}</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {checkInRate}% Checked-in
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Distinct Students</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{uniqueEmails}</span>
            <span className="text-xs font-medium text-slate-500">Unique emails</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Events</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{events.length}</span>
            <span className="text-xs font-medium text-slate-500">In database</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, email, ticket code, or event title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Event Filter */}
        <div className="w-full md:w-64">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full py-2 px-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">All Events ({registrations.length})</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full py-2 px-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed Only</option>
            <option value="verified">Verified Only</option>
          </select>
        </div>
      </div>

      {/* Registrations Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
            <span>Loading registered students...</span>
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            <Ticket className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No matching registrations found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or event filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Ticket Code</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Venue Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRegistrations.map((reg) => {
                  const isVerified = reg.status === 'verified';
                  return (
                    <tr key={reg.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{reg.student_name}</div>
                        <div className="text-xs text-slate-500 font-mono">{reg.student_email}</div>
                      </td>

                      {/* Event Info */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 truncate">
                          {reg.event?.title || 'Event ID: ' + reg.event_id}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{reg.event?.date || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Ticket Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs">
                          {reg.registration_code}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {isVerified ? (
                          <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 bg-sky-50 text-sky-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-sky-200">
                            <Clock className="w-3 h-3 text-sky-500" />
                            <span>Confirmed</span>
                          </span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {new Date(reg.registered_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isVerified ? (
                          <span className="text-[11px] text-emerald-700 font-medium">
                            Checked In
                          </span>
                        ) : (
                          <button
                            onClick={() => handleVerify(reg.id)}
                            disabled={verifyingId === reg.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow-2xs transition-colors"
                          >
                            {verifyingId === reg.id ? 'Saving...' : 'Check In'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
