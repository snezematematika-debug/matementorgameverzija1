import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Unlock, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  Play, 
  Info, 
  CheckCircle2, 
  XCircle, 
  KeyRound,
  Users,
  QrCode,
  ArrowRight,
  Loader2,
  LogOut,
  Sparkles
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { db } from '../services/firebase';
import { ref, set, onValue, update, remove, get } from "firebase/database";
import { generateMateSafeTasks } from '../services/geminiService';
import { GradeLevel, GameState } from '../types';
import Loading from './Loading';

interface Task {
  question: string;
  answer: number;
}

interface MateSafeProps {
  grade: GradeLevel;
  initialRole?: 'TEACHER' | 'STUDENT' | null;
  onBack: () => void;
}

const MateSafe: React.FC<MateSafeProps> = ({ grade, initialRole = null, onBack }) => {
  const [role, setRole] = useState<'TEACHER' | 'STUDENT' | null>(initialRole);
  const [pinInput, setPinInput] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('pin') || '';
  });
  const [playerName, setPlayerName] = useState(() => sessionStorage.getItem('matesafe_player_name') || '');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  
  // Local game state for student
  const [userAnswers, setUserAnswers] = useState<string[]>(['', '', '', '', '']);
  const [attempts, setAttempts] = useState(0);
  const [localStatus, setLocalStatus] = useState<'PLAYING' | 'SUCCESS' | 'FAILED'>('PLAYING');
  const [wrongIndices, setWrongIndices] = useState<number[]>([]);

  // Initialize Player ID
  useEffect(() => {
    const savedId = sessionStorage.getItem('matesafe_player_id');
    if (savedId) {
      setPlayerId(savedId);
    } else {
      const newId = 'p_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('matesafe_player_id', newId);
      setPlayerId(newId);
    }
  }, []);

  // Listen for Game State
  useEffect(() => {
    const activePin = gameState?.pin || pinInput;
    if (!activePin || activePin.length < 6 || !role) return;

    const roomRef = ref(db, `games/${activePin}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const playersObj = data.players || {};
        const playersArray = Object.entries(playersObj).map(([id, p]: [string, any]) => ({
          id,
          ...p
        }));

        setGameState(prev => ({
          ...data,
          players: playersArray
        }));

        if (role === 'STUDENT' && playerId) {
          const me = playersArray.find(p => p.id === playerId);
          if (me) {
            if (!playerName) setPlayerName(me.name);
            setIsJoined(true);
          }
        }
      } else if (role === 'STUDENT' && isJoined) {
        setGameState(null);
        setRole(null);
        setError('Играта беше завршена од наставникот.');
      }
    });

    return () => unsubscribe();
  }, [pinInput, role, playerId, isJoined]);

  // Auto-join if PIN is in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlPin = urlParams.get('pin');
    if (urlPin && playerName && !isJoined && role === 'STUDENT' && playerId) {
      handleJoinGame();
    }
  }, [playerName, isJoined, role, playerId]);

  const generatePin = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleCreateGame = async () => {
    if (!selectedTopic) return;
    setLoading(true);
    setError(null);
    try {
      const data = await generateMateSafeTasks(selectedTopic, grade);
      const pin = generatePin();
      
      const newGameState: any = {
        pin,
        topic: selectedTopic,
        type: 'MATE_SAFE',
        status: 'WAITING',
        content: { tasks: data.tasks },
        createdAt: Date.now(),
        players: {}
      };
      
      await set(ref(db, `games/${pin}`), newGameState);
      
      setGameState({
        ...newGameState,
        players: []
      });
      setPinInput(pin);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!pinInput || !playerName || !playerId) return;
    setLoading(true);
    setError(null);
    try {
      const roomRef = ref(db, `games/${pinInput}`);
      const snapshot = await get(roomRef);
      if (!snapshot.exists()) {
        setError('Невалиден PIN код.');
        setLoading(false);
        return;
      }
      
      const playerRef = ref(db, `games/${pinInput}/players/${playerId}`);
      await update(playerRef, {
        name: playerName,
        status: 'IN_PROGRESS',
        attempts: 0,
        joinedAt: Date.now()
      });
      
      setIsJoined(true);
      setLoading(false);
      sessionStorage.setItem('matesafe_player_name', playerName);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleCheck = async () => {
    if (!gameState?.content?.tasks) return;
    const tasks = gameState.content.tasks;
    const newWrongIndices: number[] = [];
    
    tasks.forEach((task: Task, index: number) => {
      if (parseInt(userAnswers[index]) !== task.answer) {
        newWrongIndices.push(index);
      }
    });

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setWrongIndices(newWrongIndices);

    let newStatus: 'PLAYING' | 'SUCCESS' | 'FAILED' = 'PLAYING';
    if (newWrongIndices.length === 0) {
      newStatus = 'SUCCESS';
      setLocalStatus('SUCCESS');
    } else if (nextAttempts >= 3) {
      newStatus = 'FAILED';
      setLocalStatus('FAILED');
    }

    // Update status in Firebase
    if (gameState.pin && playerId) {
      await update(ref(db, `games/${gameState.pin}/players/${playerId}`), {
        status: newStatus === 'SUCCESS' ? 'UNLOCKED' : (newStatus === 'FAILED' ? 'LOCKED' : 'IN_PROGRESS'),
        attempts: nextAttempts
      });
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = value;
    setUserAnswers(newAnswers);
    if (wrongIndices.includes(index)) {
      setWrongIndices(wrongIndices.filter(i => i !== index));
    }
  };

  const closeRoom = async () => {
    if (gameState?.pin) {
      await remove(ref(db, `games/${gameState.pin}`));
    }
    setGameState(null);
    setRole(null);
  };

  if (loading) return <Loading message="Генерирам задачи за вашиот сеф..." />;

  if (!role) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 text-white rounded-3xl mb-6 shadow-xl shadow-indigo-200">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-black text-indigo-900 tracking-tight mb-4">Мате-сеф! 🔐</h1>
          <p className="text-slate-500 text-lg font-medium">Отклучи го сефот со решавање на математички задачи.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button
            onClick={() => setRole('TEACHER')}
            className="group bg-white p-10 rounded-[2.5rem] shadow-xl border-2 border-transparent hover:border-indigo-500 transition-all duration-500 text-left"
          >
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-indigo-900 mb-2">Креирај Предизвик</h2>
            <p className="text-slate-500 font-medium">Генерирај сеф за целата училница.</p>
          </button>

          <button
            onClick={() => setRole('STUDENT')}
            className="group bg-white p-10 rounded-[2.5rem] shadow-xl border-2 border-transparent hover:border-emerald-500 transition-all duration-500 text-left"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-emerald-900 mb-2">Приклучи се</h2>
            <p className="text-slate-500 font-medium">Внеси PIN и отклучи го сефот.</p>
          </button>
        </div>
        
        <div className="mt-12 text-center">
          <button onClick={onBack} className="text-slate-400 hover:text-indigo-600 font-bold transition-colors">
            ← Назад во менито
          </button>
        </div>
      </div>
    );
  }

  if (role === 'TEACHER' && !gameState) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100">
        <h2 className="text-3xl font-black text-indigo-900 mb-8 flex items-center gap-3">
          <Sparkles className="text-indigo-500" /> Поставки за Мате-сеф
        </h2>
        
        <div className="space-y-8">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Тема за сефот</label>
            <input
              type="text"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              placeholder="пр. Линеарни равенки, Проценти..."
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-medium"
            />
          </div>

          <button
            onClick={handleCreateGame}
            disabled={loading || !selectedTopic}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
            ГЕНЕРИРАЈ СЕФ ЗА УЧИЛНИЦАТА
          </button>

          <button onClick={() => setRole(null)} className="w-full text-slate-400 font-bold hover:text-indigo-600 transition-colors">
            Откажи
          </button>
        </div>
      </div>
    );
  }

  if (role === 'STUDENT' && !isJoined) {
    const urlParams = new URLSearchParams(window.location.search);
    const hasUrlPin = !!urlParams.get('pin');

    return (
      <div className="max-w-md mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 text-center">
        <h2 className="text-4xl font-black text-emerald-900 mb-8">Мате-сеф! 🔐</h2>
        
        <div className="space-y-6">
          {hasUrlPin ? (
            <div className="bg-emerald-50 p-6 rounded-3xl border-2 border-emerald-100 mb-4">
              <p className="text-emerald-600 font-bold uppercase tracking-widest text-xs mb-1">Приклучување на игра</p>
              <p className="text-3xl font-black text-emerald-900 tracking-widest">{pinInput}</p>
            </div>
          ) : (
            <input
              type="text"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="Внеси PIN код"
              className="w-full p-6 text-center text-3xl font-black tracking-[0.5em] bg-slate-50 border-4 border-slate-100 rounded-3xl focus:border-emerald-500 focus:ring-0 transition-all placeholder:tracking-normal placeholder:text-lg"
            />
          )}
          
          <input
            type="text"
            value={playerName}
            autoFocus={hasUrlPin}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Твоето име"
            className="w-full p-5 text-center text-xl font-bold bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:ring-0 transition-all"
          />

          <button
            onClick={handleJoinGame}
            disabled={loading || pinInput.length < 6 || !playerName}
            className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 transition-all"
          >
            ВЛЕЗИ ВО ИГРАТА!
          </button>

          {error && <p className="text-red-500 font-bold bg-red-50 p-3 rounded-xl">{error}</p>}

          <button onClick={() => setRole(null)} className="text-slate-400 font-bold hover:text-emerald-600 transition-colors">
            Откажи
          </button>
        </div>
      </div>
    );
  }

  // --- TEACHER WAITING ROOM ---
  if (role === 'TEACHER' && gameState?.status === 'WAITING') {
    const joinUrl = `${window.location.origin}/?pin=${gameState.pin}&type=MATE_SAFE`;

    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-indigo-900 text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          
          <button 
            onClick={closeRoom}
            className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all z-20 group"
          >
            <XCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left flex-1">
              <p className="text-indigo-300 font-bold uppercase tracking-widest mb-2">Приклучи се на Мате-сеф</p>
              <h2 className="text-8xl font-black tracking-tighter mb-4">{gameState.pin}</h2>
              <div className="flex items-center gap-2 text-indigo-200 font-medium bg-white/10 px-4 py-2 rounded-xl inline-flex">
                <Users className="w-5 h-5" />
                <span>{gameState.players.length} ученици се приклучија</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="bg-white p-4 rounded-3xl shadow-2xl border-4 border-indigo-400/30">
                <QRCodeCanvas 
                  value={joinUrl} 
                  size={180}
                  level="H"
                  includeMargin={true}
                />
                <p className="text-indigo-900 text-[10px] font-black text-center mt-2 uppercase tracking-tighter">Скенирај за влез</p>
              </div>
              
              <button
                onClick={async () => {
                  await update(ref(db, `games/${gameState.pin}`), { status: 'PLAYING' });
                }}
                disabled={gameState.players.length === 0}
                className="px-12 py-6 bg-white text-indigo-900 rounded-3xl font-black text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
              >
                ЗАПОЧНИ <ArrowRight className="w-8 h-8" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <AnimatePresence>
            {gameState.players.map((player, idx) => (
              <motion.div
                key={player.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-4 rounded-2xl shadow-md border border-slate-100 text-center font-bold text-indigo-900 truncate"
              >
                {player.name}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // --- TEACHER MONITORING ---
  if (role === 'TEACHER' && gameState?.status === 'PLAYING') {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-indigo-900">Мониторинг: {gameState.topic}</h2>
            <p className="text-slate-500">Следете го напредокот на учениците во реално време.</p>
          </div>
          <button 
            onClick={closeRoom}
            className="px-6 py-3 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200 transition-all flex items-center gap-2"
          >
            <LogOut size={18} /> Заврши игра
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gameState.players.map((player) => (
            <div key={player.id} className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{player.name}</h3>
                <p className="text-sm text-slate-500">Обиди: {player.attempts || 0}/3</p>
              </div>
              <div className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${
                player.status === 'UNLOCKED' ? 'bg-emerald-100 text-emerald-600' :
                player.status === 'LOCKED' ? 'bg-red-100 text-red-600' :
                'bg-amber-100 text-amber-600'
              }`}>
                {player.status === 'UNLOCKED' ? 'Отклучено' : 
                 player.status === 'LOCKED' ? 'Заклучено' : 'Во тек'}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- STUDENT PLAYING ---
  if (role === 'STUDENT' && isJoined && gameState?.status === 'WAITING') {
    return (
      <div className="max-w-md mx-auto h-[70vh] bg-indigo-600 rounded-[3rem] flex flex-col items-center justify-center text-center p-10 text-white shadow-2xl">
        <Loader2 className="w-20 h-20 animate-spin mb-8 opacity-50" />
        <h2 className="text-4xl font-black mb-4">Подготви се!</h2>
        <p className="text-xl font-medium opacity-80">Чекаме наставникот да ја започне играта...</p>
      </div>
    );
  }

  if (role === 'STUDENT' && isJoined && gameState?.status === 'PLAYING') {
    const tasks = gameState.content?.tasks || [];

    if (tasks.length === 0) {
      return (
        <div className="max-w-md mx-auto h-[70vh] bg-indigo-600 rounded-[3rem] flex flex-col items-center justify-center text-center p-10 text-white shadow-2xl">
          <Loader2 className="w-20 h-20 animate-spin mb-8 opacity-50" />
          <h2 className="text-4xl font-black mb-4">Се вчитуваат задачите...</h2>
          <p className="text-xl font-medium opacity-80">Ве молиме почекајте момент.</p>
        </div>
      );
    }

    if (localStatus === 'SUCCESS') {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 py-12 max-w-4xl mx-auto"
        >
          <motion.div
            animate={{ rotateY: [0, 180, 360], scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="w-32 h-32 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-100"
          >
            <Unlock size={64} />
          </motion.div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-slate-800">ЧЕСТИТКИ!</h2>
            <p className="text-xl text-slate-600">Успешно го отклучивте сефот!</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold mb-4">
              <CheckCircle2 size={20} /> Точна шифра:
            </div>
            <div className="flex justify-center gap-3">
              {tasks.map((t: Task, i: number) => (
                <div key={i} className="w-10 h-12 bg-white border-2 border-emerald-200 rounded-lg flex items-center justify-center font-mono font-bold text-emerald-600">
                  {t.answer}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      );
    }

    if (localStatus === 'FAILED') {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 py-12 max-w-4xl mx-auto"
        >
          <div className="w-32 h-32 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-red-100">
            <ShieldAlert size={64} />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-slate-800">СЕФОТ Е ЗАКЛУЧЕН</h2>
            <p className="text-xl text-slate-600">Ги искористивте сите 3 обиди.</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-md mx-auto">
            <p className="text-slate-500 text-sm mb-4">Точната шифра беше:</p>
            <div className="flex justify-center gap-3">
              {tasks.map((t: Task, i: number) => (
                <div key={i} className="w-10 h-12 bg-white border-2 border-slate-200 rounded-lg flex items-center justify-center font-mono font-bold text-slate-400">
                  {t.answer}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Мате-сеф: {gameState.topic}</h2>
              <p className="text-slate-500">Обид {attempts + 1} од 3</p>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${i < attempts ? 'bg-red-500' : 'bg-slate-200'}`} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {tasks.map((task: Task, index: number) => (
                <motion.div
                  key={index}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    wrongIndices.includes(index) ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-white border-slate-100 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold ${
                      wrongIndices.includes(index) ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'
                    }`}>
                      {index + 1}
                    </div>
                    <p className="text-slate-700 font-medium pt-1">{task.question}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-slate-800 rounded-[40px] p-8 shadow-2xl border-8 border-slate-700 relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-64 h-64 border-8 border-slate-700 rounded-full opacity-20" />
              <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-8">
                <div className="text-center">
                  <Lock className="mx-auto text-slate-400 mb-2" size={48} />
                  <h3 className="text-slate-300 font-mono tracking-widest uppercase text-sm">Внесете ја шифрата</h3>
                </div>
                <div className="flex gap-2">
                  {userAnswers.map((answer, index) => (
                    <div key={index} className="flex flex-col items-center gap-2">
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        className={`w-12 h-16 text-center text-2xl font-mono font-bold rounded-xl border-2 outline-none transition-all ${
                          wrongIndices.includes(index)
                            ? 'bg-red-900/30 border-red-500 text-red-400 focus:ring-red-500'
                            : 'bg-slate-900 border-slate-600 text-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                        }`}
                        maxLength={4}
                      />
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Зад. {index + 1}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleCheck}
                  disabled={userAnswers.some(a => a === '')}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                >
                  <KeyRound size={20} /> ОТКЛУЧИ СЕФ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Се вчитува...</p>
      </div>
    </div>
  );
};

export default MateSafe;
