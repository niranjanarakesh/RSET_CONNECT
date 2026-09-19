import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LogOut,
  ExternalLink,
  Menu,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';
import { StudentUser } from '../../types';

interface NavbarProps {
  onToggleSidebar: () => void;
  activeView?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, role, logout } = useAuth();
  const rexaUrl = import.meta.env.VITE_REXA_PORTAL_URL || 'https://student.rajagiritech.ac.in/';

  const isStudent = role === 'student';
  const student = isStudent ? (user as StudentUser) : null;

  return (
    <header className="shrink-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 print:hidden">
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

      {/* Center/Right section: External Rexa Link, User Profile, Logout */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
