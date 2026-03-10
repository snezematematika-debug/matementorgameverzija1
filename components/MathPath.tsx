
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dice5, 
  Trophy, 
  ArrowLeft, 
  Users, 
  Play, 
  CheckCircle2, 
  XCircle,
  Flag,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { GradeLevel } from '../types';
import { generateGameContent } from '../services/geminiService';
import Loading from './Loading';

interface MathPathProps {
  grade: GradeLevel;
  onBack: () => void;
}

interface Player {
  id: number;
  name: string;
  position: number;
  color: string;
  skipNextTurn: boolean;
}

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

const MathPath: React.FC<MathPathProps> = ({ grade, onBack }) => {
  const [gameState, setGameState] = useState<'SETUP' | 'PLAYING' | 'FINISHED'>('SETUP');
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: 'Играч 1', position: 0, color: 'bg-indigo-500', skipNextTurn: false },
    { id: 2, name: 'Играч 2', position: 0, color: 'bg-pink-500', skipNextTurn: false },
  ]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [answerInput, setAnswerInput] = useState('');
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);

  const startGame = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    try {
      const content = await generateGameContent(topic, 'BINGO', grade); // Reuse BINGO content for tasks
      if (content && content.questions) {
        setQuestions(content.questions);
        setGameState('PLAYING');
      }
    } catch (error) {
      console.error("Failed to start game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const rollDice = () => {
    if (isRolling || showTask || winner) return;
    
    // Check for penalty
    if (players[currentPlayerIndex].skipNextTurn) {
      const newPlayers = [...players];
      newPlayers[currentPlayerIndex].skipNextTurn = false;
      setPlayers(newPlayers);
      setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
      return;
    }

    setIsRolling(true);
    let rolls = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls > 10) {
        clearInterval(interval);
        setIsRolling(false);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalValue);
        handleMove(finalValue);
      }
    }, 100);
  };

  const handleMove = (steps: number) => {
    const newPlayers = [...players];
    const player = newPlayers[currentPlayerIndex];
    
    let newPos = player.position + steps;
    if (newPos >= PATH.length - 1) {
      newPos = PATH.length - 1;
    }
    
    player.position = newPos;
    setPlayers(newPlayers);

    // Show task
    const qIndex = Math.floor(Math.random() * questions.length);
    setCurrentQuestion(questions[qIndex]);
    setAnswerInput('');
    setFeedback(null);
    setTimeout(() => setShowTask(true), 1000);
  };

  const checkAnswer = () => {
    if (!currentQuestion) return;
    
    const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, '').replace(/х/g, 'x');
    const isCorrect = normalize(answerInput) === normalize(currentQuestion.answer);

    if (isCorrect) {
      setFeedback('CORRECT');
      setTimeout(() => {
        if (players[currentPlayerIndex].position === PATH.length - 1) {
          setWinner(players[currentPlayerIndex]);
          setGameState('FINISHED');
        } else {
          setShowTask(false);
          setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
        }
      }, 1500);
    } else {
      setFeedback('WRONG');
      const newPlayers = [...players];
      newPlayers[currentPlayerIndex].skipNextTurn = true;
      setPlayers(newPlayers);
      setTimeout(() => {
        setShowTask(false);
        setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
      }, 1500);
    }
  };

  if (isLoading) return <Loading message="Се подготвува патеката..." />;

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
            <h1 className="text-2xl font-black text-indigo-950">Математичка Патека</h1>
            <p className="text-slate-500 font-medium">Трка до излезот преку решавање задачи</p>
          </div>
        </div>
        {gameState === 'PLAYING' && (
          <div className="flex items-center gap-4">
            {players.map((p, idx) => (
              <div 
                key={p.id}
                className={`flex items-center gap-3 px-4 py-2 rounded-2xl border-2 transition-all ${
                  currentPlayerIndex === idx ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-100' : 'border-slate-100 bg-white opacity-60'
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${p.color}`} />
                <span className="font-bold text-slate-700">{p.name}</span>
                {p.skipNextTurn && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase">Казна</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {gameState === 'SETUP' ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 text-center space-y-8"
        >
          <div className="w-20 h-20 bg-indigo-100 rounded-[2rem] flex items-center justify-center mx-auto text-indigo-600">
            <Users className="w-10 h-10" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900">Нова Игра</h2>
            <p className="text-slate-500 font-medium">Внесете тема за задачите на патеката</p>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="На пр. Собирање до 100, Равенки..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-center text-lg font-bold"
            />
            <button
              onClick={startGame}
              disabled={!topic.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-5 rounded-2xl font-black text-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-3"
            >
              <Play className="w-6 h-6 fill-current" /> ЗАПОЧНИ ИГРА
            </button>
          </div>
        </motion.div>
      ) : gameState === 'PLAYING' ? (
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
                    <div className="flex gap-1">
                      {players.map(p => p.position === pathIndex && (
                        <motion.div
                          key={p.id}
                          layoutId={`player-${p.id}`}
                          className={`w-6 h-6 rounded-full ${p.color} shadow-lg border-2 border-white`}
                        />
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
              <div className="flex items-center justify-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${players[currentPlayerIndex].color} flex items-center justify-center text-white shadow-lg`}>
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-2xl font-black text-slate-900">{players[currentPlayerIndex].name}</span>
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
                disabled={isRolling || showTask}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-5 rounded-2xl font-black text-xl shadow-lg shadow-indigo-200 transition-all"
              >
                ВРТИ КОЦКА
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
      ) : (
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
            <p className="text-xl text-slate-500 font-medium">Честитки за {winner?.name}</p>
          </div>
          <div className={`p-6 rounded-3xl ${winner?.color} text-white shadow-xl`}>
            <p className="text-sm font-bold uppercase tracking-widest opacity-80 mb-1">Победник</p>
            <p className="text-3xl font-black">{winner?.name}</p>
          </div>
          <button
            onClick={() => setGameState('SETUP')}
            className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3"
          >
            <RotateCcw className="w-6 h-6" /> ИГРАЈ ПОВТОРНО
          </button>
        </motion.div>
      )}

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
              <div className={`${players[currentPlayerIndex].color} p-8 text-white text-center relative`}>
                <div className="absolute top-4 left-4 bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Задача</div>
                <h3 className="text-2xl font-black mt-4">{players[currentPlayerIndex].name} е на ред</h3>
              </div>
              
              <div className="p-10 space-y-8">
                <div className="bg-slate-50 p-8 rounded-3xl border-2 border-slate-100 text-center">
                  <p className="text-2xl font-bold text-slate-800 leading-relaxed">
                    {currentQuestion?.question}
                  </p>
                </div>

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
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MathPath;
