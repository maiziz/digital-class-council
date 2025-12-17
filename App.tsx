
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, 
  GraduationCap, 
  Award, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Printer, 
  Edit3, 
  Save, 
  X, 
  Menu, 
  FileText, 
  User, 
  AlertTriangle, 
  Trophy, 
  Calendar,
  Calculator,
  Percent,
  BarChart2,
  BookOpen,
  ChevronDown,
  Settings,
  RefreshCw,
  School,
  LayoutDashboard,
  LogOut
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell,
  LabelList,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { 
  Student, 
  SubjectKey, 
  SUBJECTS, 
  SubjectData, 
  Marks, 
  ClassGroup, 
  AppConfig, 
  DEFAULT_CONFIG, 
  Tab, 
  BEHAVIORS, 
  ABSENCE_OPTIONS,
  TermId,
  TermData,
  CouncilData
} from './types';
import { 
  generateClasses, 
  getDecision, 
  getBehavior 
} from './constants';

// --- Components ---

const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-start justify-between">
    <div>
      <p className="text-slate-500 text-sm font-bold uppercase tracking-wide">{title}</p>
      <h3 className="text-3xl font-black text-slate-800 mt-2">{value}</h3>
      {subtext && <p className="text-sm text-slate-500 font-medium mt-1">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-lg ${color} shadow-lg`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
);

// --- Helpers ---

const calculateSubjectAverage = (ev: number, test: number, exam: number) => {
  // Formula: ((Eval + Test)/2 + Exam * 2) / 3
  const avg = (((Number(ev) + Number(test)) / 2) + (Number(exam) * 2)) / 3;
  return Number(avg.toFixed(2));
};

const getAbsenceStatus = (status: string | undefined) => {
  const safeStatus = status || "مواظب / لا يتغيب";
  switch(safeStatus) {
    case "مواظب / لا يتغيب": return { label: safeStatus, color: "bg-emerald-100 text-emerald-700" };
    case "غيابات مبررة": return { label: safeStatus, color: "bg-blue-100 text-blue-700" };
    case "غيابات غير مبررة": return { label: safeStatus, color: "bg-orange-100 text-orange-700" };
    case "كثير الغياب": return { label: safeStatus, color: "bg-red-100 text-red-700" };
    default: return { label: safeStatus, color: "bg-slate-100 text-slate-700" };
  }
};

// --- Main App ---

export default function App() {
  // State
  const [activeTab, setActiveTab] = useState<Tab>('analysis');
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [currentClassId, setCurrentClassId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedTeacherSubject, setSelectedTeacherSubject] = useState<SubjectKey | null>(null);
  
  // Management Tab State
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [newClass, setNewClass] = useState({ name: '', major: '', year: config.schoolYear });
  const [newStudent, setNewStudent] = useState({ 
    name: '', 
    gender: 'M' as 'M' | 'F', 
    birthDate: '', 
    registrationNumber: '' 
  });
  
  // NEW: Multi-Term State
  const [activeTerm, setActiveTerm] = useState<TermId | 'annual'>(1);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<{id: string, subject: SubjectKey | null} | null>(null);
  // We need to store edit form data generically, will map back to structure on save
  const [editFormData, setEditFormData] = useState<Partial<SubjectData>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize data
  useEffect(() => {
    // Try to load from localStorage first
    const savedData = localStorage.getItem('classCouncilData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.classes && Array.isArray(parsed.classes)) {
          setClasses(parsed.classes);
          if (parsed.classes.length > 0) {
            setCurrentClassId(parsed.classes[0].id);
          }
        }
        if (parsed.config) {
          setConfig(parsed.config);
        }
      } catch (e) {
        console.error('Failed to load saved data:', e);
        // Fall back to generating demo data
        const demoClasses = generateClasses();
        setClasses(demoClasses);
        if (demoClasses.length > 0) setCurrentClassId(demoClasses[0].id);
      }
    } else {
      // No saved data, generate demo data
      const demoClasses = generateClasses();
      setClasses(demoClasses);
      if (demoClasses.length > 0) setCurrentClassId(demoClasses[0].id);
    }
  }, []);

  // Auto-save to localStorage whenever classes or config changes
  useEffect(() => {
    if (classes.length > 0) {
      const dataToSave = {
        classes,
        config,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem('classCouncilData', JSON.stringify(dataToSave));
    }
  }, [classes, config]);

  // Helper to get current class object
  const currentClass = useMemo(() => 
    classes.find(c => c.id === currentClassId) || classes[0], 
  [classes, currentClassId]);
  
  // Helper to safely get student term data
  const getStudentTermData = (student: Student, term: TermId | 'annual') => {
      if (term === 'annual') return null; // Logic handled separately for annual
      return student.terms[term];
  };

  // Filtered Students
  const students = useMemo(() => {
    if (!currentClass) return [];
    let filtered = currentClass.students;
    
    if (searchQuery) {
      filtered = filtered.filter(s => s.name.includes(searchQuery));
    }
    
    // Sort logic depends on term
    if (activeTerm === 'annual') {
        return [...filtered].sort((a, b) => a.annual.rank - b.annual.rank);
    } else {
        return [...filtered].sort((a, b) => a.terms[activeTerm].rank - b.terms[activeTerm].rank);
    }
  }, [currentClass, searchQuery, activeTerm]);

  // Reset selection when class changes
  useEffect(() => {
    if (students.length > 0) {
      setSelectedStudentId(students[0].rank);
    }
  }, [currentClassId, students]); // Added students to dependency array

  // --- Data Persistence Functions ---

  const handleExportData = () => {
    // Create payload with classes AND config
    const exportData = {
      version: "2.0",
      timestamp: new Date().toISOString(),
      config: config,
      classes: classes
    };
    
    // Create filename based on date
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `council_data_full_${dateStr}.json`;
    
    // Prepare data
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const importedData = JSON.parse(content);
        
        // Check version or structure
        if (importedData.config && importedData.classes) {
           // Version 2.0 import
           setConfig(importedData.config);
           setClasses(importedData.classes);
           // Restore default class selection if needed
           if (importedData.classes.length > 0 && !importedData.classes.find((c:any) => c.id === currentClassId)) {
             setCurrentClassId(importedData.classes[0].id);
           }
           alert("تم استيراد قاعدة البيانات والإعدادات بنجاح (نسخة كاملة).");
        } else if (Array.isArray(importedData)) {
           // Legacy import (List of students only)
           // We update the current class only
           if (currentClassId) {
             setClasses(prev => prev.map(c => {
               if (c.id === currentClassId) {
                 return { ...c, students: importedData };
               }
               return c;
             }));
             alert("تم استيراد قائمة الطلاب بنجاح (نسخة قديمة).");
           }
        } else {
           alert("خطأ: تنسيق الملف غير معروف.");
        }
      } catch (error) {
        console.error("Import error:", error);
        alert("حدث خطأ أثناء قراءة الملف.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- Logic for Settings ---
  const applyDecisionsToAll = () => {
    if (confirm("هل أنت متأكد؟ سيتم إعادة حساب المعدلات والقرارات لجميع الطلاب بناءً على المعاملات والعتبات الجديدة.")) {
      setClasses(prevClasses => prevClasses.map(c => ({
        ...c,
        students: c.students.map(s => {
          // Recalculate averages for all terms using new coefficients
          const updatedTerms = { ...s.terms };
          ([1, 2, 3] as TermId[]).forEach(termId => {
               const termData = s.terms[termId];
               let totalWeighted = 0;
               let totalCoef = 0;
               
               Object.keys(termData.marks).forEach((subjKey) => {
                   const key = subjKey as SubjectKey;
                   const subjectAvg = termData.marks[key].avg;
                   const coef = config.coefficients?.[key] || 1;
                   
                   totalWeighted += subjectAvg * coef;
                   totalCoef += coef;
               });
               
               const newAvg = totalCoef > 0 ? Number((totalWeighted / totalCoef).toFixed(2)) : 0;
               updatedTerms[termId] = {
                   ...termData,
                   avg: newAvg,
                   council_data: {
                       ...termData.council_data,
                       final_decision: getDecision(newAvg, config)
                   }
               };
          });

          return {
            ...s,
            terms: updatedTerms
          };
        })
      })));
      alert("تم تحديث المعدلات والقرارات لجميع الطلاب بنجاح.");
    }
  };


  // --- Derived Statistics ---
  const stats = useMemo(() => {
    if (!students.length) return null;

    if (activeTerm === 'annual') {
        // Annual Stats
        const classAvg = Number((students.reduce((acc, s) => acc + s.annual.avg, 0) / students.length).toFixed(2));
        const admitted = students.filter(s => s.annual.avg >= config.admissionThreshold);
        const passRate = Number(((admitted.length / students.length) * 100).toFixed(1));
        const topStudents = [...students].sort((a, b) => b.annual.avg - a.annual.avg).slice(0, 3);
        
        // Annual Progress Chart Data: Average of T1, T2, T3 for the whole class
        const termAverages = ([1, 2, 3] as const).map(t => {
            const tAvg = students.reduce((acc, s) => acc + s.terms[t].avg, 0) / students.length;
            return { name: `الفصل ${t}`, avg: Number(tAvg.toFixed(2)) };
        });

        return {
            mode: 'annual',
            classAvg,
            passRate,
            topStudents,
            termAverages,
            admittedCount: admitted.length,
            repeatCount: students.length - admitted.length,
            atRisk: students.filter(s => s.annual.avg >= 9.00 && s.annual.avg < 10.00).map(s => ({ name: s.name, avg: s.annual.avg }))
        };
    }

    // Term Stats
    const termStudents = students.map(s => s.terms[activeTerm]);
    const classAvg = Number((termStudents.reduce((acc, s) => acc + s.avg, 0) / termStudents.length).toFixed(2));
    const passCount = termStudents.filter(s => s.avg >= 10).length;
    const passRate = Number(((passCount / termStudents.length) * 100).toFixed(1));
    const maxAvg = Math.max(...termStudents.map(s => s.avg));
    
    // Top Students (All with Honors/Ijaza)
    const validHonors = ['امتياز', 'تهنئة', 'تشجيع', 'لوحة شرف'];
    const topStudents = [...students]
        .filter(s => {
            const decision = s.terms[activeTerm].council_data.final_decision;
            return validHonors.includes(decision);
        })
        .sort((a, b) => b.terms[activeTerm].avg - a.terms[activeTerm].avg)
        .map(s => ({ ...s, avg: s.terms[activeTerm].avg })); // Flatten for display

    // Subject Performance
    const subjectPerformance = SUBJECTS.map(sub => {
      const subAvg = termStudents.reduce((acc, s) => acc + s.marks[sub.key].avg, 0) / termStudents.length;
      return { name: sub.label, avg: Number(subAvg.toFixed(2)) };
    }).sort((a, b) => b.avg - a.avg);
    
    // Distribution
    const distribution = [
      { name: 'ممتاز (+18)', value: termStudents.filter(s => s.avg >= 18).length, color: '#10b981' },
      { name: 'جيد جدا (16-18)', value: termStudents.filter(s => s.avg >= 16 && s.avg < 18).length, color: '#34d399' },
      { name: 'جيد (14-16)', value: termStudents.filter(s => s.avg >= 14 && s.avg < 16).length, color: '#60a5fa' },
      { name: 'قريب من الجيد (12-14)', value: termStudents.filter(s => s.avg >= 12 && s.avg < 14).length, color: '#fbbf24' },
      { name: 'متوسط (10-12)', value: termStudents.filter(s => s.avg >= 10 && s.avg < 12).length, color: '#f59e0b' },
      { name: 'ضعيف (-10)', value: termStudents.filter(s => s.avg < 10).length, color: '#ef4444' },
    ].filter(d => d.value > 0);

    // Disruptors (Negative behavior)
    const negativeBehaviors = ["مشاغب", "كثير الحركة", "تنبيه", "إنذار", "توبيخ"]; 
    // Note: Checking both behavior string or council decision just in case
    const disruptors = students.filter(s => {
        const d = s.terms[activeTerm].council_data;
        return negativeBehaviors.includes(d.behavior_status) || negativeBehaviors.includes(d.final_decision);
    }).map(s => ({
        name: s.name, 
        council_data: s.terms[activeTerm].council_data
    }));

    // At Risk (9.00 - 9.99)
    const atRisk = students
        .map(s => ({ name: s.name, id: s.id, avg: s.terms[activeTerm].avg }))
        .filter(s => s.avg >= 9.00 && s.avg < 10.00);

    // Absentees (Term)
    const negativeAbsences = ["كثير الغياب", "غيابات غير مبررة"];
    const absentees = students.filter(s => {
        const a = s.terms[activeTerm].council_data.absence_status;
        return negativeAbsences.includes(a);
    }).map(s => ({
        name: s.name,
        status: s.terms[activeTerm].council_data.absence_status
    }));

    return {
      mode: 'term',
      classAvg,
      passRate,
      maxAvg,
      topStudents,
      subjectPerformance,
      distribution,
      disruptors,
      atRisk,
      absentees
    };

  }, [students, activeTerm, config]);

  // --- Actions ---

  const updateStudentData = (studentId: string, field: string, value: any) => {
    if (!currentClassId) return;

    setClasses(prev => prev.map(c => {
      if (c.id === currentClassId) {
        return {
          ...c,
          students: c.students.map(s => {
            if (s.id === studentId) {
                // Annual updates
                if (activeTerm === 'annual' && field === 'annual') {
                    return { ...s, annual: value };
                }
                
                // Term updates
                if (activeTerm !== 'annual') {
                    if (field === 'council_data') {
                         return { 
                             ...s, 
                             terms: {
                                 ...s.terms,
                                 [activeTerm]: {
                                     ...s.terms[activeTerm],
                                     council_data: value
                                 }
                             }
                         };
                    }
                    if (field === 'marks') {
                         // Recalculate Average for this term
                         const subKey = Object.keys(value)[0] as SubjectKey; // Assumption for single sub update or full marks object? 
                         // Check usage: usually passing full marks object for a subject? No, passing `editFormData` which is `SubjectData`.
                         // But we need to know WHICH subject.
                         // The helper `saveEditModal` uses `selectedTeacherSubject`.
                         // Let's rely on standard logic below for generic updates if possible, 
                         // but for now `updateStudentData` is mostly used for Council Data.
                         // Marks are handled by `saveEditModal`.
                    }
                }
                return s;
            }
            return s;
          })
        };
      }
      return c;
    }));
  };

  const openEditModal = (student: Student, subject: SubjectKey) => {
    setEditingStudent({id: student.id, subject}); // Use student id
    setEditFormData({ ...student.terms[activeTerm as number].marks[subject] }); // Use term marks
    setIsEditModalOpen(true);
  };

  const handleEditFormChange = (field: keyof SubjectData, value: any) => {
    if (!editFormData) return;
    
    let newData = { ...editFormData, [field]: value };
    
    // Auto-calculate average if marks change
    if (field === 'eval' || field === 'test' || field === 'exam') {
      const avg = calculateSubjectAverage(
        field === 'eval' ? Number(value) : newData.eval,
        field === 'test' ? Number(value) : newData.test,
        field === 'exam' ? Number(value) : newData.exam
      );
      newData.avg = avg;
    }

    setEditFormData(newData);
  };

  const saveEditModal = () => {
    if (!editingStudent || !selectedTeacherSubject || !editFormData) return;

    setClasses(prevClasses => prevClasses.map(c => {
      if (c.id === currentClassId) {
        return {
          ...c,
          students: c.students.map(s => {
            if (s.id === editingStudent.id) {
              const newMarks = {
                ...s.terms[activeTerm as number].marks,
                [selectedTeacherSubject]: editFormData
              };
              
              // Recalculate Term Overall Average
              const subjects = Object.keys(newMarks) as SubjectKey[];
              let totalWeighted = 0;
              let totalCoef = 0;
              
              subjects.forEach(sub => {
                  const coef = config.coefficients?.[sub] || 1;
                  totalWeighted += newMarks[sub].avg * coef;
                  totalCoef += coef;
              });
              
              const realAvg = totalCoef > 0 ? Number((totalWeighted / totalCoef).toFixed(2)) : 0;

              return {
                 ...s,
                 terms: {
                     ...s.terms,
                     [activeTerm as number]: {
                         ...s.terms[activeTerm as number],
                         marks: newMarks,
                         avg: realAvg,
                         // Note: Rank needs recalculation globally, ignoring for single edit momentarily or needs sort helper
                     }
                 }
              };
              

            }
            return s;
          })
        };
      }
      return c;
    }));
    setIsEditModalOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Views ---

  const renderAnalysis = () => {
    if (!stats) return <div className="flex h-64 items-center justify-center text-slate-500">جاري تحميل البيانات...</div>;

    // --- ANNUAL ANALYSIS VIEW ---
    if (activeTerm === 'annual') {
        return (
            <div className="space-y-8 animate-fade-in p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* KPI 1 */}
                    <StatCard title="المعدل السنوي العام" value={stats.classAvg} subtext="الهدف: 12.00" icon={TrendingUp} color="bg-purple-600" />
                    
                    {/* KPI 2 */}
                    <StatCard title="نسبة القبول" value={`${stats.passRate}%`} subtext={`${stats.admittedCount} ينتقل / ${stats.repeatCount} يعيد`} icon={CheckCircle2} color="bg-emerald-600" />

                    {/* KPI 3: Empty Placeholder or different metric -> Now Borderline Cases */}
                     <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                         <div className="bg-orange-500 p-4 flex items-center justify-between text-white">
                             <AlertCircle size={20} />
                             <h3 className="font-bold text-lg">حالات للإسعاف (9-10)</h3>
                         </div>
                         <div className="p-4 space-y-3">
                             {stats.atRisk.length > 0 ? stats.atRisk.map((s, idx) => (
                                 <div key={idx} className="flex items-center justify-between border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                                     <span className="font-bold text-slate-700 text-sm">{s.name}</span>
                                     <span className="font-black text-orange-500 bg-orange-50 px-2 py-1 rounded-md text-xs">{s.avg.toFixed(2)}</span>
                                 </div>
                             )) : <div className="text-center text-slate-400 text-sm py-4">لا توجد حالات</div>}
                         </div>
                     </div>

                    {/* Custom Card: Top Students (Annual) */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-[#facc15] p-4 flex items-center justify-between text-white">
                            <Trophy size={20} />
                            <h3 className="font-bold text-lg">المتفوقون سنوياً</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            {stats.topStudents.map((s, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <span className="font-black text-xl text-[#0d9488]">{s.annual.avg.toFixed(2)}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-slate-800 text-sm">{s.name}</span>
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-50 text-yellow-600 font-black text-xs border border-yellow-200">
                                            {idx + 1}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Annual Chart: Progression */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">3</div>
                        <h3 className="text-xl font-bold text-slate-800">تطور معدل القسم خلال الفصول</h3>
                    </div>
                    
                    <div className="h-96 w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={stats.termAverages}
                            margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                            barSize={50}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 14, fill: '#64748b', fontWeight: 600 }}
                            dy={10}
                            />
                            <YAxis 
                            domain={[0, 15]} 
                            tickCount={8}
                            stroke="#94a3b8"
                            fontSize={12}
                            />
                            <RechartsTooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="avg" radius={[8, 8, 0, 0]} fill="#8b5cf6">
                                <LabelList dataKey="avg" position="top" style={{ fill: '#4c1d95', fontWeight: 'bold' }} />
                            </Bar>
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    }
    
    // --- TERM ANALYSIS VIEW (Existing logic) ---
    return (
    <div className="space-y-8 animate-fade-in p-2">
      
      {/* Top Section: KPI & Custom Cards matching screenshots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <StatCard title="معدل القسم" value={stats.classAvg} subtext="الهدف: 12.00" icon={TrendingUp} color="bg-blue-600" />
        
        {/* KPI 2 */}
        <StatCard title="نسبة النجاح" value={`${stats.passRate}%`} subtext={`${students.filter(s => s.terms[activeTerm].avg >= 10).length} ناجح`} icon={CheckCircle2} color="bg-emerald-600" />

        {/* Custom Card: Behavior Alerts (Red Header) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-[#e91e63] p-4 flex items-center justify-between text-white">
                <AlertTriangle size={20} />
                <h3 className="font-bold text-lg">تنبيه السلوك</h3>
            </div>
            <div className="p-4 space-y-4">
                {stats.disruptors.length > 0 ? stats.disruptors.slice(0, 5).map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                         <span className="bg-red-50 text-red-600 text-xs font-bold px-3 py-1 rounded-full border border-red-100 min-w-[80px] text-center">
                            {s.council_data.behavior_status}
                        </span>
                        <span className="font-bold text-slate-700 text-sm">{s.name}</span>
                    </div>
                )) : <div className="text-center text-slate-400 text-sm py-4">سلوك عام ممتاز</div>}
                </div>
        </div>

        {/* Custom Card: Absence Alerts (Purple Header) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-purple-600 p-4 flex items-center justify-between text-white">
                <AlertCircle size={20} />
                <h3 className="font-bold text-lg">تنبيه الغيابات</h3>
            </div>
            <div className="p-4 space-y-4">
                {stats.absentees.length > 0 ? stats.absentees.slice(0, 5).map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                         <span className="bg-purple-50 text-purple-600 text-xs font-bold px-3 py-1 rounded-full border border-purple-100 min-w-[80px] text-center">
                            {s.status}
                        </span>
                        <span className="font-bold text-slate-700 text-sm">{s.name}</span>
                    </div>
                )) : <div className="text-center text-slate-400 text-sm py-4">انضباط جيد</div>}
            </div>
        </div>
        </div>

        {/* Custom Card: Borderline Cases (Orange Header) - Replaces Top Students in grid or adds to it? 
            Let's put it before Top Students or organize appropriately. 
            The grid is 4 columns. We have KPI1, KPI2, Behavior, Top. 
            Let's add it as a new card, potentially breaking to next line or strictly 5 items. 
            Actually, let's Replace Behavior chart if empty? No.
            Let's just add it to the grid. 
        */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="bg-orange-500 p-4 flex items-center justify-between text-white">
                <AlertCircle size={20} />
                <h3 className="font-bold text-lg">حالات للإسعاف (9-10)</h3>
            </div>
            <div className="p-4 space-y-3">
                {stats.atRisk.length > 0 ? stats.atRisk.slice(0, 5).map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                        <span className="font-bold text-slate-700 text-sm">{s.name}</span>
                        <span className="font-black text-orange-500 bg-orange-50 px-2 py-1 rounded-md text-xs">{s.avg.toFixed(2)}</span>
                    </div>
                )) : <div className="text-center text-slate-400 text-sm py-4">لا توجد حالات</div>}
            </div>
        </div>

        {/* Custom Card: Top Students (Yellow Header) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="bg-[#facc15] p-4 flex items-center justify-between text-white">
                <Trophy size={20} />
                <h3 className="font-bold text-lg">المتفوقون</h3>
            </div>
            <div className="p-4 space-y-4">
                {stats.topStudents.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                         <span className="font-black text-xl text-[#0d9488]">{s.avg.toFixed(2)}</span>
                         <div className="flex items-center gap-3">
                             <span className="font-bold text-slate-800 text-sm">{s.name}</span>
                             <span className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-50 text-yellow-600 font-black text-xs border border-yellow-200">
                                 {idx + 1}
                             </span>
                         </div>
                    </div>
                ))}
            </div>
        </div>


      {/* Chart Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
             <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">3</div>
             <h3 className="text-xl font-bold text-slate-800">الأعمدة البيانية (Ranked List)</h3>
          </div>
          <p className="text-slate-500 text-sm mb-6 text-center">الأفضل للقراءة السريعة. مرتبة من الأعلى للأدنى.</p>
          
          <div className="h-96 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              {/* Vertical Bars: XAxis = Name, YAxis = Value */}
              <BarChart
                data={stats.subjectPerformance}
                margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                barSize={30}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                   domain={[0, 18]} 
                   tickCount={10}
                   stroke="#94a3b8"
                   fontSize={12}
                />
                <RechartsTooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                  {stats.subjectPerformance.map((entry, index) => {
                     // Color logic: Red < 10, Blue 10-12, Green > 12
                     let color = '#ef4444'; // Red
                     if (entry.avg >= 12) color = '#10b981'; // Green
                     else if (entry.avg >= 10) color = '#3b82f6'; // Blue
                     
                     return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
      </div>

    </div>
    );
  };

  const renderTeacherInput = () => {
    let subjectStats = null;
    
    // Prevent Annual view in Teacher Input
    if (activeTerm === 'annual') {
        return (
             <div className="flex flex-col items-center justify-center p-20 text-center animate-fade-in">
                 <Edit3 size={48} className="text-slate-300 mb-4" />
                 <h2 className="text-xl font-bold text-slate-700">فضاء الأساتذة - اختيار الفصل</h2>
                 <p className="text-slate-500 mt-2">يرجى اختيار الفصل (1، 2، أو 3) لإدخال او تعديل النقاط.</p>
                 <div className="flex gap-4 mt-6">
                     <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={() => setActiveTerm(1)}>الفصل 1</button>
                     <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={() => setActiveTerm(2)}>الفصل 2</button>
                     <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={() => setActiveTerm(3)}>الفصل 3</button>
                 </div>
             </div>
        );
    }

    if (selectedTeacherSubject) {
        // Use activeTerm data
        const marks = students.map(s => s.terms[activeTerm].marks[selectedTeacherSubject]);
        const avg = marks.reduce((acc, m) => acc + m.avg, 0) / marks.length;
        const max = Math.max(...marks.map(m => m.avg));
        const min = Math.min(...marks.map(m => m.avg));
        const passed = marks.filter(m => m.avg >= 10).length;
        const passRate = (passed / marks.length) * 100;
        subjectStats = { avg, max, min, passRate };
    }

    return (
    <div className="animate-fade-in space-y-6 pb-20">
       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 text-lg">اختر المادة للإدخال / التعديل</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
             {SUBJECTS.map(sub => (
                <button 
                   key={sub.key}
                   onClick={() => setSelectedTeacherSubject(sub.key)}
                   className={`p-3 rounded-lg text-sm font-bold transition-all shadow-sm ${
                      selectedTeacherSubject === sub.key 
                      ? 'bg-blue-700 text-white ring-2 ring-blue-300 transform scale-105'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-blue-300'
                   }`}
                >
                   {sub.label}
                </button>
             ))}
          </div>
       </div>

       {selectedTeacherSubject && subjectStats && (
          <div className="space-y-6">
             {/* Subject Dashboard */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                     <div>
                         <p className="text-xs text-slate-500 font-bold uppercase">نسبة النجاح</p>
                         <p className={`text-2xl font-black ${subjectStats.passRate >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>{subjectStats.passRate.toFixed(1)}%</p>
                     </div>
                     <Percent className="text-slate-300" size={24} />
                 </div>
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                     <div>
                         <p className="text-xs text-slate-500 font-bold uppercase">معدل المادة</p>
                         <p className="text-2xl font-black text-blue-600">{subjectStats.avg.toFixed(2)}</p>
                     </div>
                     <BarChart2 className="text-slate-300" size={24} />
                 </div>
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                     <div>
                         <p className="text-xs text-slate-500 font-bold uppercase">أعلى / أدنى علامة</p>
                         <p className="text-2xl font-black text-slate-800">{subjectStats.max.toFixed(2)} <span className="text-xs text-slate-400 font-medium mx-1">/</span> {subjectStats.min.toFixed(2)}</p>
                     </div>
                     <TrendingUp className="text-slate-300" size={24} />
                 </div>
             </div>

             {/* Student Table */}
             <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                    <BookOpen className="text-blue-600" size={20} />
                    {SUBJECTS.find(s => s.key === selectedTeacherSubject)?.label}
                    </h3>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-slate-900 to-slate-700">
                    مجلس القسم الرقمي 
                    <span className="text-xs font-medium text-slate-400 block mt-1">نسخة الثلاثيات 2.0</span>
                  </h1>
                </div>

                {/* Term Selector */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    {([1, 2, 3] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setActiveTerm(t)}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                                activeTerm === t 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            الفصل {t}
                        </button>
                    ))}
                    <div className="w-px bg-slate-200 mx-1 my-1"></div>
                    <button
                        onClick={() => setActiveTerm('annual')}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-1 ${
                            activeTerm === 'annual' 
                            ? 'bg-purple-600 text-white shadow-sm' 
                            : 'text-purple-600 hover:bg-purple-50'
                        }`}
                    >
                        <GraduationCap size={14} />
                        السنوي
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                            <th className="p-4 w-16 text-center">#</th>
                            <th className="p-4 w-48">اسم التلميذ</th>
                            <th className="p-4 w-24 text-center">تقويم</th>
                            <th className="p-4 w-24 text-center">فرض</th>
                            <th className="p-4 w-24 text-center">اختبار</th>
                            <th className="p-4 w-24 text-center bg-blue-50 text-blue-800">المعدل</th>
                            <th className="p-4">ملاحظة الأستاذ</th>
                            <th className="p-4 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {students.map(s => {
                            const subData = s.terms[activeTerm].marks[selectedTeacherSubject];
                            return (
                                <tr 
                                key={s.rank} 
                                onClick={() => openEditModal(s, selectedTeacherSubject)}
                                className="hover:bg-blue-50 cursor-pointer transition-colors group"
                                >
                                <td className="p-4 text-center text-slate-500 font-bold group-hover:text-blue-600">{s.rank}</td>
                                <td className="p-4 font-bold text-slate-800">{s.name}</td>
                                <td className="p-4 text-center font-medium">{subData.eval}</td>
                                <td className="p-4 text-center font-medium">{subData.test}</td>
                                <td className="p-4 text-center font-bold">{subData.exam}</td>
                                <td className={`p-4 text-center font-black bg-blue-50/50 ${subData.avg < 10 ? 'text-red-600' : 'text-blue-700'}`}>
                                    {subData.avg}
                                </td>
                                <td className="p-4 text-slate-600 text-xs truncate max-w-[200px]">
                                    {subData.teacher_remark}
                                </td>
                                <td className="p-4 text-center text-slate-300 group-hover:text-blue-500">
                                    <Edit3 size={16} />
                                </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    </table>
                </div>
             </div>
          </div>
       )}

       {/* Edit Modal (Simpler for teachers) */}
       {isEditModalOpen && editFormData && selectedTeacherSubject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Edit3 size={18} className="text-blue-400" />
                  تعديل النقاط
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                   {students.find(s => s.terms[activeTerm].rank === editingStudent?.rank)?.name} • {SUBJECTS.find(s => s.key === selectedTeacherSubject)?.label}
                </p>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="text-slate-400 hover:text-white transition-colors bg-white/10 p-2 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
               <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500">التقويم (20)</label>
                     <input 
                        type="number" 
                        className="w-full border-2 border-slate-200 rounded-xl p-3 text-center font-bold focus:border-blue-500 focus:ring-0 outline-none text-lg"
                        value={editFormData.eval}
                        onChange={(e) => handleEditFormChange('eval', e.target.value)}
                        min={0} max={20}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500">الفرض (20)</label>
                     <input 
                        type="number" 
                        className="w-full border-2 border-slate-200 rounded-xl p-3 text-center font-bold focus:border-blue-500 focus:ring-0 outline-none text-lg"
                        value={editFormData.test}
                        onChange={(e) => handleEditFormChange('test', e.target.value)}
                        min={0} max={20}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500">الاختبار (20)</label>
                     <input 
                        type="number" 
                        className="w-full border-2 border-slate-200 rounded-xl p-3 text-center font-bold focus:border-blue-500 focus:ring-0 outline-none text-lg"
                        value={editFormData.exam}
                        onChange={(e) => handleEditFormChange('exam', e.target.value)}
                        min={0} max={20}
                     />
                  </div>
               </div>

               <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                  <span className="text-sm font-bold text-blue-800 flex items-center gap-2">
                    <Calculator size={16} />
                    المعدل المحسوب
                  </span>
                  <span className="text-2xl font-black text-blue-700">{editFormData.avg}</span>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">ملاحظة الأستاذ</label>
                  <input 
                     type="text" 
                     className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                     value={editFormData.teacher_remark}
                     onChange={(e) => handleEditFormChange('teacher_remark', e.target.value)}
                  />
               </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
               <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg text-slate-600 font-bold hover:bg-slate-200 transition-colors text-sm"
               >
                  إلغاء
               </button>
               <button 
                  onClick={saveEditModal}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all text-sm flex items-center gap-2"
               >
                  <Save size={16} />
                  حفظ التغييرات
               </button>
            </div>
          </div>
        </div>
       )}
    </div>
  )};

  const renderStudentReview = () => {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500 h-[calc(100vh-140px)] flex">
        {/* Master List */}
        <div className="w-1/3 border-l border-slate-200 flex flex-col bg-slate-50">
           <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="بحث عن تلميذ..." 
                  className="w-full pl-4 pr-10 py-2 rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {students.map(s => {
                  const data = activeTerm === 'annual' ? s.annual : s.terms[activeTerm];
                  const rank = data.rank;
                  const avg = data.avg;
                  const isSelected = selectedStudentId === (s.id as any); 
                  
                  return (
                    <button 
                        key={s.id}
                        onClick={() => setSelectedStudentId(s.id as any)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-right ${
                            isSelected ? 'bg-white shadow-md ring-1 ring-blue-100 z-10' : 'hover:bg-slate-100 text-slate-600'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs
                                ${rank <= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-200 text-slate-500'}
                            `}>
                                {rank}
                            </div>
                            <div>
                                <div className={`font-bold text-sm ${isSelected ? 'text-slate-800' : ''}`}>{s.name}</div>
                                {isSelected && <div className="text-[10px] text-blue-500 font-medium">جاري العرض</div>}
                            </div>
                        </div>
                        <div className={`font-bold text-sm ${avg >= 10 ? 'text-green-600' : 'text-red-500'}`}>
                            {avg.toFixed(2)}
                        </div>
                    </button>
                  );
              })}
           </div>
        </div>

        {/* Detail View */}
        <div className="w-2/3 flex flex-col bg-white">
           {(() => {
               // Find currentClassIdent
               const selectedStudent = students.find(s => s.id === (selectedStudentId as any)) || students[0];
               if (!selectedStudent) return null;

               if (activeTerm === 'annual') {
                   // --- ANNUAL VIEW ---
                   return (
                       <div className="flex-1 p-8 overflow-y-auto">
                           <div className="flex items-center justify-between mb-8">
                               <div>
                                   <div className="flex items-center gap-2 mb-2">
                                       <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">التقرير السنوي</span>
                                       <h2 className="text-2xl font-bold text-slate-800">{selectedStudent.name}</h2>
                                   </div>
                               </div>
                               <div className="text-center">
                                   <div className="text-sm text-slate-400 font-medium mb-1">المعدل السنوي</div>
                                   <div className={`text-4xl font-bold ${selectedStudent.annual.avg >= 10 ? 'text-green-600' : 'text-red-500'}`}>
                                       {selectedStudent.annual.avg.toFixed(2)}
                                   </div>
                               </div>
                           </div>
                           
                           {/* Term Summary Table */}
                           <div className="mb-8 border border-slate-200 rounded-xl overflow-hidden">
                               <table className="w-full text-sm text-right">
                                   <thead className="bg-slate-50 text-slate-500">
                                       <tr>
                                           <th className="p-3">الفصل</th>
                                           <th className="p-3">المعدل</th>
                                           <th className="p-3">الرتبة</th>
                                           <th className="p-3">قرار المجلس</th>
                                       </tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-100">
                                       {([1, 2, 3] as const).map(t => (
                                           <tr key={t}>
                                               <td className="p-3 font-bold">الفصل {t}</td>
                                               <td className="p-3 font-bold text-slate-800">{selectedStudent.terms[t].avg}</td>
                                               <td className="p-3 text-slate-600">{selectedStudent.terms[t].rank}</td>
                                               <td className="p-3 text-xs">
                                                   <span className="px-2 py-1 rounded bg-slate-100 text-slate-600">
                                                       {selectedStudent.terms[t].council_data.final_decision}
                                                   </span>
                                               </td>
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                           </div>

                           {/* Annual Decision */}
                           <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                               <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                   <GraduationCap className="text-purple-600" size={20} />
                                   قرار نهاية السنة
                               </h3>
                               <div className="flex gap-4">
                                   <button 
                                      className={`flex-1 py-3 px-4 rounded-xl font-bold border-2 transition-all ${
                                          selectedStudent.annual.decision === 'ينتقل' 
                                          ? 'border-green-500 bg-green-50 text-green-700' 
                                          : 'border-slate-200 bg-white text-slate-400 hover:border-green-300'
                                      }`}
                                      onClick={() => updateStudentData(selectedStudent.id, 'annual', { ...selectedStudent.annual, decision: 'ينتقل' })}
                                   >
                                       يقبل / ينتقل
                                   </button>
                                   <button 
                                      className={`flex-1 py-3 px-4 rounded-xl font-bold border-2 transition-all ${
                                          selectedStudent.annual.decision === 'يعيد السنة' 
                                          ? 'border-red-500 bg-red-50 text-red-700' 
                                          : 'border-slate-200 bg-white text-slate-400 hover:border-red-300'
                                      }`}
                                      onClick={() => updateStudentData(selectedStudent.id, 'annual', { ...selectedStudent.annual, decision: 'يعيد السنة' })}
                                   >
                                       لا يقبل / يعيد
                                   </button>
                                   <button 
                                      className={`flex-1 py-3 px-4 rounded-xl font-bold border-2 transition-all ${
                                          selectedStudent.annual.decision === 'يوجه' 
                                          ? 'border-orange-500 bg-orange-50 text-orange-700' 
                                          : 'border-slate-200 bg-white text-slate-400 hover:border-orange-300'
                                      }`}
                                      onClick={() => updateStudentData(selectedStudent.id, 'annual', { ...selectedStudent.annual, decision: 'يوجه' })}
                                   >
                                       يوجه
                                   </button>
                               </div>
                           </div>
                       </div>
                   );
               } 
               
               // --- TERM VIEW ---
               const termData = selectedStudent.terms[activeTerm];
               const councilData = termData.council_data;

               return (
                   <div className="flex-1 p-8 overflow-y-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">الفصل {activeTerm}</span>
                                    <h2 className="text-2xl font-bold text-slate-800">{selectedStudent.name}</h2>
                                </div>
                                <div className="flex gap-2 text-xs text-slate-500">
                                    <span>الرتبة: <strong className="text-slate-800">{termData.rank}</strong></span>
                                    <span>•</span>
                                    <span>الغيابات: <strong className="text-slate-800">{councilData.absence_status}</strong></span>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm text-slate-400 font-medium mb-1">المعدل الفصلي</div>
                                <div className={`text-4xl font-bold ${termData.avg >= 10 ? 'text-green-600' : 'text-red-500'}`}>
                                    {termData.avg.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* Student Metadata Inputs */}
                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500">رقم التسجيل (ر.ت)</label>
                                <input 
                                    type="text"
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={selectedStudent.registrationNumber}
                                    onChange={(e) => {
                                        setClasses(prev => prev.map(c => ({
                                            ...c,
                                            students: c.students.map(s => 
                                                s.id === selectedStudent.id 
                                                    ? { ...s, registrationNumber: e.target.value }
                                                    : s
                                            )
                                        })));
                                    }}
                                    placeholder="2024-0001"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500">تاريخ الميلاد</label>
                                <input 
                                    type="text"
                                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={selectedStudent.birthDate}
                                    onChange={(e) => {
                                        setClasses(prev => prev.map(c => ({
                                            ...c,
                                            students: c.students.map(s => 
                                                s.id === selectedStudent.id 
                                                    ? { ...s, birthDate: e.target.value }
                                                    : s
                                            )
                                        })));
                                    }}
                                    placeholder="DD/MM/YYYY"
                                />
                            </div>
                        </div>

                        {/* Decision & Behavior Controls */}
                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500">قرار المجلس</label>
                                <div className="relative">
                                    <select 
                                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={councilData.final_decision}
                                        onChange={(e) => updateStudentData(selectedStudent.id, 'council_data', { ...councilData, final_decision: e.target.value })}
                                    >
                                        <option value={getDecision(termData.avg, config)}>{getDecision(termData.avg, config)} (تلقائي)</option>
                                        <option value="تهنئة">تهنئة</option>
                                        <option value="تشجيع">تشجيع</option>
                                        <option value="لوحة شرف">لوحة شرف</option>
                                        <option value="إنذار">إنذار</option>
                                        <option value="توبيخ">توبيخ</option>
                                    </select>
                                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                </div>
                            </div>

                             <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500">السلوك</label>
                                <div className="relative">
                                    <select 
                                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={councilData.behavior_status}
                                        onChange={(e) => updateStudentData(selectedStudent.id, 'council_data', { ...councilData, behavior_status: e.target.value })}
                                    >
                                        {BEHAVIORS.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                    </div>

                         <div className="grid grid-cols-1 gap-6 mb-8">
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500">الغيابات (مبررة / غير مبررة)</label>
                                 <div className="relative">
                                    <select 
                                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={councilData.absence_status}
                                        onChange={(e) => updateStudentData(selectedStudent.id, 'council_data', { ...councilData, absence_status: e.target.value })}
                                    >
                                        {ABSENCE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                        </div>

                        {/* Observation */}
                        <div className="space-y-2 mb-8">
                           <label className="text-xs font-bold text-slate-500">ملاحظات المجلس</label>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <textarea 
                                    className="w-full bg-transparent border-none outline-none text-slate-700 min-h-[80px] resize-none"
                                    value={councilData.observation}
                                    onChange={(e) => updateStudentData(selectedStudent.id, 'council_data', { ...councilData, observation: e.target.value })}
                                ></textarea>
                            </div>
                        </div>

                         {/* Term Marks Preview */}
                        <div>
                             <h3 className="text-sm font-bold text-slate-800 mb-4">كشف النقاط الكلي</h3>
                             <div className="overflow-x-auto">
                                 <table className="w-full text-xs text-right bg-white rounded-lg border border-slate-200">
                                     <thead className="bg-slate-50 text-slate-600 font-bold">
                                         <tr>
                                             <th className="p-3 border-b border-slate-200">المادة</th>
                                             <th className="p-3 border-b border-slate-200 text-center">التقويم</th>
                                             <th className="p-3 border-b border-slate-200 text-center">الفرض</th>
                                             <th className="p-3 border-b border-slate-200 text-center">الاختبار</th>
                                             <th className="p-3 border-b border-slate-200 text-center">المعدل</th>
                                             <th className="p-3 border-b border-slate-200 text-center">المعامل</th>
                                             <th className="p-3 border-b border-slate-200 text-center">المجموع</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-slate-100">
                                         {SUBJECTS.map(subj => {
                                             const mark = termData.marks[subj.key];
                                             const coef = config.coefficients?.[subj.key] || 1;
                                             return (
                                                <tr key={subj.key} className="hover:bg-slate-50">
                                                    <td className="p-3 font-bold text-slate-700">{subj.label}</td>
                                                    <td className="p-3 text-center text-slate-500">{mark.eval}</td>
                                                    <td className="p-3 text-center text-slate-500">{mark.test}</td>
                                                    <td className="p-3 text-center text-slate-500">{mark.exam}</td>
                                                    <td className={`p-3 text-center font-bold ${mark.avg >= 10 ? 'text-emerald-600' : 'text-red-500'}`}>{mark.avg}</td>
                                                    <td className="p-3 text-center text-slate-500">{coef}</td>
                                                    <td className="p-3 text-center font-bold text-slate-700">{(mark.avg * coef).toFixed(2)}</td>
                                                </tr>
                                             );
                                         })}
                                     </tbody>
                                 </table>
                             </div>
                        </div>
                   </div>
               );
           })()}
        </div>
      </div>
    );
  };

  const renderBulletins = () => {
    if (activeTerm === 'annual') {
        return (
             <div className="flex flex-col items-center justify-center p-20 text-center">
                 <AlertCircle size={48} className="text-slate-300 mb-4" />
                 <h2 className="text-xl font-bold text-slate-700">طباعة كشوف النقاط السنوية</h2>
                 <p className="text-slate-500 mt-2">يرجى الانتقال إلى فصل محدد لطباعة كشوف النقاط المدرسية التقليدية.</p>
                 <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={() => setActiveTerm(1)}>
                     الانتقال للفصل 1
                 </button>
             </div>
        );
    }

    return (
      <div className="space-y-8 print:space-y-0 block">
        <div className="no-print text-center mb-8">
            <button 
                onClick={() => window.print()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-lg inline-flex items-center gap-2"
            >
                <Printer size={18} />
                طباعة الكشوف
            </button>
        </div>
        {students.map((student) => {
            const termData = student.terms[activeTerm];
            return (
               <div key={student.id} dir="rtl" className="bg-white shadow-xl p-10 min-h-[29.7cm] print:min-h-screen print:shadow-none print:p-6 print:mx-auto print:w-full print:max-w-none break-after-page relative text-black mx-auto max-w-[21cm]">
                  {/* Header */}
                  <div className="border-b-2 border-black pb-4 mb-6">
                    <div className="flex justify-between items-center mb-6">
                      <div className="text-center w-1/3">
                        <div className="font-serif font-bold text-sm mb-1">الجمهورية الجزائرية الديمقراطية الشعبية</div>
                        <div className="font-serif font-bold text-sm">وزارة التربية الوطنية</div>
                      </div>
                      <div className="text-center w-1/3">
                        <div className="border border-black px-6 py-2 rounded-lg inline-block">
                             <div className="font-bold text-lg">كشف نقاط الفصل {activeTerm}</div>
                             <div className="text-xs mt-1">السنة الدراسية: {config.schoolYear}</div>
                        </div>
                      </div>
                      <div className="text-center w-1/3">
                        <div className="font-bold">المؤسسة: {config.schoolName}</div>
                        <div className="text-sm">المقاطعة: {config.district}</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end bg-slate-50 p-4 rounded-lg border border-black">
                       <div className="text-right space-y-2">
                          <div className="flex gap-2">
                             <span className="font-bold min-w-[80px]">الاسم واللقب:</span>
                             <span className="font-mono text-lg">{student.name}</span>
                          </div>
                          <div className="flex gap-2">
                             <span className="font-bold min-w-[80px]">تاريخ الميلاد:</span>
                             <span className="font-mono">{student.birthDate}</span>
                          </div>
                       </div>
                       <div className="text-left space-y-2">
                          <div className="flex gap-2 justify-end">
                             <span className="font-bold min-w-[60px] text-right">القسم:</span>
                             <span className="font-mono font-bold text-lg">{currentClass.name}</span>
                          </div>
                          <div className="flex gap-2 justify-end">
                             <span className="font-bold min-w-[60px] text-right">ر.ت:</span>
                             <span className="font-mono font-bold text-lg">{student.registrationNumber}</span>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Marks Table */}
                  {/* Marks Table */}
                  <table className="w-full text-sm text-right border-collapse border border-black mb-4">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-black p-1 w-1/4">المادة</th>
                        <th className="border border-black p-1 text-center w-16">التقويم</th>
                        <th className="border border-black p-1 text-center w-16">الفرض</th>
                        <th className="border border-black p-1 text-center w-16">الاختبار</th>
                        <th className="border border-black p-1 text-center w-16 bg-slate-200">المعدل</th>
                        <th className="border border-black p-1 text-center w-16">المعامل</th>
                        <th className="border border-black p-1 text-center w-16">المجموع</th>
                        <th className="border border-black p-1">ملاحظات الأستاذ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SUBJECTS.map((subject) => {
                        const marks = termData.marks[subject.key];

                        return (
                          <tr key={subject.key}>
                            <td className="border border-black p-1 font-bold">{subject.label}</td>
                            <td className="border border-black p-1 text-center">{marks.eval}</td>
                            <td className="border border-black p-1 text-center">{marks.test}</td>
                            <td className="border border-black p-1 text-center">{marks.exam}</td>
                            <td className="border border-black p-1 text-center font-bold bg-slate-50">{marks.avg}</td>
                            <td className="border border-black p-1 text-center">{config.coefficients?.[subject.key] || 1}</td>
                            <td className="border border-black p-1 text-center">{(marks.avg * (config.coefficients?.[subject.key] || 1)).toFixed(2)}</td>
                            <td className="border border-black p-1 text-[10px]">{marks.teacher_remark}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Footer Stats & Decision */}
                  <div className="flex border border-black mb-4">
                     <div className="w-1/3 border-l border-black p-2 space-y-2">
                        <div className="flex justify-between border-b border-black border-dashed pb-1">
                            <span className="font-bold">المعدل الفصلي:</span>
                            <span className="font-mono text-xl font-bold">{termData.avg}</span>
                        </div>

                        {config.showRank && (
                        <div className="flex justify-between">
                            <span className="font-bold">الرتبة:</span>
                            <span className="font-mono font-bold">{termData.rank}</span>
                        </div>
                        )}
                        <div className="flex justify-between">
                            <span className="font-bold">الغيابات:</span>
                            <span>{termData.council_data.absence_status}</span>
                        </div>
                     </div>
                     <div className="w-1/3 border-l border-black p-2">
                        {config.showDecision && (
                        <>
                        <div className="font-bold mb-1 underline">قرار مجلس القسم:</div>
                        <div className="text-center font-bold text-lg mt-2">{termData.council_data.final_decision}</div>
                        </>
                        )}
                     </div>
                     <div className="w-1/3 p-2">
                        <div className="font-bold mb-1 underline">ملاحظات عامة:</div>
                        <p className="text-xs leading-relaxed">{termData.council_data.observation}</p>
                     </div>
                  </div>

                  {/* Annual Decision (Term 3 Only) */}
                  {activeTerm === 3 && (
                    <div className="mb-4 border-2 border-black rounded-lg p-2 bg-slate-50">
                        {(() => {
                            // Calculate Annual Average
                            const t1 = student.terms[1].avg;
                            const t2 = student.terms[2].avg;
                            const t3 = student.terms[3].avg;
                            const annualAvg = Number(((t1 + t2 + t3) / 3).toFixed(2));
                            const decision = annualAvg >= config.admissionThreshold ? "ينتقل إلى القسم الأعلى" : "يعيد السنة";
                            
                            return (
                                <div className="flex items-center justify-around">
                                    <div className="text-center">
                                        <div className="font-bold text-slate-600 mb-1">المعدل السنوي:</div>
                                        <div className="font-black text-xl">{annualAvg}</div>
                                    </div>
                                    <div className="h-8 w-px bg-slate-300"></div>
                                    <div className="text-center">
                                        <div className="font-bold text-slate-600 mb-1">القرار السنوي:</div>
                                        <div className={`font-black text-lg ${annualAvg >= config.admissionThreshold ? 'text-green-700' : 'text-red-600'}`}>
                                            {decision}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                  )}

                  {/* Signatures */}
                  <div className="flex justify-between mt-4 px-8">
                     <div className="text-center">
                        <div className="font-bold mb-16">توقيع الولي</div>
                     </div>
                     <div className="text-center">
                        <div className="font-bold mb-16">توقيع الناظر</div>
                     </div>
                     <div className="text-center">
                        <div className="font-bold mb-16">توقيع المدير</div>
                     </div>
                  </div>

                  <div className="hidden print:block absolute bottom-4 right-0 left-0 text-center text-[8px] text-slate-400">
                     تم استخراج هذه الوثيقة رقمياً عبر منصة مجلس القسم الرقمي - {new Date().toLocaleDateString('ar-DZ')}
                  </div>
               </div>
            );
        })}
      </div>
    );
  };

  const renderManagement = () => {
    const addClass = () => {
      if (!newClass.name || !newClass.major) {
        alert('يرجى ملء جميع الحقول');
        return;
      }
      const id = `class-${Date.now()}`;
      setClasses(prev => [...prev, {
        id,
        name: newClass.name,
        major: newClass.major,
        year: newClass.year,
        students: []
      }]);
      setNewClass({ name: '', major: '', year: config.schoolYear });
      setShowAddClass(false);
      alert('تم إضافة القسم بنجاح');
    };

    const updateClass = () => {
      if (!editingClass || !newClass.name || !newClass.major) {
        alert('يرجى ملء جميع الحقول');
        return;
      }
      setClasses(prev => prev.map(c => 
        c.id === editingClass 
          ? { ...c, name: newClass.name, major: newClass.major, year: newClass.year }
          : c
      ));
      setNewClass({ name: '', major: '', year: config.schoolYear });
      setEditingClass(null);
      alert('تم تحديث القسم بنجاح');
    };

    const startEditClass = (cls: ClassGroup) => {
      setEditingClass(cls.id);
      setNewClass({ name: cls.name, major: cls.major, year: cls.year });
      setShowAddClass(false);
    };

    const deleteClass = (classId: string) => {
      if (confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع الطلاب أيضاً.')) {
        setClasses(prev => prev.filter(c => c.id !== classId));
        if (currentClassId === classId && classes.length > 1) {
          setCurrentClassId(classes.find(c => c.id !== classId)?.id || '');
        }
        alert('تم حذف القسم');
      }
    };

    const addStudent = () => {
      if (!currentClassId) {
        alert('يرجى اختيار قسم أولاً');
        return;
      }
      if (!newStudent.name || !newStudent.birthDate || !newStudent.registrationNumber) {
        alert('يرجى ملء جميع الحقول');
        return;
      }

      // Create empty term data for new student
      const emptyMarks: Marks = {} as Marks;
      SUBJECTS.forEach(sub => {
        emptyMarks[sub.key] = { eval: 0, test: 0, exam: 0, avg: 0, teacher_remark: '' };
      });

      const emptyTermData: TermData = {
        rank: 0,
        avg: 0,
        marks: emptyMarks,
        council_data: {
          final_decision: 'بدون',
          observation: '',
          absence_status: 'مواظب',
          behavior_status: 'حسن'
        }
      };

      const newStudentData: Student = {
        id: `std-${Date.now()}`,
        name: newStudent.name,
        gender: newStudent.gender,
        birthDate: newStudent.birthDate,
        registrationNumber: newStudent.registrationNumber,
        terms: {
          1: { ...emptyTermData },
          2: { ...emptyTermData },
          3: { ...emptyTermData }
        },
        annual: {
          avg: 0,
          rank: 0,
          decision: 'يعيد السنة'
        }
      };

      setClasses(prev => prev.map(c => 
        c.id === currentClassId 
          ? { ...c, students: [...c.students, newStudentData] }
          : c
      ));

      setNewStudent({ name: '', gender: 'M', birthDate: '', registrationNumber: '' });
      setShowAddStudent(false);
      alert('تم إضافة التلميذ بنجاح');
    };

    const updateStudent = () => {
      if (!editingStudentId || !currentClassId) {
        alert('خطأ في التحديث');
        return;
      }
      if (!newStudent.name || !newStudent.birthDate || !newStudent.registrationNumber) {
        alert('يرجى ملء جميع الحقول');
        return;
      }

      setClasses(prev => prev.map(c => 
        c.id === currentClassId 
          ? { 
              ...c, 
              students: c.students.map(s => 
                s.id === editingStudentId
                  ? { ...s, name: newStudent.name, gender: newStudent.gender, birthDate: newStudent.birthDate, registrationNumber: newStudent.registrationNumber }
                  : s
              )
            }
          : c
      ));

      setNewStudent({ name: '', gender: 'M', birthDate: '', registrationNumber: '' });
      setEditingStudentId(null);
      alert('تم تحديث التلميذ بنجاح');
    };

    const startEditStudent = (student: Student) => {
      setEditingStudentId(student.id);
      setNewStudent({
        name: student.name,
        gender: student.gender,
        birthDate: student.birthDate,
        registrationNumber: student.registrationNumber
      });
      setShowAddStudent(false);
    };

    const deleteStudent = (studentId: string) => {
      if (confirm('هل أنت متأكد من حذف هذا التلميذ؟')) {
        setClasses(prev => prev.map(c => ({
          ...c,
          students: c.students.filter(s => s.id !== studentId)
        })));
        alert('تم حذف التلميذ');
      }
    };

    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
        {/* Class Management Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <School className="text-blue-600" size={24} />
              <h2 className="text-2xl font-bold text-slate-800">إدارة الأقسام</h2>
            </div>
            <button
              onClick={() => setShowAddClass(!showAddClass)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold"
            >
              <Users size={18} />
              إضافة قسم جديد
            </button>
          </div>

          {(showAddClass || editingClass) && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="اسم القسم (مثال: 3 ع ت 1)"
                  value={newClass.name}
                  onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                  className="p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="التخصص (مثال: علوم تجريبية)"
                  value={newClass.major}
                  onChange={(e) => setNewClass({...newClass, major: e.target.value})}
                  className="p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="السنة الدراسية"
                  value={newClass.year}
                  onChange={(e) => setNewClass({...newClass, year: e.target.value})}
                  className="p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex gap-2">
                {editingClass ? (
                  <>
                    <button onClick={updateClass} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-bold">
                      تحديث
                    </button>
                    <button onClick={() => { setEditingClass(null); setNewClass({ name: '', major: '', year: config.schoolYear }); }} className="bg-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-400 font-bold">
                      إلغاء
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={addClass} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-bold">
                      حفظ
                    </button>
                    <button onClick={() => setShowAddClass(false)} className="bg-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-400 font-bold">
                      إلغاء
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map(cls => (
              <div key={cls.id} className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div onClick={() => startEditClass(cls)} className="cursor-pointer flex-1">
                    <h3 className="font-bold text-lg text-slate-800 hover:text-blue-600">{cls.name}</h3>
                    <p className="text-sm text-slate-500">{cls.major}</p>
                    <p className="text-xs text-slate-400">{cls.year}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEditClass(cls)}
                      className="text-blue-500 hover:text-blue-700 p-1"
                      title="تعديل القسم"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => deleteClass(cls.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="حذف القسم"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-slate-600 mt-2">
                  <span className="font-bold">{cls.students.length}</span> طالب
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Student Management Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <GraduationCap className="text-green-600" size={24} />
              <h2 className="text-2xl font-bold text-slate-800">إدارة التلاميذ</h2>
            </div>
            <button
              onClick={() => setShowAddStudent(!showAddStudent)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-bold"
              disabled={!currentClassId}
            >
              <User size={18} />
              إضافة تلميذ
            </button>
          </div>

          {!currentClassId && (
            <div className="text-center py-8 text-slate-500">
              <AlertCircle size={48} className="mx-auto mb-4 text-slate-300" />
              <p>يرجى اختيار قسم من الشريط الجانبي</p>
            </div>
          )}

          {(showAddStudent || editingStudentId) && currentClassId && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="الاسم الكامل"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                  className="p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none"
                />
                <select
                  value={newStudent.gender}
                  onChange={(e) => setNewStudent({...newStudent, gender: e.target.value as 'M' | 'F'})}
                  className="p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="M">ذكر</option>
                  <option value="F">أنثى</option>
                </select>
                <input
                  type="text"
                  placeholder="تاريخ الميلاد (DD/MM/YYYY)"
                  value={newStudent.birthDate}
                  onChange={(e) => setNewStudent({...newStudent, birthDate: e.target.value})}
                  className="p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="رقم التسجيل"
                  value={newStudent.registrationNumber}
                  onChange={(e) => setNewStudent({...newStudent, registrationNumber: e.target.value})}
                  className="p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div className="flex gap-2">
                {editingStudentId ? (
                  <>
                    <button onClick={updateStudent} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-bold">
                      تحديث
                    </button>
                    <button onClick={() => { setEditingStudentId(null); setNewStudent({ name: '', gender: 'M', birthDate: '', registrationNumber: '' }); }} className="bg-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-400 font-bold">
                      إلغاء
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={addStudent} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-bold">
                      حفظ
                    </button>
                    <button onClick={() => setShowAddStudent(false)} className="bg-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-400 font-bold">
                      إلغاء
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {currentClassId && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-right font-bold">الاسم</th>
                    <th className="p-3 text-center font-bold">الجنس</th>
                    <th className="p-3 text-center font-bold">تاريخ الميلاد</th>
                    <th className="p-3 text-center font-bold">رقم التسجيل</th>
                    <th className="p-3 text-center font-bold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium">{student.name}</td>
                      <td className="p-3 text-center">{student.gender === 'M' ? 'ذكر' : 'أنثى'}</td>
                      <td className="p-3 text-center font-mono text-sm">{student.birthDate}</td>
                      <td className="p-3 text-center font-mono text-sm">{student.registrationNumber}</td>
                      <td className="p-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => startEditStudent(student)}
                            className="text-blue-500 hover:text-blue-700 p-1"
                            title="تعديل التلميذ"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => deleteStudent(student.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="حذف التلميذ"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           
           {/* School Info Settings */}
           <div className="space-y-6">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6 text-slate-800 border-b border-slate-100 pb-4">
                    <School className="text-blue-600" />
                    <h3 className="font-bold text-xl">معلومات المؤسسة</h3>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="font-bold text-slate-600 text-sm">اسم المؤسسة</label>
                        <input 
                            type="text" 
                            value={config.schoolName}
                            onChange={(e) => setConfig({...config, schoolName: e.target.value})}
                            className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold text-slate-700 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="font-bold text-slate-600 text-sm">السنة الدراسية</label>
                            <input 
                                type="text" 
                                value={config.schoolYear}
                                onChange={(e) => setConfig({...config, schoolYear: e.target.value})}
                                className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold text-slate-700 focus:border-blue-500 outline-none"
                            />
                        </div>
                         <div className="space-y-2">
                            <label className="font-bold text-slate-600 text-sm">المقاطعة</label>
                            <input 
                                type="text" 
                                value={config.district}
                                onChange={(e) => setConfig({...config, district: e.target.value})}
                                className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold text-slate-700 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>
              </div>

              {/* Report Card Appearance */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6 text-slate-800 border-b border-slate-100 pb-4">
                    <FileText className="text-emerald-600" />
                    <h3 className="font-bold text-xl">إعدادات الكشف (المظهر)</h3>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="font-bold text-slate-700">إظهار الرتبة</span>
                        <input 
                            type="checkbox" 
                            checked={config.showRank}
                            onChange={(e) => setConfig({...config, showRank: e.target.checked})}
                            className="w-6 h-6 text-blue-600 rounded focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="font-bold text-slate-700">إظهار القرار (تهنئة/تشجيع...)</span>
                        <input 
                            type="checkbox" 
                            checked={config.showDecision}
                            onChange={(e) => setConfig({...config, showDecision: e.target.checked})}
                            className="w-6 h-6 text-blue-600 rounded focus:ring-blue-500"
                        />
                    </div>
                     <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span className="font-bold text-slate-700">طباعة ملونة (للطابعات الملونة)</span>
                        <input 
                            type="checkbox" 
                            checked={config.printColor}
                            onChange={(e) => setConfig({...config, printColor: e.target.checked})}
                            className="w-6 h-6 text-blue-600 rounded focus:ring-blue-500"
                        />
                    </div>
                </div>
              </div>
           </div>

           {/* Thresholds & Actions */}
           <div className="space-y-6">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-6 text-slate-800 border-b border-slate-100 pb-4">
                        <Settings className="text-orange-500" />
                        <h3 className="font-bold text-xl">عتبات القرارات</h3>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <label className="font-bold text-slate-600">امتياز (Excellence)</label>
                            <input 
                                type="number" 
                                value={config.excellence}
                                onChange={(e) => setConfig({...config, excellence: Number(e.target.value)})}
                                className="w-24 border-2 border-slate-200 rounded-lg p-2 text-center font-black text-lg"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="font-bold text-slate-600">تهنئة (Congratulations)</label>
                            <input 
                                type="number" 
                                value={config.congrats}
                                onChange={(e) => setConfig({...config, congrats: Number(e.target.value)})}
                                className="w-24 border-2 border-slate-200 rounded-lg p-2 text-center font-black text-lg"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="font-bold text-slate-600">تشجيع (Encouragement)</label>
                            <input 
                                type="number" 
                                value={config.encouragement}
                                onChange={(e) => setConfig({...config, encouragement: Number(e.target.value)})}
                                className="w-24 border-2 border-slate-200 rounded-lg p-2 text-center font-black text-lg"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="font-bold text-slate-600">لوحة شرف (Honor Board)</label>
                            <input 
                                type="number" 
                                value={config.honor}
                                onChange={(e) => setConfig({...config, honor: Number(e.target.value)})}
                                className="w-24 border-2 border-slate-200 rounded-lg p-2 text-center font-black text-lg"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col justify-center items-center text-center">
                    <RefreshCw size={48} className="text-slate-400 mb-4" />
                    <h3 className="font-bold text-lg text-slate-800 mb-2">تطبيق التغييرات</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        تطبيق هذه العتبات سيقوم بإعادة حساب "المعدل الفصلي" و "القرار النهائي" لجميع الطلاب بناءً على المعاملات الجديدة.
                    </p>
                    <button 
                    onClick={applyDecisionsToAll}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2 w-full justify-center"
                    >
                    <RefreshCw size={18} />
                    تحديث المعدلات والقرارات
                    </button>
                </div>
            </div>

           {/* Coefficients Settings - Full Width */}
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6 text-slate-800 border-b border-slate-100 pb-4">
                    <Calculator className="text-purple-600" />
                    <h3 className="font-bold text-xl">معاملات المواد (Coefficients)</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {SUBJECTS.map(subject => (
                        <div key={subject.key} className="space-y-2">
                            <label className="font-bold text-slate-600 text-sm block h-10 flex items-center">{subject.label}</label>
                            <input 
                                type="number" 
                                min="1"
                                max="10"
                                value={config.coefficients?.[subject.key] || 1}
                                onChange={(e) => {
                                    const newCoefs = { ...config.coefficients, [subject.key]: Number(e.target.value) };
                                    setConfig({ ...config, coefficients: newCoefs });
                                }}
                                className="w-full border-2 border-slate-200 rounded-xl p-3 font-black text-center text-lg text-slate-700 focus:border-purple-500 outline-none"
                            />
                        </div>
                    ))}
                </div>
              </div>
           </div>
        </div>
      </div>
    );
  };

  // --- Layout Render ---

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 print:h-auto print:overflow-visible" dir="rtl">
      {/* Sidebar Navigation - Hidden on Print */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col no-print border-l border-slate-800 shadow-2xl z-20">
        <div className="p-8 flex items-center gap-4">
          <div className="p-2 bg-blue-600 rounded-lg">
             <School className="w-8 h-8 text-white" />
          </div>
          <div>
             <h1 className="font-black text-xl tracking-tight leading-none">مجلس القسم</h1>
             <p className="text-xs text-slate-400 mt-1 font-medium">الإصدار الرقمي 2.0</p>
          </div>
        </div>

        {/* Class Selection in Sidebar */}
        <div className="px-6 mb-8">
            <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-3 block">اختر القسم</label>
            <div className="relative group">
                <select 
                    value={currentClassId} 
                    onChange={(e) => setCurrentClassId(e.target.value)}
                    className="w-full bg-slate-800 text-white text-sm font-bold rounded-xl p-4 appearance-none border-2 border-slate-700 focus:border-blue-500 focus:ring-0 outline-none transition-all cursor-pointer group-hover:bg-slate-750"
                >
                    {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <div className="absolute left-4 top-4 pointer-events-none">
                    <ChevronDown size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                </div>
            </div>
        </div>

        {/* Term Selection in Sidebar */}
        <div className="px-6 mb-8">
            <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-3 block">اختر الفصل</label>
            <div className="relative group">
                <select 
                    value={activeTerm} 
                    onChange={(e) => setActiveTerm(e.target.value === 'annual' ? 'annual' : Number(e.target.value) as TermId)}
                    className="w-full bg-slate-800 text-white text-sm font-bold rounded-xl p-4 appearance-none border-2 border-slate-700 focus:border-blue-500 focus:ring-0 outline-none transition-all cursor-pointer group-hover:bg-slate-750"
                >
                    <option value={1}>الفصل 1</option>
                    <option value={2}>الفصل 2</option>
                    <option value={3}>الفصل 3</option>
                    <option value="annual">السنوي</option>
                </select>
                <div className="absolute left-4 top-4 pointer-events-none">
                    <ChevronDown size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                </div>
            </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab('analysis')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all font-bold ${activeTab === 'analysis' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={22} />
            <span>تحليل عام</span>
          </button>

           <button 
            onClick={() => setActiveTab('teachers')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all font-bold ${activeTab === 'teachers' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Edit3 size={22} />
            <span>إدخال الأساتذة</span>
          </button>

          <button 
            onClick={() => setActiveTab('review')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all font-bold ${activeTab === 'review' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Users size={22} />
            <span>مراجعة الطلاب</span>
          </button>

          <div className="border-t border-slate-800 my-4 pt-4 space-y-2">
             <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all font-bold ${activeTab === 'settings' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Settings size={22} />
              <span>الإعدادات</span>
            </button>
             <button 
              onClick={() => setActiveTab('management')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all font-bold ${activeTab === 'management' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <School size={22} />
              <span>إدارة</span>
            </button>
             <button 
              onClick={() => setActiveTab('bulletins')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all font-bold ${activeTab === 'bulletins' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <FileText size={22} />
              <span>كشوف النقاط</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto transition-all relative print:overflow-visible">
        {/* Header - Hidden on Print */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10 no-print shadow-sm">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            {activeTab === 'analysis' ? 'لوحة القيادة والتحليل' : 
             activeTab === 'teachers' ? 'فضاء الأساتذة' :
             activeTab === 'review' ? 'مداولات المجلس' :
             activeTab === 'settings' ? 'الإعدادات العامة' :
             activeTab === 'bulletins' ? 'طباعة الكشوف' : ''}
          </h2>
          <div className="flex items-center gap-4">
            
             <div className="flex items-center gap-3 ml-6 border-l border-slate-200 pl-6">
                <input
                   type="file"
                   ref={fileInputRef}
                   onChange={handleFileChange}
                   accept=".json"
                   className="hidden"
                />
                <button 
                   onClick={handleImportClick}
                   className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-200"
                   title="استيراد قاعدة البيانات"
                >
                   <Upload size={16} />
                   <span className="hidden lg:inline">استيراد</span>
                </button>
                <button 
                   onClick={handleExportData}
                   className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 px-3 py-2 rounded-lg border border-slate-200 hover:border-blue-200"
                   title="حفظ قاعدة البيانات"
                >
                   <Download size={16} />
                   <span className="hidden lg:inline">حفظ</span>
                </button>
             </div>

             <div className="text-left hidden md:block">
                <p className="text-sm font-bold text-slate-800">مدير الثانوية</p>
                <p className="text-xs text-slate-500 font-medium">آخر دخول: اليوم 08:30</p>
             </div>
             <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                <User size={20} className="text-slate-500" />
             </div>
          </div>
        </header>

        {/* Dynamic View Content */}
        <div className={`p-10 ${activeTab === 'bulletins' ? 'bg-slate-200' : ''} print:p-0 print:bg-white min-h-[calc(100vh-80px)]`}>
          {activeTab === 'analysis' && renderAnalysis()}
          {activeTab === 'teachers' && renderTeacherInput()}
          {activeTab === 'review' && renderStudentReview()}
          {activeTab === 'settings' && renderSettings()}
          {activeTab === 'management' && renderManagement()}
          {activeTab === 'bulletins' && renderBulletins()}
        </div>
      </main>

      {/* Styles specifically for Bulletin Printing */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { background: white; margin: 0; padding: 0; }
          .break-after-page {
            page-break-after: always;
            break-after: page;
          }
          /* Ensure table borders print correctly */
          table, th, td, div {
            border-color: #000 !important;
          }
          /* Remove shadows and backgrounds for print */
          .shadow-lg, .shadow-xl, .shadow-2xl, .shadow-sm { box-shadow: none !important; }
          .bg-slate-200, .bg-slate-100, .bg-slate-50 { background-color: white !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}