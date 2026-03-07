
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
import { AppMode, GradeLevel } from './types';

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>(() => {
    const saved = sessionStorage.getItem('matementor_mode');
    return (saved as AppMode) || AppMode.LESSON;
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
            onBack={() => setUserRole(null)} 
          />
        );
      default:
        return <LessonGenerator grade={selectedGrade} />;
    }
  };

  return (
    <Layout 
      currentMode={currentMode} 
      setMode={setCurrentMode}
      selectedGrade={selectedGrade}
      setGrade={setSelectedGrade}
      hideSidebar={userRole === 'STUDENT'}
      onLogout={() => {
        setUserRole(null);
        sessionStorage.removeItem('matementor_role');
        sessionStorage.removeItem('matementor_mode');
        sessionStorage.removeItem('matehoot_pin');
      }}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
