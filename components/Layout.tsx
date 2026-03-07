
import React, { useState } from 'react';
import { AppMode, GradeLevel } from '../types';

interface LayoutProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
  selectedGrade: GradeLevel;
  setGrade: (grade: GradeLevel) => void;
  children: React.ReactNode;
  hideSidebar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ currentMode, setMode, selectedGrade, setGrade, children, hideSidebar = false }) => {
  const [isGradeMenuOpen, setIsGradeMenuOpen] = useState(false);

  const handleGradeSelect = (grade: GradeLevel) => {
    setGrade(grade);
    setIsGradeMenuOpen(false); // Retract after choice
  };

  // Determine max width based on mode - Teacher Panel needs more horizontal space
  const maxWidthClass = currentMode === AppMode.TEACHER_PANEL ? 'max-w-7xl' : 'max-w-5xl';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 print:bg-white">
      {/* Sidebar - Hidden when printing or if hideSidebar is true */}
      {!hideSidebar && (
        <aside className="w-full md:w-72 bg-indigo-900 text-white flex-shrink-0 transition-all print:hidden flex flex-col h-auto md:h-screen relative md:sticky md:top-0 z-20">
          
          {/* Compact Header */}
          <div className="p-4 border-b border-indigo-800 bg-indigo-950/50 flex justify-between items-center shadow-sm">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">📐</span> Мате-Ментор
            </h1>
            {/* Small Badge for Current Grade */}
            <span className="text-xs font-mono font-bold bg-indigo-600 text-indigo-100 px-2 py-1 rounded border border-indigo-500">
              {selectedGrade} Одд.
            </span>
          </div>

          {/* Scrollable Navigation Area */}
          <nav className="px-3 py-3 space-y-1 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-indigo-700 scrollbar-track-transparent">
            
            {/* 1. Collapsible Grade Selector */}
            <div className="mb-2 pb-2 border-b border-indigo-800/50">
              <button
                onClick={() => setIsGradeMenuOpen(!isGradeMenuOpen)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-sm font-bold uppercase tracking-wider border border-transparent ${isGradeMenuOpen ? 'bg-indigo-800 text-white border-indigo-600' : 'text-indigo-200 hover:bg-indigo-800/50 hover:text-white'}`}
              >
                <span className="flex items-center gap-2">
                  🎓 {isGradeMenuOpen ? 'Избери:' : 'Одделение'}
                </span>
                <svg 
                  className={`w-4 h-4 transform transition-transform duration-200 ${isGradeMenuOpen ? 'rotate-180' : ''}`} 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expandable Options */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isGradeMenuOpen ? 'max-h-32 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                 <div className="flex flex-col gap-1 pl-2">
                    <button
                       onClick={() => handleGradeSelect(GradeLevel.VI)}
                       className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedGrade === GradeLevel.VI ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-300 hover:bg-indigo-800 hover:text-white'}`}
                    >
                       <span className="text-lg">👶</span> VI Одделение
                    </button>
                    <button
                       onClick={() => handleGradeSelect(GradeLevel.VII)}
                       className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedGrade === GradeLevel.VII ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-300 hover:bg-indigo-800 hover:text-white'}`}
                    >
                       <span className="text-lg">👧</span> VII Одделение
                    </button>
                 </div>
              </div>
            </div>

            <button
              onClick={() => setMode(AppMode.LESSON)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-3 border ${
                currentMode === AppMode.LESSON 
                  ? 'bg-blue-500/30 text-blue-100 shadow-lg translate-x-1 border-blue-400' 
                  : 'text-blue-200/80 hover:bg-blue-800/40 hover:text-blue-100 border-blue-500/20'
              }`}
            >
              <span>📚</span> Лекции
            </button>
            <button
              onClick={() => setMode(AppMode.BOARD_PLAN)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-3 mt-1 border ${
                currentMode === AppMode.BOARD_PLAN 
                  ? 'bg-indigo-500/30 text-indigo-100 shadow-lg translate-x-1 border-indigo-400' 
                  : 'text-indigo-200/80 hover:bg-indigo-800/40 hover:text-indigo-100 border-indigo-500/20'
              }`}
            >
              <span>👨‍🏫</span> План на табла
            </button>
            <button
              onClick={() => setMode(AppMode.SCENARIO)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-3 mt-1 border ${
                currentMode === AppMode.SCENARIO 
                  ? 'bg-emerald-500/30 text-emerald-100 shadow-lg translate-x-1 border-emerald-400' 
                  : 'text-emerald-200/80 hover:bg-emerald-800/40 hover:text-emerald-100 border-emerald-500/20'
              }`}
            >
              <span>📋</span> Сценарија
            </button>
            <button
              onClick={() => setMode(AppMode.QUIZ)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-3 mt-1 border ${
                currentMode === AppMode.QUIZ 
                  ? 'bg-orange-500/30 text-orange-100 shadow-lg translate-x-1 border-orange-400' 
                  : 'text-orange-200/80 hover:bg-orange-800/40 hover:text-orange-100 border-orange-500/20'
              }`}
            >
              <span>📝</span> Тестови
            </button>
            <button
              onClick={() => setMode(AppMode.WORKSHEET)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-3 mt-1 border ${
                currentMode === AppMode.WORKSHEET 
                  ? 'bg-sky-500/30 text-sky-100 shadow-lg translate-x-1 border-sky-400' 
                  : 'text-sky-200/80 hover:bg-sky-800/40 hover:text-sky-100 border-sky-500/20'
              }`}
            >
              <span>📄</span> Работни листови
            </button>
            <button
              onClick={() => setMode(AppMode.PROJECT)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-3 mt-1 border ${
                currentMode === AppMode.PROJECT 
                  ? 'bg-rose-500/30 text-rose-100 shadow-lg translate-x-1 border-rose-400' 
                  : 'text-rose-200/80 hover:bg-rose-800/40 hover:text-rose-100 border-rose-500/20'
              }`}
            >
              <span>🚀</span> Проектни задачи
            </button>
            <button
              onClick={() => setMode(AppMode.VISUALIZER)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-3 mt-1 border ${
                currentMode === AppMode.VISUALIZER 
                  ? 'bg-fuchsia-500/30 text-fuchsia-100 shadow-lg translate-x-1 border-fuchsia-400' 
                  : 'text-fuchsia-200/80 hover:bg-fuchsia-800/40 hover:text-fuchsia-100 border-fuchsia-500/20'
              }`}
            >
              <span>🎨</span> AI Визуелизатор
            </button>
            
             <button
              onClick={() => setMode(AppMode.ADVANCED_PRACTICE)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-3 mt-2 border ${
                currentMode === AppMode.ADVANCED_PRACTICE 
                  ? 'bg-yellow-500/30 text-yellow-100 shadow-lg translate-x-1 border-yellow-400' 
                  : 'text-yellow-200/80 hover:bg-yellow-900/40 hover:text-yellow-100 border-yellow-500/20'
              }`}
            >
              <span>🏆</span> Додатна настава
            </button>

            <button
              onClick={() => setMode(AppMode.TEACHER_PANEL)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-3 mt-1 border ${
                currentMode === AppMode.TEACHER_PANEL 
                  ? 'bg-teal-500/30 text-teal-100 shadow-lg translate-x-1 border-teal-400' 
                  : 'text-teal-200/80 hover:bg-teal-900/40 hover:text-teal-100 border-teal-500/20'
              }`}
            >
              <span>📓</span> Интерактивна тетратка
            </button>

            <button
              onClick={() => setMode(AppMode.GAMES)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-3 mt-1 border ${
                currentMode === AppMode.GAMES 
                  ? 'bg-pink-500/30 text-pink-100 shadow-lg translate-x-1 border-pink-400' 
                  : 'text-pink-200/80 hover:bg-pink-900/40 hover:text-pink-100 border-pink-500/20'
              }`}
            >
              <span>🎮</span> Мате-Хут
            </button>
          </nav>

          {/* Footer Section - Copyright & Logout */}
          <div className="p-4 mt-auto border-t border-indigo-800 bg-indigo-900/50 backdrop-blur-sm">
             <div className="text-center">
                 <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold mb-1">АВТОР НА ПРОЕКТОТ</p>
                 <p className="text-base font-bold text-white mb-1">Снежана Златковска</p>
                 <p className="text-[10px] text-indigo-300 font-mono">v1.0 • 2025</p>
             </div>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 h-auto md:h-screen md:overflow-y-auto print:h-auto print:overflow-visible print:p-0">
        <div className={`${maxWidthClass} mx-auto bg-white rounded-2xl shadow-xl min-h-[90%] p-6 md:p-8 print:shadow-none print:max-w-none print:rounded-none transition-all duration-500`}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
