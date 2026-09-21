export interface StudentUser {
  id: string;
  uid: string;
  name: string;
  class: string;
  email: string;
  phone: string;
  gender: string;
  department: string;
  semester: string;
  cgpa: string;
  completed_credits: string;
  photo: string;
  signature: string;
  role: 'student';
}

export interface AdminUser {
  username: string;
  name: string;
  role: 'admin';
  department: string;
  email: string;
}

export type AuthUser = StudentUser | AdminUser;

export interface SubjectItem {
  id: string;
  code: string;
  name: string;
  teacher: string;
  semester: string;
  credits: string;
}

export interface SubjectAttendance {
  subject_id: string;
  code: string;
  name: string;
  teacher: string;
  semester: string;
  credits: string;
  present_classes: number;
  absent_classes: number;
  duty_leave_classes: number;
  total_classes: number;
  percentage: number;
  status: 'Safe' | 'Warning' | 'Critical';
  last_updated: string;
}

export interface AttendanceResponse {
  student_uid: string;
  overall: {
    total_classes: number;
    present_classes: number;
    absent_classes: number;
    duty_leave_classes: number;
    percentage: number;
    status: 'Safe' | 'Warning' | 'Critical';
    required_classes_for_75: number;
    safe_bunks: number;
  };
  subject_wise: SubjectAttendance[];
  recent_records: AttendanceRecordDetail[];
}

export interface AttendanceRecordDetail {
  id: string;
  student_uid: string;
  subject_id: string;
  subject_name?: string;
  subject_code?: string;
  class: string;
  semester: string;
  date: string;
  period: string;
  status: 'Present' | 'Absent' | 'Duty Leave';
}

export interface SubjectMarks {
  subject_id: string;
  code: string;
  name: string;
  teacher: string;
  semester: string;
  credits: string;
  internal1: number | null;
  internal2: number | null;
  assignment: number | null;
  project: number | null;
  max_internal1: number;
  max_internal2: number;
  max_assignment: number;
  max_project: number;
  total_obtained: number | null;
  max_total: number;
  percentage: number | null;
}

export interface MarksResponse {
  student_uid: string;
  summary: {
    total_obtained: number;
    max_marks: number;
    percentage: number;
  };
  marks: SubjectMarks[];
}

export interface CourseResultItem {
  student_uid: string;
  semester: string;
  academic_year: string;
  course_code: string;
  course_title: string;
  credits: string;
  grade: string;
  grade_point: string;
  max_marks: string;
  marks_obtained: string;
  result_status: 'PASS' | 'FAIL' | 'SUPPLEMENTARY';
  published_date: string;
}

export interface EndSemesterResultsResponse {
  student_uid: string;
  student_name: string;
  program: string;
  department: string;
  current_class: string;
  selected_semester: string;
  academic_year: string;
  published_date: string;
  available_semesters: string[];
  available_academic_years: string[];
  courses: CourseResultItem[];
  metrics: {
    total_credits: number;
    credits_earned: number;
    sgpa: number;
    cgpa: number;
    cumulative_credits_earned: number;
    result_status: 'PASS' | 'FAIL' | 'SUPPLEMENTARY' | 'N/A';
  };
}

export interface ActivityItem {
  id: string;
  student_uid: string;
  semester: string;
  category: string;
  title: string;
  description: string;
  certificate_url: string;
  points: string;
  requested_points: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  remarks: string;
  submitted_at: string;
}

export interface ActivityStudentResponse {
  student_uid: string;
  summary: {
    total_approved_points: number;
    total_pending_points: number;
    rejected_count: number;
    total_submissions: number;
  };
  activities: ActivityItem[];
}

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  date: string;
  category: string;
  author: string;
}

export interface EventItemType {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  category: string;
}

export interface TimetableSlot {
  id: string;
  day: string;
  time: string;
  subject: string;
  room: string;
  teacher: string;
  class: string;
}

export interface BusItem {
  id: string;
  bus_no: string;
  route_name: string;
  stops: string;
  current_stop: string;
  status: 'On Time' | 'Delayed' | 'Departed' | 'At Stop' | 'Inactive';
  driver_name: string;
  driver_phone: string;
}

export interface ExaminationScheduleItem {
  id: string;
  semester: string;
  course_code: string;
  course_title: string;
  exam_date: string;
  session_time: string;
  hall_no: string;
  exam_centre: string;
}

export interface HallTicketExamItem {
  student_uid: string;
  exam_name: string;
  subject: string;
  exam_date: string;
  exam_time: string;
  venue: string;
  room: string;
  seat_no: string;
}

export interface HallTicketResponse {
  institution: string;
  accreditation: string;
  exam_title: string;
  student: StudentUser;
  exams: HallTicketExamItem[];
  instructions: string[];
  generated_at: string;
}

export interface FeedbackItem {
  id: string;
  student_uid?: string;
  subject_id?: string;
  subject?: string;
  subject_code?: string;
  teacher: string;
  score: string;
  comments: string;
  semester: string;
  academic_year?: string;
  submitted_at: string;
  q1?: string;
  q2?: string;
  q3?: string;
  q4?: string;
  q5?: string;
  q6?: string;
  q7?: string;
  q8?: string;
  q9?: string;
  q10?: string;
}

export interface FeedbackAnalyticsResponse {
  total_responses: number;
  average_score: number;
  rating_distribution: Record<number, number>;
  teacher_analytics: Array<{ teacher: string; responses: number; average_score: number }>;
  subject_analytics: Array<{ code: string; name: string; teacher: string; responses: number; average_score: number }>;
  feedback_records: FeedbackItem[];
}

export interface AdminDashboardData {
  total_students: number;
  average_attendance: number;
  below_75_count: number;
  below_75_students: Array<{ uid: string; name: string; class: string; percentage: number }>;
  average_marks_percentage: number;
  pending_activities_count: number;
  upcoming_examinations_count: number;
  upcoming_examinations: ExaminationScheduleItem[];
  recent_announcements: AnnouncementItem[];
  department_breakdown: Array<{ name: string; count: number }>;
}
