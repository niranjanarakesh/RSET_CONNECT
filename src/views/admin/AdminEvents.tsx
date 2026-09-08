import React, { useState, useEffect } from 'react';
import { EventItemType } from '../../types';
import { Calendar, Plus, Trash2, Clock, MapPin, X, CheckCircle2 } from 'lucide-react';

export const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<EventItemType[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '2026-10-15',
    time: '10:00 AM - 04:30 PM',
    venue: 'Auditorium',
    description: '',
    category: 'Technical',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        setEvents(await res.json());
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccessMsg(`Event "${formData.title}" added to events.csv.`);
        setShowAdd(false);
        fetchEvents();
      }
    } catch (err) {
      alert('Error creating event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchEvents();
      }
    } catch (err) {
      alert('Error deleting event');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Campus Events & Symposia</h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Technical fests, guest lectures, department workshops, and cultural activities.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-950 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-900 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Campus Event</span>
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

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Add Campus Event</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700">Event Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Abhiyanthriki National Tech Fest"
                  className="mt-1 block w-full rounded-lg border border-slate-300 p-2 font-medium text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                  >
                    {['Technical', 'Cultural', 'Sports', 'Workshop', 'Conference'].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Time Window</label>
                  <input
                    type="text"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="09:30 AM - 04:30 PM"
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Venue</label>
                  <input
                    type="text"
                    required
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="Auditorium, Gallery Hall"
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Key details, speakers, or student eligibility..."
                  className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
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
                  {submitting ? 'Saving...' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Events Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3.5">Event Title</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Date & Time</th>
                <th className="px-4 py-3.5">Venue</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {events.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3 font-semibold text-slate-900">
                    <div>{evt.title}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{evt.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-800 uppercase">
                      {evt.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <div className="font-mono font-medium">{evt.date}</div>
                    <div className="text-[10px] text-slate-400">{evt.time}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-800">{evt.venue}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDelete(evt.id)}
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
