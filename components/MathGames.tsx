import React, { useState, useEffect } from 'react';
import { ref, set, onValue, update, push, remove, get } from "firebase/database";
// Го увезуваме директно db од твојот firebase.ts фајл
import { db } from "../services/firebase";
import { QRCodeSVG } from 'qrcode.react';
import { GradeLevel, GameType, GameState } from '../types';
import { PROJECT_TOPICS, PROJECT_THEMES } from '../projectTopics';
import { generateGameContent } from '../services/geminiService';
import Loading from './Loading';

const generatePin = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

interface MathGamesProps {
  grade: GradeLevel;
}

const MathGames: React.FC<MathGamesProps> = ({ grade }) => {
  const [role, setRole] = useState<'TEACHER' | 'STUDENT' | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedGameType, setSelectedGameType] = useState<GameType>('BINGO');
  const [markedCells, setMarkedCells] = useState<Set<number>>(new Set());
  const [solvedRiddles, setSolvedRiddles] = useState<boolean[]>([]);
  const [escapeRoomAnswers, setEscapeRoomAnswers] = useState<string[]>([]);
  const [finalPassword, setFinalPassword] = useState('');
  const [isSolved, setIsSolved] = useState(false);

  const filteredTopics = PROJECT_TOPICS.filter(t => t.grade === grade);

  useEffect(() => {
    // Генерирање уникатно ID за играчот ако го нема
    let id = localStorage.getItem('math_games_player_id');
    if (!id) {
      id = 'p_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('math_games_player_id', id);
    }
    setPlayerId(id);
  }, []);

  // СЛУШАЧ ЗА ПРОМЕНИ ВО REALTIME
  useEffect(() => {
    const activePin = gameState?.pin || pinInput;
    if (!activePin || activePin.length < 6) return;

    const roomRef = ref(db, `games/${activePin}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const playersArray = data.players ? Object.entries(data.players).map(([id, p]: [string, any]) => ({
          id,
          ...p
        })) : [];
        
        setGameState({
          ...data,
          players: playersArray
        });
      } else if (gameState) {
        setGameState(null);
        setError('Играта е завршена од наставникот.');
      }
    });

    return () => unsubscribe();
  }, [pinInput, gameState?.pin]);

  const handleCreateGame = async () => {
    if (!selectedTopic) return;
    setLoading(true);
    setError(null);
    try {
      const content = await generateGameContent(selectedTopic, selectedGameType, grade);
      const pin = generatePin();
      
      const newGameState = {
        pin,
        topic: selectedTopic,
        type: selectedGameType,
        status: 'WAITING',
        content,
        createdAt: Date.now(),
        players: {}
      };
      
      await set(ref(db, `games/${pin}`), newGameState);
      setPinInput(pin);
      // gameState ќе се ажурира преку useEffect/onValue
      setLoading(false);
    } catch (err: any) {
      setError("Грешка при креирање: " + err.message);
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!pinInput || !playerName || !playerId) {
        setError("Внесете ПИН и име!");
        return;
    }
    setLoading(true);
    try {
      const snapshot = await get(ref(db, `games/${pinInput}`));
      if (!snapshot.exists()) {
        setError('Невалиден PIN код.');
        setLoading(false);
        return;
      }

      await update(ref(db, `games/${pinInput}/players/${playerId}`), {
        name: playerName,
        joinedAt: Date.now()
      });
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (gameState?.pin) {
      await update(ref(db, `games/${gameState.pin}`), {
        status: 'PLAYING'
      });
    }
  };

  const closeRoom = async () => {
    if (gameState?.pin) {
      await remove(ref(db, `games/${gameState.pin}`));
      setGameState(null);
      setRole(null);
    }
  };

  if (loading) return <Loading message="Се подготвува..." />;

  // ЕКРАН ЗА ИЗБОР НА УЛОГА
  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 py-12">
        <h2 className="text-3xl font-bold text-indigo-900 text-center">Добредојдовте во Мате-Игри! 🎮</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <button onClick={() => setRole('TEACHER')} className="p-8 bg-white border-2 border-indigo-100 rounded-3xl hover:border-indigo-500 shadow-sm transition-all text-center">
            <div className="text-5xl mb-4">👨‍🏫</div>
            <h3 className="text-xl font-bold">Јас сум Наставник</h3>
          </button>
          <button onClick={() => setRole('STUDENT')} className="p-8 bg-white border-2 border-pink-100 rounded-3xl hover:border-pink-500 shadow-sm transition-all text-center">
            <div className="text-5xl mb-4">🎒</div>
            <h3 className="text-xl font-bold">Јас сум Ученик</h3>
          </button>
        </div>
      </div>
    );
  }

  // ЕКРАН ЗА КРЕИРАЊЕ (НАСТАВНИК)
  if (role === 'TEACHER' && !gameState) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Креирај игра</h2>
            <div className="max-h-96 overflow-y-auto p-4 border rounded-xl bg-slate-50">
                {PROJECT_THEMES.filter(t => t.grade === grade).map(theme => (
                    <div key={theme.id} className="mb-4">
                        <p className="text-xs font-bold text-indigo-400 uppercase">{theme.title}</p>
                        {filteredTopics.filter(topic => topic.themeId === theme.id).map(topic => (
                            <button 
                                key={topic.id}
                                onClick={() => setSelectedTopic(topic.name)}
                                className={`w-full text-left p-3 my-1 rounded-lg border ${selectedTopic === topic.name ? 'bg-indigo-600 text-white' : 'bg-white'}`}
                            >
                                {topic.name}
                            </button>
                        ))}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
                {['BINGO', 'ESCAPE_ROOM', 'FLASHCARDS'].map(type => (
                    <button key={type} onClick={() => setSelectedGameType(type as GameType)} className={`p-2 border rounded-lg text-xs ${selectedGameType === type ? 'bg-pink-500 text-white' : ''}`}>
                        {type.replace('_', ' ')}
                    </button>
                ))}
            </div>
            <button onClick={handleCreateGame} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">ГЕНЕРИРАЈ 🚀</button>
        </div>
    );
  }

  // ЧЕКАЛНА (НАСТАВНИК)
  if (role === 'TEACHER' && gameState?.status === 'WAITING') {
    return (
      <div className="flex flex-col items-center space-y-8 text-center">
        <h2 className="text-4xl font-black text-indigo-900">{gameState.pin}</h2>
        <div className="bg-white p-4 border-4 border-indigo-600 rounded-2xl">
          <QRCodeSVG value={`${window.location.origin}/?pin=${gameState.pin}`} size={180} />
        </div>
        <div className="w-full max-w-md">
          <p className="font-bold mb-2 text-slate-600">Приклучени ученици ({gameState.players?.length || 0})</p>
          <div className="flex flex-wrap justify-center gap-2">
            {gameState.players?.map((p: any) => (
              <span key={p.id} className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full font-bold">👤 {p.name}</span>
            ))}
          </div>
        </div>
        <button onClick={handleStartGame} className="px-12 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-xl shadow-xl hover:bg-emerald-600">ЗАПОЧНИ ИГРА! 🏁</button>
        <button onClick={closeRoom} className="text-red-500 text-sm underline">Откажи</button>
      </div>
    );
  }

  // ПРИКЛУЧУВАЊЕ (УЧЕНИК)
  if (role === 'STUDENT' && (!gameState || gameState.status === 'WAITING')) {
    if (gameState?.status === 'WAITING') {
        return (
            <div className="text-center py-20 space-y-6">
                <div className="text-6xl animate-bounce">⏳</div>
                <h2 className="text-2xl font-bold">Здраво {playerName}!</h2>
                <p className="text-slate-500">Се чека наставникот да ја започне играта...</p>
                <button onClick={() => {setGameState(null); setRole(null);}} className="text-slate-400">← Излези</button>
            </div>
        );
    }
    return (
      <div className="max-w-md mx-auto space-y-4 py-12">
        <h2 className="text-2xl font-bold text-center">Приклучи се 🎒</h2>
        <input type="text" placeholder="ПИН КОД" value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="w-full p-4 text-center text-2xl font-bold border-2 rounded-xl" />
        <input type="text" placeholder="Твоето име" value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="w-full p-4 text-center text-xl border-2 rounded-xl" />
        <button onClick={handleJoinGame} className="w-full py-4 bg-pink-600 text-white rounded-xl font-bold">ВЛЕЗИ ВО ИГРА</button>
        {error && <p className="text-red-500 text-center">{error}</p>}
      </div>
    );
  }

  // ЕКРАН ЗА ИГРАЊЕ (PLAYING)
  if (gameState?.status === 'PLAYING') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-indigo-900 text-white p-4 rounded-xl">
            <span className="font-bold">{gameState.topic}</span>
            <span className="bg-white text-indigo-900 px-3 py-1 rounded-lg text-xs font-bold">PIN: {gameState.pin}</span>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 min-h-[400px]">
            {gameState.type === 'BINGO' && (
                <div className="grid grid-cols-5 gap-1">
                    {Array.from({length: 25}).map((_, i) => (
                        <div key={i} className="aspect-square border flex items-center justify-center text-[10px] p-1 text-center bg-slate-50 rounded">
                            {i === 12 ? 'FREE' : (gameState.content?.questions?.[i > 12 ? i-1 : i]?.answer || '?')}
                        </div>
                    ))}
                    {role === 'TEACHER' && (
                        <div className="col-span-5 mt-4 p-4 bg-indigo-50 rounded-xl text-xs">
                            <p className="font-bold mb-2">Прашања за наставникот:</p>
                            {gameState.content?.questions?.map((q: any, i: number) => (
                                <div key={i}>{i+1}. {q.question} = <strong>{q.answer}</strong></div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            {gameState.type === 'ESCAPE_ROOM' && (
                <div className="space-y-4">
                    <h3 className="font-bold text-center">🔐 Реши ги задачите!</h3>
                    {gameState.content?.riddles?.map((r: any, i: number) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-lg border">
                            <p className="text-sm">{r.question}</p>
                            {role === 'TEACHER' && <p className="text-xs text-indigo-500">Одговор: {r.answer}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
        {role === 'TEACHER' && <button onClick={closeRoom} className="w-full py-2 text-red-500 text-sm">Затвори ја играта за сите</button>}
      </div>
    );
  }

  return null;
};

export default MathGames;
