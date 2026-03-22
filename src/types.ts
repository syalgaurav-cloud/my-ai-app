export type Subject = 
  | 'Biology' 
  | 'Chemistry' 
  | 'Computer Science' 
  | 'Economics' 
  | 'English'
  | 'English Language' 
  | 'English Literature'
  | 'French'
  | 'Food & Nutrition'
  | 'History'
  | 'Mathematics' 
  | 'Maths'
  | 'Further Maths'
  | 'Physics' 
  | 'Politics' 
  | 'Psychology'
  | 'Religious Studies' 
  | 'Spanish'
  | 'PSHCE';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: 'student' | 'parent';
  password?: string; // For demo login
  parentEmail?: string;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate?: string;
  weakTopics: string[];
  strongTopics: string[];
  yearGroup: number;
  schoolName: string;
  children?: string[]; // For parents
  academicReport?: AcademicReport;
}

export interface ReportSubject {
  name: string;
  current: number | string; // Percentage or Grade
  target?: number | string; // Target Grade or Avg
  average?: number | string; // Year Group Average
  attitude?: {
    organised: string;
    engages: string;
    responsibility: string;
  };
}

export interface AcademicReport {
  title: string;
  date: string;
  attendance: number;
  readingAge?: string;
  subjects: ReportSubject[];
}

export interface Task {
  id: string;
  subject: Subject;
  topic: string;
  status: 'pending' | 'completed';
  content: string; // Markdown content for teaching
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  subject: Subject;
  topic: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
}

export interface DailyPlan {
  id: string;
  uid: string;
  date: string; // YYYY-MM-DD
  tasks: Task[];
  completed: boolean;
}

export interface AssessmentResult {
  id: string;
  uid: string;
  date: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
  strengths: string[];
  weaknesses: string[];
  subjectPerformance?: { [subject: string]: { score: number, total: number } };
  improvementTrend: string;
}

export interface ParentReport {
  id: string;
  uid: string;
  date: string;
  sent: boolean;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface SchoolEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'holiday' | 'exam' | 'event' | 'deadline';
  description?: string;
  uid: string; // Parent or student who added it (or 'system' for public)
}
