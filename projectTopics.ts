import { CurriculumTheme, CurriculumTopic, GradeLevel } from "./types";

export const PROJECT_THEMES: CurriculumTheme[] = [
  // Grade I
  { id: "p-i-1", title: "Тема 1: Броеви до 20", grade: GradeLevel.I },
  { id: "p-i-2", title: "Тема 2: Геометрија околу нас", grade: GradeLevel.I },
  { id: "p-i-3", title: "Тема 3: Мерење и време", grade: GradeLevel.I },

  // Grade II
  { id: "p-ii-1", title: "Тема 1: Броеви и пазарење до 100", grade: GradeLevel.II },
  { id: "p-ii-2", title: "Тема 2: Геометрија и симетрија", grade: GradeLevel.II },
  { id: "p-ii-3", title: "Тема 3: Мерење и податоци", grade: GradeLevel.II },

  // Grade III
  { id: "p-iii-1", title: "Тема 1: Броеви и пари до 1000", grade: GradeLevel.III },
  { id: "p-iii-2", title: "Тема 2: Геометрија и периметар", grade: GradeLevel.III },
  { id: "p-iii-3", title: "Тема 3: Мерење и рецепти", grade: GradeLevel.III },

  // Grade IV
  { id: "p-iv-1", title: "Тема 1: Финансии и големи броеви", grade: GradeLevel.IV },
  { id: "p-iv-2", title: "Тема 2: Геометрија, агли и плоштина", grade: GradeLevel.IV },
  { id: "p-iv-3", title: "Тема 3: Статистичко истражување", grade: GradeLevel.IV },

  // Grade V
  { id: "p-v-1", title: "Тема 1: Броеви, шифри и проценти", grade: GradeLevel.V },
  { id: "p-v-2", title: "Тема 2: Дизајн, плоштина и волумен", grade: GradeLevel.V },
  { id: "p-v-3", title: "Тема 3: Веројатност и статистика", grade: GradeLevel.V },

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

  // Grade VIII
  { id: "viii-1", title: "Тема 1: Броеви и операции со броеви", grade: GradeLevel.VIII },
  { id: "viii-2", title: "Тема 2: Геометрија", grade: GradeLevel.VIII },
  { id: "viii-3", title: "Тема 3: Алгебра", grade: GradeLevel.VIII },
  { id: "viii-4", title: "Тема 4: Мерење", grade: GradeLevel.VIII },
  { id: "viii-5", title: "Тема 5: Работа со податоци", grade: GradeLevel.VIII },

  // Grade IX
  { id: "ix-1", title: "Тема 1: Реални броеви и алгебра", grade: GradeLevel.IX },
  { id: "ix-2", title: "Тема 2: Геометрија (Сличност и 3Д форми)", grade: GradeLevel.IX },
  { id: "ix-3", title: "Тема 3: Веројатност и статистика", grade: GradeLevel.IX },

  // STEAM Projects (Keep as additional)
  { id: "steam-1", title: "Архитектура и Дизајн (STEAM)", grade: GradeLevel.VII },
  { id: "steam-2", title: "Финансиска Писменост (STEAM)", grade: GradeLevel.VII },
  { id: "steam-3", title: "Спорт и Здравје (STEAM)", grade: GradeLevel.VII },
  { id: "steam-4", title: "Уметност и Природа (STEAM)", grade: GradeLevel.VII },
];

export const PROJECT_TOPICS: CurriculumTopic[] = [
  // Grade I
  { id: "p-i-1.1", themeId: "p-i-1", name: "Броење и игра со омилените играчки", grade: GradeLevel.I },
  { id: "p-i-1.2", themeId: "p-i-1", name: "Моето семејство претставено во бројки", grade: GradeLevel.I },
  { id: "p-i-2.1", themeId: "p-i-2", name: "Лов на форми: Геометриски форми во училницата", grade: GradeLevel.I },
  { id: "p-i-2.2", themeId: "p-i-2", name: "Цртање робот од геометриски фигури", grade: GradeLevel.I },
  { id: "p-i-3.1", themeId: "p-i-3", name: "Мојот дневен распоред: Кога што правам", grade: GradeLevel.I },
  { id: "p-i-3.2", themeId: "p-i-3", name: "Мала детска продавница со македонски монети", grade: GradeLevel.I },

  // Grade II
  { id: "p-ii-1.1", themeId: "p-ii-1", name: "Школски пазар: Купување и враќање кусур", grade: GradeLevel.II },
  { id: "p-ii-1.2", themeId: "p-ii-1", name: "Магична табела на стотка и низи од броеви", grade: GradeLevel.II },
  { id: "p-ii-2.1", themeId: "p-ii-2", name: "Симетрија во природата: Пеперутки и лисја", grade: GradeLevel.II },
  { id: "p-ii-2.2", themeId: "p-ii-2", name: "Изградба на геометриски град од 3Д тела", grade: GradeLevel.II },
  { id: "p-ii-3.1", themeId: "p-ii-3", name: "Мерење со линијар: Колку се долги училишните прибори", grade: GradeLevel.II },
  { id: "p-ii-3.2", themeId: "p-ii-3", name: "Пиктограм: Нашите омилени спортски активности", grade: GradeLevel.II },

  // Grade III
  { id: "p-iii-1.1", themeId: "p-iii-1", name: "Планирање буџет за роденденска забава", grade: GradeLevel.III },
  { id: "p-iii-1.2", themeId: "p-iii-1", name: "Дропки во кујната: Поделба на пица и овошје", grade: GradeLevel.III },
  { id: "p-iii-2.1", themeId: "p-iii-2", name: "Дизајнирање детско игралиште (Пресметка на периметар)", grade: GradeLevel.III },
  { id: "p-iii-2.2", themeId: "p-iii-2", name: "Креативни кутии: Својства и мрежи на 3Д тела", grade: GradeLevel.III },
  { id: "p-iii-3.1", themeId: "p-iii-3", name: "Време и патување: Распоред на патување низ Македонија", grade: GradeLevel.III },
  { id: "p-iii-3.2", themeId: "p-iii-3", name: "Мерење маса и зафатнина: Рецепт за вкусен колач", grade: GradeLevel.III },

  // Grade IV
  { id: "p-iv-1.1", themeId: "p-iv-1", name: "Семеен пазарен буџет со децимални броеви", grade: GradeLevel.IV },
  { id: "p-iv-1.2", themeId: "p-iv-1", name: "Спортот во бројки: Мерења на време и растојанија", grade: GradeLevel.IV },
  { id: "p-iv-2.1", themeId: "p-iv-2", name: "Архитектонски план за мојата соба (Периметар и плоштина)", grade: GradeLevel.IV },
  { id: "p-iv-2.2", themeId: "p-iv-2", name: "Агли во архитектурата на нашиот град", grade: GradeLevel.IV },
  { id: "p-iv-3.1", themeId: "p-iv-3", name: "Статистичко истражување: Навиките за читање книги", grade: GradeLevel.IV },
  { id: "p-iv-3.2", themeId: "p-iv-3", name: "Еко-проект: Колку отпад рециклираме во училиштето", grade: GradeLevel.IV },

  // Grade V
  { id: "p-v-1.1", themeId: "p-v-1", name: "Тајни шифри со прости броеви и делители", grade: GradeLevel.V },
  { id: "p-v-1.2", themeId: "p-v-1", name: "Проценти во продавниците: Сезонски попусти и заштеди", grade: GradeLevel.V },
  { id: "p-v-2.1", themeId: "p-v-2", name: "Дизајн на училишен аквариум (Волумен и зафатнина)", grade: GradeLevel.V },
  { id: "p-v-2.2", themeId: "p-v-2", name: "Пакување производи: Минимална плоштина на картон", grade: GradeLevel.V },
  { id: "p-v-3.1", themeId: "p-v-3", name: "Игри на среќа и фер правила: Експерименти со веројатност", grade: GradeLevel.V },
  { id: "p-v-3.2", themeId: "p-v-3", name: "Метеоролошка станица: Просечни температури и линиски дијаграми", grade: GradeLevel.V },

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

  // Grade VIII - Theme 1: Броеви и операции со броеви
  { id: "viii-1.1", themeId: "viii-1", name: "Проект: Градот на релации (Релации меѓу урбани објекти)", grade: GradeLevel.VIII },
  { id: "viii-1.2", themeId: "viii-1", name: "Проект: Истражување на пропорции во наука и географија", grade: GradeLevel.VIII },
  { id: "viii-1.3", themeId: "viii-1", name: "Истражување: Запишување големи броеви од природата и науката со a · 10^k", grade: GradeLevel.VIII },
  { id: "viii-1.4", themeId: "viii-1", name: "Проценти во реалниот живот: попусти, камати и семеен буџет", grade: GradeLevel.VIII },

  // Grade VIII - Theme 2: Геометрија
  { id: "viii-2.1", themeId: "viii-2", name: "Истражување: Питагорова теорема и конструкција на Питагорови дрва", grade: GradeLevel.VIII },
  { id: "viii-2.2", themeId: "viii-2", name: "Дизајн на керамички плочки и мозаици со делови од круг и кружница", grade: GradeLevel.VIII },
  { id: "viii-2.3", themeId: "viii-2", name: "Изработка на макети и постери за правилни полиедри (Платонови тела)", grade: GradeLevel.VIII },
  { id: "viii-2.4", themeId: "viii-2", name: "Просторен дизајн на изометриска хартија со коцки и квадари", grade: GradeLevel.VIII },
  { id: "viii-2.5", themeId: "viii-2", name: "Мисловни мапи и симулации на комбинирани геометриски трансформации", grade: GradeLevel.VIII },

  // Grade VIII - Theme 3: Алгебра
  { id: "viii-3.1", themeId: "viii-3", name: "Архитектонски план на стан пресметан со алгебарски изрази", grade: GradeLevel.VIII },
  { id: "viii-3.2", themeId: "viii-3", name: "Линеарни функции и дигитална геометриска уметност (со GeoGebra)", grade: GradeLevel.VIII },
  { id: "viii-3.3", themeId: "viii-3", name: "Математичко моделирање: Оптимален избор на понуди за превоз/услуги", grade: GradeLevel.VIII },
  { id: "viii-3.4", themeId: "viii-3", name: "Анализа на наклон кај сообраќајни знаци преку линеарна функција", grade: GradeLevel.VIII },

  // Grade VIII - Theme 4: Мерење
  { id: "viii-4.1", themeId: "viii-4", name: "Проект Патување: План и графици за дводневна училишна екскурзија", grade: GradeLevel.VIII },
  { id: "viii-4.2", themeId: "viii-4", name: "Оптимизација на трошоци: Најевтино лого од жица со делови од круг", grade: GradeLevel.VIII },
  { id: "viii-4.3", themeId: "viii-4", name: "Хортикултурно уредување на училишниот двор со 2Д геометриски форми", grade: GradeLevel.VIII },
  { id: "viii-4.4", themeId: "viii-4", name: "Изработка на макети на призми и пирамиди со пресметка на плоштина и волумен", grade: GradeLevel.VIII },

  // Grade VIII - Theme 5: Работа со податоци
  { id: "viii-5.1", themeId: "viii-5", name: "Статистичко истражување со репрезентативен примерок во училиштето", grade: GradeLevel.VIII },
  { id: "viii-5.2", themeId: "viii-5", name: "Маркетинг анализа на потрошувачки навики со софтвер за табели", grade: GradeLevel.VIII },
  { id: "viii-5.3", themeId: "viii-5", name: "Табеларна анализа на приходи, расходи и профит на локални бизниси", grade: GradeLevel.VIII },
  { id: "viii-5.4", themeId: "viii-5", name: "Експериментална веројатност: Симулација на градски сообраќај и семафори", grade: GradeLevel.VIII },

  // Grade IX - Theme 1: Реални броеви и алгебра
  { id: "ix-1.1", themeId: "ix-1", name: "Реални броеви", grade: GradeLevel.IX },
  { id: "ix-1.2", themeId: "ix-1", name: "Операции со реални броеви", grade: GradeLevel.IX },
  
  // Grade IX - Theme 2: Геометрија
  { id: "ix-2.1", themeId: "ix-2", name: "Сличност на триаголници", grade: GradeLevel.IX },
  { id: "ix-2.2", themeId: "ix-2", name: "Примена на сличност", grade: GradeLevel.IX },
  { id: "ix-2.3", themeId: "ix-2", name: "Плоштина и волумен на цилиндар", grade: GradeLevel.IX },
  { id: "ix-2.4", themeId: "ix-2", name: "Плоштина и волумен на конус", grade: GradeLevel.IX },

  // Grade IX - Theme 3: Веројатност и статистика
  { id: "ix-3.1", themeId: "ix-3", name: "Веројатност на настан", grade: GradeLevel.IX },
  { id: "ix-3.2", themeId: "ix-3", name: "Статистика и анализа на податоци", grade: GradeLevel.IX },

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
