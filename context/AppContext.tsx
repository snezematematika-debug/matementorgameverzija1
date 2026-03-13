import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppMode, GradeLevel } from '../types';

interface AppContextValue {
  currentMode: AppMode;
  setCurrentMode: (mode: AppMode) => void;
  selectedGrade: GradeLevel;
  setSelectedGrade: (grade: GradeLevel) => void;
  userRole: 'TEACHER' | 'STUDENT' | null;
  setUserRole: (role: 'TEACHER' | 'STUDENT' | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const useAppContext = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext мора да се користи внатре во AppProvider');
  return ctx;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentMode, setCurrentModeState] = useState<AppMode>(() => {
    const saved = sessionStorage.getItem('matementor_mode');
    return (saved as AppMode) || AppMode.DASHBOARD;
  });

  const [selectedGrade, setSelectedGradeState] = useState<GradeLevel>(() => {
    const saved = sessionStorage.getItem('matementor_grade');
    return (saved as GradeLevel) || GradeLevel.VI;
  });

  const [userRole, setUserRoleState] = useState<'TEACHER' | 'STUDENT' | null>(() => {
    const saved = sessionStorage.getItem('matementor_role');
    if (saved) return saved as 'TEACHER' | 'STUDENT';
    const params = new URLSearchParams(window.location.search);
    if (params.get('pin')) return 'STUDENT';
    return 'TEACHER';
  });

  const setCurrentMode = (mode: AppMode) => setCurrentModeState(mode);
  const setSelectedGrade = (grade: GradeLevel) => setSelectedGradeState(grade);
  const setUserRole = (role: 'TEACHER' | 'STUDENT' | null) => setUserRoleState(role);

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

  // PIN во URL → автоматски STUDENT режим
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPin = params.get('pin');
    const gameType = params.get('type');
    if (urlPin) {
      setUserRoleState('STUDENT');
      if (gameType === 'BINGO') setCurrentModeState(AppMode.BINGO);
      else if (gameType === 'BOARD_GAME') setCurrentModeState(AppMode.BOARD_GAME);
      else setCurrentModeState(AppMode.GAMES);
    }
  }, []);

  // Исчисти PIN од URL кога излегуваме од игра
  useEffect(() => {
    if (
      currentMode !== AppMode.GAMES &&
      currentMode !== AppMode.BINGO &&
      currentMode !== AppMode.BOARD_GAME
    ) {
      const url = new URL(window.location.href);
      if (url.searchParams.has('pin')) {
        url.searchParams.delete('pin');
        url.searchParams.delete('type');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [currentMode]);

  return (
    <AppContext.Provider value={{ currentMode, setCurrentMode, selectedGrade, setSelectedGrade, userRole, setUserRole }}>
      {children}
    </AppContext.Provider>
  );
};
