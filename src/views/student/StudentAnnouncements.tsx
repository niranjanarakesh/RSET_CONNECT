import React, { useState, useEffect } from 'react';
import { AnnouncementItem } from '../../types';
import { Bell, Search, Filter, Calendar, User, Tag } from 'lucide-react';

const CATEGORIES = ['All', 'Academic', 'Examination', 'Placement', 'Cultural', 'General'];

export const StudentAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch('/api/announcements');
        if (res.ok) {
          setAnnouncements(await res.json());
        }
      } catch (err) {
        console.error('Error fetching announcements:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const filtered = announcements.filter((a) => {
    const matchCategory = selectedCategory === 'All' || a.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.message.toLowerCase().includes(search.toLowerCase()) ||
      a.author.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Official Announcements</h1>
        <p className="text-xs text-slate-500 sm:text-sm">
          Circulars, examination notices, and official campus advisories.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search circulars, keywords, or officers..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-950 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map((ann) => (
            <div
              key={ann.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-200"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-800 uppercase tracking-wider">
                    {ann.category}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar className="h-3 w-3" />
                    <span>{ann.date}</span>
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <User className="h-3 w-3 text-slate-400" />
                  <span>Authority: <strong>{ann.author}</strong></span>
                </div>
              </div>

              <div className="mt-3">
                <h3 className="text-base font-bold text-slate-900">{ann.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 whitespace-pre-line">
                  {ann.message}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-xs text-slate-400">
            No circulars match your search query.
          </div>
        )}
      </div>
    </div>
  );
};
