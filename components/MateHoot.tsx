
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
  QrCode
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { db } from '../services/firebase';
import { ref, set, onValue, update, remove, get } from "firebase/database";
import { getGameContent } from '../services/contentService';
import { GameState, GradeLevel } from '../types';
import FormattedText from './FormattedText';

interface MateHootProps {
  grade: GradeLevel;
  initialRole?: 'TEACHER' | 'STUDENT' | null;
  onBack: () => void;
}

const COLORS = [
  { name: 'Red', bg: 'bg-rose-500', hover: 'hover:bg-rose-600', icon: '▲', shadow: 'shadow-rose-200' },
  { name: 'Blue', bg: 'bg-blue-500', hover: 'hover:bg-blue-600', icon: '◆', shadow: 'shadow-blue-200' },
  { name: 'Yellow', bg: 'bg-amber-400', hover: 'hover:bg-amber-500', icon: '●', shadow: 'shadow-amber-100' },
  { name: 'Green', bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600', icon: '■', shadow: 'shadow-emerald-200' },
];

const MateHoot: React.FC<MateHootProps> = ({ grade, initialRole = null, onBack }) => {
  const [role, setRole] = useState<'TEACHER' | 'STUDENT' | null>(initialRole);
  const [pinInput, setPinInput] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlPin = urlParams.get('pin');
    if (urlPin) return urlPin;
    return sessionStorage.getItem('matehoot_pin') || '';
  });
  const [playerName, setPlayerName] = useState(() => sessionStorage.getItem('matehoot_player_name') || '');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [lastAnswerResult, setLastAnswerResult] = useState<{ correct: boolean, points: number } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [isJoined, setIsJoined] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Player ID
  useEffect(() => {
    const savedId = sessionStorage.getItem('matehoot_player_id');
    if (savedId) {
      setPlayerId(savedId);
    } else {
      const newId = 'p_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('matehoot_player_id', newId);
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

        // Recover player name if already in room
        if (role === 'STUDENT' && playerId) {
          const me = playersArray.find(p => p.id === playerId);
          if (me) {
            if (!playerName) setPlayerName(me.name);
            setIsJoined(true);
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

  // Reset student state when question changes
  useEffect(() => {
    if (role === 'STUDENT' && gameState?.status === 'QUESTION') {
      setHasAnswered(false);
      setLastAnswerResult(null);
    }
  }, [gameState?.currentQuestionIndex, gameState?.status]);

  // Persist PIN and Name
  useEffect(() => {
    if (pinInput) sessionStorage.setItem('matehoot_pin', pinInput);
    if (playerName) sessionStorage.setItem('matehoot_player_name', playerName);
  }, [pinInput, playerName]);

  // Auto-join if PIN is in URL and name is available
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlPin = urlParams.get('pin');
    if (urlPin && playerName && !isJoined && role === 'STUDENT' && playerId) {
      handleJoinGame();
    }
  }, [playerName, isJoined, role, playerId]);

  // Timer Logic
  useEffect(() => {
    if (gameState?.status === 'QUESTION' && gameState.questionStartTime) {
      const duration = 30; // 30 seconds per question
      const elapsed = Math.floor((Date.now() - gameState.questionStartTime) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);

      if (remaining > 0) {
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              if (role === 'TEACHER') handleTimeUp();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else if (role === 'TEACHER') {
        handleTimeUp();
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState?.status, gameState?.currentQuestionIndex, gameState?.questionStartTime]);

  // Auto-advance when all players have answered
  useEffect(() => {
    if (role === 'TEACHER' && gameState?.status === 'QUESTION' && gameState.players.length > 0) {
      const answeredCount = gameState.players.filter(p => p.lastAnswer?.questionIndex === gameState.currentQuestionIndex).length;
      if (answeredCount === gameState.players.length) {
        handleTimeUp();
      }
    }
  }, [gameState?.players, gameState?.status, role, gameState?.pin, gameState?.currentQuestionIndex]);

  const handleTimeUp = async () => {
    if (!gameState?.pin) return;
    await update(ref(db, `games/${gameState.pin}`), {
      status: 'RESULT',
      showCorrectAnswer: true
    });
  };

  const generatePin = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleCreateGame = async () => {
    if (!selectedTopic) return;
    setLoading(true);
    setError(null);
    try {
      const content = await getGameContent(grade, selectedTopic, 'MATEHOOT');
      const pin = generatePin();
      
      const newGameState: GameState = {
        pin,
        topic: selectedTopic,
        type: 'MATEHOOT',
        status: 'WAITING',
        players: [],
        content,
        createdAt: Date.now(),
        currentQuestionIndex: 0
      };
      
      await set(ref(db, `games/${pin}`), {
        ...newGameState,
        players: {}
      });
      
      setGameState(newGameState);
      setPinInput(pin);
      sessionStorage.setItem('matehoot_pin', pin);
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
        setError('Овој квиз веќе заврши.');
        setLoading(false);
        return;
      }
      // If student joins late, they start with 0 points
      const playerRef = ref(db, `games/${pinInput}/players/${playerId}`);
      const playerSnapshot = await get(playerRef);
      
      if (!playerSnapshot.exists()) {
        await update(playerRef, {
          name: playerName,
          score: 0,
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
      status: 'QUESTION',
      currentQuestionIndex: 0,
      questionStartTime: Date.now(),
      showCorrectAnswer: false
    });
  };

  const nextStep = async () => {
    if (!gameState?.pin || isTransitioning) return;
    setIsTransitioning(true);
    const currentStatus = gameState.status;
    const currentIndex = gameState.currentQuestionIndex || 0;
    const totalQuestions = gameState.content.questions.length;

    try {
      if (currentStatus === 'RESULT') {
        await update(ref(db, `games/${gameState.pin}`), {
          status: 'LEADERBOARD'
        });
      } else if (currentStatus === 'LEADERBOARD') {
        if (currentIndex + 1 < totalQuestions) {
          await update(ref(db, `games/${gameState.pin}`), {
            status: 'QUESTION',
            currentQuestionIndex: currentIndex + 1,
            questionStartTime: Date.now(),
            showCorrectAnswer: false
          });
        } else {
          await update(ref(db, `games/${gameState.pin}`), {
            status: 'FINISHED'
          });
        }
      }
    } finally {
      setIsTransitioning(false);
    }
  };

  const submitAnswer = async (optionIndex: number) => {
    if (!gameState?.pin || !playerId || hasAnswered || gameState.status !== 'QUESTION') return;
    
    const question = gameState.content.questions[gameState.currentQuestionIndex || 0];
    const isCorrect = optionIndex === question.correctAnswerIndex;
    
    // Calculate points based on speed
    const duration = 30;
    const elapsed = Math.floor((Date.now() - (gameState.questionStartTime || 0)) / 1000);
    const speedBonus = Math.max(0, duration - elapsed) * 10;
    const points = isCorrect ? 1000 + speedBonus : 0;

    setHasAnswered(true);
    setLastAnswerResult({ correct: isCorrect, points });

    // Update player score in Firebase
    const playerRef = ref(db, `games/${gameState.pin}/players/${playerId}`);
    const snapshot = await get(playerRef);
    const currentScore = snapshot.val()?.score || 0;

    await update(playerRef, {
      score: currentScore + points,
      lastAnswer: {
        optionIndex,
        isCorrect,
        points,
        timestamp: Date.now(),
        questionIndex: gameState.currentQuestionIndex || 0
      }
    });
  };

  const closeRoom = async () => {
    if (gameState?.pin) {
      await remove(ref(db, `games/${gameState.pin}`));
    }
    setGameState(null);
    setRole(null);
    sessionStorage.removeItem('matehoot_pin');
    sessionStorage.removeItem('matehoot_player_name');
  };

  // --- RENDER HELPERS ---

  if (!role) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 text-white rounded-3xl mb-6 shadow-xl shadow-indigo-200">
            <Sparkles className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-black text-indigo-900 tracking-tight mb-4">Мате-Хут! 🚀</h1>
          <p className="text-slate-500 text-lg font-medium">Најзабавниот начин да ја провериш твојата математичка вештина.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Teacher Card */}
          <button
            onClick={() => setRole('TEACHER')}
            className="group bg-white p-10 rounded-[2.5rem] shadow-xl border-2 border-transparent hover:border-indigo-500 transition-all duration-500 text-left"
          >
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-indigo-900 mb-2">Креирај Игра</h2>
            <p className="text-slate-500 font-medium">Генерирај квиз во живо за целата училница.</p>
          </button>

          {/* Student Card */}
          <button
            onClick={() => setRole('STUDENT')}
            className="group bg-white p-10 rounded-[2.5rem] shadow-xl border-2 border-transparent hover:border-pink-500 transition-all duration-500 text-left"
          >
            <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-pink-600" />
            </div>
            <h2 className="text-2xl font-bold text-pink-900 mb-2">Приклучи се</h2>
            <p className="text-slate-500 font-medium">Внеси PIN и започни со натпреварот.</p>
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
          <Sparkles className="text-indigo-500" /> Поставки за Мате-Хут
        </h2>
        
        <div className="space-y-8">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Избери тема за квизот</label>
            <input
              type="text"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              placeholder="пр. Собирање дропки, Геометриски тела..."
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-medium"
            />
          </div>

          <button
            onClick={handleCreateGame}
            disabled={loading || !selectedTopic}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Play className="w-6 h-6" />}
            ГЕНЕРИРАЈ КВИЗ ВО ЖИВО
          </button>

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
        <h2 className="text-4xl font-black text-pink-900 mb-8">Мате-Хут! 🎒</h2>
        
        <div className="space-y-6">
          {hasUrlPin ? (
            <div className="bg-pink-50 p-6 rounded-3xl border-2 border-pink-100 mb-4">
              <p className="text-pink-600 font-bold uppercase tracking-widest text-xs mb-1">Приклучување на игра</p>
              <p className="text-3xl font-black text-pink-900 tracking-widest">{pinInput}</p>
            </div>
          ) : (
            <input
              type="text"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="Внеси PIN код"
              className="w-full p-6 text-center text-3xl font-black tracking-[0.5em] bg-slate-50 border-4 border-slate-100 rounded-3xl focus:border-pink-500 focus:ring-0 transition-all placeholder:tracking-normal placeholder:text-lg"
            />
          )}
          
          <input
            type="text"
            value={playerName}
            autoFocus={hasUrlPin}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Твоето име"
            className="w-full p-5 text-center text-xl font-bold bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-pink-500 focus:ring-0 transition-all"
          />

          <button
            onClick={handleJoinGame}
            disabled={loading || pinInput.length < 6 || !playerName}
            className="w-full py-5 bg-pink-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-pink-200 hover:bg-pink-700 disabled:opacity-50 transition-all"
          >
            ВЛЕЗИ ВО ИГРАТА!
          </button>

          {error && <p className="text-red-500 font-bold bg-red-50 p-3 rounded-xl">{error}</p>}

          <button onClick={() => setRole(null)} className="text-slate-400 font-bold hover:text-pink-600 transition-colors">
            Откажи
          </button>
        </div>
      </div>
    );
  }

  // --- GAME SCREENS ---

  if (gameState?.status === 'WAITING' && (role === 'TEACHER' || isJoined)) {
    const joinUrl = `${window.location.origin}/?pin=${gameState.pin}`;

    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-indigo-900 text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left flex-1">
              <p className="text-indigo-300 font-bold uppercase tracking-widest mb-2">Приклучи се на Мате-Хут</p>
              <h2 className="text-8xl font-black tracking-tighter mb-4">{gameState.pin}</h2>
              <div className="flex items-center gap-2 text-indigo-200 font-medium bg-white/10 px-4 py-2 rounded-xl inline-flex">
                <Users className="w-5 h-5" />
                <span>{gameState.players.length} ученици се приклучија</span>
              </div>
            </div>

            {role === 'TEACHER' && (
              <div className="flex flex-col items-center gap-6">
                <div className="bg-white p-4 rounded-3xl shadow-2xl border-4 border-indigo-400/30">
                  <QRCodeCanvas 
                    value={joinUrl} 
                    size={180}
                    level="H"
                    includeMargin={true}
                    imageSettings={{
                      src: "https://picsum.photos/seed/math/40/40",
                      height: 30,
                      width: 30,
                      excavate: true,
                    }}
                  />
                  <p className="text-indigo-900 text-[10px] font-black text-center mt-2 uppercase tracking-tighter">Скенирај за влез</p>
                </div>
                
                <button
                  onClick={startGame}
                  disabled={gameState.players.length === 0}
                  className="px-12 py-6 bg-white text-indigo-900 rounded-3xl font-black text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
                >
                  ЗАПОЧНИ <ArrowRight className="w-8 h-8" />
                </button>
              </div>
            )}

            {role === 'STUDENT' && (
              <div className="text-center bg-white/10 p-8 rounded-3xl backdrop-blur-md border border-white/10">
                <p className="text-xl font-bold mb-2">Здраво, {playerName}!</p>
                <p className="text-indigo-200">Чекаме наставникот да ја започне играта...</p>
                <div className="mt-4 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                </div>
              </div>
            )}
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

        {role === 'TEACHER' && (
          <div className="mt-12 flex justify-center">
            <button onClick={closeRoom} className="text-slate-400 hover:text-red-500 font-bold flex items-center gap-2">
              <LogOut className="w-5 h-5" /> Затвори ја собата
            </button>
          </div>
        )}
      </div>
    );
  }

  if (gameState?.status === 'QUESTION' || gameState?.status === 'RESULT') {
    const currentQuestion = gameState.content.questions[gameState.currentQuestionIndex || 0];
    
    if (role === 'TEACHER') {
      return (
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Question Header */}
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden">
            <div className="flex justify-between items-start mb-8">
              <div className="bg-indigo-100 text-indigo-700 px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest">
                Прашање { (gameState.currentQuestionIndex || 0) + 1 } од { gameState.content.questions.length }
              </div>
              <div className={`w-20 h-20 rounded-full border-8 flex items-center justify-center font-black text-2xl transition-colors ${timeLeft <= 5 ? 'border-red-500 text-red-500 animate-pulse' : 'border-indigo-500 text-indigo-900'}`}>
                {timeLeft}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-black text-indigo-900 leading-tight mb-12">
                <FormattedText text={currentQuestion.question} />
              </div>
              
              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentQuestion.options.map((option: string, idx: number) => {
                  const isCorrect = idx === currentQuestion.correctAnswerIndex;
                  const showResult = gameState.status === 'RESULT';
                  
                  return (
                    <div
                      key={idx}
                      className={`relative p-8 rounded-3xl flex items-center gap-6 transition-all ${COLORS[idx].bg} text-white shadow-lg ${COLORS[idx].shadow} ${showResult && !isCorrect ? 'opacity-20 scale-95' : 'scale-100'} ${showResult && isCorrect ? 'ring-8 ring-white ring-offset-4 ring-offset-indigo-600 z-10' : ''}`}
                    >
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl font-black">
                        {COLORS[idx].icon}
                      </div>
                      <div className="text-2xl font-bold text-left flex-1">
                        {option}
                      </div>
                      {showResult && isCorrect && (
                        <CheckCircle2 className="w-10 h-10 text-white" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Teacher Controls */}
          <div className="flex justify-between items-center bg-white/50 backdrop-blur-sm p-6 rounded-3xl border border-white/20">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-slate-600 font-bold">
                <Users className="w-6 h-6" />
                <span>{gameState.players.filter(p => p.lastAnswer?.questionIndex === gameState.currentQuestionIndex).length} одговориле</span>
              </div>

              {gameState.status === 'QUESTION' && (
                <button
                  onClick={() => {
                    update(ref(db, `games/${gameState.pin}`), {
                      status: 'RESULT',
                      showCorrectAnswer: true
                    });
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-bold text-sm uppercase tracking-wider transition-colors"
                >
                  Прескокни време
                </button>
              )}
            </div>
            
            {gameState.status === 'RESULT' && (
              <button
                onClick={nextStep}
                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                СЛЕДНО <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <button
              onClick={() => {
                if (confirm('Дали сте сигурни дека сакате да го прекинете квизот?')) {
                  closeRoom();
                }
              }}
              className="px-6 py-4 text-slate-400 hover:text-red-500 font-bold flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-5 h-5" /> ПРЕКИНИ
            </button>
          </div>
        </div>
      );
    }

    if (role === 'STUDENT') {
      if (gameState.status === 'RESULT') {
        if (!lastAnswerResult) {
          return (
            <div className="max-w-md mx-auto h-[70vh] bg-indigo-600 rounded-[3rem] flex flex-col items-center justify-center text-center p-10 text-white shadow-2xl">
              <Sparkles className="w-20 h-20 mb-8 opacity-50" />
              <h2 className="text-4xl font-black mb-4">Добредојде!</h2>
              <p className="text-xl font-medium opacity-80">Се приклучи среде квиз. Чекаме на следното прашање...</p>
            </div>
          );
        }
        const isCorrect = lastAnswerResult?.correct;
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`max-w-md mx-auto h-[70vh] rounded-[3rem] flex flex-col items-center justify-center text-center p-10 shadow-2xl ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}
          >
            <div className="mb-8">
              {isCorrect ? (
                <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-20 h-20" />
                </div>
              ) : (
                <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <XCircle className="w-20 h-20" />
                </div>
              )}
              <h2 className="text-5xl font-black mb-2">{isCorrect ? 'ТОЧНО!' : 'ПОГРЕШНО'}</h2>
              <p className="text-xl font-bold opacity-80">
                {isCorrect ? `+${lastAnswerResult?.points} поени` : 'Повеќе среќа следниот пат'}
              </p>
            </div>
            
            <div className="bg-black/10 p-6 rounded-2xl w-full">
              <p className="text-sm font-bold uppercase tracking-widest opacity-60 mb-2">Твојот резултат</p>
              <p className="text-3xl font-black">{gameState.players.find(p => p.id === playerId)?.score || 0}</p>
            </div>
          </motion.div>
        );
      }

      if (hasAnswered) {
        return (
          <div className="max-w-md mx-auto h-[70vh] bg-indigo-600 rounded-[3rem] flex flex-col items-center justify-center text-center p-10 text-white shadow-2xl">
            <Loader2 className="w-20 h-20 animate-spin mb-8 opacity-50" />
            <h2 className="text-4xl font-black mb-4">Одговорено!</h2>
            <p className="text-xl font-medium opacity-80">Чекаме на останатите ученици...</p>
          </div>
        );
      }

      const currentQuestion = gameState.content.questions[gameState.currentQuestionIndex || 0];

      return (
        <div className="h-full flex flex-col p-4 gap-4 overflow-y-auto">
          {/* Question on student device */}
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 text-center mb-2">
            <div className="text-xl font-black text-indigo-900 leading-tight">
              <FormattedText text={currentQuestion.question} />
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 grid-rows-4 md:grid-cols-2 md:grid-rows-2 gap-4">
            {COLORS.map((color, idx) => (
              <button
                key={idx}
                onClick={() => submitAnswer(idx)}
                className={`${color.bg} ${color.hover} rounded-2xl shadow-xl flex flex-col items-center justify-center text-white transition-all active:scale-95 group p-4 min-h-[100px]`}
              >
                <span className="text-4xl font-black group-hover:scale-110 transition-transform mb-2">
                  {color.icon}
                </span>
                <span className="text-lg font-bold leading-tight">
                  {currentQuestion.options[idx]}
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    }
  }

  if (gameState?.status === 'LEADERBOARD') {
    const topPlayers = gameState.players.slice(0, 5);
    const myRank = gameState.players.findIndex(p => p.id === playerId) + 1;

    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl mb-4">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-4xl font-black text-indigo-900">Ранг Листа</h2>
        </div>

        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="p-10 space-y-4">
            {topPlayers.map((player, idx) => (
              <motion.div
                key={player.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex items-center justify-between p-6 rounded-2xl ${idx === 0 ? 'bg-amber-50 border-2 border-amber-200' : 'bg-slate-50 border border-slate-100'}`}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${idx === 0 ? 'bg-amber-500 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                    {idx + 1}
                  </div>
                  <span className="text-2xl font-bold text-indigo-900">{player.name}</span>
                  {idx === 0 && <Medal className="text-amber-500 w-8 h-8" />}
                </div>
                <span className="text-2xl font-black text-indigo-900">{player.score || 0}</span>
              </motion.div>
            ))}
          </div>

          {role === 'STUDENT' && myRank > 5 && (
            <div className="bg-indigo-900 text-white p-6 text-center">
              <p className="font-bold">Твојата позиција: <span className="text-2xl ml-2">#{myRank}</span></p>
            </div>
          )}
        </div>

        {role === 'TEACHER' && (
          <div className="mt-12 flex flex-col items-center gap-4">
            <button
              onClick={nextStep}
              className="px-12 py-6 bg-indigo-600 text-white rounded-3xl font-black text-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3"
            >
              СЛЕДНО ПРАШАЊЕ <ArrowRight className="w-8 h-8" />
            </button>
            
            <button
              onClick={() => {
                if (confirm('Дали сте сигурни дека сакате да го прекинете квизот?')) {
                  closeRoom();
                }
              }}
              className="text-slate-400 hover:text-red-500 font-bold flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-5 h-5" /> ПРЕКИНИ КВИЗ
            </button>
          </div>
        )}
      </div>
    );
  }

  if (gameState?.status === 'FINISHED') {
    const winner = gameState.players[0];
    const isMe = role === 'STUDENT' && playerId === winner?.id;

    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-16 rounded-[4rem] shadow-2xl border border-slate-100 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          
          <div className="mb-12">
            <div className="w-32 h-32 bg-amber-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 rotate-12">
              <Trophy className="w-16 h-16 text-amber-600" />
            </div>
            <h2 className="text-6xl font-black text-indigo-900 mb-4">КРАЈ!</h2>
            <p className="text-2xl text-slate-500 font-medium">Играта заврши. Ова се победниците:</p>
          </div>

          <div className="flex flex-col items-center gap-6 mb-12">
            {gameState.players.slice(0, 3).map((player, idx) => (
              <div 
                key={player.id}
                className={`w-full max-w-md flex items-center justify-between p-8 rounded-3xl ${idx === 0 ? 'bg-amber-50 border-4 border-amber-200 scale-110' : 'bg-slate-50 border border-slate-100'}`}
              >
                <div className="flex items-center gap-6">
                  <span className="text-4xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                  <span className="text-3xl font-black text-indigo-900">{player.name}</span>
                </div>
                <span className="text-3xl font-black text-indigo-900">{player.score || 0}</span>
              </div>
            ))}
          </div>

          {isMe && (
            <div className="bg-emerald-500 text-white p-8 rounded-3xl mb-12 animate-bounce">
              <h3 className="text-3xl font-black">ТИ ПОБЕДИ! 🏆</h3>
              <p className="font-bold opacity-90">Одлична работа, математичару!</p>
            </div>
          )}

          {role === 'TEACHER' && (
            <button
              onClick={closeRoom}
              className="px-12 py-6 bg-indigo-600 text-white rounded-3xl font-black text-2xl shadow-xl hover:bg-indigo-700 transition-all"
            >
              ЗАТВОРИ И ИЗЛЕЗИ
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return null;
};

export default MateHoot;
