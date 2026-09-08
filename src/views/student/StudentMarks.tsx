import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser, MarksResponse, SubjectMarks } from '../../types';
import { FileSpreadsheet, TrendingUp, Calculator, Printer, Award, CheckCircle2 } from 'lucide-react';

export const StudentMarks: React.FC = () => {
  const { user } = useAuth();
  const student = user as StudentUser;

  const [marksData, setMarksData] = useState<MarksResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // CGPA Simulator State
  const initialCgpa = parseFloat(student?.cgpa || '8.85') || 8.85;
  const initialCredits = parseFloat(student?.completed_credits || '84') || 84;
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
  // Projected CGPA = ((Current CGPA * Completed Credits) + (Anticipated SGPA * Semester Credits)) / (Completed Credits + Semester Credits)
  const currentWeightedPoints = initialCgpa * initialCredits;
  const newWeightedPoints = anticipatedSgpa * semesterCredits;
  const projectedTotalCredits = initialCredits + semesterCredits;
  const projectedCgpa =
    projectedTotalCredits > 0
      ? parseFloat(((currentWeightedPoints + newWeightedPoints) / projectedTotalCredits).toFixed(2))
      : initialCgpa;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Internal Marks (Continuous Evaluation)</h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Continuous Internal Assessment (CIA) marks, laboratory rubrics, and assignment scores.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Marks Report</span>
        </button>
      </div>

      {/* Top Banner & CGPA Simulator */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* CIA Aggregation Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Internal Assessment Aggregate
          </span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {marksData?.summary.total_obtained ?? 0}
            </span>
            <span className="text-xs text-slate-500">
              / {marksData?.summary.max_marks ?? 0} max
            </span>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Overall CIA Average:</span>
              <span className="font-bold text-indigo-950">
                {marksData?.summary.percentage ?? 0}%
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-900"
                style={{ width: `${Math.min(100, marksData?.summary.percentage ?? 0)}%` }}
              />
            </div>
          </div>

          <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Current Degree CGPA:</span>
              <strong className="text-slate-900">{initialCgpa} / 10.0</strong>
            </div>
            <div className="flex justify-between">
              <span>Official Completed Credits:</span>
              <strong className="text-slate-900">{initialCredits} Credits</strong>
            </div>
          </div>
        </div>

        {/* CGPA Simulator Tool */}
        <div className="rounded-2xl border border-indigo-100 bg-linear-to-br from-indigo-50/50 via-white to-white p-5 shadow-xs sm:p-6 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-indigo-700" />
            <h2 className="text-sm font-bold text-slate-900 sm:text-base">
              Cumulative CGPA Forecaster & Simulator
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Estimate how your target SGPA in the current {student?.semester} examination will impact your cumulative CGPA.
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
          <div className="mt-5 flex flex-col justify-between gap-3 rounded-xl border border-indigo-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
            <div>
              <div className="text-[11px] font-semibold text-slate-500">Projected Cumulative CGPA</div>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-indigo-950">{projectedCgpa}</span>
                <span className="text-xs text-slate-500">
                  ({projectedCgpa >= initialCgpa ? `+${(projectedCgpa - initialCgpa).toFixed(2)}` : (projectedCgpa - initialCgpa).toFixed(2)})
                </span>
              </div>
            </div>

            <div className="text-right text-xs text-slate-600 sm:max-w-xs">
              Based on {initialCredits} earned credits at {initialCgpa} CGPA + {semesterCredits} new credits.
            </div>
          </div>
        </div>
      </div>

      {/* Internal Marks Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-900 sm:text-base">Continuous Evaluation Component Breakdown</h2>
          <p className="text-xs text-slate-500">
            Internal 1 (30), Internal 2 (30), Assignment (10), Mini Project / Quiz (10) scaled to CIA 50
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Course Title</th>
                <th className="px-4 py-3 text-center">Int 1 (30)</th>
                <th className="px-4 py-3 text-center">Int 2 (30)</th>
                <th className="px-4 py-3 text-center">Assign (10)</th>
                <th className="px-4 py-3 text-center">Project (10)</th>
                <th className="px-5 py-3 text-center">Total (50)</th>
                <th className="px-4 py-3 text-center">Max</th>
                <th className="px-5 py-3 text-right">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {marksData?.marks.map((row) => (
                <tr key={row.subject_id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-mono font-bold text-indigo-950">{row.code}</td>
                  <td className="px-5 py-3 font-medium text-slate-900">{row.name}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-800">{row.internal1}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-800">{row.internal2}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-800">{row.assignment}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-800">{row.project}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="rounded bg-indigo-50 px-2 py-0.5 font-bold text-indigo-900">
                      {row.total_obtained}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-400">{row.max_total}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="font-bold text-slate-900">{row.percentage}%</span>
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
