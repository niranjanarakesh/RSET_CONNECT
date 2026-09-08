import { Router, Request, Response } from 'express';
import { readCsv, writeCsv, deleteFromCsv, CSV_FILES } from '../csv/csvService';
import { Examination, ExamAllocation, Student } from '../types';

const router = Router();

// GET /api/examinations (or /api/examinations/schedules) - List examination schedule
const getExaminationsHandler = async (req: Request, res: Response) => {
  try {
    const { semester } = req.query;
    let list = await readCsv<Examination>(CSV_FILES.EXAMINATIONS);

    if (semester) {
      list = list.filter((e) => e.semester.toLowerCase() === String(semester).toLowerCase());
    }

    list.sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime());
    return res.json(list);
  } catch (error: any) {
    console.error('Error fetching examinations:', error);
    return res.status(500).json({ error: 'Failed to retrieve examination schedule' });
  }
};
router.get('/', getExaminationsHandler);
router.get('/schedules', getExaminationsHandler);

// POST /api/examinations (or /api/examinations/schedules) - Admin add examination
const createExaminationHandler = async (req: Request, res: Response) => {
  try {
    const {
      semester,
      course_code,
      course_title,
      exam_date,
      session_time,
      hall_no,
      exam_centre,
    } = req.body;

    if (!course_code || !course_title || !exam_date) {
      return res.status(400).json({ error: 'Course Code, Course Title, and Exam Date are required' });
    }

    const list = await readCsv<Examination>(CSV_FILES.EXAMINATIONS);

    const newExam: Examination = {
      id: String(Date.now()),
      semester: String(semester || 'S5').trim(),
      course_code: String(course_code).trim().toUpperCase(),
      course_title: String(course_title).trim(),
      exam_date: String(exam_date).trim(),
      session_time: String(session_time || '09:30 AM - 12:30 PM').trim(),
      hall_no: String(hall_no || 'Exam Hall 401').trim(),
      exam_centre: String(exam_centre || 'RSET Main Block').trim(),
    };

    list.push(newExam);
    await writeCsv(CSV_FILES.EXAMINATIONS, list);

    return res.status(201).json({
      message: 'Examination schedule added to examinations.csv',
      examination: newExam,
    });
  } catch (error: any) {
    console.error('Error creating examination:', error);
    return res.status(500).json({ error: 'Failed to create examination schedule in CSV' });
  }
};
router.post('/', createExaminationHandler);
router.post('/schedules', createExaminationHandler);

// PUT /api/examinations/:id (or /api/examinations/schedules/:id) - Admin update examination
const updateExaminationHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const list = await readCsv<Examination>(CSV_FILES.EXAMINATIONS);
    const index = list.findIndex((e) => e.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Examination record not found' });
    }

    const updated = { ...list[index], ...updates };
    list[index] = updated;
    await writeCsv(CSV_FILES.EXAMINATIONS, list);

    return res.json({
      message: 'Examination schedule updated in examinations.csv',
      examination: updated,
    });
  } catch (error: any) {
    console.error('Error updating examination:', error);
    return res.status(500).json({ error: 'Failed to update examination in CSV' });
  }
};
router.put('/:id', updateExaminationHandler);
router.put('/schedules/:id', updateExaminationHandler);

// DELETE /api/examinations/:id (or /api/examinations/schedules/:id) - Admin delete examination
const deleteExaminationHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteFromCsv<Examination>(CSV_FILES.EXAMINATIONS, (e) => e.id === id);

    if (deleted === 0) {
      return res.status(404).json({ error: 'Examination record not found' });
    }

    return res.json({ message: 'Examination schedule deleted from examinations.csv' });
  } catch (error: any) {
    console.error('Error deleting examination:', error);
    return res.status(500).json({ error: 'Failed to delete examination from CSV' });
  }
};
router.delete('/:id', deleteExaminationHandler);
router.delete('/schedules/:id', deleteExaminationHandler);

// GET /api/examinations/hall-ticket/:uid - Student official hall ticket data
router.get('/hall-ticket/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const targetUid = uid.toUpperCase();

    const [students, examsList, examSchedule] = await Promise.all([
      readCsv<Student>(CSV_FILES.STUDENTS),
      readCsv<ExamAllocation>(CSV_FILES.EXAMS),
      readCsv<Examination>(CSV_FILES.EXAMINATIONS),
    ]);

    const student = students.find((s) => s.uid.toUpperCase() === targetUid);
    if (!student) {
      return res.status(404).json({ error: 'Student not found for hall ticket generation' });
    }

    // Check specific allocations in exams.csv
    let allocatedExams = examsList.filter((e) => (e.student_uid || '').toUpperCase() === targetUid);

    // Fallback: If no custom allocations for this student yet, generate from examinations.csv for their semester
    if (allocatedExams.length === 0) {
      const semExams = examSchedule.filter((e) => e.semester.toLowerCase() === student.semester.toLowerCase());
      allocatedExams = semExams.map((e, idx) => ({
        student_uid: targetUid,
        exam_name: `B.Tech ${student.semester} Regular Examination 2026`,
        subject: `${e.course_title} (${e.course_code})`,
        exam_date: e.exam_date,
        exam_time: e.session_time,
        venue: e.exam_centre || 'RSET Main Academic Complex',
        room: e.hall_no || 'Hall 401',
        seat_no: `S-${10 + (idx % 30)}`,
      }));
    }

    const { password: _, ...safeStudent } = student;

    return res.json({
      institution: 'Rajagiri School of Engineering & Technology (Autonomous)',
      accreditation: 'NAAC A++ Accredited | Approved by AICTE, Affiliated to APJ Abdul Kalam Technological University',
      exam_title: `B.Tech Degree Examination - Autumn Semester 2026`,
      student: safeStudent,
      exams: allocatedExams.sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()),
      instructions: [
        'Candidates must be seated in the examination hall at least 15 minutes before the commencement of the exam.',
        'No candidate will be admitted without this Hall Ticket and the official Institutional Identity Card.',
        'Mobile phones, programmable calculators, smart watches, and unauthorized materials are strictly prohibited.',
        'Candidates are not permitted to leave the examination hall during the first 60 minutes.',
      ],
      generated_at: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    });
  } catch (error: any) {
    console.error('Error fetching hall ticket:', error);
    return res.status(500).json({ error: 'Failed to generate hall ticket' });
  }
});

export default router;
