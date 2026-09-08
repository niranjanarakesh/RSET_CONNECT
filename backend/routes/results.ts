import { Router, Request, Response } from 'express';
import { parse } from 'csv-parse/sync';
import { readCsv, writeCsv, deleteFromCsv, CSV_FILES } from '../csv/csvService';
import { EndSemesterResult, Student } from '../types';

const router = Router();

const REQUIRED_COLUMNS = [
  'student_uid',
  'semester',
  'academic_year',
  'course_code',
  'course_title',
  'credits',
  'grade',
  'grade_point',
  'max_marks',
  'marks_obtained',
  'result_status',
  'published_date',
];

// GET /api/results/student/:uid - Get student's end-semester results with SGPA & CGPA
router.get('/student/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { semester, academic_year } = req.query;
    const targetUid = uid.toUpperCase();

    const [allResults, students] = await Promise.all([
      readCsv<EndSemesterResult>(CSV_FILES.END_SEMESTER_RESULTS),
      readCsv<Student>(CSV_FILES.STUDENTS),
    ]);

    const student = students.find((s) => s.uid.toUpperCase() === targetUid);
    const studentResults = allResults.filter((r) => (r.student_uid || '').toUpperCase() === targetUid);

    // Filter by semester if selected
    let activeSemester = semester ? String(semester).trim() : '';
    if (!activeSemester && studentResults.length > 0) {
      // Pick latest available semester with results
      const semestersPresent = Array.from(new Set(studentResults.map((r) => r.semester))).sort();
      activeSemester = semestersPresent[semestersPresent.length - 1] || 'S4';
    }

    let semesterCourses = studentResults.filter(
      (r) => (r.semester || '').toLowerCase() === activeSemester.toLowerCase()
    );

    if (academic_year) {
      semesterCourses = semesterCourses.filter(
        (r) => (r.academic_year || '').toLowerCase() === String(academic_year).toLowerCase()
      );
    }

    // Calculate SGPA for active semester
    let sumCreditGradePoints = 0;
    let sumCredits = 0;
    let earnedCredits = 0;
    let hasFailedCourse = false;
    let hasSupplementary = false;

    semesterCourses.forEach((c) => {
      const cr = parseFloat(c.credits || '0') || 0;
      const gp = parseFloat(c.grade_point || '0') || 0;
      sumCredits += cr;
      sumCreditGradePoints += cr * gp;

      const isPass = c.result_status === 'PASS' && c.grade !== 'F' && c.grade !== 'FE' && c.grade !== 'I';
      if (isPass) {
        earnedCredits += cr;
      } else {
        hasFailedCourse = true;
        if (c.result_status === 'SUPPLEMENTARY') {
          hasSupplementary = true;
        }
      }
    });

    const sgpa = sumCredits > 0 ? parseFloat((sumCreditGradePoints / sumCredits).toFixed(2)) : 0;

    let overallSemesterStatus: 'PASS' | 'FAIL' | 'SUPPLEMENTARY' = 'PASS';
    if (hasSupplementary) {
      overallSemesterStatus = 'SUPPLEMENTARY';
    } else if (hasFailedCourse) {
      overallSemesterStatus = 'FAIL';
    }

    // Calculate cumulative CGPA across all student records in end_semester_results.csv
    let cumulativeCreditPoints = 0;
    let cumulativeTotalCredits = 0;
    let cumulativeEarnedCredits = 0;

    studentResults.forEach((c) => {
      const cr = parseFloat(c.credits || '0') || 0;
      const gp = parseFloat(c.grade_point || '0') || 0;
      cumulativeTotalCredits += cr;
      cumulativeCreditPoints += cr * gp;
      if (c.result_status === 'PASS' && c.grade !== 'F') {
        cumulativeEarnedCredits += cr;
      }
    });

    const calculatedCgpa =
      cumulativeTotalCredits > 0
        ? parseFloat((cumulativeCreditPoints / cumulativeTotalCredits).toFixed(2))
        : parseFloat(student?.cgpa || '0.00');

    // Available semesters with results for this student
    const availableSemesters = Array.from(new Set(studentResults.map((r) => r.semester))).sort();
    const availableAcademicYears = Array.from(new Set(studentResults.map((r) => r.academic_year))).sort();

    return res.json({
      student_uid: targetUid,
      student_name: student?.name || 'Student',
      program: 'Bachelor of Technology (B.Tech)',
      department: student?.department || 'Computer Science & Engineering',
      current_class: student?.class || 'N/A',
      selected_semester: activeSemester,
      academic_year: semesterCourses[0]?.academic_year || '2025-26',
      published_date: semesterCourses[0]?.published_date || 'N/A',
      available_semesters: availableSemesters,
      available_academic_years: availableAcademicYears,
      courses: semesterCourses,
      metrics: {
        total_credits: sumCredits,
        credits_earned: earnedCredits,
        sgpa: sgpa,
        cgpa: calculatedCgpa,
        cumulative_credits_earned: cumulativeEarnedCredits,
        result_status: semesterCourses.length > 0 ? overallSemesterStatus : 'N/A',
      },
    });
  } catch (error: any) {
    console.error('Error fetching student end-semester results:', error);
    return res.status(500).json({ error: 'Failed to retrieve end-semester results' });
  }
});

// GET /api/results - Admin list results with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { student_uid, semester, academic_year, course_code } = req.query;
    let results = await readCsv<EndSemesterResult>(CSV_FILES.END_SEMESTER_RESULTS);

    if (student_uid) {
      results = results.filter((r) =>
        (r.student_uid || '').toUpperCase().includes(String(student_uid).toUpperCase())
      );
    }
    if (semester && semester !== 'All') {
      results = results.filter((r) => (r.semester || '').toLowerCase() === String(semester).toLowerCase());
    }
    if (academic_year && academic_year !== 'All') {
      results = results.filter((r) => (r.academic_year || '').toLowerCase() === String(academic_year).toLowerCase());
    }
    if (course_code) {
      results = results.filter((r) =>
        (r.course_code || '').toLowerCase().includes(String(course_code).toLowerCase())
      );
    }

    return res.json({
      total: results.length,
      results: results.slice(0, 500),
    });
  } catch (error: any) {
    console.error('Error fetching all results:', error);
    return res.status(500).json({ error: 'Failed to retrieve results' });
  }
});

// POST /api/results/validate - Preview and validate Rexa CSV content before saving
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { csvData } = req.body;
    if (!csvData || typeof csvData !== 'string') {
      return res.status(400).json({ error: 'Raw CSV content string is required' });
    }

    let records: any[] = [];
    try {
      records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (parseErr: any) {
      return res.status(400).json({ error: `CSV Parsing failed: ${parseErr.message}` });
    }

    if (records.length === 0) {
      return res.status(400).json({ error: 'The uploaded CSV file is empty' });
    }

    // Validate headers
    const presentColumns = Object.keys(records[0] || {});
    const missingColumns = REQUIRED_COLUMNS.filter(
      (col) => !presentColumns.map((c) => c.toLowerCase()).includes(col.toLowerCase())
    );

    if (missingColumns.length > 0) {
      return res.status(400).json({
        error: `CSV is missing required Rexa columns: ${missingColumns.join(', ')}`,
        requiredColumns: REQUIRED_COLUMNS,
        foundColumns: presentColumns,
      });
    }

    // Existing records for new vs update detection
    const existing = await readCsv<EndSemesterResult>(CSV_FILES.END_SEMESTER_RESULTS);
    const existingKeySet = new Set(
      existing.map(
        (r) =>
          `${r.student_uid.toUpperCase()}_${r.semester.toUpperCase()}_${r.course_code.toUpperCase()}_${r.academic_year.toUpperCase()}`
      )
    );

    const validRows: EndSemesterResult[] = [];
    const invalidRows: Array<{ row: number; data: any; errors: string[] }> = [];
    let newCount = 0;
    let updateCount = 0;

    records.forEach((row, index) => {
      const errors: string[] = [];
      const uid = (row.student_uid || '').trim().toUpperCase();
      const sem = (row.semester || '').trim().toUpperCase();
      const course = (row.course_code || '').trim().toUpperCase();
      const title = (row.course_title || '').trim();
      const cr = parseFloat(row.credits);
      const gp = parseFloat(row.grade_point);
      const marks = parseFloat(row.marks_obtained);
      const status = (row.result_status || '').trim().toUpperCase();

      if (!uid) errors.push('Missing student_uid');
      if (!sem) errors.push('Missing semester (e.g. S1, S2)');
      if (!course) errors.push('Missing course_code');
      if (!title) errors.push('Missing course_title');
      if (isNaN(cr) || cr <= 0) errors.push('Invalid credits (must be positive number)');
      if (isNaN(gp) || gp < 0 || gp > 10) errors.push('Invalid grade_point (0-10)');
      if (isNaN(marks) || marks < 0) errors.push('Invalid marks_obtained');
      if (!['PASS', 'FAIL', 'SUPPLEMENTARY'].includes(status)) {
        errors.push('Status must be PASS, FAIL, or SUPPLEMENTARY');
      }

      if (errors.length > 0) {
        invalidRows.push({ row: index + 2, data: row, errors });
      } else {
        const item: EndSemesterResult = {
          student_uid: uid,
          semester: sem,
          academic_year: (row.academic_year || '2025-26').trim(),
          course_code: course,
          course_title: title,
          credits: String(cr),
          grade: (row.grade || 'P').trim().toUpperCase(),
          grade_point: String(gp),
          max_marks: String(row.max_marks || '100').trim(),
          marks_obtained: String(marks),
          result_status: status as any,
          published_date: (row.published_date || new Date().toISOString().split('T')[0]).trim(),
        };

        const key = `${item.student_uid}_${item.semester}_${item.course_code}_${item.academic_year}`;
        if (existingKeySet.has(key)) {
          updateCount++;
        } else {
          newCount++;
        }
        validRows.push(item);
      }
    });

    return res.json({
      summary: {
        records_detected: records.length,
        valid_records: validRows.length,
        invalid_records: invalidRows.length,
        new_records: newCount,
        updated_records: updateCount,
      },
      valid_preview: validRows.slice(0, 15),
      valid_rows: validRows,
      invalid_rows: invalidRows,
    });
  } catch (error: any) {
    console.error('Validation error:', error);
    return res.status(500).json({ error: 'Failed to validate Rexa CSV' });
  }
});

// POST /api/results/import - Confirm import and merge into end_semester_results.csv
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No valid rows provided for import' });
    }

    const existingResults = await readCsv<EndSemesterResult>(CSV_FILES.END_SEMESTER_RESULTS);

    // Build key map for upsert: student_uid + semester + course_code + academic_year
    const resultMap = new Map<string, EndSemesterResult>();
    existingResults.forEach((r) => {
      const key = `${r.student_uid.toUpperCase()}_${r.semester.toUpperCase()}_${r.course_code.toUpperCase()}_${r.academic_year.toUpperCase()}`;
      resultMap.set(key, r);
    });

    let newCount = 0;
    let updateCount = 0;

    for (const r of rows) {
      const key = `${String(r.student_uid).toUpperCase()}_${String(r.semester).toUpperCase()}_${String(r.course_code).toUpperCase()}_${String(r.academic_year).toUpperCase()}`;
      if (resultMap.has(key)) {
        updateCount++;
      } else {
        newCount++;
      }
      resultMap.set(key, {
        student_uid: String(r.student_uid).trim().toUpperCase(),
        semester: String(r.semester).trim().toUpperCase(),
        academic_year: String(r.academic_year || '2025-26').trim(),
        course_code: String(r.course_code).trim().toUpperCase(),
        course_title: String(r.course_title).trim(),
        credits: String(r.credits).trim(),
        grade: String(r.grade).trim().toUpperCase(),
        grade_point: String(r.grade_point).trim(),
        max_marks: String(r.max_marks || '100').trim(),
        marks_obtained: String(r.marks_obtained).trim(),
        result_status: String(r.result_status).trim().toUpperCase() as any,
        published_date: String(r.published_date || new Date().toISOString().split('T')[0]).trim(),
      });
    }

    const mergedList = Array.from(resultMap.values());
    await writeCsv(CSV_FILES.END_SEMESTER_RESULTS, mergedList);

    return res.json({
      message: 'Rexa results imported and merged successfully into end_semester_results.csv',
      summary: {
        total_in_csv: mergedList.length,
        imported_total: rows.length,
        new_records: newCount,
        updated_records: updateCount,
      },
    });
  } catch (error: any) {
    console.error('Error importing results:', error);
    return res.status(500).json({ error: 'Failed to write Rexa results to CSV' });
  }
});

// DELETE /api/results - Delete specific result record
router.delete('/:student_uid/:semester/:course_code/:academic_year', async (req: Request, res: Response) => {
  try {
    const { student_uid, semester, course_code, academic_year } = req.params;

    const deleted = await deleteFromCsv<EndSemesterResult>(
      CSV_FILES.END_SEMESTER_RESULTS,
      (r) =>
        (r.student_uid || '').toUpperCase() === student_uid.toUpperCase() &&
        (r.semester || '').toUpperCase() === semester.toUpperCase() &&
        (r.course_code || '').toUpperCase() === course_code.toUpperCase() &&
        (r.academic_year || '').toUpperCase() === academic_year.toUpperCase()
    );

    if (deleted === 0) {
      return res.status(404).json({ error: 'Result record not found' });
    }

    return res.json({ message: 'Result record deleted from end_semester_results.csv' });
  } catch (error: any) {
    console.error('Error deleting result record:', error);
    return res.status(500).json({ error: 'Failed to delete result record' });
  }
});

// GET /api/results/export - Export results to CSV
router.get('/export/csv', async (req: Request, res: Response) => {
  try {
    const { semester, academic_year, student_uid } = req.query;
    let list = await readCsv<EndSemesterResult>(CSV_FILES.END_SEMESTER_RESULTS);

    if (semester && semester !== 'All') {
      list = list.filter((r) => r.semester.toLowerCase() === String(semester).toLowerCase());
    }
    if (academic_year && academic_year !== 'All') {
      list = list.filter((r) => r.academic_year.toLowerCase() === String(academic_year).toLowerCase());
    }
    if (student_uid) {
      list = list.filter((r) => r.student_uid.toUpperCase().includes(String(student_uid).toUpperCase()));
    }

    const headers = REQUIRED_COLUMNS;
    const csvContent = [
      headers.join(','),
      ...list.map((r) =>
        headers.map((h) => `"${String((r as any)[h] ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="rexa_results_export_${Date.now()}.csv"`);
    return res.send(csvContent);
  } catch (error: any) {
    console.error('Error exporting results:', error);
    return res.status(500).json({ error: 'Failed to export results CSV' });
  }
});

// GET /api/results/sample-csv - Downloadable sample Rexa CSV template
router.get('/sample-csv/download', (req: Request, res: Response) => {
  const sample = `student_uid,semester,academic_year,course_code,course_title,credits,grade,grade_point,max_marks,marks_obtained,result_status,published_date
RSET2024CSE001,S4,2025-26,CS301,Database Management Systems,4,A,8.5,100,84,PASS,15-08-2026
RSET2024CSE001,S4,2025-26,CS303,Operating Systems,4,O,10,100,95,PASS,15-08-2026
RSET2024CSE002,S4,2025-26,CS301,Database Management Systems,4,B+,8,100,76,PASS,15-08-2026
RSET2024CSE004,S4,2025-26,CS301,Database Management Systems,4,F,0,100,34,SUPPLEMENTARY,15-08-2026`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="rexa_results_sample_template.csv"');
  return res.send(sample);
});

export default router;
