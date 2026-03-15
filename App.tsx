
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
import MateBingo from './components/MateBingo';
import MathPath from './components/MathPath';
import MateSafe from './components/MateSafe';
import Dashboard from './components/Dashboard';
import GeoGebra from './components/GeoGebra';
import Mathigon from './components/Mathigon';
import AdminDashboard from './components/AdminDashboard';
import RemedialTeaching from './components/RemedialTeaching';
import ErrorDetective from './components/ErrorDetective';
import InclusionGenerator from './components/InclusionGenerator';
import LoginScreen from './components/LoginScreen';
import { useAuth } from './services/firebase';
import { AppMode, GradeLevel } from './types';

const App: React.FC = () => {
  // Mate-Mentor Version 2.1 - Mandatory Auth & Naming Fix
  const { user, loading } = useAuth();
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.DASHBOARD);
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(GradeLevel.VI);
  const [userRole, setUserRole] = useState<'TEACHER' | 'STUDENT' | null>(null);

  // Initialize state from session storage or URL
  useEffect(() => {
    if (!loading && user) {
      const savedMode = sessionStorage.getItem('matementor_mode');
      const savedGrade = sessionStorage.getItem('matementor_grade');
      const savedRole = sessionStorage.getItem('matementor_role');
      
      if (savedMode) setCurrentMode(savedMode as AppMode);
      if (savedGrade) setSelectedGrade(savedGrade as GradeLevel);
      
      // Role logic
      const params = new URLSearchParams(window.location.search);
      const urlPin = params.get('pin');
      
      if (urlPin) {
        setUserRole('STUDENT');
        const gameType = params.get('type');
        if (gameType === 'BINGO') setCurrentMode(AppMode.BINGO);
        else if (gameType === 'BOARD_GAME') setCurrentMode(AppMode.BOARD_GAME);
        else if (gameType === 'MATE_SAFE') setCurrentMode(AppMode.MATE_SAFE);
        else setCurrentMode(AppMode.GAMES);
      } else if (savedRole) {
        setUserRole(savedRole as 'TEACHER' | 'STUDENT');
      } else {
        setUserRole('TEACHER');
      }
    }
  }, [user, loading]);

  // Persist state changes
  useEffect(() => {
    if (user) {
      sessionStorage.setItem('matementor_mode', currentMode);
      sessionStorage.setItem('matementor_grade', selectedGrade);
      if (userRole) sessionStorage.setItem('matementor_role', userRole);
    }
  }, [currentMode, selectedGrade, userRole, user]);

  // URL Cleanup
  useEffect(() => {
    if (user && currentMode !== AppMode.GAMES && currentMode !== AppMode.BINGO && currentMode !== AppMode.BOARD_GAME && currentMode !== AppMode.MATE_SAFE) {
      const url = new URL(window.location.href);
      if (url.searchParams.has('pin')) {
        url.searchParams.delete('pin');
        url.searchParams.delete('type');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [currentMode, user]);

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
        return <ProjectGenerator grade={selectedGrade} />;
      case AppMode.VISUALIZER:
        return <GeometryVisualizer grade={selectedGrade} />;
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
      case AppMode.BINGO:
        return (
          <MateBingo 
            grade={selectedGrade} 
            initialRole={userRole} 
            onBack={() => {
              setUserRole('TEACHER');
              setCurrentMode(AppMode.DASHBOARD);
            }} 
          />
        );
      case AppMode.BOARD_GAME:
        return (
          <MathPath 
            grade={selectedGrade} 
            initialRole={userRole}
            onBack={() => {
              setUserRole('TEACHER');
              setCurrentMode(AppMode.DASHBOARD);
            }} 
          />
        );
      case AppMode.MATE_SAFE:
        return (
          <MateSafe 
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
        return <Dashboard setMode={setCurrentMode} />;
      case AppMode.ANALYTICS:
        return <AdminDashboard />;
      case AppMode.REMEDIAL_TEACHING:
        return <RemedialTeaching grade={selectedGrade} />;
      case AppMode.ERROR_DETECTIVE:
        return <ErrorDetective grade={selectedGrade} />;
      case AppMode.INCLUSION:
        return <InclusionGenerator grade={selectedGrade} />;
      default:
        return <Dashboard setMode={setCurrentMode} />;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-sky-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sky-900 font-bold animate-pulse">Се вчитува Mate-Mentor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

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
