import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LogOut,
  ExternalLink,
  Menu,
  ShieldCheck,
  GraduationCap,
  ArrowLeftRight,
  ChevronDown,
} from 'lucide-react';
import { StudentUser } from '../../types';

interface NavbarProps {
  onToggleSidebar: () => void;
  activeView?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, role, logout, switchToStudent, switchToAdmin } = useAuth();
  const rexaUrl = import.meta.env.VITE_REXA_PORTAL_URL || 'https://student.rajagiritech.ac.in/';

  const [studentsList, setStudentsList] = useState<StudentUser[]>([]);
  const [showSwitchDropdown, setShowSwitchDropdown] = useState(false);

  const isStudent = role === 'student';
  const student = isStudent ? (user as StudentUser) : null;

  useEffect(() => {
    // Fetch students list for quick tester switcher
    fetch('/api/students')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setStudentsList(data))
      .catch(() => {});
  }, []);

  return (
    <header className="shrink-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      {/* Left section: Hamburger & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-950 font-bold text-white shadow-xs">
            <span className="text-sm tracking-wider">RS</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900 shrink-0">RSMS Connect</span>
              <span className="hidden rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 sm:inline-block shrink-0">
                Autonomous Portal
              </span>
            </div>
            <p className="hidden text-[11px] text-slate-500 xl:block truncate max-w-xs">
              Rajagiri School of Engineering & Technology (Autonomous)
            </p>
          </div>
        </div>
      </div>

      {/* Center/Right section: External Rexa Link, Quick Switcher, User Profile, Logout */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Role / Student Switcher for seamless testing */}
        <div className="relative">
          <button
            onClick={() => setShowSwitchDropdown((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            title="Quick Role / Student Switcher"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Switch Role</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {showSwitchDropdown && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 text-xs">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Identity (Instant Demo)
              </div>

              {/* Admin Button */}
              <button
                onClick={() => {
                  switchToAdmin();
                  setShowSwitchDropdown(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
                  role === 'admin'
                    ? 'bg-indigo-50 text-indigo-950 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="h-4 w-4 text-indigo-700" />
                <div className="flex-1">
                  <div className="font-semibold">Academic Controller</div>
                  <div className="text-[10px] text-slate-500">Admin Portal</div>
                </div>
              </button>

              <div className="my-1 border-t border-slate-100" />

              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Enrolled Student
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1">
                {studentsList.map((st) => (
                  <button
                    key={st.uid}
                    onClick={() => {
                      switchToStudent(st.uid);
                      setShowSwitchDropdown(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                      student?.uid === st.uid
                        ? 'bg-indigo-50 text-indigo-950 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <GraduationCap className="h-3.5 w-3.5 text-indigo-600" />
                    <div className="flex-1 truncate">
                      <div className="truncate font-medium">{st.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {st.uid} • {st.class}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rexa Portal Link */}
        <a
          href={rexaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-1.5 text-xs font-semibold text-indigo-800 transition-colors hover:bg-indigo-100 md:inline-flex"
          title="Open Official REXA Examination Portal"
        >
          <GraduationCap className="h-3.5 w-3.5 text-indigo-700" />
          <span>REXA Portal</span>
          <ExternalLink className="h-3 w-3 text-indigo-500" />
        </a>

        {/* User Identity Chip */}
        {user && (
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1.5 pr-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-700 overflow-hidden">
              {isStudent ? (
                <img
                  src={student?.photo || '/assets/default_student_avatar.svg'}
                  alt="Student"
                  className="h-7 w-7 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/default_student_avatar.svg';
                  }}
                />
              ) : (
                <ShieldCheck className="h-4 w-4 text-indigo-700" />
              )}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900">
                {isStudent ? student?.name : 'Administrator'}
              </span>
              <span className="text-[10px] font-medium text-slate-500">
                {isStudent ? `${student?.uid} (${student?.class})` : 'Academic Controller'}
              </span>
            </div>
          </div>
        )}

        {/* Logout button */}
        <button
          onClick={logout}
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/60 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 hover:text-rose-800"
          title="Sign out of RSMS Connect"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
