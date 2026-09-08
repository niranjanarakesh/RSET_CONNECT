import React, { useState, useEffect } from 'react';
import { BusItem } from '../../types';
import {
  Bus,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Phone,
  User,
  Navigation,
  CheckCircle2,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Play,
  RotateCw,
  Search,
  Filter,
  AlertCircle,
} from 'lucide-react';

interface ExtendedBusItem extends BusItem {
  capacity?: number;
  occupied?: number;
  fee_per_semester?: number;
}

export const AdminBusManagement: React.FC = () => {
  const [buses, setBuses] = useState<ExtendedBusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [showModal, setShowModal] = useState(false);
  const [editingBusId, setEditingBusId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    bus_no: '15',
    route_name: '',
    stops: '',
    driver_name: '',
    driver_phone: '+91 94470 00000',
    current_stop: 'Campus Terminal',
    status: 'On Time' as BusItem['status'],
    capacity: 52,
    occupied: 44,
    fee_per_semester: 12500,
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchBuses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/buses');
      if (res.ok) {
        const data: BusItem[] = await res.json();
        // Enrich with capacity & fee defaults if missing
        const enriched = data.map((b, idx) => ({
          ...b,
          capacity: (b as any).capacity || 52,
          occupied: (b as any).occupied || Math.min(48, 38 + (idx * 3) % 14),
          fee_per_semester: (b as any).fee_per_semester || (11000 + (idx % 3) * 1500),
        }));
        setBuses(enriched);
      }
    } catch (err) {
      console.error('Error fetching buses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  const handleOpenAdd = () => {
    setEditingBusId(null);
    setFormData({
      bus_no: String(buses.length + 1),
      route_name: '',
      stops: '',
      driver_name: '',
      driver_phone: '+91 94470 00000',
      current_stop: 'Campus Terminal',
      status: 'On Time',
      capacity: 52,
      occupied: 45,
      fee_per_semester: 12500,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (bus: ExtendedBusItem) => {
    setEditingBusId(bus.id);
    setFormData({
      bus_no: bus.bus_no,
      route_name: bus.route_name,
      stops: bus.stops,
      driver_name: bus.driver_name,
      driver_phone: bus.driver_phone,
      current_stop: bus.current_stop,
      status: bus.status,
      capacity: bus.capacity || 52,
      occupied: bus.occupied || 42,
      fee_per_semester: bus.fee_per_semester || 12500,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const url = editingBusId ? `/api/buses/${editingBusId}` : '/api/buses';
      const method = editingBusId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccessMsg(
          editingBusId
            ? `Bus #${formData.bus_no} route updated successfully.`
            : `Bus #${formData.bus_no} route added to fleet schedule successfully.`
        );
        setShowModal(false);
        fetchBuses();
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || 'Failed to save bus route');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving bus route');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusUpdate = async (bus: ExtendedBusItem, newStatus: string) => {
    try {
      const res = await fetch(`/api/buses/${bus.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bus,
          status: newStatus,
        }),
      });

      if (res.ok) {
        fetchBuses();
      }
    } catch (err) {
      console.error('Error updating bus status:', err);
    }
  };

  // Live Transit Simulator: Advances bus to the next stop along the route
  const handleSimulateNextStop = async (bus: ExtendedBusItem) => {
    const rawStops = bus.stops.split(/->|,|;/).map((s) => s.trim()).filter(Boolean);
    if (rawStops.length === 0) return;

    const currentIndex = rawStops.findIndex(
      (s) => s.toLowerCase().includes(bus.current_stop.toLowerCase()) || bus.current_stop.toLowerCase().includes(s.toLowerCase())
    );

    const nextIndex = currentIndex >= 0 && currentIndex < rawStops.length - 1 ? currentIndex + 1 : 0;
    const nextStop = rawStops[nextIndex];
    const newStatus = nextIndex === rawStops.length - 1 ? 'At Stop' : 'On Time';

    try {
      const res = await fetch(`/api/buses/${bus.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bus,
          current_stop: nextStop,
          status: newStatus,
        }),
      });

      if (res.ok) {
        setSuccessMsg(`Simulated: Bus #${bus.bus_no} arrived at "${nextStop}".`);
        fetchBuses();
      }
    } catch (err) {
      console.error('Error simulating stop:', err);
    }
  };

  const handleDelete = async (id: string, busNo: string) => {
    if (!window.confirm(`Are you sure you want to remove Bus #${busNo} from fleet schedule?`)) return;
    try {
      const res = await fetch(`/api/buses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg(`Bus #${busNo} removed from fleet.`);
        fetchBuses();
      }
    } catch (err) {
      alert('Error deleting bus');
    }
  };

  // Filtered buses
  const filteredBuses = buses.filter((b) => {
    const matchesSearch =
      b.bus_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.route_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.stops.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Campus Transport & Bus Management
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Maintain college transit routes, station stops, live telematics simulation, and fee tracking.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-950 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-900 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Bus Route</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-800 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="font-bold text-emerald-700 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-800 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="font-bold text-rose-700 hover:text-rose-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-1 min-w-[240px] items-center gap-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by bus number, route, driver, or stop..."
            className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="On Time">On Time</option>
            <option value="At Stop">At Stop</option>
            <option value="Delayed">Delayed</option>
            <option value="Departed">Departed</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Buses Fleet Grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <RotateCw className="h-6 w-6 animate-spin text-indigo-700" />
            <span className="text-xs">Loading bus fleet schedule...</span>
          </div>
        </div>
      ) : filteredBuses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
          <Bus className="h-8 w-8 text-slate-400" />
          <h3 className="mt-3 text-sm font-bold text-slate-800">No Bus Routes Found</h3>
          <p className="mt-1 text-xs text-slate-500">
            {searchTerm || statusFilter !== 'All'
              ? 'Try adjusting your search criteria or filter.'
              : 'Register your first campus transport route using the button above.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredBuses.map((bus) => {
            const capacity = bus.capacity || 52;
            const occupied = bus.occupied || 42;
            const occupancyPct = Math.round((occupied / capacity) * 100);
            const fee = bus.fee_per_semester || 12500;
            const parsedStops = bus.stops.split(/->|,|;/).map((s) => s.trim()).filter(Boolean);

            return (
              <div
                key={bus.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all hover:border-indigo-300"
              >
                {/* Header with Bus Number & Actions */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-950 text-white font-bold">
                      <Bus className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          Bus #{bus.bus_no}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
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
                      <p className="text-xs font-medium text-slate-500">{bus.route_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(bus)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                      title="Edit Route"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(bus.id, bus.bus_no)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                      title="Remove Route"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Body Details */}
                <div className="mt-4 space-y-4 text-xs">
                  {/* Current Estimated Stop & Live Simulator */}
                  <div className="flex flex-col justify-between gap-2 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-2">
                      <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-indigo-700" />
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Current Live Stop
                        </span>
                        <div className="text-sm font-bold text-slate-900">{bus.current_stop}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Live Status Quick Toggle */}
                      <select
                        value={bus.status}
                        onChange={(e) => handleQuickStatusUpdate(bus, e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="On Time">On Time</option>
                        <option value="At Stop">At Stop</option>
                        <option value="Delayed">Delayed</option>
                        <option value="Departed">Departed</option>
                        <option value="Inactive">Inactive</option>
                      </select>

                      {/* Advance Simulator Button */}
                      <button
                        onClick={() => handleSimulateNextStop(bus)}
                        title="Simulate Next Stop"
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-950 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-indigo-900 transition-colors cursor-pointer"
                      >
                        <Play className="h-3 w-3 fill-white" />
                        <span>Next Stop</span>
                      </button>
                    </div>
                  </div>

                  {/* Route Summary & Stops List */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600">
                        Designated Stops ({parsedStops.length} waypoints):
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {parsedStops.map((stop, idx) => {
                        const isCurrent =
                          stop.toLowerCase().includes(bus.current_stop.toLowerCase()) ||
                          bus.current_stop.toLowerCase().includes(stop.toLowerCase());
                        return (
                          <span
                            key={idx}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                              isCurrent
                                ? 'bg-indigo-950 text-white font-bold ring-2 ring-indigo-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {stop}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Capacity & Fee Tracking Row */}
                  <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                    {/* Capacity */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-semibold">Seat Capacity:</span>
                        <span className="font-bold text-slate-900">
                          {occupied} / {capacity} seats
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            occupancyPct > 90
                              ? 'bg-rose-600'
                              : occupancyPct > 75
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(100, occupancyPct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Transport Fee Tracking */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
                      <span className="text-[11px] text-slate-500 font-semibold">
                        Semester Fee:
                      </span>
                      <div className="text-sm font-bold text-slate-900">
                        ₹{fee.toLocaleString('en-IN')}
                        <span className="ml-1 text-[10px] font-normal text-slate-500">/ semester</span>
                      </div>
                    </div>
                  </div>

                  {/* Driver Details & Direct Contact */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2 text-slate-700">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Driver</span>
                        <div className="font-bold text-slate-900 leading-tight">
                          {bus.driver_name}
                        </div>
                      </div>
                    </div>

                    <a
                      href={`tel:${bus.driver_phone}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 font-mono text-xs font-bold text-indigo-900 hover:bg-indigo-100 transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5 text-indigo-700" />
                      <span>{bus.driver_phone}</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Bus Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                {editingBusId ? `Edit Bus #${formData.bus_no} Route` : 'Add New Bus Route'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Bus Number</label>
                  <input
                    type="text"
                    required
                    value={formData.bus_no}
                    onChange={(e) => setFormData({ ...formData, bus_no: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 font-mono text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Route Title</label>
                  <input
                    type="text"
                    required
                    value={formData.route_name}
                    onChange={(e) => setFormData({ ...formData, route_name: e.target.value })}
                    placeholder="e.g. Aluva - Kalamassery - Campus"
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Waypoint Stops (delimited by -&gt; or comma)</label>
                <input
                  type="text"
                  required
                  value={formData.stops}
                  onChange={(e) => setFormData({ ...formData, stops: e.target.value })}
                  placeholder="e.g. Aluva Junction -> Toll Gate -> Edappally -> Palarivattom -> Campus"
                  className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Current Station / Stop</label>
                  <input
                    type="text"
                    required
                    value={formData.current_stop}
                    onChange={(e) => setFormData({ ...formData, current_stop: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Transit Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="On Time">On Time</option>
                    <option value="At Stop">At Stop</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Departed">Departed</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Driver Name</label>
                  <input
                    type="text"
                    required
                    value={formData.driver_name}
                    onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Driver Phone</label>
                  <input
                    type="tel"
                    required
                    value={formData.driver_phone}
                    onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Seat Capacity</label>
                  <input
                    type="number"
                    min="10"
                    max="80"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 52 })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Occupied Seats</label>
                  <input
                    type="number"
                    min="0"
                    max={formData.capacity}
                    value={formData.occupied}
                    onChange={(e) => setFormData({ ...formData, occupied: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Fee (₹/Sem)</label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={formData.fee_per_semester}
                    onChange={(e) => setFormData({ ...formData, fee_per_semester: parseInt(e.target.value) || 12500 })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-950 px-5 py-2 font-bold text-white hover:bg-indigo-900 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Saving Route...' : editingBusId ? 'Update Route' : 'Register Bus Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
