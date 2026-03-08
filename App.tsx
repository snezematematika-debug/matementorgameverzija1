
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
import MateHoot from './components/MateHoot';
import Dashboard from './components/Dashboard';
import GeoGebra from './components/GeoGebra';
import Mathigon from './components/Mathigon';
import { AppMode, GradeLevel } from './types';

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>(() => {
    const saved = sessionStorage.getItem('matementor_mode');
    return (saved as AppMode) || AppMode.DASHBOARD;
  });
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(() => {
    const saved = sessionStorage.getItem('matementor_grade');
    return (saved as GradeLevel) || GradeLevel.VI;
  });
  const [userRole, setUserRole] = useState<'TEACHER' | 'STUDENT' | null>(() => {
    const saved = sessionStorage.getItem('matementor_role');
    if (saved) return saved as 'TEACHER' | 'STUDENT';
    
    // Check for PIN in URL immediately during initialization
    const params = new URLSearchParams(window.location.search);
    if (params.get('pin')) return 'STUDENT';
    
    return 'TEACHER'; // Default to teacher
  });

  useEffect(() => {
    if (userRole) sessionStorage.setItem('matementor_role', userRole);
    else sessionStorage.removeItem('matementor_role');
  }, [userRole]);

  useEffect(() => {
    sessionStorage.setItem('matementor_mode', currentMode);
  }, [currentMode]);

  useEffect(() => {
    sessionStorage.setItem('matementor_grade', selectedGrade);
  }, [selectedGrade]);

  useEffect(() => {
    // Check for PIN in URL for mode switching
    const params = new URLSearchParams(window.location.search);
    const urlPin = params.get('pin');
    if (urlPin) {
      setUserRole('STUDENT');
      setCurrentMode(AppMode.GAMES);
    }
  }, []);

  useEffect(() => {
    // Clear PIN from URL if we are not in GAMES mode
    if (currentMode !== AppMode.GAMES) {
      const url = new URL(window.location.href);
      if (url.searchParams.has('pin')) {
        url.searchParams.delete('pin');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [currentMode]);

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
          <MateHoot 
            grade={selectedGrade} 
            initialRole={userRole} 
            onBack={() => {
              setUserRole('TEACHER');
              setCurrentMode(AppMode.DASHBOARD);
            }} 
          />
        );
      case AppMode.GEOGEBRA:
        return <GeoGebra />;
      case AppMode.MATHIGON:
        return <Mathigon />;
      case AppMode.DASHBOARD:
        return <Dashboard setMode={setCurrentMode} userName="Снежана" />;
      case AppMode.ANALYTICS:
        return (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-5xl">📊</div>
            <h2 className="text-3xl font-black text-slate-900">Аналитика и Статистика</h2>
            <p className="text-slate-500 max-w-md text-lg">
              Овој модул е во фаза на изработка. Наскоро ќе можете да ги следите постигањата на вашите ученици во реално време.
            </p>
            <button 
              onClick={() => setCurrentMode(AppMode.DASHBOARD)}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
            >
              Назад на почетна
            </button>
          </div>
        );
      default:
        return <Dashboard setMode={setCurrentMode} userName="Снежана" />;
    }
  };

  return (
    <Layout 
      currentMode={currentMode} 
      setMode={setCurrentMode}
      selectedGrade={selectedGrade}
      setGrade={setSelectedGrade}
      hideSidebar={userRole === 'STUDENT'}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
