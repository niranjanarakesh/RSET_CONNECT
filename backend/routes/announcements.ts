import { Router, Request, Response } from 'express';
import { readCsv, writeCsv, deleteFromCsv, CSV_FILES } from '../csv/csvService';
import { Announcement } from '../types';

const router = Router();

// GET /api/announcements - List announcements with search & category filter
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, category } = req.query;
    let list = await readCsv<Announcement>(CSV_FILES.ANNOUNCEMENTS);

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q) || a.message.toLowerCase().includes(q));
    }

    if (category && category !== 'All') {
      list = list.filter((a) => a.category.toLowerCase() === String(category).toLowerCase());
    }

    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return res.json(list);
  } catch (error: any) {
    console.error('Error getting announcements:', error);
    return res.status(500).json({ error: 'Failed to retrieve announcements' });
  }
});

// POST /api/announcements - Admin create announcement
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, message, category = 'General', author = 'Administration', date } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and Message are required' });
    }

    const list = await readCsv<Announcement>(CSV_FILES.ANNOUNCEMENTS);

    const newAnnouncement: Announcement = {
      id: String(Date.now()),
      title: String(title).trim(),
      message: String(message).trim(),
      date: String(date || new Date().toISOString().split('T')[0]).trim(),
      category: String(category).trim(),
      author: String(author).trim(),
    };

    list.unshift(newAnnouncement);
    await writeCsv(CSV_FILES.ANNOUNCEMENTS, list);

    return res.status(201).json({
      message: 'Announcement published successfully to announcements.csv',
      announcement: newAnnouncement,
    });
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    return res.status(500).json({ error: 'Failed to create announcement in CSV' });
  }
});

// PUT /api/announcements/:id - Admin edit announcement
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, message, category, author, date } = req.body;

    const list = await readCsv<Announcement>(CSV_FILES.ANNOUNCEMENTS);
    const index = list.findIndex((a) => a.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const current = list[index];
    const updated: Announcement = {
      ...current,
      title: title !== undefined ? String(title).trim() : current.title,
      message: message !== undefined ? String(message).trim() : current.message,
      category: category !== undefined ? String(category).trim() : current.category,
      author: author !== undefined ? String(author).trim() : current.author,
      date: date !== undefined ? String(date).trim() : current.date,
    };

    list[index] = updated;
    await writeCsv(CSV_FILES.ANNOUNCEMENTS, list);

    return res.json({
      message: 'Announcement updated successfully in announcements.csv',
      announcement: updated,
    });
  } catch (error: any) {
    console.error('Error updating announcement:', error);
    return res.status(500).json({ error: 'Failed to update announcement in CSV' });
  }
});

// DELETE /api/announcements/:id - Admin delete announcement
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteFromCsv<Announcement>(CSV_FILES.ANNOUNCEMENTS, (a) => a.id === id);

    if (deleted === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    return res.json({ message: 'Announcement deleted successfully from announcements.csv' });
  } catch (error: any) {
    console.error('Error deleting announcement:', error);
    return res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

export default router;
