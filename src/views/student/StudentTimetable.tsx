import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser, TimetableSlot } from '../../types';
import { CalendarDays, Clock, MapPin, User, Printer } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const StudentTimetable: React.FC = () => {
  const { user } = useAuth();
  const student = user as StudentUser;

  const [activeDay, setActiveDay] = useState<string>('Monday');
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const res = await fetch(`/api/timetable?class=${encodeURIComponent(student?.class || 'S5 CSE A')}&day=${activeDay}`);
        if (res.ok) {
          const list: TimetableSlot[] = await res.json();
          setTimetable(list);
        }
      } catch (err) {
        console.error('Error fetching timetable:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, [student?.class, activeDay]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Class Timetable</h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Weekly classroom lecture and laboratory schedule for <strong className="text-slate-800">{student?.class}</strong>.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer print:hidden"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Schedule</span>
        </button>
      </div>

      {/* Day Selector */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-xs print:hidden">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeDay === day
                ? 'bg-indigo-950 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Timetable Grid */}
      <div className="space-y-3">
        {timetable.length > 0 ? (
          timetable.map((slot, index) => (
            <div
              key={slot.id || index}
              className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-indigo-200 sm:flex-row sm:items-center sm:p-5"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-28 shrink-0 flex-col items-center justify-center rounded-xl bg-indigo-50 text-center text-indigo-950">
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    <Clock className="h-3 w-3 text-indigo-700" />
                    <span>{slot.time.split('-')[0]?.trim()}</span>
                  </div>
                  <div className="text-[10px] text-indigo-600">
                    to {slot.time.split('-')[1]?.trim()}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                    {slot.subject}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>{slot.teacher}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{slot.room}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="self-end sm:self-center">
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  Hour {index + 1}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-xs text-slate-400">
            No scheduled lecture hours for {activeDay} in this class.
          </div>
        )}
      </div>
    </div>
  );
};
