export interface Student {
  id: string;
  uid: string;
  password: string;
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
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  teacher: string;
  semester: string;
  credits: string;
}

export interface Attendance {
  student_uid: string;
  subject_id: string;
  present_classes: string;
  total_classes: string;
  absent_classes: string;
  duty_leave_classes: string;
  last_updated: string;
}

export interface AttendanceRecord {
  id: string;
  student_uid: string;
  subject_id: string;
  class: string;
  semester: string;
  date: string;
  period: string;
  status: 'Present' | 'Absent' | 'Duty Leave';
}

export interface Marks {
  student_uid: string;
  subject_id: string;
  internal1: string;
  internal2: string;
  assignment: string;
  project: string;
  max_internal1: string;
  max_internal2: string;
  max_assignment: string;
  max_project: string;
}

export interface Activity {
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

export interface Feedback {
  id: string;
  teacher: string;
  subject: string;
  subject_code: string;
  semester: string;
  academic_year: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
  q7: string;
  q8: string;
  q9: string;
  q10: string;
  score: string;
  comments: string;
  submitted_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  date: string;
  category: string;
  author: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  category: string;
}

export interface TimetableEntry {
  id: string;
  day: string;
  time: string;
  subject: string;
  room: string;
  teacher: string;
  class: string;
}

export interface Bus {
  id: string;
  bus_no: string;
  route_name: string;
  stops: string;
  current_stop: string;
  status: 'On Time' | 'Delayed' | 'Departed' | 'At Stop' | 'Inactive';
  driver_name: string;
  driver_phone: string;
}

export interface Examination {
  id: string;
  semester: string;
  course_code: string;
  course_title: string;
  exam_date: string;
  session_time: string;
  hall_no: string;
  exam_centre: string;
}

export interface ExamAllocation {
  student_uid: string;
  exam_name: string;
  subject: string;
  exam_date: string;
  exam_time: string;
  venue: string;
  room: string;
  seat_no: string;
}

export interface EndSemesterResult {
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
