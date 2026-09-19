import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser, AttendanceResponse, AttendanceRecordDetail } from '../../types';
import {
  Clock,
  AlertTriangle,
  Printer,
  Calendar,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  RotateCcw,
} from 'lucide-react';

export const StudentAttendance: React.FC = () => {
  const { user } = useAuth();
  const student = user as StudentUser;

  const [attendanceData, setAttendanceData] = useState<AttendanceResponse | null>(null);
  const [records, setRecords] = useState<AttendanceRecordDetail[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Attendance Planner State
  const [simExtraAttend, setSimExtraAttend] = useState<number>(0);
  const [simExtraMiss, setSimExtraMiss] = useState<number>(0);

  const fetchAttendance = async () => {
    if (!student?.uid) return;
    try {
      const [attRes, recRes] = await Promise.all([
        fetch(`/api/attendance/student/${student.uid}`),
        fetch(`/api/attendance/records/${student.uid}`),
      ]);
      if (attRes.ok) setAttendanceData(await attRes.json());
      if (recRes.ok) setRecords(await recRes.json());
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [student?.uid]);

  const overall = attendanceData?.overall;
  const overallPct = overall?.percentage ?? 0;
  const isBelow75 = overallPct < 75;
  const requiredClasses = overall?.required_classes_for_75 ?? 0;
  const safeBunks = overall?.safe_bunks ?? 0;

  // Simulator calculation
  const currentEffective = (overall?.present_classes ?? 0) + (overall?.duty_leave_classes ?? 0);
  const currentTotal = overall?.total_classes ?? 0;
  const simTotal = currentTotal + simExtraAttend + simExtraMiss;
  const simEffective = currentEffective + simExtraAttend;
  const simulatedPct = simTotal > 0 ? parseFloat(((simEffective / simTotal) * 100).toFixed(1)) : 100;

  const getStatusBadge = (pct: number) => {
    if (pct >= 75) {
      return { label: 'SAFE', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (pct >= 65) {
      return { label: 'WARNING', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { label: 'SHORTAGE', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  const statusBadge = getStatusBadge(overallPct);
  const simBadge = getStatusBadge(simulatedPct);

  const filteredRecords = records.filter((r) => {
    if (selectedMonth === 'All') return true;
    return (r.date || '').startsWith(selectedMonth);
  });

  const availableMonths = Array.from(
    new Set(records.map((r) => (r.date || '').substring(0, 7)))
  ).filter(Boolean);

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Attendance</h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Semester {student?.semester} • {student?.department}
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer print:hidden"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Attendance Report</span>
        </button>
      </div>

      {/* Attendance Shortage Warning (Only if < 75%) */}
      {isBelow75 && !loading && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 shadow-xs sm:text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <div>
            <span className="font-bold">Attendance Shortage Warning: </span>
            Your attendance is <strong>{overallPct}%</strong>, which is below the required 75%. Attend{' '}
            <strong>{requiredClasses} more {requiredClasses === 1 ? 'class' : 'classes'} without absence</strong> to reach 75%.
          </div>
        </div>
      )}

      {/* Top Level Summary Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance</span>
              <span className={`rounded-md border px-2 py-0.5 text-[11px] font-extrabold ${statusBadge.bg}`}>
                {statusBadge.label}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">{overallPct}%</span>
              <span className="text-xs text-slate-400 font-medium">overall aggregate</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="inline-flex items-center rounded-lg bg-emerald-50 px-3 py-1.5 text-emerald-800 border border-emerald-100">
              Present: {overall?.present_classes ?? 0}
            </span>
            <span className="inline-flex items-center rounded-lg bg-rose-50 px-3 py-1.5 text-rose-800 border border-rose-100">
              Absent: {overall?.absent_classes ?? 0}
            </span>
            <span className="inline-flex items-center rounded-lg bg-indigo-50 px-3 py-1.5 text-indigo-800 border border-indigo-100">
              Duty Leave: {overall?.duty_leave_classes ?? 0}
            </span>
            <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-slate-700 border border-slate-200">
              Total: {overall?.total_classes ?? 0}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallPct >= 75 ? 'bg-emerald-500' : overallPct >= 65 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, overallPct)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-500">
            <span>Minimum KTU Requirement: 75%</span>
            <span>Effective Attended: {(overall?.present_classes ?? 0) + (overall?.duty_leave_classes ?? 0)} classes</span>
          </div>
        </div>
      </div>

      {/* Attendance Planner */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100/60 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Attendance Planner</h2>
            <p className="text-xs text-slate-500">
              Plan your attendance safely. Simulate what happens if classes are attended or missed.
            </p>
          </div>
          {(simExtraAttend > 0 || simExtraMiss > 0) && (
            <button
              onClick={() => {
                setSimExtraAttend(0);
                setSimExtraMiss(0);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Status Indicators */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500">Current Status</div>
            <div className="mt-1 text-sm font-bold text-slate-900">
              Current attendance: {overallPct}%
            </div>
            <p className="mt-1 text-xs text-slate-600">
              {requiredClasses > 0
                ? `Attend ${requiredClasses} more ${requiredClasses === 1 ? 'class' : 'classes'} without absence to reach 75%.`
                : 'You are currently above the 75% requirement.'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500">Safe Margin</div>
            <div className="mt-1 text-sm font-bold text-slate-900">
              Safe additional absences: {safeBunks} {safeBunks === 1 ? 'class' : 'classes'}
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Classes you can miss without falling below the 75% threshold.
            </p>
          </div>
        </div>

        {/* Interactive Steppers */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Attend Stepper */}
            <div>
              <span className="block text-xs font-semibold text-slate-700">Attend Upcoming Classes</span>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => setSimExtraAttend((p) => Math.max(0, p - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  title="Decrease attended classes"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={simExtraAttend}
                  onChange={(e) => setSimExtraAttend(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="h-8 w-16 text-center rounded-lg border border-slate-200 font-bold text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
                <button
                  onClick={() => setSimExtraAttend((p) => p + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  title="Increase attended classes"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setSimExtraAttend((p) => p + 5)}
                  className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                >
                  +5
                </button>
              </div>
            </div>

            {/* Miss Stepper */}
            <div>
              <span className="block text-xs font-semibold text-slate-700">Miss Upcoming Classes</span>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => setSimExtraMiss((p) => Math.max(0, p - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  title="Decrease missed classes"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={simExtraMiss}
                  onChange={(e) => setSimExtraMiss(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="h-8 w-16 text-center rounded-lg border border-slate-200 font-bold text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
                <button
                  onClick={() => setSimExtraMiss((p) => p + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  title="Increase missed classes"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setSimExtraMiss((p) => p + 5)}
                  className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
                >
                  +5
                </button>
              </div>
            </div>
          </div>

          {/* Projected Result */}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
            <span className="text-xs font-medium text-slate-600">Projected Attendance:</span>
            <div className="flex items-center gap-2.5">
              <span className="text-lg font-extrabold text-slate-900">{simulatedPct}%</span>
              <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${simBadge.bg}`}>
                {simBadge.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subject-Wise Attendance Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-900 sm:text-base">Subject-Wise Attendance</h2>
          <p className="text-xs text-slate-500">
            Detailed breakdown by course with present, absent, and duty leave hours.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3">Subject</th>
                <th className="px-4 py-3 text-right">Attendance</th>
                <th className="px-4 py-3 text-center">Present</th>
                <th className="px-4 py-3 text-center">Absent</th>
                <th className="px-4 py-3 text-center">DL</th>
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {attendanceData?.subject_wise.map((row) => {
                const subBadge = getStatusBadge(row.percentage);
                return (
                  <tr key={row.subject_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{row.name}</div>
                      <div className="mt-0.5 text-[11px] text-slate-400 font-mono">
                        {row.code} • {row.teacher}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-extrabold text-slate-900">
                      {row.percentage}%
                    </td>
                    <td className="px-4 py-3.5 text-center font-semibold text-emerald-700">
                      {row.present_classes}
                    </td>
                    <td className="px-4 py-3.5 text-center font-semibold text-rose-700">
                      {row.absent_classes}
                    </td>
                    <td className="px-4 py-3.5 text-center font-semibold text-indigo-700">
                      {row.duty_leave_classes}
                    </td>
                    <td className="px-4 py-3.5 text-center font-medium text-slate-600">
                      {row.total_classes}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${subBadge.bg}`}>
                        {subBadge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Attendance History (Collapsible) */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <button
          onClick={() => setHistoryOpen((prev) => !prev)}
          className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {historyOpen ? (
              <ChevronDown className="h-4 w-4 text-slate-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-600" />
            )}
            <div>
              <h2 className="text-sm font-bold text-slate-900">Detailed Attendance History</h2>
              <p className="text-xs text-slate-400">
                {filteredRecords.length} records • {selectedMonth === 'All' ? 'All Months' : selectedMonth}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-indigo-700">
            {historyOpen ? 'Hide' : 'Expand'}
          </span>
        </button>

        {historyOpen && (
          <div className="border-t border-slate-100">
            {/* Filter controls */}
            <div className="flex items-center justify-between px-6 py-3 bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Filter Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                >
                  <option value="All">All Months</option>
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-xs text-slate-500">
                Showing {filteredRecords.length} entries
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-5 py-3">Subject</th>
                    <th className="px-4 py-3 text-center">Period</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/60">
                        <td className="px-6 py-2.5 font-mono text-slate-900">{rec.date}</td>
                        <td className="px-5 py-2.5">
                          <span className="font-semibold text-slate-900">{rec.subject_name || rec.subject_code}</span>
                          <span className="ml-2 font-mono text-[11px] text-slate-400">{rec.subject_code}</span>
                        </td>
                        <td className="px-4 py-2.5 text-center font-medium text-slate-700">
                          Hour {rec.period}
                        </td>
                        <td className="px-5 py-2.5 text-center">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                              rec.status === 'Present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rec.status === 'Duty Leave'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-xs text-slate-400">
                        No attendance records found for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
