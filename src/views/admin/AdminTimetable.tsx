import React, { useState, useEffect } from 'react';
import { TimetableSlot } from '../../types';
import { CalendarDays, Plus, Trash2, Clock, MapPin, User, X, CheckCircle2 } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const AdminTimetable: React.FC = () => {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [selectedClass, setSelectedClass] = useState('S5 CSE A');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [showAdd, setShowAdd] = useState(false);

  const [formData, setFormData] = useState({
    class: 'S5 CSE A',
    day: 'Monday',
    time: '08:45 AM - 09:40 AM',
    subject: '',
    teacher: '',
    room: 'KE-302',
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchTimetable = async () => {
    try {
      const res = await fetch(`/api/timetable?class=${encodeURIComponent(selectedClass)}&day=${selectedDay}`);
      if (res.ok) {
        setSlots(await res.json());
      }
    } catch (err) {
      console.error('Error fetching timetable:', err);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [selectedClass, selectedDay]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccessMsg(`Class timetable slot added successfully.`);
        setShowAdd(false);
        fetchTimetable();
      }
    } catch (err) {
      alert('Error creating timetable slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this timetable slot?')) return;
    try {
      const res = await fetch(`/api/timetable/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTimetable();
      }
    } catch (err) {
      alert('Error deleting slot');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Class Timetable Management</h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Schedule lecture periods, laboratory practicals, and classroom allocations.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({ ...formData, class: selectedClass, day: selectedDay });
            setShowAdd(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-950 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-900 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Lecture Period</span>
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Selectors Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700">Class:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:outline-none"
          >
            {['S5 CSE A', 'S5 CSE B', 'S5 ECE A', 'S5 ME A'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedDay === day
                  ? 'bg-indigo-950 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Add Lecture Slot</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Class</label>
                  <input
                    type="text"
                    required
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Day of Week</label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Time Window</label>
                <input
                  type="text"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  placeholder="08:45 AM - 09:40 AM"
                  className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Course / Subject</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Formal course name..."
                  className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Faculty Instructor</label>
                  <input
                    type="text"
                    required
                    value={formData.teacher}
                    onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                    placeholder="Prof. Name"
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Classroom / Lab</label>
                  <input
                    type="text"
                    required
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="KE-302"
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="rounded-lg border border-slate-300 px-3.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-950 px-4 py-1.5 font-bold text-white hover:bg-indigo-900 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slots List */}
      <div className="space-y-3">
        {slots.map((slot) => (
          <div
            key={slot.id}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-24 items-center justify-center rounded-lg bg-indigo-50 font-mono text-xs font-bold text-indigo-950">
                {slot.time.split('-')[0]?.trim()}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{slot.subject}</h3>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                  <span>{slot.teacher}</span>
                  <span>•</span>
                  <span>{slot.room}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDelete(slot.id)}
              className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-700"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
