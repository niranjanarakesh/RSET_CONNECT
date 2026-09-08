import React, { useState, useEffect } from 'react';
import { AnnouncementItem } from '../../types';
import { Bell, Plus, Trash2, Calendar, User, Tag, CheckCircle2, X } from 'lucide-react';

export const AdminAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: 'Academic',
    author: 'Principal Office',
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) {
        setAnnouncements(await res.json());
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccessMsg('Announcement published and appended to announcements.csv.');
        setShowAdd(false);
        setFormData({
          title: '',
          message: '',
          category: 'Academic',
          author: 'Principal Office',
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        });
        fetchAnnouncements();
      }
    } catch (err) {
      alert('Error publishing announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this circular?')) return;
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAnnouncements();
      }
    } catch (err) {
      alert('Error deleting announcement');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Publish & Manage Circulars</h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Official institutional announcements, examination notices, and campus advisories.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-950 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-900 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Publish Circular</span>
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
              <h2 className="text-base font-bold text-slate-900">Publish Campus Announcement</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700">Circular Headline</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Schedule for First Internal Examination..."
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
                    {['Academic', 'Examination', 'Placement', 'Cultural', 'General'].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Issuing Authority</label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Notice Body / Message</label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Detailed notification text..."
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
                  {submitting ? 'Publishing...' : 'Publish to Portal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-3">
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
          >
            <div>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-800 uppercase">
                  {ann.category}
                </span>
                <span className="text-slate-400">•</span>
                <span className="font-mono text-slate-500">{ann.date}</span>
                <span className="text-slate-400">•</span>
                <span className="font-medium text-slate-700">{ann.author}</span>
              </div>
              <h3 className="mt-2 text-sm font-bold text-slate-900 sm:text-base">{ann.title}</h3>
              <p className="mt-1 text-xs text-slate-600 whitespace-pre-line">{ann.message}</p>
            </div>

            <button
              onClick={() => handleDelete(ann.id)}
              className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-700"
              title="Delete Circular"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
