import React, { useState, useEffect, useMemo } from 'react';
import { StudentUser, SubjectItem } from '../../types';
import {
  CheckSquare,
  FileSpreadsheet,
  Save,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserCheck,
  UserX,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface StudentRowData {
  student_uid: string;
  student_name: string;
  present_classes: number;
  absent_classes: number;
  duty_leave_classes: number;
  total_classes: number;
  internal1: number | null;
  internal2: number | null;
  assignment: number | null;
  project: number | null;
}

export const AdminAttendanceMarks: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'marks'>('attendance');
  const [classes] = useState<string[]>(['S5 CSE A', 'S5 CSE B', 'S5 ECE A', 'S5 ME A']);
  const [selectedClass, setSelectedClass] = useState<string>('S5 CSE A');
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const [rows, setRows] = useState<StudentRowData[]>([]);
  const [initialRows, setInitialRows] = useState<StudentRowData[]>([]);
  const [dirtyAttendanceIds, setDirtyAttendanceIds] = useState<Set<string>>(new Set());
  const [dirtyMarksIds, setDirtyMarksIds] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Overwrite confirmation modal for marks
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);

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
    setDirtyAttendanceIds(new Set());
    setDirtyMarksIds(new Set());

    try {
      // Fetch students in this class
      const studentsRes = await fetch(`/api/students?class=${encodeURIComponent(selectedClass)}`);
      if (!studentsRes.ok) throw new Error('Failed to load students for class');
      const studentsList: StudentUser[] = await studentsRes.json();

      // Fetch existing attendance and marks for all students in parallel
      const rowPromises = studentsList.map(async (st) => {
        let present = 0;
        let absent = 0;
        let duty = 0;
        let int1: number | null = null;
        let int2: number | null = null;
        let assign: number | null = null;
        let proj: number | null = null;

        try {
          const [attRes, marksRes] = await Promise.all([
            fetch(`/api/attendance/student/${st.uid}`),
            fetch(`/api/marks/student/${st.uid}`),
          ]);

          if (attRes.ok) {
            const attData = await attRes.json();
            const foundAtt = attData.subject_wise?.find((s: any) => s.subject_id === selectedSubjectId);
            if (foundAtt) {
              present = foundAtt.present_classes ?? 0;
              absent = foundAtt.absent_classes ?? 0;
              duty = foundAtt.duty_leave_classes ?? 0;
            }
          }

          if (marksRes.ok) {
            const marksData = await marksRes.json();
            const foundMark = marksData.marks?.find((m: any) => m.subject_id === selectedSubjectId);
            if (foundMark) {
              int1 = foundMark.internal1 ?? null;
              int2 = foundMark.internal2 ?? null;
              assign = foundMark.assignment ?? null;
              proj = foundMark.project ?? null;
            }
          }
        } catch (e) {
          // ignore error and proceed
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
      setInitialRows(JSON.parse(JSON.stringify(loadedRows)));
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading class data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassData();
  }, [selectedClass, selectedSubjectId]);

  // Handle Attendance changes
  const handleAttendanceChange = (
    index: number,
    field: 'present_classes' | 'absent_classes' | 'duty_leave_classes',
    val: number
  ) => {
    const clampedVal = Math.max(0, val);
    setRows((prev) => {
      const copy = [...prev];
      const target = { ...copy[index], [field]: clampedVal };
      target.total_classes = target.present_classes + target.absent_classes + target.duty_leave_classes;
      copy[index] = target;
      return copy;
    });

    const studentUid = rows[index].student_uid;
    setDirtyAttendanceIds((prev) => new Set(prev).add(studentUid));
  };

  // Quick Action: Mark All Present (+1 class attended for all)
  const handleMarkAllPresent = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        present_classes: r.present_classes + 1,
        total_classes: r.present_classes + 1 + r.absent_classes + r.duty_leave_classes,
      }))
    );
    setDirtyAttendanceIds(new Set(rows.map((r) => r.student_uid)));
  };

  // Quick Action: Mark All Absent (+1 class missed for all)
  const handleMarkAllAbsent = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        absent_classes: r.absent_classes + 1,
        total_classes: r.present_classes + r.absent_classes + 1 + r.duty_leave_classes,
      }))
    );
    setDirtyAttendanceIds(new Set(rows.map((r) => r.student_uid)));
  };

  // Handle Marks changes
  const handleMarksChange = (
    index: number,
    field: 'internal1' | 'internal2' | 'assignment' | 'project',
    rawString: string
  ) => {
    let parsedVal: number | null = null;
    if (rawString.trim() !== '') {
      const num = parseFloat(rawString);
      if (!isNaN(num)) {
        let maxVal = 50;
        if (field === 'assignment' || field === 'project') maxVal = 10;
        parsedVal = Math.max(0, Math.min(maxVal, num));
      }
    }

    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: parsedVal };
      return copy;
    });

    const studentUid = rows[index].student_uid;
    setDirtyMarksIds((prev) => new Set(prev).add(studentUid));
  };

  // Save Attendance
  const handleSaveAttendance = async () => {
    if (!selectedSubjectId) return;
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const attendanceUpdates = rows.map((r) => ({
        student_uid: r.student_uid,
        subject_id: selectedSubjectId,
        present_classes: r.present_classes,
        absent_classes: r.absent_classes,
        duty_leave_classes: r.duty_leave_classes,
      }));

      const res = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: attendanceUpdates }),
      });

      if (!res.ok) throw new Error('Failed to save attendance records');

      setSuccessMsg(`Attendance saved successfully for ${rows.length} students.`);
      setDirtyAttendanceIds(new Set());
      setInitialRows(JSON.parse(JSON.stringify(rows)));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  // Check if existing marks are being overwritten
  const checkHasExistingMarksModified = useMemo(() => {
    return rows.some((row) => {
      if (!dirtyMarksIds.has(row.student_uid)) return false;
      const initial = initialRows.find((i) => i.student_uid === row.student_uid);
      if (!initial) return false;
      return (
        initial.internal1 !== null ||
        initial.internal2 !== null ||
        initial.assignment !== null ||
        initial.project !== null
      );
    });
  }, [rows, initialRows, dirtyMarksIds]);

  const initiateSaveMarks = () => {
    if (checkHasExistingMarksModified) {
      setShowOverwriteConfirm(true);
    } else {
      executeSaveMarks();
    }
  };

  // Save Marks
  const executeSaveMarks = async () => {
    setShowOverwriteConfirm(false);
    if (!selectedSubjectId) return;
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const marksUpdates = rows.map((r) => ({
        student_uid: r.student_uid,
        subject_id: selectedSubjectId,
        internal1: r.internal1,
        internal2: r.internal2,
        assignment: r.assignment,
        project: r.project,
        max_internal1: 50,
        max_internal2: 50,
        max_assignment: 10,
        max_project: 10,
      }));

      const res = await fetch('/api/marks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: marksUpdates }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save marks records');
      }

      setSuccessMsg(`Marks saved successfully for ${rows.length} students.`);
      setDirtyMarksIds(new Set());
      setInitialRows(JSON.parse(JSON.stringify(rows)));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="space-y-6">
      {/* Page Title & Exports */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Academic Data Entry</h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Bulk entry for attendance logs and continuous internal evaluation marks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'attendance' ? (
            <a
              href="/api/attendance/export/csv"
              download
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Export Attendance CSV</span>
            </a>
          ) : (
            <a
              href="/api/marks/export/csv"
              download
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Export Marks CSV</span>
            </a>
          )}
        </div>
      </div>

      {/* Class & Subject Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Class Section
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none"
            >
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Subject / Course
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="mt-1 block max-w-xs sm:max-w-md truncate rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name} ({s.teacher})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/60">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-white text-indigo-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            <span>Attendance Entry</span>
            {dirtyAttendanceIds.size > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 text-[10px] text-white px-1.5 py-0.2">
                {dirtyAttendanceIds.size}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('marks')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'marks'
                ? 'bg-white text-indigo-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Marks Entry</span>
            {dirtyMarksIds.size > 0 && (
              <span className="ml-1 rounded-full bg-indigo-600 text-[10px] text-white px-1.5 py-0.2">
                {dirtyMarksIds.size}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-700 hover:text-rose-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: ATTENDANCE ENTRY */}
      {activeTab === 'attendance' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          {/* Card Action Header */}
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Attendance Sheet</h2>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {rows.length} Students
                </span>
                {dirtyAttendanceIds.size > 0 && (
                  <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                    {dirtyAttendanceIds.size} changed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Update class counts directly or use quick bulk actions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Actions */}
              <button
                onClick={handleMarkAllPresent}
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                title="Increment present classes by 1 for all students"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>+1 Class (Mark All Present)</span>
              </button>

              <button
                onClick={handleMarkAllAbsent}
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-100 transition-colors cursor-pointer"
                title="Increment absent classes by 1 for all students"
              >
                <UserX className="h-3.5 w-3.5" />
                <span>+1 Class (Mark All Absent)</span>
              </button>

              <button
                onClick={handleSaveAttendance}
                disabled={saving || loading || rows.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-950 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-900 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving Attendance...' : 'Save Attendance'}</span>
              </button>
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
                    <th className="px-4 py-3.5 text-center whitespace-nowrap bg-emerald-50/40">
                      Present
                    </th>
                    <th className="px-4 py-3.5 text-center whitespace-nowrap bg-rose-50/40">
                      Absent
                    </th>
                    <th className="px-4 py-3.5 text-center whitespace-nowrap bg-indigo-50/40">
                      Duty Leave
                    </th>
                    <th className="px-4 py-3.5 text-center whitespace-nowrap">Total Classes</th>
                    <th className="px-5 py-3.5 text-center whitespace-nowrap">Attendance %</th>
                    <th className="px-4 py-3.5 text-center whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {rows.map((row, idx) => {
                    const effectiveAtt = row.present_classes + row.duty_leave_classes;
                    const totalAtt = row.present_classes + row.absent_classes + row.duty_leave_classes;
                    const attPct = totalAtt > 0 ? parseFloat(((effectiveAtt / totalAtt) * 100).toFixed(1)) : 100;
                    const isLowAtt = attPct < 75;
                    const isDirty = dirtyAttendanceIds.has(row.student_uid);

                    return (
                      <tr
                        key={`att-${row.student_uid}`}
                        className={`transition-colors ${isDirty ? 'bg-amber-50/30' : 'hover:bg-slate-50/70'}`}
                      >
                        <td className="px-5 py-3 font-mono font-bold text-indigo-950 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {isDirty && (
                              <span
                                className="h-2 w-2 rounded-full bg-amber-500 shrink-0"
                                title="Unsaved changes"
                              />
                            )}
                            <span>{row.student_uid}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-900 whitespace-nowrap">
                          {row.student_name}
                        </td>

                        {/* Present */}
                        <td className="px-4 py-2 text-center bg-emerald-50/10">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={row.present_classes}
                            onChange={(e) =>
                              handleAttendanceChange(
                                idx,
                                'present_classes',
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                            className="w-16 rounded-lg border border-slate-200 bg-white p-1.5 text-center font-bold text-emerald-800 focus:border-emerald-600 focus:outline-none"
                          />
                        </td>

                        {/* Absent */}
                        <td className="px-4 py-2 text-center bg-rose-50/10">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={row.absent_classes}
                            onChange={(e) =>
                              handleAttendanceChange(
                                idx,
                                'absent_classes',
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                            className="w-16 rounded-lg border border-slate-200 bg-white p-1.5 text-center font-bold text-rose-800 focus:border-rose-600 focus:outline-none"
                          />
                        </td>

                        {/* Duty Leave */}
                        <td className="px-4 py-2 text-center bg-indigo-50/10">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={row.duty_leave_classes}
                            onChange={(e) =>
                              handleAttendanceChange(
                                idx,
                                'duty_leave_classes',
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                            className="w-16 rounded-lg border border-slate-200 bg-white p-1.5 text-center font-bold text-indigo-800 focus:border-indigo-600 focus:outline-none"
                          />
                        </td>

                        {/* Total Classes */}
                        <td className="px-4 py-2 text-center font-mono font-medium text-slate-600">
                          {totalAtt}
                        </td>

                        {/* Live Attendance % */}
                        <td className="px-5 py-2 text-center">
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

                        {/* Status */}
                        <td className="px-4 py-2 text-center">
                          {isLowAtt ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                              Shortage
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              Safe
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MARKS ENTRY */}
      {activeTab === 'marks' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          {/* Card Header & Save Button */}
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Continuous Evaluation Marks</h2>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {rows.length} Students
                </span>
                {dirtyMarksIds.size > 0 && (
                  <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-semibold text-indigo-800">
                    {dirtyMarksIds.size} changed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Leave field empty if not yet evaluated. Scale: Int 1 (/50), Int 2 (/50), Assign (/10), Project (/10).
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={initiateSaveMarks}
                disabled={saving || loading || rows.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-950 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-900 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving Marks...' : 'Save Marks'}</span>
              </button>
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
                    <th className="px-4 py-3.5 text-center whitespace-nowrap">Internal 1 (/50)</th>
                    <th className="px-4 py-3.5 text-center whitespace-nowrap">Internal 2 (/50)</th>
                    <th className="px-4 py-3.5 text-center whitespace-nowrap">Assignment (/10)</th>
                    <th className="px-4 py-3.5 text-center whitespace-nowrap">Project (/10)</th>
                    <th className="px-5 py-3.5 text-center font-bold text-indigo-950 whitespace-nowrap">
                      Total (/50)
                    </th>
                    <th className="px-5 py-3.5 text-right whitespace-nowrap">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {rows.map((row, idx) => {
                    const hasAny =
                      row.internal1 !== null ||
                      row.internal2 !== null ||
                      row.assignment !== null ||
                      row.project !== null;

                    // KTU CIA Scaling: (Int1/50 * 15) + (Int2/50 * 15) + Assignment(10) + Project(10) = 50
                    // Or if raw: sum scaled to 50
                    let totalCIA: number | null = null;
                    let percentage: number | null = null;
                    if (hasAny) {
                      const i1Scaled = (row.internal1 ?? 0) * (15 / 50);
                      const i2Scaled = (row.internal2 ?? 0) * (15 / 50);
                      const asgn = row.assignment ?? 0;
                      const proj = row.project ?? 0;
                      totalCIA = parseFloat((i1Scaled + i2Scaled + asgn + proj).toFixed(1));
                      percentage = parseFloat(((totalCIA / 50) * 100).toFixed(1));
                    }

                    const isDirty = dirtyMarksIds.has(row.student_uid);

                    return (
                      <tr
                        key={`mark-${row.student_uid}`}
                        className={`transition-colors ${isDirty ? 'bg-indigo-50/30' : 'hover:bg-slate-50/70'}`}
                      >
                        <td className="px-5 py-3 font-mono font-bold text-indigo-950 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {isDirty && (
                              <span
                                className="h-2 w-2 rounded-full bg-indigo-600 shrink-0"
                                title="Unsaved changes"
                              />
                            )}
                            <span>{row.student_uid}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-900 whitespace-nowrap">
                          {row.student_name}
                        </td>

                        {/* Internal 1 */}
                        <td className="px-4 py-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            step="0.5"
                            placeholder="—"
                            value={row.internal1 !== null ? row.internal1 : ''}
                            onChange={(e) => handleMarksChange(idx, 'internal1', e.target.value)}
                            className="w-16 rounded-lg border border-slate-200 bg-white p-1.5 text-center font-medium text-slate-800 placeholder-slate-300 focus:border-indigo-600 focus:outline-none"
                          />
                        </td>

                        {/* Internal 2 */}
                        <td className="px-4 py-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            step="0.5"
                            placeholder="—"
                            value={row.internal2 !== null ? row.internal2 : ''}
                            onChange={(e) => handleMarksChange(idx, 'internal2', e.target.value)}
                            className="w-16 rounded-lg border border-slate-200 bg-white p-1.5 text-center font-medium text-slate-800 placeholder-slate-300 focus:border-indigo-600 focus:outline-none"
                          />
                        </td>

                        {/* Assignment */}
                        <td className="px-4 py-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            placeholder="—"
                            value={row.assignment !== null ? row.assignment : ''}
                            onChange={(e) => handleMarksChange(idx, 'assignment', e.target.value)}
                            className="w-16 rounded-lg border border-slate-200 bg-white p-1.5 text-center font-medium text-slate-800 placeholder-slate-300 focus:border-indigo-600 focus:outline-none"
                          />
                        </td>

                        {/* Project */}
                        <td className="px-4 py-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            placeholder="—"
                            value={row.project !== null ? row.project : ''}
                            onChange={(e) => handleMarksChange(idx, 'project', e.target.value)}
                            className="w-16 rounded-lg border border-slate-200 bg-white p-1.5 text-center font-medium text-slate-800 placeholder-slate-300 focus:border-indigo-600 focus:outline-none"
                          />
                        </td>

                        {/* Total */}
                        <td className="px-5 py-2 text-center font-bold text-indigo-950">
                          {totalCIA !== null ? (
                            <span className="inline-block rounded-md bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-950">
                              {totalCIA} / 50
                            </span>
                          ) : (
                            <span className="text-slate-300 font-medium">—</span>
                          )}
                        </td>

                        {/* Percentage */}
                        <td className="px-5 py-2 text-right font-bold text-slate-900">
                          {percentage !== null ? `${percentage}%` : <span className="text-slate-300 font-medium">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal Before Overwriting Existing Marks */}
      {showOverwriteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Marks Update</h3>
                <p className="text-xs text-slate-500">Existing marks will be modified</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-600 leading-relaxed">
              You are modifying continuous evaluation marks for{' '}
              <strong className="text-slate-900">{dirtyMarksIds.size} student(s)</strong> in{' '}
              <strong className="text-slate-900">{currentSubject?.code} - {currentSubject?.name}</strong>.
              These changes will overwrite existing values stored in marks.csv.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowOverwriteConfirm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSaveMarks}
                className="rounded-xl bg-indigo-950 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-900 cursor-pointer"
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
