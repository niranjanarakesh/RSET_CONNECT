import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import {
  SEED_STUDENTS,
  SEED_SUBJECTS,
  SEED_ATTENDANCE,
  SEED_ATTENDANCE_RECORDS,
  SEED_MARKS,
  SEED_ACTIVITIES,
  SEED_FEEDBACK,
  SEED_ANNOUNCEMENTS,
  SEED_EVENTS,
  SEED_TIMETABLE,
  SEED_BUSES,
  SEED_EXAMINATIONS,
  SEED_EXAMS,
  SEED_END_SEMESTER_RESULTS,
} from './seedData';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export const CSV_FILES = {
  STUDENTS: 'students.csv',
  SUBJECTS: 'subjects.csv',
  ATTENDANCE: 'attendance.csv',
  ATTENDANCE_RECORDS: 'attendance_records.csv',
  MARKS: 'marks.csv',
  ACTIVITIES: 'activities.csv',
  FEEDBACK: 'feedback.csv',
  ANNOUNCEMENTS: 'announcements.csv',
  EVENTS: 'events.csv',
  TIMETABLE: 'timetable.csv',
  BUSES: 'buses.csv',
  EXAMINATIONS: 'examinations.csv',
  EXAMS: 'exams.csv',
  END_SEMESTER_RESULTS: 'end_semester_results.csv',
};

const FILE_HEADERS: Record<string, string[]> = {
  [CSV_FILES.STUDENTS]: [
    'id', 'uid', 'password', 'name', 'class', 'email', 'phone', 'gender',
    'department', 'semester', 'cgpa', 'completed_credits', 'photo', 'signature'
  ],
  [CSV_FILES.SUBJECTS]: ['id', 'code', 'name', 'teacher', 'semester', 'credits'],
  [CSV_FILES.ATTENDANCE]: [
    'student_uid', 'subject_id', 'present_classes', 'total_classes',
    'absent_classes', 'duty_leave_classes', 'last_updated'
  ],
  [CSV_FILES.ATTENDANCE_RECORDS]: [
    'id', 'student_uid', 'subject_id', 'class', 'semester', 'date', 'period', 'status'
  ],
  [CSV_FILES.MARKS]: [
    'student_uid', 'subject_id', 'internal1', 'internal2', 'assignment', 'project',
    'max_internal1', 'max_internal2', 'max_assignment', 'max_project'
  ],
  [CSV_FILES.ACTIVITIES]: [
    'id', 'student_uid', 'semester', 'category', 'title', 'description',
    'certificate_url', 'points', 'requested_points', 'status', 'remarks', 'submitted_at'
  ],
  [CSV_FILES.FEEDBACK]: [
    'id', 'teacher', 'subject', 'subject_code', 'semester', 'academic_year',
    'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10',
    'score', 'comments', 'submitted_at'
  ],
  [CSV_FILES.ANNOUNCEMENTS]: ['id', 'title', 'message', 'date', 'category', 'author'],
  [CSV_FILES.EVENTS]: ['id', 'title', 'date', 'time', 'venue', 'description', 'category'],
  [CSV_FILES.TIMETABLE]: ['id', 'day', 'time', 'subject', 'room', 'teacher', 'class'],
  [CSV_FILES.BUSES]: ['id', 'bus_no', 'route_name', 'stops', 'current_stop', 'status', 'driver_name', 'driver_phone'],
  [CSV_FILES.EXAMINATIONS]: ['id', 'semester', 'course_code', 'course_title', 'exam_date', 'session_time', 'hall_no', 'exam_centre'],
  [CSV_FILES.EXAMS]: ['student_uid', 'exam_name', 'subject', 'exam_date', 'exam_time', 'venue', 'room', 'seat_no'],
  [CSV_FILES.END_SEMESTER_RESULTS]: [
    'student_uid', 'semester', 'academic_year', 'course_code', 'course_title',
    'credits', 'grade', 'grade_point', 'max_marks', 'marks_obtained', 'result_status', 'published_date'
  ],
};

/**
 * Ensures data and uploads directories exist.
 */
export async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

/**
 * Reads and parses a CSV file into typed objects.
 */
export async function readCsv<T>(fileName: string): Promise<T[]> {
  await ensureDirs();
  const filePath = path.join(DATA_DIR, fileName);
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    if (!fileContent.trim()) {
      return [];
    }
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    return records as T[];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error(`Error reading CSV ${fileName}:`, error);
    throw error;
  }
}

/**
 * Writes array of records to CSV safely using atomic rename.
 */
export async function writeCsv<T extends Record<string, any>>(
  fileName: string,
  rows: T[],
  customHeaders?: string[]
): Promise<void> {
  await ensureDirs();
  const filePath = path.join(DATA_DIR, fileName);
  const tempPath = path.join(DATA_DIR, `.tmp_${fileName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  const headers = customHeaders || FILE_HEADERS[fileName] || (rows.length > 0 ? Object.keys(rows[0]) : []);

  const output = stringify(rows, {
    header: true,
    columns: headers,
    quoted_string: true,
  });

  // Write to temporary file first
  await fs.writeFile(tempPath, output, 'utf-8');
  // Atomic rename to target file to eliminate corruption risks
  await fs.rename(tempPath, filePath);
}

/**
 * Appends a record to CSV file.
 */
export async function appendCsv<T extends Record<string, any>>(fileName: string, row: T): Promise<void> {
  const existing = await readCsv<T>(fileName);
  existing.push(row);
  await writeCsv(fileName, existing);
}

/**
 * Updates matching records in CSV.
 */
export async function updateCsv<T extends Record<string, any>>(
  fileName: string,
  predicate: (item: T) => boolean,
  updates: Partial<T> | ((item: T) => T)
): Promise<number> {
  const records = await readCsv<T>(fileName);
  let updatedCount = 0;

  const modified = records.map((item) => {
    if (predicate(item)) {
      updatedCount++;
      if (typeof updates === 'function') {
        return updates(item);
      }
      return { ...item, ...updates };
    }
    return item;
  });

  await writeCsv(fileName, modified);
  return updatedCount;
}

/**
 * Deletes matching records from CSV.
 */
export async function deleteFromCsv<T extends Record<string, any>>(
  fileName: string,
  predicate: (item: T) => boolean
): Promise<number> {
  const records = await readCsv<T>(fileName);
  const initialLength = records.length;
  const filtered = records.filter((item) => !predicate(item));
  const deletedCount = initialLength - filtered.length;

  await writeCsv(fileName, filtered);
  return deletedCount;
}

/**
 * Automatically initializes CSV files with seed data if they do not exist.
 */
export async function initCsvFiles() {
  await ensureDirs();

  const fileSeedMap: Array<{ file: string; data: any[] }> = [
    { file: CSV_FILES.STUDENTS, data: SEED_STUDENTS },
    { file: CSV_FILES.SUBJECTS, data: SEED_SUBJECTS },
    { file: CSV_FILES.ATTENDANCE, data: SEED_ATTENDANCE },
    { file: CSV_FILES.ATTENDANCE_RECORDS, data: SEED_ATTENDANCE_RECORDS },
    { file: CSV_FILES.MARKS, data: SEED_MARKS },
    { file: CSV_FILES.ACTIVITIES, data: SEED_ACTIVITIES },
    { file: CSV_FILES.FEEDBACK, data: SEED_FEEDBACK },
    { file: CSV_FILES.ANNOUNCEMENTS, data: SEED_ANNOUNCEMENTS },
    { file: CSV_FILES.EVENTS, data: SEED_EVENTS },
    { file: CSV_FILES.TIMETABLE, data: SEED_TIMETABLE },
    { file: CSV_FILES.BUSES, data: SEED_BUSES },
    { file: CSV_FILES.EXAMINATIONS, data: SEED_EXAMINATIONS },
    { file: CSV_FILES.EXAMS, data: SEED_EXAMS },
    { file: CSV_FILES.END_SEMESTER_RESULTS, data: SEED_END_SEMESTER_RESULTS },
  ];

  for (const item of fileSeedMap) {
    const filePath = path.join(DATA_DIR, item.file);
    try {
      await fs.access(filePath);
      const existing = await readCsv(item.file);
      if (existing.length === 0 && item.data.length > 0) {
        console.log(`Seeding empty CSV: ${item.file}`);
        await writeCsv(item.file, item.data);
      }
    } catch {
      console.log(`Creating and seeding CSV: ${item.file}`);
      await writeCsv(item.file, item.data);
    }
  }

  console.log('All RSMS Connect CSV files checked/initialized successfully.');
}
