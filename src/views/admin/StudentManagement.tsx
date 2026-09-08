import React, { useState, useEffect } from 'react';
import { StudentUser } from '../../types';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
  X,
  Lock,
  Mail,
  Phone,
  GraduationCap,
} from 'lucide-react';

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [semesterFilter, setSemesterFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentUser | null>(null);
  const [viewingStudent, setViewingStudent] = useState<StudentUser | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StudentUser | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    uid: '',
    name: '',
    class: 'S5 CSE A',
    email: '',
    phone: '',
    gender: 'Female',
    department: 'Computer Science & Engineering',
    semester: 'S5',
    cgpa: '8.50',
    completed_credits: '84',
    signature: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students');
      if (res.ok) {
        setStudents(await res.json());
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const openAddModal = () => {
    setFormData({
      uid: `RSET2024CSE00${students.length + 1}`,
      name: '',
      class: 'S5 CSE A',
      email: '',
      phone: '+91 94470 00000',
      gender: 'Female',
      department: 'Computer Science & Engineering',
      semester: 'S5',
      cgpa: '8.50',
      completed_credits: '84',
      signature: '',
    });
    setFormError(null);
    setShowAddModal(true);
  };

  const openEditModal = (student: StudentUser) => {
    setFormData({
      uid: student.uid,
      name: student.name,
      class: student.class,
      email: student.email,
      phone: student.phone,
      gender: student.gender,
      department: student.department,
      semester: student.semester,
      cgpa: student.cgpa,
      completed_credits: student.completed_credits,
      signature: student.signature,
    });
    setFormError(null);
    setEditingStudent(student);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add student');
      }

      setActionSuccess(`Student ${formData.name} (${formData.uid}) enrolled and initialized in students.csv.`);
      setShowAddModal(false);
      fetchStudents();
    } catch (err: any) {
      setFormError(err.message || 'Error creating student');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setFormSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/students/${editingStudent.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-role': 'admin',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update student');
      }

      setActionSuccess(`Record for ${editingStudent.name} (${editingStudent.uid}) updated in students.csv.`);
      setEditingStudent(null);
      fetchStudents();
    } catch (err: any) {
      setFormError(err.message || 'Error updating student');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;
    try {
      const res = await fetch(`/api/students/${deletingStudent.uid}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete student');
      }

      setActionSuccess(`Student ${deletingStudent.name} and related records removed across all CSV files.`);
      setDeletingStudent(null);
      fetchStudents();
    } catch (err: any) {
      alert(err.message || 'Failed to delete student');
    }
  };

  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.uid.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchClass = classFilter === 'All' || s.class === classFilter;
    const matchSem = semesterFilter === 'All' || s.semester === semesterFilter;
    return matchSearch && matchClass && matchSem;
  });

  const availableClasses = Array.from(new Set(students.map((s) => s.class))).filter(Boolean);
  const availableSemesters = Array.from(new Set(students.map((s) => s.semester))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Student Directory & Records</h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Maintain institutional student registry, academic status, and enrollments.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-950 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-900 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Enroll New Student</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, Register No (UID), or Email..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-600">Class:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
            >
              <option value="All">All Classes</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-600">Semester:</span>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
            >
              <option value="All">All Semesters</option>
              {availableSemesters.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3.5">Student</th>
                <th className="px-4 py-3.5">Register No (UID)</th>
                <th className="px-4 py-3.5">Class / Sem</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-3 py-3.5 text-center">CGPA</th>
                <th className="px-3 py-3.5 text-center">Credits</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((student) => (
                <tr key={student.uid} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={student.photo || '/assets/default_student_avatar.svg'}
                        alt={student.name}
                        className="h-8 w-8 rounded-full border border-slate-200 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/default_student_avatar.svg';
                        }}
                      />
                      <div>
                        <div className="font-bold text-slate-900">{student.name}</div>
                        <div className="text-[11px] text-slate-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-indigo-950">{student.uid}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-800">
                      {student.class}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{student.department}</td>
                  <td className="px-3 py-3 text-center font-bold text-slate-900">{student.cgpa}</td>
                  <td className="px-3 py-3 text-center font-semibold text-slate-700">
                    {student.completed_credits}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setViewingStudent(student)}
                        title="View Profile"
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(student)}
                        title="Edit Student"
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-700"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingStudent(student)}
                        title="Delete Student"
                        className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {(showAddModal || editingStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">
                {showAddModal ? 'Enroll New Student' : `Edit Student: ${editingStudent?.name}`}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingStudent(null);
                }}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form
              onSubmit={showAddModal ? handleAddSubmit : handleEditSubmit}
              className="mt-4 space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="font-bold text-slate-700">Register Number (UID)</label>
                  <input
                    type="text"
                    required
                    disabled={!showAddModal}
                    value={formData.uid}
                    onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 font-mono font-medium text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Class</label>
                  <input
                    type="text"
                    required
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 font-medium text-slate-900"
                  >
                    {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Institutional Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Phone</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Official CGPA</label>
                  <input
                    type="text"
                    value={formData.cgpa}
                    onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Completed Credits</label>
                  <input
                    type="text"
                    value={formData.completed_credits}
                    onChange={(e) => setFormData({ ...formData, completed_credits: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Department</label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-slate-300 p-2 font-medium text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingStudent(null);
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-lg bg-indigo-950 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-900 disabled:opacity-50"
                >
                  {formSubmitting
                    ? 'Saving...'
                    : showAddModal
                    ? 'Enroll & Initialize'
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
                <Trash2 className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Confirm Student Removal</h2>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900">{deletingStudent.name}</strong> (
              <span className="font-mono font-bold text-indigo-950">{deletingStudent.uid}</span>)?
            </p>

            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-[11px] text-rose-900">
              <strong>Cascading CSV Warning:</strong> This operation will automatically remove all
              corresponding entries from <code className="font-mono">students.csv</code>,{' '}
              <code className="font-mono">attendance.csv</code>, <code className="font-mono">marks.csv</code>,{' '}
              <code className="font-mono">end_semester_results.csv</code>, and{' '}
              <code className="font-mono">activities.csv</code>.
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeletingStudent(null)}
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Profile Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Student Profile Overview</h2>
              <button
                onClick={() => setViewingStudent(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-4 border-b border-slate-100 pb-4">
              <img
                src={viewingStudent.photo || '/assets/default_student_avatar.svg'}
                alt={viewingStudent.name}
                className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/default_student_avatar.svg';
                }}
              />
              <div>
                <h3 className="text-base font-bold text-slate-900">{viewingStudent.name}</h3>
                <p className="font-mono text-xs font-bold text-indigo-950">{viewingStudent.uid}</p>
                <p className="text-xs text-slate-500">{viewingStudent.department}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Class:</span>
                <div className="font-semibold text-slate-800">{viewingStudent.class}</div>
              </div>
              <div>
                <span className="text-slate-400">Semester:</span>
                <div className="font-semibold text-slate-800">{viewingStudent.semester}</div>
              </div>
              <div>
                <span className="text-slate-400">Email:</span>
                <div className="font-semibold text-slate-800">{viewingStudent.email}</div>
              </div>
              <div>
                <span className="text-slate-400">Phone:</span>
                <div className="font-semibold text-slate-800">{viewingStudent.phone}</div>
              </div>
              <div>
                <span className="text-slate-400">CGPA:</span>
                <div className="font-bold text-indigo-950">{viewingStudent.cgpa} / 10.0</div>
              </div>
              <div>
                <span className="text-slate-400">Completed Credits:</span>
                <div className="font-bold text-slate-800">{viewingStudent.completed_credits} Credits</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingStudent(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
