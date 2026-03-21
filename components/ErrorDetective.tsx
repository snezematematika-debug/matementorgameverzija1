
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Lightbulb, 
  RefreshCw, 
  ChevronRight,
  AlertTriangle,
  Fingerprint,
  FileText
} from 'lucide-react';
import { generateErrorDetectiveCase, getContentPackage } from '../services/geminiService';
import Markdown from 'react-markdown';
import { GradeLevel, LessonPackage } from '../types';
import { ArrowLeft } from 'lucide-react';

interface ErrorDetectiveProps {
  grade: GradeLevel;
  initialContent?: string;
}

interface Step {
  content: string;
  isCorrect: boolean;
  errorExplanation?: string;
}

interface Case {
  title: string;
  problem: string;
  steps: Step[];
  finalAdvice: string;
}

const ErrorDetective: React.FC<ErrorDetectiveProps> = ({ grade, initialContent }) => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [fullPackage, setFullPackage] = useState<LessonPackage | null>(null);

  // Initialize from initialContent if provided
  useEffect(() => {
    if (initialContent) {
      try {
        if (initialContent.trim().startsWith('{')) {
          const parsed = JSON.parse(initialContent);
          setFullPackage(parsed);
        } else {
          setFullPackage({ errorDetective: initialContent } as unknown as LessonPackage);
        }
      } catch (e) {
        setFullPackage({ errorDetective: initialContent } as unknown as LessonPackage);
      }
    }
  }, [initialContent]);
  const currentCase = fullPackage?.errorDetective as Case | null;
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const generateCase = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setFullPackage(null);
    setSelectedStepIndex(null);
    setIsSolved(false);
    setAttempts(0);
    setError(null);

    try {
      const data = await getContentPackage(grade, topic);
      if (data && data.errorDetective) {
        setFullPackage(data);
      } else {
        throw new Error("Неуспешно генерирање на случајот.");
      }
    } catch (err: any) {
      console.error("Error generating case:", err);
      setError(err.message || "Се појави грешка при генерирање на случајот. Проверете ја интернет врската или API клучот.");
    } finally {
      setLoading(false);
    }
  };

  const handleStepClick = (index: number) => {
    if (isSolved) return;
    setSelectedStepIndex(index);
    setAttempts(prev => prev + 1);
    
    if (currentCase?.steps[index].isCorrect === false) {
      setIsSolved(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <header className="text-center space-y-4 relative">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 text-orange-600 rounded-full shadow-inner mb-2 border-4 border-white">
          <Search className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Детектив за грешки 🔍</h1>
        <p className="text-slate-500 text-lg font-medium">Пронајди ја грешката во решението и реши го случајот!</p>
      </header>

      {/* Input Section */}
      {!currentCase && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-xl border-2 border-orange-100 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldAlert className="w-32 h-32 text-orange-500" />
          </div>
          
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3 text-orange-700 font-bold">
              <FileText className="w-5 h-5" />
              <span>Која тема ќе ја истражуваме?</span>
            </div>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="На пр: Равенки, Дропки, Плоштина..."
              className="w-full p-5 rounded-2xl border-2 border-orange-50 focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all text-xl font-bold"
            />
            <button
              onClick={generateCase}
              disabled={!topic.trim()}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white py-5 rounded-2xl font-black text-xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-3 group"
            >
              Отвори нов случај <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-start gap-3 text-red-700"
              >
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm font-bold">
                  <p>Грешка при истрагата:</p>
                  <p className="font-medium opacity-80">{error}</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="relative">
            <RefreshCw className="w-16 h-16 text-orange-500 animate-spin" />
            <Fingerprint className="w-8 h-8 text-orange-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-orange-800 font-bold text-xl animate-pulse">Го анализирам местото на злосторството...</p>
        </div>
      )}

      {/* Case View */}
      {currentCase && (
        <div className="space-y-8">
          {/* Case File Header */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-amber-50 border-l-8 border-orange-500 p-8 rounded-r-3xl shadow-md space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">Досие бр. {Math.floor(Math.random() * 10000)}</span>
              <span className="text-slate-400 font-mono text-xs italic">Доверливо</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900">{currentCase.title}</h2>
            <div className="p-4 bg-white/60 rounded-xl border border-orange-100">
              <p className="text-sm font-bold text-orange-800 uppercase tracking-tight mb-1">Проблем:</p>
              <p className="text-xl font-bold text-slate-800">{currentCase.problem}</p>
            </div>
          </motion.div>

          {/* Steps / Evidence */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest mb-2 px-4">
              <AlertTriangle className="w-4 h-4" /> Истражи ги чекорите на осомничениот:
            </div>
            
            <div className="grid gap-4">
              {currentCase.steps.map((step, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleStepClick(index)}
                  disabled={isSolved}
                  className={`w-full text-left p-6 rounded-3xl border-2 transition-all flex items-center justify-between group relative overflow-hidden ${
                    selectedStepIndex === index 
                      ? step.isCorrect 
                        ? 'border-slate-200 bg-slate-50 opacity-60' 
                        : 'border-red-500 bg-red-50 shadow-lg ring-4 ring-red-100'
                      : 'border-slate-100 bg-white hover:border-orange-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-6 relative z-10">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                      selectedStepIndex === index && !step.isCorrect ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="text-xl font-bold text-slate-800">
                      <Markdown>{step.content}</Markdown>
                    </div>
                  </div>

                  <div className="relative z-10">
                    {selectedStepIndex === index && (
                      step.isCorrect ? (
                        <div className="flex items-center gap-2 text-slate-400 font-bold italic">
                          <span>Чисто...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600 font-black animate-bounce">
                          <ShieldAlert className="w-6 h-6" /> ГРЕШКА!
                        </div>
                      )
                    )}
                    {selectedStepIndex !== index && !isSolved && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-orange-400">
                        <Search className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Red Tape Effect for Error */}
                  {selectedStepIndex === index && !step.isCorrect && (
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12 bg-red-600 text-white font-black py-2 px-20 text-4xl whitespace-nowrap">
                        CRIME SCENE
                      </div>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Feedback Section */}
          <AnimatePresence>
            {selectedStepIndex !== null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-8 rounded-[2.5rem] border-2 ${
                  currentCase.steps[selectedStepIndex].isCorrect 
                    ? 'bg-slate-50 border-slate-200 text-slate-600' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-xl'
                }`}
              >
                {!currentCase.steps[selectedStepIndex].isCorrect ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-500 text-white p-3 rounded-2xl">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black">Случајот е решен!</h3>
                        <p className="font-bold text-emerald-700">Одлична детективска работа!</p>
                      </div>
                    </div>
                    
                    <div className="bg-white/60 p-6 rounded-2xl border border-emerald-100">
                      <p className="font-black text-emerald-800 mb-2 uppercase tracking-widest text-xs">Објаснување на грешката:</p>
                      <p className="text-lg font-medium leading-relaxed italic">
                        "{currentCase.steps[selectedStepIndex].errorExplanation}"
                      </p>
                    </div>

                    <div className="flex items-start gap-4 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <Lightbulb className="w-6 h-6 text-indigo-500 shrink-0 mt-1" />
                      <div>
                        <p className="font-black text-indigo-900 mb-1">Совет за во иднина:</p>
                        <p className="text-indigo-800 font-medium">{currentCase.finalAdvice}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setFullPackage(null);
                        setTopic('');
                      }}
                      className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xl hover:bg-slate-800 transition-all shadow-lg"
                    >
                      Следен случај 📂
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <XCircle className="w-8 h-8 text-slate-400" />
                    <p className="text-lg font-bold">Овој чекор изгледа во ред. Продолжи со истрагата, детективе!</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ErrorDetective;
