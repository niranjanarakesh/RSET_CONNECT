import { Router, Request, Response } from 'express';
import { readCsv, writeCsv, deleteFromCsv, CSV_FILES } from '../csv/csvService';
import { TimetableEntry } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { class: className, day } = req.query;
    let list = await readCsv<TimetableEntry>(CSV_FILES.TIMETABLE);

    if (className) {
      list = list.filter((t) => t.class.toLowerCase() === String(className).toLowerCase());
    }

    if (day && day !== 'All') {
      list = list.filter((t) => t.day.toLowerCase() === String(day).toLowerCase());
    }

    const dayOrder: Record<string, number> = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    list.sort((a, b) => {
      const dayDiff = (dayOrder[a.day.toLowerCase()] || 7) - (dayOrder[b.day.toLowerCase()] || 7);
      if (dayDiff !== 0) return dayDiff;
      return a.time.localeCompare(b.time);
    });

    return res.json(list);
  } catch (error: any) {
    console.error('Error fetching timetable:', error);
    return res.status(500).json({ error: 'Failed to retrieve timetable' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { day, time, subject, room, teacher, class: className } = req.body;

    if (!day || !time || !subject || !className) {
      return res.status(400).json({ error: 'Day, Time, Subject, and Class are required' });
    }

    const list = await readCsv<TimetableEntry>(CSV_FILES.TIMETABLE);

    const newEntry: TimetableEntry = {
      id: String(Date.now()),
      day: String(day).trim(),
      time: String(time).trim(),
      subject: String(subject).trim(),
      room: String(room || 'N/A').trim(),
      teacher: String(teacher || 'Faculty').trim(),
      class: String(className).trim(),
    };

    list.push(newEntry);
    await writeCsv(CSV_FILES.TIMETABLE, list);

    return res.status(201).json({
      message: 'Timetable entry added successfully to timetable.csv',
      entry: newEntry,
    });
  } catch (error: any) {
    console.error('Error adding timetable entry:', error);
    return res.status(500).json({ error: 'Failed to add timetable entry to CSV' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const list = await readCsv<TimetableEntry>(CSV_FILES.TIMETABLE);
    const index = list.findIndex((t) => t.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Timetable slot not found' });
    }

    const updated = { ...list[index], ...updates };
    list[index] = updated;
    await writeCsv(CSV_FILES.TIMETABLE, list);

    return res.json({
      message: 'Timetable slot updated successfully in timetable.csv',
      entry: updated,
    });
  } catch (error: any) {
    console.error('Error updating timetable:', error);
    return res.status(500).json({ error: 'Failed to update timetable in CSV' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteFromCsv<TimetableEntry>(CSV_FILES.TIMETABLE, (t) => t.id === id);

    if (deleted === 0) {
      return res.status(404).json({ error: 'Timetable slot not found' });
    }

    return res.json({ message: 'Timetable slot removed successfully from timetable.csv' });
  } catch (error: any) {
    console.error('Error deleting timetable:', error);
    return res.status(500).json({ error: 'Failed to delete timetable entry' });
  }
});

export default router;
