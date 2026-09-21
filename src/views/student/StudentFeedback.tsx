import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser, SubjectItem } from '../../types';
import { MessageSquareQuote, Star, Send, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const FEEDBACK_CRITERIA = [
  { id: 'q1', text: 'Punctuality and regularity in conducting scheduled classes' },
  { id: 'q2', text: 'Clarity of explanation and presentation of concepts' },
  { id: 'q3', text: 'Syllabus coverage according to the official academic calendar' },
  { id: 'q4', text: 'Use of modern teaching aids, active learning methods & examples' },
  { id: 'q5', text: 'Fairness and transparency in continuous internal evaluations' },
  { id: 'q6', text: 'Availability and willingness to resolve doubts outside lecture hours' },
  { id: 'q7', text: 'Encouragement of questions, discussions, and creative thinking' },
  { id: 'q8', text: 'Provision of course materials, lecture notes, and assignments' },
  { id: 'q9', text: 'Relevance and effectiveness of tutorial/practical sessions' },
  { id: 'q10', text: 'Overall teaching effectiveness and inspiration provided' },
];

export const StudentFeedback: React.FC = () => {
  const { user } = useAuth();
  const student = user as StudentUser;

  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [ratings, setRatings] = useState<Record<string, number>>({
    q1: 5,
    q2: 5,
    q3: 5,
    q4: 5,
    q5: 5,
    q6: 5,
    q7: 5,
    q8: 5,
    q9: 5,
    q10: 5,
  });
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch(`/api/subjects?semester=${student?.semester || 'S5'}`);
        if (res.ok) {
          const list: SubjectItem[] = await res.json();
          setSubjects(list);
          if (list.length > 0) {
            setSelectedSubjectId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching subjects for feedback:', err);
      }
    };
    fetchSubjects();
  }, [student?.semester]);

  const handleRatingChange = (criteriaId: string, val: number) => {
    setRatings((prev) => ({ ...prev, [criteriaId]: val }));
  };

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) {
      setErrorMsg('Please select a subject to provide feedback.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Average score across 10 questions
    const sum = (Object.values(ratings) as number[]).reduce((a: number, b: number) => a + b, 0);
    const score = (sum / 10).toFixed(1);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_uid: student.uid,
          subject_id: selectedSubject.id,
          subject: selectedSubject.name,
          subject_code: selectedSubject.code,
          teacher: selectedSubject.teacher,
          score,
          comments,
          semester: student.semester,
          q1: ratings['q1'] || 5,
          q2: ratings['q2'] || 5,
          q3: ratings['q3'] || 5,
          q4: ratings['q4'] || 5,
          q5: ratings['q5'] || 5,
          q6: ratings['q6'] || 5,
          q7: ratings['q7'] || 5,
          q8: ratings['q8'] || 5,
          q9: ratings['q9'] || 5,
          q10: ratings['q10'] || 5,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to submit feedback');
      }

      setSuccessMsg(`Your anonymous feedback for ${selectedSubject.name} (${selectedSubject.teacher}) was submitted successfully.`);
      setComments('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Course & Faculty Feedback</h1>
        <p className="text-xs text-slate-500 sm:text-sm">
          Strictly confidential student evaluation to ensure continuous teaching enhancement and academic quality.
        </p>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subject / Faculty Selection Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="h-5 w-5 text-indigo-700" />
            <h2 className="text-sm font-bold text-slate-900 sm:text-base">
              Select Course to Review
            </h2>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-700">Course / Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:outline-none"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} - {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Assigned Faculty Member</label>
              <input
                type="text"
                disabled
                value={selectedSubject ? selectedSubject.teacher : 'N/A'}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-100/70 p-2 text-xs font-medium text-slate-700 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-50/70 p-3 text-xs text-indigo-900">
            <Info className="h-4 w-4 shrink-0 text-indigo-700" />
            <span>
              Your ratings are recorded for administrative analysis. Please rate objectively based
              on academic delivery.
            </span>
          </div>
        </div>

        {/* 10 Criteria Rating Scale */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <h3 className="text-sm font-bold text-slate-900">Evaluation Criteria (1 = Poor, 5 = Excellent)</h3>

          <div className="mt-4 divide-y divide-slate-100">
            {FEEDBACK_CRITERIA.map((crit, idx) => (
              <div
                key={crit.id}
                className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
              >
                <div className="text-xs font-medium text-slate-800">
                  <span className="font-bold text-slate-400 mr-2">{idx + 1}.</span>
                  {crit.text}
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange(crit.id, star)}
                      className={`p-1 transition-colors ${
                        star <= (ratings[crit.id] || 0)
                          ? 'text-amber-500 hover:text-amber-600'
                          : 'text-slate-200 hover:text-slate-300'
                      }`}
                    >
                      <Star className="h-5 w-5 fill-current" />
                    </button>
                  ))}
                  <span className="w-6 text-center font-mono text-xs font-bold text-slate-700">
                    {ratings[crit.id]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Qualitative Comments */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <label className="text-xs font-bold text-slate-800">
            Constructive Comments or Suggestions (Optional)
          </label>
          <textarea
            rows={3}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Highlight what you appreciated or suggest areas for pedagogical improvement..."
            className="mt-2 block w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-950 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-indigo-900 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{submitting ? 'Submitting...' : 'Submit Feedback'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
