
import React, { useState } from 'react';
import { 
  BookOpen, 
  Info, 
  Wrench, 
  UserCheck, 
  Award, 
  List, 
  ChevronRight, 
  ChevronDown, 
  X,
  Layout,
  FileText,
  CheckCircle2,
  Activity,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProgramSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

const ProgramSection: React.FC<ProgramSectionProps> = ({ title, icon, children, isOpen, onToggle }) => (
  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm mb-4">
    <button 
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
          {icon}
        </div>
        <h3 className="font-bold text-slate-800">{title}</h3>
      </div>
      {isOpen ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="border-t border-slate-100"
        >
          <div className="p-6 text-slate-600 leading-relaxed">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const Drawer: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, icon, children }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
        />
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                {icon}
              </div>
              <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600 shadow-sm"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 text-slate-600 leading-relaxed">
            {children}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const ProgramsView: React.FC = () => {
  const [activeDrawer, setActiveDrawer] = useState<'equipment' | 'normative' | 'standards' | null>(null);
  const [openTheme, setOpenTheme] = useState<number | null>(null);
  const [activeSubSection, setActiveSubSection] = useState<string | null>(null);

  const grade6Data = {
    title: "Наставна програма Математика за VI одделение",
    basics: {
      subject: "Математика",
      category: "Задолжителен",
      grade: "VI (шесто)",
      areas: ["Броеви", "Геометрија", "Операции со броеви", "Мерење", "Работа со податоци"],
      hours: "5 часа неделно / 180 часа годишно"
    },
    equipment: [
      "Картички со броеви/цифри, ѕид со дропки, картички со различни видови многуаголници, хартиена лента, флеш картички, табели Стотка, коцки за играње (1-6), правоаголници од картон, квадратни мрежи, картички за избор на дијаграми, картички за статистички мерки.",
      "Конци, дрвени стапчиња, метро, прибор за геометрија, инструменти за мерење на маса, должина, волумен на течност, температура.",
      "Хамер хартија, флипчарт хартија, маркери, стикер хартија, канцелариски материјали- иглички со топчиња, селотејп, геотабли, милиметарска хартија, ножици, течно лепило, стиропор, тврда хартија- картон.",
      "Пристап до интернет, ЛЦД проектор, компјутери."
    ],
    normative: [
      "студии по математика - наставна насока, VII/1 т.е 240 кредити;",
      "студии по математика - физика, VII /1 т.е 240 кредити;",
      "студии по математика - хемија, VII /1 т.е 240 кредити;",
      "студии по математика – информатика, наставна насока, VII /1 т.е 240 кредити;",
      "студии по математика – друга ненаставна насока, VII /1 т.е 240 кредити, со стекната педагошко-психолошка и методска подготовка."
    ],
    standards: [
      { code: "III-А.1", desc: "да користи редослед на операции со цели броеви, дропки и децимални броеви, вклучувајќи и загради;" },
      { code: "II-А.2", desc: "да заокружува броеви до одреден степен на прецизност;" },
      { code: "II-А.3", desc: "да испитува намалување или зголемување во проценти (камата, попуст, добивка, загуба и данок);" },
      { code: "III-А.4", desc: "да одлучува кога да примени дропка или проценти;" },
      { code: "III-А.5", desc: "да применува размер во различни контексти;" },
      { code: "III-А.12", desc: "да открива својствата на агли, прави што се сечат, триаголници, многуаголници и круг;" },
      { code: "III-А.13", desc: "да анализира 3Д-форми преку мрежи и проекции;" },
      { code: "III-А.15", desc: "да трансформира 2Д-форми (транслација, ротација, осна симетрија);" },
      { code: "III-А.18", desc: "да ги користи мерните единици (должина, маса, зафатнина, плоштина и волумен);" },
      { code: "III-А.19", desc: "да пресметува периметар и плоштина на 2Д-форми;" },
      { code: "III-А.23", desc: "да толкува табели, графикони и дијаграми;" },
      { code: "III-А.24", desc: "да проценува настан, веројатност на настан;" },
      { code: "III-А.26", desc: "да ја оценува ефикасноста на различни пристапи;" },
      { code: "III-А.27", desc: "да користи математички апликации." }
    ],
    themes: [
      {
        id: 1,
        title: "ТЕМА 1: БРОЕВИ (40 часа)",
        results: [
          "ги користи знаењата за множества за да ги објасни и запишe множествaтa на природните броеви, целите броеви и позитивните рационални броеви;",
          "ги применува римските броеви во практични примери;",
          "користи дропки, децимални броеви, проценти и размер во секојдневен контекст;",
          "го открива правилото за одредување на секој член на дадена низа од цели броеви."
        ],
        topics: [
          {
            title: "Множества",
            standards: [
              {
                text: "Ученикот може да разликува елемент од подмножество и да користи ознаки ∈, ∉, ⊆, ⊂.",
                activities: [
                  "Групирање ученици според својства (боја на очи, пол) за формирање на множества и подмножества.",
                  "Работа со сликички од животни за формирање множества и воочување на припадност на елемент.",
                  "Игра „Флеш картички“ за препознавање на еднакви и истобројни множества."
                ]
              },
              {
                text: "Ученикот може да претставува множества на различни начини (табеларно, графички, описно).",
                activities: [
                  "Цртање на Венови дијаграми за претставување на множества од броеви или предмети.",
                  "Запишување на множества со набројување на елементите во загради { }."
                ]
              }
            ]
          },
          {
            title: "Природни броеви",
            standards: [
              {
                text: "Ученикот може да чита, запишува и споредува природни броеви до 1.000.000.",
                activities: [
                  "Користење на табела со месни вредности за запишување на големи броеви.",
                  "Подредување на броеви на бројна права на хартиена лента."
                ]
              },
              {
                text: "Ученикот може да заокружува броеви до најблиската десетка, стотка или илјада.",
                activities: [
                  "Игра „Заокружи ме“ каде учениците се движат кон најблиската означена десетка на подот.",
                  "Решавање на задачи од секојдневието каде е потребна проценка и заокружување."
                ]
              }
            ]
          },
          {
            title: "Римски броеви",
            standards: [
              {
                text: "Ученикот ги препознава и користи римските цифри I, V, X, L, C, D, M за запишување броеви.",
                activities: [
                  "Игра „Пронајди го својот број“ со римски цифри на картички.",
                  "Истражување на римски броеви на часовници или во наслови на поглавја во книги."
                ]
              }
            ]
          }
        ]
      },
      {
        id: 2,
        title: "ТЕМА 2: ГЕОМЕТРИЈА (40 часа)",
        results: [
          "решава проблеми од секојдневен контекст со користење на поимите отсечка и агол;",
          "ги користи поимите кружница, круг, заемна положба на кружница со точка, права и кружница;",
          "решава проблеми од триаголник со користење на поимите: ортоцентар, тежиште, впишана и опишана кружница и збир на агли во триаголник;"
        ],
        topics: [
          {
            title: "Отсечка и агол",
            standards: [
              {
                text: "Ученикот може да конструира симетрала на отсечка и симетрала на агол.",
                activities: [
                  "Конструирање на симетрала со прибор за геометрија на хартија без линии.",
                  "Преклопување на хартија за воочување на симетрија кај агли."
                ]
              },
              {
                text: "Ученикот ги разликува видовите агли (соседни, напоредни, накрсни, суплементни).",
                activities: [
                  "Мерење на агли во училницата и нивно класифицирање.",
                  "Техника „Аквариум“ за проценка на големина на агли без агломер."
                ]
              }
            ]
          },
          {
            title: "Круг и кружница",
            standards: [
              {
                text: "Ученикот ги користи поимите радиус, дијаметар и тетива и ја одредува нивната заемна положба.",
                activities: [
                  "Изработка на „шестар“ од стиропор, конец и молив за цртање големи кружници.",
                  "Техника „Галерија“ за изложување и оценување на цртежи со кружници."
                ]
              }
            ]
          }
        ]
      },
      {
        id: 3,
        title: "ТЕМА 3: ОПЕРАЦИИ СО БРОЕВИ (55 часа)",
        results: [
          "составува и решава проблеми од секојдневен контекст со користење на операции со броеви од N0;",
          "решава проблеми од секојдневни ситуации со користење на НЗД и НЗС на природни броеви;",
          "решава проблеми со собирање и одземање на дропки со ист именител;",
          "користи месна вредност и факти од природни броеви за собирање, одземање, множење и делење на децимални броеви."
        ],
        topics: [
          {
            title: "Операции во N0",
            standards: [
              {
                text: "Ученикот може да собира, одзема, множи и дели природни броеви до 1.000.000.",
                activities: [
                  "Пополнување „синџири“ со множење и делење со 10, 100, 1000.",
                  "Сложувалка „Тарсија“ за примена на својствата на операциите (комутативност, асоцијативност)."
                ]
              },
              {
                text: "Ученикот решава равенки со една непозната.",
                activities: [
                  "Игра „Аквариум“ за решавање на едноставни равенки преку практични примери.",
                  "Составување на равенка според даден текстуален проблем."
                ]
              }
            ]
          },
          {
            title: "Деливост",
            standards: [
              {
                text: "Ученикот ги применува признаците за деливост со 2, 3, 4, 5, 6, 8, 9 и 10.",
                activities: [
                  "Игра „Содржатели и делители“ во табела Стотка.",
                  "Разложување на броеви на прости множители преку „Пајак од множители“."
                ]
              },
              {
                text: "Ученикот одредува НЗД и НЗС за два или повеќе броја.",
                activities: [
                  "Решавање на проблемски ситуации (на пр. пакување подароци) каде е потребен НЗД.",
                  "Користење на Венови дијаграми за наоѓање на заеднички делители."
                ]
              }
            ]
          }
        ]
      },
      {
        id: 4,
        title: "ТЕМА 4: МЕРЕЊЕ (30 часа)",
        results: [
          "ги користи мерните единици за должина, маса и зафатнина за решавање на реални проблемски ситуации;",
          "решава проблеми со временски интервали;",
          "решава проблеми од секојдневен контекст со пресметување на плоштина."
        ],
        topics: [
          {
            title: "Мерни единици",
            standards: [
              {
                text: "Ученикот може да претвора мерни единици за должина, маса и зафатнина.",
                activities: [
                  "Мерење на масата на училишниот ранец и претворање во различни единици.",
                  "Проблем со украсна лента и панделки за вежбање на должина."
                ]
              }
            ]
          },
          {
            title: "Време и Пари",
            standards: [
              {
                text: "Ученикот решава проблеми со временски интервали и користи курсна листа.",
                activities: [
                  "Планирање на еднодневна прошетка со користење на возен ред.",
                  "Конверзија на цени од евра во денари за патики или облека."
                ]
              }
            ]
          },
          {
            title: "Плоштина",
            standards: [
              {
                text: "Ученикот пресметува плоштина на форми составени од правоаголници и правоаголен триаголник.",
                activities: [
                  "Проект „Идеално детско игралиште“ каде се пресметува плоштина на различни зони.",
                  "Цртање на мрежа на хартија и пресметување плоштина преку броење квадратчиња."
                ]
              }
            ]
          }
        ]
      },
      {
        id: 5,
        title: "ТЕМА 5: РАБОТА СО ПОДАТОЦИ (15 часа)",
        results: [
          "планира и реализира истражувања на прашања од секојдневен контекст;",
          "користи поими од веројатност за да дискутира за настани."
        ],
        topics: [
          {
            title: "Податоци",
            standards: [
              {
                text: "Ученикот собира, организира и толкува податоци преку дијаграми.",
                activities: [
                  "Истражување за температурата во текот на една недела и цртање линиски дијаграм.",
                  "Анализа на омилени спортови во класот преку столбест дијаграм."
                ]
              }
            ]
          },
          {
            title: "Веројатност",
            standards: [
              {
                text: "Ученикот проценува веројатност на настан (сигурен, невозможен, еднаква веројатност).",
                activities: [
                  "Техника „Минутна работа“ со фрлање коцка и предвидување на резултатот.",
                  "Дискусија за временска прогноза и веројатност за дожд."
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="border-b pb-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{grade6Data.title}</h1>
            <p className="text-slate-500 font-medium">Официјална наставна програма на МОН / БРО (2023)</p>
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => setActiveDrawer('equipment')}
          className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all group text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">Опрема и средства</h4>
            <p className="text-xs text-slate-500">Потребни материјали за настава</p>
          </div>
        </button>

        <button 
          onClick={() => setActiveDrawer('normative')}
          className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all group text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">Норматив на кадар</h4>
            <p className="text-xs text-slate-500">Квалификации за наставници</p>
          </div>
        </button>

        <button 
          onClick={() => setActiveDrawer('standards')}
          className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all group text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">Национални стандарди</h4>
            <p className="text-xs text-slate-500">Поврзаност со компетенции</p>
          </div>
        </button>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-6">
        {/* 1. Основни податоци */}
        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
              <Info className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">1. Основни податоци</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Наставен предмет</p>
              <p className="text-slate-700 font-medium">{grade6Data.basics.subject}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Вид/категорија</p>
              <p className="text-slate-700 font-medium">{grade6Data.basics.category}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Одделение</p>
              <p className="text-slate-700 font-medium">{grade6Data.basics.grade}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Број на часови</p>
              <p className="text-slate-700 font-medium">{grade6Data.basics.hours}</p>
            </div>
            <div className="sm:col-span-2 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Теми/подрачја</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {grade6Data.basics.areas.map((area, idx) => (
                  <span key={idx} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 5. Резултати од учење по теми */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <List className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">5. Резултати од учење по теми</h2>
          </div>

          {grade6Data.themes.map((theme) => (
            <div key={theme.id} className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm">
              <button 
                onClick={() => {
                  if (openTheme !== theme.id) {
                    setOpenTheme(theme.id);
                    setActiveSubSection(null);
                    setActiveTopic(null);
                  } else {
                    setOpenTheme(null);
                  }
                }}
                className={`w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-all text-left ${openTheme === theme.id ? 'bg-indigo-50/30' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm border ${openTheme === theme.id ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {theme.id}
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">{theme.title}</h3>
                </div>
                {openTheme === theme.id ? <ChevronDown className="w-6 h-6 text-indigo-600" /> : <ChevronRight className="w-6 h-6 text-slate-400" />}
              </button>

              <AnimatePresence>
                {openTheme === theme.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-100"
                  >
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Sub-navigation */}
                      <div className="lg:col-span-1 space-y-4">
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Општи цели</h4>
                          <button 
                            onClick={() => setActiveSubSection('results')}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all border ${activeSubSection === 'results' ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                          >
                            <CheckCircle2 className="w-4 h-4" /> Резултати
                          </button>
                        </div>

                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Содржини</h4>
                          <div className="space-y-1">
                            {theme.topics.map((topic, tIdx) => (
                              <button 
                                key={tIdx}
                                onClick={() => {
                                  setActiveSubSection('topic-detail');
                                  setActiveTopic(topic.title);
                                }}
                                className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all border ${activeSubSection === 'topic-detail' && activeTopic === topic.title ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'}`}
                              >
                                <span className="truncate">{topic.title}</span>
                                <ChevronRight className="w-4 h-4 opacity-50" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="lg:col-span-3 bg-slate-50 rounded-2xl p-6 border border-slate-100 min-h-[400px]">
                        {!activeSubSection ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 py-20">
                            <Layers className="w-16 h-16 opacity-10" />
                            <p className="font-medium">Изберете содржина за да ги видите стандардите и активностите</p>
                          </div>
                        ) : activeSubSection === 'results' ? (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                          >
                            <div className="flex items-center gap-2 text-indigo-600 mb-4">
                              <CheckCircle2 className="w-5 h-5" />
                              <h4 className="font-bold uppercase tracking-wider text-sm">Очекувани резултати од учење</h4>
                            </div>
                            <ul className="space-y-4">
                              {theme.results.map((result, idx) => (
                                <li key={idx} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-700 text-sm leading-relaxed">
                                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600">
                                    {idx + 1}
                                  </span>
                                  {result}
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        ) : (
                          <motion.div 
                            key={activeTopic}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-8"
                          >
                            <div className="border-b border-slate-200 pb-4 mb-6">
                              <h3 className="text-2xl font-black text-slate-800">{activeTopic}</h3>
                              <p className="text-slate-500 text-sm">Стандарди за оценување и примери за активности</p>
                            </div>

                            {theme.topics.find(t => t.title === activeTopic)?.standards.map((std, sIdx) => (
                              <div key={sIdx} className="space-y-4">
                                <div className="flex items-start gap-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                                  <Award className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Стандард за оценување</p>
                                    <p className="text-slate-800 font-bold leading-relaxed">{std.text}</p>
                                  </div>
                                </div>

                                <div className="pl-8 space-y-3">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Activity className="w-3 h-3" /> Примери за активности
                                  </p>
                                  {std.activities.map((act, aIdx) => (
                                    <div key={aIdx} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                      <p className="text-slate-600 text-sm leading-relaxed italic">
                                        "{act}"
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Drawers */}
      <Drawer 
        isOpen={activeDrawer === 'equipment'} 
        onClose={() => setActiveDrawer(null)}
        title="Опрема и средства"
        icon={<Wrench className="w-6 h-6" />}
      >
        <div className="space-y-6">
          {grade6Data.equipment.map((text, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </Drawer>

      <Drawer 
        isOpen={activeDrawer === 'normative'} 
        onClose={() => setActiveDrawer(null)}
        title="Норматив на кадар"
        icon={<UserCheck className="w-6 h-6" />}
      >
        <div className="space-y-4">
          <p className="font-bold text-slate-800 mb-4">Настава по математика во VI одделение може да реализира лице кое завршило:</p>
          {grade6Data.normative.map((text, idx) => (
            <div key={idx} className="flex gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <p className="text-sm">{text}</p>
            </div>
          ))}
        </div>
      </Drawer>

      <Drawer 
        isOpen={activeDrawer === 'standards'} 
        onClose={() => setActiveDrawer(null)}
        title="Национални стандарди"
        icon={<Award className="w-6 h-6" />}
      >
        <div className="space-y-3">
          {grade6Data.standards.map((std, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
              <span className="inline-block px-2 py-1 bg-indigo-600 text-white text-[10px] font-black rounded mb-2">
                {std.code}
              </span>
              <p className="text-sm font-medium text-slate-700">{std.desc}</p>
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
};

export default ProgramsView;
