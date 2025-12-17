import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Award, 
  Users, 
  BookOpen, 
  Printer, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  User,
  School,
  ChevronDown,
  Download,
  Upload,
  FileText,
  Edit3,
  X,
  Save,
  Calculator,
  Trophy,
  AlertTriangle,
  Timer,
  BarChart2,
  Percent,
  Settings,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList
} from 'recharts';
import { Student, SubjectKey, SUBJECTS, Tab, ClassGroup, SubjectData, BEHAVIORS, Marks, ABSENCE_OPTIONS, AppConfig, DEFAULT_CONFIG, CouncilData } from './types';
import { generateClasses, getDecision } from './constants';

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
  const [activeTab, setActiveTab] = useState<Tab>('analysis');
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [currentClassId, setCurrentClassId] = useState<string>('');
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  
  // Teacher Tab State
  const [selectedTeacherSubject, setSelectedTeacherSubject] = useState<SubjectKey | null>(null);
  
  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudentRank, setEditingStudentRank] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<SubjectData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize data
  useEffect(() => {
    const loadedClasses = generateClasses();
    setClasses(loadedClasses);
    if (loadedClasses.length > 0) {
      setCurrentClassId(loadedClasses[0].id);
      setSelectedStudentId(1); // Default to first student
    }
  }, []);

  // Helper to get current class object
  const currentClass = useMemo(() => 
    classes.find(c => c.id === currentClassId), 
  [classes, currentClassId]);

  const students = currentClass?.students || [];

  // Reset selection when class changes
  useEffect(() => {
    if (students.length > 0) {
      setSelectedStudentId(students[0].rank);
    }
  }, [currentClassId]);

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
    if (confirm("هل أنت متأكد؟ سيتم إعادة حساب تقديرات جميع الطلاب بناءً على المعايير الجديدة. سيتم فقدان التقديرات المعدلة يدوياً.")) {
      setClasses(prevClasses => prevClasses.map(c => ({
        ...c,
        students: c.students.map(s => ({
          ...s,
          council_data: {
            ...s.council_data,
            final_decision: getDecision(s.avg, config)
          }
        }))
      })));
      alert("تم تحديث القرارات لجميع الطلاب.");
    }
  };


  // --- Derived Statistics ---
  const stats = useMemo(() => {
    if (students.length === 0) return null;
    const totalAvg = students.reduce((acc, s) => acc + s.avg, 0);
    const classAvg = (totalAvg / students.length).toFixed(2);
    const passed = students.filter(s => s.avg >= 10).length;
    const passRate = ((passed / students.length) * 100).toFixed(1);
    const maxAvg = Math.max(...students.map(s => s.avg)).toFixed(2);
    const minAvg = Math.min(...students.map(s => s.avg)).toFixed(2);
    
    // Subject Performance
    const subjectPerformance = SUBJECTS.map(subj => {
      const sum = students.reduce((acc, s) => acc + s.marks[subj.key].avg, 0);
      return {
        name: subj.label,
        avg: Number((sum / students.length).toFixed(2)),
        key: subj.key
      };
    }).sort((a, b) => b.avg - a.avg);

    // Distribution based on dynamic config? Or fixed buckets? 
    // Usually distribution charts use fixed ranges (10-12, 12-14...), 
    // but we can try to match the thresholds loosely or keep standard buckets.
    // Let's keep standard buckets for visualization consistency, but we could label them.
    const distribution = [
      { name: 'امتياز (16+)', value: students.filter(s => s.avg >= 16).length, color: '#10b981' }, 
      { name: 'جيد (14-16)', value: students.filter(s => s.avg >= 14 && s.avg < 16).length, color: '#3b82f6' }, 
      { name: 'قريب من الجيد (10-14)', value: students.filter(s => s.avg >= 10 && s.avg < 14).length, color: '#f59e0b' }, 
      { name: 'ضعيف (<10)', value: students.filter(s => s.avg < 10).length, color: '#ef4444' }, 
    ];

    // Deep Insights
    const topStudents = [...students].sort((a, b) => b.avg - a.avg).slice(0, 3);
    
    // Disruptors (Based on Council Data now)
    const negativeBehaviors = ["مشاغب", "كثير الحركة"];
    const disruptors = students.filter(s => negativeBehaviors.includes(s.council_data.behavior_status));

    // Absentees - Sort by severity
    const absenceSeverity: Record<string, number> = {
      "كثير الغياب": 3,
      "غيابات غير مبررة": 2,
      "غيابات مبررة": 1,
      "مواظب": 0
    };
    
    const absentees = [...students]
       .sort((a, b) => (absenceSeverity[b.council_data.absence_status || ""] || 0) - (absenceSeverity[a.council_data.absence_status || ""] || 0))
       .filter(s => (absenceSeverity[s.council_data.absence_status || ""] || 0) > 0)
       .slice(0, 5);

    // At Risk
    const atRisk = students.filter(s => s.avg >= 9.00 && s.avg < 10.00).sort((a, b) => a.avg - b.avg);

    return { 
      classAvg, 
      passRate, 
      maxAvg, 
      minAvg, 
      subjectPerformance, 
      distribution, 
      topStudents,
      disruptors,
      absentees,
      atRisk
    };
  }, [students]);

  // --- Actions ---

  const updateStudentData = (rank: number, updates: Partial<Student> | { council_data: Partial<CouncilData> }) => {
    setClasses(prevClasses => prevClasses.map(c => {
      if (c.id === currentClassId) {
        return {
          ...c,
          students: c.students.map(s => {
            if (s.rank === rank) {
               // Handle nested council_data updates
               if ('council_data' in updates) {
                 return {
                   ...s,
                   council_data: { ...s.council_data, ...updates.council_data }
                 };
               }
               return { ...s, ...updates as Partial<Student> };
            }
            return s;
          })
        };
      }
      return c;
    }));
  };

  const openEditModal = (student: Student, subject: SubjectKey) => {
    setEditingStudentRank(student.rank);
    setEditFormData({ ...student.marks[subject] });
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
    if (editingStudentRank === null || !selectedTeacherSubject || !editFormData) return;

    setClasses(prevClasses => prevClasses.map(c => {
      if (c.id === currentClassId) {
        return {
          ...c,
          students: c.students.map(s => {
            if (s.rank === editingStudentRank) {
              const newMarks = {
                ...s.marks,
                [selectedTeacherSubject]: editFormData
              };
              
              // Recalculate Student Overall Average
              const sumAvg = (Object.values(newMarks) as SubjectData[]).reduce((acc, m) => acc + m.avg, 0);
              const realAvg = Number((sumAvg / SUBJECTS.length).toFixed(2));
              
              return {
                ...s,
                marks: newMarks,
                avg: realAvg
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

    return (
    <div className="space-y-8 animate-fade-in p-2">
      
      {/* Top Section: KPI & Custom Cards matching screenshots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <StatCard title="معدل القسم" value={stats.classAvg} subtext="الهدف: 12.00" icon={TrendingUp} color="bg-blue-600" />
        
        {/* KPI 2 */}
        <StatCard title="نسبة النجاح" value={`${stats.passRate}%`} subtext={`${students.filter(s => s.avg >= 10).length} ناجح`} icon={CheckCircle2} color="bg-emerald-600" />

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
    if (selectedTeacherSubject) {
        const marks = students.map(s => s.marks[selectedTeacherSubject]);
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
                    <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    اضغط على التلميذ للتعديل
                    </span>
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
                            const subData = s.marks[selectedTeacherSubject];
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
                   {students.find(s => s.rank === editingStudentRank)?.name} • {SUBJECTS.find(s => s.key === selectedTeacherSubject)?.label}
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
                     placeholder="ملاحظة حول أداء التلميذ..."
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
    const selectedStudent = students.find(s => s.rank === selectedStudentId) || students[0];
    const suggestedDecision = selectedStudent ? getDecision(selectedStudent.avg, config) : '';

    return (
      <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6">
        {/* List Sidebar (25% on large screens) */}
        <div className="w-full lg:w-1/4 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
             <h3 className="font-bold text-slate-800">قائمة التلاميذ</h3>
             <p className="text-xs text-slate-500 mt-1">{currentClass.name} • {students.length} تلميذ</p>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {students.map(s => (
              <button
                key={s.rank}
                onClick={() => setSelectedStudentId(s.rank)}
                className={`w-full text-right p-3 rounded-lg flex items-center justify-between transition-all ${
                  selectedStudentId === s.rank 
                  ? 'bg-blue-600 text-white shadow-md transform scale-[1.02]' 
                  : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    selectedStudentId === s.rank ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {s.rank}
                  </div>
                  <span className="text-sm font-bold truncate">{s.name}</span>
                </div>
                <span className={`text-xs font-black ${
                  selectedStudentId === s.rank ? 'text-white' : s.avg >= 10 ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {s.avg.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area - Master Detail Layout (75%) */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pb-4">
          {selectedStudent && (
            <>
              {/* Top Section: Profile & Decision */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 shrink-0">
                 {/* Profile Summary Card */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center items-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    <div className="flex items-center gap-6 w-full">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg shrink-0">
                           <User size={40} className="text-slate-400" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800">{selectedStudent.name}</h2>
                                    <span className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-bold mt-1">الرتبة #{selectedStudent.rank}</span>
                                </div>
                                <div className={`px-4 py-2 rounded-lg font-black text-xl ${selectedStudent.avg >= 10 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    {selectedStudent.avg.toFixed(2)}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">الغيابات (المجلس)</p>
                                    <p className="text-xs font-black text-slate-700 pt-1">{selectedStudent.council_data.absence_status}</p>
                                </div>
                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">السلوك العام</p>
                                    <p className="text-sm font-bold text-slate-700 mt-1 truncate">{selectedStudent.council_data.behavior_status}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* Council Decision Box */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Award size={18} className="text-amber-500" />
                        قرارات المجلس
                    </h3>
                    <div className="flex gap-4 mb-4">
                        <div className="w-1/2">
                            <label className="block text-xs font-bold text-slate-500 mb-1">
                              القرار النهائي
                              <span className="text-[10px] text-blue-500 font-normal mr-2">(المقترح: {suggestedDecision})</span>
                            </label>
                            <select 
                                className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm font-bold text-slate-700 focus:border-blue-500 focus:ring-0 outline-none bg-slate-50"
                                value={selectedStudent.council_data.final_decision}
                                onChange={(e) => updateStudentData(selectedStudent.rank, { council_data: { final_decision: e.target.value } })}
                            >
                                <option value="امتياز">امتياز</option>
                                <option value="تهنئة">تهنئة</option>
                                <option value="تشجيع">تشجيع</option>
                                <option value="لوحة شرف">لوحة شرف</option>
                                <option value="بدون">بدون</option>
                                <option value="إنذار">إنذار</option>
                                <option value="توبيخ">توبيخ</option>
                            </select>
                        </div>
                        <div className="w-1/2">
                           <label className="block text-xs font-bold text-slate-500 mb-1">السلوك العام</label>
                           <select 
                              className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm font-medium focus:border-blue-500 focus:ring-0 outline-none bg-white"
                              value={selectedStudent.council_data.behavior_status}
                              onChange={(e) => updateStudentData(selectedStudent.rank, { council_data: { behavior_status: e.target.value } })}
                           >
                              {BEHAVIORS.map(b => <option key={b} value={b}>{b}</option>)}
                           </select>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 mb-4">
                       <div className="w-1/2">
                           <label className="block text-xs font-bold text-slate-500 mb-1">وضعية الغياب</label>
                           <select 
                              className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm font-bold text-slate-700 focus:border-blue-500 outline-none"
                              value={selectedStudent.council_data.absence_status}
                              onChange={(e) => updateStudentData(selectedStudent.rank, { council_data: { absence_status: e.target.value } })}
                           >
                              {ABSENCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                           </select>
                       </div>
                    </div>
                    <div className="flex-1">
                         <label className="block text-xs font-bold text-slate-500 mb-1">ملاحظة المجلس النهائية (تظهر في الكشف)</label>
                         <textarea 
                            className="w-full h-full min-h-[60px] border-2 border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:border-blue-500 outline-none resize-none bg-white placeholder-slate-400"
                            placeholder="توجيهات بيداغوجية..."
                            value={selectedStudent.council_data.observation || ''}
                            onChange={(e) => updateStudentData(selectedStudent.rank, { council_data: { observation: e.target.value } })}
                         ></textarea>
                    </div>
                 </div>
              </div>

              {/* Bottom Section: Full Width Transcript */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0">
                 <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                       <FileText size={18} className="text-blue-600" />
                       كشف النقاط التفصيلي
                    </h3>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                       <thead className="bg-white border-b border-slate-200 text-slate-500 text-xs uppercase font-bold">
                          <tr>
                             <th className="p-4 w-48">المادة</th>
                             <th className="p-4 text-center w-24">التقويم</th>
                             <th className="p-4 text-center w-24">الفرض</th>
                             <th className="p-4 text-center w-24">الاختبار</th>
                             <th className="p-4 text-center w-24 bg-slate-50">المعدل</th>
                             <th className="p-4">ملاحظة الأستاذ</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {SUBJECTS.map(sub => {
                             const m = selectedStudent.marks[sub.key];
                             return (
                                <tr key={sub.key} className="hover:bg-slate-50 transition-colors">
                                   <td className="p-4 font-bold text-slate-800 border-l border-slate-100 flex items-center gap-2">
                                     <div className={`w-2 h-2 rounded-full ${m.avg >= 10 ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                                     {sub.label}
                                   </td>
                                   <td className="p-4 text-center font-medium text-slate-600">{m.eval}</td>
                                   <td className="p-4 text-center font-medium text-slate-600">{m.test}</td>
                                   <td className="p-4 text-center font-bold text-slate-800">{m.exam}</td>
                                   <td className="p-4 text-center bg-slate-50">
                                      <span className={`px-2 py-1 rounded text-xs font-black ${m.avg < 10 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                         {m.avg}
                                      </span>
                                   </td>
                                   <td className="p-4 text-sm text-slate-600 italic">
                                     {m.teacher_remark || <span className="text-slate-300 text-xs">لا توجد ملاحظة</span>}
                                   </td>
                                </tr>
                             );
                          })}
                       </tbody>
                    </table>
                 </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderBulletins = () => {
    return (
      <div className="space-y-12 print:space-y-0">
         {/* No-print control panel */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 no-print flex justify-between items-center">
            <div>
               <h2 className="text-xl font-bold text-slate-800">كشوف النقاط الرسمية</h2>
               <p className="text-slate-500 text-sm">جاهزة للطباعة على ورق A4</p>
            </div>
            <button 
             onClick={handlePrint}
             className="bg-slate-900 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-black shadow-lg transition-all font-bold"
           >
             <Printer size={18} />
             طباعة الكل
           </button>
         </div>

         {/* Bulletin Cards */}
         {students.map((student) => {
            return (
               <div key={student.rank} className="bg-white shadow-xl p-10 min-h-[29.7cm] print:min-h-0 print:h-auto print:shadow-none print:p-8 print:m-0 break-after-page relative text-black mx-auto max-w-[21cm] print:w-full print:max-w-none">
                  {/* Header */}
                  <div className="border-b-2 border-black pb-4 mb-6">
                     <div className="flex justify-between items-start mb-6">
                        <div className="text-center w-1/3">
                           <p className="font-bold text-xs">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                           <p className="font-bold text-xs">وزارة التربية الوطنية</p>
                        </div>
                        <div className="text-center w-1/3">
                           <h1 className="text-3xl font-black border-2 border-black py-2 px-6 rounded-xl inline-block">كشف النقاط</h1>
                           <p className="text-sm mt-2 font-bold uppercase">الفصل الثاني</p>
                        </div>
                        <div className="text-center w-1/3">
                           <p className="font-bold text-lg">ثانوية الامتياز</p>
                           <p className="text-sm font-medium">السنة الدراسية: 2023/2024</p>
                        </div>
                     </div>
                     
                     <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-black print:bg-transparent">
                        <div className="w-1/2 border-l border-black pl-4">
                           <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">الاسم واللقب</p>
                           <p className="text-2xl font-black">{student.name}</p>
                        </div>
                        <div className="w-1/4 border-l border-black px-4">
                           <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">القسم</p>
                           <p className="font-bold text-lg">{currentClass.name}</p>
                        </div>
                        <div className="w-1/4 text-center">
                           <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">الرتبة</p>
                           <div className="inline-block bg-black text-white rounded-full w-10 h-10 flex items-center justify-center font-black text-lg print:bg-black print:text-white">
                              {student.rank}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Marks Table */}
                  <table className="w-full text-xs text-right border-collapse border border-black mb-6">
                     <thead>
                        <tr className="bg-slate-100 print:bg-slate-200">
                           <th className="border border-black p-2 w-1/4 font-black">المادة</th>
                           <th className="border border-black p-2 text-center w-16 font-bold">التقويم</th>
                           <th className="border border-black p-2 text-center w-16 font-bold">الفرض</th>
                           <th className="border border-black p-2 text-center w-16 font-bold">الاختبار</th>
                           <th className="border border-black p-2 text-center w-16 font-black bg-slate-200 print:bg-slate-300">المعدل</th>
                           <th className="border border-black p-2 w-1/4 font-bold">ملاحظات الأستاذ</th>
                        </tr>
                     </thead>
                     <tbody>
                        {SUBJECTS.map((sub) => {
                           const m = student.marks[sub.key];
                           return (
                           <tr key={sub.key} className="print:h-10">
                              <td className="border border-black p-2 font-bold">{sub.label}</td>
                              <td className="border border-black p-2 text-center font-medium">{m.eval}</td>
                              <td className="border border-black p-2 text-center font-medium">{m.test}</td>
                              <td className="border border-black p-2 text-center font-bold">{m.exam}</td>
                              <td className={`border border-black p-2 text-center font-black text-sm bg-slate-50 print:bg-slate-100`}>
                                 {m.avg.toFixed(2)}
                              </td>
                              <td className="border border-black p-2 italic text-[10px]">
                                 {m.teacher_remark || ''}
                              </td>
                           </tr>
                           )
                        })}
                     </tbody>
                  </table>

                  {/* Footer Stats & Decision */}
                  <div className="flex border border-black mb-12 min-h-[120px]">
                     {/* Stats (Left for RTL) */}
                     <div className="w-1/3 border-l border-black p-4 bg-slate-50 print:bg-slate-100 flex flex-col justify-center gap-3">
                        <div className="flex justify-between items-center border-b border-black pb-2">
                            <span className="font-bold text-sm uppercase">المعدل الفصلي</span>
                            <span className="text-3xl font-black">{student.avg.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold">الغيابات</span>
                            <span className="text-sm font-bold truncate max-w-[100px]">{student.council_data.absence_status}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold">السلوك العام</span>
                            <span className="text-xs font-medium">{student.council_data.behavior_status}</span> 
                        </div>
                     </div>
                     
                     {/* Decision & Obs */}
                     <div className="w-2/3 p-4 flex">
                        <div className="w-1/3 flex items-center justify-center border-l border-black">
                           <div className="text-center">
                              <p className="text-[10px] font-bold uppercase mb-2 text-slate-500">قرار المجلس</p>
                              <span className="inline-block border-2 border-black px-4 py-2 rounded-lg font-black text-lg shadow-sm">
                                 {student.council_data.final_decision}
                              </span>
                           </div>
                        </div>
                        <div className="w-2/3 pr-4 flex flex-col">
                           <p className="font-bold text-xs underline mb-2">ملاحظات المجلس</p>
                           <p className="text-sm font-medium leading-relaxed italic">
                              {student.council_data.observation || 'لا توجد ملاحظات إضافية.'}
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Signatures */}
                  <div className="flex justify-between mt-8 px-16">
                     <div className="text-center">
                        <p className="font-bold mb-16 text-sm underline">توقيع الولي</p>
                     </div>
                     <div className="text-center">
                        <p className="font-bold mb-16 text-sm underline">مدير المؤسسة</p>
                     </div>
                  </div>
                  
                  {/* Print footer helper */}
                  <div className="hidden print:block absolute bottom-4 right-0 left-0 text-center text-[8px] text-slate-400">
                     تم استخراج هذه الوثيقة رقمياً عبر منصة مجلس القسم الرقمي - {new Date().toLocaleDateString('ar-DZ')}
                  </div>
               </div>
            );
         })}
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-slate-900 text-white rounded-xl">
               <Settings size={24} />
            </div>
            <div>
               <h2 className="text-2xl font-black text-slate-800">إعدادات المجلس</h2>
               <p className="text-slate-500">ضبط عتبات التقديرات وتحديث البيانات</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
               <h3 className="font-bold text-lg text-slate-700 border-b pb-2">عتبات التقديرات</h3>
               <div className="space-y-3">
                  <div className="flex items-center justify-between">
                     <label className="font-bold text-slate-600">امتياز (Excellence)</label>
                     <input 
                        type="number" 
                        value={config.excellence}
                        onChange={(e) => setConfig({...config, excellence: Number(e.target.value)})}
                        className="w-20 border-2 border-slate-200 rounded-lg p-2 text-center font-black"
                     />
                  </div>
                  <div className="flex items-center justify-between">
                     <label className="font-bold text-slate-600">تهنئة (Congratulations)</label>
                     <input 
                        type="number" 
                        value={config.congrats}
                        onChange={(e) => setConfig({...config, congrats: Number(e.target.value)})}
                        className="w-20 border-2 border-slate-200 rounded-lg p-2 text-center font-black"
                     />
                  </div>
                  <div className="flex items-center justify-between">
                     <label className="font-bold text-slate-600">تشجيع (Encouragement)</label>
                     <input 
                        type="number" 
                        value={config.encouragement}
                        onChange={(e) => setConfig({...config, encouragement: Number(e.target.value)})}
                        className="w-20 border-2 border-slate-200 rounded-lg p-2 text-center font-black"
                     />
                  </div>
                  <div className="flex items-center justify-between">
                     <label className="font-bold text-slate-600">لوحة شرف (Honor Board)</label>
                     <input 
                        type="number" 
                        value={config.honor}
                        onChange={(e) => setConfig({...config, honor: Number(e.target.value)})}
                        className="w-20 border-2 border-slate-200 rounded-lg p-2 text-center font-black"
                     />
                  </div>
               </div>
             </div>

             <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col justify-center items-center text-center">
                 <RefreshCw size={48} className="text-slate-400 mb-4" />
                 <h3 className="font-bold text-lg text-slate-800 mb-2">تطبيق التغييرات</h3>
                 <p className="text-sm text-slate-500 mb-6">
                    تطبيق هذه العتبات سيقوم بإعادة حساب "القرار النهائي" لجميع الطلاب في جميع الأقسام تلقائياً.
                 </p>
                 <button 
                   onClick={applyDecisionsToAll}
                   className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2"
                 >
                   <RefreshCw size={18} />
                   تحديث قرارات كل الطلاب
                 </button>
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
        }
      `}</style>
    </div>
  );
}