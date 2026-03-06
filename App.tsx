import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAtXI1kYErR34Cnv9MnxhW6XCobD5dCous",
  authDomain: "matementorgameverzija1.firebaseapp.com",
  databaseURL: "https://matementorgameverzija1-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "matementorgameverzija1",
  storageBucket: "matementorgameverzija1.appspot.com",
  messagingSenderId: "544726317445",
  appId: "1:544726317445:web:59976435497c6b511c6cec"
};

// Ова ја активира врската
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
import React, { useState } from 'react';
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
        // Project generator remains generic/shared per instructions
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
        return <MathGames grade={selectedGrade} />;
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
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
