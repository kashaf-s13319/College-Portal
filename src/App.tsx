import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Calendar,
  ShieldCheck,
  Users,
  RefreshCw,
  AlertCircle,
  Tag,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import { CollegeEvent, StudentRegistration } from './types';
import { getEvents } from './lib/supabase';
import { Navbar } from './components/Navbar';
import { EventCard } from './components/EventCard';
import { RegistrationModal } from './components/RegistrationModal';
import { EventDetailsModal } from './components/EventDetailsModal';
import { VerificationView } from './components/VerificationView';
import { AdminRegistrationsView } from './components/AdminRegistrationsView';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';

const CATEGORIES = [
  'All Categories',
  'Technology',
  'Cultural',
  'Academic',
  'Sports',
  'Career',
  'Workshop',
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'events' | 'verify' | 'admin' | 'setup'>('events');
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Modals state
  const [selectedEventForRegister, setSelectedEventForRegister] = useState<CollegeEvent | null>(null);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<CollegeEvent | null>(null);
  const [verificationPrefill, setVerificationPrefill] = useState('');

  // Load events
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Filter events based on search query and category
  const filteredEvents = events.filter((ev) => {
    const matchesCategory =
      selectedCategory === 'All Categories' || ev.category.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      ev.title.toLowerCase().includes(query) ||
      ev.description.toLowerCase().includes(query) ||
      ev.location.toLowerCase().includes(query) ||
      (ev.organizer && ev.organizer.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  const handleOpenRegistration = (event: CollegeEvent) => {
    setSelectedEventForRegister(event);
  };

  const handleOpenDetails = (event: CollegeEvent) => {
    setSelectedEventForDetails(event);
  };

  const handleRegistrationSuccess = (reg: StudentRegistration) => {
    // Refresh events to reflect new registration counts
    fetchEvents();
  };

  const handleNavigateToVerify = (emailOrCode: string) => {
    setVerificationPrefill(emailOrCode);
    setActiveTab('verify');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenVerify={() => {
          setVerificationPrefill('');
          setActiveTab('verify');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'events' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 shadow-xl border border-slate-800">
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-md">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  <span>College Event Registrations & Pass Portal</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                  Discover Campus Events & Register Instantly
                </h1>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Browse upcoming campus activities, technology hackathons, cultural festivals, and career expos. Register once using your student email to claim your digital event ticket pass.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      setVerificationPrefill('');
                      setActiveTab('verify');
                    }}
                    className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify My Registration</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('admin')}
                    className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-700 transition-all"
                  >
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Coordinator Dashboard</span>
                  </button>
                </div>
              </div>

              {/* Decorative background glow */}
              <div className="absolute -right-16 -top-16 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute right-32 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Duplicate policy reminder banner */}
            <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 text-xs text-amber-900 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  <strong>Single Registration Policy:</strong> Each student is strictly permitted to register only once per event with their student email. Re-registration attempts for the same event will be denied.
                </span>
              </div>
              <button
                onClick={() => setActiveTab('verify')}
                className="text-indigo-700 hover:text-indigo-900 font-bold shrink-0 underline underline-offset-2 flex items-center space-x-1"
              >
                <span>Check Your Registrations</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Search and Category Filter Toolbar */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="events-search-input"
                    type="text"
                    placeholder="Search events by title, venue, or keyword..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>

                {/* Category Pills */}
                <div className="w-full md:w-auto flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-xs font-semibold px-3 py-2 rounded-xl whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Events Grid */}
            <div>
              {loading ? (
                <div className="py-24 text-center text-slate-500">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
                  <p className="text-sm font-semibold text-slate-700">Loading campus events from database...</p>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8">
                  <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-900 text-lg">No events found</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    No upcoming events matched your filter criteria. Try selecting another category or clearing your search.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All Categories');
                    }}
                    className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-4 py-2 rounded-xl transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onRegister={handleOpenRegistration}
                      onViewDetails={handleOpenDetails}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Verification View */}
        {activeTab === 'verify' && (
          <VerificationView
            initialQuery={verificationPrefill}
            onNavigateToEvents={() => setActiveTab('events')}
          />
        )}

        {/* Admin Coordinator View */}
        {activeTab === 'admin' && <AdminRegistrationsView />}

        {/* Supabase Integration Guide */}
        {activeTab === 'setup' && <SupabaseSetupModal />}
      </main>

      {/* Registration Modal */}
      <RegistrationModal
        event={selectedEventForRegister}
        isOpen={!!selectedEventForRegister}
        onClose={() => setSelectedEventForRegister(null)}
        onSuccess={handleRegistrationSuccess}
        onNavigateToVerify={handleNavigateToVerify}
      />

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEventForDetails}
        isOpen={!!selectedEventForDetails}
        onClose={() => setSelectedEventForDetails(null)}
        onRegister={(ev) => {
          setSelectedEventForDetails(null);
          setSelectedEventForRegister(ev);
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-700">College Event Registration System</span>
            <span className="text-slate-300">•</span>
            <span>Duplicate Admissions Protection</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('setup')}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Supabase SQL Schema
            </button>
            <button
              onClick={() => setActiveTab('verify')}
              className="text-slate-600 hover:text-slate-900"
            >
              Verify Ticket
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className="text-slate-600 hover:text-slate-900"
            >
              Coordinator Portal
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
