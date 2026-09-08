import React, { useState, useEffect } from 'react';
import { BusItem } from '../../types';
import { Bus, MapPin, Phone, User, Info, Navigation, CheckCircle2 } from 'lucide-react';

export const StudentBusTracking: React.FC = () => {
  const [buses, setBuses] = useState<BusItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const res = await fetch('/api/buses');
        if (res.ok) {
          setBuses(await res.json());
        }
      } catch (err) {
        console.error('Error fetching buses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBuses();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">College Bus Fleet & Transit Schedule</h1>
        <p className="text-xs text-slate-500 sm:text-sm">
          Campus bus routes, designated boarding stations, and active driver contacts.
        </p>
      </div>

      {/* Mandatory Demo Transit Notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-950 sm:text-sm">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
        <div>
          <div className="font-bold">Demo Transit Information Notice</div>
          <p className="mt-0.5 text-xs text-sky-900">
            This module displays scheduled transit routes and station stops managed by the RSET Transport
            Committee. Real-time GPS hardware telematics is not claimed. For immediate bus queries, please
            contact the assigned driver or transport supervisor directly.
          </p>
        </div>
      </div>

      {/* Buses List */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {buses.map((bus) => (
          <div
            key={bus.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all hover:border-indigo-300"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-950 text-white">
                  <Bus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Bus #{bus.bus_no}
                  </h3>
                  <p className="text-xs font-medium text-slate-500">{bus.route_name}</p>
                </div>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  bus.status === 'On Time'
                    ? 'bg-emerald-100 text-emerald-800'
                    : bus.status === 'At Stop'
                    ? 'bg-sky-100 text-sky-800'
                    : bus.status === 'Delayed'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {bus.status}
              </span>
            </div>

            {/* Current Stop & Route */}
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
                <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Current Estimated Location
                  </span>
                  <div className="text-sm font-bold text-slate-900">{bus.current_stop}</div>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500">Route Waypoints & Stops:</span>
                <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                  {bus.stops}
                </p>
              </div>

              {/* Driver Contact */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>Driver: <strong>{bus.driver_name}</strong></span>
                </div>

                <a
                  href={`tel:${bus.driver_phone}`}
                  className="inline-flex items-center gap-1 font-mono font-semibold text-indigo-700 hover:text-indigo-900 hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>{bus.driver_phone}</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
