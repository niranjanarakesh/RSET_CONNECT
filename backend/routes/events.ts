import { Router, Request, Response } from 'express';
import { readCsv, writeCsv, deleteFromCsv, CSV_FILES } from '../csv/csvService';
import { EventItem } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    let list = await readCsv<EventItem>(CSV_FILES.EVENTS);

    if (category && category !== 'All') {
      list = list.filter((e) => e.category.toLowerCase() === String(category).toLowerCase());
    }

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q));
    }

    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return res.json(list);
  } catch (error: any) {
    console.error('Error getting events:', error);
    return res.status(500).json({ error: 'Failed to retrieve events' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, date, time, venue, description = '', category = 'Campus' } = req.body;

    if (!title || !date || !venue) {
      return res.status(400).json({ error: 'Title, Date, and Venue are required' });
    }

    const list = await readCsv<EventItem>(CSV_FILES.EVENTS);

    const newEvent: EventItem = {
      id: String(Date.now()),
      title: String(title).trim(),
      date: String(date).trim(),
      time: String(time || '10:00 AM').trim(),
      venue: String(venue).trim(),
      description: String(description).trim(),
      category: String(category).trim(),
    };

    list.push(newEvent);
    await writeCsv(CSV_FILES.EVENTS, list);

    return res.status(201).json({
      message: 'Event scheduled successfully in events.csv',
      event: newEvent,
    });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return res.status(500).json({ error: 'Failed to create event in CSV' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const list = await readCsv<EventItem>(CSV_FILES.EVENTS);
    const index = list.findIndex((e) => e.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const updated = { ...list[index], ...updates };
    list[index] = updated;
    await writeCsv(CSV_FILES.EVENTS, list);

    return res.json({
      message: 'Event updated successfully in events.csv',
      event: updated,
    });
  } catch (error: any) {
    console.error('Error updating event:', error);
    return res.status(500).json({ error: 'Failed to update event in CSV' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteFromCsv<EventItem>(CSV_FILES.EVENTS, (e) => e.id === id);

    if (deleted === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    return res.json({ message: 'Event deleted successfully from events.csv' });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    return res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
