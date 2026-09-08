import { Router, Request, Response } from 'express';
import { readCsv, CSV_FILES } from '../csv/csvService';
import { Subject } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { semester } = req.query;
    let subjects = await readCsv<Subject>(CSV_FILES.SUBJECTS);
    if (semester) {
      subjects = subjects.filter((s) => s.semester.toLowerCase() === String(semester).toLowerCase());
    }
    return res.json(subjects);
  } catch (error: any) {
    console.error('Error fetching subjects:', error);
    return res.status(500).json({ error: 'Failed to retrieve subjects' });
  }
});

export default router;
