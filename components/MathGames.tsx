import React, { useState, useEffect } from 'react';
import { ref, set, onValue, update, remove, get } from "firebase/database";
import { db } from "../services/firebase";
import { QRCodeSVG } from 'qrcode.react';
import { GradeLevel, GameType } from '../types';
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
      const newRoom = { 
        pin, 
        topic: selectedTopic, 
        type: selectedGameType, 
        status: 'WAITING', 
        content, 
        createdAt: Date.now() 
      };
      await set(ref(db, `games/${pin}`), newRoom);
      setPinInput(pin);
      setLoading(false);
    } catch (err: any) {
      setError("Грешка: " + err.message);
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
      setError("Невалиден ПИН");
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Се подготвува..." />;

  // 1. ИЗБОР НА УЛОГА
  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 py-12">
        <h2 className="text-3xl font-bold text-indigo-900">Мате-Игри 🎮</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <button onClick={() => setRole('TEACHER')} className="p-8 bg-white border-2 border-indigo-100 rounded-3xl hover:border-indigo-500 shadow-lg transition-all">
            <div className="text-5xl mb-4 text-center">👨‍🏫</div>
            <h3 className="text-xl font-bold text-center">Наставник</h3>
          </button>
          <button onClick={() => setRole('STUDENT')} className="p-8 bg-white border-2 border-pink-100 rounded-3xl hover:border-pink-500 shadow-lg transition-all">
            <div className="text-5xl mb-4 text-center">🎒</div>
            <h3 className="text-xl font-bold text-center">Ученик</h3>
          </button>
        </div>
      </div>
    );
  }

  // 2. ИНТЕРФЕЈС ЗА НАСТАВНИК (СО КАТЕГОРИИ)
  if (role === 'TEACHER' && !gameState) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Креирај нова игра</h2>
          <button onClick={() => setRole(null)} className="text-sm text-slate-500">← Назад</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="font-bold text-sm text-slate-600 uppercase">Избери Тема:</label>
            <div className="max-h-96 overflow-y-auto p-4 border rounded-2xl bg-slate-50 space-y-4">
              {PROJECT_THEMES.filter(theme => theme.grade === grade).map(theme => {
                const themeTopics = filteredTopics.filter(t => t.themeId === theme.id);
                if (themeTopics.length === 0) return null;
                return (
                  <div key={theme.id}>
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase mb-2">-- {theme.title} --</h4>
                    <div className="space-y-1">
                      {themeTopics.map(topic => (
                        <button key={topic.id} onClick={() => setSelectedTopic(topic.name)}
                          className={`w-full text-left p-3 rounded-xl border-2 text-sm font-bold ${selectedTopic === topic.name ? 'border-indigo-500 bg-indigo-50' : 'bg-white border-transparent shadow-sm'}`}>
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
            <label className="font-bold text-sm text-slate-600 uppercase">Избери Тип:</label>
            <div className="grid grid-cols-2 gap-2">
              {['BINGO', 'ESCAPE_ROOM', 'FLASHCARDS', 'PASSWORD'].map(type => (
                <button key={type} onClick={() => setSelectedGameType(type as any)} className={`p-4 border-2 rounded-2xl font-bold text-xs ${selectedGameType === type ? 'border-pink-500 bg-pink-50' : 'bg-white'}`}>{type}</button>
              ))}
            </div>
            <button onClick={handleCreateGame} disabled={!selectedTopic} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl mt-4">ГЕНЕРИРАЈ 🚀</button>
          </div>
        </div>
      </div>
    );
  }

  // 3. ПРИКЛУЧУВАЊЕ ЗА УЧЕНИК
  if (role === 'STUDENT' && !gameState) {
    return (
      <div className="max-w-md mx-auto space-y-6 py-12">
        <h2 className="text-3xl font-bold text-center text-pink-600">ВЛЕЗИ ВО ИГРА 🎒</h2>
        <div className="bg-white p-8 rounded-3xl shadow-xl space-y-4 border">
          <input type="text" placeholder="ПИН КОД" value={pinInput} onChange={e => setPinInput(e.target.value)} className="w-full p-4 border-2 rounded-2xl text-center text-3xl font-black" />
          <input type="text" placeholder="ТВОЕТО ИМЕ" value={playerName} onChange={e => setPlayerName(e.target.value)} className="w-full p-4 border-2 rounded-2xl text-center text-xl font-bold" />
          <button onClick={handleJoinGame} className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold text-lg">ВЛЕЗИ 🚀</button>
        </div>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <button onClick={() => setRole(null)} className="w-full text-slate-400">← Назад</button>
      </div>
    );
  }

  // 4. ЕКРАН ЗА ЧЕКАЊЕ И ИГРАЊЕ
  if (gameState) {
    const isPlaying = gameState.status === 'PLAYING';
    const questions = gameState.content?.questions || gameState.content?.riddles || gameState.content?.cards || [];

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-md flex justify-between items-center border">
          <div><p className="text-xs font-bold text-indigo-400 uppercase">{gameState.type}</p><h3 className="text-lg font-bold">{gameState.topic}</h3></div>
          <div className="text-2xl font-black text-indigo-600">PIN: {gameState.pin}</div>
        </div>

        {!isPlaying ? (
          <div className="text-center py-10 space-y-6 bg-white rounded-3xl shadow-xl border">
            <h2 className="text-2xl font-bold italic">Се чека почеток...</h2>
            <div className="flex flex-wrap justify-center gap-2 px-4">
              {gameState.players?.map((p: any) => <span key={p.id} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold border border-indigo-100">👤 {p.name}</span>)}
            </div>
            {role === 'TEACHER' && (
              <button onClick={() => update(ref(db, `games/${gameState.pin}`), { status: 'PLAYING' })} className="px-10 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-xl shadow-lg">ЗАПОЧНИ ИГРА! 🏁</button>
            )}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-3xl shadow-xl border min-h-[400px]">
            {gameState.type === 'BINGO' ? (
              <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className={`aspect-square border rounded-lg flex items-center justify-center p-1 text-[10px] text-center font-bold ${i === 12 ? 'bg-indigo-600 text-white' : 'bg-slate-50'}`}>
                    {i === 12 ? 'FREE' : (questions[i > 12 ? i - 1 : i]?.answer || '?')}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q: any, i: number) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-xl border-l-4 border-indigo-500">
                    <p className="font-bold text-indigo-900">Задача {i + 1}:</p>
                    <p className="text-slate-700">{q.question}</p>
                    {role === 'TEACHER' && <p className="mt-1 text-emerald-600 font-bold text-sm">Одговор: {q.answer}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {role === 'TEACHER' && <button onClick={() => { remove(ref(db, `games/${gameState.pin}`)); setGameState(null); setRole(null); }} className="w-full text-red-500 text-xs">Затвори соба</button>}
      </div>
    );
  }

  return null;
};

export default MathGames;
