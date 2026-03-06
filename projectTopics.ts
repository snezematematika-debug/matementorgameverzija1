import { CurriculumTheme, CurriculumTopic, GradeLevel } from "./types";

export const PROJECT_THEMES: CurriculumTheme[] = [
  // Grade VI
  { id: "vi-1", title: "Тема 1: Броеви", grade: GradeLevel.VI },
  { id: "vi-2", title: "Тема 2: Геометрија", grade: GradeLevel.VI },
  { id: "vi-3", title: "Тема 3: Операции со броеви", grade: GradeLevel.VI },
  { id: "vi-4", title: "Тема 4: Мерење", grade: GradeLevel.VI },
  { id: "vi-5", title: "Тема 5: Работа со податоци", grade: GradeLevel.VI },
  
  // Grade VII
  { id: "vii-1", title: "Тема 1: Броеви и операции со броеви", grade: GradeLevel.VII },
  { id: "vii-2", title: "Тема 2: Геометрија", grade: GradeLevel.VII },
  { id: "vii-3", title: "Тема 3: Алгебра", grade: GradeLevel.VII },
  { id: "vii-4", title: "Тема 4: Мерење", grade: GradeLevel.VII },
  { id: "vii-5", title: "Тема 5: Работа со податоци", grade: GradeLevel.VII },

  // STEAM Projects (Keep as additional)
  { id: "steam-1", title: "Архитектура и Дизајн (STEAM)", grade: GradeLevel.VII },
  { id: "steam-2", title: "Финансиска Писменост (STEAM)", grade: GradeLevel.VII },
  { id: "steam-3", title: "Спорт и Здравје (STEAM)", grade: GradeLevel.VII },
  { id: "steam-4", title: "Уметност и Природа (STEAM)", grade: GradeLevel.VII },
];

export const PROJECT_TOPICS: CurriculumTopic[] = [
  // Grade VI - Theme 1: Броеви
  { id: "vi-1.1", themeId: "vi-1", name: "Множества", grade: GradeLevel.VI },
  { id: "vi-1.2", themeId: "vi-1", name: "Природни броеви", grade: GradeLevel.VI },
  { id: "vi-1.3", themeId: "vi-1", name: "Римски броеви", grade: GradeLevel.VI },
  { id: "vi-1.4", themeId: "vi-1", name: "Цели броеви", grade: GradeLevel.VI },
  { id: "vi-1.5", themeId: "vi-1", name: "Позитивни рационални броеви", grade: GradeLevel.VI },

  // Grade VI - Theme 2: Геометрија
  { id: "vi-2.1", themeId: "vi-2", name: "Отсечка и агол", grade: GradeLevel.VI },
  { id: "vi-2.2", themeId: "vi-2", name: "Круг", grade: GradeLevel.VI },
  { id: "vi-2.3", themeId: "vi-2", name: "Многуаголник", grade: GradeLevel.VI },
  { id: "vi-2.4", themeId: "vi-2", name: "Врска меѓу 2Д и 3Д форми", grade: GradeLevel.VI },
  { id: "vi-2.5", themeId: "vi-2", name: "Насока, положба и движење", grade: GradeLevel.VI },

  // Grade VI - Theme 3: Операции со броеви
  { id: "vi-3.1", themeId: "vi-3", name: "Операции во проширено множество на природни броеви и равенки", grade: GradeLevel.VI },
  { id: "vi-3.2", themeId: "vi-3", name: "Деливост на природни броеви", grade: GradeLevel.VI },
  { id: "vi-3.3", themeId: "vi-3", name: "Операции со позитивни рационални броеви", grade: GradeLevel.VI },

  // Grade VI - Theme 4: Мерење
  { id: "vi-4.1", themeId: "vi-4", name: "Должина, маса и зафатнина", grade: GradeLevel.VI },
  { id: "vi-4.2", themeId: "vi-4", name: "Време", grade: GradeLevel.VI },
  { id: "vi-4.3", themeId: "vi-4", name: "Пари", grade: GradeLevel.VI },
  { id: "vi-4.4", themeId: "vi-4", name: "Плоштина на 2Д форми", grade: GradeLevel.VI },

  // Grade VI - Theme 5: Работа со податоци
  { id: "vi-5.1", themeId: "vi-5", name: "Читање, собирање, организирање, средување и претставување на податоци (ранг, медијана, аритметичка средина)", grade: GradeLevel.VI },
  { id: "vi-5.2", themeId: "vi-5", name: "Веројатност за случување на настан", grade: GradeLevel.VI },

  // Grade VII - Theme 1: Броеви и операции со броеви
  { id: "vii-1.1", themeId: "vii-1", name: "Операции со множества", grade: GradeLevel.VII },
  { id: "vii-1.2", themeId: "vii-1", name: "Цели броеви", grade: GradeLevel.VII },
  { id: "vii-1.3", themeId: "vii-1", name: "Операции со цели броеви", grade: GradeLevel.VII },
  { id: "vii-1.4", themeId: "vii-1", name: "Степен и корен од природен број", grade: GradeLevel.VII },
  { id: "vii-1.5", themeId: "vii-1", name: "Позитивни рационални броеви, проценти", grade: GradeLevel.VII },
  { id: "vii-1.6", themeId: "vii-1", name: "Операции со позитивни рационални броеви", grade: GradeLevel.VII },
  { id: "vii-1.7", themeId: "vii-1", name: "Размер и пропорционалност", grade: GradeLevel.VII },

  // Grade VII - Theme 2: Геометрија
  { id: "vii-2.1", themeId: "vii-2", name: "Кружница (тангента, кружен лак)", grade: GradeLevel.VII },
  { id: "vii-2.2", themeId: "vii-2", name: "Агол", grade: GradeLevel.VII },
  { id: "vii-2.3", themeId: "vii-2", name: "2Д форми: триаголник, четириаголник и многуаголник", grade: GradeLevel.VII },
  { id: "vii-2.4", themeId: "vii-2", name: "Положба и движење", grade: GradeLevel.VII },

  // Grade VII - Theme 3: Алгебра
  { id: "vii-3.1", themeId: "vii-3", name: "Изрази, равенки и формули", grade: GradeLevel.VII },
  { id: "vii-3.2", themeId: "vii-3", name: "Низи, функции и графици", grade: GradeLevel.VII },

  // Grade VII - Theme 4: Мерење
  { id: "vii-4.1", themeId: "vii-4", name: "Должина, маса и зафатнина", grade: GradeLevel.VII },
  { id: "vii-4.2", themeId: "vii-4", name: "Време", grade: GradeLevel.VII },
  { id: "vii-4.3", themeId: "vii-4", name: "Периметар, плоштина и волумен", grade: GradeLevel.VII },

  // Grade VII - Theme 5: Работа со податоци
  { id: "vii-5.1", themeId: "vii-5", name: "Планирање и собирање на податоци", grade: GradeLevel.VII },
  { id: "vii-5.2", themeId: "vii-5", name: "Обработка на податоци и толкување резултати од истражување", grade: GradeLevel.VII },
  { id: "vii-5.3", themeId: "vii-5", name: "Веројатност", grade: GradeLevel.VII },

  // STEAM Projects
  { id: "p-1.1", themeId: "steam-1", name: "Дизајн на мојата соба (Плоштина и Периметар)", grade: GradeLevel.VII },
  { id: "p-1.2", themeId: "steam-1", name: "Изградба на мостови (Геометриски форми)", grade: GradeLevel.VII },
  { id: "p-1.3", themeId: "steam-1", name: "Макети во размер", grade: GradeLevel.VII },
  { id: "p-2.1", themeId: "steam-2", name: "Планирање на буџет за екскурзија", grade: GradeLevel.VII },
  { id: "p-2.2", themeId: "steam-2", name: "Проценти и попусти во мол", grade: GradeLevel.VII },
  { id: "p-2.3", themeId: "steam-2", name: "Штедење и камата", grade: GradeLevel.VII },
  { id: "p-3.1", themeId: "steam-3", name: "Статистика на спортски натпревар", grade: GradeLevel.VII },
  { id: "p-3.2", themeId: "steam-3", name: "Мерење на пулс и графикони", grade: GradeLevel.VII },
  { id: "p-4.1", themeId: "steam-4", name: "Златен пресек во природата", grade: GradeLevel.VII },
  { id: "p-4.2", themeId: "steam-4", name: "Симетрија во инсектите и лисјата", grade: GradeLevel.VII },
  { id: "p-4.3", themeId: "steam-4", name: "Теселација (Мозаици)", grade: GradeLevel.VII },
];
