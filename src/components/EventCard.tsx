import React from 'react';
import { Calendar, Clock, MapPin, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { CollegeEvent } from '../types';

interface EventCardProps {
  event: CollegeEvent;
  onRegister: (event: CollegeEvent) => void;
  onViewDetails: (event: CollegeEvent) => void;
  isRegisteredByCurrentUser?: boolean;
}

const CATEGORY_STYLES: Record<string, string> = {
  Technology: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Cultural: 'bg-rose-50 text-rose-700 border-rose-200',
  Academic: 'bg-sky-50 text-sky-700 border-sky-200',
  Sports: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Career: 'bg-amber-50 text-amber-800 border-amber-200',
  Workshop: 'bg-purple-50 text-purple-700 border-purple-200',
  General: 'bg-slate-50 text-slate-700 border-slate-200',
};

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onRegister,
  onViewDetails,
  isRegisteredByCurrentUser,
}) => {
  const registeredCount = event.registered_count || 0;
  const isFull = registeredCount >= event.capacity;
  const percentFull = Math.min(100, Math.round((registeredCount / event.capacity) * 100));

  const categoryStyle = CATEGORY_STYLES[event.category] || CATEGORY_STYLES.General;

  // Format human friendly date
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      id={`event-card-${event.id}`}
      className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden"
    >
      {/* Event Header Image */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-slate-800 flex items-center justify-center text-white font-bold text-xl">
            {event.title}
          </div>
        )}

        {/* Category Pill */}
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shadow-sm backdrop-blur-md ${categoryStyle}`}>
            {event.category}
          </span>
        </div>

        {/* Status Indicator */}
        {isRegisteredByCurrentUser && (
          <div className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Registered</span>
          </div>
        )}
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-500 mb-1.5">
            <span>{event.organizer || 'College Event Board'}</span>
          </div>

          <h3 className="font-bold text-slate-900 text-lg leading-snug tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">
            {event.title}
          </h3>

          <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed mb-4">
            {event.description}
          </p>

          {/* Event Metadata */}
          <div className="space-y-2 text-xs text-slate-600 mb-4 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="font-medium text-slate-800">{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          </div>
        </div>

        {/* Capacity & Register CTA */}
        <div className="pt-2 border-t border-slate-100 mt-2">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="flex items-center space-x-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium text-slate-700">{registeredCount}</span>
              <span>/ {event.capacity} registered</span>
            </span>
            <span className={`font-semibold ${isFull ? 'text-rose-600' : 'text-emerald-600'}`}>
              {isFull ? 'At Capacity' : `${event.capacity - registeredCount} spots left`}
            </span>
          </div>

          {/* Mini progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFull ? 'bg-rose-500' : percentFull > 80 ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${percentFull}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              id={`details-btn-${event.id}`}
              onClick={() => onViewDetails(event)}
              className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Details
            </button>

            <button
              id={`register-btn-${event.id}`}
              onClick={() => onRegister(event)}
              disabled={isFull}
              className={`w-full flex items-center justify-center space-x-1 text-xs font-semibold py-2 px-3 rounded-lg shadow-sm transition-all ${
                isFull
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow'
              }`}
            >
              <span>{isFull ? 'Full' : 'Register'}</span>
              {!isFull && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
