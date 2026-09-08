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

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-indigo-950 p-6 text-white shadow-xs sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-800/60 px-3 py-1 text-xs font-semibold text-indigo-200">
              <span>Semester {student?.semester}</span>
              <span>•</span>
              <span>{student?.class}</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome back, {student?.name}
            </h1>
            <p className="mt-1 text-xs text-indigo-200 sm:text-sm">
              Department of {student?.department} | UID: {student?.uid}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('student-results')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-indigo-950 shadow-xs transition-colors hover:bg-indigo-50"
            >
              <GraduationCap className="h-4 w-4 text-indigo-950" />
              <span>End-Semester Results</span>
            </button>
            <button
              onClick={() => onNavigate('student-hallticket')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-700 bg-indigo-900/60 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-800"
            >
              <BookOpen className="h-4 w-4" />
              <span>Hall Ticket</span>
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Warning Alert (if < 75%) */}
      {isAttendanceLow && !loading && (
        <div className="flex items-start gap-3.5 rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-900 shadow-xs">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div className="flex-1 text-xs sm:text-sm">
            <span className="font-bold">Attendance Shortage Warning: </span>
            Your overall attendance is currently{' '}
            <span className="font-bold underline">{overallAttendance}%</span>, which is below the
            mandatory KTU 75% threshold. You must attend the next{' '}
            <span className="font-bold">{classesNeeded} consecutive class hours</span> without
            absence to regain safe status.
          </div>
          <button
            onClick={() => onNavigate('student-attendance')}
            className="rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-800"
          >
            Attendance Tracker
          </button>
        </div>
      )}

      {/* 4 Top Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Attendance */}
        <div
          onClick={() => onNavigate('student-attendance')}
          className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Attendance</span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                isAttendanceLow ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {overallAttendance}%
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className={isAttendanceLow ? 'font-semibold text-rose-600' : 'text-emerald-700'}>
              {attendanceData?.overall.status || 'Active'}
            </span>
            <span className="text-slate-400">
              {attendanceData?.overall.present_classes || 0}/{attendanceData?.overall.total_classes || 0} hrs
            </span>
          </div>
        </div>

        {/* CGPA */}
        <div
          onClick={() => onNavigate('student-marks')}
          className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Current CGPA</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {student?.cgpa || '9.42'}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>Scale 10.0</span>
            <span className="font-semibold text-indigo-600">Simulate</span>
          </div>
        </div>

        {/* Completed Credits */}
        <div
          onClick={() => onNavigate('student-results')}
          className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Completed Credits</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {student?.completed_credits || '84'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            <span>Verified Academic Records</span>
          </div>
        </div>

        {/* KTU Activity Points */}
        <div
          onClick={() => onNavigate('student-activities')}
          className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Activity Points</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {approvedPoints} / 100
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-amber-700 font-medium">
              {100 - approvedPoints > 0 ? `${100 - approvedPoints} needed` : 'Completed'}
            </span>
            <span className="text-slate-400">KTU Mandate</span>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Academic Performance & Upcoming Items */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Subject-Wise Attendance & Marks Quick View */}
        <div className="space-y-6 lg:col-span-2">
          {/* Subject Attendance Health */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-700" />
                <h2 className="text-sm font-bold text-slate-900">Course-Wise Attendance Health</h2>
              </div>
              <button
                onClick={() => onNavigate('student-attendance')}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
              >
                <span>View Full Details</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {attendanceData?.subject_wise.slice(0, 4).map((sub) => (
                <div key={sub.subject_id} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900">
                      {sub.code}: {sub.name}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        sub.status === 'Safe'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sub.status === 'Warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {sub.percentage}% ({sub.status})
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${
                        sub.percentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, sub.percentage)}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                    <span>Faculty: {sub.teacher}</span>
                    <span>
                      Attended: {sub.present_classes + sub.duty_leave_classes}/{sub.total_classes} hrs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Internal Marks Summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-indigo-700" />
                <h2 className="text-sm font-bold text-slate-900">Continuous Assessment (Internal Marks)</h2>
              </div>
              <button
                onClick={() => onNavigate('student-marks')}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
              >
                <span>Simulator & Analysis</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {marksData?.marks.slice(0, 4).map((m) => (
                <div key={m.subject_id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">{m.code}</span>
                    <span className="font-bold text-indigo-900">{m.total_obtained} / {m.max_total}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500 truncate">{m.name}</div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Int1: {m.internal1} | Int2: {m.internal2}</span>
                    <span className="font-medium text-slate-700">{m.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Announcements & Upcoming Exams */}
        <div className="space-y-6">
          {/* Upcoming Examinations */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-700" />
                <h2 className="text-sm font-bold text-slate-900">Upcoming Exams</h2>
              </div>
              <button
                onClick={() => onNavigate('student-hallticket')}
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
              >
                Hall Ticket
              </button>
            </div>

            <div className="mt-3 divide-y divide-slate-100">
              {exams.length > 0 ? (
                exams.map((ex) => (
                  <div key={ex.id} className="py-2.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-900">{ex.course_code}</span>
                      <span className="font-mono text-[11px] text-indigo-700">{ex.exam_date}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">{ex.course_title}</div>
                    <div className="mt-0.5 flex justify-between text-[10px] text-slate-400">
                      <span>{ex.session_time}</span>
                      <span>{ex.hall_no}</span>
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

          {/* Recent Announcements */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-indigo-700" />
                <h2 className="text-sm font-bold text-slate-900">Official Notices</h2>
              </div>
              <button
                onClick={() => onNavigate('student-announcements')}
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
              >
                View All
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {announcements.map((ann) => (
                <div key={ann.id} className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700">
                      {ann.category}
                    </span>
                    <span className="text-[10px] text-slate-400">{ann.date}</span>
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-800 line-clamp-1">
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
