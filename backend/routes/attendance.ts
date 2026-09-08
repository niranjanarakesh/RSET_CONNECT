import { Router, Request, Response } from 'express';
import { readCsv, writeCsv, CSV_FILES } from '../csv/csvService';
import { Attendance, AttendanceRecord, Subject, Student } from '../types';

const router = Router();

// GET /api/students/:uid/attendance - Subject-wise + summary attendance for student
router.get('/student/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const targetUid = uid.toUpperCase();

    const [attendanceList, subjects, records] = await Promise.all([
      readCsv<Attendance>(CSV_FILES.ATTENDANCE),
      readCsv<Subject>(CSV_FILES.SUBJECTS),
      readCsv<AttendanceRecord>(CSV_FILES.ATTENDANCE_RECORDS),
    ]);

    const studentAttendance = attendanceList.filter(
      (a) => (a.student_uid || '').toUpperCase() === targetUid
    );

    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalDutyLeave = 0;
    let grandTotal = 0;

    const subjectWise = studentAttendance.map((att) => {
      const subject = subjectMap.get(att.subject_id) || {
        id: att.subject_id,
        code: 'N/A',
        name: 'Subject ' + att.subject_id,
        teacher: 'Faculty',
        semester: 'N/A',
        credits: '3',
      };

      const present = parseFloat(att.present_classes || '0') || 0;
      const absent = parseFloat(att.absent_classes || '0') || 0;
      const dutyLeave = parseFloat(att.duty_leave_classes || '0') || 0;
      const total = parseFloat(att.total_classes || '0') || (present + absent + dutyLeave) || 1;

      totalPresent += present;
      totalAbsent += absent;
      totalDutyLeave += dutyLeave;
      grandTotal += total;

      const effectivePresent = present + dutyLeave;
      const percentage = total > 0 ? parseFloat(((effectivePresent / total) * 100).toFixed(2)) : 100;

      let status: 'Safe' | 'Warning' | 'Critical' = 'Safe';
      if (percentage < 65) {
        status = 'Critical';
      } else if (percentage < 75) {
        status = 'Warning';
      }

      return {
        subject_id: att.subject_id,
        code: subject.code,
        name: subject.name,
        teacher: subject.teacher,
        semester: subject.semester,
        credits: subject.credits,
        present_classes: present,
        absent_classes: absent,
        duty_leave_classes: dutyLeave,
        total_classes: total,
        percentage,
        status,
        last_updated: att.last_updated,
      };
    });

    const overallTotal = grandTotal > 0 ? grandTotal : 1;
    const overallEffectivePresent = totalPresent + totalDutyLeave;
    const overallPercentage = grandTotal > 0 ? parseFloat(((overallEffectivePresent / overallTotal) * 100).toFixed(2)) : 100;

    // Additional classes calculation for 75%
    let requiredClassesFor75 = 0;
    let safeBunks = 0;
    if (overallPercentage < 75 && grandTotal > 0) {
      // (effectivePresent + x) / (grandTotal + x) >= 0.75
      // effectivePresent + x >= 0.75 * grandTotal + 0.75 * x
      // 0.25 * x >= 0.75 * grandTotal - effectivePresent
      // x >= 3 * grandTotal - 4 * effectivePresent
      const diff = 3 * grandTotal - 4 * overallEffectivePresent;
      requiredClassesFor75 = Math.max(0, Math.ceil(diff));
    } else if (overallPercentage >= 75 && grandTotal > 0) {
      // effectivePresent / (grandTotal + y) >= 0.75
      // grandTotal + y <= effectivePresent / 0.75
      safeBunks = Math.max(0, Math.floor(overallEffectivePresent / 0.75 - grandTotal));
    }

    const studentRecords = records
      .filter((r) => (r.student_uid || '').toUpperCase() === targetUid)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.json({
      student_uid: targetUid,
      overall: {
        total_classes: grandTotal,
        present_classes: totalPresent,
        absent_classes: totalAbsent,
        duty_leave_classes: totalDutyLeave,
        percentage: overallPercentage,
        status: overallPercentage >= 75 ? 'Safe' : overallPercentage >= 65 ? 'Warning' : 'Critical',
        required_classes_for_75: requiredClassesFor75,
        safe_bunks: safeBunks,
      },
      subject_wise: subjectWise,
      recent_records: studentRecords,
    });
  } catch (error: any) {
    console.error('Error getting student attendance:', error);
    return res.status(500).json({ error: 'Failed to retrieve attendance' });
  }
});

// GET /api/attendance/records/:uid - Detailed day-period records with semester & month filter
router.get('/records/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { semester, month } = req.query;
    const targetUid = uid.toUpperCase();

    const [records, subjects] = await Promise.all([
      readCsv<AttendanceRecord>(CSV_FILES.ATTENDANCE_RECORDS),
      readCsv<Subject>(CSV_FILES.SUBJECTS),
    ]);

    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    let filtered = records.filter((r) => (r.student_uid || '').toUpperCase() === targetUid);

    if (semester) {
      filtered = filtered.filter((r) => (r.semester || '').toLowerCase() === String(semester).toLowerCase());
    }

    if (month) {
      filtered = filtered.filter((r) => (r.date || '').startsWith(String(month)));
    }

    const formatted = filtered.map((r) => ({
      ...r,
      subject_name: subjectMap.get(r.subject_id)?.name || 'Subject ' + r.subject_id,
      subject_code: subjectMap.get(r.subject_id)?.code || 'N/A',
    }));

    return res.json(formatted);
  } catch (error: any) {
    console.error('Error fetching attendance records:', error);
    return res.status(500).json({ error: 'Failed to retrieve attendance records' });
  }
});

// POST /api/attendance & /api/attendance/bulk - Save or update attendance records (Single or Bulk)
router.post(['/', '/bulk'], async (req: Request, res: Response) => {
  try {
    const { updates, singleRecord } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const attendanceList = await readCsv<Attendance>(CSV_FILES.ATTENDANCE);

    // If singleRecord is passed: { student_uid, subject_id, present_classes, absent_classes, duty_leave_classes }
    const itemsToProcess: Array<{
      student_uid: string;
      subject_id: string;
      present_classes: number;
      absent_classes: number;
      duty_leave_classes: number;
    }> = [];

    if (Array.isArray(updates) && updates.length > 0) {
      itemsToProcess.push(...updates);
    } else if (singleRecord) {
      itemsToProcess.push(singleRecord);
    } else if (req.body.student_uid && req.body.subject_id) {
      itemsToProcess.push(req.body);
    } else {
      return res.status(400).json({ error: 'No attendance updates provided' });
    }

    // Validation
    for (const item of itemsToProcess) {
      const present = parseFloat(String(item.present_classes || 0));
      const absent = parseFloat(String(item.absent_classes || 0));
      const duty = parseFloat(String(item.duty_leave_classes || 0));

      if (present < 0 || absent < 0 || duty < 0) {
        return res.status(400).json({
          error: `Attendance values cannot be negative for student ${item.student_uid}`,
        });
      }
    }

    // Update attendance.csv in place
    for (const item of itemsToProcess) {
      const targetUid = String(item.student_uid).trim().toUpperCase();
      const targetSub = String(item.subject_id).trim();
      const present = parseFloat(String(item.present_classes || 0));
      const absent = parseFloat(String(item.absent_classes || 0));
      const duty = parseFloat(String(item.duty_leave_classes || 0));
      const total = present + absent + duty;

      const index = attendanceList.findIndex(
        (a) =>
          (a.student_uid || '').toUpperCase() === targetUid &&
          (a.subject_id || '').trim() === targetSub
      );

      const updatedRow: Attendance = {
        student_uid: targetUid,
        subject_id: targetSub,
        present_classes: String(present),
        total_classes: String(total),
        absent_classes: String(absent),
        duty_leave_classes: String(duty),
        last_updated: today,
      };

      if (index !== -1) {
        attendanceList[index] = updatedRow;
      } else {
        attendanceList.push(updatedRow);
      }
    }

    await writeCsv(CSV_FILES.ATTENDANCE, attendanceList);

    return res.json({
      message: 'Changes saved successfully to attendance.csv',
      count: itemsToProcess.length,
    });
  } catch (error: any) {
    console.error('Error saving attendance:', error);
    return res.status(500).json({ error: 'Failed to write attendance to CSV' });
  }
});

// GET /api/attendance/export & /api/attendance/export/csv - Export attendance as CSV
router.get(['/export', '/export/csv'], async (req: Request, res: Response) => {
  try {
    const { semester, class: classFilter } = req.query;
    const [attendanceList, students, subjects] = await Promise.all([
      readCsv<Attendance>(CSV_FILES.ATTENDANCE),
      readCsv<Student>(CSV_FILES.STUDENTS),
      readCsv<Subject>(CSV_FILES.SUBJECTS),
    ]);

    const studentMap = new Map(students.map((s) => [s.uid.toUpperCase(), s]));
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    let filtered = attendanceList;

    if (semester || classFilter) {
      filtered = filtered.filter((att) => {
        const student = studentMap.get((att.student_uid || '').toUpperCase());
        if (!student) return false;
        if (semester && student.semester.toLowerCase() !== String(semester).toLowerCase()) return false;
        if (classFilter && student.class.toLowerCase() !== String(classFilter).toLowerCase()) return false;
        return true;
      });
    }

    const rows = filtered.map((att) => {
      const student = studentMap.get((att.student_uid || '').toUpperCase());
      const subject = subjectMap.get(att.subject_id);
      const present = parseFloat(att.present_classes || '0') || 0;
      const absent = parseFloat(att.absent_classes || '0') || 0;
      const duty = parseFloat(att.duty_leave_classes || '0') || 0;
      const total = parseFloat(att.total_classes || '0') || (present + absent + duty) || 1;
      const pct = ((present + duty) / total * 100).toFixed(2);

      return {
        Student_UID: att.student_uid,
        Student_Name: student?.name || 'N/A',
        Class: student?.class || 'N/A',
        Semester: student?.semester || 'N/A',
        Subject_Code: subject?.code || 'N/A',
        Subject_Name: subject?.name || 'N/A',
        Present_Classes: att.present_classes,
        Absent_Classes: att.absent_classes,
        Duty_Leave_Classes: att.duty_leave_classes,
        Total_Classes: att.total_classes,
        Percentage: `${pct}%`,
        Last_Updated: att.last_updated,
      };
    });

    const headers = Object.keys(rows[0] || {});
    const csvContent = [
      headers.join(','),
      ...rows.map((r) => Object.values(r).map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_export_${Date.now()}.csv"`);
    return res.send(csvContent);
  } catch (error: any) {
    console.error('Error exporting attendance:', error);
    return res.status(500).json({ error: 'Failed to export attendance CSV' });
  }
});

export default router;
