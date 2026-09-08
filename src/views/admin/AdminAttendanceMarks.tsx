import React, { useState, useEffect } from 'react';
import { StudentUser, SubjectItem } from '../../types';
import {
  CheckSquare,
  FileSpreadsheet,
  Save,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';

interface StudentRowData {
  student_uid: string;
  student_name: string;
  present_classes: number;
  absent_classes: number;
  duty_leave_classes: number;
  total_classes: number;
  internal1: number;
  internal2: number;
  assignment: number;
  project: number;
}

export const AdminAttendanceMarks: React.FC = () => {
  const [classes, setClasses] = useState<string[]>(['S5 CSE A', 'S5 CSE B', 'S5 ECE A', 'S5 ME A']);
  const [selectedClass, setSelectedClass] = useState<string>('S5 CSE A');
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const [rows, setRows] = useState<StudentRowData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load available subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch('/api/subjects?semester=S5');
        if (res.ok) {
          const list: SubjectItem[] = await res.json();
          setSubjects(list);
          if (list.length > 0) {
            setSelectedSubjectId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
      }
    };
    fetchSubjects();
  }, []);

  // Load class students + their existing attendance & marks for the chosen subject
  const loadClassData = async () => {
    if (!selectedClass || !selectedSubjectId) return;
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      // Fetch students in this class
      const studentsRes = await fetch(`/api/students?class=${encodeURIComponent(selectedClass)}`);
      const studentsList: StudentUser[] = await studentsRes.json();

      // Fetch existing attendance and marks for all students in parallel
      const rowPromises = studentsList.map(async (st) => {
        let present = 40;
        let absent = 5;
        let duty = 0;
        let int1 = 26;
        let int2 = 27;
        let assign = 9;
        let proj = 9;

        try {
          const [attRes, marksRes] = await Promise.all([
            fetch(`/api/attendance/student/${st.uid}`),
            fetch(`/api/marks/student/${st.uid}`),
          ]);

          if (attRes.ok) {
            const attData = await attRes.json();
            const foundAtt = attData.subject_wise?.find((s: any) => s.subject_id === selectedSubjectId);
            if (foundAtt) {
              present = foundAtt.present_classes;
              absent = foundAtt.absent_classes;
              duty = foundAtt.duty_leave_classes;
            }
          }

          if (marksRes.ok) {
            const marksData = await marksRes.json();
            const foundMark = marksData.marks?.find((m: any) => m.subject_id === selectedSubjectId);
            if (foundMark) {
              int1 = foundMark.internal1;
              int2 = foundMark.internal2;
              assign = foundMark.assignment;
              proj = foundMark.project;
            }
          }
        } catch (e) {
          // ignore error and use sensible defaults
        }

        return {
          student_uid: st.uid,
          student_name: st.name,
          present_classes: present,
          absent_classes: absent,
          duty_leave_classes: duty,
          total_classes: present + absent + duty,
          internal1: int1,
          internal2: int2,
          assignment: assign,
          project: proj,
        };
      });

      const loadedRows = await Promise.all(rowPromises);
      setRows(loadedRows);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading class data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassData();
  }, [selectedClass, selectedSubjectId]);

  const handleRowChange = (index: number, field: keyof StudentRowData, value: number) => {
    setRows((prev) => {
      const copy = [...prev];
      let clampedVal = Math.max(0, value);
      if (field === 'internal1' || field === 'internal2') {
        clampedVal = Math.min(30, clampedVal);
      } else if (field === 'assignment' || field === 'project') {
        clampedVal = Math.min(10, clampedVal);
      }
      const item = { ...copy[index], [field]: clampedVal };
      // Keep total classes updated
      item.total_classes = item.present_classes + item.absent_classes + item.duty_leave_classes;
      copy[index] = item;
      return copy;
    });
  };

  const handleSaveAll = async () => {
    if (!selectedSubjectId) return;
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      // 1. Prepare attendance bulk payload
      const attendanceUpdates = rows.map((r) => ({
        student_uid: r.student_uid,
        subject_id: selectedSubjectId,
        present_classes: r.present_classes,
        absent_classes: r.absent_classes,
        duty_leave_classes: r.duty_leave_classes,
      }));

      // 2. Prepare marks bulk payload
      const marksUpdates = rows.map((r) => ({
        student_uid: r.student_uid,
        subject_id: selectedSubjectId,
        internal1: r.internal1,
        internal2: r.internal2,
        assignment: r.assignment,
        project: r.project,
      }));

      // Execute both bulk writes
      const [attRes, marksRes] = await Promise.all([
        fetch('/api/attendance/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: attendanceUpdates }),
        }),
        fetch('/api/marks/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: marksUpdates }),
        }),
      ]);

      if (!attRes.ok || !marksRes.ok) {
        throw new Error('Failed to save all entries to CSV storage');
      }

      setSuccessMsg(
        `Successfully saved attendance and internal marks for ${rows.length} students into attendance.csv and marks.csv.`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update records');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Continuous Evaluation & Attendance Spreadsheet
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Bulk spreadsheet-style editor writing directly to{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-indigo-700">attendance.csv</code> &{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-indigo-700">marks.csv</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/attendance/export/csv"
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Attendance CSV</span>
          </a>

          <a
            href="/api/marks/export/csv"
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Marks CSV</span>
          </a>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Target Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none"
            >
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Subject / Course
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name} ({s.teacher})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving || loading || rows.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-950 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-900 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving Records...' : 'Save All Changes'}</span>
        </button>
      </div>

      {/* 1. ATTENDANCE CARD & TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Attendance</h2>
              <p className="text-xs text-slate-500">
                Record and manage student attendance for the selected class and course.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {rows.length} Students
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-700" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No students found for class {selectedClass}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-5 py-3.5 whitespace-nowrap">Register No. (UID)</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Student Name</th>
                  <th className="px-4 py-3.5 text-center bg-emerald-50/50 whitespace-nowrap">Present</th>
                  <th className="px-4 py-3.5 text-center bg-rose-50/50 whitespace-nowrap">Absent</th>
                  <th className="px-4 py-3.5 text-center bg-indigo-50/50 whitespace-nowrap">Duty Leave</th>
                  <th className="px-5 py-3.5 text-center whitespace-nowrap">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {rows.map((row, idx) => {
                  const effectiveAtt = row.present_classes + row.duty_leave_classes;
                  const totalAtt = row.present_classes + row.absent_classes + row.duty_leave_classes;
                  const attPct = totalAtt > 0 ? parseFloat(((effectiveAtt / totalAtt) * 100).toFixed(1)) : 100;
                  const isLowAtt = attPct < 75;

                  return (
                    <tr key={`att-${row.student_uid}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-indigo-950 whitespace-nowrap">
                        {row.student_uid}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {row.student_name}
                      </td>

                      {/* Present Classes Input */}
                      <td className="px-4 py-2.5 text-center bg-emerald-50/15">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={row.present_classes}
                          onChange={(e) =>
                            handleRowChange(idx, 'present_classes', parseInt(e.target.value, 10) || 0)
                          }
                          className="w-16 rounded-lg border border-slate-300 p-1.5 text-center font-semibold text-emerald-800 focus:border-emerald-600 focus:outline-none"
                        />
                      </td>

                      {/* Absent Classes Input */}
                      <td className="px-4 py-2.5 text-center bg-rose-50/15">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={row.absent_classes}
                          onChange={(e) =>
                            handleRowChange(idx, 'absent_classes', parseInt(e.target.value, 10) || 0)
                          }
                          className="w-16 rounded-lg border border-slate-300 p-1.5 text-center font-semibold text-rose-800 focus:border-rose-600 focus:outline-none"
                        />
                      </td>

                      {/* Duty Leave Input */}
                      <td className="px-4 py-2.5 text-center bg-indigo-50/15">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={row.duty_leave_classes}
                          onChange={(e) =>
                            handleRowChange(idx, 'duty_leave_classes', parseInt(e.target.value, 10) || 0)
                          }
                          className="w-16 rounded-lg border border-slate-300 p-1.5 text-center font-semibold text-indigo-800 focus:border-indigo-600 focus:outline-none"
                        />
                      </td>

                      {/* Live Calculated Attendance % */}
                      <td className="px-5 py-2.5 text-center">
                        <span
                          className={`inline-block rounded-md px-2.5 py-1 text-xs font-bold ${
                            isLowAtt
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {attPct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. INTERNAL MARKS CARD & TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Internal Marks</h2>
              <p className="text-xs text-slate-500">
                Manage continuous evaluation marks for the selected course.
              </p>
            </div>
          </div>
          {subjects.find((s) => s.id === selectedSubjectId) && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-lg bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-950">
                {subjects.find((s) => s.id === selectedSubjectId)?.code} •{' '}
                {subjects.find((s) => s.id === selectedSubjectId)?.name}
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-700" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No students found for class {selectedClass}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-5 py-3.5 whitespace-nowrap">Register No. (UID)</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Student Name</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">INT 1 (30)</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">INT 2 (30)</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Assignment (10)</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Project (10)</th>
                  <th className="px-5 py-3.5 text-center font-bold text-indigo-950 whitespace-nowrap">
                    CIA Total (50)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {rows.map((row, idx) => {
                  // Scaled CIA total out of 50
                  const rawCIA =
                    row.internal1 * (15 / 30) + row.internal2 * (15 / 30) + row.assignment + row.project;
                  const totalCIA = Math.round(rawCIA);

                  return (
                    <tr key={`mark-${row.student_uid}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-indigo-950 whitespace-nowrap">
                        {row.student_uid}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {row.student_name}
                      </td>

                      {/* Internal 1 */}
                      <td className="px-4 py-2.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="30"
                          step="0.5"
                          value={row.internal1}
                          onChange={(e) =>
                            handleRowChange(idx, 'internal1', parseFloat(e.target.value) || 0)
                          }
                          className="w-16 rounded-lg border border-slate-300 p-1.5 text-center font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
                        />
                      </td>

                      {/* Internal 2 */}
                      <td className="px-4 py-2.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="30"
                          step="0.5"
                          value={row.internal2}
                          onChange={(e) =>
                            handleRowChange(idx, 'internal2', parseFloat(e.target.value) || 0)
                          }
                          className="w-16 rounded-lg border border-slate-300 p-1.5 text-center font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
                        />
                      </td>

                      {/* Assignment */}
                      <td className="px-4 py-2.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={row.assignment}
                          onChange={(e) =>
                            handleRowChange(idx, 'assignment', parseFloat(e.target.value) || 0)
                          }
                          className="w-16 rounded-lg border border-slate-300 p-1.5 text-center font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
                        />
                      </td>

                      {/* Project */}
                      <td className="px-4 py-2.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={row.project}
                          onChange={(e) =>
                            handleRowChange(idx, 'project', parseFloat(e.target.value) || 0)
                          }
                          className="w-16 rounded-lg border border-slate-300 p-1.5 text-center font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
                        />
                      </td>

                      {/* Scaled CIA Total (50) */}
                      <td className="px-5 py-2.5 text-center font-bold text-indigo-950">
                        <span className="inline-block rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-950">
                          {totalCIA} / 50
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
