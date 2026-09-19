import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser, MarksResponse, SubjectMarks } from '../../types';
import { FileSpreadsheet, TrendingUp, Calculator, Printer, Award, Info } from 'lucide-react';

export const StudentMarks: React.FC = () => {
  const { user } = useAuth();
  const student = user as StudentUser;

  const [marksData, setMarksData] = useState<MarksResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // CGPA Simulator State
  const currentCgpaNum = student?.cgpa ? parseFloat(student.cgpa) : null;
  const completedCreditsNum = student?.completed_credits ? parseFloat(student.completed_credits) : null;
  const initialCgpa = currentCgpaNum ?? 8.5;
  const initialCredits = completedCreditsNum ?? 80;

  const [anticipatedSgpa, setAnticipatedSgpa] = useState<number>(9.0);
  const [semesterCredits, setSemesterCredits] = useState<number>(20);

  useEffect(() => {
    if (!student?.uid) return;
    const fetchMarks = async () => {
      try {
        const res = await fetch(`/api/marks/student/${student.uid}`);
        if (res.ok) {
          setMarksData(await res.json());
        }
      } catch (err) {
        console.error('Error fetching marks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMarks();
  }, [student?.uid]);

  // Projected CGPA Formula
  const currentWeightedPoints = initialCgpa * initialCredits;
  const newWeightedPoints = anticipatedSgpa * semesterCredits;
  const projectedTotalCredits = initialCredits + semesterCredits;
  const projectedCgpa =
    projectedTotalCredits > 0
      ? parseFloat(((currentWeightedPoints + newWeightedPoints) / projectedTotalCredits).toFixed(2))
      : initialCgpa;

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  const renderMark = (val: number | null | undefined) => {
    if (val === null || val === undefined) {
      return <span className="text-slate-300 font-medium">—</span>;
    }
    return val;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Internal Marks</h1>
            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
              Provisional Internal Marks
            </span>
          </div>
          <p className="text-xs text-slate-500 sm:text-sm mt-0.5">
            Semester {student?.semester} • {student?.department}
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer print:hidden"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Marks Report</span>
        </button>
      </div>

      {/* Top Banner & CGPA Simulator */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* CIA Aggregation Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6 print:border-slate-300">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Internal Assessment Aggregate
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {marksData?.summary.total_obtained !== null && marksData?.summary.total_obtained !== undefined
                ? marksData.summary.total_obtained
                : '—'}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              / {marksData?.summary.max_marks ?? 50} max
            </span>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Average Percentage:</span>
              <span className="font-bold text-indigo-950">
                {marksData?.summary.percentage !== null && marksData?.summary.percentage !== undefined
                  ? `${marksData.summary.percentage}%`
                  : '—'}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-900 transition-all duration-500"
                style={{ width: `${Math.min(100, marksData?.summary.percentage ?? 0)}%` }}
              />
            </div>
          </div>

          <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Cumulative CGPA:</span>
              <strong className="text-slate-900">{student?.cgpa || '—'} / 10.0</strong>
            </div>
            <div className="flex justify-between">
              <span>Earned Credits:</span>
              <strong className="text-slate-900">{student?.completed_credits ? `${student.completed_credits} Credits` : '—'}</strong>
            </div>
          </div>
        </div>

        {/* CGPA Simulator Tool */}
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5 shadow-xs sm:p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-indigo-700" />
            <h2 className="text-sm font-bold text-slate-900 sm:text-base">
              CGPA Forecaster
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Estimate cumulative CGPA by forecasting your target SGPA in current exams.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-700">
                Target Semester SGPA: <strong>{anticipatedSgpa.toFixed(2)}</strong>
              </label>
              <div className="mt-1.5 flex items-center gap-3">
                <input
                  type="range"
                  min="4.0"
                  max="10.0"
                  step="0.05"
                  value={anticipatedSgpa}
                  onChange={(e) => setAnticipatedSgpa(parseFloat(e.target.value))}
                  className="w-full accent-indigo-900"
                />
                <span className="w-12 font-mono text-xs font-bold text-indigo-950">
                  {anticipatedSgpa.toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-700">
                Semester Credits: <strong>{semesterCredits}</strong>
              </label>
              <div className="mt-1.5 flex items-center gap-3">
                <input
                  type="range"
                  min="12"
                  max="28"
                  step="1"
                  value={semesterCredits}
                  onChange={(e) => setSemesterCredits(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-900"
                />
                <span className="w-12 font-mono text-xs font-bold text-indigo-950">
                  {semesterCredits} cr
                </span>
              </div>
            </div>
          </div>

          {/* Projection Display */}
          <div className="mt-4 flex flex-col justify-between gap-3 rounded-xl border border-indigo-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Projected Cumulative CGPA</div>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-indigo-950">{projectedCgpa}</span>
                <span className="text-xs text-slate-500">
                  ({projectedCgpa >= initialCgpa ? `+${(projectedCgpa - initialCgpa).toFixed(2)}` : (projectedCgpa - initialCgpa).toFixed(2)})
                </span>
              </div>
            </div>

            <div className="text-right text-xs text-slate-500 sm:max-w-xs">
              Based on {initialCredits} earned credits + {semesterCredits} new credits.
            </div>
          </div>
        </div>
      </div>

      {/* Internal Marks Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 sm:text-base">Continuous Evaluation Component Breakdown</h2>
            <p className="text-xs text-slate-500">
              Provisional internal marks entered by respective course faculty.
            </p>
          </div>

          {/* Info Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-[11px] text-slate-600">
            <Info className="h-3.5 w-3.5 text-indigo-700 shrink-0" />
            <span>Series exams: 70% | Assignments/Attendance: 30% (KTU)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Course Title</th>
                <th className="px-4 py-3 text-center">Internal 1 (/50)</th>
                <th className="px-4 py-3 text-center">Internal 2 (/50)</th>
                <th className="px-4 py-3 text-center">Assignment (/10)</th>
                <th className="px-4 py-3 text-center">Project (/10)</th>
                <th className="px-5 py-3 text-center">Total (/50)</th>
                <th className="px-5 py-3 text-right">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {marksData?.marks.map((row) => (
                <tr key={row.subject_id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-bold text-indigo-950">{row.code}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-900">{row.name}</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-slate-800">{renderMark(row.internal1)}</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-slate-800">{renderMark(row.internal2)}</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-slate-800">{renderMark(row.assignment)}</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-slate-800">{renderMark(row.project)}</td>
                  <td className="px-5 py-3.5 text-center">
                    {row.total_obtained !== null && row.total_obtained !== undefined ? (
                      <span className="rounded bg-indigo-50 px-2 py-0.5 font-bold text-indigo-900 border border-indigo-100">
                        {row.total_obtained}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-medium">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                    {row.percentage !== null && row.percentage !== undefined ? `${row.percentage}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
