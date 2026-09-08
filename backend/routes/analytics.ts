import { Router, Request, Response } from 'express';
import { readCsv, CSV_FILES } from '../csv/csvService';
import { Student, Attendance, Marks, Activity, Examination, Announcement } from '../types';

const router = Router();

router.get('/admin-dashboard', async (req: Request, res: Response) => {
  try {
    const [students, attendanceList, marksList, activities, examinations, announcements] =
      await Promise.all([
        readCsv<Student>(CSV_FILES.STUDENTS),
        readCsv<Attendance>(CSV_FILES.ATTENDANCE),
        readCsv<Marks>(CSV_FILES.MARKS),
        readCsv<Activity>(CSV_FILES.ACTIVITIES),
        readCsv<Examination>(CSV_FILES.EXAMINATIONS),
        readCsv<Announcement>(CSV_FILES.ANNOUNCEMENTS),
      ]);

    // Student attendance stats
    const studentAttendanceMap: Record<string, { present: number; total: number }> = {};
    attendanceList.forEach((a) => {
      const uid = (a.student_uid || '').toUpperCase();
      const present = (parseFloat(a.present_classes) || 0) + (parseFloat(a.duty_leave_classes) || 0);
      const total = parseFloat(a.total_classes) || 1;
      if (!studentAttendanceMap[uid]) {
        studentAttendanceMap[uid] = { present: 0, total: 0 };
      }
      studentAttendanceMap[uid].present += present;
      studentAttendanceMap[uid].total += total;
    });

    let totalAttendanceSum = 0;
    let studentsWithAttendance = 0;
    const below75Students: Array<{ uid: string; name: string; class: string; percentage: number }> = [];

    students.forEach((s) => {
      const att = studentAttendanceMap[s.uid.toUpperCase()];
      if (att && att.total > 0) {
        const pct = (att.present / att.total) * 100;
        totalAttendanceSum += pct;
        studentsWithAttendance++;
        if (pct < 75) {
          below75Students.push({
            uid: s.uid,
            name: s.name,
            class: s.class,
            percentage: parseFloat(pct.toFixed(1)),
          });
        }
      }
    });

    const averageAttendance =
      studentsWithAttendance > 0 ? parseFloat((totalAttendanceSum / studentsWithAttendance).toFixed(1)) : 85.0;

    // Internal marks average
    let totalMarksObtained = 0;
    let totalMaxMarks = 0;
    marksList.forEach((m) => {
      const obt =
        (parseFloat(m.internal1) || 0) +
        (parseFloat(m.internal2) || 0) +
        (parseFloat(m.assignment) || 0) +
        (parseFloat(m.project) || 0);
      const max =
        (parseFloat(m.max_internal1) || 30) +
        (parseFloat(m.max_internal2) || 30) +
        (parseFloat(m.max_assignment) || 10) +
        (parseFloat(m.max_project) || 10);
      totalMarksObtained += obt;
      totalMaxMarks += max;
    });

    const averageMarksPct =
      totalMaxMarks > 0 ? parseFloat(((totalMarksObtained / totalMaxMarks) * 100).toFixed(1)) : 80.0;

    // Pending activities
    const pendingActivitiesCount = activities.filter((a) => a.status === 'Pending').length;

    // Upcoming exams
    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingExams = examinations
      .filter((e) => e.exam_date >= todayStr)
      .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime());

    return res.json({
      total_students: students.length,
      average_attendance: averageAttendance,
      below_75_count: below75Students.length,
      below_75_students: below75Students,
      average_marks_percentage: averageMarksPct,
      pending_activities_count: pendingActivitiesCount,
      upcoming_examinations_count: upcomingExams.length,
      upcoming_examinations: upcomingExams.slice(0, 5),
      recent_announcements: announcements.slice(0, 4),
      department_breakdown: [
        { name: 'CSE', count: students.filter((s) => s.department.includes('Computer')).length },
        { name: 'ECE', count: students.filter((s) => s.department.includes('Electronics')).length },
        { name: 'ME', count: students.filter((s) => s.department.includes('Mechanical')).length },
        { name: 'IT', count: students.filter((s) => s.department.includes('Information')).length },
      ],
    });
  } catch (error: any) {
    console.error('Error fetching admin dashboard analytics:', error);
    return res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
});

export default router;
