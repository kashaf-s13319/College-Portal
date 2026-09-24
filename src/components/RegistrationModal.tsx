import React, { useState } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Ticket,
  Copy,
  Check,
  Printer,
  ShieldAlert,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CollegeEvent, StudentRegistration, RegistrationOutcome } from '../types';
import { registerStudent } from '../lib/supabase';

interface RegistrationModalProps {
  event: CollegeEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (reg: StudentRegistration) => void;
  onNavigateToVerify: (email: string) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  event,
  isOpen,
  onClose,
  onSuccess,
  onNavigateToVerify,
}) => {
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<RegistrationOutcome | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !event) return null;

  const handleReset = () => {
    setOutcome(null);
    setStudentName('');
    setStudentEmail('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentEmail.trim()) return;

    setIsSubmitting(true);
    setOutcome(null);

    try {
      const res = await registerStudent(event.id, studentName, studentEmail);
      setOutcome(res);

      if (res.success && res.registration) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b'],
        });
        onSuccess(res.registration);
      }
    } catch (err: any) {
      setOutcome({
        success: false,
        error: err.message || 'An unexpected error occurred while registering.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="registration-modal-container"
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Student Event Registration</h2>
              <p className="text-xs text-slate-300">College Admission & Ticket Pass</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Selected Event Card Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {event.category}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1.5">{event.title}</h3>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center space-x-1.5 col-span-2">
                <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            </div>
          </div>

          {/* SUCCESS STATE: Digital Registration Ticket Pass */}
          {outcome?.success && outcome.registration ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-900 flex items-center space-x-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Registration Confirmed!</h4>
                  <p className="text-xs text-emerald-700">
                    You have successfully registered. Keep your registration code for event check-in.
                  </p>
                </div>
              </div>

              {/* Digital Pass Mockup */}
              <div className="border-2 border-dashed border-indigo-200 bg-gradient-to-b from-indigo-50/40 to-white rounded-2xl p-5 shadow-xs relative overflow-hidden">
                <div className="flex justify-between items-start border-b border-indigo-100 pb-3 mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                      Commecs College • Official Pass
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-base">{event.title}</h4>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    Confirmed
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Student Name</p>
                    <p className="font-bold text-slate-800 text-sm">{outcome.registration.student_name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Student Email</p>
                    <p className="font-medium text-slate-700 truncate">{outcome.registration.student_email}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Date & Time</p>
                    <p className="font-semibold text-slate-700">{event.date}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Venue</p>
                    <p className="font-semibold text-slate-700 truncate">{event.location}</p>
                  </div>
                </div>

                {/* Registration Code Banner */}
                <div className="bg-slate-900 text-white rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Registration Ticket Code
                    </p>
                    <p className="font-mono font-black text-lg text-emerald-400 tracking-wider">
                      {outcome.registration.registration_code}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopyCode(outcome.registration!.registration_code)}
                    className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-300" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center space-x-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Print Ticket</span>
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* DUPLICATE ERROR ALERT */}
              {outcome && !outcome.success && (
                <div
                  id="duplicate-error-alert"
                  className={`p-4 rounded-xl border flex items-start space-y-1 ${
                    outcome.alreadyRegistered
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="shrink-0 mt-0.5 mr-3">
                    {outcome.alreadyRegistered ? (
                      <ShieldAlert className="w-5 h-5 text-rose-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">
                      {outcome.alreadyRegistered
                        ? 'Registration Denied: Duplicate Entry'
                        : 'Registration Failed'}
                    </h4>
                    <p className="text-xs mt-1 leading-relaxed text-rose-800">
                      {outcome.error}
                    </p>

                    {outcome.alreadyRegistered && (
                      <div className="mt-3 pt-2 border-t border-rose-200 flex items-center justify-between">
                        <span className="text-xs text-rose-700 font-medium">Already registered?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onNavigateToVerify(studentEmail);
                          }}
                          className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center space-x-1 underline underline-offset-2"
                        >
                          <span>Verify & View Ticket Pass</span>
                          <ArrowRight className="w-3 h-3 ml-0.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Single Registration Policy Note */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="font-semibold">One Registration Rule:</strong> Each student may only register once per event using their email. Duplicate registrations will be rejected.
                </p>
              </div>

              {/* Input: Student Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Student Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="student-name-input"
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Input: Student Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Student Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  id="student-email-input"
                  type="email"
                  required
                  placeholder="e.g. s13319@commecscollege.edu.pk"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Used for ticket verification and to enforce single registration per event.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="submit-registration-btn"
                  type="submit"
                  disabled={isSubmitting || !studentName.trim() || !studentEmail.trim()}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-sm flex items-center justify-center space-x-1.5 transition-all ${
                    isSubmitting || !studentName.trim() || !studentEmail.trim()
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 hover:shadow'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                      <span>Checking & Registering...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
