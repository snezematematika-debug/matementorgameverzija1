
import React, { useState, useEffect, useRef } from 'react';
import { CURRICULUM, THEMES } from '../constants';
import { getContentPackage } from '../services/geminiService';
import { GradeLevel, LessonPackage } from '../types';
import Loading from './Loading';
import FormattedText from './FormattedText';
import { ArrowLeft } from 'lucide-react';

interface BoardPlanGeneratorProps {
  grade: GradeLevel;
  initialContent?: string;
}

const BoardPlanGenerator: React.FC<BoardPlanGeneratorProps> = ({ grade, initialContent }) => {
  const [selectedThemeId, setSelectedThemeId] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  
  const [fullPackage, setFullPackage] = useState<LessonPackage | null>(null);

  // Initialize from initialContent if provided
  useEffect(() => {
    if (initialContent) {
      try {
        if (initialContent.trim().startsWith('{')) {
          const parsed = JSON.parse(initialContent);
          setFullPackage(parsed);
        } else {
          setFullPackage({ boardPlan: initialContent } as LessonPackage);
        }
      } catch (e) {
        setFullPackage({ boardPlan: initialContent } as LessonPackage);
      }
    }
  }, [initialContent]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Filter themes and topics
  const filteredThemes = THEMES.filter(t => t.grade === grade);
  const availableTopics = CURRICULUM.filter(topic => topic.themeId === selectedThemeId && topic.grade === grade);

  useEffect(() => {
    if (filteredThemes.length > 0) {
      setSelectedThemeId(filteredThemes[0].id);
    } else {
      setSelectedThemeId("");
    }
  }, [grade]);

  useEffect(() => {
    if (availableTopics.length > 0) {
      setSelectedTopic(availableTopics[0].name);
    } else {
      setSelectedTopic("");
    }
  }, [selectedThemeId, grade]);

  const handleGenerate = async () => {
    if (!selectedTopic) return;
    setLoading(true);
    setError(null);
    setFullPackage(null);
    try {
      const result = await getContentPackage(grade, selectedTopic);
      if (result) {
        setFullPackage(result);
      } else {
        throw new Error("Неуспешно генерирање на планот за табла.");
      }
    } catch (err: any) {
      setError(err.message || "Грешка при креирање на планот.");
    } finally {
      setLoading(false);
    }
  };

  const handleFullScreen = () => {
    if (boardRef.current) {
        if (!document.fullscreenElement) {
            boardRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }
  };

  const handleCopy = () => {
      if (fullPackage?.boardPlan) {
          navigator.clipboard.writeText(fullPackage.boardPlan);
          alert("Текстот е копиран!");
      }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div>
        <div className="flex items-center justify-between border-b pb-4 mb-6">
            <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    👨‍🏫 План на табла
                    <span className="text-sm font-normal text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{grade} Одд.</span>
                </h2>
            </div>
            <p className="text-slate-500 mt-1 hidden md:block">Автоматски генерирајте краток план (дефиниции, формули, примери) што ќе го запишете на таблата.</p>
        </div>

        <div className="flex flex-col gap-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Theme Selector */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">1. Избери Наставна Тема</label>
                    <select 
                        value={selectedThemeId}
                        onChange={(e) => setSelectedThemeId(e.target.value)}
                        className="w-full p-3 border-2 border-emerald-300 rounded-lg focus:ring-4 focus:ring-emerald-100 focus:border-emerald-600 focus:outline-none bg-white font-bold text-slate-700 transition-all shadow-sm"
                    >
                        {filteredThemes.map(theme => (
                        <option key={theme.id} value={theme.id}>{theme.title}</option>
                        ))}
                    </select>
                </div>

                {/* Topic Selector */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">2. Избери Лекција</label>
                    <select 
                        value={selectedTopic}
                        onChange={(e) => setSelectedTopic(e.target.value)}
                        className="w-full p-3 border-2 border-emerald-300 rounded-lg focus:ring-4 focus:ring-emerald-100 focus:border-emerald-600 focus:outline-none bg-white font-bold text-slate-700 transition-all shadow-sm"
                        disabled={availableTopics.length === 0}
                    >
                        {availableTopics.map(topic => (
                        <option key={topic.id} value={topic.name}>{topic.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="mt-4 flex justify-end">
                <button
                    onClick={handleGenerate}
                    disabled={loading || !selectedTopic}
                    className={`
                        w-full md:w-auto px-6 py-2.5 rounded-lg transition-all font-bold shadow-sm flex items-center justify-center gap-2
                        ${fullPackage 
                            ? 'bg-white border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50' 
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }
                    `}
                >
                    {loading ? 'Се пишува на табла...' : (fullPackage ? '🔄 Избриши и Напиши Повторно' : '✍️ Напиши План')}
                </button>
            </div>
        </div>
      </div>

      {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            <strong>Грешка:</strong> {error}
            </div>
      )}

      {loading && <Loading message="Наставникот го пишува планот на табла..." />}

      {/* The Blackboard View */}
      {fullPackage?.boardPlan && !loading && (
        <div className="animate-fade-in space-y-4">
             {/* Toolbar */}
             <div className="flex justify-end gap-2">
                 <button onClick={handleCopy} className="text-sm px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-colors">
                    📋 Копирај Текст
                 </button>
                 <button onClick={handleFullScreen} className="text-sm px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    Цел Екран (Проектор)
                 </button>
             </div>

             {/* Board Container */}
             <div 
                ref={boardRef}
                className={`
                    bg-[#2F4F4F] p-8 md:p-12 rounded-lg border-[12px] border-[#5d4037] shadow-2xl relative overflow-y-auto max-h-[80vh] min-h-[500px]
                    /* GLOBAL SVG STYLES for the Chalkboard */
                    [&_svg]:stroke-white [&_svg]:stroke-[2px] 
                    [&_path]:stroke-white [&_circle]:stroke-white [&_line]:stroke-white [&_rect]:stroke-white 
                    [&_text]:fill-white [&_text]:stroke-none
                    /* Prevent stretching - Limit max width and center them */
                    [&_svg]:max-w-[500px] [&_svg]:mx-auto [&_svg]:my-6 [&_svg]:h-auto
                    /* Ensure no background on the SVG itself so the board shows through */
                    [&_svg]:bg-transparent
                `}
                style={{
                    boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5), 0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                }}
             >
                 {/* Chalk Dust Effect */}
                 <div className="absolute inset-0 pointer-events-none opacity-20" style={{
                     backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.5\'/%3E%3C/svg%3E")'
                 }}></div>

                 {/* Content */}
                 <div className="relative z-10 font-mono text-3xl md:text-4xl leading-relaxed chalkboard-content">
                    <FormattedText text={fullPackage.boardPlan} theme="dark" />
                 </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default BoardPlanGenerator;
