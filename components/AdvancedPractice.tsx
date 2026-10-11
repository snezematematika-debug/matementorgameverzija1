
import React, { useState, useEffect } from 'react';
import { generateAdvancedProblem } from '../services/geminiService';
import { GradeLevel } from '../types';
import Loading from './Loading';
import FormattedText from './FormattedText';

interface AdvancedPracticeProps {
  grade: GradeLevel;
}

const CATEGORIES = [
  { id: 'algebra', title: '🔢 Броеви и Алгебра', description: 'Сложени равенки и низи' },
  { id: 'geometry', title: '📐 Геометрија', description: 'Предизвикувачки форми и докази' },
  { id: 'logic', title: '🧠 Логика и Комбинаторика', description: 'Логички загатки и веројатност' },
  { id: 'word_problems', title: '📝 Текстуални проблеми', description: 'Проблеми од реалниот живот' }
];

const AdvancedPractice: React.FC<AdvancedPracticeProps> = ({ grade }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // LOGIC RULE: Clear everything when category changes
  useEffect(() => {
    setProblem(null);
    setSolution(null);
    setShowSolution(false);
    setError(null);
  }, [selectedCategory, grade]);

  const handleGenerate = async () => {
    if (!selectedCategory) return;
    setLoading(true);
    setError(null);
    setProblem(null);
    setSolution(null);
    setShowSolution(false);

    try {
      const categoryTitle = CATEGORIES.find(c => c.id === selectedCategory)?.title || selectedCategory;
      const result = await generateAdvancedProblem(categoryTitle, grade);
      setProblem(result.problem);
      setSolution(result.solution);
    } catch (err: any) {
      setError(err.message || "Грешка при генерирање на задачата.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="border-b pb-4 mb-2">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            🏆 Додатна настава (Натпревари)
            <span className="text-xs font-bold text-yellow-800 bg-yellow-100 border border-yellow-300 px-3 py-1 rounded-full">
                {grade} Одд.
            </span>
        </h2>
        <p className="text-slate-500 mt-1">
            Предизвикајте ги талентираните ученици со задачи од натпреварувачки карактер.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Categories */}
        <div className="md:col-span-1 space-y-4">
            <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider mb-2">Избери Категорија</h3>
            <div className="space-y-3">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 group relative overflow-hidden ${
                            selectedCategory === cat.id 
                                ? 'border-yellow-500 bg-yellow-50 shadow-md ring-1 ring-yellow-500' 
                                : 'border-slate-200 bg-white hover:border-yellow-300 hover:bg-yellow-50/50'
                        }`}
                    >
                        <div className="relative z-10">
                            <h4 className={`font-bold text-lg mb-1 ${selectedCategory === cat.id ? 'text-yellow-900' : 'text-slate-700'}`}>
                                {cat.title}
                            </h4>
                            <p className={`text-xs ${selectedCategory === cat.id ? 'text-yellow-700' : 'text-slate-500'}`}>
                                {cat.description}
                            </p>
                        </div>
                        {selectedCategory === cat.id && (
                            <div className="absolute right-0 top-0 h-full w-2 bg-yellow-500"></div>
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* RIGHT COLUMN: Problem Display */}
        <div className="md:col-span-2 flex flex-col bg-slate-50 rounded-2xl border border-slate-200 p-6 md:p-8 min-h-[500px]">
            
            {!selectedCategory ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-70">
                    <span className="text-6xl grayscale">🏆</span>
                    <p className="text-lg font-medium">Изберете категорија од левата страна за да започнете.</p>
                </div>
            ) : (
                <div className="flex flex-col h-full">
                    {/* Header for Right Panel */}
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                             {CATEGORIES.find(c => c.id === selectedCategory)?.title}
                        </span>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        {loading ? (
                             <Loading message="Генерирам тешка задача..." />
                        ) : error ? (
                             <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
                        ) : !problem ? (
                             <div className="flex flex-col items-center justify-center h-full space-y-6">
                                <p className="text-slate-600 text-center max-w-md">
                                    Спремни за предизвик? Ова ќе генерира задача која бара длабоко размислување.
                                </p>
                                <button 
                                    onClick={handleGenerate}
                                    className="bg-slate-900 text-white hover:bg-black px-8 py-4 rounded-xl font-bold text-lg shadow-lg transform transition hover:-translate-y-1 active:translate-y-0 flex items-center gap-3"
                                >
                                    <span>⚡</span> Дај ми предизвик!
                                </button>
                             </div>
                        ) : (
                            <div className="space-y-8 animate-fade-in">
                                {/* Problem Box */}
                                <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
                                    <h3 className="font-bold text-slate-900 text-xl mb-4">Задача:</h3>
                                    {/* Updated container class for SVG support: Centered, responsive height/width, margin */}
                                    <div className="text-lg text-slate-800 leading-relaxed font-medium [&_svg:not(.katex_svg)]:mx-auto [&_svg:not(.katex_svg)]:max-w-full [&_svg:not(.katex_svg)]:h-auto [&_svg:not(.katex_svg)]:my-6 [&_svg:not(.katex_svg)]:drop-shadow-sm">
                                        <FormattedText text={problem} />
                                    </div>
                                </div>

                                {/* Solution Control */}
                                <div className="flex flex-col items-center space-y-4">
                                    {!showSolution ? (
                                        <button 
                                            onClick={() => setShowSolution(true)}
                                            className="bg-slate-900 text-white hover:bg-black px-6 py-3 rounded-lg font-bold shadow-md transition-colors text-sm"
                                        >
                                            👁️ Прикажи го решението
                                        </button>
                                    ) : (
                                        <div className="w-full bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-inner animate-slide-up text-white">
                                            <div className="flex justify-between items-center mb-4 border-b border-slate-600 pb-2">
                                                <h3 className="font-bold text-yellow-400 flex items-center gap-2">
                                                    💡 Решение
                                                </h3>
                                                <button 
                                                    onClick={() => setShowSolution(false)} 
                                                    className="text-slate-400 hover:text-white text-xs uppercase font-bold"
                                                >
                                                    Сокриј
                                                </button>
                                            </div>
                                            {/* CSS Override for FormattedText children to be white */}
                                            <div className="prose prose-invert max-w-none text-white [&_p]:text-gray-100 [&_li]:text-gray-100 [&_strong]:text-white">
                                                 <FormattedText text={solution || ""} theme="light" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex justify-center pt-8">
                                     <button 
                                        onClick={handleGenerate}
                                        className="text-slate-500 hover:text-slate-800 font-bold text-sm flex items-center gap-2 transition-colors"
                                     >
                                        🔄 Следна задача
                                     </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedPractice;
