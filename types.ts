export type SubjectKey = 
  | 'math' | 'phys' | 'sci' | 'arab' | 'fr' | 'eng' 
  | 'hist' | 'civ' | 'isl' | 'art' | 'mus' | 'pe';

export const SUBJECTS: { key: SubjectKey; label: string }[] = [
  { key: 'math', label: 'الرياضيات' },
  { key: 'phys', label: 'الفيزياء' },
  { key: 'sci', label: 'العلوم الطبيعية' },
  { key: 'arab', label: 'اللغة العربية' },
  { key: 'fr', label: 'الفرنسية' },
  { key: 'eng', label: 'الإنجليزية' },
  { key: 'hist', label: 'التاريخ والجغرافيا' },
  { key: 'civ', label: 'التربية المدنية' },
  { key: 'isl', label: 'العلوم الإسلامية' },
  { key: 'art', label: 'التربية الفنية' },
  { key: 'mus', label: 'التربية الموسيقية' },
  { key: 'pe', label: 'التربية البدنية' },
];

export interface SubjectData {
  eval: number;
  test: number;
  exam: number;
  avg: number;
  teacher_remark: string; // Renamed from observation
}

export type Marks = Record<SubjectKey, SubjectData>;

export interface CouncilData {
  final_decision: string;
  observation: string;
  absence_status: string;
  behavior_status: string;
}

export interface Student {
  id: string; // Added ID as per spec
  rank: number;
  name: string;
  gender: 'M' | 'F'; // Added gender as per spec
  avg: number;
  marks: Marks;
  council_data: CouncilData; // New nested object
}

export interface ClassGroup {
  id: string;
  name: string;
  major: string;
  year: string;
  students: Student[];
}

export interface AppConfig {
  excellence: number;
  congrats: number;
  encouragement: number;
  honor: number;
}

export const DEFAULT_CONFIG: AppConfig = {
  excellence: 18,
  congrats: 16,
  encouragement: 14,
  honor: 12
};

export type Tab = 'analysis' | 'teachers' | 'review' | 'bulletins' | 'settings';

export const BEHAVIORS = [
  "سلوك مثالي", 
  "حسن", 
  "مشاغب", 
  "كثير الحركة"
];

export const ABSENCE_OPTIONS = [
  "مواظب", 
  "غيابات مبررة", 
  "كثير الغياب", 
  "غيابات غير مبررة"
];