import React, { useState, useEffect } from 'react';
import { ActivityItem, StudentUser } from '../../types';
import { Award, CheckCircle2, XCircle, FileText, Clock, AlertCircle, Check, Search, ExternalLink } from 'lucide-react';

export const AdminActivityApprovals: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [students, setStudents] = useState<Record<string, StudentUser>>({});
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Approval / Rejection modal
  const [activeAction, setActiveAction] = useState<{
    item: ActivityItem;
    type: 'approve' | 'reject';
  } | null>(null);
  const [pointsGranted, setPointsGranted] = useState<string>('10');
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      const [actRes, stRes] = await Promise.all([
        fetch('/api/activities'),
        fetch('/api/students'),
      ]);

      if (actRes.ok) {
        setActivities(await actRes.json());
      }
      if (stRes.ok) {
        const stList: StudentUser[] = await stRes.json();
        const map: Record<string, StudentUser> = {};
        stList.forEach((s) => {
          map[s.uid.toUpperCase()] = s;
        });
        setStudents(map);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAction = (item: ActivityItem, type: 'approve' | 'reject') => {
    setActiveAction({ item, type });
    setPointsGranted(item.requested_points || '10');
    setRemarks(
      type === 'approve'
        ? 'Verified and approved by department faculty coordinator.'
        : 'Insufficient or unverified supporting documentation.'
    );
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAction) return;

    if (activeAction.type === 'reject' && !remarks.trim()) {
      alert('A reason is required to reject an activity claim.');
      return;
    }

    setSubmitting(true);
    const { item, type } = activeAction;

    try {
      const res = await fetch(`/api/activities/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: type === 'approve' ? 'Approved' : 'Rejected',
          points: type === 'approve' ? pointsGranted : '0',
          remarks: remarks.trim(),
        }),
      });

      if (res.ok) {
        setFeedbackMsg({
          type: 'success',
          text: `Activity claim "${item.title}" successfully ${type === 'approve' ? 'approved' : 'rejected'}.`,
        });
        setActiveAction(null);
        fetchData();
      } else {
        setFeedbackMsg({ type: 'error', text: 'Failed to update activity claim.' });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Error updating activity claim.' });
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = activities.filter((a) => a.status === 'Pending').length;
  const approvedCount = activities.filter((a) => a.status === 'Approved').length;
  const rejectedCount = activities.filter((a) => a.status === 'Rejected').length;

  const filtered = activities.filter((a) => {
    const student = students[(a.student_uid || '').toUpperCase()];
    const studentName = student?.name || '';
    const matchSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.student_uid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;

    if (activeTab === 'pending') return a.status === 'Pending';
    if (activeTab === 'approved') return a.status === 'Approved';
    if (activeTab === 'rejected') return a.status === 'Rejected';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Activity Points Approvals
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Review KTU activity points submissions, inspect certificate proofs, and record decisions.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student, UID, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:outline-none"
          />
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`flex items-center justify-between gap-2 rounded-xl p-3.5 text-xs ${
            feedbackMsg.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'border-indigo-950 text-indigo-950'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Pending Queue</span>
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'approved'
              ? 'border-indigo-950 text-indigo-950'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Approved History</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {approvedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'rejected'
              ? 'border-indigo-950 text-indigo-950'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <XCircle className="h-4 w-4" />
          <span>Rejected</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {rejectedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'border-indigo-950 text-indigo-950'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>All Submissions ({activities.length})</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3.5">Student</th>
                <th className="px-5 py-3.5">Activity & Proof</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-3 py-3.5 text-center">Requested</th>
                <th className="px-3 py-3.5 text-center">Awarded</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-slate-400">
                    No activity submissions found in this view.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const student = students[(item.student_uid || '').toUpperCase()];
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{student?.name || item.student_uid}</div>
                        <div className="font-mono text-[11px] text-slate-400">
                          {item.student_uid} • {student?.class || 'Student'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <div className="font-bold text-slate-900">{item.title}</div>
                        {item.description && (
                          <div className="text-[11px] text-slate-500 line-clamp-1">{item.description}</div>
                        )}
                        {item.certificate_url ? (
                          <a
                            href={item.certificate_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 font-semibold text-indigo-700 hover:text-indigo-900 hover:underline"
                          >
                            <FileText className="h-3 w-3" />
                            <span>View Certificate</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No document attached</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 max-w-[200px] truncate text-[11px]">
                        {item.category}
                      </td>
                      <td className="px-3 py-3.5 text-center font-semibold text-slate-700">
                        {item.requested_points} pts
                      </td>
                      <td className="px-3 py-3.5 text-center font-bold text-slate-900">
                        {item.status === 'Approved' ? `${item.points} pts` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-center">
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
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {item.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openAction(item, 'approve')}
                              className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openAction(item, 'reject')}
                              className="rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openAction(item, item.status === 'Approved' ? 'approve' : 'reject')}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            Edit Decision
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Action Modal */}
      {activeAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900">
              {activeAction.type === 'approve' ? 'Approve Activity Points' : 'Reject Activity Claim'}
            </h2>
            <div className="mt-1 text-xs text-slate-500">
              <strong className="text-slate-800">
                {students[(activeAction.item.student_uid || '').toUpperCase()]?.name || activeAction.item.student_uid}
              </strong>{' '}
              ({activeAction.item.student_uid}) • {activeAction.item.title}
            </div>

            <form onSubmit={handleActionSubmit} className="mt-4 space-y-4 text-xs">
              {activeAction.type === 'approve' && (
                <div>
                  <label className="block font-bold text-slate-700">Points to Award</label>
                  <p className="text-[11px] text-slate-400 mb-1">
                    Student requested {activeAction.item.requested_points} points. You can modify this.
                  </p>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={pointsGranted}
                    onChange={(e) => setPointsGranted(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 p-2 font-mono font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700">
                  {activeAction.type === 'reject' ? 'Rejection Reason (Required)' : 'Official Faculty Remarks'}
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={activeAction.type === 'reject' ? 'Explain why this submission was rejected...' : 'Remarks...'}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveAction(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`rounded-xl px-4 py-2 font-bold text-white shadow-xs cursor-pointer ${
                    activeAction.type === 'approve'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  {submitting ? 'Saving...' : activeAction.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
