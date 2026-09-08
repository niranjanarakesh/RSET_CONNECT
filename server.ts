import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { initCsvFiles } from './backend/csv/csvService';

// Routers
import authRouter from './backend/routes/auth';
import studentsRouter from './backend/routes/students';
import subjectsRouter from './backend/routes/subjects';
import attendanceRouter from './backend/routes/attendance';
import marksRouter from './backend/routes/marks';
import activitiesRouter from './backend/routes/activities';
import feedbackRouter from './backend/routes/feedback';
import announcementsRouter from './backend/routes/announcements';
import eventsRouter from './backend/routes/events';
import timetableRouter from './backend/routes/timetable';
import busesRouter from './backend/routes/buses';
import examinationsRouter from './backend/routes/examinations';
import resultsRouter from './backend/routes/results';
import uploadRouter from './backend/routes/upload';
import analyticsRouter from './backend/routes/analytics';

dotenv.config();

async function startServer() {
  // 1. Initialize persistent CSV files with realistic demo data
  try {
    await initCsvFiles();
  } catch (initErr) {
    console.error('Warning during CSV initialization:', initErr);
  }

  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static uploads serving
  const uploadsPath = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  // 2. Register API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/students', studentsRouter);
  app.use('/api/subjects', subjectsRouter);
  app.use('/api/attendance', attendanceRouter);
  app.use('/api/marks', marksRouter);
  app.use('/api/activities', activitiesRouter);
  app.use('/api/feedback', feedbackRouter);
  app.use('/api/announcements', announcementsRouter);
  app.use('/api/events', eventsRouter);
  app.use('/api/timetable', timetableRouter);
  app.use('/api/buses', busesRouter);
  app.use('/api/examinations', examinationsRouter);
  app.use('/api/results', resultsRouter);
  app.use('/api/upload', uploadRouter);
  app.use('/api/analytics', analyticsRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'RSMS Connect (CSV Backend)',
      database: 'CSV Storage (No SQL / No SQLite)',
      timestamp: new Date().toISOString(),
    });
  });

  // Catch-all 404 for unknown /api/* requests - always returns JSON, never index.html
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      error: `API route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // 3. Vite middleware for frontend development / production static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('==================================================');
    console.log('RSMS Connect Server is running');
    console.log(`Local: http://localhost:${PORT}`);
    console.log('Persistence: CSV Files in ./data/');
    console.log('==================================================');
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting RSMS Connect server:', err);
  process.exit(1);
});
