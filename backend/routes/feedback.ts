import { Router, Request, Response } from 'express';
import { readCsv, writeCsv, CSV_FILES } from '../csv/csvService';
import { Feedback } from '../types';

const router = Router();

// GET /api/feedback/export & /api/feedback/export/csv - Export feedback as CSV
router.get(['/export', '/export/csv'], async (req: Request, res: Response) => {
  try {
    const list = await readCsv<Feedback>(CSV_FILES.FEEDBACK);
    const headers = [
      'id',
      'teacher',
      'subject',
      'subject_code',
      'semester',
      'academic_year',
      'score',
      'comments',
      'submitted_at',
    ];

    let csvContent = headers.join(',') + '\n';
    list.forEach((f) => {
      const row = [
        `"${f.id || ''}"`,
        `"${(f.teacher || '').replace(/"/g, '""')}"`,
        `"${(f.subject || '').replace(/"/g, '""')}"`,
        `"${(f.subject_code || '').replace(/"/g, '""')}"`,
        `"${f.semester || ''}"`,
        `"${f.academic_year || ''}"`,
        `"${f.score || ''}"`,
        `"${(f.comments || '').replace(/"/g, '""')}"`,
        `"${f.submitted_at || ''}"`,
      ];
      csvContent += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="feedback_export_${Date.now()}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error: any) {
    console.error('Error exporting feedback:', error);
    return res.status(500).json({ error: 'Failed to export feedback CSV' });
  }
});

// GET /api/feedback - Feedback list and analytics
router.get('/', async (req: Request, res: Response) => {
  try {
    const { teacher, subject_code, semester } = req.query;
    let list = await readCsv<Feedback>(CSV_FILES.FEEDBACK);

    if (teacher) {
      list = list.filter((f) => f.teacher.toLowerCase().includes(String(teacher).toLowerCase()));
    }
    if (subject_code) {
      list = list.filter((f) => f.subject_code.toLowerCase() === String(subject_code).toLowerCase());
    }
    if (semester) {
      list = list.filter((f) => f.semester.toLowerCase() === String(semester).toLowerCase());
    }

    // Analytics computation
    let totalScoreSum = 0;
    const teacherMap: Record<string, { count: number; totalScore: number }> = {};
    const subjectMap: Record<string, { count: number; totalScore: number; name: string; teacher: string }> = {};
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    list.forEach((f) => {
      const score = parseFloat(f.score || '0') || 0;
      totalScoreSum += score;

      // Teacher stats
      if (!teacherMap[f.teacher]) {
        teacherMap[f.teacher] = { count: 0, totalScore: 0 };
      }
      teacherMap[f.teacher].count++;
      teacherMap[f.teacher].totalScore += score;

      // Subject stats
      if (!subjectMap[f.subject_code]) {
        subjectMap[f.subject_code] = { count: 0, totalScore: 0, name: f.subject, teacher: f.teacher };
      }
      subjectMap[f.subject_code].count++;
      subjectMap[f.subject_code].totalScore += score;

      // Distribution across questions
      for (let i = 1; i <= 10; i++) {
        const qVal = parseInt((f as any)[`q${i}`] || '0', 10);
        if (qVal >= 1 && qVal <= 5) {
          ratingDistribution[qVal] = (ratingDistribution[qVal] || 0) + 1;
        }
      }
    });

    const averageOverall = list.length > 0 ? parseFloat((totalScoreSum / list.length).toFixed(2)) : 0;

    const teacherAnalytics = Object.entries(teacherMap).map(([name, data]) => ({
      teacher: name,
      responses: data.count,
      average_score: parseFloat((data.totalScore / data.count).toFixed(2)),
    }));

    const subjectAnalytics = Object.entries(subjectMap).map(([code, data]) => ({
      code,
      name: data.name,
      teacher: data.teacher,
      responses: data.count,
      average_score: parseFloat((data.totalScore / data.count).toFixed(2)),
    }));

    return res.json({
      total_responses: list.length,
      average_score: averageOverall,
      rating_distribution: ratingDistribution,
      teacher_analytics: teacherAnalytics,
      subject_analytics: subjectAnalytics,
      feedback_records: list.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()),
    });
  } catch (error: any) {
    console.error('Error fetching feedback:', error);
    return res.status(500).json({ error: 'Failed to retrieve feedback data' });
  }
});

// POST /api/feedback - Submit new feedback
router.post('/', async (req: Request, res: Response) => {
  try {
    const teacher = String(req.body.teacher || '').trim();
    const subject = String(req.body.subject || req.body.subject_name || req.body.subject_id || '').trim();
    const subject_code = String(req.body.subject_code || req.body.subject_id || req.body.code || '').trim();
    const semester = String(req.body.semester || 'S5').trim();
    const academic_year = String(req.body.academic_year || '2026-27').trim();
    const comments = String(req.body.comments || '').trim();

    if (!teacher || (!subject && !subject_code)) {
      return res.status(400).json({ error: 'Teacher and Subject are required' });
    }

    let finalScore = '4.50';
    if (req.body.score && !isNaN(parseFloat(req.body.score))) {
      finalScore = parseFloat(req.body.score).toFixed(2);
    } else {
      const { q1, q2, q3, q4, q5, q6, q7, q8, q9, q10 } = req.body;
      const questions = [q1, q2, q3, q4, q5, q6, q7, q8, q9, q10].map((v) => parseInt(String(v || '5'), 10));
      finalScore = (questions.reduce((a, b) => a + b, 0) / questions.length).toFixed(2);
    }

    const { q1 = '5', q2 = '5', q3 = '5', q4 = '5', q5 = '5', q6 = '5', q7 = '5', q8 = '5', q9 = '5', q10 = '5' } = req.body;

    const feedbackList = await readCsv<Feedback>(CSV_FILES.FEEDBACK);

    const newFeedback: Feedback = {
      id: String(Date.now()),
      teacher,
      subject: subject || subject_code,
      subject_code: subject_code || subject,
      semester,
      academic_year,
      q1: String(q1),
      q2: String(q2),
      q3: String(q3),
      q4: String(q4),
      q5: String(q5),
      q6: String(q6),
      q7: String(q7),
      q8: String(q8),
      q9: String(q9),
      q10: String(q10),
      score: finalScore,
      comments,
      submitted_at: new Date().toISOString().split('T')[0],
    };

    feedbackList.push(newFeedback);
    await writeCsv(CSV_FILES.FEEDBACK, feedbackList);

    return res.status(201).json({
      message: 'Course and faculty feedback submitted successfully',
      feedback: newFeedback,
    });
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    return res.status(500).json({ error: 'Failed to record feedback to CSV' });
  }
});

export default router;
