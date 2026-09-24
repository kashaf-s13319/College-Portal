import React from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  Building,
  ArrowRight,
} from 'lucide-react';
import { CollegeEvent } from '../types';

interface EventDetailsModalProps {
  event: CollegeEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onRegister: (event: CollegeEvent) => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  isOpen,
  onClose,
  onRegister,
}) => {
  if (!isOpen || !event) return null;

  const registered = event.registered_count || 0;
  const isFull = registered >= event.capacity;
  const available = Math.max(0, event.capacity - registered);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Banner image */}
        <div className="relative h-56 w-full bg-slate-900">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-indigo-950 flex items-center justify-center text-white font-bold text-2xl">
              {event.title}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-slate-900/60 hover:bg-slate-900 text-white p-1.5 rounded-full backdrop-blur-xs transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 text-white">
            <span className="text-xs font-semibold uppercase tracking-wider bg-indigo-600 px-2.5 py-0.5 rounded-full">
              {event.category}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold mt-1.5 leading-tight">{event.title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key metadata grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Date</p>
                <p className="text-xs font-bold text-slate-800">{event.date}</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center space-x-3">
              <Clock className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Time</p>
                <p className="text-xs font-bold text-slate-800">{event.time}</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Location</p>
                <p className="text-xs font-bold text-slate-800 truncate">{event.location}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              About This Event
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Organizer & Capacity */}
          <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-slate-400" />
              <span>
                Organized by: <strong className="text-slate-800">{event.organizer || 'College Board'}</strong>
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span>
                Registered:{' '}
                <strong className="text-slate-800">
                  {registered} / {event.capacity} ({available} remaining)
                </strong>
              </span>
            </div>
          </div>

          {/* Duplicate protection guarantee note */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Verified Admissions:</strong> Student emails are checked against our database. Each student can only register once to guarantee fair attendance for all students.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Close
          </button>

          <button
            onClick={() => {
              onClose();
              onRegister(event);
            }}
            disabled={isFull}
            className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm flex items-center space-x-1.5 transition-all ${
              isFull
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
            }`}
          >
            <span>{isFull ? 'Event Sold Out' : 'Register Now'}</span>
            {!isFull && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
