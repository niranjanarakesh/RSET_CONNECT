import { Router, Request, Response } from 'express';
import { readCsv, CSV_FILES } from '../csv/csvService';
import { Student } from '../types';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password, role } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/UID and password are required' });
    }

    const trimmedIdentifier = String(identifier).trim();
    const trimmedPassword = String(password).trim();

    // 1. Check Admin Credentials
    if (
      (role === 'admin' || !role) &&
      trimmedIdentifier.toLowerCase() === 'admin'
    ) {
      if (trimmedPassword === 'admin123') {
        return res.json({
          role: 'admin',
          token: `token_admin_${Date.now()}`,
          user: {
            username: 'admin',
            name: 'Academic Administrator',
            role: 'admin',
            department: 'Deanery of Academics',
            email: 'admin@rajagiri.edu.in',
          },
        });
      } else {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }
    }

    // 2. Check Student Credentials
    const students = await readCsv<Student>(CSV_FILES.STUDENTS);
    const student = students.find((s) => {
      const matchUid = s.uid.toLowerCase() === trimmedIdentifier.toLowerCase();
      const matchEmail = s.email.toLowerCase() === trimmedIdentifier.toLowerCase();
      return matchUid || matchEmail;
    });

    if (!student) {
      return res.status(401).json({ error: 'Student not found with provided UID or Institutional Email' });
    }

    // Check student password (either stored password or demo default 'student123')
    if (student.password !== trimmedPassword && trimmedPassword !== 'student123') {
      return res.status(401).json({ error: 'Invalid password. (Demo password is student123)' });
    }

    const { password: _, ...safeStudent } = student;
    return res.json({
      role: 'student',
      token: `token_student_${student.uid}_${Date.now()}`,
      user: {
        ...safeStudent,
        role: 'student',
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header provided' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (token.startsWith('token_admin_')) {
    return res.json({
      role: 'admin',
      user: {
        username: 'admin',
        name: 'Academic Administrator',
        role: 'admin',
        department: 'Deanery of Academics',
        email: 'admin@rajagiri.edu.in',
      },
    });
  }

  if (token.startsWith('token_student_')) {
    const parts = token.split('_');
    const uid = parts[2];
    const students = await readCsv<Student>(CSV_FILES.STUDENTS);
    const student = students.find((s) => s.uid.toLowerCase() === uid.toLowerCase());
    if (student) {
      const { password: _, ...safeStudent } = student;
      return res.json({
        role: 'student',
        user: { ...safeStudent, role: 'student' },
      });
    }
  }

  return res.status(401).json({ error: 'Invalid or expired session' });
});

export default router;
