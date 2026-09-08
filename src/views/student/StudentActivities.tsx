import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser, ActivityStudentResponse } from '../../types';
import {
  Award,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  AlertCircle,
  Filter,
  CheckCircle,
  Check,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  KTU_ACTIVITY_CATEGORIES,
  calculateActivitiesAnalysis,
  getCategoryForActivity,
} from '../../utils/activityCategories';

const CATEGORY_OPTIONS = [
  {
    group: 'Category 1: National & Social Initiatives (30 pts)',
    options: [
      'Category 1: Community Service & Volunteering (NSS/NCC)',
      'Category 1: Student Leadership & Club Activities',
      'Category 1: National Initiatives (Swachh Bharat/Blood Donation)',
    ],
  },
  {
    group: 'Category 2: Sports & Cultural Activities (30 pts)',
    options: [
      'Category 2: Sports & Athletics (College/Interzone)',
      'Category 2: Cultural & Arts Competitions',
      'Category 2: University Games & Tournaments',
    ],
  },
  {
    group: 'Category 3: Professional & Technical Initiatives (40 pts)',
    options: [
      'Category 3: Internships & Industrial Training',
      'Category 3: Technical Competitions & Hackathons',
      'Category 3: MOOCs & Professional Certifications',
      'Category 3: Paper Publications & Patent Filings',
    ],
  },
];

export const StudentActivities: React.FC = () => {
  const { user } = useAuth();
  const student = user as StudentUser;

  const [data, setData] = useState<ActivityStudentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Category Filter State: 'All' | 'Category 1' | 'Category 2' | 'Category 3'
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    'All' | 'Category 1' | 'Category 2' | 'Category 3'
  >('All');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [semester, setSemester] = useState(student?.semester || 'S5');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0].options[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requestedPoints, setRequestedPoints] = useState('10');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchActivities = async () => {
    if (!student?.uid) return;
    try {
      const res = await fetch(`/api/activities/student/${student.uid}`);
      if (res.ok) {
        const ct = res.headers.get('content-type');
        if (ct && ct.includes('application/json')) {
          setData(await res.json());
        }
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [student?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let certificateUrl = '';

      // Upload certificate if provided
      if (certificateFile) {
        const formData = new FormData();
        formData.append('file', certificateFile);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          certificateUrl = uploadData.fileUrl;
        }
      }

      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_uid: student.uid,
          semester,
          category,
          title,
          description,
          certificate_url: certificateUrl,
          requested_points: requestedPoints,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to submit activity claim');
      }

      setSuccessMsg('Activity claim submitted successfully and forwarded for faculty advisor approval.');
      setTitle('');
      setDescription('');
      setCertificateFile(null);
      setShowForm(false);
      fetchActivities();
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Centralized calculations across the 3 categories
  const analysis = calculateActivitiesAnalysis(data?.activities || []);
  const { categoryProgress, overall } = analysis;

  // Filtered activities based on selected filter
  const filteredActivities = (data?.activities || []).filter((act) => {
    if (selectedCategoryFilter === 'All') return true;
    return getCategoryForActivity(act.category) === selectedCategoryFilter;
  });

  // Helper to count activities per category
  const getCountForFilter = (filterKey: 'All' | 'Category 1' | 'Category 2' | 'Category 3') => {
    if (filterKey === 'All') return data?.activities?.length || 0;
    return (data?.activities || []).filter(
      (act) => getCategoryForActivity(act.category) === filterKey
    ).length;
  };

  const handleCategoryCardClick = (catId: 'Category 1' | 'Category 2' | 'Category 3') => {
    setSelectedCategoryFilter((prev) => (prev === catId ? 'All' : catId));
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">KTU Activity Points</h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Track and submit co-curricular and extra-curricular credentials for degree qualification.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-950 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-900 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>{showForm ? 'Close Form' : 'Claim Activity Points'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Submission Form Modal/Panel */}
      {showForm && (
        <div className="rounded-2xl border-2 border-indigo-200 bg-white p-6 shadow-md transition-all">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-700" />
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                Submit New Activity Point Claim
              </h2>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:outline-none"
                >
                  {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Activity Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:outline-none"
                >
                  {CATEGORY_OPTIONS.map((grp) => (
                    <optgroup key={grp.group} label={grp.group}>
                      {grp.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Points Requested</label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  required
                  value={requestedPoints}
                  onChange={(e) => setRequestedPoints(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Activity Title / Event Name</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Smart India Hackathon Finalist / NSS Leadership Camp"
                className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Description / Details</label>
              <textarea
                rows={2}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe your role, host organization, dates, or credentials..."
                className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">
                Upload Certificate / Proof (PDF or Image)
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-indigo-950 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-900 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit Claim'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. ACTIVITY CATEGORY PROGRESS (3-Category Checking) */}
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                Activity Category Progress
              </h2>
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-950">
                3 Categories
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Track your points and completion status across the three KTU activity categories.
            </p>
          </div>

          {/* Automatic 3-category requirement check summary */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-xs text-xs font-bold">
              <span className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{overall.completedCategories} Completed</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-amber-700">
                <Clock className="h-3.5 w-3.5" />
                <span>{overall.inProgressCategories} In Progress</span>
              </span>
            </div>
          </div>
        </div>

        {/* The Three Category Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {KTU_ACTIVITY_CATEGORIES.map((catConfig) => {
            const progress = categoryProgress[catConfig.id];
            const isCompleted = progress.status === 'Completed';
            const isSelected = selectedCategoryFilter === catConfig.id;

            return (
              <div
                key={catConfig.id}
                onClick={() => handleCategoryCardClick(catConfig.id)}
                className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-600/30 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div>
                  {/* Category Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {catConfig.shortName}
                        </span>
                        {isSelected && (
                          <span className="rounded bg-indigo-100 px-1.5 py-0.2 text-[10px] font-bold text-indigo-800">
                            Active Filter
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1 text-sm font-bold text-slate-900 group-hover:text-indigo-950 transition-colors line-clamp-1">
                        {catConfig.name.split(':')[1]?.trim() || catConfig.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {catConfig.subtitle}
                      </p>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Completed</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          <span>In Progress</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Points Counter */}
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900">
                      {progress.approvedPoints}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      / {catConfig.requiredPoints} Points
                    </span>
                    <span className="ml-auto text-xs font-bold text-slate-700">
                      {progress.progressPct}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-emerald-500'
                          : 'bg-linear-to-r from-amber-500 to-indigo-600'
                      }`}
                      style={{ width: `${progress.progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Footer Metrics */}
                <div className="mt-4 border-t border-slate-100 pt-3 text-[11px]">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>
                      {isCompleted ? (
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Requirement met ✓
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-700">
                          {progress.remainingPoints} points needed
                        </span>
                      )}
                    </span>
                    {progress.pendingPoints > 0 ? (
                      <span className="font-medium text-amber-700 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {progress.pendingPoints} pts pending
                      </span>
                    ) : (
                      <span className="text-slate-400">0 pending</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Category Filter Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-y border-slate-200/80 py-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Filter Activities:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['All', 'Category 1', 'Category 2', 'Category 3'] as const).map((filterKey) => {
            const count = getCountForFilter(filterKey);
            const isActive = selectedCategoryFilter === filterKey;

            return (
              <button
                key={filterKey}
                onClick={() => setSelectedCategoryFilter(filterKey)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-950 text-white shadow-xs'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span>{filterKey}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. DEGREE REQUIREMENT PROGRESS CARD */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Degree Requirement Progress
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{overall.approvedPoints}</span>
              <span className="text-sm font-semibold text-slate-500">/ 100 Points</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{overall.approvedPoints} Points Approved</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{overall.pendingPoints} Points Pending</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
              <span>{overall.remainingPoints} Points Remaining</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-linear-to-r from-amber-500 to-indigo-600 transition-all duration-500"
            style={{ width: `${overall.progressPct}%` }}
          />
        </div>

        <div className="mt-2.5 flex flex-col justify-between gap-1 text-[11px] text-slate-500 sm:flex-row">
          <span className="font-semibold text-slate-700">{overall.progressPct}% Achieved</span>
          <span>
            {overall.remainingPoints > 0
              ? `${overall.remainingPoints} additional points needed to fulfill KTU B.Tech Degree criteria`
              : 'Mandatory 100 KTU Activity Points requirement fulfilled!'}
          </span>
        </div>
      </div>

      {/* 5. SUBMISSION HISTORY & FACULTY APPROVALS TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                Submission History & Faculty Approvals
              </h2>
              {selectedCategoryFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-950">
                  {selectedCategoryFilter}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Real-time status of claims processed by the Faculty Activity Coordinator
            </p>
          </div>

          <div className="text-xs text-slate-500">
            Showing <span className="font-bold text-slate-900">{filteredActivities.length}</span> of{' '}
            <span className="font-bold text-slate-900">{data?.activities?.length || 0}</span>{' '}
            activities
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">Category</th>
                <th className="px-5 py-3.5">Title & Details</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">Sem</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">Requested</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap">Granted</th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap">Status</th>
                <th className="px-5 py-3.5">Faculty Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-xs text-slate-500">
                    Loading activity records...
                  </td>
                </tr>
              ) : filteredActivities.length > 0 ? (
                filteredActivities.map((act) => {
                  const assignedCat = getCategoryForActivity(act.category);

                  return (
                    <tr key={act.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Category */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            assignedCat === 'Category 1'
                              ? 'bg-blue-50 text-blue-800'
                              : assignedCat === 'Category 2'
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-indigo-50 text-indigo-800'
                          }`}
                        >
                          {assignedCat}
                        </span>
                        <div className="mt-0.5 text-[11px] font-medium text-slate-600 max-w-[200px] truncate">
                          {act.category.replace(/Category \d:\s*/, '')}
                        </div>
                      </td>

                      {/* Title & Details */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{act.title}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                          {act.description}
                        </div>
                        {act.certificate_url && (
                          <a
                            href={act.certificate_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:underline"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>View Certificate</span>
                          </a>
                        )}
                      </td>

                      {/* Semester */}
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-700 whitespace-nowrap">
                        {act.semester}
                      </td>

                      {/* Requested */}
                      <td className="px-4 py-3.5 text-center text-slate-600 whitespace-nowrap">
                        {act.requested_points} pts
                      </td>

                      {/* Granted */}
                      <td className="px-4 py-3.5 text-center font-bold text-indigo-950 whitespace-nowrap">
                        {act.points} pts
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            act.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : act.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {act.status}
                        </span>
                      </td>

                      {/* Faculty Remarks */}
                      <td className="px-5 py-3.5 text-[11px] text-slate-600 max-w-[220px]">
                        {act.remarks || (
                          <span className="italic text-slate-400">
                            Under evaluation by department coordinator
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-xs text-slate-400">
                    {selectedCategoryFilter === 'All'
                      ? 'No activity points submitted yet. Click "Claim Activity Points" above to submit.'
                      : `No activities found under ${selectedCategoryFilter}.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
