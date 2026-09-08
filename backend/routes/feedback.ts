import { Router, Request, Response } from 'express';
import { readCsv, writeCsv, CSV_FILES } from '../csv/csvService';
import { Feedback } from '../types';

const router = Router();

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
    const {
      teacher,
      subject,
      subject_code,
      semester = 'S5',
      academic_year = '2026-27',
      q1, q2, q3, q4, q5, q6, q7, q8, q9, q10,
      comments = '',
    } = req.body;

    if (!teacher || !subject || !subject_code) {
      return res.status(400).json({ error: 'Teacher, Subject, and Subject Code are required' });
    }

    const questions = [q1, q2, q3, q4, q5, q6, q7, q8, q9, q10].map((v) => parseInt(String(v || '5'), 10));
    const avgScore = questions.reduce((a, b) => a + b, 0) / questions.length;

    const feedbackList = await readCsv<Feedback>(CSV_FILES.FEEDBACK);

    const newFeedback: Feedback = {
      id: String(Date.now()),
      teacher: String(teacher).trim(),
      subject: String(subject).trim(),
      subject_code: String(subject_code).trim(),
      semester: String(semester).trim(),
      academic_year: String(academic_year).trim(),
      q1: String(questions[0]),
      q2: String(questions[1]),
      q3: String(questions[2]),
      q4: String(questions[3]),
      q5: String(questions[4]),
      q6: String(questions[5]),
      q7: String(questions[6]),
      q8: String(questions[7]),
      q9: String(questions[8]),
      q10: String(questions[9]),
      score: avgScore.toFixed(2),
      comments: String(comments).trim(),
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
