import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, GraduationCap, ArrowRight, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(identifier, password, activeTab);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (type: 'student_normal' | 'student_warning' | 'admin') => {
    setError(null);
    if (type === 'student_normal') {
      setActiveTab('student');
      setIdentifier('RSET2024CSE001');
      setPassword('student123');
    } else if (type === 'student_warning') {
      setActiveTab('student');
      setIdentifier('RSET2024CSE004');
      setPassword('student123');
    } else {
      setActiveTab('admin');
      setIdentifier('admin');
      setPassword('admin123');
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-100/80 px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* College Crest & Branding */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-950 shadow-md">
            <GraduationCap className="h-8 w-8 text-indigo-300" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            RSMS Connect
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Rajagiri Student Management System
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/80 px-3 py-0.5 text-xs font-semibold text-indigo-800">
            <span>Rajagiri School of Engineering & Technology (Autonomous)</span>
          </div>
        </div>

        {/* Card */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
          {/* Tab Selector */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('student');
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                activeTab === 'student'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Student Portal</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                activeTab === 'admin'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Administrator</span>
            </button>
          </div>

          {/* Form */}
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="identifier"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                {activeTab === 'student' ? 'UID or Institutional Email' : 'Username'}
              </label>
              <input
                id="identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  activeTab === 'student'
                    ? 'e.g. RSET2024CSE001 or student@rajagiri.edu.in'
                    : 'e.g. admin'
                }
                className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-950 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-900 focus:outline-none disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : `Sign in to ${activeTab === 'student' ? 'Student' : 'Admin'} Portal`}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Demo Quick Fill Actions */}
          <div className="mt-6 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
              <span>Quick Demo Credentials</span>
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setDemoCredentials('student_normal')}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100"
              >
                <span className="font-medium">Student: Brinda Raj (S5 CSE A)</span>
                <span className="font-mono text-[10px] text-indigo-700">RSET2024CSE001</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('student_warning')}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-1.5 text-left text-xs text-amber-900 hover:bg-amber-100/50"
              >
                <span className="font-medium">Student: Rohit Menon (Low Attendance)</span>
                <span className="font-mono text-[10px] text-amber-700">RSET2024CSE004</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('admin')}
                className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/50 px-3 py-1.5 text-left text-xs text-indigo-900 hover:bg-indigo-100/50"
              >
                <span className="font-medium">Admin: Academic Controller</span>
                <span className="font-mono text-[10px] text-indigo-700">admin / admin123</span>
              </button>
            </div>
          </div>

          {/* Institutional note */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
            <span>Autonomous Academic Portal • RSET RSMS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
