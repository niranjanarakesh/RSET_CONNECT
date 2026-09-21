import { Router, Request, Response } from 'express';
import { readCsv, writeCsv, updateCsv, deleteFromCsv, CSV_FILES } from '../csv/csvService';
import { Student } from '../types';

const router = Router();

// GET /api/students - List students with search and filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, class: classFilter, semester, department } = req.query;
    let students = await readCsv<Student>(CSV_FILES.STUDENTS);

    if (search) {
      const q = String(search).toLowerCase();
      students = students.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.uid.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    if (classFilter) {
      students = students.filter((s) => s.class.toLowerCase() === String(classFilter).toLowerCase());
    }

    if (semester) {
      students = students.filter((s) => s.semester.toLowerCase() === String(semester).toLowerCase());
    }

    if (department) {
      students = students.filter((s) => s.department.toLowerCase().includes(String(department).toLowerCase()));
    }

    // Strip passwords before returning
    const safeStudents = students.map(({ password, ...rest }) => rest);
    return res.json(safeStudents);
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return res.status(500).json({ error: 'Failed to retrieve students' });
  }
});

// GET /api/students/export & /api/students/export/csv - Export students to CSV
router.get(['/export', '/export/csv'], async (req: Request, res: Response) => {
  try {
    const students = await readCsv<Student>(CSV_FILES.STUDENTS);
    const safeStudents = students.map(({ password, ...rest }) => rest);
    const headers = [
      'id', 'uid', 'name', 'class', 'email', 'phone', 'gender',
      'department', 'semester', 'cgpa', 'completed_credits'
    ];
    let csv = headers.join(',') + '\n';
    safeStudents.forEach((s) => {
      const row = [
        `"${s.id || ''}"`,
        `"${s.uid || ''}"`,
        `"${(s.name || '').replace(/"/g, '""')}"`,
        `"${s.class || ''}"`,
        `"${s.email || ''}"`,
        `"${s.phone || ''}"`,
        `"${s.gender || ''}"`,
        `"${(s.department || '').replace(/"/g, '""')}"`,
        `"${s.semester || ''}"`,
        `"${s.cgpa || ''}"`,
        `"${s.completed_credits || ''}"`
      ];
      csv += row.join(',') + '\n';
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="students_export_${Date.now()}.csv"`);
    return res.send(csv);
  } catch (error: any) {
    console.error('Error exporting students:', error);
    return res.status(500).json({ error: 'Failed to export students CSV' });
  }
});

// GET /api/students/:uid - Get single student
router.get('/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const students = await readCsv<Student>(CSV_FILES.STUDENTS);
    const student = students.find((s) => s.uid.toLowerCase() === uid.toLowerCase());

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const { password, ...safeStudent } = student;
    return res.json(safeStudent);
  } catch (error: any) {
    console.error('Error fetching student:', error);
    return res.status(500).json({ error: 'Failed to retrieve student details' });
  }
});

// POST /api/students - Create new student
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      uid,
      name,
      password = 'student123',
      class: className,
      email,
      phone,
      gender,
      department,
      semester,
      cgpa = '0.00',
      completed_credits = '0',
      photo = '/assets/default_student_avatar.svg',
      signature = '',
    } = req.body;

    if (!uid || !name || !email) {
      return res.status(400).json({ error: 'UID, Name, and Email are required' });
    }

    const trimmedUid = String(uid).trim().toUpperCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address format' });
    }

    const students = await readCsv<Student>(CSV_FILES.STUDENTS);
    const existing = students.find((s) => s.uid.toUpperCase() === trimmedUid);
    if (existing) {
      return res.status(409).json({ error: `Student with UID '${trimmedUid}' already exists` });
    }

    const newStudent: Student = {
      id: String(Date.now()),
      uid: trimmedUid,
      password: String(password).trim() || 'student123',
      name: String(name).trim(),
      class: String(className || 'S1 CSE A').trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone || '').trim(),
      gender: String(gender || 'Other').trim(),
      department: String(department || 'Computer Science & Engineering').trim(),
      semester: String(semester || 'S1').trim(),
      cgpa: String(cgpa || '0.00').trim(),
      completed_credits: String(completed_credits || '0').trim(),
      photo: String(photo || '/assets/default_student_avatar.svg'),
      signature: String(signature || name).trim(),
    };

    students.push(newStudent);
    await writeCsv(CSV_FILES.STUDENTS, students);

    const { password: _, ...safeStudent } = newStudent;
    return res.status(201).json({
      message: 'Student registered successfully in students.csv',
      student: safeStudent,
    });
  } catch (error: any) {
    console.error('Error creating student:', error);
    return res.status(500).json({ error: 'Failed to create student in CSV' });
  }
});

// PUT /api/students/:uid - Update student details
router.put('/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const updates = req.body;
    const isStudentSelfEdit = req.headers['x-role'] === 'student';

    const students = await readCsv<Student>(CSV_FILES.STUDENTS);
    const studentIndex = students.findIndex((s) => s.uid.toLowerCase() === uid.toLowerCase());

    if (studentIndex === -1) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const current = students[studentIndex];

    // If student is self-editing, prevent unauthorized field changes
    if (isStudentSelfEdit) {
      if (updates.cgpa !== undefined && updates.cgpa !== current.cgpa) {
        return res.status(403).json({ error: 'Students cannot modify CGPA' });
      }
      if (updates.completed_credits !== undefined && updates.completed_credits !== current.completed_credits) {
        return res.status(403).json({ error: 'Students cannot modify completed credits' });
      }
      if (updates.uid !== undefined && updates.uid.toUpperCase() !== current.uid.toUpperCase()) {
        return res.status(403).json({ error: 'Students cannot modify UID' });
      }
    }

    // Apply allowed updates
    const updatedStudent: Student = {
      ...current,
      ...updates,
      // Ensure UID is preserved if matching
      uid: updates.uid ? String(updates.uid).toUpperCase() : current.uid,
    };

    students[studentIndex] = updatedStudent;
    await writeCsv(CSV_FILES.STUDENTS, students);

    const { password: _, ...safeStudent } = updatedStudent;
    return res.json({
      message: 'Student details updated successfully in students.csv',
      student: safeStudent,
    });
  } catch (error: any) {
    console.error('Error updating student:', error);
    return res.status(500).json({ error: 'Failed to update student in CSV' });
  }
});

// DELETE /api/students/:uid - Cascading deletion across all CSVs
router.delete('/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const targetUid = uid.toUpperCase();

    // 1. Delete from students.csv
    const deletedStudents = await deleteFromCsv<Student>(
      CSV_FILES.STUDENTS,
      (s) => s.uid.toUpperCase() === targetUid
    );

    if (deletedStudents === 0) {
      return res.status(404).json({ error: `Student with UID '${targetUid}' not found` });
    }

    // 2. Cascade delete from related CSVs
    const [attDeleted, attRecDeleted, marksDeleted, actDeleted, fbDeleted, examsDeleted, resDeleted] =
      await Promise.all([
        deleteFromCsv(CSV_FILES.ATTENDANCE, (row: any) => (row.student_uid || '').toUpperCase() === targetUid),
        deleteFromCsv(CSV_FILES.ATTENDANCE_RECORDS, (row: any) => (row.student_uid || '').toUpperCase() === targetUid),
        deleteFromCsv(CSV_FILES.MARKS, (row: any) => (row.student_uid || '').toUpperCase() === targetUid),
        deleteFromCsv(CSV_FILES.ACTIVITIES, (row: any) => (row.student_uid || '').toUpperCase() === targetUid),
        deleteFromCsv(CSV_FILES.FEEDBACK, (row: any) => (row.student_uid || '').toUpperCase() === targetUid),
        deleteFromCsv(CSV_FILES.EXAMS, (row: any) => (row.student_uid || '').toUpperCase() === targetUid),
        deleteFromCsv(CSV_FILES.END_SEMESTER_RESULTS, (row: any) => (row.student_uid || '').toUpperCase() === targetUid),
      ]);

    return res.json({
      message: `Student '${targetUid}' and all associated academic records deleted successfully`,
      cascadedDeletions: {
        student: deletedStudents,
        attendance: attDeleted,
        attendanceRecords: attRecDeleted,
        marks: marksDeleted,
        activities: actDeleted,
        feedback: fbDeleted,
        exams: examsDeleted,
        endSemesterResults: resDeleted,
      },
    });
  } catch (error: any) {
    console.error('Error deleting student:', error);
    return res.status(500).json({ error: 'Failed to delete student and cascade records' });
  }
});

export default router;
