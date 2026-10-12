import { CurriculumTheme, CurriculumTopic, GradeLevel } from "./types";

export const ELEMENTARY_THEMES: CurriculumTheme[] = [
  // ==========================================
  // I ОДДЕЛЕНИЕ (1st Grade)
  // ==========================================
  { id: "i-theme-1", title: "Тема 1: БРОЕВИ ДО 20", grade: GradeLevel.I },
  { id: "i-theme-2", title: "Тема 2: СОБИРАЊЕ И ОДЗЕМАЊЕ ДО 20", grade: GradeLevel.I },
  { id: "i-theme-3", title: "Тема 3: ГЕОМЕТРИЈА И ПОЛОЖБИ ВО ПРОСТОРОТ", grade: GradeLevel.I },
  { id: "i-theme-4", title: "Тема 4: МЕРЕЊЕ И ВРЕМЕ", grade: GradeLevel.I },
  { id: "i-theme-5", title: "Тема 5: РАБОТА СО ПОДАТОЦИ", grade: GradeLevel.I },

  // ==========================================
  // II ОДДЕЛЕНИЕ (2nd Grade)
  // ==========================================
  { id: "ii-theme-1", title: "Тема 1: БРОЕВИ ДО 100", grade: GradeLevel.II },
  { id: "ii-theme-2", title: "Тема 2: СОБИРАЊЕ И ОДЗЕМАЊЕ ДО 100", grade: GradeLevel.II },
  { id: "ii-theme-3", title: "Тема 3: ВОВЕД ВО МНОЖЕЊЕ И ДЕЛЕЊЕ", grade: GradeLevel.II },
  { id: "ii-theme-4", title: "Тема 4: ГЕОМЕТРИЈА И СИМЕТРИЈА", grade: GradeLevel.II },
  { id: "ii-theme-5", title: "Тема 5: МЕРЕЊЕ, ПАРИ И ПОДАТОЦИ", grade: GradeLevel.II },

  // ==========================================
  // III ОДДЕЛЕНИЕ (3rd Grade)
  // ==========================================
  { id: "iii-theme-1", title: "Тема 1: БРОЕВИ ДО 1000 И ДРОПКИ", grade: GradeLevel.III },
  { id: "iii-theme-2", title: "Тема 2: СОБИРАЊЕ И ОДЗЕМАЊЕ ДО 1000", grade: GradeLevel.III },
  { id: "iii-theme-3", title: "Тема 3: ТАБЛИЦА НА МНОЖЕЊЕ И ДЕЛЕЊЕ ДО 100", grade: GradeLevel.III },
  { id: "iii-theme-4", title: "Тема 4: ГЕОМЕТРИЈА И ПЕРИМЕТАР", grade: GradeLevel.III },
  { id: "iii-theme-5", title: "Тема 5: МЕРЕЊЕ, ПАРИ И РАБОТА СО ПОДАТОЦИ", grade: GradeLevel.III },

  // ==========================================
  // IV ОДДЕЛЕНИЕ (4th Grade)
  // ==========================================
  { id: "iv-theme-1", title: "Тема 1: БРОЕВИ ДО 1 000 000, ДРОПКИ И ДЕЦИМАЛНИ БРОЕВИ", grade: GradeLevel.IV },
  { id: "iv-theme-2", title: "Тема 2: ОПЕРАЦИИ СО БРОЕВИ (МНОЖЕЊЕ И ДЕЛЕЊЕ СО ПОВЕЌЕЦИФРЕНИ БРОЕВИ)", grade: GradeLevel.IV },
  { id: "iv-theme-3", title: "Тема 3: ГЕОМЕТРИЈА (АГЛИ, ТРИАГОЛНИЦИ И ЧЕТИРИАГОЛНИЦИ)", grade: GradeLevel.IV },
  { id: "iv-theme-4", title: "Тема 4: МЕРЕЊЕ, ПЕРИМЕТАР И ПЛОШТИНА", grade: GradeLevel.IV },
  { id: "iv-theme-5", title: "Тема 5: РАБОТА СО ПОДАТОЦИ И ВЕРОЈАТНОСТ", grade: GradeLevel.IV },

  // ==========================================
  // V ОДДЕЛЕНИЕ (5th Grade)
  // ==========================================
  { id: "v-theme-1", title: "Тема 1: БРОЕВИ, ДЕЛИВОСТ И ОПЕРАЦИИ СО ПОВЕЌЕЦИФРЕНИ БРОЕВИ", grade: GradeLevel.V },
  { id: "v-theme-2", title: "Тема 2: ДРОПКИ, ДЕЦИМАЛНИ БРОЕВИ И ПРОЦЕНТИ", grade: GradeLevel.V },
  { id: "v-theme-3", title: "Тема 3: ГЕОМЕТРИЈА И КООРДИНАТЕН СИСТЕМ", grade: GradeLevel.V },
  { id: "v-theme-4", title: "Тема 4: МЕРЕЊЕ, ПЛОШТИНА И ВОЛУМЕН", grade: GradeLevel.V },
  { id: "v-theme-5", title: "Тема 5: РАБОТА СО ПОДАТОЦИ, ПРОСЕК И ВЕРОЈАТНОСТ", grade: GradeLevel.V },
];

export const ELEMENTARY_CURRICULUM: CurriculumTopic[] = [
  // ==========================================
  // I ОДДЕЛЕНИЕ (1st Grade)
  // ==========================================
  // ТЕМА 1: БРОЕВИ ДО 20
  { id: "i-1.1", themeId: "i-theme-1", name: "1.1. Броење предмети и количина до 5", grade: GradeLevel.I },
  { id: "i-1.2", themeId: "i-theme-1", name: "1.2. Броеви од 1 до 5: читање, пишување и препознавање", grade: GradeLevel.I },
  { id: "i-1.3", themeId: "i-theme-1", name: "1.3. Бројот 0 (нула) и празно множество", grade: GradeLevel.I },
  { id: "i-1.4", themeId: "i-theme-1", name: "1.4. Броеви од 6 до 10: броење и запишување", grade: GradeLevel.I },
  { id: "i-1.5", themeId: "i-theme-1", name: "1.5. Редослед на броевите до 10 на бројна права", grade: GradeLevel.I },
  { id: "i-1.6", themeId: "i-theme-1", name: "1.6. Претходник и следбеник на броеви до 10", grade: GradeLevel.I },
  { id: "i-1.7", themeId: "i-theme-1", name: "1.7. Споредување броеви до 10 (повеќе, помалку, еднакво, знаци >, <, =)", grade: GradeLevel.I },
  { id: "i-1.8", themeId: "i-theme-1", name: "1.8. Броеви од 11 до 20: десетка и единици", grade: GradeLevel.I },
  { id: "i-1.9", themeId: "i-theme-1", name: "1.9. Бројна оска до 20 и споредување броеви", grade: GradeLevel.I },
  { id: "i-1.10", themeId: "i-theme-1", name: "1.10. Броење однапред и наназад до 20", grade: GradeLevel.I },
  { id: "i-1.11", themeId: "i-theme-1", name: "1.11. Парни и непарни броеви до 20", grade: GradeLevel.I },
  { id: "i-1.12", themeId: "i-theme-1", name: "1.12. Редни броеви (прв, втор, трет...)", grade: GradeLevel.I },

  // ТЕМА 2: СОБИРАЊЕ И ОДЗЕМАЊЕ ДО 20
  { id: "i-2.1", themeId: "i-theme-2", name: "2.1. Поим за собирање: здружување на множества (знак +)", grade: GradeLevel.I },
  { id: "i-2.2", themeId: "i-theme-2", name: "2.2. Собирање броеви до 5", grade: GradeLevel.I },
  { id: "i-2.3", themeId: "i-theme-2", name: "2.3. Поим за одземање: одземање на елементи (знак -)", grade: GradeLevel.I },
  { id: "i-2.4", themeId: "i-theme-2", name: "2.4. Одземање броеви до 5", grade: GradeLevel.I },
  { id: "i-2.5", themeId: "i-theme-2", name: "2.5. Собирање до 10: собироци и збир", grade: GradeLevel.I },
  { id: "i-2.6", themeId: "i-theme-2", name: "2.6. Одземање до 10: намаленик, намалител и разлика", grade: GradeLevel.I },
  { id: "i-2.7", themeId: "i-theme-2", name: "2.7. Собирање и одземање со нула (a + 0 = a, a - 0 = a)", grade: GradeLevel.I },
  { id: "i-2.8", themeId: "i-theme-2", name: "2.8. Замена на местата на собироците (комутативно својство)", grade: GradeLevel.I },
  { id: "i-2.9", themeId: "i-theme-2", name: "2.9. Врска меѓу собирањето и одземањето (семејство на равенства)", grade: GradeLevel.I },
  { id: "i-2.10", themeId: "i-theme-2", name: "2.10. Собирање на десетка со едноцифрен број (10 + a)", grade: GradeLevel.I },
  { id: "i-2.11", themeId: "i-theme-2", name: "2.11. Собирање до 20 без премин (пр. 12 + 3)", grade: GradeLevel.I },
  { id: "i-2.12", themeId: "i-theme-2", name: "2.12. Одземање до 20 без премин (пр. 15 - 3, 17 - 10)", grade: GradeLevel.I },
  { id: "i-2.13", themeId: "i-theme-2", name: "2.13. Парови броеви чиј збир е 10 (дополнување до 10)", grade: GradeLevel.I },
  { id: "i-2.14", themeId: "i-theme-2", name: "2.14. Собирање со премин преку 10 (пр. 8 + 5)", grade: GradeLevel.I },
  { id: "i-2.15", themeId: "i-theme-2", name: "2.15. Одземање со премин преку 10 (пр. 13 - 5)", grade: GradeLevel.I },
  { id: "i-2.16", themeId: "i-theme-2", name: "2.16. Текстуални задачи со собирање и одземање до 20", grade: GradeLevel.I },

  // ТЕМА 3: ГЕОМЕТРИЈА И ПОЛОЖБИ ВО ПРОСТОРОТ
  { id: "i-3.1", themeId: "i-theme-3", name: "3.1. Просторна ориентација: горе - долу, високо - ниско", grade: GradeLevel.I },
  { id: "i-3.2", themeId: "i-theme-3", name: "3.2. Положби: лево - десно, пред - зад, помеѓу", grade: GradeLevel.I },
  { id: "i-3.3", themeId: "i-theme-3", name: "3.3. Релации: внатре - надвор, на, под, над", grade: GradeLevel.I },
  { id: "i-3.4", themeId: "i-theme-3", name: "3.4. Линии: права линија, крива линија, искршена линија", grade: GradeLevel.I },
  { id: "i-3.5", themeId: "i-theme-3", name: "3.5. Отворена и затворена линија. Област", grade: GradeLevel.I },
  { id: "i-3.6", themeId: "i-theme-3", name: "3.6. Препознавање 2Д форми: круг, триаголник, квадрат, правоаголник", grade: GradeLevel.I },
  { id: "i-3.7", themeId: "i-theme-3", name: "3.7. Карактеристики на 2Д форми (страни и темиња)", grade: GradeLevel.I },
  { id: "i-3.8", themeId: "i-theme-3", name: "3.8. Препознавање 3Д форми: топка, коцка, квадар, валјак", grade: GradeLevel.I },
  { id: "i-3.9", themeId: "i-theme-3", name: "3.9. Тркалање и лизгање на просторни форми", grade: GradeLevel.I },
  { id: "i-3.10", themeId: "i-theme-3", name: "3.10. Повторувачки геометриски низи и шеми", grade: GradeLevel.I },

  // ТЕМА 4: МЕРЕЊЕ И ВРЕМЕ
  { id: "i-4.1", themeId: "i-theme-4", name: "4.1. Споредување должина: подолго, пократко, еднакво", grade: GradeLevel.I },
  { id: "i-4.2", themeId: "i-theme-4", name: "4.2. Нестандардни мерки за должина (чекор, педа, спојувалка)", grade: GradeLevel.I },
  { id: "i-4.3", themeId: "i-theme-4", name: "4.3. Споредување маса: потешко, полесно, рамнотежа", grade: GradeLevel.I },
  { id: "i-4.4", themeId: "i-theme-4", name: "4.4. Споредување зафатнина: собира повеќе, собира помалку", grade: GradeLevel.I },
  { id: "i-4.5", themeId: "i-theme-4", name: "4.5. Време: делови од денот (утро, пладне, вечер, ноќ)", grade: GradeLevel.I },
  { id: "i-4.6", themeId: "i-theme-4", name: "4.6. Денови во неделата и нивен редослед", grade: GradeLevel.I },
  { id: "i-4.7", themeId: "i-theme-4", name: "4.7. Часовник: читање полн час (аналоген и дигитален)", grade: GradeLevel.I },
  { id: "i-4.8", themeId: "i-theme-4", name: "4.8. Пари: македонски монети (1, 2, 5, 10 и 50 денари)", grade: GradeLevel.I },
  { id: "i-4.9", themeId: "i-theme-4", name: "4.9. Едноставно плаќање и споредување вредност", grade: GradeLevel.I },

  // ТЕМА 5: РАБОТА СО ПОДАТОЦИ
  { id: "i-5.1", themeId: "i-theme-5", name: "5.1. Сортирање и класификација на предмети според една особина", grade: GradeLevel.I },
  { id: "i-5.2", themeId: "i-theme-5", name: "5.2. Сортирање според две особини", grade: GradeLevel.I },
  { id: "i-5.3", themeId: "i-theme-5", name: "5.3. Претставување податоци со слики", grade: GradeLevel.I },
  { id: "i-5.4", themeId: "i-theme-5", name: "5.4. Пиктограм со единечна вредност", grade: GradeLevel.I },
  { id: "i-5.5", themeId: "i-theme-5", name: "5.5. Читање и толкување на пиктограм", grade: GradeLevel.I },
  { id: "i-5.6", themeId: "i-theme-5", name: "5.6. Венов дијаграм со едно и две својства", grade: GradeLevel.I },
  { id: "i-5.7", themeId: "i-theme-5", name: "5.7. Керолов дијаграм (да/не класификација)", grade: GradeLevel.I },

  // ==========================================
  // II ОДДЕЛЕНИЕ (2nd Grade)
  // ==========================================
  // ТЕМА 1: БРОЕВИ ДО 100
  { id: "ii-1.1", themeId: "ii-theme-1", name: "1.1. Повторување на броевите до 20", grade: GradeLevel.II },
  { id: "ii-1.2", themeId: "ii-theme-1", name: "1.2. Десетки до 100 (10, 20, 30... 100)", grade: GradeLevel.II },
  { id: "ii-1.3", themeId: "ii-theme-1", name: "1.3. Броеви од 21 до 100: читање и пишување", grade: GradeLevel.II },
  { id: "ii-1.4", themeId: "ii-theme-1", name: "1.4. Месна вредност: десетки (Д) и единици (Е)", grade: GradeLevel.II },
  { id: "ii-1.5", themeId: "ii-theme-1", name: "1.5. Претставување броеви на стотка и бројна оска", grade: GradeLevel.II },
  { id: "ii-1.6", themeId: "ii-theme-1", name: "1.6. Споредување и подредување броеви до 100 (<, >, =)", grade: GradeLevel.II },
  { id: "ii-1.7", themeId: "ii-theme-1", name: "1.7. Броење по 2, по 5 и по 10 до 100", grade: GradeLevel.II },
  { id: "ii-1.8", themeId: "ii-theme-1", name: "1.8. Парни и непарни броеви до 100", grade: GradeLevel.II },
  { id: "ii-1.9", themeId: "ii-theme-1", name: "1.9. Претходник и следбеник на двоцифрен број", grade: GradeLevel.II },
  { id: "ii-1.10", themeId: "ii-theme-1", name: "1.10. Заокружување на броевите до најблиската десетка", grade: GradeLevel.II },
  { id: "ii-1.11", themeId: "ii-theme-1", name: "1.11. Римски бројки до XII на часовник", grade: GradeLevel.II },

  // ТЕМА 2: СОБИРАЊЕ И ОДЗЕМАЊЕ ДО 100
  { id: "ii-2.1", themeId: "ii-theme-2", name: "2.1. Собирање и одземање до 20 со премин", grade: GradeLevel.II },
  { id: "ii-2.2", themeId: "ii-theme-2", name: "2.2. Собирање на полни десетки (пр. 30 + 20)", grade: GradeLevel.II },
  { id: "ii-2.3", themeId: "ii-theme-2", name: "2.3. Одземање на полни десетки (пр. 70 - 40)", grade: GradeLevel.II },
  { id: "ii-2.4", themeId: "ii-theme-2", name: "2.4. Собирање двоцифрен број со полна десетка (пр. 43 + 20)", grade: GradeLevel.II },
  { id: "ii-2.5", themeId: "ii-theme-2", name: "2.5. Одземање полна десетка од двоцифрен број (пр. 65 - 30)", grade: GradeLevel.II },
  { id: "ii-2.6", themeId: "ii-theme-2", name: "2.6. Собирање двоцифрен со едноцифрен број без премин (пр. 34 + 5)", grade: GradeLevel.II },
  { id: "ii-2.7", themeId: "ii-theme-2", name: "2.7. Одземање едноцифрен број од двоцифрен без премин (пр. 48 - 6)", grade: GradeLevel.II },
  { id: "ii-2.8", themeId: "ii-theme-2", name: "2.8. Дополнување до полна десетка (пр. 36 + 4 = 40)", grade: GradeLevel.II },
  { id: "ii-2.9", themeId: "ii-theme-2", name: "2.9. Собирање двоцифрен со едноцифрен број со премин (пр. 27 + 5)", grade: GradeLevel.II },
  { id: "ii-2.10", themeId: "ii-theme-2", name: "2.10. Одземање едноцифрен од двоцифрен број со премин (пр. 32 - 7)", grade: GradeLevel.II },
  { id: "ii-2.11", themeId: "ii-theme-2", name: "2.11. Собирање на два двоцифрени броја без премин (пр. 24 + 35)", grade: GradeLevel.II },
  { id: "ii-2.12", themeId: "ii-theme-2", name: "2.12. Одземање на два двоцифрени броја без премин (пр. 58 - 23)", grade: GradeLevel.II },
  { id: "ii-2.13", themeId: "ii-theme-2", name: "2.13. Собирање два двоцифрени броја со премин (пр. 38 + 25)", grade: GradeLevel.II },
  { id: "ii-2.14", themeId: "ii-theme-2", name: "2.14. Одземање два двоцифрени броја со премин (пр. 52 - 27)", grade: GradeLevel.II },
  { id: "ii-2.15", themeId: "ii-theme-2", name: "2.15. Својства на собирањето: комутативно и асоцијативно", grade: GradeLevel.II },
  { id: "ii-2.16", themeId: "ii-theme-2", name: "2.16. Одземање од 100", grade: GradeLevel.II },
  { id: "ii-2.17", themeId: "ii-theme-2", name: "2.17. Наоѓање непознат број во собирање (x + a = b)", grade: GradeLevel.II },
  { id: "ii-2.18", themeId: "ii-theme-2", name: "2.18. Наоѓање непознат број во одземање (x - a = b, a - x = b)", grade: GradeLevel.II },
  { id: "ii-2.19", themeId: "ii-theme-2", name: "2.19. Текстуални задачи со една и две операции", grade: GradeLevel.II },

  // ТЕМА 3: ВОВЕД ВО МНОЖЕЊЕ И ДЕЛЕЊЕ
  { id: "ii-3.1", themeId: "ii-theme-3", name: "3.1. Множење како скратено собирање еднакви собироци (знак ·)", grade: GradeLevel.II },
  { id: "ii-3.2", themeId: "ii-theme-3", name: "3.2. Множители и производ", grade: GradeLevel.II },
  { id: "ii-3.3", themeId: "ii-theme-3", name: "3.3. Таблица на множење со 2", grade: GradeLevel.II },
  { id: "ii-3.4", themeId: "ii-theme-3", name: "3.4. Удвојување и преполовување на броеви", grade: GradeLevel.II },
  { id: "ii-3.5", themeId: "ii-theme-3", name: "3.5. Таблица на множење со 10", grade: GradeLevel.II },
  { id: "ii-3.6", themeId: "ii-theme-3", name: "3.6. Таблица на множење со 5", grade: GradeLevel.II },
  { id: "ii-3.7", themeId: "ii-theme-3", name: "3.7. Поим за делење: еднакво распределување (знак :)", grade: GradeLevel.II },
  { id: "ii-3.8", themeId: "ii-theme-3", name: "3.8. Деленик, делител и количник", grade: GradeLevel.II },
  { id: "ii-3.9", themeId: "ii-theme-3", name: "3.9. Делење со 2, со 5 и со 10", grade: GradeLevel.II },
  { id: "ii-3.10", themeId: "ii-theme-3", name: "3.10. Врска меѓу множењето и делењето", grade: GradeLevel.II },
  { id: "ii-3.11", themeId: "ii-theme-3", name: "3.11. Текстуални задачи со множење и делење", grade: GradeLevel.II },
  { id: "ii-3.12", themeId: "ii-theme-3", name: "3.12. Дропки: половина (1/2) и четвртина (1/4) од целина и од број", grade: GradeLevel.II },

  // ТЕМА 4: ГЕОМЕТРИЈА И СИМЕТРИЈА
  { id: "ii-4.1", themeId: "ii-theme-4", name: "4.1. Точка, права, полуправа и отсечка", grade: GradeLevel.II },
  { id: "ii-4.2", themeId: "ii-theme-4", name: "4.2. Означување на отсечка со крајни точки (AB)", grade: GradeLevel.II },
  { id: "ii-4.3", themeId: "ii-theme-4", name: "4.3. 2Д форми: триаголник, квадрат, правоаголник, круг", grade: GradeLevel.II },
  { id: "ii-4.4", themeId: "ii-theme-4", name: "4.4. Елементи на многуаголници: страни и темиња", grade: GradeLevel.II },
  { id: "ii-4.5", themeId: "ii-theme-4", name: "4.5. 3Д тела: коцка, квадар, топка, пирамида, валјак, конус", grade: GradeLevel.II },
  { id: "ii-4.6", themeId: "ii-theme-4", name: "4.6. Препознавање рамни и закривени површини кај 3Д тела", grade: GradeLevel.II },
  { id: "ii-4.7", themeId: "ii-theme-4", name: "4.7. Осна симетрија: оска на симетрија и превиткување", grade: GradeLevel.II },
  { id: "ii-4.8", themeId: "ii-theme-4", name: "4.8. Доцртување симетрична слика на мрежа", grade: GradeLevel.II },
  { id: "ii-4.9", themeId: "ii-theme-4", name: "4.9. Движење и насоки: право, лево, десно, четвртина вртење", grade: GradeLevel.II },

  // ТЕМА 5: МЕРЕЊЕ, ПАРИ И ПОДАТОЦИ
  { id: "ii-5.1", themeId: "ii-theme-5", name: "5.1. Мерки за должина: метар (m) и сантиметар (cm)", grade: GradeLevel.II },
  { id: "ii-5.2", themeId: "ii-theme-5", name: "5.2. Мерење со линијар во сантиметри", grade: GradeLevel.II },
  { id: "ii-5.3", themeId: "ii-theme-5", name: "5.3. Мерки за маса: килограм (kg)", grade: GradeLevel.II },
  { id: "ii-5.4", themeId: "ii-theme-5", name: "5.4. Мерки за зафатнина: литар (l)", grade: GradeLevel.II },
  { id: "ii-5.5", themeId: "ii-theme-5", name: "5.5. Време: часовник (полн час, половина час, четврт час)", grade: GradeLevel.II },
  { id: "ii-5.6", themeId: "ii-theme-5", name: "5.6. Календар: денови, седмици, месеци и годишни времиња", grade: GradeLevel.II },
  { id: "ii-5.7", themeId: "ii-theme-5", name: "5.7. Пари: банкноти од 10, 50, 100 денари и монети", grade: GradeLevel.II },
  { id: "ii-5.8", themeId: "ii-theme-5", name: "5.8. Пресметување цена, трошок и кусур при пазарење", grade: GradeLevel.II },
  { id: "ii-5.9", themeId: "ii-theme-5", name: "5.9. Собирање податоци со цртички (Tally табела)", grade: GradeLevel.II },
  { id: "ii-5.10", themeId: "ii-theme-5", name: "5.10. Креирање и читање столбест дијаграм", grade: GradeLevel.II },
  { id: "ii-5.11", themeId: "ii-theme-5", name: "5.11. Класификација со венов и керолов дијаграм", grade: GradeLevel.II },

  // ==========================================
  // III ОДДЕЛЕНИЕ (3rd Grade)
  // ==========================================
  // ТЕМА 1: БРОЕВИ ДО 1000 И ДРОПКИ
  { id: "iii-1.1", themeId: "iii-theme-1", name: "1.1. Стотки до 1000 (100, 200, 300... 1000)", grade: GradeLevel.III },
  { id: "iii-1.2", themeId: "iii-theme-1", name: "1.2. Трицифрени броеви: читање, пишување и месна вредност (С, Д, Е)", grade: GradeLevel.III },
  { id: "iii-1.3", themeId: "iii-theme-1", name: "1.3. Развиена форма на број (пр. 438 = 400 + 30 + 8)", grade: GradeLevel.III },
  { id: "iii-1.4", themeId: "iii-theme-1", name: "1.4. Споредување и подредување трицифрени броеви (<, >, =)", grade: GradeLevel.III },
  { id: "iii-1.5", themeId: "iii-theme-1", name: "1.5. Трицифрени броеви на бројна права", grade: GradeLevel.III },
  { id: "iii-1.6", themeId: "iii-theme-1", name: "1.6. Броење по 50 и по 100", grade: GradeLevel.III },
  { id: "iii-1.7", themeId: "iii-theme-1", name: "1.7. Заокружување на најблиската десетка и стотка", grade: GradeLevel.III },
  { id: "iii-1.8", themeId: "iii-theme-1", name: "1.8. Парни и непарни трицифрени броеви", grade: GradeLevel.III },
  { id: "iii-1.9", themeId: "iii-theme-1", name: "1.9. Римски цифри од I до XX", grade: GradeLevel.III },
  { id: "iii-1.10", themeId: "iii-theme-1", name: "1.10. Дропки: дробна црта, броител и именител", grade: GradeLevel.III },
  { id: "iii-1.11", themeId: "iii-theme-1", name: "1.11. Единечни дропки: 1/2, 1/3, 1/4, 1/5, 1/8, 1/10", grade: GradeLevel.III },
  { id: "iii-1.12", themeId: "iii-theme-1", name: "1.12. Претставување дропки со модели и на бројна оска", grade: GradeLevel.III },
  { id: "iii-1.13", themeId: "iii-theme-1", name: "1.13. Споредување дропки со еднакви броители (пр. 1/2 > 1/4)", grade: GradeLevel.III },
  { id: "iii-1.14", themeId: "iii-theme-1", name: "1.14. Наоѓање дропка од дадена количина или број", grade: GradeLevel.III },

  // ТЕМА 2: СОБИРАЊЕ И ОДЗЕМАЊЕ ДО 1000
  { id: "iii-2.1", themeId: "iii-theme-2", name: "2.1. Усно собирање и одземање на полни стотки (пр. 300 + 400, 800 - 500)", grade: GradeLevel.III },
  { id: "iii-2.2", themeId: "iii-theme-2", name: "2.2. Собирање трицифрен со двоцифрен број без премин", grade: GradeLevel.III },
  { id: "iii-2.3", themeId: "iii-theme-2", name: "2.3. Одземање двоцифрен од трицифрен број без премин", grade: GradeLevel.III },
  { id: "iii-2.4", themeId: "iii-theme-2", name: "2.4. Писмено собирање трицифрени броеви без премин", grade: GradeLevel.III },
  { id: "iii-2.5", themeId: "iii-theme-2", name: "2.5. Писмено одземање трицифрени броеви без премин", grade: GradeLevel.III },
  { id: "iii-2.6", themeId: "iii-theme-2", name: "2.6. Писмено собирање со премин на десетки (пр. 248 + 135)", grade: GradeLevel.III },
  { id: "iii-2.7", themeId: "iii-theme-2", name: "2.7. Писмено собирање со премин на стотки и двоен премин", grade: GradeLevel.III },
  { id: "iii-2.8", themeId: "iii-theme-2", name: "2.8. Писмено одземање со позајмување од десетки (пр. 452 - 128)", grade: GradeLevel.III },
  { id: "iii-2.9", themeId: "iii-theme-2", name: "2.9. Писмено одземање со позајмување од стотки и од нула (пр. 500 - 234)", grade: GradeLevel.III },
  { id: "iii-2.10", themeId: "iii-theme-2", name: "2.10. Проверка на собирањето со одземање и обратно", grade: GradeLevel.III },
  { id: "iii-2.11", themeId: "iii-theme-2", name: "2.11. Бројни изрази со загради и редослед на операции", grade: GradeLevel.III },
  { id: "iii-2.12", themeId: "iii-theme-2", name: "2.12. Равенки со непознат собирок, намаленик и намалител", grade: GradeLevel.III },
  { id: "iii-2.13", themeId: "iii-theme-2", name: "2.13. Текстуални задачи за собирање и одземање до 1000", grade: GradeLevel.III },

  // ТЕМА 3: ТАБЛИЦА НА МНОЖЕЊЕ И ДЕЛЕЊЕ ДО 100
  { id: "iii-3.1", themeId: "iii-theme-3", name: "3.1. Повторување на таблиците за множење со 2, 5 и 10", grade: GradeLevel.III },
  { id: "iii-3.2", themeId: "iii-theme-3", name: "3.2. Таблица на множење и делење со 3", grade: GradeLevel.III },
  { id: "iii-3.3", themeId: "iii-theme-3", name: "3.3. Таблица на множење и делење со 4", grade: GradeLevel.III },
  { id: "iii-3.4", themeId: "iii-theme-3", name: "3.4. Таблица на множење и делење со 6", grade: GradeLevel.III },
  { id: "iii-3.5", themeId: "iii-theme-3", name: "3.5. Таблица на множење и делење со 7", grade: GradeLevel.III },
  { id: "iii-3.6", themeId: "iii-theme-3", name: "3.6. Таблица на множење и делење со 8", grade: GradeLevel.III },
  { id: "iii-3.7", themeId: "iii-theme-3", name: "3.7. Таблица на множење и делење со 9", grade: GradeLevel.III },
  { id: "iii-3.8", themeId: "iii-theme-3", name: "3.8. Множење и делење со 1 и со 0", grade: GradeLevel.III },
  { id: "iii-3.9", themeId: "iii-theme-3", name: "3.9. Множење и делење на полни десетки (пр. 30 · 3, 80 : 4)", grade: GradeLevel.III },
  { id: "iii-3.10", themeId: "iii-theme-3", name: "3.10. Дистрибутивно својство на множењето во однос на собирањето", grade: GradeLevel.III },
  { id: "iii-3.11", themeId: "iii-theme-3", name: "3.11. Множење на двоцифрен со едноцифрен број", grade: GradeLevel.III },
  { id: "iii-3.12", themeId: "iii-theme-3", name: "3.12. Делење на двоцифрен со едноцифрен број без остаток (пр. 84 : 4)", grade: GradeLevel.III },
  { id: "iii-3.13", themeId: "iii-theme-3", name: "3.13. Делење со остаток (пр. 17 : 5 = 3 остаток 2)", grade: GradeLevel.III },
  { id: "iii-3.14", themeId: "iii-theme-3", name: "3.14. Равенки со непознат множител, деленик и делител", grade: GradeLevel.III },
  { id: "iii-3.15", themeId: "iii-theme-3", name: "3.15. Текстуални задачи со множење и делење", grade: GradeLevel.III },

  // ТЕМА 4: ГЕОМЕТРИЈА И ПЕРИМЕТАР
  { id: "iii-4.1", themeId: "iii-theme-4", name: "4.1. Агли: врв и краци на агол", grade: GradeLevel.III },
  { id: "iii-4.2", themeId: "iii-theme-4", name: "4.2. Прав, остар и тап агол", grade: GradeLevel.III },
  { id: "iii-4.3", themeId: "iii-theme-4", name: "4.3. Заемно нормални и паралелни прави", grade: GradeLevel.III },
  { id: "iii-4.4", themeId: "iii-theme-4", name: "4.4. Триаголници според должината на страните (рамностран, рамнокрак, разностран)", grade: GradeLevel.III },
  { id: "iii-4.5", themeId: "iii-theme-4", name: "4.5. Периметар на триаголник (L = a + b + c)", grade: GradeLevel.III },
  { id: "iii-4.6", themeId: "iii-theme-4", name: "4.6. Четириаголници: правоаголник и квадрат (својства)", grade: GradeLevel.III },
  { id: "iii-4.7", themeId: "iii-theme-4", name: "4.7. Периметар на квадрат (L = 4 · a)", grade: GradeLevel.III },
  { id: "iii-4.8", themeId: "iii-theme-4", name: "4.8. Периметар на правоаголник (L = 2 · a + 2 · b)", grade: GradeLevel.III },
  { id: "iii-4.9", themeId: "iii-theme-4", name: "4.9. 3Д форми: коцка, квадар, призма, пирамида, валјак, конус, топка (ѕидови, рабови, темиња)", grade: GradeLevel.III },
  { id: "iii-4.10", themeId: "iii-theme-4", name: "4.10. Осна симетрија и цртање симетрични слики на квадратна мрежа", grade: GradeLevel.III },

  // ТЕМА 5: МЕРЕЊЕ, ПАРИ И РАБОТА СО ПОДАТОЦИ
  { id: "iii-5.1", themeId: "iii-theme-5", name: "5.1. Мерки за должина: km, m, dm, cm, mm и претворање", grade: GradeLevel.III },
  { id: "iii-5.2", themeId: "iii-theme-5", name: "5.2. Мерење и проценување должина", grade: GradeLevel.III },
  { id: "iii-5.3", themeId: "iii-theme-5", name: "5.3. Мерки за маса: килограм (kg) и грам (g) (1 kg = 1000 g)", grade: GradeLevel.III },
  { id: "iii-5.4", themeId: "iii-theme-5", name: "5.4. Мерки за зафатнина: литар (l) и милилитар (ml) (1 l = 1000 ml)", grade: GradeLevel.III },
  { id: "iii-5.5", themeId: "iii-theme-5", name: "5.5. Време: минута, секунда, час (1 h = 60 min, 1 min = 60 s)", grade: GradeLevel.III },
  { id: "iii-5.6", themeId: "iii-theme-5", name: "5.6. Читање на дигитален и аналоген часовник точно во минута", grade: GradeLevel.III },
  { id: "iii-5.7", themeId: "iii-theme-5", name: "5.7. Временски интервали и времетраење на настани", grade: GradeLevel.III },
  { id: "iii-5.8", themeId: "iii-theme-5", name: "5.8. Пари: денари (пресметки со пари до 1000 денари)", grade: GradeLevel.III },
  { id: "iii-5.9", themeId: "iii-theme-5", name: "5.9. Поим за плоштина: покривање со квадратни единици", grade: GradeLevel.III },
  { id: "iii-5.10", themeId: "iii-theme-5", name: "5.10. Столбест дијаграм со размер (скала 2, 5, 10)", grade: GradeLevel.III },
  { id: "iii-5.11", themeId: "iii-theme-5", name: "5.11. Пиктограм каде што една слика претставува повеќе предмети", grade: GradeLevel.III },
  { id: "iii-5.12", themeId: "iii-theme-5", name: "5.12. Табели на податоци, венов и керолов дијаграм", grade: GradeLevel.III },

  // ==========================================
  // IV ОДДЕЛЕНИЕ (4th Grade)
  // ==========================================
  // ТЕМА 1: БРОЕВИ ДО 1 000 000, ДРОПКИ И ДЕЦИМАЛНИ БРОЕВИ
  { id: "iv-1.1", themeId: "iv-theme-1", name: "1.1. Броеви до 10 000: читање, пишување и месна вредност", grade: GradeLevel.IV },
  { id: "iv-1.2", themeId: "iv-theme-1", name: "1.2. Броеви до 100 000 и до 1 000 000: класи на единици, илјади и милиони", grade: GradeLevel.IV },
  { id: "iv-1.3", themeId: "iv-theme-1", name: "1.3. Споредување и подредување повеќецифрени броеви", grade: GradeLevel.IV },
  { id: "iv-1.4", themeId: "iv-theme-1", name: "1.4. Заокружување броеви до најблиската 10, 100, 1 000 и 10 000", grade: GradeLevel.IV },
  { id: "iv-1.5", themeId: "iv-theme-1", name: "1.5. Римски цифри до C (100) и L (50)", grade: GradeLevel.IV },
  { id: "iv-1.6", themeId: "iv-theme-1", name: "1.6. Поим за дропка: правилни, неправилни дропки и мешани броеви", grade: GradeLevel.IV },
  { id: "iv-1.7", themeId: "iv-theme-1", name: "1.7. Еднакви (еквивалентни) дропки", grade: GradeLevel.IV },
  { id: "iv-1.8", themeId: "iv-theme-1", name: "1.8. Споредување дропки со еднакви именители", grade: GradeLevel.IV },
  { id: "iv-1.9", themeId: "iv-theme-1", name: "1.9. Претставување дропки на бројна права", grade: GradeLevel.IV },
  { id: "iv-1.10", themeId: "iv-theme-1", name: "1.10. Децимални броеви: десеттинки и стотинки (0,1; 0,01)", grade: GradeLevel.IV },
  { id: "iv-1.11", themeId: "iv-theme-1", name: "1.11. Запишување децимален број во таблица на месни вредности", grade: GradeLevel.IV },
  { id: "iv-1.12", themeId: "iv-theme-1", name: "1.12. Врска меѓу децимален број и децимална дропка (0,5 = 5/10)", grade: GradeLevel.IV },
  { id: "iv-1.13", themeId: "iv-theme-1", name: "1.13. Споредување и подредување децимални броеви", grade: GradeLevel.IV },

  // ТЕМА 2: ОПЕРАЦИИ СО БРОЕВИ (МНОЖЕЊЕ И ДЕЛЕЊЕ СО ПОВЕЌЕЦИФРЕНИ БРОЕВИ)
  { id: "iv-2.1", themeId: "iv-theme-2", name: "2.1. Писмено собирање на повеќецифрени броеви до 1 000 000", grade: GradeLevel.IV },
  { id: "iv-2.2", themeId: "iv-theme-2", name: "2.2. Писмено одземање на повеќецифрени броеви до 1 000 000", grade: GradeLevel.IV },
  { id: "iv-2.3", themeId: "iv-theme-2", name: "2.3. Својства на собирањето и одземањето и проверка", grade: GradeLevel.IV },
  { id: "iv-2.4", themeId: "iv-theme-2", name: "2.4. Множење со полни десетки, стотки и илјади (со 10, 100, 1000)", grade: GradeLevel.IV },
  { id: "iv-2.5", themeId: "iv-theme-2", name: "2.5. Писмено множење на повеќецифрен број со едноцифрен број", grade: GradeLevel.IV },
  { id: "iv-2.6", themeId: "iv-theme-2", name: "2.6. Писмено множење на двоцифрен и трицифрен број со двоцифрен број", grade: GradeLevel.IV },
  { id: "iv-2.7", themeId: "iv-theme-2", name: "2.7. Својства на множењето (комутативно, асоцијативно, дистрибутивно)", grade: GradeLevel.IV },
  { id: "iv-2.8", themeId: "iv-theme-2", name: "2.8. Делење со полни десетки и стотки (со 10, 100, 1000)", grade: GradeLevel.IV },
  { id: "iv-2.9", themeId: "iv-theme-2", name: "2.9. Писмено делење на повеќецифрен број со едноцифрен број без остаток", grade: GradeLevel.IV },
  { id: "iv-2.10", themeId: "iv-theme-2", name: "2.10. Писмено делење на повеќецифрен број со едноцифрен број со остаток", grade: GradeLevel.IV },
  { id: "iv-2.11", themeId: "iv-theme-2", name: "2.11. Собирање и одземање дропки со еднакви именители", grade: GradeLevel.IV },
  { id: "iv-2.12", themeId: "iv-theme-2", name: "2.12. Собирање и одземање децимални броеви", grade: GradeLevel.IV },
  { id: "iv-2.13", themeId: "iv-theme-2", name: "2.13. Бројни изрази со повеќе операции и загради", grade: GradeLevel.IV },
  { id: "iv-2.14", themeId: "iv-theme-2", name: "2.14. Равенки со непознат собирок, намаленик, множител и деленик", grade: GradeLevel.IV },
  { id: "iv-2.15", themeId: "iv-theme-2", name: "2.15. Текстуални задачи од реалниот живот со пресметки со пари и мерки", grade: GradeLevel.IV },

  // ТЕМА 3: ГЕОМЕТРИЈА (АГЛИ, ТРИАГОЛНИЦИ И ЧЕТИРИАГОЛНИЦИ)
  { id: "iv-3.1", themeId: "iv-theme-3", name: "3.1. Агол: мерење агли со агломер во степени (°)", grade: GradeLevel.IV },
  { id: "iv-3.2", themeId: "iv-theme-3", name: "3.2. Видови агли: остар, прав, тап, рамен и полн агол", grade: GradeLevel.IV },
  { id: "iv-3.3", themeId: "iv-theme-3", name: "3.3. Цртање агли со дадена големина со агломер", grade: GradeLevel.IV },
  { id: "iv-3.4", themeId: "iv-theme-3", name: "3.4. Триаголници: класификација според аглите (остроаголен, правоаголен, тапоаголен)", grade: GradeLevel.IV },
  { id: "iv-3.5", themeId: "iv-theme-3", name: "3.5. Триаголници: класификација според страните (рамностран, рамнокрак, разностран)", grade: GradeLevel.IV },
  { id: "iv-3.6", themeId: "iv-theme-3", name: "3.6. Збир на агли во триаголник (180°)", grade: GradeLevel.IV },
  { id: "iv-3.7", themeId: "iv-theme-3", name: "3.7. Четириаголници: квадрат, правоаголник, ромб, паралелограм, трапез, делтоид", grade: GradeLevel.IV },
  { id: "iv-3.8", themeId: "iv-theme-3", name: "3.8. Својства на дијагоналите кај четириаголниците", grade: GradeLevel.IV },
  { id: "iv-3.9", themeId: "iv-theme-3", name: "3.9. Мрежи на коцка и квадар", grade: GradeLevel.IV },
  { id: "iv-3.10", themeId: "iv-theme-3", name: "3.10. Координатен систем во прв квадрант: одредување координати (x, y)", grade: GradeLevel.IV },
  { id: "iv-3.11", themeId: "iv-theme-3", name: "3.11. Осна симетрија и транслација на форми во мрежа", grade: GradeLevel.IV },

  // ТЕМА 4: МЕРЕЊЕ, ПЕРИМЕТАР И ПЛОШТИНА
  { id: "iv-4.1", themeId: "iv-theme-4", name: "4.1. Систем на мерни единици за должина: mm, cm, dm, m, km и претворање", grade: GradeLevel.IV },
  { id: "iv-4.2", themeId: "iv-theme-4", name: "4.2. Мерни единици за маса: g, kg, t (тон) и претворање", grade: GradeLevel.IV },
  { id: "iv-4.3", themeId: "iv-theme-4", name: "4.3. Мерни единици за зафатнина: ml, l, hl и претворање", grade: GradeLevel.IV },
  { id: "iv-4.4", themeId: "iv-theme-4", name: "4.4. Периметар на многуаголник", grade: GradeLevel.IV },
  { id: "iv-4.5", themeId: "iv-theme-4", name: "4.5. Периметар на правоаголник и квадрат (формули L = 2a+2b, L = 4a)", grade: GradeLevel.IV },
  { id: "iv-4.6", themeId: "iv-theme-4", name: "4.6. Поим за плоштина и мерни единици: mm², cm², dm², m²", grade: GradeLevel.IV },
  { id: "iv-4.7", themeId: "iv-theme-4", name: "4.7. Плоштина на правоаголник (P = a · b)", grade: GradeLevel.IV },
  { id: "iv-4.8", themeId: "iv-theme-4", name: "4.8. Плоштина на квадрат (P = a · a)", grade: GradeLevel.IV },
  { id: "iv-4.9", themeId: "iv-theme-4", name: "4.9. Плоштина на сложени геометриски фигури составени од правоаголници", grade: GradeLevel.IV },
  { id: "iv-4.10", themeId: "iv-theme-4", name: "4.10. Волумен со пребројување на единечни коцки", grade: GradeLevel.IV },
  { id: "iv-4.11", themeId: "iv-theme-4", name: "4.11. Мерки за време: век, деценија, година, месец, седмица, ден, час, минута, секунда", grade: GradeLevel.IV },
  { id: "iv-4.12", themeId: "iv-theme-4", name: "4.12. Временски интервали и времетраење на настани", grade: GradeLevel.IV },

  // ТЕМА 5: РАБОТА СО ПОДАТОЦИ И ВЕРОЈАТНОСТ
  { id: "iv-5.1", themeId: "iv-theme-5", name: "5.1. Табели на фреквенција за собирање податоци", grade: GradeLevel.IV },
  { id: "iv-5.2", themeId: "iv-theme-5", name: "5.2. Читање и цртање столбест дијаграм", grade: GradeLevel.IV },
  { id: "iv-5.3", themeId: "iv-theme-5", name: "5.3. Линиски дијаграм: читање и толкување на трендови", grade: GradeLevel.IV },
  { id: "iv-5.4", themeId: "iv-theme-5", name: "5.4. Пиктограм со сложен размер", grade: GradeLevel.IV },
  { id: "iv-5.5", themeId: "iv-theme-5", name: "5.5. Мода: најчеста вредност во низа податоци", grade: GradeLevel.IV },
  { id: "iv-5.6", themeId: "iv-theme-5", name: "5.6. Медијана: средна вредност во подредена низа податоци", grade: GradeLevel.IV },
  { id: "iv-5.7", themeId: "iv-theme-5", name: "5.7. Поим за веројатност: сигурен, можен и невозможен настан", grade: GradeLevel.IV },
  { id: "iv-5.8", themeId: "iv-theme-5", name: "5.8. Скала на веројатност", grade: GradeLevel.IV },

  // ==========================================
  // V ОДДЕЛЕНИЕ (5th Grade)
  // ==========================================
  // ТЕМА 1: БРОЕВИ, ДЕЛИВОСТ И ОПЕРАЦИИ СО ПОВЕЌЕЦИФРЕНИ БРОЕВИ
  { id: "v-1.1", themeId: "v-theme-1", name: "1.1. Броеви поголеми од 1 000 000 (милиони, милијарди) и месна вредност", grade: GradeLevel.V },
  { id: "v-1.2", themeId: "v-theme-1", name: "1.2. Заокружување на големи броеви и проценување вредности", grade: GradeLevel.V },
  { id: "v-1.3", themeId: "v-theme-1", name: "1.3. Негативни броеви во секојдневието (температура, надморска височина, долгови)", grade: GradeLevel.V },
  { id: "v-1.4", themeId: "v-theme-1", name: "1.4. Деливост на броевите: делители и содржатели", grade: GradeLevel.V },
  { id: "v-1.5", themeId: "v-theme-1", name: "1.5. Признаци за деливост со 2, со 5 и со 10", grade: GradeLevel.V },
  { id: "v-1.6", themeId: "v-theme-1", name: "1.6. Признаци за деливост со 3 и со 9", grade: GradeLevel.V },
  { id: "v-1.7", themeId: "v-theme-1", name: "1.7. Прости и сложени броеви. Ератостеново решето", grade: GradeLevel.V },
  { id: "v-1.8", themeId: "v-theme-1", name: "1.8. Разложување броеви на прости множители", grade: GradeLevel.V },
  { id: "v-1.9", themeId: "v-theme-1", name: "1.9. Заеднички делители и Најголем заеднички делител (НЗД)", grade: GradeLevel.V },
  { id: "v-1.10", themeId: "v-theme-1", name: "1.10. Заеднички содржатели и Најмал заеднички содржател (НЗС)", grade: GradeLevel.V },
  { id: "v-1.11", themeId: "v-theme-1", name: "1.11. Писмено множење на повеќецифрени броеви со двоцифрен и трицифрен број", grade: GradeLevel.V },
  { id: "v-1.12", themeId: "v-theme-1", name: "1.12. Писмено делење на повеќецифрени броеви со двоцифрен број со и без остаток", grade: GradeLevel.V },
  { id: "v-1.13", themeId: "v-theme-1", name: "1.13. Редослед на операции во сложени изрази со загради () и []", grade: GradeLevel.V },

  // ТЕМА 2: ДРОПКИ, ДЕЦИМАЛНИ БРОЕВИ И ПРОЦЕНТИ
  { id: "v-2.1", themeId: "v-theme-2", name: "2.1. Поим за дропка: проширување и скратување дропки", grade: GradeLevel.V },
  { id: "v-2.2", themeId: "v-theme-2", name: "2.2. Нескратлива дропка", grade: GradeLevel.V },
  { id: "v-2.3", themeId: "v-theme-2", name: "2.3. Сведување дропки на заеднички именител", grade: GradeLevel.V },
  { id: "v-2.4", themeId: "v-theme-2", name: "2.4. Споредување и подредување дропки со различни именители", grade: GradeLevel.V },
  { id: "v-2.5", themeId: "v-theme-2", name: "2.5. Правилни, неправилни дропки и претворање во мешан број", grade: GradeLevel.V },
  { id: "v-2.6", themeId: "v-theme-2", name: "2.6. Собирање и одземање дропки со еднакви именители", grade: GradeLevel.V },
  { id: "v-2.7", themeId: "v-theme-2", name: "2.7. Собирање и одземање дропки со различни именители", grade: GradeLevel.V },
  { id: "v-2.8", themeId: "v-theme-2", name: "2.8. Собирање и одземање мешани броеви", grade: GradeLevel.V },
  { id: "v-2.9", themeId: "v-theme-2", name: "2.9. Множење на дропка со природен број", grade: GradeLevel.V },
  { id: "v-2.10", themeId: "v-theme-2", name: "2.10. Децимални броеви со три децимални места (илјадинки)", grade: GradeLevel.V },
  { id: "v-2.11", themeId: "v-theme-2", name: "2.11. Собирање и одземање децимални броеви", grade: GradeLevel.V },
  { id: "v-2.12", themeId: "v-theme-2", name: "2.12. Множење и делење децимален број со 10, 100, 1000", grade: GradeLevel.V },
  { id: "v-2.13", themeId: "v-theme-2", name: "2.13. Множење децимален број со природен број", grade: GradeLevel.V },
  { id: "v-2.14", themeId: "v-theme-2", name: "2.14. Делење децимален број со природен број", grade: GradeLevel.V },
  { id: "v-2.15", themeId: "v-theme-2", name: "2.15. Проценти: поим за процент (%) и врска меѓу дропка, децимален број и процент", grade: GradeLevel.V },
  { id: "v-2.16", themeId: "v-theme-2", name: "2.16. Пресметување процент од број (10%, 25%, 50%, 75%)", grade: GradeLevel.V },
  { id: "v-2.17", themeId: "v-theme-2", name: "2.17. Текстуални задачи со дропки, децимални броеви и проценти", grade: GradeLevel.V },

  // ТЕМА 3: ГЕОМЕТРИЈА И КООРДИНАТЕН СИСТЕМ
  { id: "v-3.1", themeId: "v-theme-3", name: "3.1. Заемна положба на прави во рамнина (паралелни, нормални, се сечат)", grade: GradeLevel.V },
  { id: "v-3.2", themeId: "v-theme-3", name: "3.2. Симетрала на отсечка (конструкција со линијар и шестар)", grade: GradeLevel.V },
  { id: "v-3.3", themeId: "v-theme-3", name: "3.3. Кружница и круг: центар, радиус (r), дијаметар (d), тетива, кружен лак", grade: GradeLevel.V },
  { id: "v-3.4", themeId: "v-theme-3", name: "3.4. Агли: вкрстени, соседни и напоредни агли", grade: GradeLevel.V },
  { id: "v-3.5", themeId: "v-theme-3", name: "3.5. Збир на агли во триаголник (180°) и пресметување непознат агол", grade: GradeLevel.V },
  { id: "v-3.6", themeId: "v-theme-3", name: "3.6. Збир на агли во четириаголник (360°)", grade: GradeLevel.V },
  { id: "v-3.7", themeId: "v-theme-3", name: "3.7. 3Д геометриски тела: призма, пирамида, валјак, конус, топка", grade: GradeLevel.V },
  { id: "v-3.8", themeId: "v-theme-3", name: "3.8. Мрежи на коцка, квадар, правилна призма и пирамида", grade: GradeLevel.V },
  { id: "v-3.9", themeId: "v-theme-3", name: "3.9. Правоаголен координатен систем: читање и исцртување точки во рамнина", grade: GradeLevel.V },
  { id: "v-3.10", themeId: "v-theme-3", name: "3.10. Геометриски трансформации: рефлексија, ротација за 90° и 180°, транслација", grade: GradeLevel.V },

  // ТЕМА 4: МЕРЕЊЕ, ПЛОШТИНА И ВОЛУМЕН
  { id: "v-4.1", themeId: "v-theme-4", name: "4.1. Претворање на мерни единици за должина, маса и зафатнина со децимални броеви", grade: GradeLevel.V },
  { id: "v-4.2", themeId: "v-theme-4", name: "4.2. Периметар на триаголник, правоаголник, квадрат и сложени многуаголници", grade: GradeLevel.V },
  { id: "v-4.3", themeId: "v-theme-4", name: "4.3. Плоштина на правоаголник и квадрат", grade: GradeLevel.V },
  { id: "v-4.4", themeId: "v-theme-4", name: "4.4. Мерни единици за плоштина: mm², cm², dm², m², ar, ha, km²", grade: GradeLevel.V },
  { id: "v-4.5", themeId: "v-theme-4", name: "4.5. Плоштина на правоаголен триаголник (P = (a · b) / 2)", grade: GradeLevel.V },
  { id: "v-4.6", themeId: "v-theme-4", name: "4.6. Плоштина на сложени фигури составени од правоаголници и триаголници", grade: GradeLevel.V },
  { id: "v-4.7", themeId: "v-theme-4", name: "4.7. Плоштина на коцка од нејзината мрежа (P = 6 · a²)", grade: GradeLevel.V },
  { id: "v-4.8", themeId: "v-theme-4", name: "4.8. Плоштина на квадар од неговата мрежа (P = 2 · (ab + bc + ac))", grade: GradeLevel.V },
  { id: "v-4.9", themeId: "v-theme-4", name: "4.9. Мерни единици за волумен: mm³, cm³, dm³, m³ и врска со течности (1 dm³ = 1 l, 1 cm³ = 1 ml)", grade: GradeLevel.V },
  { id: "v-4.10", themeId: "v-theme-4", name: "4.10. Волумен на коцка (V = a³)", grade: GradeLevel.V },
  { id: "v-4.11", themeId: "v-theme-4", name: "4.11. Волумен на квадар (V = a · b · c)", grade: GradeLevel.V },
  { id: "v-4.12", themeId: "v-theme-4", name: "4.12. Практични задачи со мерење, плоштина и волумен во секојдневието", grade: GradeLevel.V },

  // ТЕМА 5: РАБОТА СО ПОДАТОЦИ, ПРОСЕК И ВЕРОЈАТНОСТ
  { id: "v-5.1", themeId: "v-theme-5", name: "5.1. Статистичко истражување: поставување прашања, собирање и средување податоци", grade: GradeLevel.V },
  { id: "v-5.2", themeId: "v-theme-5", name: "5.2. Двоен столбест дијаграм: споредба на две групи податоци", grade: GradeLevel.V },
  { id: "v-5.3", themeId: "v-theme-5", name: "5.3. Линиски дијаграм за континуирани промени", grade: GradeLevel.V },
  { id: "v-5.4", themeId: "v-theme-5", name: "5.4. Кружен (секторски) дијаграм: читање и проценување делови", grade: GradeLevel.V },
  { id: "v-5.5", themeId: "v-theme-5", name: "5.5. Статистички параметри: аритметичка средина (просек)", grade: GradeLevel.V },
  { id: "v-5.6", themeId: "v-theme-5", name: "5.6. Статистички параметри: медијана, мода и ранг на податоци", grade: GradeLevel.V },
  { id: "v-5.7", themeId: "v-theme-5", name: "5.7. Веројатност на настан: дропка како мерка за веројатност (пр. 1/6 при фрлање коцка)", grade: GradeLevel.V },
  { id: "v-5.8", themeId: "v-theme-5", name: "5.8. Експерименти и симулации на веројатност", grade: GradeLevel.V },
];
