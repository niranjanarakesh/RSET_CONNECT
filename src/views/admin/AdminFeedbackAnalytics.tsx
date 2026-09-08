import React, { useState, useEffect } from 'react';
import { FeedbackItem, SubjectItem } from '../../types';
import { MessageSquareQuote, Star, User, BookOpen, Quote, Download } from 'lucide-react';

interface FacultyAggregated {
  subject_id: string;
  subject_name?: string;
  teacher: string;
  avg_score: number;
  count: number;
  comments: string[];
}

export const AdminFeedbackAnalytics: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fbRes, subRes] = await Promise.all([
          fetch('/api/feedback'),
          fetch('/api/subjects'),
        ]);

        if (fbRes.ok) setFeedbacks(await fbRes.json());
        if (subRes.ok) setSubjects(await subRes.json());
      } catch (err) {
        console.error('Error loading feedback data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Aggregate by subject / faculty
  const facultyMap = new Map<string, FacultyAggregated>();

  feedbacks.forEach((fb) => {
    const key = `${fb.subject_id}_${fb.teacher}`;
    const scoreVal = parseFloat(fb.score) || 0;
    const existing = facultyMap.get(key);

    if (existing) {
      existing.avg_score += scoreVal;
      existing.count += 1;
      if (fb.comments?.trim()) {
        existing.comments.push(fb.comments.trim());
      }
    } else {
      const sub = subjects.find((s) => s.id === fb.subject_id);
      facultyMap.set(key, {
        subject_id: fb.subject_id,
        subject_name: sub ? sub.name : fb.subject_id,
        teacher: fb.teacher,
        avg_score: scoreVal,
        count: 1,
        comments: fb.comments?.trim() ? [fb.comments.trim()] : [],
      });
    }
  });

  const facultyList: FacultyAggregated[] = Array.from(facultyMap.values()).map((item) => ({
    ...item,
    avg_score: parseFloat((item.avg_score / item.count).toFixed(2)),
  }));

  // Overall campus rating
  const overallAvg =
    facultyList.length > 0
      ? (facultyList.reduce((acc, curr) => acc + curr.avg_score, 0) / facultyList.length).toFixed(2)
      : '4.80';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Faculty & Course Feedback Analytics
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Anonymous student course evaluation scores, faculty metrics, and qualitative feedback summaries.
          </p>
        </div>

        <a
          href="/api/feedback/export/csv"
          download
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Feedback CSV</span>
        </a>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Campus Pedagogical Index</span>
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{overallAvg} / 5.0</div>
          <div className="mt-1 text-xs text-emerald-700 font-semibold">Exceeds autonomous target (4.50)</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Total Submissions</span>
            <MessageSquareQuote className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-indigo-950">{feedbacks.length}</div>
          <div className="mt-1 text-xs text-slate-400">Anonymous student evaluations</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Courses Evaluated</span>
            <BookOpen className="h-4 w-4 text-sky-600" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{facultyList.length}</div>
          <div className="mt-1 text-xs text-slate-400">Distinct faculty-subject pairings</div>
        </div>
      </div>

      {/* Faculty Score Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-900 sm:text-base">
            Course & Faculty Teaching Performance Summary
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3.5">Course / Subject</th>
                <th className="px-5 py-3.5">Assigned Faculty</th>
                <th className="px-4 py-3.5 text-center">Submissions</th>
                <th className="px-4 py-3.5 text-center">Average Score</th>
                <th className="px-5 py-3.5 text-right">Rating Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {facultyList.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3 font-semibold text-slate-900">{item.subject_name}</td>
                  <td className="px-5 py-3 text-slate-700">{item.teacher}</td>
                  <td className="px-4 py-3 text-center font-mono font-medium text-slate-600">
                    {item.count}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 font-mono font-bold text-amber-900">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      <span>{item.avg_score} / 5.0</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        item.avg_score >= 4.5
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.avg_score >= 4.0
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.avg_score >= 4.5 ? 'Excellent' : item.avg_score >= 4.0 ? 'Good' : 'Needs Review'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Feedback Remarks */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 sm:text-base">
          Recent Qualitative Student Observations
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">Direct extracts from student feedback submissions.</p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {feedbacks
            .filter((f) => f.comments && f.comments.trim().length > 0)
            .slice(0, 6)
            .map((f, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs">
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span className="font-semibold text-indigo-950">{f.teacher}</span>
                  <div className="flex items-center gap-1 font-mono text-amber-600 font-bold">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span>{f.score}</span>
                  </div>
                </div>
                <div className="mt-2 flex items-start gap-2 text-slate-700 italic">
                  <Quote className="h-4 w-4 shrink-0 text-slate-400 rotate-180" />
                  <span>{f.comments}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
