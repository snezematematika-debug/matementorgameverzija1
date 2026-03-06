import React, { useState, useEffect, useRef } from 'react';
import { ref, set, onValue, update, push, remove, get, child, off } from "firebase/database";
// Линијата за import db е отстранета
import { QRCodeSVG } from 'qrcode.react';
import { GradeLevel, GameType, GameState, CurriculumTopic } from '../types';
import { PROJECT_TOPICS, PROJECT_THEMES } from '../projectTopics';
import { generateGameContent } from '../services/geminiService';
import Loading from './Loading';

const generatePin = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

interface MathGamesProps {
  grade: GradeLevel;
  database: any; // Додадено за Firebase конекција
}

const MathGames: React.FC<MathGamesProps> = ({ grade, database }) => {
  const [role, setRole] = useState<'TEACHER' | 'STUDENT' | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState<string | null>(null);
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
    // Check for PIN in URL
    const params = new URLSearchParams(window.location.search);
    const urlPin = params.get('pin');
    if (urlPin) {
      setPinInput(urlPin);
      setRole('STUDENT');
    }

    // Recover playerId from localStorage
    const savedPlayerId = localStorage.getItem('math_games_player_id');
    if (savedPlayerId) {
      setPlayerId(savedPlayerId);
    } else {
      const newId = 'p_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('math_games_player_id', newId);
      setPlayerId(newId);
    }
  }, []);

  useEffect(() => {
    const activePin = gameState?.pin || pinInput;
    if (!activePin || !database) return;

    const roomRef = ref(database, `games/${activePin}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const playersArray = data.players ? Object.entries(data.players).map(([id, p]: [string, any]) => ({
          id,
          ...p
        })) : [];
        
        const solversArray = data.solvers ? Object.values(data.solvers) as string[] : [];

        setGameState({
          ...data,
          players: playersArray,
          solvers: solversArray
        });
        
        if (solversArray.length > 0) {
          setSolvers(solversArray);
        }
      } else {
        if (gameState) {
          setGameState(null);
          setRole(null);
          setError('Играта беше завршена.');
        }
      }
    });

    return () => unsubscribe();
  }, [pinInput, role, gameState?.pin, database]);

  const handleCreateGame = async () => {
    if (!selectedTopic || !database) return;
    setLoading(true);
    setError(null);
    try {
      const content = await generateGameContent(selectedTopic, selectedGameType, grade);
      const pin = generatePin();
      
      const newGameState: GameState = {
        pin,
        topic: selectedTopic,
        type: selectedGameType,
        status: 'WAITING',
        players: [],
        content,
        createdAt: Date.now()
      };
      
      await set(ref(database, `games/${pin}`), {
        ...newGameState,
        players: {}
      });
      setGameState(newGameState);
      setPinInput(pin);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!pinInput || !playerName || !playerId || !database) return;
    setLoading(true);
    setError(null);
    
    try {
      const roomRef = ref(database, `games/${pinInput}`);
      const snapshot = await get(roomRef);
      
      if (!snapshot.exists()) {
        setError('Невалиден PIN код.');
        setLoading(false);
        return;
      }

      const roomData = snapshot.val();
      if (roomData.status !== 'WAITING') {
        setError('Играта е веќе започната.');
        setLoading(false);
        return;
      }

      await update(ref(database, `games/${pinInput}/players/${playerId}`), {
        name: playerName,
        score: 0,
        joinedAt: Date.now()
      });

      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (gameState?.pin && database) {
      await update(ref(database, `games/${gameState.pin}`), {
        status: 'PLAYING'
      });
    }
  };

  const handleEscapeRoomSolved = async () => {
    if (gameState?.pin && playerName && database) {
      const solversRef = ref(database, `games/${gameState.pin}/solvers`);
      await push(solversRef, playerName);
    }
  };

  const closeRoom = async () => {
    if (gameState?.pin && database) {
      await remove(ref(database, `games/${gameState.pin}`));
      setGameState(null);
      setRole(null);
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
    if (!gameState) return;
    
    const correctPassword = gameState.content.riddles
      .map((r: any) => r.answer.toString().toLowerCase().replace(/\s/g, ''))
      .join('');
    
    const studentInput = finalPassword.trim().toLowerCase().replace(/\s/g, '');
    
    if (studentInput === correctPassword) {
      setIsSolved(true);
      handleEscapeRoomSolved();
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

  if (role === 'TEACHER' && gameState && gameState.status === 'WAITING') {
    return (
      <div className="flex flex-col items-center space-y-8 py-8">
        <div className="w-full flex justify-start">
          <button onClick={closeRoom} className="text-sm text-slate-500 hover:text-indigo-600">← Откажи игра</button>
        </div>
        <div className="text-center">
          <h2 className="text-4xl font-black text-indigo-900 tracking-tight mb-2">ПОКАНЕТЕ ГИ УЧЕНИЦИТЕ</h2>
          <p className="text-slate-500">Скенирајте го QR кодот или внесете го PIN кодот</p>
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
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2">
            {gameState.players.map((p: any) => (
              <div key={p.id} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold border border-indigo-100">
                👤 {p.name}
              </div>
            ))}
            {gameState.players.length === 0 && <p className="col-span-2 text-center text-slate-400 italic text-sm py-4">Се чекаат ученици...</p>}
          </div>
        </div>

        <button
          onClick={handleStartGame}
          disabled={gameState.players.length === 0}
          className="px-12 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-xl hover:bg-emerald-600 disabled:opacity-50 shadow-xl transition-all"
        >
          ЗАПОЧНИ ИГРА! 🏁
        </button>
      </div>
    );
  }

  if (role === 'STUDENT' && !gameState) {
    return (
      <div className="max-w-md mx-auto space-y-8 py-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-pink-900">Приклучи се на играта! 🎒</h2>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-pink-50 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">PIN КОД</label>
            <input
              type="text"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="123456"
              className="w-full p-4 text-center text-3xl font-black tracking-widest bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-pink-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">ТВОЕТО ИМЕ</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Внеси име..."
              className="w-full p-4 text-center text-xl font-bold bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-pink-500 outline-none"
            />
          </div>
          <button
            onClick={handleJoinGame}
            disabled={!pinInput || !playerName}
            className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold text-lg hover:bg-pink-700 disabled:opacity-50"
          >
            ВЛЕЗИ ВО ИГРАТА 🚀
          </button>
          {error && <p className="text-red-500 text-center font-medium">{error}</p>}
        </div>
        <button onClick={() => setRole(null)} className="w-full text-slate-400 text-sm">← Назад</button>
      </div>
    );
  }

  if (role === 'STUDENT' && gameState && gameState.status === 'WAITING') {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 py-20 relative">
        <button 
          onClick={async () => {
            if (gameState?.pin && playerId && database) {
              await remove(ref(database, `games/${gameState.pin}/players/${playerId}`));
            }
            setGameState(null);
            setRole(null);
          }} 
          className="absolute top-0 left-0 text-sm text-slate-500 hover:text-pink-600"
        >
          ← Излези
        </button>
        <div className="w-32 h-32 bg-pink-500 rounded-full flex items-center justify-center text-5xl shadow-2xl">👤</div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-pink-900">Здраво, {playerName}!</h2>
          <p className="text-slate-500">Успешно се приклучи на играта.</p>
        </div>
        <div className="bg-white px-8 py-4 rounded-full shadow-md flex items-center gap-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
          <p className="text-sm font-bold text-slate-600">Се чека наставникот...</p>
        </div>
      </div>
    );
  }

  if (gameState && gameState.status === 'PLAYING') {
    const content = gameState.content;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{gameState.type}</p>
            <h3 className="text-lg font-bold text-indigo-900">{gameState.topic}</h3>
          </div>
          <div className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold">
            PIN: {gameState.pin}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl min-h-[500px]">
          {gameState.type === 'BINGO' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-center text-indigo-900">Бинго Картичка 🔢</h3>
              <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
                {Array.from({ length: 25 }).map((_, i) => {
                  if (i === 12) return <div key={i} className="aspect-square bg-indigo-600 text-white flex items-center justify-center rounded-lg font-bold text-[10px]">FREE</div>;
                  const item = content?.questions?.[i > 12 ? i - 1 : i];
                  const isMarked = markedCells.has(i);
                  return (
                    <div 
                      key={i} 
                      onClick={() => toggleMarkCell(i)}
                      className={`aspect-square border rounded-lg flex items-center justify-center p-1 text-[10px] text-center font-bold cursor-pointer transition-all ${isMarked ? 'bg-indigo-600 text-white' : 'bg-slate-50'}`}
                    >
                      {item?.answer || '?'}
                    </div>
                  );
                })}
              </div>
              {role === 'TEACHER' && (
                <div className="p-4 bg-indigo-50 rounded-2xl">
                  {content?.questions?.map((q: any, idx: number) => (
                    <div key={idx} className="text-xs mb-1"><strong>{idx + 1}.</strong> {q.question} ({q.answer})</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {gameState.type === 'ESCAPE_ROOM' && (
            <div className="space-y-8">
              <h3 className="text-2xl font-black text-center text-indigo-900">🔐 Escape Room</h3>
              <div className="grid grid-cols-1 gap-4">
                {content?.riddles?.map((riddle: any, idx: number) => (
                  <div key={idx} className={`p-6 rounded-2xl border-l-4 ${solvedRiddles[idx] ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-indigo-500'}`}>
                    <p className="font-bold mb-2">{riddle.question}</p>
                    {role === 'STUDENT' && !solvedRiddles[idx] && (
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          onChange={(e) => handleEscapeRoomAnswer(idx, e.target.value)}
                          className="flex-1 p-2 border rounded-xl"
                        />
                        <button onClick={() => checkRiddle(idx)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl">Провери</button>
                      </div>
                    )}
                    {solvedRiddles[idx] && <p className="text-emerald-600 font-bold">✅ Точно!</p>}
                    {role === 'TEACHER' && <p className="text-sm text-indigo-400">Одговор: {riddle.answer}</p>}
                  </div>
                ))}
              </div>
              {role === 'STUDENT' && !isSolved && (
                <div className="mt-8 p-6 bg-indigo-900 text-white rounded-3xl text-center">
                  <input 
                    type="text" 
                    placeholder="Лозинка..." 
                    onChange={(e) => setFinalPassword(e.target.value)}
                    className="w-full p-4 mb-4 bg-white/10 rounded-xl text-center"
                  />
                  <button onClick={checkFinalPassword} className="w-full py-4 bg-emerald-500 rounded-xl font-bold">ОТКРИЈ ЈА ЛОЗИНКАТА!</button>
                </div>
              )}
              {isSolved && <div className="p-10 bg-emerald-500 text-white rounded-3xl text-center font-bold">🎉 УСПЕШНО ИЗЛЕЗЕ!</div>}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default MathGames;
