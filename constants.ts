import { Student, Marks, ClassGroup, SubjectKey, SUBJECTS, SubjectData, BEHAVIORS, ABSENCE_OPTIONS, AppConfig, DEFAULT_CONFIG } from './types';

// Helper re-definition to avoid import cycle if getDecision was in types (it wasn't, but moving logic here is safer)
export const getDecision = (avg: number, config: AppConfig = DEFAULT_CONFIG) => {
  if (avg >= config.excellence) return 'امتياز';
  if (avg >= config.congrats) return 'تهنئة';
  if (avg >= config.encouragement) return 'تشجيع';
  if (avg >= config.honor) return 'لوحة شرف';
  if (avg >= 10) return 'بدون';
  return 'إنذار';
};

export const getBehavior = () => {
  const rand = Math.random();
  if (rand > 0.9) return BEHAVIORS[2]; // مشاغب
  if (rand > 0.8) return BEHAVIORS[3]; // كثير الحركة
  if (rand > 0.4) return BEHAVIORS[1]; // حسن
  return BEHAVIORS[0]; // سلوك مثالي
};

const getObservation = (avg: number) => {
  if (avg >= 18) return 'نتائج ممتازة، واصل.';
  if (avg >= 16) return 'عمل جيد جداً.';
  if (avg >= 14) return 'عمل جيد.';
  if (avg >= 12) return 'نتائج حسنة.';
  if (avg >= 10) return 'نتائج متوسطة، ابذل المزيد من الجهد.';
  if (avg >= 8) return 'نتائج ضعيفة، يجب استدراك الأمر.';
  return 'نتائج غير كافية، تحذير.';
};

const generateSubjectData = (baseAvg: number): SubjectData => {
  const variation = (range: number) => (Math.random() * range) - (range / 2);
  const cap = (n: number) => Math.min(20, Math.max(0, Number(n.toFixed(1))));

  // Generate sub-marks centered roughly around the baseAvg
  const evaluation = cap(baseAvg + variation(4)); // +/- 2
  const test = cap(baseAvg + variation(4));
  
  // Calculate Exam to force the final average to be close to baseAvg
  // Formula: Avg = ((Eval + Test)/2 + Exam*2) / 3
  const targetExam = (3 * (baseAvg + variation(2)) - (evaluation + test) / 2) / 2;
  const exam = cap(targetExam);

  const finalAvg = Number((((evaluation + test) / 2 + exam * 2) / 3).toFixed(2));

  return {
    eval: evaluation,
    test: test,
    exam: exam,
    avg: finalAvg,
    teacher_remark: getObservation(finalAvg)
  };
};

const generateDetailedMarks = (baseAvg: number): Marks => {
  const marks: Partial<Marks> = {};
  
  SUBJECTS.forEach(sub => {
    // Specific subject variations
    let subjectBase = baseAvg;
    if (['math', 'phys', 'sci'].includes(sub.key) && baseAvg < 10) subjectBase -= 2; // Harder subjects
    if (['sport', 'art', 'mus'].includes(sub.key)) subjectBase += 2; // Easier subjects

    marks[sub.key] = generateSubjectData(Math.min(19, Math.max(1, subjectBase)));
  });

  return marks as Marks;
};

const firstNamesM = ['أمين', 'محمد', 'كريم', 'عمر', 'رياض', 'آدم', 'بلال', 'فارس', 'يوسف', 'إبراهيم', 'خالد'];
const firstNamesF = ['سامية', 'ليديا', 'هدايات', 'سارة', 'ياسمين', 'ناديا', 'ليلى', 'صوفيا', 'شاهيناز', 'داليا', 'غيثة', 'منال', 'هدى'];
const lastNames = ['حاج أحمد', 'قاسي', 'سردواي', 'بن علي', 'منصوري', 'سعيدي', 'رحماني', 'دحماني', 'زروقي', 'بوزيد', 'لعريبي', 'محدادي', 'بلقاسم', 'شريف', 'عامر'];

const generateStudentList = (count: number, basePerformance: number): Student[] => {
  const students: Student[] = [];
  let currentAvg = basePerformance;

  for (let i = 1; i <= count; i++) {
    const isFemale = Math.random() > 0.5;
    const firstNameList = isFemale ? firstNamesF : firstNamesM;
    const name = `${lastNames[Math.floor(Math.random() * lastNames.length)]} ${firstNameList[Math.floor(Math.random() * firstNameList.length)]}`;
    
    // Decrease average slightly for next student to simulate ranking
    currentAvg -= (Math.random() * 0.4); 
    if (currentAvg < 6) currentAvg = 6;

    // Generate Terms
    const terms: Record<number, any> = {};
    let avgSum = 0;

    ([1, 2, 3] as const).forEach(termId => {
        // Variation per term (-1 to +1 points relative to base)
        const termAvgBase = Math.min(19, Math.max(5, currentAvg + (Math.random() * 2 - 1)));
        const detailedMarks = generateDetailedMarks(termAvgBase);
        const sumAvg = Object.values(detailedMarks).reduce((acc, m) => acc + m.avg, 0);
        const realAvg = Number((sumAvg / Object.keys(detailedMarks).length).toFixed(2));
        
        avgSum += realAvg;

         // Assign random absence status
        let absenceStatus = ABSENCE_OPTIONS[0]; // Punctual
        const randAbs = Math.random();
        if (randAbs > 0.95) absenceStatus = ABSENCE_OPTIONS[2]; // Frequent
        else if (randAbs > 0.9) absenceStatus = ABSENCE_OPTIONS[3]; // Unjustified
        else if (randAbs > 0.8) absenceStatus = ABSENCE_OPTIONS[1]; // Justified

        terms[termId] = {
            rank: 0, // Will calculate later
            avg: realAvg,
            marks: detailedMarks,
            council_data: {
                final_decision: getDecision(realAvg, DEFAULT_CONFIG),
                observation: getObservation(realAvg),
                absence_status: absenceStatus,
                behavior_status: getBehavior()
            }
        };
    });

    const annualAvg = Number((avgSum / 3).toFixed(2));
    
    // Generate random birth date (students aged 13-16, born 2008-2011)
    const birthYear = 2008 + Math.floor(Math.random() * 4);
    const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const birthDate = `${birthDay}/${birthMonth}/${birthYear}`;
    
    // Generate registration number (e.g., 2024-0001, 2024-0002, etc.)
    const regNumber = `${new Date().getFullYear()}-${String(i).padStart(4, '0')}`;

    students.push({
      id: `std-${i}-${Date.now()}`,
      name,
      gender: isFemale ? 'F' : 'M',
      birthDate,
      registrationNumber: regNumber,
      terms: terms as any,
      annual: {
          avg: annualAvg,
          rank: 0, // Will sort later
          decision: annualAvg >= DEFAULT_CONFIG.admissionThreshold ? 'ينتقل' : 'يعيد السنة'
      }
    });
  }
  
  // Rank Sort helper
  const updateRanks = (list: Student[]) => {
      // Annual Rank
      list.sort((a, b) => b.annual.avg - a.annual.avg);
      list.forEach((s, idx) => s.annual.rank = idx + 1);

      // Term Ranks
      ([1, 2, 3] as const).forEach(t => {
          list.sort((a, b) => b.terms[t].avg - a.terms[t].avg);
          list.forEach((s, idx) => s.terms[t].rank = idx + 1);
      });
      
      // Default sort by Annual Rank
      return list.sort((a, b) => a.annual.rank - b.annual.rank);
  };

  return updateRanks(students);
};

export const generateClasses = (): ClassGroup[] => {
  return [
    {
      id: "3as-sci-1",
      name: "3 ع ت 1",
      major: "علوم تجريبية",
      year: "2023-2024",
      students: generateStudentList(38, 17.5) // 38 Students as requested
    }
  ];
};