import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Play, 
  ChevronRight, 
  Lightbulb, 
  RotateCcw, 
  CheckCircle2, 
  XCircle,
  Cpu,
  Zap,
  HelpCircle
} from 'lucide-react';
import { checkMateMachineStep, generateMateMachineHint } from '../services/geminiService';
import { GradeLevel } from '../types';

interface MateMachineProps {
  grade: GradeLevel;
  initialProblem?: string;
}

type Difficulty = 'SIMPLE' | 'STANDARD' | 'ADVANCED';

interface Step {
  expression: string;
  isCorrect: boolean;
  feedback?: string;
}

const MateMachine: React.FC<MateMachineProps> = ({ grade, initialProblem }) => {
  const [difficulty, setDifficulty] = useState<Difficulty>('SIMPLE');
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'FINISHED'>('IDLE');
  const [initialExpression, setInitialExpression] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialProblem) {
      setInitialExpression(initialProblem);
      setSteps([{ expression: initialProblem, isCorrect: true }]);
      setGameState('PLAYING');
      setHint(null);
      setError(null);
      setCurrentInput('');
    }
  }, [initialProblem]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  const generateProblem = () => {
    let problem = '';

    if (difficulty === 'SIMPLE') {
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 20) + 1;
      const x = Math.floor(Math.random() * 10) + 1;
      const c = a * x + b;
      problem = `${a}x + ${b} = ${c}`;
    } else if (difficulty === 'STANDARD') {
      const a = Math.floor(Math.random() * 5) + 2;
      const b = Math.floor(Math.random() * 5) + 1;
      const x = Math.floor(Math.random() * 5) + 1;
      const c = a * (x + b);
      problem = `${a}(x + ${b}) = ${c}`;
    } else {
      const a = Math.floor(Math.random() * 3) + 1;
      const b = Math.floor(Math.random() * 5) + 1;
      problem = `Поедностави: (${a}x + ${b})²`;
    }

    setInitialExpression(problem);
    setSteps([{ expression: problem, isCorrect: true }]);
    setGameState('PLAYING');
    setHint(null);
    setError(null);
    setCurrentInput('');
  };

  const handleStepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setHint(null);

    try {
      const lastStep = steps[steps.length - 1].expression;
      const result = await checkMateMachineStep(lastStep, currentInput, initialExpression, difficulty);
      
      if (result.isValid) {
        const newSteps = [...steps, { expression: currentInput, isCorrect: true, feedback: result.feedback }];
        setSteps(newSteps);
        setCurrentInput('');
        
        if (result.isFinal) {
          setGameState('FINISHED');
        }
      } else {
        setError(result.feedback || "Чекорот не е математички исправен. Обиди се повторно!");
      }
    } catch (err: any) {
      setError(err.message || "Грешка при проверка на чекорот.");
    } finally {
      setIsLoading(false);
    }
  };

  const getHint = async () => {
    if (isHintLoading) return;
    setIsHintLoading(true);
    setHint(null);
    try {
      const lastStep = steps[steps.length - 1].expression;
      const hintText = await generateMateMachineHint(lastStep, initialExpression, difficulty);
      setHint(hintText);
    } catch (err: any) {
      setError("Не можев да добијам совет во моментов.");
    } finally {
      setIsHintLoading(false);
    }
  };

  const resetGame = () => {
    setGameState('IDLE');
    setSteps([]);
    setCurrentInput('');
    setHint(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-200">
            <Cpu className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Мате-машина</h1>
            <p className="text-slate-500 font-medium">Алгебарски процесор за чекор-по-чекор решавање</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(['SIMPLE', 'STANDARD', 'ADVANCED'] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              disabled={gameState !== 'IDLE'}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                difficulty === d 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              } disabled:opacity-50`}
            >
              {d === 'SIMPLE' ? 'Едноставно' : d === 'STANDARD' ? 'Стандардно' : 'Напредно'}
            </button>
          ))}
        </div>
      </div>

      {gameState === 'IDLE' ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-12 rounded-[3rem] shadow-xl border-2 border-slate-50 text-center space-y-8"
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse"></div>
            <Cpu className="w-24 h-24 text-indigo-600 relative z-10 mx-auto" />
          </div>
          <div className="max-w-md mx-auto space-y-4">
            <h2 className="text-3xl font-black text-slate-900">Подготвен за обработка?</h2>
            <p className="text-slate-500 text-lg leading-relaxed">
              Внеси го твојот алгебарски израз и дозволи и на машината да те води низ процесот на решавање.
            </p>
          </div>
          <button
            onClick={generateProblem}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-xl shadow-indigo-200 transition-all flex items-center gap-3 mx-auto group"
          >
            Вклучи ја машината <Play className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-emerald-500 font-mono text-xs uppercase tracking-widest">System Active</span>
                </div>
                <div className="text-slate-500 font-mono text-xs">
                  MODE: {difficulty}
                </div>
              </div>

              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar"
              >
                {steps.map((step, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-mono text-xs shrink-0">
                      {idx + 1}
                    </div>
                    <div className={`flex-1 p-4 rounded-2xl font-mono text-lg ${
                      idx === 0 ? 'bg-indigo-900/30 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 text-white'
                    }`}>
                      {step.expression}
                    </div>
                    {idx > 0 && (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                    )}
                  </motion.div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-mono text-xs shrink-0">
                      {steps.length + 1}
                    </div>
                    <div className="flex-1 p-4 rounded-2xl bg-slate-800/50 border border-slate-700 border-dashed">
                      <div className="flex gap-1">
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-indigo-500 rounded-full"></motion.div>
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-indigo-500 rounded-full"></motion.div>
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-indigo-500 rounded-full"></motion.div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {gameState === 'PLAYING' && (
                <form onSubmit={handleStepSubmit} className="relative">
                  <input
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder="Внеси го следниот чекор..."
                    disabled={isLoading}
                    className="w-full bg-slate-800 text-white border-2 border-slate-700 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:border-indigo-500 transition-all font-mono text-lg"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !currentInput.trim()}
                    className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white px-4 rounded-xl transition-all"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </form>
              )}

              {gameState === 'FINISHED' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-500/20 border border-emerald-500/50 p-6 rounded-3xl text-center space-y-4"
                >
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-emerald-400">Обработката е завршена!</h3>
                  <p className="text-emerald-100 font-medium">Успешно го реши алгебарскиот проблем.</p>
                  <button
                    onClick={resetGame}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-all"
                  >
                    Нова задача
                  </button>
                </motion.div>
              )}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600"
              >
                <XCircle className="w-5 h-5 shrink-0" />
                <p className="font-medium text-sm">{error}</p>
              </motion.div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
              <h3 className="font-black text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-400" /> Контроли
              </h3>
              
              <button
                onClick={getHint}
                disabled={isHintLoading || gameState !== 'PLAYING'}
                className="w-full bg-amber-50 hover:bg-amber-100 disabled:opacity-50 text-amber-700 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border border-amber-100 group"
              >
                <Lightbulb className={`w-5 h-5 ${isHintLoading ? 'animate-pulse' : 'group-hover:fill-amber-500'}`} />
                {isHintLoading ? 'Машината размислува...' : 'Побарај подмачкување'}
              </button>

              <button
                onClick={resetGame}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border border-slate-100"
              >
                <RotateCcw className="w-5 h-5" /> Ресетирај ја машината
              </button>
            </div>

            <AnimatePresence>
              {hint && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-indigo-900 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl"
                >
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-300">
                      <Zap className="w-4 h-4 fill-indigo-300" />
                      <span className="text-xs font-bold uppercase tracking-widest">Совет од AI</span>
                    </div>
                    <p className="text-sm leading-relaxed font-medium italic">
                      {hint}
                    </p>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl"></div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-6 text-white relative overflow-hidden">
              <div className="relative z-10 flex flex-col items-center text-center space-y-2">
                <div className="flex gap-2 mb-2">
                  {[1, 2, 3].map(i => (
                    <motion.div
                      key={i}
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 4, ease: "linear", delay: i * 0.5 }}
                      className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full"
                    />
                  ))}
                </div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-70">Algebra Engine v2.0</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MateMachine;
