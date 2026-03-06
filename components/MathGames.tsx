import React, { useState, useEffect } from 'react';
import { ref, set, onValue, update, remove, get } from "firebase/database";
import { db } from "../services/firebase";
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
      const newRoom = { pin, topic: selectedTopic, type: selectedGameType, status: 'WAITING', content, createdAt: Date.now() };
      await set(ref(db, `games/${pin}`), newRoom);
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
    const snapshot = await get(ref(db, `games/${pinInput}`));
    if (snapshot.exists()) {
      await update(ref(db, `games/${pinInput}/players/${playerId}`), { name: playerName, joinedAt: Date.now() });
      setLoading(false);
    } else {
      setError("Невалиден ПИН");
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

  if (loading) return <Loading message="Се подготвува..." />;

  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 py-12">
        <h2 className="text-3xl font-bold text-indigo-900">Мате-Игри 🎮</h2>
        <div className="flex gap-4">
          <button onClick={() => setRole('TEACHER')} className="p-8 bg-white border-2 rounded-3xl hover:border-indigo-500">👨‍🏫 Наставник</button>
          <button onClick={() => setRole('STUDENT')} className="p-8 bg-white border-2 rounded-3xl hover:border-pink-500">🎒 Ученик</button>
        </div>
      </div>
    );
  }

  if (role === 'TEACHER' && !gameState) {
    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <h3 className="font-bold">Избери тема и игра:</h3>
        <select onChange={(e) => setSelectedTopic(e.target.value)} className="w-full p-3 border rounded-xl">
            <option value="">-- Избери тема --</option>
            {PROJECT_TOPICS.filter(t => t.grade === grade).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
            {['BINGO', 'ESCAPE_ROOM', 'FLASHCARDS', 'PASSWORD'].map(t => (
                <button key={t} onClick={() => setSelectedGameType(t as any)} className={`p-3 border rounded-xl ${selectedGameType === t ? 'bg-indigo-600 text-white' : ''}`}>{t}</button>
            ))}
        </div>
        <button onClick={handleCreateGame} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold">КРЕИРАЈ ИГРА 🚀</button>
      </div>
    );
  }

  if (gameState?.status === 'WAITING') {
    return (
      <div className="text-center space-y-6">
        <h2 className="text-5xl font-black text-indigo-600">{gameState.pin}</h2>
        {role === 'TEACHER' ? (
          <>
            <div className="flex flex-wrap justify-center gap-2">
              {gameState.players?.map((p: any) => <span key={p.id} className="bg-indigo-100 px-3 py-1 rounded-full text-sm">👤 {p.name}</span>)}
            </div>
            <button onClick={handleStartGame} className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold">ЗАПОЧНИ ИГРА</button>
          </>
        ) : (
          <p className="animate-pulse">Се чека наставникот...</p>
        )}
      </div>
    );
  }

  if (role === 'STUDENT' && !gameState) {
    return (
        <div className="max-w-md mx-auto space-y-4">
            <input type="text" placeholder="ПИН" value={pinInput} onChange={e => setPinInput(e.target.value)} className="w-full p-4 border-2 rounded-xl text-center text-2xl" />
            <input type="text" placeholder="Твоето име" value={playerName} onChange={e => setPlayerName(e.target.value)} className="w-full p-4 border-2 rounded-xl text-center" />
            <button onClick={handleJoinGame} className="w-full py-4 bg-pink-600 text-white rounded-xl font-bold">ВЛЕЗИ</button>
        </div>
    );
  }

  if (gameState?.status === 'PLAYING') {
    const { content, type } = gameState;
    return (
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <h3 className="text-center font-bold mb-4">{type} - {gameState.topic}</h3>
          
          {/* КАРТИЧКИ ЗА BINGO */}
          {type === 'BINGO' && (
            <div className="grid grid-cols-5 gap-2">
              {(content?.questions || Array(24).fill({answer: '?'})).map((q: any, i: number) => (
                <div key={i} className="aspect-square border flex items-center justify-center text-[10px] text-center p-1 bg-slate-50 rounded cursor-pointer hover:bg-indigo-100">
                  {i === 12 ? 'FREE' : q.answer}
                </div>
              ))}
            </div>
          )}

          {/* ЗАДАЧИ ЗА ESCAPE ROOM / PASSWORD */}
          {(type === 'ESCAPE_ROOM' || type === 'PASSWORD') && (
            <div className="space-y-4">
              {(content?.riddles || content?.tasks || []).map((r: any, i: number) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border">
                  <p className="font-bold">Задачa {i + 1}:</p>
                  <p>{r.question}</p>
                  {role === 'TEACHER' && <p className="text-indigo-600 text-sm">Одговор: {r.answer}</p>}
                </div>
              ))}
            </div>
          )}

          {/* FLASHCARDS */}
          {type === 'FLASHCARDS' && (
             <div className="grid grid-cols-1 gap-4">
                {(content?.cards || []).map((c: any, i: number) => (
                    <div key={i} className="p-6 border-2 border-dashed rounded-xl text-center">
                        <p className="text-xl font-bold">{c.question}</p>
                        <p className="mt-2 text-indigo-500 font-bold">Одговор: {c.answer}</p>
                    </div>
                ))}
             </div>
          )}
        </div>
        {role === 'TEACHER' && <button onClick={closeRoom} className="w-full text-red-500 underline text-sm">Затвори игра</button>}
      </div>
    );
  }

  return null;
};

export default MathGames;
