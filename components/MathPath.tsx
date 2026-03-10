
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dice5, 
  Trophy, 
  ArrowLeft, 
  ArrowRight,
  Users, 
  Play, 
  CheckCircle2, 
  XCircle,
  Flag,
  RotateCcw,
  Sparkles,
  QrCode,
  Loader2,
  LogOut
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { db } from '../services/firebase';
import { ref, set, onValue, update, remove, get } from "firebase/database";
import { GradeLevel } from '../types';
import { generateGameContent } from '../services/geminiService';
import Loading from './Loading';

interface MathPathProps {
  grade: GradeLevel;
  initialRole?: 'TEACHER' | 'STUDENT' | null;
  onBack: () => void;
}

interface Player {
  id: string;
  name: string;
  avatar: string;
  position: number;
  color: string;
  skipNextTurn: boolean;
  isHost: boolean;
}

const AVATARS = ['🦊', '🐼', '🦁', '🐯', '🐨', '🐸', '🐙', '🦄'];
const COLORS = ['bg-indigo-500', 'bg-pink-500', 'bg-emerald-500', 'bg-amber-500'];

const BOARD_SIZE = 5;
const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;

// Path from top-right (4) to bottom-left (20) in a 5x5 grid
const PATH = [
  4, 3, 2, 1, 0,
  5, 6, 7, 8, 9,
  14, 13, 12, 11, 10,
  15, 16, 17, 18, 19,
  24, 23, 22, 21, 20
];

const MathPath: React.FC<MathPathProps> = ({ grade, initialRole = null, onBack }) => {
  const [role, setRole] = useState<'TEACHER' | 'STUDENT' | null>(initialRole);
  const [gameState, setGameState] = useState<any>(null);
  const [pinInput, setPinInput] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('pin') || sessionStorage.getItem('mathpath_pin') || '';
  });
  const [playerName, setPlayerName] = useState(() => sessionStorage.getItem('mathpath_player_name') || '');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);

  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [answerInput, setAnswerInput] = useState('');
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);

  // Initialize Player ID
  useEffect(() => {
    const savedId = sessionStorage.getItem('mathpath_player_id');
    if (savedId) {
      setPlayerId(savedId);
    } else {
      const newId = 'pp_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('mathpath_player_id', newId);
      setPlayerId(newId);
    }
  }, []);

  // Listen for Game State
  useEffect(() => {
    const activePin = gameState?.pin || pinInput;
    if (!activePin || activePin.length < 6 || !role) return;

    const roomRef = ref(db, `mathpath/${activePin}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const playersObj = data.players || {};
        const playersArray = Object.entries(playersObj).map(([id, p]: [string, any]) => ({
          id,
          ...p
        })).sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));

        setGameState({
          ...data,
          players: playersArray
        });

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

  // Persist PIN and Name
  useEffect(() => {
    if (pinInput) sessionStorage.setItem('mathpath_pin', pinInput);
    if (playerName) sessionStorage.setItem('mathpath_player_name', playerName);
  }, [pinInput, playerName]);

  // Auto-join if PIN is in URL and name is available
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlPin = urlParams.get('pin');
    if (urlPin && playerName && !isJoined && role === 'STUDENT' && playerId) {
      handleJoinGame();
    }
  }, [playerName, isJoined, role, playerId]);

  // Sync dice and task state for all players
  useEffect(() => {
    if (gameState?.status === 'PLAYING') {
      setDiceValue(gameState.diceValue || null);
      setIsRolling(gameState.isRolling || false);
      setShowTask(gameState.showTask || false);
      if (!gameState.showTask) {
        setAnswerInput('');
        setFeedback(null);
      }
    }
  }, [gameState?.diceValue, gameState?.isRolling, gameState?.showTask]);

  const generatePin = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleCreateGame = async () => {
    if (!topic.trim() || !playerId) return;
    setIsLoading(true);
    setError(null);
    try {
      const content = await generateGameContent(topic, 'BINGO', grade);
      const pin = generatePin();
      
      const newGameState = {
        pin,
        topic,
        status: 'WAITING',
        players: {},
        hostId: playerId,
        questions: content.questions,
        currentPlayerIndex: 0,
        createdAt: Date.now()
      };
      
      await set(ref(db, `mathpath/${pin}`), newGameState);
      
      setGameState({
        ...newGameState,
        players: []
      });
      setPinInput(pin);
      sessionStorage.setItem('mathpath_pin', pin);
      setIsJoined(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!pinInput || !playerName || !playerId) return;
    setIsLoading(true);
    setError(null);
    try {
      const roomRef = ref(db, `mathpath/${pinInput}`);
      const snapshot = await get(roomRef);
      if (!snapshot.exists()) {
        setError('Невалиден PIN код.');
        return;
      }
      const roomData = snapshot.val();
      if (roomData.status !== 'WAITING') {
        setError('Оваа игра веќе започна или заврши.');
        return;
      }

      const playersCount = Object.keys(roomData.players || {}).length;
      if (playersCount >= 8) {
        setError('Играта е веќе полна (макс. 8 играчи).');
        return;
      }

      const playerRef = ref(db, `mathpath/${pinInput}/players/${playerId}`);
      await set(playerRef, {
        name: playerName,
        avatar: AVATARS[playersCount % AVATARS.length],
        position: 0,
        color: COLORS[playersCount % COLORS.length],
        skipNextTurn: false,
        isHost: false,
        joinedAt: Date.now()
      });
      
      setIsJoined(true);
      sessionStorage.setItem('mathpath_pin', pinInput);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const startGame = async () => {
    if (!gameState?.pin) return;
    await update(ref(db, `mathpath/${gameState.pin}`), {
      status: 'PLAYING'
    });
  };

  const updatePlayerAvatar = async (avatar: string) => {
    if (!gameState?.pin || !playerId) return;
    await update(ref(db, `mathpath/${gameState.pin}/players/${playerId}`), { avatar });
  };

  const rollDice = async () => {
    if (isRolling || showTask || gameState?.winner || !gameState?.pin) return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return; // Only current player can roll

    // Check for penalty
    if (currentPlayer.skipNextTurn) {
      await update(ref(db, `mathpath/${gameState.pin}/players/${playerId}`), { skipNextTurn: false });
      await update(ref(db, `mathpath/${gameState.pin}`), {
        currentPlayerIndex: (gameState.currentPlayerIndex + 1) % gameState.players.length
      });
      return;
    }

    await update(ref(db, `mathpath/${gameState.pin}`), { isRolling: true });

    // Simulate rolling locally then update final
    setTimeout(async () => {
      const finalValue = Math.floor(Math.random() * 6) + 1;
      
      let newPos = currentPlayer.position + finalValue;
      if (newPos >= PATH.length - 1) newPos = PATH.length - 1;

      const qIndex = Math.floor(Math.random() * gameState.questions.length);
      const currentQuestion = gameState.questions[qIndex];

      await update(ref(db, `mathpath/${gameState.pin}`), {
        isRolling: false,
        diceValue: finalValue,
        showTask: true,
        currentQuestion,
        currentQuestionIndex: qIndex
      });

      await update(ref(db, `mathpath/${gameState.pin}/players/${playerId}`), {
        position: newPos
      });
    }, 1500);
  };

  const checkAnswer = async () => {
    if (!gameState?.currentQuestion || !gameState?.pin) return;
    
    const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, '').replace(/х/g, 'x');
    const isCorrect = normalize(answerInput) === normalize(gameState.currentQuestion.answer);

    if (isCorrect) {
      setFeedback('CORRECT');
      setTimeout(async () => {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        if (currentPlayer.position === PATH.length - 1) {
          await update(ref(db, `mathpath/${gameState.pin}`), {
            status: 'FINISHED',
            winner: currentPlayer,
            showTask: false
          });
        } else {
          await update(ref(db, `mathpath/${gameState.pin}`), {
            showTask: false,
            currentPlayerIndex: (gameState.currentPlayerIndex + 1) % gameState.players.length
          });
        }
      }, 1500);
    } else {
      setFeedback('WRONG');
      await update(ref(db, `mathpath/${gameState.pin}/players/${playerId}`), {
        skipNextTurn: true
      });
      setTimeout(async () => {
        await update(ref(db, `mathpath/${gameState.pin}`), {
          showTask: false,
          currentPlayerIndex: (gameState.currentPlayerIndex + 1) % gameState.players.length
        });
      }, 1500);
    }
  };

  const closeRoom = async () => {
    if (gameState?.pin) {
      await remove(ref(db, `mathpath/${gameState.pin}`));
    }
    setGameState(null);
    setRole(null);
    setIsJoined(false);
    sessionStorage.removeItem('mathpath_pin');
  };

  if (isLoading) return <Loading message="Се подготвува патеката..." />;

  // --- RENDER HELPERS ---

  if (!role) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 text-white rounded-3xl mb-6 shadow-xl shadow-indigo-200">
            <Flag className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-black text-indigo-900 tracking-tight mb-4">Мате - Пат! 🏁</h1>
          <p className="text-slate-500 text-lg font-medium">Тркај се со твојот другар низ математичките предизвици.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button
            onClick={() => setRole('TEACHER')}
            className="group bg-white p-10 rounded-[2.5rem] shadow-xl border-2 border-transparent hover:border-indigo-500 transition-all duration-500 text-left"
          >
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-indigo-900 mb-2">Креирај Пат</h2>
            <p className="text-slate-500 font-medium">Започни нова трка за целата училница.</p>
          </button>

          <button
            onClick={() => setRole('STUDENT')}
            className="group bg-white p-10 rounded-[2.5rem] shadow-xl border-2 border-transparent hover:border-pink-500 transition-all duration-500 text-left"
          >
            <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-pink-600" />
            </div>
            <h2 className="text-2xl font-bold text-pink-900 mb-2">Приклучи се</h2>
            <p className="text-slate-500 font-medium">Внеси PIN и влези во трката.</p>
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

  if (role === 'TEACHER' && !isJoined) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100">
        <h2 className="text-3xl font-black text-indigo-900 mb-8 flex items-center gap-3">
          <Zap className="text-amber-500" /> Поставки за Мате-Пат
        </h2>
        
        <div className="space-y-8">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Тема за Пат</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="пр. Равенки, Плоштина на круг..."
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-medium"
            />
          </div>

          <button
            onClick={handleCreateGame}
            disabled={isLoading || !topic.trim()}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Play className="w-6 h-6 fill-current" />}
            ГЕНЕРИРАЈ ПАТ
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

  if (role === 'STUDENT' && !isJoined) {
    const urlParams = new URLSearchParams(window.location.search);
    const hasUrlPin = !!urlParams.get('pin');

    return (
      <div className="max-w-md mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 text-center">
        <h2 className="text-4xl font-black text-indigo-900 mb-8">Мате-Пат! 🎲</h2>
        
        <div className="space-y-6">
          {hasUrlPin ? (
            <div className="bg-indigo-50 p-6 rounded-3xl border-2 border-indigo-100 mb-4">
              <p className="text-indigo-600 font-bold uppercase tracking-widest text-xs mb-1">Приклучување на игра</p>
              <p className="text-3xl font-black text-indigo-900 tracking-widest">{pinInput}</p>
            </div>
          ) : (
            <input
              type="text"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="Внеси PIN код"
              className="w-full p-6 text-center text-3xl font-black tracking-[0.5em] bg-slate-50 border-4 border-slate-100 rounded-3xl focus:border-indigo-500 focus:ring-0 transition-all placeholder:tracking-normal placeholder:text-lg"
            />
          )}
          
          <input
            type="text"
            value={playerName}
            autoFocus={hasUrlPin}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Твоето име"
            className="w-full p-5 text-center text-xl font-bold bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all"
          />

          <button
            onClick={handleJoinGame}
            disabled={isLoading || pinInput.length < 6 || !playerName.trim()}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            ВЛЕЗИ ВО ТРКАТА!
          </button>

          {error && <p className="text-red-500 font-bold bg-red-50 p-3 rounded-xl">{error}</p>}

          <button onClick={() => setRole(null)} className="text-slate-400 font-bold hover:text-indigo-600 transition-colors">
            Откажи
          </button>
        </div>
      </div>
    );
  }

  if (gameState?.status === 'WAITING') {
    const joinUrl = `${window.location.origin}/?pin=${gameState.pin}&type=BOARD_GAME`;
    const me = gameState.players.find((p: any) => p.id === playerId);

    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-indigo-900 text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left flex-1">
              <p className="text-indigo-300 font-bold uppercase tracking-widest mb-2">Приклучи се на трката</p>
              <h2 className="text-8xl font-black tracking-tighter mb-4">{gameState.pin}</h2>
              <div className="flex items-center gap-2 text-indigo-200 font-medium bg-white/10 px-4 py-2 rounded-xl inline-flex">
                <Users className="w-5 h-5" />
                <span>{gameState.players.length} ученици се приклучија</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6">
              {role === 'TEACHER' && (
                <>
                  <div className="bg-white p-4 rounded-3xl shadow-2xl border-4 border-indigo-400/30">
                    <QRCodeCanvas value={joinUrl} size={180} level="H" includeMargin={true} />
                    <p className="text-indigo-900 text-[10px] font-black text-center mt-2 uppercase tracking-tighter">Скенирај за влез</p>
                  </div>
                  
                  <button
                    onClick={startGame}
                    disabled={gameState.players.length < 1}
                    className="px-12 py-6 bg-white text-indigo-900 rounded-3xl font-black text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
                  >
                    ЗАПОЧНИ ТРКА <ArrowRight className="w-8 h-8" />
                  </button>
                </>
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
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {gameState.players.map((p: any) => (
            <div key={p.id} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex flex-col items-center gap-3">
              <span className="text-5xl">{p.avatar}</span>
              <h3 className="text-lg font-black text-slate-900 truncate w-full text-center">{p.name}</h3>
            </div>
          ))}
          {gameState.players.length === 0 && (
            <div className="col-span-full bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 font-bold">
              Се чекаат ученици...
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState?.status === 'PLAYING') {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const isMyTurn = currentPlayer.id === playerId;

    return (
      <div className="max-w-6xl mx-auto p-4 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-indigo-950">Мате - Пат</h1>
              <p className="text-slate-500 font-medium">Тема: {gameState.topic}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 justify-end">
            {gameState.players.map((p: any, idx: number) => (
              <div 
                key={p.id}
                className={`flex items-center gap-3 px-4 py-2 rounded-2xl border-2 transition-all ${
                  gameState.currentPlayerIndex === idx ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-100' : 'border-slate-100 bg-white opacity-60'
                }`}
              >
                <span className="text-2xl">{p.avatar}</span>
                <span className="font-bold text-slate-700">{p.name}</span>
                {p.skipNextTurn && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase">Казна</span>}
              </div>
            ))}
            {role === 'TEACHER' && (
              <button
                onClick={() => {
                  if (confirm('Дали сте сигурни дека сакате да ја прекинете играта?')) {
                    closeRoom();
                  }
                }}
                className="p-3 text-slate-400 hover:text-red-500 transition-colors"
                title="Прекини игра"
              >
                <LogOut className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Board */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
            <div className="grid grid-cols-5 gap-3 aspect-square">
              {Array.from({ length: TOTAL_CELLS }).map((_, idx) => {
                const pathIndex = PATH.indexOf(idx);
                const isPath = pathIndex !== -1;
                const isEntry = idx === 4;
                const isExit = idx === 20;
                
                return (
                  <div 
                    key={idx}
                    className={`relative rounded-2xl flex items-center justify-center border-2 transition-all ${
                      isPath 
                        ? 'bg-slate-50 border-slate-200' 
                        : 'bg-slate-100 border-transparent opacity-20'
                    } ${isEntry ? 'bg-emerald-50 border-emerald-200' : ''} ${isExit ? 'bg-amber-50 border-amber-200' : ''}`}
                  >
                    {isEntry && <span className="absolute -top-6 text-[10px] font-black text-emerald-600 uppercase tracking-widest">Влез</span>}
                    {isExit && <span className="absolute -bottom-6 text-[10px] font-black text-amber-600 uppercase tracking-widest">Излез</span>}
                    
                    {isPath && (
                      <span className="text-slate-300 font-black text-xs">{pathIndex + 1}</span>
                    )}

                    {/* Players */}
                    <div className="flex flex-wrap justify-center gap-0.5 p-1">
                      {gameState.players.map((p: any) => p.position === pathIndex && (
                        <motion.div
                          key={p.id}
                          layoutId={`player-${p.id}`}
                          className="relative flex flex-col items-center group"
                        >
                          <span className="absolute -top-8 bg-white/90 backdrop-blur px-2 py-0.5 rounded-lg text-[10px] font-black shadow-sm border border-slate-100 whitespace-nowrap z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            {p.name}
                          </span>
                          <span className="text-2xl sm:text-3xl drop-shadow-lg filter cursor-help">
                            {p.avatar}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 text-center space-y-6">
              <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">На ред е</h3>
              <div className="flex flex-col items-center justify-center gap-2">
                <span className="text-6xl mb-2">{currentPlayer.avatar}</span>
                <span className="text-2xl font-black text-slate-900">{currentPlayer.name}</span>
                {isMyTurn && <span className="text-xs font-black text-indigo-600 animate-pulse uppercase tracking-widest">Твој ред е!</span>}
              </div>

              <div className="py-10">
                <motion.div
                  animate={isRolling ? { rotate: [0, 90, 180, 270, 360], scale: [1, 1.2, 1] } : {}}
                  transition={{ repeat: isRolling ? Infinity : 0, duration: 0.2 }}
                  className="w-24 h-24 bg-slate-50 rounded-3xl border-4 border-slate-100 flex items-center justify-center mx-auto shadow-inner"
                >
                  {diceValue ? (
                    <span className="text-5xl font-black text-indigo-600">{diceValue}</span>
                  ) : (
                    <Dice5 className="w-12 h-12 text-slate-300" />
                  )}
                </motion.div>
              </div>

              <button
                onClick={rollDice}
                disabled={isRolling || showTask || !isMyTurn}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-5 rounded-2xl font-black text-xl shadow-lg shadow-indigo-200 transition-all"
              >
                {isMyTurn ? 'ВРТИ КОЦКА' : 'ЧЕКАЈ...'}
              </button>
            </div>

            {/* Legend */}
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Инструкции</h4>
              <ul className="space-y-3 text-sm font-medium text-slate-600">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                  Врти коцка за да се придвижиш.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                  Реши ја задачата за да го завршиш потегот.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5" />
                  Погрешен одговор = прескокнување на следниот ред.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Task Modal */}
        <AnimatePresence>
          {showTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden"
              >
                <div className={`${currentPlayer.color} p-8 text-white text-center relative`}>
                  <div className="absolute top-4 left-4 bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Задача</div>
                  <div className="text-5xl mb-4">{currentPlayer.avatar}</div>
                  <h3 className="text-2xl font-black">{currentPlayer.name} е на ред</h3>
                </div>
                
                <div className="p-10 space-y-8">
                  <div className="bg-slate-50 p-8 rounded-3xl border-2 border-slate-100 text-center">
                    <p className="text-2xl font-bold text-slate-800 leading-relaxed">
                      {gameState.currentQuestion?.question}
                    </p>
                  </div>

                  {isMyTurn ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Внеси го твојот одговор..."
                        value={answerInput}
                        onChange={(e) => setAnswerInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                        className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-center text-xl font-bold"
                      />
                      
                      {feedback === 'CORRECT' ? (
                        <div className="flex items-center justify-center gap-3 text-emerald-600 font-black text-xl animate-bounce">
                          <CheckCircle2 className="w-8 h-8" /> ТОЧНО!
                        </div>
                      ) : feedback === 'WRONG' ? (
                        <div className="flex items-center justify-center gap-3 text-red-600 font-black text-xl animate-shake">
                          <XCircle className="w-8 h-8" /> ПОГРЕШНО!
                        </div>
                      ) : (
                        <button
                          onClick={checkAnswer}
                          disabled={!answerInput.trim()}
                          className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black text-xl transition-all"
                        >
                          ПРОВЕРИ
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-slate-500 font-bold">Чекаме {currentPlayer.name} да одговори...</p>
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mt-4 text-slate-300" />
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (gameState?.status === 'FINISHED') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 text-center space-y-8"
      >
        <div className="w-24 h-24 bg-amber-100 rounded-[2.5rem] flex items-center justify-center mx-auto text-amber-600">
          <Trophy className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-slate-900">ПОБЕДА!</h2>
          <p className="text-xl text-slate-500 font-medium">Честитки за {gameState.winner?.name}</p>
        </div>
        <div className="p-8 rounded-[2.5rem] bg-amber-50 border-2 border-amber-100 shadow-xl space-y-4">
          <span className="text-7xl block">{gameState.winner?.avatar}</span>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-amber-600 mb-1">Победник</p>
            <p className="text-3xl font-black text-slate-900">{gameState.winner?.name}</p>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <button
            onClick={closeRoom}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-200"
          >
            <RotateCcw className="w-6 h-6" /> НОВА ИГРА
          </button>
          <button
            onClick={onBack}
            className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3"
          >
            <LogOut className="w-6 h-6" /> ЗАТВОРИ ИГРА
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default MathPath;
