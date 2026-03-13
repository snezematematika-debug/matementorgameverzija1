
import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  BookOpen, 
  Play, 
  BarChart3, 
  Clock, 
  ArrowRight,
  Zap,
  Star,
  Users,
  Flag
} from 'lucide-react';
import { AppMode } from '../types';

interface DashboardProps {
  setMode: (mode: AppMode) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setMode }) => {
  const quotes = [
    { text: "Математиката е јазикот на кој Бог го напишал универзумот.", author: "Галилео Галилеј" },
    { text: "Суштината на математиката не е да ги направи едноставните работи комплицирани, туку да ги направи комплицираните работи едноставни.", author: "С. Гудер" },
    { text: "Математиката е најмоќниот инструмент на знаењето.", author: "Рене Декарт" },
    { text: "Чистата математика е, на свој начин, поезија на логичките идеи.", author: "Алберт Ајнштајн" },
    { text: "Математиката е музика на разумот.", author: "Џејмс Џозеф Силвестер" },
    { text: "Без математика, нема ништо што можете да направите. Сè околу вас е математика. Сè околу вас се бројки.", author: "Шакунтала Деви" }
  ];

  // Pick a quote based on the day of the month to keep it stable for a day
  const quoteIndex = new Date().getDate() % quotes.length;
  const dailyQuote = quotes[quoteIndex];

  const stats = [
    { label: 'Лекции', value: '12', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Квизови', value: '48', icon: Play, color: 'text-pink-500', bg: 'bg-pink-50' },
    { label: 'Ученици', value: '32', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Успех', value: '84%', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  const quickActions = [
    { title: 'Нов Мате-Хут', desc: 'Започни квиз во живо со учениците', mode: AppMode.GAMES, icon: Zap, color: 'bg-pink-600' },
    { title: 'Мате-Бинго', desc: 'Брза игра со 3х3 табла', mode: AppMode.BINGO, icon: Sparkles, color: 'bg-amber-500' },
    { title: 'Мате - Трка', desc: 'Трка до целта низ математички полиња', mode: AppMode.BOARD_GAME, icon: Flag, color: 'bg-emerald-600' },
  ];

  const recentActivity = [
    { title: 'Собирање дропки', type: 'Лекција', time: 'Пред 2 часа', icon: '📚' },
    { title: 'Геометриски тела', type: 'Квиз', time: 'Пред 5 часа', icon: '🎮' },
    { title: 'Равенки со една непозната', type: 'Тест', time: 'Вчера', icon: '📝' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-10 relative isolate">
      {/* Background Watermark Logo - Adjusted for visibility */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-0 opacity-[0.12] select-none">
        <svg viewBox="0 0 512 512" className="w-[850px] h-[850px] transform -rotate-12 text-indigo-500">
          <path 
            d="M100 380 L200 180 L256 300 L312 180 L412 380" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="50" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <circle cx="256" cy="300" r="28" fill="none" stroke="currentColor" strokeWidth="16" />
          <circle cx="400" cy="180" r="48" fill="none" stroke="currentColor" strokeWidth="16" />
        </svg>
      </div>

      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black text-indigo-950 mb-2"
          >
            Добредојдовте во Мате-Ментор! 👋
          </motion.h1>
          <p className="text-slate-500 font-medium text-lg">
            Твојот дигитален кабинет е подготвен за денешните часови.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-bold text-slate-600">
              {new Date().toLocaleDateString('mk-MK', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
        </div>
      </header>

      {/* Inspirational Quote Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 md:p-8 rounded-[2.5rem] border border-indigo-100/50 relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm text-indigo-500 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="text-center md:text-left">
            <p className="text-indigo-900 font-serif italic text-lg md:text-xl leading-relaxed mb-2">
              "{dailyQuote.text}"
            </p>
            <p className="text-indigo-500 font-bold text-sm tracking-widest uppercase">
              — {dailyQuote.author}
            </p>
          </div>
        </div>
        {/* Decorative background circle */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-200/20 rounded-full blur-3xl"></div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-md border-2 border-slate-100 flex flex-col sm:flex-row items-center gap-3 md:gap-5 transition-all hover:shadow-2xl hover:border-indigo-200 group cursor-default"
          >
            <div className={`${stat.bg} w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner`}>
              <stat.icon className={`w-5 h-5 md:w-7 md:h-7 ${stat.color}`} />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-lg md:text-2xl font-black text-slate-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-black text-indigo-950 flex items-center gap-3">
            <Zap className="text-amber-500 fill-amber-500" /> Брзи акции
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, idx) => (
              <motion.button
                key={idx}
                whileHover={{ y: -12, transition: { duration: 0.2 } }}
                onClick={() => setMode(action.mode)}
                className="bg-white p-8 rounded-[2.5rem] shadow-md border-2 border-slate-100 text-left group transition-all hover:shadow-2xl hover:border-indigo-200 relative overflow-hidden"
              >
                <div className={`${action.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{action.title}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{action.desc}</p>
                {/* Subtle 3D bottom highlight */}
                <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-100 group-hover:bg-indigo-100 transition-colors"></div>
              </motion.button>
            ))}
          </div>

          {/* Analytics Preview Card */}
          <div className="bg-indigo-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="text-indigo-300" />
                <span className="text-sm font-bold uppercase tracking-widest text-indigo-300">Аналитика на постигањата</span>
              </div>
              <h3 className="text-3xl font-black mb-4">Детални статистички извештаи</h3>
              <p className="text-indigo-200 text-lg font-medium max-w-xl leading-relaxed mb-8">
                Следи го напредокот на секој ученик и секое одделение преку автоматски генерирани графикони и извештаи.
              </p>
              <button 
                onClick={() => setMode(AppMode.ANALYTICS)}
                className="bg-white text-indigo-900 hover:bg-indigo-50 px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg"
              >
                Отвори аналитика <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 blur-[80px] rounded-full -ml-20 -mb-20"></div>
          </div>
        </div>

        {/* Recent Activity Sidebar */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-indigo-950 flex items-center gap-3">
            <Clock className="text-slate-400" /> Последна активност
          </h2>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
            {recentActivity.map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 group cursor-pointer">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-2xl group-hover:bg-indigo-50 transition-colors">
                  {item.icon}
                </div>
                <div className="flex-1 border-b border-slate-50 pb-4 group-last:border-0">
                  <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.type}</span>
                    <span className="text-xs font-medium text-slate-400">{item.time}</span>
                  </div>
                </div>
              </div>
            ))}
            <button className="w-full py-4 text-indigo-600 font-bold text-sm hover:bg-indigo-50 rounded-xl transition-all">
              Види ја целата историја
            </button>
          </div>

          {/* Tip of the day */}
          <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-bold text-amber-700 uppercase tracking-wider">Совет на денот</span>
            </div>
            <p className="text-amber-900 font-medium leading-relaxed">
              Користи го "AI Визуелизаторот" за да им помогнеш на учениците да ги разберат апстрактните геометриски концепти преку слики.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
