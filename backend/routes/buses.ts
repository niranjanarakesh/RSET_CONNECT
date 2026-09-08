import { Router, Request, Response } from 'express';
import { readCsv, writeCsv, deleteFromCsv, CSV_FILES } from '../csv/csvService';
import { Bus } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const list = await readCsv<Bus>(CSV_FILES.BUSES);
    return res.json(list);
  } catch (error: any) {
    console.error('Error fetching buses:', error);
    return res.status(500).json({ error: 'Failed to retrieve bus tracking data' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { bus_no, route_name, stops, current_stop, status = 'On Time', driver_name, driver_phone } = req.body;

    if (!bus_no || !route_name) {
      return res.status(400).json({ error: 'Bus Number and Route Name are required' });
    }

    const list = await readCsv<Bus>(CSV_FILES.BUSES);

    const newBus: Bus = {
      id: String(Date.now()),
      bus_no: String(bus_no).trim(),
      route_name: String(route_name).trim(),
      stops: String(stops || '').trim(),
      current_stop: String(current_stop || 'At Campus').trim(),
      status: status as any,
      driver_name: String(driver_name || 'Assigned Driver').trim(),
      driver_phone: String(driver_phone || '+91 94470 00000').trim(),
    };

    list.push(newBus);
    await writeCsv(CSV_FILES.BUSES, list);

    return res.status(201).json({
      message: 'Bus transit record created successfully in buses.csv',
      bus: newBus,
    });
  } catch (error: any) {
    console.error('Error creating bus record:', error);
    return res.status(500).json({ error: 'Failed to create bus in CSV' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const list = await readCsv<Bus>(CSV_FILES.BUSES);
    const index = list.findIndex((b) => b.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    const updated: Bus = { ...list[index], ...updates };
    list[index] = updated;
    await writeCsv(CSV_FILES.BUSES, list);

    return res.json({
      message: 'Bus details and transit status updated in buses.csv',
      bus: updated,
    });
  } catch (error: any) {
    console.error('Error updating bus:', error);
    return res.status(500).json({ error: 'Failed to update bus in CSV' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteFromCsv<Bus>(CSV_FILES.BUSES, (b) => b.id === id);

    if (deleted === 0) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    return res.json({ message: 'Bus removed successfully from buses.csv' });
  } catch (error: any) {
    console.error('Error deleting bus:', error);
    return res.status(500).json({ error: 'Failed to delete bus record' });
  }
});

export default router;
