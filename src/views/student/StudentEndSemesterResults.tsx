import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser, EndSemesterResultsResponse } from '../../types';
import {
  GraduationCap,
  Printer,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Award,
  Calendar,
  RefreshCw,
  FileCheck,
  ShieldCheck,
  Download,
} from 'lucide-react';

const ALL_SEMESTERS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

export const StudentEndSemesterResults: React.FC = () => {
  const { user } = useAuth();
  const student = user as StudentUser;
  const rexaUrl = import.meta.env.VITE_REXA_PORTAL_URL || 'https://student.rajagiritech.ac.in/';

  const [selectedSemester, setSelectedSemester] = useState<string>('S4');
  const [selectedYear, setSelectedYear] = useState<string>('2025-26');
  const [data, setData] = useState<EndSemesterResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchResults = async (sem: string, yr: string) => {
    if (!student?.uid) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/results/student/${student.uid}?semester=${sem}&academic_year=${yr}`
      );
      if (res.ok) {
        const result: EndSemesterResultsResponse = await res.json();
        setData(result);
        if (result.selected_semester && !sem) {
          setSelectedSemester(result.selected_semester);
        }
      }
    } catch (err) {
      console.error('Error fetching end semester results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults(selectedSemester, selectedYear);
  }, [student?.uid, selectedSemester, selectedYear]);

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  const hasCourses = data && data.courses && data.courses.length > 0;
  const metrics = data?.metrics;

  return (
    <div className="space-y-6">
      {/* Header with Title & Rexa Link (hidden on print) */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            End-Semester Results
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Official degree semester marksheet and performance record.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={rexaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-2 text-xs font-bold text-indigo-900 shadow-xs hover:bg-indigo-100 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-indigo-700" />
            <span>Open REXA Portal</span>
          </a>

          {hasCourses && (
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-950 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-900 transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Marksheet</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar: Semester & Academic Year Selector (hidden on print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs print:hidden">
        {/* Semester Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            Semester:
          </span>
          {ALL_SEMESTERS.map((sem) => (
            <button
              key={sem}
              onClick={() => setSelectedSemester(sem)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                selectedSemester === sem
                  ? 'bg-indigo-950 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {sem}
            </button>
          ))}
        </div>

        {/* Academic Year */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Academic Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
          >
            <option value="2025-26">2025-26</option>
            <option value="2024-25">2024-25</option>
            <option value="2023-24">2023-24</option>
            <option value="2022-23">2022-23</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-700" />
            <span className="text-xs font-medium">Loading Marksheet Data...</span>
          </div>
        </div>
      ) : !hasCourses ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">
            No Results Published for {selectedSemester} ({selectedYear})
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-500">
            Official degree examinations results for this semester have not been finalized or published by
            the Examination Cell.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => setSelectedSemester('S4')}
              className="rounded-xl bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-900 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              View S4 Results
            </button>
          </div>
        </div>
      ) : (
        /* Official Digital Marksheet Document */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs print:border-none print:shadow-none">
          {/* Institutional Header & Letterhead */}
          <div className="border-b border-slate-200 bg-linear-to-b from-indigo-950 to-slate-900 px-6 py-6 text-white sm:px-8">
            <div className="text-center">
              <div className="text-[10px] font-bold tracking-widest text-indigo-200 uppercase sm:text-[11px]">
                Autonomous Institution Affiliated to APJ Abdul Kalam Technological University
              </div>
              <h2 className="mt-1.5 text-lg font-extrabold tracking-tight sm:text-2xl">
                RAJAGIRI SCHOOL OF ENGINEERING & TECHNOLOGY
              </h2>
              <p className="mt-0.5 text-xs text-indigo-200">
                Rajagiri Valley P.O., Kakkanad, Kochi, Kerala - 682039 | NAAC A++ Accredited
              </p>
              <div className="mt-3 inline-block rounded-md border border-indigo-400/40 bg-indigo-900/60 px-4 py-1 text-xs font-bold tracking-wider uppercase text-white">
                Official Digital Grade Card - B.Tech Degree Examination
              </div>
            </div>

            {/* Student Metadata Header: Student Name, UID, Class, Semester, Academic Year */}
            <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl bg-white/10 p-4 text-xs backdrop-blur-xs sm:grid-cols-5 sm:gap-4">
              <div>
                <span className="text-[10px] font-semibold text-indigo-200 uppercase tracking-wider">
                  Student Name
                </span>
                <div className="mt-0.5 font-bold text-white truncate">
                  {data?.student_name || student?.name}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-indigo-200 uppercase tracking-wider">
                  Register No (UID)
                </span>
                <div className="mt-0.5 font-mono font-bold text-white">
                  {data?.student_uid || student?.uid}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-indigo-200 uppercase tracking-wider">
                  Class
                </span>
                <div className="mt-0.5 font-bold text-white">
                  {data?.current_class || student?.class || 'S4 CSE'}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-indigo-200 uppercase tracking-wider">
                  Semester
                </span>
                <div className="mt-0.5 font-bold text-white">
                  {data?.selected_semester || selectedSemester}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-indigo-200 uppercase tracking-wider">
                  Academic Year
                </span>
                <div className="mt-0.5 font-bold text-white">
                  {data?.academic_year || selectedYear}
                </div>
              </div>
            </div>
          </div>

          {/* Official Course Table */}
          <div className="overflow-x-auto p-4 sm:p-6">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                <tr>
                  <th className="px-4 py-3">Course Code</th>
                  <th className="px-4 py-3">Course Title</th>
                  <th className="px-3 py-3 text-center">Credits</th>
                  <th className="px-3 py-3 text-center">Marks</th>
                  <th className="px-3 py-3 text-center">Grade</th>
                  <th className="px-3 py-3 text-center">Grade Point</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data?.courses.map((course, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-950">
                      {course.course_code}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {course.course_title}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-slate-900">
                      {course.credits}
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-slate-800">
                      {course.marks_obtained}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-bold text-indigo-950 text-sm">
                        {course.grade}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-semibold text-slate-900">
                      {course.grade_point}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-md px-2.5 py-0.5 text-[10px] font-bold ${
                          course.result_status === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : course.result_status === 'SUPPLEMENTARY'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {course.result_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Performance Summary Banner: Total Credits, Credits Earned, SGPA, CGPA, Result Status */}
          <div className="border-t border-slate-200 bg-slate-50 p-6 sm:p-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 text-center">
              {/* Total Credits */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Total Credits
                </div>
                <div className="mt-1.5 text-2xl font-extrabold text-slate-900">
                  {metrics?.total_credits}
                </div>
              </div>

              {/* Credits Earned */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Credits Earned
                </div>
                <div className="mt-1.5 text-2xl font-extrabold text-emerald-700">
                  {metrics?.credits_earned}
                </div>
              </div>

              {/* Semester SGPA */}
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-900">
                  Semester SGPA
                </div>
                <div className="mt-1.5 text-2xl font-black text-indigo-950">
                  {metrics?.sgpa}
                </div>
                <div className="text-[9px] text-indigo-700 font-medium">Scale 10.0</div>
              </div>

              {/* Cumulative CGPA */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Cumulative CGPA
                </div>
                <div className="mt-1.5 text-2xl font-extrabold text-slate-900">
                  {metrics?.cgpa}
                </div>
                <div className="text-[9px] text-slate-400">Cumulative Average</div>
              </div>

              {/* Result Status */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs col-span-2 sm:col-span-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Result Status
                </div>
                <div className="mt-2">
                  <span
                    className={`inline-block rounded-md px-3 py-1 text-xs font-black tracking-wider ${
                      metrics?.result_status === 'PASS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : metrics?.result_status === 'SUPPLEMENTARY'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {metrics?.result_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Certification Footer */}
            <div className="mt-6 flex flex-col justify-between gap-4 border-t border-slate-200 pt-4 text-[11px] text-slate-500 sm:flex-row sm:items-center">
              <div>
                <span>Published Date: <strong>{data?.published_date}</strong></span>
                <span className="mx-2">•</span>
                <span>Grading: 10-Point Scale</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Digitally Certified by Controller of Examinations, RSET Autonomous</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
