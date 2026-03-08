
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Users, 
  Timer, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Play, 
  LogOut,
  BarChart3,
  Medal,
  ChevronRight,
  Loader2,
  Sparkles,
  QrCode,
  Lock,
  Unlock,
  Zap
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { db } from '../services/firebase';
import { ref, set, onValue, update, remove, get } from "firebase/database";
import { generateGameContent } from '../services/geminiService';
import { GameState, GradeLevel } from '../types';
import FormattedText from './FormattedText';

interface MateBingoProps {
  grade: GradeLevel;
  initialRole?: 'TEACHER' | 'STUDENT' | null;
  onBack: () => void;
}

const MateBingo: React.FC<MateBingoProps> = ({ grade, initialRole = null, onBack }) => {
  const [role, setRole] = useState<'TEACHER' | 'STUDENT' | null>(initialRole);
  const [pinInput, setPinInput] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('pin') || sessionStorage.getItem('matebingo_pin') || '';
  });
  const [playerName, setPlayerName] = useState(() => sessionStorage.getItem('matebingo_player_name') || '');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('');
  
  // Student specific state
  const [studentProgress, setStudentProgress] = useState<number[]>(new Array(9).fill(0)); // 0: locked, 1: open, 2: completed
  const [currentFieldIndex, setCurrentFieldIndex] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [answerInput, setAnswerInput] = useState('');
  const [isCorrectFeedback, setIsCorrectFeedback] = useState<boolean | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [localQuestionIndex, setLocalQuestionIndex] = useState(0);

  // Initialize Player ID
  useEffect(() => {
    const savedId = sessionStorage.getItem('matebingo_player_id');
    if (savedId) {
      setPlayerId(savedId);
    } else {
      const newId = 'pb_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('matebingo_player_id', newId);
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
        })).sort((a, b) => (b.score || 0) - (a.score || 0));

        setGameState(prev => ({
          ...data,
          players: playersArray
        }));

        if (role === 'STUDENT' && playerId) {
          const me = playersArray.find(p => p.id === playerId);
          if (me) {
            if (!playerName) setPlayerName(me.name);
            setIsJoined(true);
            
            // Sync progress from server if needed
            if (me.progress) setStudentProgress(me.progress);
            if (me.currentField !== undefined) setCurrentFieldIndex(me.currentField);
            if (me.attempts !== undefined) setAttempts(me.attempts);
            if (me.localQuestionIndex !== undefined) setLocalQuestionIndex(me.localQuestionIndex);
          }
        }
      } else if (role === 'STUDENT') {
        setGameState(null);
        setRole(null);
        setError('Играта беше завршена.');
      }
    });

    return () => unsubscribe();
  }, [pinInput, role, gameState?.pin, playerId, playerName]);

  const generatePin = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleCreateGame = async () => {
    if (!selectedTopic) return;
    setLoading(true);
    setError(null);
    try {
      const content = await generateGameContent(selectedTopic, 'BINGO', grade);
      if (!content || !content.questions) {
        throw new Error("Неуспешно генерирање на прашања. Ве молиме обидете се повторно.");
      }
      const pin = generatePin();
      
      const newGameState: GameState = {
        pin,
        topic: selectedTopic,
        type: 'BINGO',
        status: 'WAITING',
        players: [],
        content,
        createdAt: Date.now()
      };
      
      await set(ref(db, `games/${pin}`), {
        ...newGameState,
        players: {}
      });
      
      setGameState(newGameState);
      setPinInput(pin);
      sessionStorage.setItem('matebingo_pin', pin);
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
      const roomData = snapshot.val();
      if (roomData.status === 'FINISHED') {
        setError('Оваа игра веќе заврши.');
        setLoading(false);
        return;
      }

      const playerRef = ref(db, `games/${pinInput}/players/${playerId}`);
      const playerSnapshot = await get(playerRef);
      
      if (!playerSnapshot.exists()) {
        const initialProgress = new Array(9).fill(0);
        initialProgress[2] = 1; // Top right open (index 2 in 0-8 grid)
        
        await update(playerRef, {
          name: playerName,
          score: 0,
          progress: initialProgress,
          currentField: 2,
          attempts: 0,
          localQuestionIndex: 0,
          joinedAt: Date.now()
        });
      }
      
      setIsJoined(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const startGame = async () => {
    if (!gameState?.pin) return;
    await update(ref(db, `games/${gameState.pin}`), {
      status: 'PLAYING',
      startTime: Date.now()
    });
  };

  const submitBingoAnswer = async () => {
    if (!gameState?.pin || !playerId || currentFieldIndex === null || !answerInput) return;
    
    const questions = gameState.content.questions;
    const currentQuestion = questions[localQuestionIndex % questions.length];
    
    const isCorrect = answerInput.trim().toLowerCase() === currentQuestion.answer.trim().toLowerCase();
    
    if (isCorrect) {
      setIsCorrectFeedback(true);
      
      // Calculate points
      const basePoints = 1000;
      const speedBonus = 200; // Simplified for now
      const totalPoints = basePoints + speedBonus;
      
      const newProgress = [...studentProgress];
      newProgress[currentFieldIndex] = 2; // Completed
      
      // Find next random field
      const lockedIndices = newProgress.map((p, i) => p === 0 ? i : -1).filter(i => i !== -1);
      let nextField = null;
      if (lockedIndices.length > 0) {
        nextField = lockedIndices[Math.floor(Math.random() * lockedIndices.length)];
        newProgress[nextField] = 1; // Open
      }
      
      const playerRef = ref(db, `games/${gameState.pin}/players/${playerId}`);
      const playerSnap = await get(playerRef);
      const currentScore = playerSnap.val()?.score || 0;
      
      const updates: any = {
        score: currentScore + totalPoints,
        progress: newProgress,
        currentField: nextField,
        attempts: 0,
        localQuestionIndex: localQuestionIndex + 1
      };
      
      // Check win condition
      if (newProgress.every(p => p === 2)) {
        await update(ref(db, `games/${gameState.pin}`), {
          status: 'FINISHED',
          winnerId: playerId,
          winnerName: playerName
        });
      } else {
        await update(playerRef, updates);
      }
      
      setTimeout(() => {
        setIsCorrectFeedback(null);
        setAnswerInput('');
      }, 1500);
      
    } else {
      setIsCorrectFeedback(false);
      const newAttempts = attempts + 1;
      
      const playerRef = ref(db, `games/${gameState.pin}/players/${playerId}`);
      
      if (newAttempts >= 3) {
        // Reset attempts and give new question for same field
        await update(playerRef, {
          attempts: 0,
          localQuestionIndex: localQuestionIndex + 1
        });
        setAttempts(0);
        setLocalQuestionIndex(prev => prev + 1);
      } else {
        await update(playerRef, {
          attempts: newAttempts
        });
        setAttempts(newAttempts);
      }
      
      setTimeout(() => {
        setIsCorrectFeedback(null);
        setAnswerInput('');
      }, 1500);
    }
  };

  const closeRoom = async () => {
    if (gameState?.pin) {
      await remove(ref(db, `games/${gameState.pin}`));
    }
    setGameState(null);
    setRole(null);
    setPinInput('');
    setStudentProgress(new Array(9).fill(0));
    setCurrentFieldIndex(null);
    setAttempts(0);
    setAnswerInput('');
    setIsJoined(false);
    sessionStorage.removeItem('matebingo_pin');
    sessionStorage.removeItem('matebingo_player_name');
  };

  const resetToStart = async () => {
    if (role === 'TEACHER' && gameState?.pin) {
      await remove(ref(db, `games/${gameState.pin}`));
    }
    setGameState(null);
    setPinInput('');
    setStudentProgress(new Array(9).fill(0));
    setCurrentFieldIndex(null);
    setAttempts(0);
    setAnswerInput('');
    setIsJoined(false);
    sessionStorage.removeItem('matebingo_pin');
  };

  // --- RENDER HELPERS ---

  if (!role) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500 text-white rounded-3xl mb-6 shadow-xl shadow-amber-200">
            <Zap className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-black text-indigo-900 tracking-tight mb-4">Мате-Бинго! 🎯</h1>
          <p className="text-slate-500 text-lg font-medium">Брзина, точност и малку среќа. Кој прв ќе ја пополни таблата?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button
            onClick={() => setRole('TEACHER')}
            className="group bg-white p-10 rounded-[2.5rem] shadow-xl border-2 border-transparent hover:border-amber-500 transition-all duration-500 text-left"
          >
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-indigo-900 mb-2">Креирај Игра</h2>
            <p className="text-slate-500 font-medium">Генерирај Бинго табла за твоите ученици.</p>
          </button>

          <button
            onClick={() => setRole('STUDENT')}
            className="group bg-white p-10 rounded-[2.5rem] shadow-xl border-2 border-transparent hover:border-blue-500 transition-all duration-500 text-left"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-indigo-900 mb-2">Приклучи се</h2>
            <p className="text-slate-500 font-medium">Внеси PIN и започни со решавање.</p>
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
          <Zap className="text-amber-500" /> Поставки за Мате-Бинго
        </h2>
        
        <div className="space-y-8">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Тема за Бинго</label>
            <input
              type="text"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              placeholder="пр. Равенки, Плоштина на круг..."
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-amber-500 focus:ring-0 transition-all font-medium"
            />
          </div>

          <button
            onClick={handleCreateGame}
            disabled={loading || !selectedTopic}
            className="w-full py-5 bg-amber-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-amber-200 hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Play className="w-6 h-6" />}
            ГЕНЕРИРАЈ БИНГО ТАБЛА
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-3">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <button onClick={() => setRole(null)} className="w-full text-slate-400 font-bold hover:text-indigo-600 transition-colors">
            Откажи
          </button>
        </div>
      </div>
    );
  }

  if (role === 'STUDENT' && (!gameState || !isJoined)) {
    const urlParams = new URLSearchParams(window.location.search);
    const hasUrlPin = !!urlParams.get('pin');

    return (
      <div className="max-w-md mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 text-center">
        <h2 className="text-4xl font-black text-blue-900 mb-8">Мате-Бинго! 🎯</h2>
        
        <div className="space-y-6">
          {hasUrlPin ? (
            <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100 mb-4">
              <p className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-1">Приклучување на игра</p>
              <p className="text-3xl font-black text-blue-900 tracking-widest">{pinInput}</p>
            </div>
          ) : (
            <input
              type="text"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="Внеси PIN код"
              className="w-full p-6 text-center text-3xl font-black tracking-[0.5em] bg-slate-50 border-4 border-slate-100 rounded-3xl focus:border-blue-500 focus:ring-0 transition-all placeholder:tracking-normal placeholder:text-lg"
            />
          )}
          
          <input
            type="text"
            value={playerName}
            autoFocus={hasUrlPin}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Твоето име"
            className="w-full p-5 text-center text-xl font-bold bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:ring-0 transition-all"
          />

          <button
            onClick={handleJoinGame}
            disabled={loading || pinInput.length < 6 || !playerName}
            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            ВЛЕЗИ ВО ИГРАТА!
          </button>

          {error && <p className="text-red-500 font-bold bg-red-50 p-3 rounded-xl">{error}</p>}

          <button onClick={() => setRole(null)} className="text-slate-400 font-bold hover:text-blue-600 transition-colors">
            Откажи
          </button>
        </div>
      </div>
    );
  }

  // --- GAME SCREENS ---

  if (gameState?.status === 'WAITING') {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-amber-500 text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left flex-1">
              <p className="text-amber-100 font-bold uppercase tracking-widest mb-2">Приклучи се на Мате-Бинго</p>
              <h2 className="text-8xl font-black tracking-tighter mb-4">{gameState.pin}</h2>
              <div className="flex items-center gap-2 text-amber-100 font-medium bg-white/10 px-4 py-2 rounded-xl inline-flex">
                <Users className="w-5 h-5" />
                <span>{gameState.players.length} ученици се приклучија</span>
              </div>
            </div>

            {role === 'TEACHER' && (
              <div className="flex flex-col items-center gap-6">
                <div className="bg-white p-4 rounded-3xl shadow-2xl border-4 border-amber-400/30">
                  <QRCodeCanvas value={`${window.location.origin}/?pin=${gameState.pin}&type=BINGO`} size={180} />
                </div>
                
                <button
                  onClick={startGame}
                  disabled={gameState.players.length === 0}
                  className="px-12 py-6 bg-white text-amber-600 rounded-3xl font-black text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
                >
                  ЗАПОЧНИ БИНГО <ArrowRight className="w-8 h-8" />
                </button>
              </div>
            )}

            {role === 'STUDENT' && (
              <div className="text-center bg-white/10 p-8 rounded-3xl backdrop-blur-md border border-white/10">
                <p className="text-xl font-bold mb-2">Здраво, {playerName}!</p>
                <p className="text-amber-100">Чекаме наставникот да ја започне играта...</p>
                <div className="mt-4 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {gameState.players.map((player, idx) => (
            <motion.div
              key={player.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-4 rounded-2xl shadow-md border border-slate-100 text-center font-bold text-amber-900 truncate"
            >
              {player.name}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (gameState?.status === 'PLAYING') {
    if (role === 'TEACHER') {
      return (
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div>
              <h2 className="text-2xl font-black text-indigo-900">Мате-Бинго: {gameState.topic}</h2>
              <p className="text-slate-500 font-medium">Следи го напредокот на учениците во реално време</p>
            </div>
            <div className="bg-amber-100 text-amber-700 px-6 py-3 rounded-2xl font-black text-xl">
              PIN: {gameState.pin}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {gameState.players.map((player) => (
              <div key={player.id} className="bg-white p-6 rounded-[2rem] shadow-md border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900 truncate max-w-[120px]">{player.name}</h3>
                  <span className="text-sm font-black text-amber-600">{player.score} поени</span>
                </div>
                <div className="grid grid-cols-3 gap-2 aspect-square">
                  {(player.progress || new Array(9).fill(0)).map((p: number, i: number) => (
                    <div 
                      key={i} 
                      className={`rounded-lg border-2 transition-all ${
                        p === 2 ? 'bg-emerald-500 border-emerald-400' : 
                        p === 1 ? 'bg-amber-400 border-amber-300 animate-pulse' : 
                        'bg-slate-100 border-slate-200'
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-8">
            <button onClick={closeRoom} className="text-slate-400 hover:text-red-500 font-bold flex items-center gap-2">
              <LogOut className="w-5 h-5" /> ПРЕКИНИ ИГРА
            </button>
          </div>
        </div>
      );
    }

    if (role === 'STUDENT') {
      const questions = gameState.content.questions;
      const currentQuestion = questions[localQuestionIndex % questions.length];

      return (
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Bingo Grid */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto aspect-square">
            {studentProgress.map((p, i) => (
              <motion.div
                key={i}
                animate={p === 1 ? { scale: [1, 1.05, 1], boxShadow: ["0px 0px 0px rgba(251, 191, 36, 0)", "0px 0px 20px rgba(251, 191, 36, 0.5)", "0px 0px 0px rgba(251, 191, 36, 0)"] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`rounded-2xl border-4 flex items-center justify-center text-2xl transition-all relative ${
                  p === 2 ? 'bg-emerald-500 border-emerald-400 text-white' : 
                  p === 1 ? 'bg-amber-400 border-amber-300 text-white shadow-lg' : 
                  'bg-slate-100 border-slate-200 text-slate-300'
                }`}
              >
                {p === 2 ? <CheckCircle2 className="w-8 h-8" /> : 
                 p === 1 ? <Sparkles className="w-8 h-8" /> : 
                 <Lock className="w-6 h-6 opacity-20" />}
                
                {p === 1 && (
                  <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg">
                    АКТИВНО
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Question Area */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={localQuestionIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 text-center"
            >
              <div className="mb-6">
                <span className="text-xs font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-full">
                  Поле {currentFieldIndex !== null ? currentFieldIndex + 1 : '?'}
                </span>
                <h3 className="text-2xl font-black text-indigo-900 mt-4 leading-tight">
                  <FormattedText text={currentQuestion.question} />
                </h3>
              </div>

              <div className="space-y-4 max-w-sm mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitBingoAnswer()}
                    placeholder="Внеси го твојот одговор..."
                    className={`w-full p-5 text-center text-xl font-bold bg-slate-50 border-2 rounded-2xl focus:ring-0 transition-all ${
                      isCorrectFeedback === true ? 'border-emerald-500 bg-emerald-50' : 
                      isCorrectFeedback === false ? 'border-rose-500 bg-rose-50' : 
                      'border-slate-100 focus:border-indigo-500'
                    }`}
                  />
                  {isCorrectFeedback !== null && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {isCorrectFeedback ? <CheckCircle2 className="text-emerald-500" /> : <XCircle className="text-rose-500" />}
                    </div>
                  )}
                </div>

                <button
                  onClick={submitBingoAnswer}
                  disabled={!answerInput || isCorrectFeedback !== null}
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  ПРОВЕРИ ОДГОВОР
                </button>

                <div className="flex justify-center gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-3 h-3 rounded-full transition-all ${i < attempts ? 'bg-rose-500 scale-125' : 'bg-slate-200'}`}
                    ></div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 font-medium">Обиди: {attempts}/3</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      );
    }
  }

  if (gameState?.status === 'FINISHED') {
    const sortedPlayers = [...gameState.players].sort((a, b) => (b.score || 0) - (a.score || 0));
    const winner = sortedPlayers[0];
    const isMe = role === 'STUDENT' && playerId === winner?.id;

    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-16 rounded-[4rem] shadow-2xl border border-slate-100 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600"></div>
          
          <div className="mb-12">
            <div className="w-32 h-32 bg-amber-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 rotate-12">
              <Trophy className="w-16 h-16 text-amber-600" />
            </div>
            <h2 className="text-5xl font-black text-indigo-900 mb-4">БИНГО! 🏆</h2>
            <p className="text-xl text-slate-500 font-medium">Играта заврши. Имаме победник!</p>
          </div>

          {/* Podium */}
          <div className="flex items-end justify-center gap-4 mb-16 h-64">
            {/* 2nd Place */}
            {sortedPlayers[1] && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center border-4 border-slate-200 shadow-lg">
                  <span className="text-2xl font-black text-slate-400">2</span>
                </div>
                <div className="bg-slate-200 w-32 h-32 rounded-t-3xl flex flex-col items-center justify-center p-4">
                  <span className="font-bold text-slate-700 truncate w-full">{sortedPlayers[1].name}</span>
                  <span className="text-xs font-black text-slate-500">{sortedPlayers[1].score}</span>
                </div>
              </div>
            )}

            {/* 1st Place */}
            <div className="flex flex-col items-center gap-3">
              <Sparkles className="text-amber-500 w-10 h-10 animate-bounce" />
              <div className="w-24 h-24 bg-amber-100 rounded-2xl flex items-center justify-center border-4 border-amber-400 shadow-xl">
                <span className="text-4xl font-black text-amber-600">1</span>
              </div>
              <div className="bg-amber-500 w-40 h-48 rounded-t-[2.5rem] flex flex-col items-center justify-center p-6 text-white shadow-2xl">
                <span className="text-xl font-black truncate w-full mb-1">{winner.name}</span>
                <span className="text-sm font-bold opacity-80">{winner.score} поени</span>
              </div>
            </div>

            {/* 3rd Place */}
            {sortedPlayers[2] && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center border-4 border-orange-100 shadow-md">
                  <span className="text-xl font-black text-orange-300">3</span>
                </div>
                <div className="bg-orange-100 w-28 h-24 rounded-t-2xl flex flex-col items-center justify-center p-4">
                  <span className="font-bold text-orange-800 truncate w-full">{sortedPlayers[2].name}</span>
                  <span className="text-xs font-black text-orange-600">{sortedPlayers[2].score}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {isMe ? (
              <div className="bg-emerald-50 text-emerald-700 p-6 rounded-3xl font-bold text-xl border border-emerald-100">
                🎉 ЧЕСТИТКИ! ТИ ПОБЕДИ! 🎉
              </div>
            ) : (
              <p className="text-slate-400 font-bold">Одлична игра на сите ученици!</p>
            )}
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {role === 'TEACHER' && (
                <button
                  onClick={resetToStart}
                  className="px-10 py-5 bg-amber-500 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-amber-600 transition-all flex items-center gap-2"
                >
                  <Play className="w-6 h-6" /> НОВА ИГРА
                </button>
              )}
              
              <button
                onClick={async () => {
                  if (role === 'TEACHER') await closeRoom();
                  onBack();
                }}
                className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition-all"
              >
                НАЗАД ВО МЕНИТО
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
};

export default MateBingo;
