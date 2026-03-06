import React, { useState, useEffect } from 'react';
import { ref, set, onValue, update, remove, get, push } from "firebase/database";
import { db } from "../services/firebase"; // Директен импорт
import { QRCodeSVG } from 'qrcode.react';
import { GradeLevel, GameType, GameState } from '../types';
import { PROJECT_TOPICS, PROJECT_THEMES } from '../projectTopics';
import { generateGameContent } from '../services/geminiService';
import Loading from './Loading';

const generatePin = () => Math.floor(100000 + Math.random() * 900000).toString();

const MathGames: React.FC<{ grade: GradeLevel }> = ({ grade }) => {
  const [role, setRole] = useState<'TEACHER' | 'STUDENT' | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [pinInput, setPinInput] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedGameType, setSelectedGameType] = useState<GameType>('BINGO');
  const [markedCells, setMarkedCells] = useState<Set<number>>(new Set());

  const filteredTopics = PROJECT_TOPICS.filter(t => t.grade === grade);

  useEffect(() => {
    let id = localStorage.getItem('math_games_player_id') || 'p_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('math_games_player_id', id);
    setPlayerId(id);
  }, []);

  useEffect(() => {
    const activePin = gameState?.pin || pinInput;
    if (!activePin || activePin.length < 6) return;
    const roomRef = ref(db, `games/${activePin}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const playersArray = data.players ? Object.entries(data.players).map(([id, p]: [any, any]) => ({ id, ...p })) : [];
        setGameState({ ...data, players: playersArray });
      } else {
        setGameState(null);
      }
    });
    return () => unsubscribe();
  }, [pinInput, gameState?.pin]);

  const handleCreateGame = async () => {
    if (!selectedTopic) return;
    setLoading(true);
    try {
      const content = await generateGameContent(selectedTopic, selectedGameType, grade);
      const pin = generatePin();
      // ОВА ГАРАНТИРА ДЕКА ПОДАТОЦИТЕ СЕ ЗАПИШАНИ ПРАВИЛНО
      const newRoom = { 
        pin, 
        topic: selectedTopic, 
        type: selectedGameType, 
        status: 'WAITING', 
        content: content, 
        createdAt: Date.now() 
      };
      await set(ref(db, `games/${pin}`), newRoom);
      setPinInput(pin);
      setLoading(false);
    } catch (err: any) {
      setError("AI Грешка: " + err.message);
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!pinInput || !playerName || !playerId) return;
    setLoading(true);
    const snapshot = await get(ref(db, `games/${pinInput}`));
    if (snapshot.exists()) {
      await update(ref(db, `games/${pinInput}/players/${playerId}`), { name: playerName, joinedAt: Date.now() });
      setLoading(false);
    } else {
      setError("Невалиден ПИН код");
      setLoading(false);
    }
  };

  const handleStartGame = () => {
    if (gameState?.pin) update(ref(db, `games/${gameState.pin}`), { status: 'PLAYING' });
  };

  const closeRoom = () => {
    if (gameState?.pin) remove(ref(db, `games/${gameState.pin}`));
    setGameState(null);
    setRole(null);
  };

  if (loading) return <Loading message="AI го креира вашиот предизвик..." />;

  // 1. ПОЧЕТЕН ЕКРАН (УБАВИОТ ДИЗАЈН)
  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 py-12">
        <h2 className="text-3xl font-bold text-indigo-900">Добредојдовте во Мате-Игри! 🎮</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <button onClick={() => setRole('TEACHER')} className="p-8 bg-white border-2 border-indigo-100 rounded-3xl hover:border-indigo-500 hover:shadow-xl transition-all group">
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform text-center">👨‍🏫</div>
            <h3 className="text-xl font-bold text-indigo-900 text-center">Јас сум Наставник</h3>
          </button>
          <button onClick={() => setRole('STUDENT')} className="p-8 bg-white border-2 border-pink-100 rounded-3xl hover:border-pink-500 hover:shadow-xl transition-all group">
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform text-center">🎒</div>
            <h3 className="text-xl font-bold text-pink-900 text-center">Јас сум Ученик</h3>
          </button>
        </div>
      </div>
    );
  }

  // 2. КРЕИРАЊЕ ИГРА (ВРАТЕНИ ТЕМИ ПО КАТЕГОРИИ)
  if (role === 'TEACHER' && !gameState) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-indigo-900">Креирај нова игра ({grade} одд)</h2>
          <button onClick={() => setRole(null)} className="text-sm text-slate-500 underline">← Назад</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-widest">1. Избери тема:</label>
            <div className="max-h-[400px] overflow-y-auto p-4 border border-slate-100 rounded-2xl bg-slate-50/50 custom-scrollbar space-y-4">
              {PROJECT_THEMES.filter(theme => theme.grade === grade).map(theme => {
                const themeTopics = filteredTopics.filter(t => t.themeId === theme.id);
                if (themeTopics.length === 0) return null;
                return (
                  <div key={theme.id} className="space-y-2">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                      <span className="w-8 h-[1px] bg-indigo-100"></span>{theme.title}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {themeTopics.map(topic => (
                        <button key={topic.id} onClick={() => setSelectedTopic(topic.name)}
                          className={`p-3 text-left rounded-xl border-2 transition-all text-sm font-bold ${selectedTopic === topic.name ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-white bg-white hover:border-indigo-200 shadow-sm'}`}>
                          {topic.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-widest">2. Избери тип на игра:</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'BINGO', name: 'Бинго', icon: '🔢' },
                { id: 'ESCAPE_ROOM', name: 'Escape Room', icon: '🔐' },
                { id: 'FLASHCARDS', name: 'Флеш картички', icon: '🗂️' },
                { id: 'PASSWORD', name: 'Лозинка', icon: '⌨️' }
              ].map(game => (
                <button key={game.id} onClick={() => setSelectedGameType(game.id as GameType)}
                  className={`p-4 flex flex-col items-center justify-center rounded-2xl border-2 transition-all ${selectedGameType === game.id ? 'border-pink-500 bg-pink-50 text-pink-900' : 'border-slate-100 hover:border-pink-200 bg-white'}`}>
                  <span className="text-2xl mb-1">{game.icon}</span>
                  <span className="text-xs font-bold">{game.name}</span>
                </button>
              ))}
            </div>
            <button onClick={handleCreateGame} disabled={!selectedTopic} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 shadow-lg mt-4 transition-all">Генерирај предизвик 🚀</button>
          </div>
        </div>
      </div>
    );
  }

  // 3. ЧЕКАЛНА (ПИН И УЧЕНИЦИ)
  if (gameState?.status === 'WAITING') {
    return (
      <div className="flex flex-col items-center space-y-8 py-8 text-center">
        <h2 className="text-4xl font-black text-indigo-900 uppercase tracking-tight">ПОКАНЕТЕ ГИ УЧЕНИЦИТЕ</h2>
        <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
          <div className="bg-white p-3 border rounded-3xl"><QRCodeSVG value={`${window.location.origin}/?pin=${gameState.pin}`} size={150} /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">PIN КОД</p>
            <p className="text-7xl font-black text-indigo-600 tracking-tighter">{gameState.pin}</p>
          </div>
        </div>
        <div className="w-full max-w-md">
          <p className="font-bold text-slate-700 mb-4">Приклучени ({gameState.players?.length || 0})</p>
          <div className="flex flex-wrap justify-center gap-2">
            {gameState.players?.map((p: any) => <span key={p.id} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold border border-indigo-100 animate-in fade-in zoom-in">👤 {p.name}</span>)}
          </div>
        </div>
        {role === 'TEACHER' && <button onClick={handleStartGame} disabled={gameState.players?.length === 0} className="px-12 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-xl hover:bg-emerald-600 shadow-xl transition-all">ЗАПОЧНИ ИГРА! 🏁</button>}
      </div>
    );
  }

  // 4. ЕКРАН ЗА ИГРАЊЕ (ВРАТЕНИ ПРАШАЊА)
  if (gameState?.status === 'PLAYING') {
    const { content, type } = gameState;
    const questions = content?.questions || content?.riddles || content?.cards || content?.tasks || [];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div><p className="text-xs font-bold text-indigo-400 uppercase">{type}</p><h3 className="text-lg font-bold text-indigo-900">{gameState.topic}</h3></div>
          <div className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold">PIN: {gameState.pin}</div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl min-h-[400px]">
          {type === 'BINGO' ? (
            <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
              {Array.from({ length: 25 }).map((_, i) => {
                const q = questions[i > 12 ? i - 1 : i];
                return (
                  <div key={i} className={`aspect-square border rounded-lg flex items-center justify-center p-1 text-[10px] text-center font-bold ${i === 12 ? 'bg-indigo-600 text-white' : 'bg-slate-50 hover:bg-indigo-50 cursor-pointer'}`}>
                    {i === 12 ? 'FREE' : (q?.answer || '?')}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q: any, i: number) => (
                <div key={i} className="p-6 bg-slate-50 rounded-2xl border-l-4 border-indigo-500 animate-in slide-in-from-left">
                  <p className="font-bold text-indigo-900 mb-2">Загатка {i + 1}:</p>
                  <p className="text-slate-700">{q.question}</p>
                  {role === 'TEACHER' && <p className="mt-2 text-emerald-600 font-bold text-sm">✅ Одговор: {q.answer}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
        {role === 'TEACHER' && <button onClick={closeRoom} className="w-full py-2 text-red-500 text-sm hover:underline">Заврши ја играта за сите</button>}
      </div>
    );
  }

  // 5. ЕКРАН ЗА ПРИКЛУЧУВАЊЕ (УЧЕНИК)
  if (role === 'STUDENT' && !gameState) {
    return (
        <div className="max-w-md mx-auto space-y-8 py-12">
            <h2 className="text-3xl font-bold text-pink-900 text-center uppercase">Приклучи се! 🎒</h2>
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border space-y-4">
                <input type="text" placeholder="PIN КОД" value={pinInput} onChange={e => setPinInput(e.target.value)} className="w-full p-4 border-2 rounded-2xl text-center text-3xl font-black outline-none focus:border-pink-500" />
                <input type="text" placeholder="ТВОЕТО ИМЕ" value={playerName} onChange={e => setPlayerName(e.target.value)} className="w-full p-4 border-2 rounded-2xl text-center text-xl font-bold outline-none focus:border-pink-500" />
                <button onClick={handleJoinGame} className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold hover:bg-pink-700 transition-all">ВЛЕЗИ ВО ИГРА 🚀</button>
            </div>
            {error && <p className="text-red-500 text-center font-bold">{error}</p>}
        </div>
    );
  }

  return null;
};

export default MathGames;
