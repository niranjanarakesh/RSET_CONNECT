import React, { useState, useEffect } from 'react';
import { EventItemType } from '../../types';
import { Calendar, Clock, MapPin, Tag } from 'lucide-react';

export const StudentEvents: React.FC = () => {
  const [events, setEvents] = useState<EventItemType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events');
        if (res.ok) {
          setEvents(await res.json());
        }
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Campus Events & Symposia</h1>
        <p className="text-xs text-slate-500 sm:text-sm">
          Technical conferences, cultural festivals, and departmental workshops.
        </p>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((evt) => (
          <div
            key={evt.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-800 uppercase">
                  {evt.category || 'Event'}
                </span>
                <div className="flex items-center gap-1 font-mono text-xs font-semibold text-indigo-950">
                  <Calendar className="h-3.5 w-3.5 text-indigo-700" />
                  <span>{evt.date}</span>
                </div>
              </div>

              <h3 className="mt-3 text-base font-bold text-slate-900">{evt.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-3">
                {evt.description}
              </p>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-3 space-y-1 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>{evt.time}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span className="truncate">{evt.venue}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
