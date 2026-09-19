import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser, AttendanceResponse, MarksResponse, ActivityStudentResponse, AnnouncementItem, EventItemType, ExaminationScheduleItem } from '../../types';
import {
  Clock,
  FileSpreadsheet,
  Award,
  GraduationCap,
  AlertTriangle,
  Calendar,
  Bell,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (viewId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const student = user as StudentUser;

  const [attendanceData, setAttendanceData] = useState<AttendanceResponse | null>(null);
  const [marksData, setMarksData] = useState<MarksResponse | null>(null);
  const [activityData, setActivityData] = useState<ActivityStudentResponse | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [events, setEvents] = useState<EventItemType[]>([]);
  const [exams, setExams] = useState<ExaminationScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student?.uid) return;

    const fetchData = async () => {
      try {
        const [attRes, marksRes, actRes, annRes, evtRes, examRes] = await Promise.all([
          fetch(`/api/attendance/student/${student.uid}`),
          fetch(`/api/marks/student/${student.uid}`),
          fetch(`/api/activities/student/${student.uid}`),
          fetch('/api/announcements'),
          fetch('/api/events'),
          fetch(`/api/examinations?semester=${student.semester}`),
        ]);

        const safeJson = async (res: Response) => {
          if (!res.ok) return null;
          const ct = res.headers.get('content-type');
          if (ct && ct.includes('application/json')) {
            try {
              return await res.json();
            } catch {
              return null;
            }
          }
          return null;
        };

        const [att, marks, act, ann, evt, exam] = await Promise.all([
          safeJson(attRes),
          safeJson(marksRes),
          safeJson(actRes),
          safeJson(annRes),
          safeJson(evtRes),
          safeJson(examRes),
        ]);

        if (att) setAttendanceData(att);
        if (marks) setMarksData(marks);
        if (act) setActivityData(act);
        if (ann && Array.isArray(ann)) setAnnouncements(ann.slice(0, 3));
        if (evt && Array.isArray(evt)) setEvents(evt.slice(0, 3));
        if (exam && Array.isArray(exam)) setExams(exam.slice(0, 3));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [student?.uid, student?.semester]);

  const overallAttendance = attendanceData?.overall.percentage ?? 0;
  const isAttendanceLow = overallAttendance < 75;
  const classesNeeded = attendanceData?.overall.required_classes_for_75 ?? 0;
  const approvedPoints = activityData?.summary.total_approved_points ?? 0;

  const getAttendanceBadge = (pct: number) => {
    if (pct >= 75) {
      return { label: 'SAFE', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (pct >= 65) {
      return { label: 'WARNING', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { label: 'SHORTAGE', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  const attBadge = getAttendanceBadge(overallAttendance);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-indigo-950 p-6 text-white shadow-xs sm:flex-row sm:items-center sm:p-7">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-900/80 px-3 py-1 text-xs font-semibold text-indigo-200">
            <span>{student?.class || 'Engineering'}</span>
            <span>•</span>
            <span>UID: {student?.uid}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {student?.name}
          </h1>
          <p className="mt-1 text-xs text-indigo-200 sm:text-sm">
            {student?.department}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate('student-results')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-indigo-950 shadow-xs transition-colors hover:bg-indigo-50 cursor-pointer"
          >
            <GraduationCap className="h-4 w-4 text-indigo-950" />
            <span>End-Semester Results</span>
          </button>
          <button
            onClick={() => onNavigate('student-hallticket')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-700 bg-indigo-900/60 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-800 cursor-pointer"
          >
            <BookOpen className="h-4 w-4" />
            <span>Hall Ticket</span>
          </button>
        </div>
      </div>

      {/* Attendance Warning Alert (Only if < 75%) */}
      {isAttendanceLow && !loading && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <div>
              <h2 className="text-xs font-bold text-rose-900 sm:text-sm">Attendance Shortage Warning</h2>
              <p className="mt-0.5 text-xs text-rose-800">
                Your attendance is <strong>{overallAttendance}%</strong>, which is below the required 75%.
                {classesNeeded > 0 && (
                  <span> Attend <strong>{classesNeeded} more {classesNeeded === 1 ? 'class' : 'classes'}</strong> without absence to reach 75%.</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('student-attendance')}
            className="shrink-0 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition-colors cursor-pointer"
          >
            View Attendance
          </button>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* 1. Attendance */}
        <div
          onClick={() => onNavigate('student-attendance')}
          className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance</span>
            <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${attBadge.bg}`}>
              {attBadge.label}
            </span>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {overallAttendance}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {attendanceData?.overall.present_classes ?? 0} / {attendanceData?.overall.total_classes ?? 0} classes attended
          </div>
        </div>

        {/* 2. CGPA */}
        <div
          onClick={() => onNavigate('student-marks')}
          className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cumulative CGPA</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {student?.cgpa || '—'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Scale 10.0
          </div>
        </div>

        {/* 3. Credits */}
        <div
          onClick={() => onNavigate('student-results')}
          className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Credits</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <GraduationCap className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {student?.completed_credits || '—'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Total earned credits
          </div>
        </div>

        {/* 4. Activity Points */}
        <div
          onClick={() => onNavigate('student-activities')}
          className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Activity Points</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Award className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {approvedPoints} <span className="text-sm font-normal text-slate-400">/ 100</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {100 - approvedPoints > 0 ? `${100 - approvedPoints} points required` : 'Requirement completed'}
          </div>
        </div>
      </div>

      {/* 2-Column Section: Attendance Health & Recent Notices */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Subject-Wise Attendance & Marks */}
        <div className="space-y-6 lg:col-span-2">
          {/* Subject Attendance Health */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-700" />
                <h2 className="text-sm font-bold text-slate-900">Subject Attendance</h2>
              </div>
              <button
                onClick={() => onNavigate('student-attendance')}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {attendanceData?.subject_wise.slice(0, 4).map((sub) => {
                const subBadge = getAttendanceBadge(sub.percentage);
                return (
                  <div key={sub.subject_id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-semibold text-slate-900">
                        <span className="font-mono text-indigo-950 mr-1.5">{sub.code}</span>
                        <span>{sub.name}</span>
                      </div>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${subBadge.bg}`}>
                        {sub.percentage}% {subBadge.label}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${
                          sub.percentage >= 75 ? 'bg-emerald-500' : sub.percentage >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, sub.percentage)}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                      <span>{sub.teacher}</span>
                      <span>{sub.present_classes + sub.duty_leave_classes} / {sub.total_classes} classes</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Internal Marks Overview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-indigo-700" />
                <h2 className="text-sm font-bold text-slate-900">Internal Marks</h2>
              </div>
              <button
                onClick={() => onNavigate('student-marks')}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {marksData?.marks.slice(0, 4).map((m) => (
                <div key={m.subject_id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-mono font-bold text-indigo-950">{m.code}</span>
                    <span className="font-bold text-slate-900">
                      {m.total_obtained !== null ? `${m.total_obtained} / ${m.max_total}` : '—'}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-600 truncate">{m.name}</div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200/60 pt-1.5">
                    <span>Int1: {m.internal1 !== null ? m.internal1 : '—'} | Int2: {m.internal2 !== null ? m.internal2 : '—'}</span>
                    <span className="font-bold text-slate-800">{m.percentage !== null ? `${m.percentage}%` : '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Announcements & Schedule */}
        <div className="space-y-6">
          {/* Upcoming Examinations */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-700" />
                <h2 className="text-sm font-bold text-slate-900">Upcoming Exams</h2>
              </div>
              <button
                onClick={() => onNavigate('student-hallticket')}
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 cursor-pointer"
              >
                Hall Ticket
              </button>
            </div>

            <div className="mt-2 divide-y divide-slate-100">
              {exams.length > 0 ? (
                exams.map((ex) => (
                  <div key={ex.id} className="py-2.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-mono font-bold text-slate-900">{ex.course_code}</span>
                      <span className="font-semibold text-indigo-700">{ex.exam_date}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">{ex.course_title}</div>
                    <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                      <span>{ex.session_time}</span>
                      <span>Hall {ex.hall_no}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">
                  No upcoming examinations scheduled
                </div>
              )}
            </div>
          </div>

          {/* Announcements */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-indigo-700" />
                <h2 className="text-sm font-bold text-slate-900">Recent Notices</h2>
              </div>
              <button
                onClick={() => onNavigate('student-announcements')}
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {announcements.map((ann) => (
                <div key={ann.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-800 uppercase tracking-wider">
                      {ann.category}
                    </span>
                    <span className="text-[10px] text-slate-400">{ann.date}</span>
                  </div>
                  <div className="mt-1.5 text-xs font-bold text-slate-900 line-clamp-1">
                    {ann.title}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">
                    {ann.message}
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
