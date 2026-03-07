
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import LessonGenerator from './components/LessonGenerator';
import QuizMaker from './components/QuizMaker';
import GeometryVisualizer from './components/GeometryVisualizer';
import ScenarioGenerator from './components/ScenarioGenerator';
import WorksheetGenerator from './components/WorksheetGenerator';
import ProjectGenerator from './components/ProjectGenerator';
import BoardPlanGenerator from './components/BoardPlanGenerator';
import AdvancedPractice from './components/AdvancedPractice';
import TeacherPanel from './components/TeacherPanel';
import MathGames from './components/MathGames';
import { AppMode, GradeLevel } from './types';

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.LESSON);
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(GradeLevel.VI);
  const [userRole, setUserRole] = useState<'TEACHER' | 'STUDENT' | null>(null);

  useEffect(() => {
    // Check for PIN in URL
    const params = new URLSearchParams(window.location.search);
    const urlPin = params.get('pin');
    if (urlPin) {
      setUserRole('STUDENT');
      setCurrentMode(AppMode.GAMES);
    }
  }, []);

  const renderContent = () => {
    switch (currentMode) {
      case AppMode.LESSON:
        return <LessonGenerator grade={selectedGrade} />;
      case AppMode.SCENARIO:
        return <ScenarioGenerator grade={selectedGrade} />;
      case AppMode.QUIZ:
        return <QuizMaker grade={selectedGrade} />;
      case AppMode.WORKSHEET:
        return <WorksheetGenerator grade={selectedGrade} />;
      case AppMode.PROJECT:
        return <ProjectGenerator />;
      case AppMode.VISUALIZER:
        return <GeometryVisualizer />;
      case AppMode.BOARD_PLAN:
        return <BoardPlanGenerator grade={selectedGrade} />;
      case AppMode.ADVANCED_PRACTICE:
        return <AdvancedPractice grade={selectedGrade} />;
      case AppMode.TEACHER_PANEL:
        return <TeacherPanel grade={selectedGrade} />;
      case AppMode.GAMES:
        return (
          <MathGames 
            grade={selectedGrade} 
            initialRole={userRole} 
            onBack={() => setUserRole(null)} 
          />
        );
      default:
        return <LessonGenerator grade={selectedGrade} />;
    }
  };

  if (!userRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-top-8 duration-1000">
          <h1 className="text-6xl md:text-8xl font-black text-indigo-900 tracking-tighter drop-shadow-sm">
            МАТЕ-МЕНТОР
          </h1>
          <div className="h-2 w-32 bg-indigo-500 mx-auto mt-6 rounded-full shadow-sm"></div>
          <p className="text-slate-500 mt-6 font-medium text-lg tracking-wide uppercase">Вашиот дигитален асистент по математика</p>
        </div>

        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
          <button
            onClick={() => {
              setUserRole('TEACHER');
              setCurrentMode(AppMode.LESSON);
            }}
            className="group relative bg-white p-12 rounded-[3rem] shadow-xl border-2 border-transparent hover:border-indigo-500 transition-all duration-500 hover:shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-9xl">👨‍🏫</span>
            </div>
            <div className="relative z-10 text-center space-y-6">
              <div className="w-24 h-24 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto text-5xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                👨‍🏫
              </div>
              <div>
                <h2 className="text-3xl font-black text-indigo-900 tracking-tight">Јас сум Наставник</h2>
                <p className="text-slate-500 mt-3 font-medium leading-relaxed">
                  Пристап до сите алатки за планирање, квизови и менаџирање на часот.
                </p>
              </div>
              <div className="pt-4">
                <span className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">
                  Влези како Наставник <span className="text-lg">→</span>
                </span>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setUserRole('STUDENT');
              setCurrentMode(AppMode.GAMES);
            }}
            className="group relative bg-white p-12 rounded-[3rem] shadow-xl border-2 border-transparent hover:border-pink-500 transition-all duration-500 hover:shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="text-9xl">🎒</span>
            </div>
            <div className="relative z-10 text-center space-y-6">
              <div className="w-24 h-24 bg-pink-100 rounded-3xl flex items-center justify-center mx-auto text-5xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                🎒
              </div>
              <div>
                <h2 className="text-3xl font-black text-pink-900 tracking-tight">Јас сум Ученик</h2>
                <p className="text-slate-500 mt-3 font-medium leading-relaxed">
                  Приклучи се на активна игра со PIN код и забавувај се додека учиш.
                </p>
              </div>
              <div className="pt-4">
                <span className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-pink-200 group-hover:bg-pink-700 transition-colors">
                  Влези како Ученик <span className="text-lg">→</span>
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      currentMode={currentMode} 
      setMode={setCurrentMode}
      selectedGrade={selectedGrade}
      setGrade={setSelectedGrade}
      hideSidebar={userRole === 'STUDENT'}
      onLogout={() => setUserRole(null)}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
