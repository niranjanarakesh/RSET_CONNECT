export type StudentNavId =
  | 'student-dashboard'
  | 'student-profile'
  | 'student-attendance'
  | 'student-marks'
  | 'student-results'
  | 'student-activities'
  | 'student-feedback'
  | 'student-timetable'
  | 'student-announcements'
  | 'student-events'
  | 'student-buses'
  | 'student-hallticket';

export type AdminNavId =
  | 'admin-dashboard'
  | 'admin-students'
  | 'admin-examinations'
  | 'admin-attendance-marks'
  | 'admin-activities'
  | 'admin-announcements'
  | 'admin-buses'
  | 'admin-feedback'
  | 'admin-events'
  | 'admin-timetable'
  | 'admin-rexa'
  | 'admin-export';

export type NavigationId = StudentNavId | AdminNavId;

/**
 * Normalizes any navigation string or shorthand (e.g. "dashboard", "buses", "results", "marks")
 * to its exact canonical ID system for students and administrators.
 */
export function normalizeNavigationId(rawId: string, role: string): NavigationId {
  const cleaned = (rawId || '').trim().toLowerCase();

  if (role === 'admin') {
    switch (cleaned) {
      case 'dashboard':
      case 'admin-dashboard':
        return 'admin-dashboard';
      case 'students':
      case 'admin-students':
        return 'admin-students';
      case 'examinations':
      case 'admin-examinations':
        return 'admin-examinations';
      case 'attendance-marks':
      case 'attendance':
      case 'marks':
      case 'admin-attendance-marks':
        return 'admin-attendance-marks';
      case 'activities':
      case 'admin-activities':
        return 'admin-activities';
      case 'announcements':
      case 'admin-announcements':
        return 'admin-announcements';
      case 'buses':
      case 'bus':
      case 'admin-buses':
        return 'admin-buses';
      case 'feedback':
      case 'admin-feedback':
        return 'admin-feedback';
      case 'events':
      case 'admin-events':
        return 'admin-events';
      case 'timetable':
      case 'admin-timetable':
        return 'admin-timetable';
      case 'rexa':
      case 'results':
      case 'admin-rexa':
        return 'admin-rexa';
      case 'export':
      case 'admin-export':
        return 'admin-export';
      default:
        return 'admin-dashboard';
    }
  }

  // Student role
  switch (cleaned) {
    case 'dashboard':
    case 'student-dashboard':
      return 'student-dashboard';
    case 'profile':
    case 'student-profile':
      return 'student-profile';
    case 'attendance':
    case 'student-attendance':
      return 'student-attendance';
    case 'marks':
    case 'student-marks':
      return 'student-marks';
    case 'results':
    case 'rexa':
    case 'student-results':
      return 'student-results';
    case 'activities':
    case 'student-activities':
      return 'student-activities';
    case 'feedback':
    case 'student-feedback':
      return 'student-feedback';
    case 'timetable':
    case 'student-timetable':
      return 'student-timetable';
    case 'announcements':
    case 'student-announcements':
      return 'student-announcements';
    case 'events':
    case 'student-events':
      return 'student-events';
    case 'buses':
    case 'bus':
    case 'student-buses':
      return 'student-buses';
    case 'hall-ticket':
    case 'hallticket':
    case 'student-hall-ticket':
    case 'student-hallticket':
      return 'student-hallticket';
    default:
      return 'student-dashboard';
  }
}
