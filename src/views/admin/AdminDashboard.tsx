import React, { useState, useEffect } from 'react';
import { AdminDashboardData } from '../../types';
import {
  Users,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Award,
  CalendarClock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (viewId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics/admin-dashboard');
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error('Error fetching admin dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-indigo-950 p-6 text-white shadow-xs sm:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-800/60 px-3 py-1 text-xs font-semibold text-indigo-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Administrative & Academic Controller Workspace</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Academic Operations Overview
            </h1>
            <p className="mt-1 text-xs text-indigo-200 sm:text-sm">
              Real-time monitoring across attendance, continuous evaluation, Rexa results, and KTU activity validations.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('admin-rexa')}
              className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-indigo-950 shadow-xs hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              Import Rexa Results
            </button>
            <button
              onClick={() => onNavigate('admin-attendance-marks')}
              className="rounded-xl border border-indigo-700 bg-indigo-900/60 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-800 transition-colors cursor-pointer"
            >
              Bulk Attendance & Marks
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Total Students */}
        <div
          onClick={() => onNavigate('admin-students')}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-indigo-300"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Enrolled</span>
            <Users className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {data?.total_students ?? 0}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Total Active Students</div>
        </div>

        {/* Avg Attendance */}
        <div
          onClick={() => onNavigate('admin-attendance-marks')}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-indigo-300"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Attendance</span>
            <Clock className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700">
            {data?.average_attendance ?? 0}%
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Campus Average</div>
        </div>

        {/* Low Attendance Alert */}
        <div
          onClick={() => onNavigate('admin-attendance-marks')}
          className="cursor-pointer rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs hover:bg-rose-100/50"
        >
          <div className="flex items-center justify-between text-rose-800">
            <span className="text-[11px] font-bold uppercase">Below 75%</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-rose-900">
            {data?.below_75_count ?? 0}
          </div>
          <div className="mt-1 text-[10px] text-rose-700 font-medium">Students in Risk</div>
        </div>

        {/* Average CIA Marks */}
        <div
          onClick={() => onNavigate('admin-attendance-marks')}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-indigo-300"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">CIA Marks</span>
            <FileSpreadsheet className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {data?.average_marks_percentage ?? 0}%
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Continuous Evaluation</div>
        </div>

        {/* Pending Activity Points */}
        <div
          onClick={() => onNavigate('admin-activities')}
          className="cursor-pointer rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-xs hover:bg-amber-100/40"
        >
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-bold uppercase">Activities</span>
            <Award className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-900">
            {data?.pending_activities_count ?? 0}
          </div>
          <div className="mt-1 text-[10px] text-amber-700 font-medium">Awaiting Review</div>
        </div>

        {/* Upcoming Examinations */}
        <div
          onClick={() => onNavigate('admin-examinations')}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-indigo-300"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase">Exams</span>
            <CalendarClock className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {data?.upcoming_examinations_count ?? 0}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Scheduled Sessions</div>
        </div>
      </div>

      {/* 2-Column Section: Attendance Risk Table & Department Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Below 75% Attendance Action Table */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                  Attendance Shortage Watchlist (&lt; 75%)
                </h2>
              </div>
              <button
                onClick={() => onNavigate('admin-attendance-marks')}
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
              >
                Manage All Records
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-5 py-3">Register No (UID)</th>
                    <th className="px-5 py-3">Student Name</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3 text-right">Attendance %</th>
                    <th className="px-5 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {data?.below_75_students && data.below_75_students.length > 0 ? (
                    data.below_75_students.map((s) => (
                      <tr key={s.uid} className="hover:bg-rose-50/40">
                        <td className="px-5 py-3 font-mono font-bold text-slate-900">{s.uid}</td>
                        <td className="px-5 py-3 font-medium text-slate-900">{s.name}</td>
                        <td className="px-4 py-3 text-slate-600">{s.class}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="rounded bg-rose-100 px-2 py-0.5 font-bold text-rose-800">
                            {s.percentage}%
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={() => onNavigate('admin-attendance-marks')}
                            className="rounded bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
                          >
                            Update Log
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-xs text-slate-400">
                        No students currently under attendance shortage.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div
              onClick={() => onNavigate('admin-rexa')}
              className="cursor-pointer rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 transition-all hover:border-indigo-300 hover:bg-indigo-50"
            >
              <div className="font-bold text-indigo-950 text-sm">Rexa Results Import</div>
              <p className="mt-1 text-xs text-slate-600">
                Upload CSV from Rexa ERP and update end-semester results.
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-bold text-indigo-700">
                <span>Launch Rexa Sync</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>

            <div
              onClick={() => onNavigate('admin-students')}
              className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-slate-300 hover:bg-slate-100"
            >
              <div className="font-bold text-slate-900 text-sm">Enroll New Student</div>
              <p className="mt-1 text-xs text-slate-600">
                Add student profiles, allocate classes, and assign academic credentials.
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-bold text-slate-800">
                <span>Student Directory</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>

            <div
              onClick={() => onNavigate('admin-export')}
              className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-slate-300 hover:bg-slate-100"
            >
              <div className="font-bold text-slate-900 text-sm">Official Academic Archives</div>
              <p className="mt-1 text-xs text-slate-600">
                Official institutional datasets for NAAC, NBA, and KTU audits.
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-bold text-slate-800">
                <span>Data Export Center</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Department Distribution & Upcoming Exams */}
        <div className="space-y-6">
          {/* Department Breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Student Enrollment by Branch</h3>
            <div className="mt-4 space-y-3">
              {data?.department_breakdown.map((dept) => (
                <div key={dept.name}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{dept.name}</span>
                    <span className="font-bold text-slate-900">{dept.count} Students</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-900"
                      style={{
                        width: `${Math.max(15, (dept.count / (data?.total_students || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Exams Scheduled */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Upcoming Exams</h3>
              <button
                onClick={() => onNavigate('admin-examinations')}
                className="text-xs font-semibold text-indigo-700 hover:underline"
              >
                Schedule
              </button>
            </div>

            <div className="mt-3 divide-y divide-slate-100">
              {data?.upcoming_examinations.slice(0, 3).map((ex) => (
                <div key={ex.id} className="py-2.5 text-xs">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{ex.course_code}</span>
                    <span className="text-indigo-700 font-mono">{ex.exam_date}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{ex.course_title}</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    {ex.session_time} • {ex.hall_no}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
