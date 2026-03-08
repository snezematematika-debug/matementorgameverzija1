
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
  Users
} from 'lucide-react';
import { AppMode } from '../types';

interface DashboardProps {
  setMode: (mode: AppMode) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setMode }) => {
  const stats = [
    { label: 'Генерирани лекции', value: '12', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Одиграни квизови', value: '48', icon: Play, color: 'text-pink-500', bg: 'bg-pink-50' },
    { label: 'Активни ученици', value: '32', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Успешност', value: '84%', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  const quickActions = [
    { title: 'Нов Мате-Хут', desc: 'Започни квиз во живо со учениците', mode: AppMode.GAMES, icon: Zap, color: 'bg-pink-600' },
    { title: 'Мате-Бинго', desc: 'Брза игра со 3х3 табла', mode: AppMode.BINGO, icon: Sparkles, color: 'bg-amber-500' },
    { title: 'GeoGebra', desc: 'Интерактивна геометриска табла', mode: AppMode.GEOGEBRA, icon: Sparkles, color: 'bg-blue-600' },
  ];

  const recentActivity = [
    { title: 'Собирање дропки', type: 'Лекција', time: 'Пред 2 часа', icon: '📚' },
    { title: 'Геометриски тела', type: 'Квиз', time: 'Пред 5 часа', icon: '🎮' },
    { title: 'Равенки со една непозната', type: 'Тест', time: 'Вчера', icon: '📝' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-10">
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5"
          >
            <div className={`${stat.bg} w-14 h-14 rounded-2xl flex items-center justify-center`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
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
                whileHover={{ y: -5 }}
                onClick={() => setMode(action.mode)}
                className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 text-left group transition-all hover:shadow-xl hover:border-indigo-100"
              >
                <div className={`${action.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{action.title}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{action.desc}</p>
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
              <h3 className="text-3xl font-black mb-4">Наскоро: Детални статистички извештаи</h3>
              <p className="text-indigo-200 text-lg font-medium max-w-xl leading-relaxed mb-8">
                Следи го напредокот на секој ученик и секое одделение преку автоматски генерирани графикони и извештаи.
              </p>
              <button 
                onClick={() => setMode(AppMode.ANALYTICS)}
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 border border-white/10"
              >
                Дознај повеќе <ArrowRight className="w-5 h-5" />
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
