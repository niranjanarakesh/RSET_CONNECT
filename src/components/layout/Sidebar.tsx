import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { normalizeNavigationId } from '../../utils/navigation';
import {
  LayoutDashboard,
  User,
  Clock,
  FileSpreadsheet,
  GraduationCap,
  Award,
  MessageSquareQuote,
  CalendarDays,
  Bell,
  Calendar,
  Bus,
  Ticket,
  Users,
  CalendarClock,
  CheckSquare,
  Megaphone,
  BarChart3,
  Download,
  LogOut,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentView?: string;
  activeView?: string;
  onSelectView: (viewId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  activeView,
  onSelectView,
  isOpen,
  onClose,
}) => {
  const { role, logout } = useAuth();
  const isStudent = role === 'student';
  const activeCurrent = currentView || activeView || '';
  const normalizedActive = normalizeNavigationId(activeCurrent, role);

  const studentNavItems = [
    { id: 'student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'student-profile', label: 'My Profile', icon: User },
    { id: 'student-attendance', label: 'Attendance', icon: Clock },
    { id: 'student-marks', label: 'Internal Marks', icon: FileSpreadsheet },
    { id: 'student-results', label: 'End-Semester Results', icon: GraduationCap, badge: 'Rexa' },
    { id: 'student-activities', label: 'Activity Points', icon: Award },
    { id: 'student-feedback', label: 'Feedback', icon: MessageSquareQuote },
    { id: 'student-timetable', label: 'Timetable', icon: CalendarDays },
    { id: 'student-announcements', label: 'Announcements', icon: Bell },
    { id: 'student-events', label: 'Events', icon: Calendar },
    { id: 'student-buses', label: 'Bus Tracking', icon: Bus },
    { id: 'student-hallticket', label: 'Hall Ticket', icon: Ticket },
  ];

  const adminNavItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-students', label: 'Students', icon: Users },
    { id: 'admin-examinations', label: 'Examinations', icon: CalendarClock },
    { id: 'admin-attendance-marks', label: 'Attendance & Marks', icon: CheckSquare },
    { id: 'admin-activities', label: 'Activity Approvals', icon: Award },
    { id: 'admin-announcements', label: 'Announcements', icon: Megaphone },
    { id: 'admin-buses', label: 'Bus Management', icon: Bus },
    { id: 'admin-feedback', label: 'Feedback Analytics', icon: BarChart3 },
    { id: 'admin-events', label: 'Events', icon: Calendar },
    { id: 'admin-timetable', label: 'Timetable', icon: CalendarDays },
    { id: 'admin-rexa', label: 'Rexa Results', icon: GraduationCap, badge: 'CSV Import' },
    { id: 'admin-export', label: 'Data Export', icon: Download },
  ];

  const navItems = isStudent ? studentNavItems : adminNavItems;

  const handleItemClick = (id: string) => {
    onSelectView(id);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:relative lg:inset-auto lg:z-auto lg:h-full lg:w-64 lg:shrink-0 lg:shadow-none ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-900 font-bold text-white">
              <span className="text-xs">RS</span>
            </div>
            <span className="font-bold text-slate-900">RSMS Connect</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section title */}
        <div className="px-4 pt-4 pb-2 shrink-0">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            {isStudent ? 'Student Portal' : 'Admin Management'}
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === normalizedActive;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-950 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-indigo-800 text-indigo-100'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info & Logout */}
        <div className="border-t border-slate-200 p-3 shrink-0">
          <div className="mb-2 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-500">
            <div className="font-semibold text-slate-700">Rajagiri RSMS Connect</div>
            <div className="mt-0.5 text-[10px] text-slate-500">
              {isStudent ? 'Autonomous Student Portal' : 'Autonomous Academic Controller'}
            </div>
            <div className="mt-0.5 text-[10px] font-medium text-indigo-700">
              Academic Session 2025-26
            </div>
          </div>

          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
