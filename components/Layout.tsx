
import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AppMode, GradeLevel } from '../types';
import { useAuth, signInWithGoogle, logout } from '../services/firebase';
import { LogIn, LogOut, User as UserIcon, ShieldCheck, Key } from 'lucide-react';

interface LayoutProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
  selectedGrade: GradeLevel;
  setGrade: (grade: GradeLevel) => void;
  children: React.ReactNode;
  hideSidebar?: boolean;
}

const Logo: React.FC<{ size?: string }> = ({ size = "w-8 h-8" }) => (
  <div className={`${size} bg-white rounded-full p-1 flex items-center justify-center shadow-md border border-white`}>
    <svg viewBox="0 0 512 512" className="w-full h-full">
      <path 
        d="M100 380 L200 180 L256 300 L312 180 L412 380" 
        fill="none" 
        stroke="#4f46e5" 
        strokeWidth="54" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <circle cx="256" cy="300" r="32" fill="white" stroke="#4f46e5" strokeWidth="18" />
      <circle cx="400" cy="180" r="52" fill="white" stroke="#4f46e5" strokeWidth="18" />
    </svg>
  </div>
);

const Layout: React.FC<LayoutProps> = ({ currentMode, setMode, selectedGrade, setGrade, children, hideSidebar = false }) => {
  const [isGradeMenuOpen, setIsGradeMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(() => {
    if ([AppMode.LESSON, AppMode.SCENARIO, AppMode.BOARD_PLAN].includes(currentMode)) return 'PREP';
    if ([AppMode.WORKSHEET, AppMode.QUIZ, AppMode.PROJECT].includes(currentMode)) return 'MATERIALS';
    if ([AppMode.TEACHER_PANEL, AppMode.VISUALIZER, AppMode.GEOGEBRA, AppMode.MATHIGON, AppMode.ERROR_DETECTIVE].includes(currentMode)) return 'INTERACTIVE';
    if (currentMode === AppMode.GAMES || currentMode === AppMode.BINGO || currentMode === AppMode.BOARD_GAME || currentMode === AppMode.MATE_SAFE || currentMode === AppMode.MATE_MACHINE) return 'GAMIFICATION';
    if ([AppMode.ADVANCED_PRACTICE, AppMode.REMEDIAL_TEACHING, AppMode.INCLUSION].includes(currentMode)) return 'SUPPORT';
    if (currentMode === AppMode.AI_REVIEWER || currentMode === AppMode.AI_CREATOR) return 'AI_SUMMATIVE';
    if (currentMode === AppMode.ANALYTICS) return 'ANALYTICS';
    return null;
  });

  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.email === 'snezematematika@gmail.com' || user?.email === 'snezezlatkov@gmail.com';

  const toggleCategory = (cat: string) => {
    setOpenCategory(openCategory === cat ? null : cat);
  };

  React.useEffect(() => {
    if ([AppMode.LESSON, AppMode.SCENARIO, AppMode.BOARD_PLAN].includes(currentMode)) setOpenCategory('PREP');
    else if ([AppMode.WORKSHEET, AppMode.QUIZ, AppMode.PROJECT].includes(currentMode)) setOpenCategory('MATERIALS');
    else if ([AppMode.TEACHER_PANEL, AppMode.VISUALIZER, AppMode.GEOGEBRA, AppMode.MATHIGON, AppMode.ERROR_DETECTIVE].includes(currentMode)) setOpenCategory('INTERACTIVE');
    else if (currentMode === AppMode.GAMES || currentMode === AppMode.BINGO || currentMode === AppMode.BOARD_GAME || currentMode === AppMode.MATE_SAFE || currentMode === AppMode.MATE_MACHINE) setOpenCategory('GAMIFICATION');
    else if ([AppMode.ADVANCED_PRACTICE, AppMode.REMEDIAL_TEACHING, AppMode.INCLUSION].includes(currentMode)) setOpenCategory('SUPPORT');
    else if (currentMode === AppMode.AI_REVIEWER || currentMode === AppMode.AI_CREATOR) setOpenCategory('AI_SUMMATIVE');
    else if (currentMode === AppMode.ANALYTICS) setOpenCategory('ANALYTICS');
    else if (currentMode === AppMode.DASHBOARD) setOpenCategory(null);
  }, [currentMode]);

  const handleGradeSelect = (grade: GradeLevel) => {
    setGrade(grade);
    setIsGradeMenuOpen(false); // Retract after choice
  };

  // Determine max width based on mode - Teacher Panel needs more horizontal space
  const maxWidthClass = currentMode === AppMode.TEACHER_PANEL ? 'max-w-7xl' : 'max-w-5xl';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 print:bg-white">
      <Toaster position="top-right" />
      {/* Mobile Header - Only visible on small screens */}
      {!hideSidebar && (
        <div className="md:hidden bg-indigo-950 text-white p-4 flex justify-between items-center sticky top-0 z-30 shadow-md print:hidden">
          <h1 className="text-lg font-bold flex items-center gap-3">
            <Logo size="w-7 h-7" /> Мате-Ментор
          </h1>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-indigo-900 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar - Hidden when printing or if hideSidebar is true */}
      {!hideSidebar && (
        <aside className={`
          fixed inset-0 z-40 md:relative md:z-20
          w-full md:w-72 bg-indigo-900 text-white flex-shrink-0 transition-all duration-300 ease-in-out print:hidden flex flex-col h-full md:h-screen md:sticky md:top-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          
          {/* Compact Header - Hidden on mobile because we have the sticky mobile header */}
          <div className="hidden md:flex p-4 border-b border-indigo-800 bg-indigo-950/50 justify-between items-center shadow-sm">
            <h1 className="text-xl font-bold flex items-center gap-3">
              <Logo size="w-9 h-9" /> Мате-Ментор
            </h1>
            {/* Small Badge for Current Grade */}
            <span className="text-xs font-mono font-bold bg-indigo-600 text-indigo-100 px-2 py-1 rounded border border-indigo-500">
              {selectedGrade} Одд.
            </span>
          </div>

          {/* Scrollable Navigation Area */}
          <nav className="px-3 py-2 space-y-1 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-indigo-700 scrollbar-track-transparent">
            
            {/* 0. Dashboard */}
            <button
              onClick={() => {
                setMode(AppMode.DASHBOARD);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 rounded-lg transition-all flex items-center gap-3 border ${
                currentMode === AppMode.DASHBOARD 
                  ? 'bg-indigo-600 text-white shadow-lg translate-x-1 border-indigo-400' 
                  : 'text-indigo-200 hover:bg-indigo-800/50 hover:text-white border-indigo-700/30'
              }`}
            >
              <span>🏠</span> Почетна
            </button>

            {/* 1. Collapsible Grade Selector */}
            <div>
              <button
                onClick={() => setIsGradeMenuOpen(!isGradeMenuOpen)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all text-sm font-bold uppercase tracking-wider border border-transparent ${isGradeMenuOpen ? 'bg-indigo-800 text-white border-indigo-600' : 'text-indigo-200 hover:bg-indigo-800/50 hover:text-white'}`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 flex items-center justify-center bg-amber-500/20 text-amber-400 rounded-lg shadow-sm border border-amber-500/30">🏫</span> {isGradeMenuOpen ? 'Избери:' : 'Одделение'}
                </span>
                <svg 
                  className={`w-4 h-4 transform transition-transform duration-200 ${isGradeMenuOpen ? 'rotate-180' : ''}`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Expandable Options */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isGradeMenuOpen ? 'max-h-64 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                 <div className="flex flex-col gap-1 pl-2">
                    <button
                       onClick={() => handleGradeSelect(GradeLevel.VI)}
                       className={`flex items-center gap-3 w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedGrade === GradeLevel.VI ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-300 hover:bg-indigo-800 hover:text-white'}`}
                    >
                       <span className="text-lg">👶</span> VI Одделение
                    </button>
                    <button
                       onClick={() => handleGradeSelect(GradeLevel.VII)}
                       className={`flex items-center gap-3 w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedGrade === GradeLevel.VII ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-300 hover:bg-indigo-800 hover:text-white'}`}
                    >
                       <span className="text-lg">👧</span> VII Одделение
                    </button>
                    <button
                       onClick={() => handleGradeSelect(GradeLevel.VIII)}
                       className={`flex items-center gap-3 w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedGrade === GradeLevel.VIII ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-300 hover:bg-indigo-800 hover:text-white'}`}
                    >
                       <span className="text-lg">🧑</span> VIII Одделение
                    </button>
                    <button
                       onClick={() => handleGradeSelect(GradeLevel.IX)}
                       className={`flex items-center gap-3 w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedGrade === GradeLevel.IX ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-300 hover:bg-indigo-800 hover:text-white'}`}
                    >
                       <span className="text-lg">🎓</span> IX Одделение
                    </button>
                 </div>
              </div>
            </div>

            {/* 1.5. ПРОГРАМИ */}
            <div className="mt-1 mb-2">
              <button
                onClick={() => {
                  setMode(AppMode.PROGRAMS);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all border ${
                  currentMode === AppMode.PROGRAMS 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                    : 'border-transparent text-indigo-200 hover:bg-indigo-800/40 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3 font-bold text-sm uppercase tracking-wider">
                  <span className="w-6 h-6 flex items-center justify-center bg-emerald-500/20 text-emerald-400 rounded-lg shadow-sm border border-emerald-500/30 text-xs">📜</span> ПРОГРАМИ
                </span>
              </button>
            </div>

            {/* ПОДГОТОВКА И ПЛАНИРАЊЕ */}
            <div>
              <button
                onClick={() => toggleCategory('PREP')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all border ${
                  openCategory === 'PREP' 
                    ? 'bg-indigo-800/60 border-indigo-500/50 text-white shadow-inner' 
                    : 'border-transparent text-indigo-200 hover:bg-indigo-800/40 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3 font-bold text-sm uppercase tracking-wider">
                  <span>📝</span> Подготовка
                </span>
                <svg 
                  className={`w-4 h-4 transform transition-transform duration-300 ${openCategory === 'PREP' ? 'rotate-180' : ''}`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openCategory === 'PREP' ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                <div className="flex flex-col gap-0.5 pl-4 pb-1">
                  <button
                    onClick={() => {
                      setMode(AppMode.LESSON);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-3 border ${
                      currentMode === AppMode.LESSON 
                        ? 'bg-indigo-600 text-white shadow-lg border-indigo-400' 
                        : 'text-blue-200/80 hover:bg-indigo-800/40 hover:text-blue-100 border-transparent'
                    }`}
                  >
                    <span>📚</span> Лекции
                  </button>
                  <button
                    onClick={() => {
                      setMode(AppMode.SCENARIO);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-3 border ${
                      currentMode === AppMode.SCENARIO 
                        ? 'bg-indigo-600 text-white shadow-lg border-indigo-400' 
                        : 'text-emerald-200/80 hover:bg-indigo-800/40 hover:text-emerald-100 border-transparent'
                    }`}
                  >
                    <span>📋</span> Сценарија
                  </button>
                  <button
                    onClick={() => {
                      setMode(AppMode.BOARD_PLAN);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-3 border ${
                      currentMode === AppMode.BOARD_PLAN 
                        ? 'bg-indigo-600 text-white shadow-lg border-indigo-400' 
                        : 'text-indigo-200/80 hover:bg-indigo-800/40 hover:text-indigo-100 border-transparent'
                    }`}
                  >
                    <span>👨‍🏫</span> План на табла
                  </button>
                </div>
              </div>
            </div>

            {/* МАТЕРИЈАЛИ */}
            <div>
              <button
                onClick={() => toggleCategory('MATERIALS')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all border ${
                  openCategory === 'MATERIALS' 
                    ? 'bg-indigo-800/60 border-indigo-500/50 text-white shadow-inner' 
                    : 'border-transparent text-indigo-200 hover:bg-indigo-800/40 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3 font-bold text-sm uppercase tracking-wider">
                  <span>📂</span> Материјали
                </span>
                <svg 
                  className={`w-4 h-4 transform transition-transform duration-300 ${openCategory === 'MATERIALS' ? 'rotate-180' : ''}`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openCategory === 'MATERIALS' ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                <div className="flex flex-col gap-0.5 pl-4 pb-1">
                  <button
                    onClick={() => {
                      setMode(AppMode.WORKSHEET);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-3 border ${
                      currentMode === AppMode.WORKSHEET 
                        ? 'bg-indigo-600 text-white shadow-lg border-indigo-400' 
                        : 'text-sky-200/80 hover:bg-indigo-800/40 hover:text-sky-100 border-transparent'
                    }`}
                  >
                    <span>📄</span> Работни листови
                  </button>
                  <button
                    onClick={() => {
                      setMode(AppMode.QUIZ);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-3 border ${
                      currentMode === AppMode.QUIZ 
                        ? 'bg-indigo-600 text-white shadow-lg border-indigo-400' 
                        : 'text-orange-200/80 hover:bg-indigo-800/40 hover:text-orange-100 border-transparent'
                    }`}
                  >
                    <span>📝</span> Тестови
                  </button>
                  <button
                    onClick={() => {
                      setMode(AppMode.PROJECT);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-3 border ${
                      currentMode === AppMode.PROJECT 
                        ? 'bg-indigo-600 text-white shadow-lg border-indigo-400' 
                        : 'text-rose-200/80 hover:bg-indigo-800/40 hover:text-rose-100 border-transparent'
                    }`}
                  >
                    <span>🚀</span> Проектни задачи
                  </button>
                </div>
              </div>
            </div>

            {/* БИБЛИОТЕКА */}
            <div className="mt-2 mb-2">
              <button
                onClick={() => {
                  setMode(AppMode.LIBRARY);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all border ${
                  currentMode === AppMode.LIBRARY 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                    : 'border-transparent text-indigo-200 hover:bg-indigo-800/40 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3 font-bold text-sm uppercase tracking-wider">
                  <span>📖</span> Моја Библиотека
                </span>
              </button>
            </div>

            {/* ИНТЕРАКТИВНОСТИ */}
            <div>
              <button
                onClick={() => toggleCategory('INTERACTIVE')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all border ${
                  openCategory === 'INTERACTIVE' 
                    ? 'bg-indigo-800/60 border-indigo-500/50 text-white shadow-inner' 
                    : 'border-transparent text-indigo-200 hover:bg-indigo-800/40 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3 font-bold text-sm uppercase tracking-wider">
                  <span className="w-6 h-6 flex items-center justify-center bg-fuchsia-500/20 text-fuchsia-400 rounded-lg shadow-sm border border-fuchsia-500/30 text-xs">✨</span> Интерактивности
                </span>
                <svg 
                  className={`w-4 h-4 transform transition-transform duration-300 ${openCategory === 'INTERACTIVE' ? 'rotate-180' : ''}`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openCategory === 'INTERACTIVE' ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                <div className="flex flex-col gap-0.5 pl-4 pb-1">
                  <button
                    onClick={() => {
                      setMode(AppMode.TEACHER_PANEL);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-3 border ${
                      currentMode === AppMode.TEACHER_PANEL 
                        ? 'bg-indigo-600 text-white shadow-lg border-indigo-400' 
                        : 'text-teal-200/80 hover:bg-indigo-800/40 hover:text-teal-100 border-transparent'
                    }`}
                  >
                    <span>📓</span> Интерактивна тетратка
                  </button>
                  <button
                    onClick={() => {
                      setMode(AppMode.ERROR_DETECTIVE);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-3 border ${
                      currentMode === AppMode.ERROR_DETECTIVE 
                        ? 'bg-indigo-600 text-white shadow-lg border-indigo-400' 
                        : 'text-orange-200/80 hover:bg-indigo-800/40 hover:text-orange-100 border-transparent'
                    }`}
                  >
                    <span>🔍</span> Детектив за грешки
                  </button>
                  <button
                    onClick={() => {
                      setMode(AppMode.VISUALIZER);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-3 border ${
                      currentMode === AppMode.VISUALIZER 
                        ? 'bg-indigo-600 text-white shadow-lg border-indigo-400' 
                        : 'text-fuchsia-200/80 hover:bg-indigo-800/40 hover:text-fuchsia-100 border-transparent'
                    }`}
                  >
                    <span>🎨</span> AI Визуелизатор
                  </button>
                  <button
                    onClick={() => {
                      setMode(AppMode.GEOGEBRA);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-3 border ${
                      currentMode === AppMode.GEOGEBRA 
                        ? 'bg-indigo-600 text-white shadow-lg border-indigo-400' 
                        : 'text-blue-200/80 hover:bg-indigo-800/40 hover:text-blue-100 border-transparent'
                    }`}
                  >
                    <span>📐</span> GeoGebra
                  </button>
                  <button
                    onClick={() => {
                      setMode(AppMode.MATHIGON);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-3 border ${
                      currentMode === AppMode.MATHIGON 
                        ? 'bg-indigo-600 text-white shadow-lg border-indigo-400' 
                        : 'text-amber-200/80 hover:bg-indigo-800/40 hover:text-amber-100 border-transparent'
                    }`}
                  >
                    <span>🎨</span> Mathigon
                  </button>
                </div>
              </div>
            </div>

            {/* ГЕЈМИФИКАЦИЈА */}
            <div>
              <button
                onClick={() => toggleCategory('GAMIFICATION')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all border ${
                  openCategory === 'GAMIFICATION' 
                    ? 'bg-indigo-800/60 border-indigo-500/50 text-white shadow-inner' 
                    : 'border-transparent text-indigo-200 hover:bg-indigo-800/40 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3 font-bold text-sm uppercase tracking-wider">
                  <span>🏆</span> Гејмификација
                </span>
                <svg 
                  className={`w-4 h-4 transform transition-transform duration-300 ${openCategory === 'GAMIFICATION' ? 'rotate-180' : ''}`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openCategory === 'GAMIFICATION' ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                <div className="flex flex-col gap-0.5 pl-4 pb-1">
                  <button
                    onClick={() => {
                      setMode(AppMode.GAMES);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-3 border ${
                      currentMode === AppMode.GAMES 
                        ? 'bg-indigo-600 text-white shadow-lg border-indigo-400' 
                        : 'text-pink-200/80 hover:bg-indigo-800/40 hover:text-pink-100 border-transparent'
                    }`}
                  >
                    <span>🎮</span> Мате-Хут
                  </button>
                  <button
                    onClick={() => {
                      setMode(AppMode.BINGO);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-3 border ${
                      currentMode === AppMode.BINGO 
                        ? 'bg-indigo-600 text-white shadow-lg border-indigo-400' 
                        : 'text-amber-200/80 hover:bg-indigo-800/40 hover:text-amber-100 border-transparent'
                    }`}
                  >
                    <span>🎯</span> Мате-Бинго
                  </button>
                  <button
                    onClick={() => {
                      setMode(AppMode.BOARD_GAME);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-3 border ${
                      currentMode === AppMode.BOARD_GAME 
                        ? 'bg-indigo-600 text-white shadow-lg border-indigo-400' 
                        : 'text-emerald-200/80 hover:bg-indigo-800/40 hover:text-emerald-100 border-transparent'
                    }`}
                  >
                    <span>🏁</span> Мате-Трка
                  </button>
                  <button
                    onClick={() => {
                      setMode(AppMode.MATE_SAFE);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-3 border ${
                      currentMode === AppMode.MATE_SAFE 
                        ? 'bg-indigo-600 text-white shadow-lg border-indigo-400' 
                        : 'text-indigo-200/80 hover:bg-indigo-800/40 hover:text-indigo-100 border-transparent'
                    }`}
                  >
                    <span>🔐</span> Мате-сеф
                  </button>
                  <button
                    onClick={() => {
                      setMode(AppMode.MATE_MACHINE);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-3 border ${
                      currentMode === AppMode.MATE_MACHINE 
                        ? 'bg-indigo-600 text-white shadow-lg border-indigo-400' 
                        : 'text-slate-200/80 hover:bg-indigo-800/40 hover:text-slate-100 border-transparent'
                    }`}
                  >
                    <span>⚙️</span> Мате-машина
                  </button>
                </div>
              </div>
            </div>

            {/* АИ СУМАТИВНО ОЦЕНУВАЊЕ */}
            <div>
              <button
                onClick={() => toggleCategory('AI_SUMMATIVE')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all border ${
                  openCategory === 'AI_SUMMATIVE' 
                    ? 'bg-indigo-800/60 border-indigo-500/50 text-white shadow-inner' 
                    : 'border-transparent text-indigo-200 hover:bg-indigo-800/40 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3 font-bold text-sm uppercase tracking-wider">
                  <span className="w-6 h-6 flex items-center justify-center bg-cyan-500/20 text-cyan-400 rounded-lg shadow-sm border border-cyan-500/30">📊</span> АИ Сумативно
                </span>
                <svg 
                  className={`w-4 h-4 transform transition-transform duration-300 ${openCategory === 'AI_SUMMATIVE' ? 'rotate-180' : ''}`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openCategory === 'AI_SUMMATIVE' ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                <div className="flex flex-col gap-0.5 pl-4 pb-1">
                  <button
                    onClick={() => {
                      setMode(AppMode.AI_CREATOR);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-3 border ${
                      currentMode === AppMode.AI_CREATOR 
                        ? 'bg-indigo-600 text-white shadow-lg border-indigo-400' 
                        : 'text-indigo-200/80 hover:bg-indigo-800/40 hover:text-indigo-100 border-transparent'
                    }`}
                  >
                    <span>✨</span> АИ Креатор
                  </button>
                  <button
                    onClick={() => {
                      setMode(AppMode.AI_REVIEWER);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-3 border ${
                      currentMode === AppMode.AI_REVIEWER 
                        ? 'bg-indigo-600 text-white shadow-lg border-indigo-400' 
                        : 'text-cyan-200/80 hover:bg-indigo-800/40 hover:text-cyan-100 border-transparent'
                    }`}
                  >
                    <span>🔍</span> АИ Прегледувач
                  </button>
                </div>
              </div>
            </div>

            {/* ПОДДРШКА */}
            <div>
              <button
                onClick={() => toggleCategory('SUPPORT')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all border ${
                  openCategory === 'SUPPORT' 
                    ? 'bg-indigo-800/60 border-indigo-500/50 text-white shadow-inner' 
                    : 'border-transparent text-indigo-200 hover:bg-indigo-800/40 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3 font-bold text-sm uppercase tracking-wider">
                  <span>🤝</span> Поддршка
                </span>
                <svg 
                  className={`w-4 h-4 transform transition-transform duration-300 ${openCategory === 'SUPPORT' ? 'rotate-180' : ''}`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openCategory === 'SUPPORT' ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                <div className="flex flex-col gap-0.5 pl-4 pb-1">
                  <button
                    onClick={() => {
                      setMode(AppMode.ADVANCED_PRACTICE);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-3 border ${
                      currentMode === AppMode.ADVANCED_PRACTICE 
                        ? 'bg-indigo-600 text-white shadow-lg border-indigo-400' 
                        : 'text-yellow-200/80 hover:bg-indigo-800/40 hover:text-yellow-100 border-transparent'
                    }`}
                  >
                    <span>🏆</span> Додатна настава
                  </button>
                  <button
                    onClick={() => {
                      setMode(AppMode.REMEDIAL_TEACHING);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-3 border ${
                      currentMode === AppMode.REMEDIAL_TEACHING 
                        ? 'bg-indigo-600 text-white shadow-lg border-indigo-400' 
                        : 'text-emerald-200/80 hover:bg-indigo-800/40 hover:text-emerald-100 border-transparent'
                    }`}
                  >
                    <span>🤝</span> Дополнителна настава
                  </button>
                  <button
                    onClick={() => {
                      setMode(AppMode.INCLUSION);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-3 border ${
                      currentMode === AppMode.INCLUSION 
                        ? 'bg-indigo-600 text-white shadow-lg border-indigo-400' 
                        : 'text-purple-200/80 hover:bg-indigo-800/40 hover:text-purple-100 border-transparent'
                    }`}
                  >
                    <span>✨</span> Инклузија
                  </button>
                </div>
              </div>
            </div>

            {/* АНАЛИТИКА */}
            {isAdmin && (
              <div className="border-t border-indigo-800/50 pt-1">
                <button
                  onClick={() => {
                    toggleCategory('ANALYTICS');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all border ${
                    openCategory === 'ANALYTICS' 
                      ? 'bg-indigo-800/60 border-indigo-500/50 text-white shadow-inner' 
                      : 'border-transparent text-indigo-200 hover:bg-indigo-800/40 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3 font-bold text-sm uppercase tracking-wider">
                    <span>📊</span> Аналитика
                  </span>
                  <svg 
                    className={`w-4 h-4 transform transition-transform duration-300 ${openCategory === 'ANALYTICS' ? 'rotate-180' : ''}`} 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openCategory === 'ANALYTICS' ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                  <div className="flex flex-col gap-0.5 pl-4 pb-1">
                    <button
                      onClick={() => setMode(AppMode.ANALYTICS)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-3 border ${
                        currentMode === AppMode.ANALYTICS 
                          ? 'bg-indigo-600 text-white shadow-lg border-indigo-400' 
                          : 'text-indigo-400 hover:bg-indigo-800/40 hover:text-slate-100 border-transparent'
                      }`}
                    >
                      <span>📊</span> Статистички извештаи
                    </button>
                  </div>
                </div>
              </div>
            )}
          </nav>

          {/* Footer Section - User Profile & Logout */}
          <div className="p-3 mt-auto border-t border-indigo-800 bg-indigo-950/50 backdrop-blur-sm">
             {!authLoading && (
               <div className="mb-2">
                 {user ? (
                   <div className="space-y-2">
                     <div className="flex items-center gap-2 p-1.5 bg-indigo-800/50 rounded-xl border border-indigo-700/50">
                       {user.photoURL ? (
                         <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border-2 border-indigo-500 shadow-sm" referrerPolicy="no-referrer" />
                       ) : (
                         <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-indigo-500">
                           <UserIcon className="w-4 h-4 text-indigo-100" />
                         </div>
                       )}
                       <div className="flex-1 min-w-0">
                         <p className="text-xs font-bold text-white truncate">{user.displayName || 'Корисник'}</p>
                         <p className="text-[9px] text-indigo-300 truncate flex items-center gap-1">
                           {user.email === 'snezematematika@gmail.com' && <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />}
                           {user.email}
                         </p>
                       </div>
                     </div>
                     <button 
                       onClick={() => logout()}
                       className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-indigo-800/80 hover:bg-red-900/40 text-indigo-200 hover:text-red-200 rounded-lg text-[10px] font-bold transition-all border border-indigo-700 hover:border-red-800/50"
                     >
                       <LogOut className="w-3 h-3" /> Одјави се
                     </button>
                   </div>
                 ) : (
                   <div className="space-y-2">
                     <button 
                       onClick={() => signInWithGoogle()}
                       className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white text-indigo-900 rounded-lg font-bold text-xs shadow-md hover:bg-indigo-50 transition-all transform active:scale-95"
                     >
                       <LogIn className="w-3.5 h-3.5" /> Најави се со Google
                     </button>
                   </div>
                 )}
               </div>
             )}
             <div className="text-center">
                 <p className="text-[9px] uppercase tracking-widest text-indigo-400 font-semibold mb-0.5">АВТОР НА ПРОЕКТОТ</p>
                 <p className="text-sm font-bold text-white mb-0.5">Снежана Златковска</p>
                 <p className="text-[9px] text-indigo-300 font-mono">v1.0 • 2025</p>
             </div>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 h-auto md:h-screen md:overflow-y-auto print:h-auto print:overflow-visible print:p-0">
        <div className={`${maxWidthClass} mx-auto bg-white rounded-2xl shadow-xl min-h-[90%] p-6 md:p-8 print:shadow-none print:max-w-none print:rounded-none print:p-0 transition-all duration-500`}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
