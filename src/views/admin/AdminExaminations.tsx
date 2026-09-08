import React, { useState, useEffect } from 'react';
import { ExaminationScheduleItem } from '../../types';
import {
  CalendarClock,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  X,
  CheckCircle2,
  AlertCircle,
  RotateCw,
} from 'lucide-react';

export const AdminExaminations: React.FC = () => {
  const [exams, setExams] = useState<ExaminationScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    course_code: '',
    course_title: '',
    exam_date: '2026-11-20',
    session_time: '09:30 AM - 12:30 PM',
    hall_no: 'LH-301, LH-302',
    semester: 'S5',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchExams = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/examinations');
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setExams(Array.isArray(data) ? data : []);
        }
      } else {
        setErrorMsg('Failed to fetch examination schedules.');
      }
    } catch (err) {
      console.error('Error fetching examination schedules:', err);
      setErrorMsg('Error connecting to examination schedules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/examinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccessMsg(`Exam schedule for ${formData.course_code.toUpperCase()} created successfully.`);
        setShowAdd(false);
        setFormData({
          course_code: '',
          course_title: '',
          exam_date: '2026-11-20',
          session_time: '09:30 AM - 12:30 PM',
          hall_no: 'LH-301, LH-302',
          semester: 'S5',
        });
        fetchExams();
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.error || 'Failed to save examination schedule');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating exam schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, courseCode: string) => {
    if (!window.confirm(`Delete examination schedule for ${courseCode}?`)) return;
    try {
      const res = await fetch(`/api/examinations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg(`Examination record for ${courseCode} deleted successfully.`);
        fetchExams();
      } else {
        setErrorMsg('Failed to delete schedule entry.');
      }
    } catch (err) {
      setErrorMsg('Error deleting schedule entry.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Examination Schedule & Seating Allotment
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Autonomous end-semester timetable, examination slots, and session management.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-950 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-900 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule Examination</span>
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Schedule Examination Slot</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Course Code</label>
                  <input
                    type="text"
                    required
                    value={formData.course_code}
                    onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                    placeholder="e.g. CST301"
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 font-mono uppercase text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Target Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                  >
                    {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Course Title</label>
                <input
                  type="text"
                  required
                  value={formData.course_title}
                  onChange={(e) => setFormData({ ...formData, course_title: e.target.value })}
                  placeholder="Formal course name..."
                  className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Date of Examination</label>
                  <input
                    type="date"
                    required
                    value={formData.exam_date}
                    onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Session Time</label>
                  <input
                    type="text"
                    required
                    value={formData.session_time}
                    onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
                    placeholder="09:30 AM - 12:30 PM"
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Designated Examination Halls</label>
                <input
                  type="text"
                  required
                  value={formData.hall_no}
                  onChange={(e) => setFormData({ ...formData, hall_no: e.target.value })}
                  placeholder="e.g. LH-301, LH-302, MECH-102"
                  className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-950 px-5 py-2 font-bold text-white hover:bg-indigo-900 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Publish Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Content */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <RotateCw className="h-6 w-6 animate-spin text-indigo-700" />
            <span className="text-xs">Loading examination schedules...</span>
          </div>
        </div>
      ) : exams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
          <CalendarClock className="h-8 w-8 text-slate-400" />
          <h3 className="mt-3 text-sm font-bold text-slate-800">No Examination Schedules</h3>
          <p className="mt-1 text-xs text-slate-500">
            Click "Schedule Examination" above to add an autonomous exam slot.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-5 py-3.5">Course Code</th>
                  <th className="px-5 py-3.5">Course Title</th>
                  <th className="px-4 py-3.5">Exam Date</th>
                  <th className="px-4 py-3.5">Session Time</th>
                  <th className="px-4 py-3.5">Assigned Hall</th>
                  <th className="px-3 py-3.5 text-center">Semester</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {exams.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-mono font-bold text-indigo-950">{ex.course_code}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{ex.course_title}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{ex.exam_date}</td>
                    <td className="px-4 py-3 text-slate-600">{ex.session_time}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{ex.hall_no}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-800">
                        {ex.semester}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDelete(ex.id, ex.course_code)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                        title="Delete Examination Slot"
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
      )}
    </div>
  );
};
