import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LoginView } from './views/auth/LoginView';
import { normalizeNavigationId, NavigationId } from './utils/navigation';

// Student Views
import { StudentDashboard } from './views/student/StudentDashboard';
import { StudentProfile } from './views/student/StudentProfile';
import { StudentAttendance } from './views/student/StudentAttendance';
import { StudentMarks } from './views/student/StudentMarks';
import { StudentEndSemesterResults } from './views/student/StudentEndSemesterResults';
import { StudentActivities } from './views/student/StudentActivities';
import { StudentFeedback } from './views/student/StudentFeedback';
import { StudentTimetable } from './views/student/StudentTimetable';
import { StudentAnnouncements } from './views/student/StudentAnnouncements';
import { StudentEvents } from './views/student/StudentEvents';
import { StudentBusTracking } from './views/student/StudentBusTracking';
import { StudentHallTicket } from './views/student/StudentHallTicket';

// Admin Views
import { AdminDashboard } from './views/admin/AdminDashboard';
import { StudentManagement } from './views/admin/StudentManagement';
import { AdminAttendanceMarks } from './views/admin/AdminAttendanceMarks';
import { AdminRexaResults } from './views/admin/AdminRexaResults';
import { AdminActivityApprovals } from './views/admin/AdminActivityApprovals';
import { AdminAnnouncements } from './views/admin/AdminAnnouncements';
import { AdminBusManagement } from './views/admin/AdminBusManagement';
import { AdminFeedbackAnalytics } from './views/admin/AdminFeedbackAnalytics';
import { AdminExaminations } from './views/admin/AdminExaminations';
import { AdminEvents } from './views/admin/AdminEvents';
import { AdminTimetable } from './views/admin/AdminTimetable';
import { AdminExportData } from './views/admin/AdminExportData';

const MainApp: React.FC = () => {
  const { user, role, loading } = useAuth();
  const [currentView, setCurrentView] = useState<NavigationId>('student-dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Set default view whenever user or role changes
  useEffect(() => {
    if (user) {
      if (role === 'admin') {
        setCurrentView('admin-dashboard');
      } else {
        setCurrentView('student-dashboard');
      }
    }
  }, [role, user]);

  const handleNavigate = (view: string) => {
    const normalized = normalizeNavigationId(view, role);
    setCurrentView(normalized);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-950 border-t-transparent"></div>
          <div className="font-mono text-xs font-bold text-slate-600">
            Initializing RSMS Session...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const renderView = () => {
    switch (currentView) {
      // Student routes
      case 'student-dashboard':
        return <StudentDashboard onNavigate={handleNavigate} />;
      case 'student-profile':
        return <StudentProfile />;
      case 'student-attendance':
        return <StudentAttendance />;
      case 'student-marks':
        return <StudentMarks />;
      case 'student-results':
        return <StudentEndSemesterResults />;
      case 'student-activities':
        return <StudentActivities />;
      case 'student-feedback':
        return <StudentFeedback />;
      case 'student-timetable':
        return <StudentTimetable />;
      case 'student-announcements':
        return <StudentAnnouncements />;
      case 'student-events':
        return <StudentEvents />;
      case 'student-buses':
        return <StudentBusTracking />;
      case 'student-hallticket':
        return <StudentHallTicket />;

      // Admin routes
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={handleNavigate} />;
      case 'admin-students':
        return <StudentManagement />;
      case 'admin-attendance-marks':
        return <AdminAttendanceMarks />;
      case 'admin-rexa':
        return <AdminRexaResults />;
      case 'admin-activities':
        return <AdminActivityApprovals />;
      case 'admin-announcements':
        return <AdminAnnouncements />;
      case 'admin-buses':
        return <AdminBusManagement />;
      case 'admin-feedback':
        return <AdminFeedbackAnalytics />;
      case 'admin-examinations':
        return <AdminExaminations />;
      case 'admin-events':
        return <AdminEvents />;
      case 'admin-timetable':
        return <AdminTimetable />;
      case 'admin-export':
        return <AdminExportData />;

      default:
        return role === 'admin' ? (
          <AdminDashboard onNavigate={handleNavigate} />
        ) : (
          <StudentDashboard onNavigate={handleNavigate} />
        );
    }
  };

  return (
    <div className="h-screen h-[100dvh] w-full bg-slate-100 flex flex-col overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 min-h-0 min-w-0 w-full overflow-hidden relative print:overflow-visible print:block">
        <Sidebar
          currentView={currentView}
          onSelectView={(view) => {
            handleNavigate(view);
            setSidebarOpen(false);
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 print:p-0 print:overflow-visible">
          <div className="mx-auto max-w-7xl print:max-w-none">{renderView()}</div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
