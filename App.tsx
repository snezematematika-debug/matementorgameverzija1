
import React, { lazy, Suspense } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import Layout from './components/Layout';
import Loading from './components/Loading';
import { AppMode } from './types';

// Lazy-loaded — секоја компонента се вчитува само кога е потребна
const LessonGenerator    = lazy(() => import('./components/LessonGenerator'));
const QuizMaker          = lazy(() => import('./components/QuizMaker'));
const GeometryVisualizer = lazy(() => import('./components/GeometryVisualizer'));
const ScenarioGenerator  = lazy(() => import('./components/ScenarioGenerator'));
const WorksheetGenerator = lazy(() => import('./components/WorksheetGenerator'));
const ProjectGenerator   = lazy(() => import('./components/ProjectGenerator'));
const BoardPlanGenerator = lazy(() => import('./components/BoardPlanGenerator'));
const AdvancedPractice   = lazy(() => import('./components/AdvancedPractice'));
const TeacherPanel       = lazy(() => import('./components/TeacherPanel'));
const MateHoot           = lazy(() => import('./components/MateHoot'));
const MateBingo          = lazy(() => import('./components/MateBingo'));
const MathPath           = lazy(() => import('./components/MathPath'));
const Dashboard          = lazy(() => import('./components/Dashboard'));
const GeoGebra           = lazy(() => import('./components/GeoGebra'));
const Mathigon           = lazy(() => import('./components/Mathigon'));
const AdminDashboard     = lazy(() => import('./components/AdminDashboard'));
const RemedialTeaching   = lazy(() => import('./components/RemedialTeaching'));
const ErrorDetective     = lazy(() => import('./components/ErrorDetective'));
const InclusionGenerator = lazy(() => import('./components/InclusionGenerator'));

const AppShell: React.FC = () => {
  const { currentMode, setCurrentMode, selectedGrade, setSelectedGrade, userRole, setUserRole } = useAppContext();

  const goHome = () => {
    setUserRole('TEACHER');
    setCurrentMode(AppMode.DASHBOARD);
  };

  const renderContent = () => {
    switch (currentMode) {
      case AppMode.LESSON:           return <LessonGenerator grade={selectedGrade} />;
      case AppMode.SCENARIO:         return <ScenarioGenerator grade={selectedGrade} />;
      case AppMode.QUIZ:             return <QuizMaker grade={selectedGrade} />;
      case AppMode.WORKSHEET:        return <WorksheetGenerator grade={selectedGrade} />;
      case AppMode.PROJECT:          return <ProjectGenerator grade={selectedGrade} />;
      case AppMode.VISUALIZER:       return <GeometryVisualizer />;
      case AppMode.BOARD_PLAN:       return <BoardPlanGenerator grade={selectedGrade} />;
      case AppMode.ADVANCED_PRACTICE: return <AdvancedPractice grade={selectedGrade} />;
      case AppMode.TEACHER_PANEL:    return <TeacherPanel grade={selectedGrade} />;
      case AppMode.GAMES:            return <MateHoot grade={selectedGrade} initialRole={userRole} onBack={goHome} />;
      case AppMode.BINGO:            return <MateBingo grade={selectedGrade} initialRole={userRole} onBack={goHome} />;
      case AppMode.BOARD_GAME:       return <MathPath grade={selectedGrade} initialRole={userRole} onBack={goHome} />;
      case AppMode.GEOGEBRA:         return <GeoGebra />;
      case AppMode.MATHIGON:         return <Mathigon />;
      case AppMode.ANALYTICS:        return <AdminDashboard />;
      case AppMode.REMEDIAL_TEACHING: return <RemedialTeaching grade={selectedGrade} />;
      case AppMode.ERROR_DETECTIVE:  return <ErrorDetective grade={selectedGrade} />;
      case AppMode.INCLUSION:        return <InclusionGenerator grade={selectedGrade} />;
      case AppMode.DASHBOARD:
      default:                       return <Dashboard setMode={setCurrentMode} />;
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
      <Suspense fallback={<Loading message="Се вчитува..." />}>
        {renderContent()}
      </Suspense>
    </Layout>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <AppShell />
  </AppProvider>
);

export default App;
