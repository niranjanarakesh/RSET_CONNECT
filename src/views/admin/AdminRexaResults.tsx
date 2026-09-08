import React, { useState, useEffect, useRef } from 'react';
import { CourseResultItem } from '../../types';
import {
  GraduationCap,
  Upload,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  Clock,
  ArrowUpRight,
  Database,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';

interface ValidationSummary {
  records_detected: number;
  valid_records: number;
  invalid_records: number;
  new_records: number;
  updated_records: number;
}

interface ValidationResponse {
  summary: ValidationSummary;
  valid_preview: CourseResultItem[];
  valid_rows: CourseResultItem[];
  invalid_rows: Array<{ row: number; data: any; errors: string[] }>;
}

export const AdminRexaResults: React.FC = () => {
  const rexaUrl = import.meta.env.VITE_REXA_PORTAL_URL || 'https://student.rajagiritech.ac.in/';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Results list state
  const [results, setResults] = useState<CourseResultItem[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [searchUid, setSearchUid] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [searchCourse, setSearchCourse] = useState('');

  // Upload & Validation state
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState('');
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [showInvalidDetails, setShowInvalidDetails] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Fetch existing results registry
  const fetchResults = async () => {
    setLoadingResults(true);
    try {
      const params = new URLSearchParams();
      if (searchUid) params.append('student_uid', searchUid);
      if (selectedSemester !== 'All') params.append('semester', selectedSemester);
      if (selectedYear !== 'All') params.append('academic_year', selectedYear);
      if (searchCourse) params.append('course_code', searchCourse);

      const res = await fetch(`/api/results?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [selectedSemester, selectedYear]);

  // Handle CSV file selection or drop
  const handleFileProcess = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setImportError('Invalid file format. Please upload a standard CSV file (.csv).');
      return;
    }

    setFileName(file.name);
    setImportError(null);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvText(content);
      validateCsv(content);
    };
    reader.onerror = () => {
      setImportError('Failed to read selected CSV file.');
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  // Validate CSV with server
  const validateCsv = async (content: string) => {
    if (!content.trim()) {
      setValidationResult(null);
      return;
    }

    setValidating(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const res = await fetch('/api/results/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData: content }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Validation failed');
      }

      setValidationResult(data);
    } catch (err: any) {
      setImportError(err.message || 'Error validating CSV');
      setValidationResult(null);
    } finally {
      setValidating(false);
    }
  };

  // Confirm Import: imports ALL valid rows from the parsed CSV, not just the 15 preview rows
  const handleConfirmImport = async () => {
    if (!validationResult) return;

    // Use strictly the complete list of valid rows
    const rowsToImport = validationResult.valid_rows;
    if (!rowsToImport || rowsToImport.length === 0) {
      setImportError('No valid rows found to import.');
      return;
    }

    setImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const res = await fetch('/api/results/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: rowsToImport }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setImportSuccess(
        `Successfully imported all ${data.summary?.imported_total || rowsToImport.length} valid results (${data.summary?.new_records || 0} new, ${data.summary?.updated_records || 0} updated).`
      );
      setValidationResult(null);
      setCsvText('');
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchResults();
    } catch (err: any) {
      setImportError(err.message || 'Error importing results');
    } finally {
      setImporting(false);
    }
  };

  const handleResetUpload = () => {
    setValidationResult(null);
    setCsvText('');
    setFileName(null);
    setImportError(null);
    setImportSuccess(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Delete specific result row
  const handleDeleteResult = async (item: CourseResultItem) => {
    if (
      !window.confirm(
        `Delete result record for ${item.student_uid} - ${item.course_code} (${item.semester})?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `/api/results/${item.student_uid}/${item.semester}/${item.course_code}/${item.academic_year}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        fetchResults();
      } else {
        alert('Failed to delete result record');
      }
    } catch (err) {
      alert('Error deleting result record');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">End-Semester Results</h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Import and manage examination results received from the REXA portal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={rexaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-4 py-2 text-xs font-bold text-indigo-900 shadow-xs hover:bg-indigo-100 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-indigo-700" />
            <span>Open REXA Portal</span>
          </a>

          <a
            href="/api/results/sample-csv/download"
            download="rexa_results_template.csv"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-600" />
            <span>Download CSV Template</span>
          </a>
        </div>
      </div>

      {/* Notifications */}
      {importSuccess && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span>{importSuccess}</span>
          </div>
          <button
            onClick={() => setImportSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {importError && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{importError}</span>
          </div>
          <button
            onClick={() => setImportError(null)}
            className="text-rose-700 hover:text-rose-900 font-bold ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Professional CSV Upload Area */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-900">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                Import REXA Results CSV
              </h2>
              <p className="text-xs text-slate-500">
                Upload verified result exports exported from the official REXA examination portal.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowManualPaste((prev) => !prev)}
            className="text-xs font-semibold text-indigo-900 hover:text-indigo-950 underline cursor-pointer"
          >
            {showManualPaste ? 'Use File Upload' : 'Paste CSV Text'}
          </button>
        </div>

        {/* Drag & Drop File Zone */}
        {!showManualPaste ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
              isDragging
                ? 'border-indigo-600 bg-indigo-50/50'
                : 'border-slate-300 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
              id="rexa-csv-upload-input"
            />

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-950 text-white shadow-xs">
              <Upload className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-sm font-bold text-slate-900">
              {fileName ? fileName : 'Choose REXA Export CSV file or Drag & Drop'}
            </h3>

            <p className="mt-1.5 max-w-md text-xs text-slate-500">
              Standard format containing student register numbers, course codes, credits, CIA marks,
              letter grades, and pass/fail statuses.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <label
                htmlFor="rexa-csv-upload-input"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-950 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-900 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Select CSV File</span>
              </label>

              {fileName && (
                <button
                  type="button"
                  onClick={handleResetUpload}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Clear File
                </button>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
              <span>Required columns: student_uid, semester, course_code, credits, grade, marks_obtained, result_status</span>
            </div>
          </div>
        ) : (
          /* Manual Paste Area */
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Paste Raw Rexa CSV Text:
              </label>
              {csvText && (
                <button
                  type="button"
                  onClick={handleResetUpload}
                  className="text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                validateCsv(e.target.value);
              }}
              placeholder="student_uid,semester,academic_year,course_code,course_title,credits,grade,grade_point,max_marks,marks_obtained,result_status,published_date&#10;RSET2024CSE001,S4,2025-26,CS301,Database Management Systems,4,A,8.5,100,84,PASS,15-08-2026..."
              className="w-full rounded-xl border border-slate-300 p-3 font-mono text-[11px] text-slate-900 focus:border-indigo-600 focus:outline-none"
            />
          </div>
        )}

        {/* Validating indicator */}
        {validating && (
          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-slate-50 p-4 text-xs font-medium text-slate-600">
            <RefreshCw className="h-4 w-4 animate-spin text-indigo-700" />
            <span>Parsing and validating examination records against student registry...</span>
          </div>
        )}

        {/* Validation Summary Cards & Preview */}
        {validationResult && (
          <div className="mt-8 border-t border-slate-200 pt-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Validation Results Summary</h3>
              <p className="text-xs text-slate-500">
                Verification checks completed across all parsed CSV data rows.
              </p>
            </div>

            {/* 5 Summary Cards: Records Found, Valid, Invalid, New, Updated */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {/* Records Found */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Records Found
                </div>
                <div className="mt-2 text-2xl font-extrabold text-slate-900">
                  {validationResult.summary.records_detected}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">Total parsed rows</div>
              </div>

              {/* Valid */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Valid
                </div>
                <div className="mt-2 text-2xl font-black text-emerald-800">
                  {validationResult.summary.valid_records}
                </div>
                <div className="mt-1 text-[11px] text-emerald-700">Eligible for import</div>
              </div>

              {/* Invalid */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
                  Invalid
                </div>
                <div className="mt-2 text-2xl font-black text-rose-800">
                  {validationResult.summary.invalid_records}
                </div>
                <div className="mt-1 text-[11px] text-rose-700">Excluded rows</div>
              </div>

              {/* New */}
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-900">
                  New
                </div>
                <div className="mt-2 text-2xl font-black text-indigo-950">
                  {validationResult.summary.new_records}
                </div>
                <div className="mt-1 text-[11px] text-indigo-700">New grade entries</div>
              </div>

              {/* Updated */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Updated
                </div>
                <div className="mt-2 text-2xl font-black text-amber-800">
                  {validationResult.summary.updated_records}
                </div>
                <div className="mt-1 text-[11px] text-amber-700">Existing updates</div>
              </div>
            </div>

            {/* Warnings Alert if any Invalid Rows Exist */}
            {validationResult.summary.invalid_records > 0 && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>
                      {validationResult.summary.invalid_records} invalid rows detected (will not be imported)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInvalidDetails((prev) => !prev)}
                    className="font-semibold underline text-rose-800 hover:text-rose-950"
                  >
                    {showInvalidDetails ? 'Hide Error Details' : 'Show Error Details'}
                  </button>
                </div>

                {showInvalidDetails && (
                  <ul className="mt-3 list-disc pl-5 space-y-1 max-h-36 overflow-y-auto border-t border-rose-200/60 pt-2 text-[11px]">
                    {validationResult.invalid_rows.map((inv, idx) => (
                      <li key={idx}>
                        <span className="font-semibold">Row {inv.row}:</span> {inv.errors.join(', ')}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Preview Table Header & Confirmation Action */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-900" />
                    <h4 className="text-sm font-bold text-slate-900">
                      Validation Preview
                    </h4>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Showing first {Math.min(15, validationResult.valid_preview?.length || 0)} rows of{' '}
                    <strong className="text-slate-800">{validationResult.summary.valid_records} valid records</strong>.
                    All {validationResult.summary.valid_records} valid records will be imported upon confirmation.
                  </p>
                </div>

                {/* Prominent Import Button */}
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={importing || validationResult.summary.valid_records === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-xs hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span>
                    {importing
                      ? `Importing ${validationResult.summary.valid_records} Results...`
                      : `Import ${validationResult.summary.valid_records} Results`}
                  </span>
                </button>
              </div>

              {/* Preview Table: First 15 rows only */}
              {validationResult.valid_preview && validationResult.valid_preview.length > 0 ? (
                <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="border-b border-slate-200 bg-slate-100/80 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      <tr>
                        <th className="px-3 py-2.5">Student UID</th>
                        <th className="px-2 py-2.5 text-center">Sem</th>
                        <th className="px-2 py-2.5 text-center">Year</th>
                        <th className="px-3 py-2.5">Course Code</th>
                        <th className="px-3 py-2.5">Course Title</th>
                        <th className="px-2 py-2.5 text-center">Credits</th>
                        <th className="px-2 py-2.5 text-center">Marks</th>
                        <th className="px-2 py-2.5 text-center">Grade</th>
                        <th className="px-3 py-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {validationResult.valid_preview.map((row, idx) => (
                        <tr key={idx} className="hover:bg-indigo-50/30">
                          <td className="px-3 py-2.5 font-mono font-bold text-indigo-950">
                            {row.student_uid}
                          </td>
                          <td className="px-2 py-2.5 text-center font-bold text-slate-700">
                            {row.semester}
                          </td>
                          <td className="px-2 py-2.5 text-center text-slate-500">
                            {row.academic_year}
                          </td>
                          <td className="px-3 py-2.5 font-mono font-semibold text-slate-900">
                            {row.course_code}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-slate-800 max-w-[220px] truncate">
                            {row.course_title}
                          </td>
                          <td className="px-2 py-2.5 text-center font-semibold text-slate-900">
                            {row.credits}
                          </td>
                          <td className="px-2 py-2.5 text-center font-bold text-slate-900">
                            {row.marks_obtained}
                          </td>
                          <td className="px-2 py-2.5 text-center font-bold text-indigo-900">
                            {row.grade}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span
                              className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                                row.result_status === 'PASS'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : row.result_status === 'SUPPLEMENTARY'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {row.result_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  No valid preview rows available.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Published End-Semester Results Management */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-sm font-bold text-slate-900 sm:text-base">
              Published Examination Results Registry
            </h2>
            <p className="text-xs text-slate-500">
              Showing {results.length} active course grade records in official academic storage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/api/results/export/csv"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </a>

            <button
              onClick={fetchResults}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingResults ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 gap-3 border-b border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Filter by Student UID:
            </label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchUid}
                onChange={(e) => setSearchUid(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchResults()}
                placeholder="e.g. RSET2024CSE001"
                className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Semester:
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
            >
              <option value="All">All Semesters</option>
              {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Academic Year:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
            >
              <option value="All">All Academic Years</option>
              <option value="2025-26">2025-26</option>
              <option value="2024-25">2024-25</option>
              <option value="2023-24">2023-24</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Course Code:
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                value={searchCourse}
                onChange={(e) => setSearchCourse(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchResults()}
                placeholder="e.g. CS301"
                className="w-full rounded-lg border border-slate-300 bg-white py-1.5 px-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="overflow-x-auto">
          {loadingResults ? (
            <div className="flex h-48 items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-700" />
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching examination records found in the database.
            </div>
          ) : (
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">Student UID</th>
                  <th className="px-2 py-3 text-center">Sem</th>
                  <th className="px-2 py-3 text-center">Year</th>
                  <th className="px-3 py-3">Course Code</th>
                  <th className="px-4 py-3">Course Title</th>
                  <th className="px-2 py-3 text-center">Credits</th>
                  <th className="px-2 py-3 text-center">Marks</th>
                  <th className="px-2 py-3 text-center">Grade</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {results.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-950">
                      {item.student_uid}
                    </td>
                    <td className="px-2 py-3 text-center font-bold text-slate-800">
                      {item.semester}
                    </td>
                    <td className="px-2 py-3 text-center text-slate-500">
                      {item.academic_year}
                    </td>
                    <td className="px-3 py-3 font-mono font-semibold text-slate-900">
                      {item.course_code}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 max-w-[240px] truncate">
                      {item.course_title}
                    </td>
                    <td className="px-2 py-3 text-center font-semibold">{item.credits}</td>
                    <td className="px-2 py-3 text-center font-bold text-slate-900">
                      {item.marks_obtained}
                    </td>
                    <td className="px-2 py-3 text-center font-bold text-indigo-950">
                      {item.grade}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                          item.result_status === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.result_status === 'SUPPLEMENTARY'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.result_status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => handleDeleteResult(item)}
                        className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
