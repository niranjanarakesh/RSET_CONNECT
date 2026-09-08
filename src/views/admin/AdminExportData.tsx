import React from 'react';
import { Download, FileSpreadsheet, Database, ShieldCheck } from 'lucide-react';

const CSV_REGISTRY = [
  {
    name: 'students.csv',
    endpoint: '/api/students/export/csv',
    description: 'Enrolled student profiles, register numbers (UIDs), contact details, CGPA, and credits.',
  },
  {
    name: 'attendance.csv',
    endpoint: '/api/attendance/export/csv',
    description: 'Subject-wise class attendance counts, present, absent, duty leave, and calculated percentages.',
  },
  {
    name: 'marks.csv',
    endpoint: '/api/marks/export/csv',
    description: 'Internal evaluations (Series 1, Series 2, assignments, projects, scaled CIA out of 50).',
  },
  {
    name: 'end_semester_results.csv',
    endpoint: '/api/results/export/csv',
    description: 'End-semester autonomous grade sheets imported from Rexa ERP (credits, grades, grade points).',
  },
  {
    name: 'activities.csv',
    endpoint: '/api/activities/export/csv',
    description: 'KTU student activity point claims, uploaded certificates, approved points, and faculty remarks.',
  },
  {
    name: 'feedback.csv',
    endpoint: '/api/feedback/export/csv',
    description: 'Course & faculty teaching evaluation surveys with 10-point criteria ratings and comments.',
  },
  {
    name: 'announcements.csv',
    endpoint: '/api/announcements/export/csv',
    description: 'Institutional circulars, notices, category tags, author details, and publication dates.',
  },
  {
    name: 'buses.csv',
    endpoint: '/api/buses/export/csv',
    description: 'College bus routes, waypoints, driver contact numbers, and transit statuses.',
  },
  {
    name: 'examinations.csv',
    endpoint: '/api/examinations/export/csv',
    description: 'Autonomous semester examination schedules, dates, session timings, and hall allotments.',
  },
  {
    name: 'timetable.csv',
    endpoint: '/api/timetable/export/csv',
    description: 'Class lecture timetable slots, days, hours, course assignments, and classroom venues.',
  },
];

export const AdminExportData: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Official Academic Archives & Data Export</h1>
        <p className="text-xs text-slate-500 sm:text-sm">
          Download authoritative datasets for institutional accreditation, APJ KTU compliance, NAAC audits, and administrative reporting.
        </p>
      </div>

      {/* Institutional Data Archive Notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 text-xs text-indigo-950">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700" />
        <div>
          <div className="font-bold text-sm">Institutional Data Archive</div>
          <p className="mt-1 leading-relaxed text-indigo-900">
            Authoritative institutional records are maintained with strict verification and schema integrity.
            Administrators can export individual department datasets and audit logs in standardized formats below.
          </p>
        </div>
      </div>

      {/* CSV Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CSV_REGISTRY.map((file) => (
          <div
            key={file.name}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300"
          >
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-indigo-700" />
                <h3 className="font-mono text-sm font-bold text-slate-900">{file.name}</h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{file.description}</p>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-3 flex justify-end">
              <a
                href={file.endpoint}
                download
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-950 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-900 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Dataset</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
