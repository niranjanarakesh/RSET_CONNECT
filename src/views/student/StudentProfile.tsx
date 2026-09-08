import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser } from '../../types';
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Camera,
  Printer,
  CreditCard,
  QrCode,
  GraduationCap,
} from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { user, updateCurrentUser } = useAuth();
  const student = user as StudentUser;

  const [phone, setPhone] = useState(student?.phone || '');
  const [email, setEmail] = useState(student?.email || '');
  const [signature, setSignature] = useState(student?.signature || '');
  const [photoUrl, setPhotoUrl] = useState(student?.photo || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [idCardSide, setIdCardSide] = useState<'front' | 'back'>('front');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Failed to upload photo');
      const uploadData = await uploadRes.json();
      const newPhoto = uploadData.fileUrl;

      // Update student profile in students.csv
      const updateRes = await fetch(`/api/students/${student.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-role': 'student',
        },
        body: JSON.stringify({ photo: newPhoto }),
      });

      if (!updateRes.ok) throw new Error('Failed to update student profile photo');

      setPhotoUrl(newPhoto);
      updateCurrentUser({ photo: newPhoto });
      setSuccessMsg('Profile photo updated successfully.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/students/${student.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-role': 'student',
        },
        body: JSON.stringify({
          phone,
          email,
          signature,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      updateCurrentUser({ phone, email, signature });
      setSuccessMsg('Profile contact information updated successfully.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating student record');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintIdCard = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Student Profile & Identity</h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Institutional identity records and student academic profile dossier.
          </p>
        </div>

        <button
          onClick={handlePrintIdCard}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Digital ID Card</span>
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

      {/* Grid: Profile Form and Digital Student ID Card */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Form (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
          {/* Top Profile Summary */}
          <div className="flex flex-col gap-6 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">
            <div className="relative">
              <img
                src={photoUrl || student?.photo || '/assets/default_student_avatar.svg'}
                alt={student?.name}
                className="h-24 w-24 rounded-2xl border-2 border-slate-200 object-cover p-1 shadow-xs"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/default_student_avatar.svg';
                }}
              />
              <label
                htmlFor="profile-photo-upload"
                className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-indigo-950 text-white shadow-md hover:bg-indigo-900"
                title="Change Photo"
              >
                <Camera className="h-4 w-4" />
                <input
                  id="profile-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
              </label>
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{student?.name}</h2>
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                  {student?.class}
                </span>
              </div>
              <p className="text-xs text-slate-500">{student?.department}</p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span>
                  UID: <strong className="font-mono text-slate-900">{student?.uid}</strong>
                </span>
                <span>
                  Semester: <strong className="text-slate-900">{student?.semester}</strong>
                </span>
                <span>
                  Gender: <strong className="text-slate-900">{student?.gender}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Form for editable & read-only fields */}
          <form onSubmit={handleSave} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Read-only: UID */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                  <Lock className="h-3 w-3 text-slate-400" />
                  <span>Student UID (Locked)</span>
                </label>
                <input
                  type="text"
                  disabled
                  value={student?.uid || ''}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-100/70 px-3 py-2 text-xs font-mono font-medium text-slate-600 cursor-not-allowed"
                />
              </div>

              {/* Read-only: Full Name */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                  <Lock className="h-3 w-3 text-slate-400" />
                  <span>Full Name (Locked)</span>
                </label>
                <input
                  type="text"
                  disabled
                  value={student?.name || ''}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-100/70 px-3 py-2 text-xs font-medium text-slate-600 cursor-not-allowed"
                />
              </div>

              {/* Read-only: Academic Program / Dept */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                  <Lock className="h-3 w-3 text-slate-400" />
                  <span>Department (Locked)</span>
                </label>
                <input
                  type="text"
                  disabled
                  value={student?.department || ''}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-100/70 px-3 py-2 text-xs font-medium text-slate-600 cursor-not-allowed"
                />
              </div>

              {/* Read-only: CGPA */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                  <Lock className="h-3 w-3 text-slate-400" />
                  <span>Official Cumulative CGPA (Locked)</span>
                </label>
                <input
                  type="text"
                  disabled
                  value={student?.cgpa || '0.00'}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-100/70 px-3 py-2 text-xs font-bold text-indigo-950 cursor-not-allowed"
                />
              </div>

              {/* Read-only: Completed Credits */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                  <Lock className="h-3 w-3 text-slate-400" />
                  <span>Completed Credits (Locked)</span>
                </label>
                <input
                  type="text"
                  disabled
                  value={student?.completed_credits || '0'}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-100/70 px-3 py-2 text-xs font-bold text-slate-700 cursor-not-allowed"
                />
              </div>

              {/* Editable: Phone */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Phone className="h-3 w-3 text-indigo-600" />
                  <span>Contact Phone Number</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              {/* Editable: Institutional Email */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Mail className="h-3 w-3 text-indigo-600" />
                  <span>Institutional Email</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              {/* Editable: Signature */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <User className="h-3 w-3 text-indigo-600" />
                  <span>Official Digital Signature (Name)</span>
                </label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Name as signed on certificates"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <ShieldAlert className="h-3.5 w-3.5 text-indigo-600" />
                <span>Administrative Authorization Constraint</span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Students cannot edit UID, academic department, CGPA, or credits. Any corrections must
                be requested through the Deanery of Academics.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-950 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-indigo-900 focus:outline-none disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Digital Student ID Card (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
              <CreditCard className="h-4 w-4 text-indigo-700" />
              <span>Digital Identity Card</span>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-[11px]">
              <button
                onClick={() => setIdCardSide('front')}
                className={`rounded px-2 py-0.5 font-bold ${
                  idCardSide === 'front' ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-500'
                }`}
              >
                Front
              </button>
              <button
                onClick={() => setIdCardSide('back')}
                className={`rounded px-2 py-0.5 font-bold ${
                  idCardSide === 'back' ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-500'
                }`}
              >
                Back
              </button>
            </div>
          </div>

          {/* ID Card Front */}
          {idCardSide === 'front' ? (
            <div className="overflow-hidden rounded-2xl border-2 border-indigo-950/20 bg-gradient-to-b from-white to-slate-50 p-5 shadow-md">
              <div className="border-b border-indigo-900/10 pb-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-950 font-bold text-white text-xs">
                    RS
                  </div>
                  <span className="font-serif text-xs font-extrabold tracking-wide text-indigo-950">
                    RAJAGIRI (RSET)
                  </span>
                </div>
                <p className="mt-0.5 text-[9px] uppercase tracking-wider text-slate-500">
                  School of Engineering & Technology
                </p>
                <div className="mt-1 inline-block rounded bg-indigo-950 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                  Student Identity Card
                </div>
              </div>

              <div className="mt-4 flex flex-col items-center text-center">
                <img
                  src={photoUrl || student?.photo || '/assets/default_student_avatar.svg'}
                  alt="Student ID"
                  className="h-28 w-24 rounded-lg border-2 border-slate-300 object-cover shadow-xs"
                />
                <h3 className="mt-2 text-sm font-bold text-slate-900">{student?.name}</h3>
                <span className="font-mono text-xs font-extrabold text-indigo-950">{student?.uid}</span>
                <span className="text-[11px] font-medium text-slate-600">{student?.class}</span>
                <span className="text-[10px] text-slate-500">{student?.department}</span>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Valid Till:</span>
                  <span className="font-semibold text-slate-800">June 2028</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Blood Group:</span>
                  <span className="font-semibold text-slate-800">O +ve</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Emergency Contact:</span>
                  <span className="font-mono font-medium text-slate-800">{student?.phone}</span>
                </div>
              </div>
            </div>
          ) : (
            /* ID Card Back */
            <div className="flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-indigo-950/20 bg-slate-900 p-5 text-white shadow-md min-h-[360px]">
              <div>
                <div className="border-b border-slate-700 pb-2 text-center text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Institutional Instructions
                </div>
                <p className="mt-3 text-[10px] leading-relaxed text-slate-300">
                  1. This card is non-transferable and remains institutional property of RSET.
                  <br />
                  2. Mandatory for campus entry, library access, laboratory sessions, and autonomous examinations.
                  <br />
                  3. If lost or found, please return to the Principal’s Office, RSET Rajagiri Valley, Kakkanad, Kochi - 682039.
                </p>
              </div>

              <div className="mt-6 border-t border-slate-700 pt-4 flex flex-col items-center text-center">
                <div className="h-10 w-44 rounded bg-white p-1 flex items-center justify-center">
                  <span className="font-mono text-[10px] font-bold text-slate-900 tracking-widest">
                    ||||| ||| ||||||| |||||
                  </span>
                </div>
                <span className="mt-1 font-mono text-[9px] text-slate-400">{student?.uid}</span>
                <span className="mt-3 text-[9px] font-bold text-indigo-300 uppercase tracking-wider">
                  Dean of Student Affairs
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
