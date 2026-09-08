import React, { useState, useEffect } from 'react';
import { ActivityItem } from '../../types';
import { Award, CheckCircle2, XCircle, FileText, Clock, AlertCircle } from 'lucide-react';

export const AdminActivityApprovals: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  // Approval modal
  const [activeAction, setActiveAction] = useState<{
    item: ActivityItem;
    type: 'approve' | 'reject';
  } | null>(null);
  const [pointsGranted, setPointsGranted] = useState<string>('10');
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activities');
      if (res.ok) {
        setActivities(await res.json());
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const openAction = (item: ActivityItem, type: 'approve' | 'reject') => {
    setActiveAction({ item, type });
    setPointsGranted(item.requested_points || '10');
    setRemarks(type === 'approve' ? 'Approved by department coordinator.' : 'Insufficient supporting documentation.');
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAction) return;

    setSubmitting(true);
    const { item, type } = activeAction;

    try {
      const res = await fetch(`/api/activities/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: type === 'approve' ? 'Approved' : 'Rejected',
          points: type === 'approve' ? pointsGranted : '0',
          remarks,
        }),
      });

      if (res.ok) {
        setActiveAction(null);
        fetchActivities();
      } else {
        alert('Failed to update activity claim');
      }
    } catch (err) {
      alert('Error updating activity');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = activities.filter((a) => {
    if (filterStatus === 'All') return true;
    return a.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            KTU Activity Points Verification
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Review certificate proofs, award official points, and validate student activity claims.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1">
          {['All', 'Pending', 'Approved', 'Rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filterStatus === st
                  ? 'bg-indigo-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3">Student UID</th>
                <th className="px-5 py-3">Activity & Details</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-3 py-3 text-center">Requested</th>
                <th className="px-3 py-3 text-center">Approved</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3 font-mono font-bold text-indigo-950">{item.student_uid}</td>
                  <td className="px-5 py-3">
                    <div className="font-bold text-slate-900">{item.title}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{item.description}</div>
                    {item.certificate_url && (
                      <a
                        href={item.certificate_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 font-semibold text-indigo-700 hover:underline"
                      >
                        <FileText className="h-3 w-3" />
                        <span>Inspect Certificate</span>
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.category}</td>
                  <td className="px-3 py-3 text-center text-slate-700 font-medium">
                    {item.requested_points} pts
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-slate-900">
                    {item.points} pts
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        item.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openAction(item, 'approve')}
                        className="rounded bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => openAction(item, 'reject')}
                        className="rounded bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {activeAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-base font-bold text-slate-900">
              {activeAction.type === 'approve' ? 'Approve Activity Claim' : 'Reject Activity Claim'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Student: <strong>{activeAction.item.student_uid}</strong> • {activeAction.item.title}
            </p>

            <form onSubmit={handleActionSubmit} className="mt-4 space-y-4 text-xs">
              {activeAction.type === 'approve' && (
                <div>
                  <label className="font-bold text-slate-700">Points to Award</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={pointsGranted}
                    onChange={(e) => setPointsGranted(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 font-mono font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700">Official Faculty Remarks</label>
                <textarea
                  rows={3}
                  required
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveAction(null)}
                  className="rounded-lg border border-slate-300 px-3.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`rounded-lg px-4 py-1.5 font-bold text-white ${
                    activeAction.type === 'approve'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  {submitting ? 'Saving...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
