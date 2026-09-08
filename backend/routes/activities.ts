import { Router, Request, Response } from 'express';
import { readCsv, writeCsv, CSV_FILES } from '../csv/csvService';
import { Activity } from '../types';

const router = Router();

// GET /api/activities/student/:uid - Get activities for specific student
router.get('/student/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const targetUid = uid.toUpperCase();

    const activities = await readCsv<Activity>(CSV_FILES.ACTIVITIES);
    const studentActivities = activities
      .filter((a) => (a.student_uid || '').toUpperCase() === targetUid)
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

    let approvedPoints = 0;
    let pendingPoints = 0;
    let rejectedCount = 0;

    studentActivities.forEach((a) => {
      const pts = parseFloat(a.points || '0') || 0;
      const reqPts = parseFloat(a.requested_points || '0') || 0;

      if (a.status === 'Approved') {
        approvedPoints += pts;
      } else if (a.status === 'Pending') {
        pendingPoints += reqPts;
      } else if (a.status === 'Rejected') {
        rejectedCount++;
      }
    });

    return res.json({
      student_uid: targetUid,
      summary: {
        total_approved_points: approvedPoints,
        total_pending_points: pendingPoints,
        rejected_count: rejectedCount,
        total_submissions: studentActivities.length,
      },
      activities: studentActivities,
    });
  } catch (error: any) {
    console.error('Error fetching student activities:', error);
    return res.status(500).json({ error: 'Failed to retrieve activities' });
  }
});

// GET /api/activities - Admin list all activities with status and search filter
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, student_uid, category } = req.query;
    let activities = await readCsv<Activity>(CSV_FILES.ACTIVITIES);

    if (status) {
      activities = activities.filter((a) => a.status.toLowerCase() === String(status).toLowerCase());
    }

    if (student_uid) {
      activities = activities.filter((a) => (a.student_uid || '').toUpperCase() === String(student_uid).toUpperCase());
    }

    if (category) {
      activities = activities.filter((a) => a.category.toLowerCase() === String(category).toLowerCase());
    }

    activities.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
    return res.json(activities);
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    return res.status(500).json({ error: 'Failed to retrieve activities list' });
  }
});

// POST /api/activities - Student submits new activity
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      student_uid,
      semester,
      category,
      title,
      description,
      certificate_url,
      requested_points,
    } = req.body;

    if (!student_uid || !title || !category || !requested_points) {
      return res.status(400).json({ error: 'Student UID, Title, Category, and Requested Points are required' });
    }

    const pointsNum = parseFloat(String(requested_points));
    if (isNaN(pointsNum) || pointsNum <= 0) {
      return res.status(400).json({ error: 'Requested points must be a positive number' });
    }

    const activities = await readCsv<Activity>(CSV_FILES.ACTIVITIES);

    const newActivity: Activity = {
      id: String(Date.now()),
      student_uid: String(student_uid).trim().toUpperCase(),
      semester: String(semester || 'S5').trim(),
      category: String(category).trim(),
      title: String(title).trim(),
      description: String(description || '').trim(),
      certificate_url: String(certificate_url || '').trim(),
      points: '0',
      requested_points: String(pointsNum),
      status: 'Pending',
      remarks: '',
      submitted_at: new Date().toISOString().split('T')[0],
    };

    activities.push(newActivity);
    await writeCsv(CSV_FILES.ACTIVITIES, activities);

    return res.status(201).json({
      message: 'Activity claim submitted successfully for faculty advisor approval',
      activity: newActivity,
    });
  } catch (error: any) {
    console.error('Error submitting activity:', error);
    return res.status(500).json({ error: 'Failed to submit activity to CSV' });
  }
});

// PUT /api/activities/:id - Admin approves or rejects activity
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, points, remarks } = req.body;

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ error: 'Status must be Approved, Rejected, or Pending' });
    }

    const activities = await readCsv<Activity>(CSV_FILES.ACTIVITIES);
    const index = activities.findIndex((a) => a.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Activity record not found' });
    }

    const current = activities[index];
    const finalPoints = status === 'Approved' ? String(points ?? current.requested_points) : '0';

    const updated: Activity = {
      ...current,
      status,
      points: finalPoints,
      remarks: String(remarks ?? current.remarks).trim(),
    };

    activities[index] = updated;
    await writeCsv(CSV_FILES.ACTIVITIES, activities);

    return res.json({
      message: `Activity ${status.toLowerCase()} successfully in activities.csv`,
      activity: updated,
    });
  } catch (error: any) {
    console.error('Error updating activity status:', error);
    return res.status(500).json({ error: 'Failed to update activity in CSV' });
  }
});

export default router;
