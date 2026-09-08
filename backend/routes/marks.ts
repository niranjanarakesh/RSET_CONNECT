import { Router, Request, Response } from 'express';
import { readCsv, writeCsv, CSV_FILES } from '../csv/csvService';
import { Marks, Subject, Student } from '../types';

const router = Router();

// GET /api/students/:uid/marks - Subject-wise internal marks for a student
router.get('/student/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const targetUid = uid.toUpperCase();

    const [marksList, subjects] = await Promise.all([
      readCsv<Marks>(CSV_FILES.MARKS),
      readCsv<Subject>(CSV_FILES.SUBJECTS),
    ]);

    const studentMarks = marksList.filter(
      (m) => (m.student_uid || '').toUpperCase() === targetUid
    );

    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    let totalMarksObtained = 0;
    let totalMaxMarks = 0;

    const formatted = studentMarks.map((m) => {
      const subject = subjectMap.get(m.subject_id) || {
        id: m.subject_id,
        code: 'N/A',
        name: 'Subject ' + m.subject_id,
        teacher: 'Faculty',
        semester: 'N/A',
        credits: '3',
      };

      const i1 = parseFloat(m.internal1 || '0') || 0;
      const i2 = parseFloat(m.internal2 || '0') || 0;
      const asgn = parseFloat(m.assignment || '0') || 0;
      const proj = parseFloat(m.project || '0') || 0;

      const maxI1 = parseFloat(m.max_internal1 || '30') || 30;
      const maxI2 = parseFloat(m.max_internal2 || '30') || 30;
      const maxAsgn = parseFloat(m.max_assignment || '10') || 10;
      const maxProj = parseFloat(m.max_project || '10') || 10;

      const totalObtained = i1 + i2 + asgn + proj;
      const maxTotal = maxI1 + maxI2 + maxAsgn + maxProj;
      const percentage = maxTotal > 0 ? parseFloat(((totalObtained / maxTotal) * 100).toFixed(2)) : 0;

      totalMarksObtained += totalObtained;
      totalMaxMarks += maxTotal;

      return {
        subject_id: m.subject_id,
        code: subject.code,
        name: subject.name,
        teacher: subject.teacher,
        semester: subject.semester,
        credits: subject.credits,
        internal1: i1,
        internal2: i2,
        assignment: asgn,
        project: proj,
        max_internal1: maxI1,
        max_internal2: maxI2,
        max_assignment: maxAsgn,
        max_project: maxProj,
        total_obtained: parseFloat(totalObtained.toFixed(2)),
        max_total: maxTotal,
        percentage,
      };
    });

    const overallPercentage =
      totalMaxMarks > 0 ? parseFloat(((totalMarksObtained / totalMaxMarks) * 100).toFixed(2)) : 0;

    return res.json({
      student_uid: targetUid,
      summary: {
        total_obtained: parseFloat(totalMarksObtained.toFixed(2)),
        max_marks: totalMaxMarks,
        percentage: overallPercentage,
      },
      marks: formatted,
    });
  } catch (error: any) {
    console.error('Error getting student marks:', error);
    return res.status(500).json({ error: 'Failed to retrieve internal marks' });
  }
});

// POST /api/marks & /api/marks/bulk - Save or update marks (single or bulk)
router.post(['/', '/bulk'], async (req: Request, res: Response) => {
  try {
    const { updates, singleRecord } = req.body;

    const itemsToProcess: Array<{
      student_uid: string;
      subject_id: string;
      internal1?: number | string;
      internal2?: number | string;
      assignment?: number | string;
      project?: number | string;
      max_internal1?: number | string;
      max_internal2?: number | string;
      max_assignment?: number | string;
      max_project?: number | string;
    }> = [];

    if (Array.isArray(updates) && updates.length > 0) {
      itemsToProcess.push(...updates);
    } else if (singleRecord) {
      itemsToProcess.push(singleRecord);
    } else if (req.body.student_uid && req.body.subject_id) {
      itemsToProcess.push(req.body);
    } else {
      return res.status(400).json({ error: 'No marks data provided' });
    }

    // Validation
    for (const item of itemsToProcess) {
      const i1 = parseFloat(String(item.internal1 ?? 0));
      const i2 = parseFloat(String(item.internal2 ?? 0));
      const asgn = parseFloat(String(item.assignment ?? 0));
      const proj = parseFloat(String(item.project ?? 0));

      const maxI1 = parseFloat(String(item.max_internal1 ?? 30));
      const maxI2 = parseFloat(String(item.max_internal2 ?? 30));
      const maxAsgn = parseFloat(String(item.max_assignment ?? 10));
      const maxProj = parseFloat(String(item.max_project ?? 10));

      if (i1 < 0 || i2 < 0 || asgn < 0 || proj < 0) {
        return res.status(400).json({
          error: `Marks cannot be negative for student ${item.student_uid}`,
        });
      }

      if (i1 > maxI1) {
        return res.status(400).json({
          error: `Internal 1 marks (${i1}) cannot exceed maximum (${maxI1}) for student ${item.student_uid}`,
        });
      }
      if (i2 > maxI2) {
        return res.status(400).json({
          error: `Internal 2 marks (${i2}) cannot exceed maximum (${maxI2}) for student ${item.student_uid}`,
        });
      }
      if (asgn > maxAsgn) {
        return res.status(400).json({
          error: `Assignment marks (${asgn}) cannot exceed maximum (${maxAsgn}) for student ${item.student_uid}`,
        });
      }
      if (proj > maxProj) {
        return res.status(400).json({
          error: `Project marks (${proj}) cannot exceed maximum (${maxProj}) for student ${item.student_uid}`,
        });
      }
    }

    const marksList = await readCsv<Marks>(CSV_FILES.MARKS);

    for (const item of itemsToProcess) {
      const targetUid = String(item.student_uid).trim().toUpperCase();
      const targetSub = String(item.subject_id).trim();

      const existingIndex = marksList.findIndex(
        (m) =>
          (m.student_uid || '').toUpperCase() === targetUid &&
          (m.subject_id || '').trim() === targetSub
      );

      const updatedRow: Marks = {
        student_uid: targetUid,
        subject_id: targetSub,
        internal1: String(item.internal1 ?? 0),
        internal2: String(item.internal2 ?? 0),
        assignment: String(item.assignment ?? 0),
        project: String(item.project ?? 0),
        max_internal1: String(item.max_internal1 ?? 30),
        max_internal2: String(item.max_internal2 ?? 30),
        max_assignment: String(item.max_assignment ?? 10),
        max_project: String(item.max_project ?? 10),
      };

      if (existingIndex !== -1) {
        marksList[existingIndex] = updatedRow;
      } else {
        marksList.push(updatedRow);
      }
    }

    await writeCsv(CSV_FILES.MARKS, marksList);

    return res.json({
      message: 'Changes saved successfully to marks.csv',
      count: itemsToProcess.length,
    });
  } catch (error: any) {
    console.error('Error saving marks:', error);
    return res.status(500).json({ error: 'Failed to write marks to CSV' });
  }
});

// GET /api/marks/export & /api/marks/export/csv - Export marks to CSV
router.get(['/export', '/export/csv'], async (req: Request, res: Response) => {
  try {
    const { semester, class: classFilter } = req.query;
    const [marksList, students, subjects] = await Promise.all([
      readCsv<Marks>(CSV_FILES.MARKS),
      readCsv<Student>(CSV_FILES.STUDENTS),
      readCsv<Subject>(CSV_FILES.SUBJECTS),
    ]);

    const studentMap = new Map(students.map((s) => [s.uid.toUpperCase(), s]));
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    let filtered = marksList;

    if (semester || classFilter) {
      filtered = filtered.filter((m) => {
        const student = studentMap.get((m.student_uid || '').toUpperCase());
        if (!student) return false;
        if (semester && student.semester.toLowerCase() !== String(semester).toLowerCase()) return false;
        if (classFilter && student.class.toLowerCase() !== String(classFilter).toLowerCase()) return false;
        return true;
      });
    }

    const rows = filtered.map((m) => {
      const student = studentMap.get((m.student_uid || '').toUpperCase());
      const subject = subjectMap.get(m.subject_id);
      const total =
        (parseFloat(m.internal1) || 0) +
        (parseFloat(m.internal2) || 0) +
        (parseFloat(m.assignment) || 0) +
        (parseFloat(m.project) || 0);
      const maxTotal =
        (parseFloat(m.max_internal1) || 30) +
        (parseFloat(m.max_internal2) || 30) +
        (parseFloat(m.max_assignment) || 10) +
        (parseFloat(m.max_project) || 10);
      const pct = maxTotal > 0 ? ((total / maxTotal) * 100).toFixed(2) : '0';

      return {
        Student_UID: m.student_uid,
        Student_Name: student?.name || 'N/A',
        Class: student?.class || 'N/A',
        Semester: student?.semester || 'N/A',
        Subject_Code: subject?.code || 'N/A',
        Subject_Name: subject?.name || 'N/A',
        Internal_1: m.internal1,
        Internal_2: m.internal2,
        Assignment: m.assignment,
        Project: m.project,
        Total: total,
        Max_Total: maxTotal,
        Percentage: `${pct}%`,
      };
    });

    const headers = Object.keys(rows[0] || {});
    const csvContent = [
      headers.join(','),
      ...rows.map((r) => Object.values(r).map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="marks_export_${Date.now()}.csv"`);
    return res.send(csvContent);
  } catch (error: any) {
    console.error('Error exporting marks:', error);
    return res.status(500).json({ error: 'Failed to export marks CSV' });
  }
});

export default router;
