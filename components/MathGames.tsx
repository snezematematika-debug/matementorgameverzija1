
import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { GradeLevel, GameType, GameState, CurriculumTopic } from '../types';
import { PROJECT_TOPICS, PROJECT_THEMES } from '../projectTopics';
import { generateGameContent } from '../services/geminiService';
import Loading from './Loading';

interface MathGamesProps {
  grade: GradeLevel;
}

const MathGames: React.FC<MathGamesProps> = ({ grade }) => {
  const [role, setRole] = useState<'TEACHER' | 'STUDENT' | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedGameType, setSelectedGameType] = useState<GameType>('BINGO');
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [markedCells, setMarkedCells] = useState<Set<number>>(new Set());
  const [escapeRoomAnswers, setEscapeRoomAnswers] = useState<string[]>([]);
  const [solvedRiddles, setSolvedRiddles] = useState<boolean[]>([]);
  const [finalPassword, setFinalPassword] = useState('');
  const [isSolved, setIsSolved] = useState(false);
  const [solvers, setSolvers] = useState<string[]>([]);

  console.log('MathGames State:', { role, isSolved, solvers, gameType: gameState?.type });

  const filteredTopics = PROJECT_TOPICS.filter(t => t.grade === grade);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    // Check for PIN in URL
    const params = new URLSearchParams(window.location.search);
    const urlPin = params.get('pin');
    if (urlPin) {
      setPinInput(urlPin);
      setRole('STUDENT');
    }

    newSocket.on('room-created', (data: GameState) => {
      setGameState(data);
      setLoading(false);
    });

    newSocket.on('player-joined', (data: { players: string[] }) => {
      setGameState(prev => prev ? { ...prev, players: data.players } : null);
    });

    newSocket.on('join-success', (data: GameState) => {
      setGameState(data);
      if (data.solvers) setSolvers(data.solvers);
      setLoading(false);
    });

    newSocket.on('join-error', (msg: string) => {
      setError(msg);
      setLoading(false);
    });

    newSocket.on('game-started', (data: GameState) => {
      setGameState(data);
      setSolvers([]);
      setIsSolved(false);
      setFinalPassword('');
      if (data.type === 'ESCAPE_ROOM') {
        const riddleCount = data.content?.riddles?.length || 0;
        setEscapeRoomAnswers(new Array(riddleCount).fill(''));
        setSolvedRiddles(new Array(riddleCount).fill(false));
      }
    });

    newSocket.on('player-solved-escape-room', (data: { playerName: string, allSolvers?: string[] }) => {
      if (data.allSolvers) {
        setSolvers(data.allSolvers);
      } else {
        setSolvers(prev => [...new Set([...prev, data.playerName])]);
      }
    });

    newSocket.on('room-closed', () => {
      setGameState(null);
      setRole(null);
      setError('Играта беше завршена од наставникот.');
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleCreateGame = async () => {
    if (!selectedTopic || !socket) return;
    setLoading(true);
    setError(null);
    try {
      const content = await generateGameContent(selectedTopic, selectedGameType, grade);
      socket.emit('create-room', {
        topic: selectedTopic,
        type: selectedGameType,
        content
      });
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleJoinGame = () => {
    if (!pinInput || !playerName || !socket) return;
    setLoading(true);
    setError(null);
    socket.emit('join-room', { pin: pinInput, playerName });
  };

  const handleStartGame = () => {
    if (gameState && socket) {
      socket.emit('start-game', gameState.pin);
    }
  };

  const toggleCard = (idx: number) => {
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(idx)) {
      newFlipped.delete(idx);
    } else {
      newFlipped.add(idx);
    }
    setFlippedCards(newFlipped);
  };

  const toggleMarkCell = (idx: number) => {
    const newMarked = new Set(markedCells);
    if (newMarked.has(idx)) {
      newMarked.delete(idx);
    } else {
      newMarked.add(idx);
    }
    setMarkedCells(newMarked);
  };

  const handleEscapeRoomAnswer = (idx: number, answer: string) => {
    const newAnswers = [...escapeRoomAnswers];
    newAnswers[idx] = answer;
    setEscapeRoomAnswers(newAnswers);
  };

  const checkRiddle = (idx: number) => {
    const riddle = gameState?.content?.riddles?.[idx];
    if (!riddle) return;
    
    const isCorrect = escapeRoomAnswers[idx].trim().toLowerCase() === riddle.answer.toString().toLowerCase();
    const newSolved = [...solvedRiddles];
    newSolved[idx] = isCorrect;
    setSolvedRiddles(newSolved);
  };

  const checkFinalPassword = () => {
    if (!gameState || !socket) return;
    
    // Lenient matching: strip spaces and lowercase everything
    const correctPassword = gameState.content.riddles
      .map((r: any) => r.answer.toString().toLowerCase().replace(/\s/g, ''))
      .join('');
    
    const studentInput = finalPassword.trim().toLowerCase().replace(/\s/g, '');
    
    if (studentInput === correctPassword) {
      setIsSolved(true);
      socket.emit('escape-room-solved', { pin: gameState.pin, playerName });
    } else {
      setError('Неточна лозинка. Провери ги одговорите на загатките и обиди се повторно!');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) return <Loading message="Се подготвува играта..." />;

  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 py-12">
        <h2 className="text-3xl font-bold text-indigo-900">Добредојдовте во Мате-Игри! 🎮</h2>
        <p className="text-slate-600 text-center max-w-md">
          Изберете ја вашата улога за да започнете со забавата и учењето.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <button
            onClick={() => setRole('TEACHER')}
            className="p-8 bg-white border-2 border-indigo-100 rounded-3xl hover:border-indigo-500 hover:shadow-xl transition-all group text-center"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">👨‍🏫</div>
            <h3 className="text-xl font-bold text-indigo-900">Јас сум Наставник</h3>
            <p className="text-sm text-slate-500 mt-2">Креирајте нова игра и поканете ги учениците.</p>
          </button>
          <button
            onClick={() => setRole('STUDENT')}
            className="p-8 bg-white border-2 border-pink-100 rounded-3xl hover:border-pink-500 hover:shadow-xl transition-all group text-center"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🎒</div>
            <h3 className="text-xl font-bold text-pink-900">Јас сум Ученик</h3>
            <p className="text-sm text-slate-500 mt-2">Внесете го кодот и приклучете се на играта.</p>
          </button>
        </div>
      </div>
    );
  }

  // Teacher View: Setup
  if (role === 'TEACHER' && !gameState) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-indigo-900">Креирај нова игра</h2>
          <button onClick={() => setRole(null)} className="text-sm text-slate-500 hover:text-indigo-600">← Назад</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-700">1. Избери тема ({grade} одд):</label>
            <div className="grid grid-cols-1 gap-6 max-h-[450px] overflow-y-auto p-4 border border-slate-100 rounded-2xl bg-slate-50/50 custom-scrollbar">
              {PROJECT_THEMES.filter(theme => theme.grade === grade && !theme.id.startsWith('steam')).map(theme => {
                const themeTopics = filteredTopics.filter(t => t.themeId === theme.id);
                if (themeTopics.length === 0) return null;
                return (
                  <div key={theme.id} className="space-y-2">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                      <span className="w-8 h-[1px] bg-indigo-100"></span>
                      {theme.title}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {themeTopics.map(topic => (
                        <button
                          key={topic.id}
                          onClick={() => setSelectedTopic(topic.name)}
                          className={`p-3 text-left rounded-xl border-2 transition-all ${selectedTopic === topic.name ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-white bg-white hover:border-indigo-200 shadow-sm'}`}
                        >
                          <div className="text-sm font-bold">{topic.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-700">2. Избери тип на игра:</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'BINGO', name: 'Бинго', icon: '🔢' },
                { id: 'FLASHCARDS', name: 'Флеш картички', icon: '🗂️' },
                { id: 'ESCAPE_ROOM', name: 'Escape Room', icon: '🔐' },
                { id: 'PASSWORD', name: 'Лозинка', icon: '⌨️' },
                { id: 'BALLOONS', name: 'Балони', icon: '🎈' }
              ].map(game => (
                <button
                  key={game.id}
                  onClick={() => setSelectedGameType(game.id as GameType)}
                  className={`p-4 flex flex-col items-center justify-center rounded-2xl border-2 transition-all ${selectedGameType === game.id ? 'border-pink-500 bg-pink-50 text-pink-900' : 'border-slate-100 hover:border-pink-200'}`}
                >
                  <span className="text-2xl mb-1">{game.icon}</span>
                  <span className="text-xs font-bold">{game.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleCreateGame}
          disabled={!selectedTopic}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
        >
          Генерирај игра и PIN код 🚀
        </button>
        {error && <p className="text-red-500 text-center font-medium">{error}</p>}
      </div>
    );
  }

  // Teacher View: Waiting Room
  if (role === 'TEACHER' && gameState && gameState.status === 'WAITING') {
    return (
      <div className="flex flex-col items-center space-y-8 py-8">
        <div className="w-full flex justify-start">
          <button 
            onClick={() => {
              if (socket && gameState) socket.emit('close-room', gameState.pin);
              setGameState(null);
              setRole(null);
            }} 
            className="text-sm text-slate-500 hover:text-indigo-600"
          >
            ← Откажи игра
          </button>
        </div>
        <div className="text-center">
          <h2 className="text-4xl font-black text-indigo-900 tracking-tight mb-2">ПОКАНЕТЕ ГИ УЧЕНИЦИТЕ</h2>
          <p className="text-slate-500">Скенирајте го QR кодот или внесете го PIN кодот</p>
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-[10px] text-yellow-800 max-w-xs mx-auto">
            ⚠️ <strong>Важно:</strong> За QR кодот да работи кај учениците, мора да ја користите апликацијата преку <strong>Shared App URL</strong>.
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-12 bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
          <div className="bg-white p-4 rounded-3xl shadow-inner border border-slate-50">
            <QRCodeSVG value={`${window.location.origin}/join?pin=${gameState.pin}`} size={200} />
          </div>
          <div className="text-center md:text-left">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">PIN КОД</p>
            <p className="text-7xl font-black text-indigo-600 tracking-tighter">{gameState.pin}</p>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-700">Приклучени ученици ({gameState.players.length})</h3>
            <div className="flex gap-1">
              {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2">
            {gameState.players.map((p: any) => (
              <div key={p.id} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold border border-indigo-100 animate-in fade-in slide-in-from-bottom-2">
                👤 {p.name}
              </div>
            ))}
            {gameState.players.length === 0 && <p className="col-span-2 text-center text-slate-400 italic text-sm py-4">Се чекаат ученици...</p>}
          </div>
        </div>

        <button
          onClick={handleStartGame}
          disabled={gameState.players.length === 0}
          className="px-12 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-xl hover:bg-emerald-600 disabled:opacity-50 shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          ЗАПОЧНИ ИГРА! 🏁
        </button>
      </div>
    );
  }

  // Student View: Join
  if (role === 'STUDENT' && !gameState) {
    return (
      <div className="max-w-md mx-auto space-y-8 py-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-pink-900">Приклучи се на играта! 🎒</h2>
          <p className="text-slate-500 mt-2">Внеси ги податоците за да започнеш.</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-pink-50 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">PIN КОД</label>
            <input
              type="text"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="123456"
              className="w-full p-4 text-center text-3xl font-black tracking-widest bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-pink-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">ТВОЕТО ИМЕ</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Внеси име..."
              className="w-full p-4 text-center text-xl font-bold bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-pink-500 outline-none transition-all"
            />
          </div>
          <button
            onClick={handleJoinGame}
            disabled={!pinInput || !playerName}
            className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold text-lg hover:bg-pink-700 disabled:opacity-50 shadow-lg transition-all"
          >
            ВЛЕЗИ ВО ИГРАТА 🚀
          </button>
          {error && <p className="text-red-500 text-center font-medium">{error}</p>}
        </div>
        <button onClick={() => setRole(null)} className="w-full text-slate-400 text-sm hover:text-pink-600">← Назад</button>
      </div>
    );
  }

  // Student View: Waiting Room
  if (role === 'STUDENT' && gameState && gameState.status === 'WAITING') {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 py-20 relative">
        <button 
          onClick={() => {
            if (socket && gameState) socket.emit('leave-room', gameState.pin);
            setGameState(null);
            setRole(null);
          }} 
          className="absolute top-0 left-0 text-sm text-slate-500 hover:text-pink-600"
        >
          ← Излези
        </button>
        <div className="relative">
          <div className="w-32 h-32 bg-pink-100 rounded-full animate-ping absolute opacity-20" />
          <div className="w-32 h-32 bg-pink-500 rounded-full flex items-center justify-center text-5xl relative shadow-2xl">👤</div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-pink-900">Здраво, {playerName}!</h2>
          <p className="text-slate-500">Успешно се приклучи на играта за <span className="font-bold text-indigo-600">{gameState.topic}</span>.</p>
        </div>
        <div className="bg-white px-8 py-4 rounded-full shadow-md border border-slate-100 flex items-center gap-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
          <p className="text-sm font-bold text-slate-600">Се чека наставникот да ја започне играта...</p>
        </div>
      </div>
    );
  }

  // Game Play View
  if (gameState && gameState.status === 'PLAYING') {
    const content = gameState.content;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{gameState.type}</p>
            <h3 className="text-lg font-bold text-indigo-900">{gameState.topic}</h3>
          </div>
          <div className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold">
            PIN: {gameState.pin}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 min-h-[500px]">
          {gameState.type === 'BINGO' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-center text-indigo-900">Бинго Картичка 🔢</h3>
              <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
                {Array.from({ length: 25 }).map((_, i) => {
                  if (i === 12) return (
                    <div key={i} className="aspect-square bg-indigo-600 text-white flex items-center justify-center rounded-lg font-bold text-[10px] shadow-inner">
                      FREE
                    </div>
                  );
                  const item = content?.questions?.[i > 12 ? i - 1 : i];
                  const isMarked = markedCells.has(i);
                  return (
                    <div 
                      key={i} 
                      onClick={() => toggleMarkCell(i)}
                      className={`aspect-square border rounded-lg flex items-center justify-center p-1 text-[10px] text-center font-bold cursor-pointer transition-all duration-200 ${
                        isMarked 
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-inner scale-95' 
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-200'
                      }`}
                    >
                      {item?.answer || '?'}
                    </div>
                  );
                })}
              </div>
              {role === 'TEACHER' && (
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <p className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                    <span>📢</span> Наставникот ги чита прашањата:
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {content?.questions?.map((q: any, idx: number) => (
                      <div key={idx} className="text-xs text-slate-600 bg-white/50 p-2 rounded-lg border border-indigo-50">
                        <strong className="text-indigo-600">{idx + 1}.</strong> {q.question}
                        <span className="ml-2 text-emerald-600 font-bold">(Одговор: {q.answer})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {role === 'STUDENT' && (
                <div className="p-4 bg-pink-50 rounded-2xl border border-pink-100 text-center">
                  <p className="text-sm font-bold text-pink-900">
                    Слушајте го наставникот внимателно и означете ги точните одговори на вашата картичка! 👂
                  </p>
                </div>
              )}
            </div>
          )}

          {gameState.type === 'FLASHCARDS' && (
            <div className="space-y-8">
              <h3 className="text-xl font-bold text-center text-indigo-900">Флеш Картички 🗂️</h3>
              <p className="text-center text-sm text-slate-500">Кликни на картичката за да го видиш одговорот</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {content?.cards?.map((card: any, idx: number) => (
                  <div 
                    key={idx} 
                    onClick={() => toggleCard(idx)}
                    className="group perspective-1000 h-48 cursor-pointer"
                  >
                    <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${flippedCards.has(idx) ? 'rotate-y-180' : ''}`}>
                      {/* Front */}
                      <div className="absolute inset-0 backface-hidden bg-slate-50 border-2 border-indigo-100 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-xs font-bold text-indigo-400 mb-2 uppercase tracking-widest">Прашање {idx + 1}</p>
                        <p className="text-lg font-bold text-indigo-900">{card.question}</p>
                      </div>
                      {/* Back */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180 bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-inner">
                        <p className="text-xs font-bold text-emerald-500 mb-2 uppercase tracking-widest">Одговор</p>
                        <p className="text-lg font-bold text-emerald-900">{card.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gameState.type === 'ESCAPE_ROOM' && (
            <div className="space-y-8">
              <h3 className="text-2xl font-black text-center text-indigo-900 flex items-center justify-center gap-3">
                <span className="text-3xl">🔐</span> Escape Room: Математичка Мисија
              </h3>
              
              {role === 'STUDENT' && !isSolved && (
                <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl text-amber-900 text-center font-bold animate-pulse">
                  📢 Реши ги сите загатки и внеси ја лозинката најдолу за да излезеш!
                </div>
              )}
              
              <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 mb-8">
                <h4 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                  <span>🏆</span> Ученици кои ја открија лозинката:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {solvers.map((name, i) => (
                    <div key={i} className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm animate-bounce">
                      🎉 {name}
                    </div>
                  ))}
                  {solvers.length === 0 && <p className="text-slate-400 italic text-sm">Сè уште никој не ја открил лозинката...</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {content?.riddles?.map((riddle: any, idx: number) => (
                  <div key={idx} className={`p-6 rounded-2xl border-l-4 transition-all ${solvedRiddles[idx] ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-indigo-500 shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-indigo-900">Загатка {idx + 1}</h4>
                      {solvedRiddles[idx] && <span className="text-emerald-600 font-bold text-sm">✅ Решено!</span>}
                    </div>
                    <p className="text-slate-700 mb-4">{riddle.question}</p>
                    
                    {role === 'TEACHER' ? (
                      <div className="p-3 bg-white/50 rounded-xl border border-indigo-100">
                        <p className="text-sm font-bold text-indigo-600">Клуч: <span className="text-emerald-600">{riddle.answer}</span></p>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Внеси одговор..." 
                          value={escapeRoomAnswers[idx] || ''}
                          onChange={(e) => handleEscapeRoomAnswer(idx, e.target.value)}
                          disabled={solvedRiddles[idx]}
                          className={`flex-1 p-3 rounded-xl border-2 outline-none transition-all ${solvedRiddles[idx] ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 'bg-white border-slate-100 focus:border-indigo-500'}`}
                        />
                        {!solvedRiddles[idx] && (
                          <button 
                            onClick={() => checkRiddle(idx)}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all"
                          >
                            Провери
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Final Password Section - Always visible for students until solved */}
              {role === 'STUDENT' && !isSolved && (
                <div className="mt-12 p-8 bg-indigo-900 text-white rounded-[2.5rem] shadow-2xl space-y-6 border-4 border-indigo-400">
                  <div className="text-center">
                    <h4 className="text-xl font-bold mb-2">Внеси ја финалната лозинка ⌨️</h4>
                    <p className="text-indigo-300 text-sm">Лозинката е низа од сите одговори на загатките по ред.</p>
                    <div className="mt-2 text-[10px] text-indigo-400">v1.2 - Проверка на лозинка</div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <input 
                      type="text" 
                      placeholder="Внеси ја лозинката..." 
                      value={finalPassword}
                      onChange={(e) => setFinalPassword(e.target.value)}
                      className="w-full p-4 bg-white/10 border-2 border-white/20 rounded-2xl text-center text-2xl font-black tracking-widest focus:border-white focus:bg-white/20 outline-none transition-all placeholder:text-white/30"
                    />
                    <button 
                      onClick={checkFinalPassword}
                      className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-95"
                    >
                      ОТКРИЈ ЈА ЛОЗИНКАТА! 🔓
                    </button>
                  </div>
                </div>
              )}

              {isSolved && (
                <div className="mt-12 p-10 bg-emerald-500 text-white rounded-[2.5rem] shadow-2xl text-center animate-in zoom-in duration-500">
                  <div className="text-6xl mb-4">🎉</div>
                  <h4 className="text-3xl font-black mb-2">БРАВО!</h4>
                  <p className="text-xl font-bold">Успешно ја откри лозинката и излезе од собата!</p>
                  <p className="mt-4 text-emerald-100">Наставникот е известен за твојот успех.</p>
                </div>
              )}
            </div>
          )}

          {/* Fallback for other types */}
          {['PASSWORD', 'BALLOONS'].includes(gameState.type) && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-6">{gameState.type === 'PASSWORD' ? '⌨️' : '🎈'}</div>
              <h2 className="text-2xl font-bold text-slate-800">Играта е во тек!</h2>
              <p className="text-slate-500 mt-2 max-w-md">
                Оваа игра бара интеракција во живо. Наставникот ги прикажува задачите, а учениците одговараат.
              </p>
              <div className="mt-8 p-6 bg-slate-50 rounded-2xl w-full text-left">
                <h4 className="font-bold text-slate-700 mb-2">Задачи:</h4>
                <div className="space-y-4">
                  {content?.tasks?.map((task: any, idx: number) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200">
                      <p className="text-sm font-bold text-indigo-900">{idx + 1}. {task.question}</p>
                      {role === 'TEACHER' && (
                        <p className="text-xs text-emerald-600 mt-1 font-bold">Точен одговор: {task.answer}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-center pt-4">
           <button 
             onClick={() => {
               // Removed window.confirm to avoid issues in iframe/mobile
               if (role === 'TEACHER' && socket && gameState) {
                 socket.emit('close-room', gameState.pin);
               } else if (role === 'STUDENT' && socket && gameState) {
                 socket.emit('leave-room', gameState.pin);
               }
               // Reset local state
               setGameState(null);
               setRole(null);
               setMarkedCells(new Set());
               setFlippedCards(new Set());
               setEscapeRoomAnswers([]);
               setSolvedRiddles([]);
               setFinalPassword('');
               setIsSolved(false);
               setSolvers([]);
               setError(null);
             }}
             className="px-8 py-3 bg-red-50 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-100 transition-all border border-red-100 shadow-sm active:scale-95"
           >
             Заврши ја играта 🏁
           </button>
        </div>
      </div>
    );
  }

  return null;
};

export default MathGames;
