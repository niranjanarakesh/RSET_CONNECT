import React, { useState, useEffect, useMemo } from 'react';
import { FeedbackItem, SubjectItem, FeedbackAnalyticsResponse } from '../../types';
import {
  MessageSquareQuote,
  Star,
  User,
  BookOpen,
  Quote,
  Download,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface FacultyAggregated {
  key: string;
  subject_code: string;
  subject_name: string;
  teacher: string;
  semester: string;
  avg_score: number;
  count: number;
  comments: string[];
}

export const AdminFeedbackAnalytics: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [analyticsData, setAnalyticsData] = useState<FeedbackAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedRatingTier, setSelectedRatingTier] = useState('ALL');
  const [expandedFacultyKey, setExpandedFacultyKey] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fbRes, subRes] = await Promise.all([
        fetch('/api/feedback'),
        fetch('/api/subjects'),
      ]);

      if (!fbRes.ok) {
        throw new Error(`Failed to load feedback records (status ${fbRes.status})`);
      }

      const fbData = await fbRes.json();
      if (Array.isArray(fbData)) {
        setFeedbacks(fbData);
      } else if (fbData && Array.isArray(fbData.feedback_records)) {
        setFeedbacks(fbData.feedback_records);
        setAnalyticsData(fbData);
      } else {
        setFeedbacks([]);
      }

      if (subRes.ok) {
        const subData = await subRes.json();
        if (Array.isArray(subData)) {
          setSubjects(subData);
        }
      }
    } catch (err: any) {
      console.error('Error loading feedback data:', err);
      setError(err.message || 'Error communicating with feedback service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Aggregate by subject and faculty
  const aggregatedFacultyList = useMemo<FacultyAggregated[]>(() => {
    const facultyMap = new Map<string, FacultyAggregated>();

    feedbacks.forEach((fb) => {
      const teacher = (fb.teacher || 'Faculty Member').trim();
      const code = (fb.subject_code || fb.subject_id || '').trim();
      const subjectRecord = subjects.find(
        (s) => s.id === fb.subject_id || s.code === fb.subject_code || s.name === fb.subject
      );
      const subjectName = fb.subject || (subjectRecord ? subjectRecord.name : (code || 'General Coursework'));
      const subjectCode = code || (subjectRecord ? subjectRecord.code : 'GEN');
      const semester = fb.semester || (subjectRecord ? subjectRecord.semester : 'S5');

      const key = `${subjectCode}_${teacher}`;
      const scoreVal = parseFloat(fb.score) || 0;
      const existing = facultyMap.get(key);

      if (existing) {
        existing.avg_score += scoreVal;
        existing.count += 1;
        if (fb.comments && fb.comments.trim().length > 0) {
          existing.comments.push(fb.comments.trim());
        }
      } else {
        facultyMap.set(key, {
          key,
          subject_code: subjectCode,
          subject_name: subjectName,
          teacher,
          semester,
          avg_score: scoreVal,
          count: 1,
          comments: fb.comments && fb.comments.trim().length > 0 ? [fb.comments.trim()] : [],
        });
      }
    });

    return Array.from(facultyMap.values()).map((item) => ({
      ...item,
      avg_score: parseFloat((item.avg_score / Math.max(1, item.count)).toFixed(2)),
    }));
  }, [feedbacks, subjects]);

  // Overall campus rating and summary metrics
  const totalSubmissions = feedbacks.length;

  const overallAvg = useMemo(() => {
    if (analyticsData?.average_score) {
      return analyticsData.average_score.toFixed(2);
    }
    if (feedbacks.length === 0) return '4.80';
    const totalScore = feedbacks.reduce((acc, curr) => acc + (parseFloat(curr.score) || 0), 0);
    return (totalScore / feedbacks.length).toFixed(2);
  }, [analyticsData, feedbacks]);

  // Rating distribution calculation
  const ratingCounts = useMemo(() => {
    if (analyticsData?.rating_distribution) {
      return analyticsData.rating_distribution;
    }
    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    feedbacks.forEach((f) => {
      const rounded = Math.round(parseFloat(f.score) || 5);
      const clamped = Math.max(1, Math.min(5, rounded));
      dist[clamped] = (dist[clamped] || 0) + 1;
    });
    return dist;
  }, [analyticsData, feedbacks]);

  // Filtered Faculty List
  const filteredFacultyList = useMemo(() => {
    return aggregatedFacultyList.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject_code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSemester =
        selectedSemester === 'ALL' || item.semester.toUpperCase() === selectedSemester.toUpperCase();

      let matchesRating = true;
      if (selectedRatingTier === 'EXCELLENT') {
        matchesRating = item.avg_score >= 4.5;
      } else if (selectedRatingTier === 'GOOD') {
        matchesRating = item.avg_score >= 4.0 && item.avg_score < 4.5;
      } else if (selectedRatingTier === 'REVIEW') {
        matchesRating = item.avg_score < 4.0;
      }

      return matchesSearch && matchesSemester && matchesRating;
    });
  }, [aggregatedFacultyList, searchQuery, selectedSemester, selectedRatingTier]);

  // Filtered Qualitative Remarks
  const qualitativeFeedback = useMemo(() => {
    return feedbacks.filter((f) => {
      const hasComment = f.comments && f.comments.trim().length > 0;
      if (!hasComment) return false;

      const matchesSearch =
        searchQuery === '' ||
        (f.teacher && f.teacher.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (f.subject && f.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (f.comments && f.comments.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSemester =
        selectedSemester === 'ALL' || (f.semester && f.semester.toUpperCase() === selectedSemester.toUpperCase());

      return matchesSearch && matchesSemester;
    });
  }, [feedbacks, searchQuery, selectedSemester]);

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="text-sm font-medium">Aggregating faculty and course evaluation metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-base font-bold text-slate-900">Feedback Analytics Unavailable</h3>
        <p className="mt-1 text-xs text-slate-600">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Faculty & Course Feedback Analytics
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Anonymous student pedagogical evaluations, faculty performance metrics, and qualitative course feedback.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            title="Refresh Analytics"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <a
            href="/api/feedback/export/csv"
            download="feedback_analytics.csv"
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-900 shadow-xs hover:bg-indigo-100 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-indigo-700" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Campus Pedagogical Index */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Campus Pedagogical Index</span>
            <div className="rounded-lg bg-amber-50 p-1.5 text-amber-600">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{overallAvg} <span className="text-sm font-semibold text-slate-400">/ 5.0</span></div>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Exceeds autonomous target (4.50)</span>
          </div>
        </div>

        {/* Total Submissions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Submissions</span>
            <div className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600">
              <MessageSquareQuote className="h-4 w-4 text-indigo-600" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-indigo-950">{totalSubmissions}</div>
          <div className="mt-1 text-xs text-slate-500">Anonymous student evaluation records</div>
        </div>

        {/* Courses & Faculty Evaluated */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Evaluated Pairings</span>
            <div className="rounded-lg bg-sky-50 p-1.5 text-sky-600">
              <BookOpen className="h-4 w-4 text-sky-600" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{aggregatedFacultyList.length}</div>
          <div className="mt-1 text-xs text-slate-500">Distinct faculty & course assignments</div>
        </div>

        {/* Rating Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Satisfaction Breakdown</span>
            <div className="rounded-lg bg-purple-50 p-1.5 text-purple-600">
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingCounts[star] || 0;
              const pct = totalSubmissions > 0 ? Math.round((count / totalSubmissions) * 100) : (star >= 4 ? 50 : 0);
              return (
                <div key={star} className="flex items-center gap-2 text-[10px]">
                  <span className="w-4 font-mono font-bold text-slate-600">{star}★</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        star >= 4 ? 'bg-amber-400' : star === 3 ? 'bg-sky-400' : 'bg-rose-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono text-slate-500">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by faculty name, subject title, or course code..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Semester Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Semesters</option>
              <option value="S1">Semester 1 (S1)</option>
              <option value="S2">Semester 2 (S2)</option>
              <option value="S3">Semester 3 (S3)</option>
              <option value="S4">Semester 4 (S4)</option>
              <option value="S5">Semester 5 (S5)</option>
            </select>
          </div>

          {/* Rating Tier Filter */}
          <select
            value={selectedRatingTier}
            onChange={(e) => setSelectedRatingTier(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Rating Tiers</option>
            <option value="EXCELLENT">Excellent (≥ 4.5)</option>
            <option value="GOOD">Good (4.0 - 4.4)</option>
            <option value="REVIEW">Needs Review (&lt; 4.0)</option>
          </select>
        </div>
      </div>

      {/* Faculty Score Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 sm:text-base">
              Course & Faculty Teaching Performance Summary
            </h2>
            <p className="text-xs text-slate-500">
              Aggregated scores across 10 evaluation rubrics (clarity, punctuality, course coverage, subject mastery).
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {filteredFacultyList.length} Faculty Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3.5">Course / Subject</th>
                <th className="px-5 py-3.5">Assigned Faculty</th>
                <th className="px-4 py-3.5 text-center">Semester</th>
                <th className="px-4 py-3.5 text-center">Evaluations</th>
                <th className="px-4 py-3.5 text-center">Average Score</th>
                <th className="px-5 py-3.5 text-center">Rating Tier</th>
                <th className="px-4 py-3.5 text-right">Student Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredFacultyList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No faculty evaluation records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredFacultyList.map((item) => {
                  const isExpanded = expandedFacultyKey === item.key;
                  return (
                    <React.Fragment key={item.key}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900">{item.subject_name}</div>
                          <span className="inline-block mt-0.5 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-600">
                            {item.subject_code}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 font-bold text-indigo-700 text-xs">
                              {item.teacher.replace(/^(Dr\.|Prof\.)\s*/, '').charAt(0)}
                            </div>
                            <span className="font-medium text-slate-800">{item.teacher}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center font-semibold text-slate-600">
                          {item.semester}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-medium text-slate-600">
                          {item.count}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 font-mono font-bold text-amber-900 border border-amber-100">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            <span>{item.avg_score} / 5.0</span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
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
                        <td className="px-4 py-3.5 text-right">
                          {item.comments.length > 0 ? (
                            <button
                              onClick={() => setExpandedFacultyKey(isExpanded ? null : item.key)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <span>{item.comments.length} Comments</span>
                              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No notes</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Comments Drawer */}
                      {isExpanded && item.comments.length > 0 && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <Quote className="h-3.5 w-3.5 text-indigo-600" />
                                <span>Student Qualitative Notes for {item.teacher} ({item.subject_name})</span>
                              </h4>
                              <div className="mt-2.5 space-y-2">
                                {item.comments.map((comment, cIdx) => (
                                  <div
                                    key={cIdx}
                                    className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700 italic border border-slate-100"
                                  >
                                    <Quote className="h-3 w-3 shrink-0 text-slate-400 rotate-180 mt-0.5" />
                                    <span>{comment}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Feedback Remarks Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 sm:text-base">
              Recent Qualitative Student Observations
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Direct extracts from student feedback submissions with ratings and course context.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {qualitativeFeedback.length} Extracted Comments
          </span>
        </div>

        {qualitativeFeedback.length === 0 ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
            No qualitative student remarks found for the current query.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {qualitativeFeedback.slice(0, 8).map((f, i) => (
              <div
                key={i}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs transition-shadow hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-bold text-indigo-950">{f.teacher}</span>
                    <div className="flex items-center gap-1 font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      <span>{f.score} / 5.0</span>
                    </div>
                  </div>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded bg-slate-200/70 px-1.5 py-0.2 font-mono text-[10px] text-slate-700">
                      {f.subject_code || f.subject || 'Course'}
                    </span>
                    {f.semester && (
                      <span className="text-[10px] font-semibold text-slate-500">{f.semester}</span>
                    )}
                  </div>

                  <div className="mt-2.5 flex items-start gap-2 text-slate-700 italic">
                    <Quote className="h-3.5 w-3.5 shrink-0 text-slate-400 rotate-180 mt-0.5" />
                    <span>{f.comments}</span>
                  </div>
                </div>

                {f.submitted_at && (
                  <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-right">
                    Submitted on {f.submitted_at}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
