import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser, AttendanceResponse, AttendanceRecordDetail } from '../../types';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Calculator,
  Printer,
  Calendar,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

export const StudentAttendance: React.FC = () => {
  const { user } = useAuth();
  const student = user as StudentUser;

  const [attendanceData, setAttendanceData] = useState<AttendanceResponse | null>(null);
  const [records, setRecords] = useState<AttendanceRecordDetail[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  // Attendance Simulator State
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
  const simulatedPct = simTotal > 0 ? parseFloat(((simEffective / simTotal) * 100).toFixed(2)) : 100;

  const filteredRecords = records.filter((r) => {
    if (selectedMonth === 'All') return true;
    return (r.date || '').startsWith(selectedMonth);
  });

  const availableMonths = Array.from(
    new Set(records.map((r) => (r.date || '').substring(0, 7)))
  ).filter(Boolean);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Course-Wise Attendance</h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Continuous class attendance records and condonation eligibility monitoring.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Attendance Report</span>
        </button>
      </div>

      {/* Warning Notice if < 75% */}
      {isBelow75 && !loading && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900 shadow-xs sm:text-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div>
            <span className="font-bold">CRITICAL SHORTAGE: </span>
            Your aggregate attendance is <strong>{overallPct}%</strong>, which fails the KTU minimum
            prescribed requirement of 75%. You need to attend at least{' '}
            <strong>{requiredClasses} more consecutive class hours</strong> without taking leave to
            clear the condonation threshold.
          </div>
        </div>
      )}

      {/* Attendance Calculator & Overview Card */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Col: Overall Stats Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Overall Aggregate
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                overallPct >= 75
                  ? 'bg-emerald-100 text-emerald-800'
                  : overallPct >= 65
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {overall?.status || 'Safe'}
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-900">{overallPct}%</span>
            <span className="text-xs text-slate-500">/ 100%</span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallPct >= 75 ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
              style={{ width: `${Math.min(100, overallPct)}%` }}
            />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
            <div className="rounded-lg bg-emerald-50/70 p-2">
              <div className="text-[10px] font-semibold text-emerald-800">Present</div>
              <div className="mt-0.5 text-base font-bold text-emerald-950">
                {overall?.present_classes ?? 0}
              </div>
            </div>
            <div className="rounded-lg bg-rose-50/70 p-2">
              <div className="text-[10px] font-semibold text-rose-800">Absent</div>
              <div className="mt-0.5 text-base font-bold text-rose-950">
                {overall?.absent_classes ?? 0}
              </div>
            </div>
            <div className="rounded-lg bg-indigo-50/70 p-2">
              <div className="text-[10px] font-semibold text-indigo-800">Duty Leave</div>
              <div className="mt-0.5 text-base font-bold text-indigo-950">
                {overall?.duty_leave_classes ?? 0}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Total Classes Conducted:</span>
              <strong className="text-slate-900">{overall?.total_classes ?? 0} hrs</strong>
            </div>
            <div className="mt-1 flex justify-between">
              <span>Effective Attendance:</span>
              <strong className="text-slate-900">
                {(overall?.present_classes ?? 0) + (overall?.duty_leave_classes ?? 0)} hrs
              </strong>
            </div>
          </div>
        </div>

        {/* Middle & Right Cols: Interactive Attendance Calculator */}
        <div className="rounded-2xl border border-indigo-100 bg-linear-to-br from-indigo-50/50 via-white to-white p-5 shadow-xs sm:p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-indigo-700" />
            <h2 className="text-sm font-bold text-slate-900 sm:text-base">
              Smart Attendance Target & Scenario Calculator
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Plan your attendance to maintain KTU examination eligibility without risking shortage.
          </p>

          {/* Metrics summary banner */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500">75% Recovery Goal</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-indigo-950">{requiredClasses}</span>
                <span className="text-xs text-slate-600">classes required</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {requiredClasses > 0
                  ? 'Must attend consecutive upcoming classes to cross 75%'
                  : 'You are safely above the minimum 75% threshold!'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500">Safe Margin</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-emerald-800">{safeBunks}</span>
                <span className="text-xs text-slate-600">classes safely skippable</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Maximum hours you can miss while keeping aggregate ≥ 75.0%
              </p>
            </div>
          </div>

          {/* Interactive What-If Simulator */}
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Simulate Upcoming Classes
            </div>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-slate-600">
                  Upcoming Classes to <strong>Attend</strong>:
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={simExtraAttend}
                    onChange={(e) => setSimExtraAttend(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-900"
                  />
                  <span className="w-8 font-mono text-xs font-bold text-indigo-950">
                    +{simExtraAttend}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600">
                  Upcoming Classes to <strong>Miss</strong>:
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={simExtraMiss}
                    onChange={(e) => setSimExtraMiss(parseInt(e.target.value, 10))}
                    className="w-full accent-rose-600"
                  />
                  <span className="w-8 font-mono text-xs font-bold text-rose-700">
                    +{simExtraMiss}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs">
              <span className="text-slate-600">Projected Attendance:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{simulatedPct}%</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    simulatedPct >= 75
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {simulatedPct >= 75 ? 'Safe' : 'Shortage'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subject-Wise Attendance Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-900 sm:text-base">Subject-Wise Breakdown</h2>
          <p className="text-xs text-slate-500">
            Formula: <code>(Present + Duty Leave) / Total Classes × 100</code>
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3">Course Code</th>
                <th className="px-5 py-3">Subject Name</th>
                <th className="px-5 py-3">Faculty</th>
                <th className="px-4 py-3 text-center">Present</th>
                <th className="px-4 py-3 text-center">Absent</th>
                <th className="px-4 py-3 text-center">Duty Leave</th>
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-5 py-3 text-right">Percentage</th>
                <th className="px-5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {attendanceData?.subject_wise.map((row) => (
                <tr key={row.subject_id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-mono font-bold text-indigo-950">{row.code}</td>
                  <td className="px-5 py-3 font-medium text-slate-900">{row.name}</td>
                  <td className="px-5 py-3 text-slate-600">{row.teacher}</td>
                  <td className="px-4 py-3 text-center font-semibold text-emerald-700">
                    {row.present_classes}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-rose-700">
                    {row.absent_classes}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-indigo-700">
                    {row.duty_leave_classes}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-900">
                    {row.total_classes}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="font-bold text-slate-900">{row.percentage}%</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        row.status === 'Safe'
                          ? 'bg-emerald-100 text-emerald-800'
                          : row.status === 'Warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Period-Wise Activity Log */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-sm font-bold text-slate-900 sm:text-base">Detailed Period Log</h2>
            <p className="text-xs text-slate-500">
              Verified daily period-wise classroom attendance history.
            </p>
          </div>

          {/* Month Filter */}
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-4 py-3 text-center">Period</th>
                <th className="px-5 py-3">Course Code</th>
                <th className="px-5 py-3">Subject Name</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-2.5 font-mono text-slate-900">{rec.date}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-slate-700">
                      Hour {rec.period}
                    </td>
                    <td className="px-5 py-2.5 font-mono font-semibold text-indigo-950">
                      {rec.subject_code || 'CST301'}
                    </td>
                    <td className="px-5 py-2.5 text-slate-800">{rec.subject_name || 'Subject'}</td>
                    <td className="px-4 py-2.5 text-center">
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
                  <td colSpan={5} className="px-5 py-6 text-center text-xs text-slate-400">
                    No detailed attendance records found for this selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
