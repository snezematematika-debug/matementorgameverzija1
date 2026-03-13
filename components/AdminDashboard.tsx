
import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  getRecentGenerations,
  getWeeklyQuotas,
  getDailyUsage
} from '../services/analyticsService';
import { getPendingTeachers, approveTeacher, rejectTeacher, PendingTeacher } from '../services/firebase';
import {
  LayoutDashboard,
  Activity,
  Clock,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  UserX,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AdminDashboard: React.FC = () => {
  const [recentGenerations, setRecentGenerations] = useState<any[]>([]);
  const [weeklyQuotas, setWeeklyQuotas] = useState<any[]>([]);
  const [dailyUsage, setDailyUsage] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [pendingTeachers, setPendingTeachers] = useState<PendingTeacher[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [recent, weekly, daily, pending] = await Promise.all([
      getRecentGenerations(20),
      getWeeklyQuotas(),
      getDailyUsage(),
      getPendingTeachers(),
    ]);
    setRecentGenerations(recent);
    setWeeklyQuotas(weekly);
    setDailyUsage(daily);
    setPendingTeachers(pending);
    setLoading(false);
  };

  const handleApprove = async (uid: string) => {
    setActionLoading(uid);
    await approveTeacher(uid);
    setPendingTeachers(prev => prev.filter(t => t.uid !== uid));
    setActionLoading(null);
  };

  const handleReject = async (uid: string) => {
    setActionLoading(uid);
    await rejectTeacher(uid);
    setPendingTeachers(prev => prev.filter(t => t.uid !== uid));
    setActionLoading(null);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getContentTypeData = () => {
    const counts: Record<string, number> = {};
    recentGenerations.forEach(gen => {
      counts[gen.contentType] = (counts[gen.contentType] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-slate-600 font-medium">Се вчитуваат податоците...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <LayoutDashboard className="text-indigo-600" />
              Аналитика на MateMentor
            </h1>
            <p className="text-slate-500 mt-1">Следење на користењето на AI и активностите на корисниците.</p>
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Освежи
          </button>
        </div>

        {/* Pending Teachers */}
        {pendingTeachers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold text-amber-800 flex items-center gap-2 mb-4">
              <Users className="w-5 h-5" />
              Барања за пристап ({pendingTeachers.length})
            </h2>
            <div className="space-y-3">
              {pendingTeachers.map(t => (
                <div key={t.uid} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-amber-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    {t.photoURL ? (
                      <img src={t.photoURL} alt={t.displayName} className="w-9 h-9 rounded-full border border-amber-200" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                        {t.displayName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{t.displayName}</p>
                      <p className="text-xs text-slate-500">{t.email}</p>
                      {t.registeredAt && (
                        <p className="text-[10px] text-slate-400">
                          {t.registeredAt.toLocaleDateString('mk-MK', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(t.uid)}
                      disabled={actionLoading === t.uid}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Одобри
                    </button>
                    <button
                      onClick={() => handleReject(t.uid)}
                      disabled={actionLoading === t.uid}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      <UserX className="w-3.5 h-3.5" /> Одбиј
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Activity className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-wider">Денес</span>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">Gemini API Повици</h3>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold text-slate-900">{dailyUsage}</span>
              <span className="text-slate-400 text-sm">/ 1500 (Free Limit)</span>
            </div>
            <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${dailyUsage > 1000 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                style={{ width: `${Math.min((dailyUsage / 1500) * 100, 100)}%` }}
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">Статус</span>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">Системски Статус</h3>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xl font-bold text-slate-900">Оперативен</span>
            </div>
            <p className="text-slate-400 text-xs mt-4">Сите сервиси работат нормално.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-50 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase tracking-wider">Внимание</span>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">Предупредувања</h3>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold text-slate-900">0</span>
            </div>
            <p className="text-slate-400 text-xs mt-4">Нема регистрирани грешки во последните 24 часа.</p>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Неделно користење на API
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyQuotas}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600" />
              Тип на генерирана содржина
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getContentTypeData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {getContentTypeData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {getContentTypeData().map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="capitalize">{entry.name.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Activity Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
        >
          <div className="p-6 border-bottom border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Последна активност
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Тип</th>
                  <th className="px-6 py-4 font-semibold">Тема</th>
                  <th className="px-6 py-4 font-semibold">Одделение</th>
                  <th className="px-6 py-4 font-semibold">Време</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentGenerations.map((gen) => (
                  <tr key={gen.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium capitalize">
                        {gen.contentType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-medium">{gen.topic}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{gen.grade}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {gen.timestamp?.toDate ? gen.timestamp.toDate().toLocaleString() : 'Пред малку'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
