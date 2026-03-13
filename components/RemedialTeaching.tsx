
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  ChevronRight, 
  Lightbulb, 
  CheckCircle2, 
  Brain,
  MessageSquare,
  RefreshCw,
  HelpCircle,
  BookOpen,
  Search,
  X,
  Info,
  AlertTriangle
} from 'lucide-react';
import { generateRemedialDecomposition, getContentPackage } from '../services/geminiService';
import Markdown from 'react-markdown';
import { GradeLevel, LessonPackage } from '../types';

interface RemedialTeachingProps {
  grade: GradeLevel;
}

interface Step {
  title: string;
  explanation: string;
  hint?: string;
  visualAid?: string;
}

interface Decomposition {
  problem: string;
  prerequisites: string[];
  steps: Step[];
  summary: string;
}

interface GlossaryTerm {
  term: string;
  definition: string;
  visual: string; // Emoji or simple description
  category: string;
}

const GLOSSARY_DATA: GlossaryTerm[] = [
  { term: "Дропка", definition: "Дел од една целина. Се состои од броител (горе) и именител (долу).", visual: "🍕", category: "Броеви" },
  { term: "Равенка", definition: "Математичка реченица со знак еднакво (=) каде бараме непознат број (x).", visual: "⚖️", category: "Алгебра" },
  { term: "Агол", definition: "Простор помеѓу две линии кои се спојуваат во една точка.", visual: "📐", category: "Геометрија" },
  { term: "Периметар", definition: "Должината на сите страни на една фигура собрани заедно. Како ограда околу двор.", visual: "📏", category: "Геометрија" },
  { term: "Плоштина", definition: "Големината на површината што ја зафаќа една фигура. Како тепих во соба.", visual: "🟦", category: "Геометрија" },
  { term: "Процент", definition: "Дел од сто. Се означува со симболот %.", visual: "💯", category: "Броеви" },
  { term: "Паралелни линии", definition: "Линии кои секогаш се на исто растојание и никогаш не се сечат.", visual: "🛤️", category: "Геометрија" },
  { term: "НЗС", definition: "Најмал заеднички содржател. Најмалиот број што може да се подели со два други броја.", visual: "🔢", category: "Броеви" },
];

const RemedialTeaching: React.FC<RemedialTeachingProps> = ({ grade }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fullPackage, setFullPackage] = useState<LessonPackage | null>(null);
  const decomposition = fullPackage?.remedial as Decomposition | null;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const filteredGlossary = useMemo(() => {
    return GLOSSARY_DATA.filter(item => 
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const generateDecomposition = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setFullPackage(null);
    setCurrentStepIndex(0);
    setShowHint(false);
    setError(null);

    try {
      const data = await getContentPackage(grade, input);
      if (data && data.remedial) {
        setFullPackage(data);
      } else {
        throw new Error("Не успеавме да ја разложиме задачата. Обидете се повторно.");
      }
    } catch (err: any) {
      console.error("Error generating decomposition:", err);
      setError(err.message || "Се појави грешка при генерирање на чекорите. Проверете ја интернет врската или API клучот.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (decomposition && currentStepIndex < decomposition.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setShowHint(false);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setShowHint(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 relative">
      {/* Glossary Sidebar Toggle Button */}
      <button
        onClick={() => setShowGlossary(true)}
        className="fixed bottom-8 right-8 bg-emerald-500 text-white p-4 rounded-full shadow-2xl hover:bg-emerald-600 transition-all z-40 flex items-center gap-2 group"
      >
        <BookOpen className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold whitespace-nowrap">Визуелен поимник</span>
      </button>

      {/* Glossary Sidebar Overlay */}
      <AnimatePresence>
        {showGlossary && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGlossary(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500 p-2 rounded-xl text-white">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">Визуелен поимник</h2>
                </div>
                <button onClick={() => setShowGlossary(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Пребарај поим..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-400 focus:ring-0 transition-all font-medium"
                  />
                </div>

                <div className="space-y-4">
                  {filteredGlossary.length > 0 ? (
                    filteredGlossary.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-3xl bg-white p-3 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                            {item.visual}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900">{item.term}</h3>
                              <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {item.category}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">{item.definition}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-10 space-y-3">
                      <div className="text-4xl">🔍</div>
                      <p className="text-slate-400 font-bold">Нема резултати за "{searchTerm}"</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <div className="flex items-center gap-3 text-slate-500 text-xs font-bold">
                  <Info className="w-4 h-4" />
                  <span>Поимникот постојано се дополнува со нови визуелни објаснувања.</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <header className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl shadow-sm mb-2">
          <Brain className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-black text-slate-900">Дополнителна настава 🤝</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
          Математика без страв! Тука ги разложуваме тешките задачи на мали и лесни чекори.
        </p>
      </header>

      {/* Input Section */}
      {!decomposition && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-emerald-100"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-emerald-700 font-bold">
              <MessageSquare className="w-5 h-5" />
              <span>Што сакаш да научиме денес?</span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="На пример: Како се собираат дропки со различни именители? или Реши ја равенката 2x + 5 = 13"
              className="w-full h-32 p-6 rounded-3xl border-2 border-emerald-50 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all text-lg font-medium resize-none"
            />
            <button
              onClick={generateDecomposition}
              disabled={!input.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-5 rounded-3xl font-black text-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-3 group"
            >
              Започни со учење <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            </button>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-start gap-3 text-red-700"
              >
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm font-bold">
                  <p>Грешка при подготовката:</p>
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
            <RefreshCw className="w-16 h-16 text-emerald-500 animate-spin" />
            <Brain className="w-8 h-8 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-emerald-800 font-bold text-xl animate-pulse">Ги подготвувам чекорите за тебе...</p>
        </div>
      )}

      {/* Decomposition View */}
      {decomposition && (
        <div className="space-y-8">
          {/* Prerequisites Card */}
          {currentStepIndex === 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex items-start gap-4"
            >
              <div className="bg-amber-200 p-2 rounded-xl text-amber-700">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 mb-1">Пред да почнеме, добро е да знаеш:</h3>
                <ul className="list-disc list-inside text-amber-800 text-sm font-medium space-y-1">
                  {decomposition.prerequisites.map((pre, i) => (
                    <li key={i}>{pre}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}

          {/* Main Step Card */}
          <div className="relative min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStepIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-emerald-50 relative overflow-hidden"
              >
                {/* Step Counter */}
                <div className="absolute top-8 right-8 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-2xl font-black text-sm">
                  Чекор {currentStepIndex + 1} од {decomposition.steps.length}
                </div>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <span className="text-emerald-500 font-black uppercase tracking-widest text-xs">Ајде да видиме...</span>
                    <h2 className="text-3xl font-black text-slate-900">{decomposition.steps[currentStepIndex].title}</h2>
                  </div>

                  <div className="prose prose-emerald max-w-none">
                    <div className="text-xl text-slate-700 leading-relaxed font-medium">
                      <Markdown>{decomposition.steps[currentStepIndex].explanation}</Markdown>
                    </div>
                  </div>

                  {decomposition.steps[currentStepIndex].visualAid && (
                    <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 flex items-start gap-4">
                      <div className="bg-white p-2 rounded-xl shadow-sm text-emerald-500">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <p className="text-emerald-800 italic font-medium">
                        <span className="font-bold not-italic">Замисли си:</span> {decomposition.steps[currentStepIndex].visualAid}
                      </p>
                    </div>
                  )}

                  {/* Hint Section */}
                  {decomposition.steps[currentStepIndex].hint && (
                    <div className="space-y-3">
                      <button 
                        onClick={() => setShowHint(!showHint)}
                        className="text-emerald-600 font-bold text-sm flex items-center gap-2 hover:text-emerald-700 transition-colors"
                      >
                        <HelpCircle className="w-4 h-4" /> {showHint ? 'Скриј го советот' : 'Ми треба мала помош?'}
                      </button>
                      <AnimatePresence>
                        {showHint && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-indigo-800 text-sm font-medium"
                          >
                            💡 {decomposition.steps[currentStepIndex].hint}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              className="px-8 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-0 transition-all flex items-center gap-2"
            >
              Назад
            </button>

            {currentStepIndex < decomposition.steps.length - 1 ? (
              <button
                onClick={nextStep}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-lg shadow-emerald-100 transition-all flex items-center gap-3 group"
              >
                Следен чекор <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setFullPackage(null);
                  setInput('');
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-lg shadow-indigo-100 transition-all flex items-center gap-3"
              >
                Заврши <CheckCircle2 className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Summary Card (Only at the end) */}
          {currentStepIndex === decomposition.steps.length - 1 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-emerald-500 to-teal-600 p-10 rounded-[3rem] text-white text-center space-y-4 shadow-xl"
            >
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-black">Браво! Успешно ја заврши задачата! 🌟</h3>
              <p className="text-emerald-50 text-xl font-medium max-w-xl mx-auto">
                {decomposition.summary}
              </p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default RemedialTeaching;
