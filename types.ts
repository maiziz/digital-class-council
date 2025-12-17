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

// --- Multi-Term Types ---
export type TermId = 1 | 2 | 3;

export interface TermData {
  rank: number;
  avg: number;
  marks: Marks;
  council_data: CouncilData;
}

export interface AnnualData {
  avg: number;
  rank: number;
  decision: string; // Admitted (ينتقل) / Repeat (يعيد) / Redirect (يوجه)
}

export interface Student {
  id: string;
  name: string;
  gender: 'M' | 'F';
  birthDate: string; // Format: DD/MM/YYYY
  registrationNumber: string; // Student registration number (ر.ت)
  
  // Data for each term
  terms: Record<TermId, TermData>;
  
  // Annual Summary
  annual: AnnualData;
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
  
  // Annual Decision Thresholds
  // Annual Decision Thresholds
  admissionThreshold: number; // usually 10

  // General Settings
  schoolName: string;
  schoolYear: string;
  district: string;

  // Report Card Settings
  showRank: boolean;
  showDecision: boolean;
  showPhoto: boolean;
  printColor: boolean; // Toggle for colored print or B&W optimized
  
  // Theme
  primaryColor: string;

  // Coefficients
  coefficients: Record<SubjectKey, number>;
}

export const DEFAULT_CONFIG: AppConfig = {
  excellence: 18,
  congrats: 16,
  encouragement: 14,
  honor: 12,
  admissionThreshold: 10,
  
  schoolName: "ثانوية: الشيخ بوعمامة",
  schoolYear: "2024/2025",
  district: "وسط الجزائر",
  
  showRank: true,
  showDecision: true,
  showPhoto: false,
  printColor: true,
  
  primaryColor: "blue", // blue, purple, emerald, rose

  // Default Coefficients (1 for all)
  coefficients: {
    math: 1, phys: 1, sci: 1,
    arab: 1, fr: 1, eng: 1,
    hist: 1, civ: 1, isl: 1,
    art: 1, mus: 1, pe: 1
  }
};

export type Tab = 'analysis' | 'teachers' | 'review' | 'bulletins' | 'settings' | 'management';

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