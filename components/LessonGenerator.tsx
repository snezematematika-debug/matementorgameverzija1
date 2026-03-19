
import React, { useState, useEffect } from 'react';
import { CURRICULUM, THEMES } from '../constants';
import { generateLessonContent, generateLessonConnectivity } from '../services/geminiService';
import { GradeLevel, GeneratedLesson } from '../types';
import Loading from './Loading';
import SaveOptionsDropdown from './SaveOptionsDropdown';
import FormattedText from './FormattedText';
import { parse } from 'marked';

interface LessonGeneratorProps {
  grade: GradeLevel;
  initialContent?: string;
}

const LessonGenerator: React.FC<LessonGeneratorProps> = ({ grade, initialContent }) => {
  // State for selections
  const [selectedThemeId, setSelectedThemeId] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [includeRealWorldContext, setIncludeRealWorldContext] = useState<boolean>(false);
  
  // State for content
  const [lesson, setLesson] = useState<GeneratedLesson | null>(null);

  // Initialize from initialContent if provided
  useEffect(() => {
    if (initialContent) {
      try {
        // Check if it's JSON (complex object) or just markdown
        if (initialContent.trim().startsWith('{')) {
          const parsed = JSON.parse(initialContent);
          setLesson(parsed);
        } else {
          // If it's just markdown, we might need a simpler display or a mock object
          setLesson({
            title: "Вчитана лекција",
            objectives: ["Преглед на зачуван материјал"],
            content: initialContent
          });
        }
      } catch (e) {
        setLesson({
          title: "Вчитана лекција",
          objectives: ["Преглед на зачуван материјал"],
          content: initialContent
        });
      }
    }
  }, [initialContent]);
  const [connectivity, setConnectivity] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for Connectivity Modal
  const [showConnectivityModal, setShowConnectivityModal] = useState(false);
  const [connectivityContent, setConnectivityContent] = useState<string | null>(null);
  const [loadingConnectivity, setLoadingConnectivity] = useState(false);

  // Custom fields for the print view
  const [teacherName, setTeacherName] = useState('');
  const [schoolName, setSchoolName] = useState('');

  // Derived state: Filtered themes and topics
  const filteredThemes = THEMES.filter(t => t.grade === grade);
  const availableTopics = CURRICULUM.filter(topic => topic.themeId === selectedThemeId && topic.grade === grade);

  // Reset/Initialize selection when grade changes
  useEffect(() => {
    if (filteredThemes.length > 0) {
      setSelectedThemeId(filteredThemes[0].id);
    } else {
      setSelectedThemeId("");
    }
    setConnectivityContent(null);
  }, [grade]);

  // Set default topic when theme changes
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
    setLesson(null);
    setConnectivity(null);
    try {
      const result = await generateLessonContent(selectedTopic, grade, includeRealWorldContext);
      if (result) {
        setLesson(result);
      } else {
        throw new Error("Неуспешно генерирање на лекцијата.");
      }
    } catch (err: any) {
      setError(err.message || "Се појави грешка при генерирање на лекцијата.");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectivityCheck = async () => {
    if (!selectedTopic) return;
    setShowConnectivityModal(true);
    
    if (connectivity) {
      return;
    }

    setLoadingConnectivity(true);
    try {
        const result = await generateLessonConnectivity(selectedTopic, grade);
        if (result) {
          setConnectivity(result);
        } else {
          setConnectivityContent("Не успеавме да ги вчитаме податоците за поврзаност.");
        }
    } catch (e) {
        setConnectivityContent("Не успеавме да ги вчитаме податоците за поврзаност.");
    } finally {
        setLoadingConnectivity(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getMarkdownContent = () => {
    if (!lesson) return '';
    return `
# ${lesson.title}

## Цели на часот:
${lesson.objectives.map(o => `- ${o}`).join('\n')}

---

${lesson.content}
    `.trim();
  };

  const handleDownloadMd = () => {
    const textContent = getMarkdownContent();
    const blob = new Blob([textContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lesson?.title.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadWord = () => {
    if (!lesson) return;

    const objectivesHtml = lesson.objectives.map(obj => `<li>${obj}</li>`).join('');
    const contentHtml = parse(lesson.content);
    const themeTitle = THEMES.find(t => t.id === selectedThemeId)?.title || "ГЕОМЕТРИЈА";
    
    // Construct HTML with explicit tables to match the print view
    const fullHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${lesson.title}</title>
        <style>
          body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          td, th { border: 1px solid black; padding: 8px; vertical-align: top; }
          .header-cell { background-color: #f3f4f6; font-weight: bold; width: 30%; }
          h1 { font-size: 16pt; color: #2E4053; margin-top: 20px; }
          h2 { font-size: 14pt; color: #2E86C1; margin-top: 15px; }
          .footer { margin-top: 50px; border-top: 1px solid black; padding-top: 10px; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <p style="text-align: right; font-size: 9pt; color: #666; border-bottom: 1px solid #ccc;">Мате-Ментор - Платформа за дигитално образование</p>
        
        <!-- Header Table -->
        <table>
          <tr>
            <td class="header-cell">Предмет:</td>
            <td>Математика за ${grade} одделение</td>
          </tr>
          <tr>
            <td class="header-cell">Тема:</td>
            <td style="text-transform: uppercase; font-weight: bold;">${themeTitle}</td>
          </tr>
          <tr>
            <td class="header-cell">Лекција:</td>
            <td style="font-weight: bold;">${lesson.title}</td>
          </tr>
          <tr>
            <td class="header-cell">Изготвил/-а:</td>
            <td>${teacherName || '__________________'}</td>
          </tr>
          <tr>
            <td class="header-cell">ООУ:</td>
            <td>${schoolName || '__________________'}</td>
          </tr>
        </table>

        <!-- Objectives -->
        <div style="margin-bottom: 20px;">
            <p style="font-weight: bold; text-decoration: underline;">Цели на часот:</p>
            <ul>${objectivesHtml}</ul>
        </div>
        
        <hr/>

        <!-- Main Content -->
        <div>
            ${contentHtml}
        </div>

        <!-- Footer -->
        <br/><br/>
        <table style="border: none;">
            <tr style="border: none;">
                <td style="border: none; border-top: 1px solid black; padding-top: 10px;">Датум: ________________</td>
                <td style="border: none; border-top: 1px solid black; padding-top: 10px; text-align: right;">Потпис: ________________</td>
            </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lesson.title.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
       {/* Force Portrait specifically for this component */}
       <style>{`
        @media print {
            @page {
                size: portrait;
            }
        }
      `}</style>

      {/* Input Section - Hidden on Print */}
      <div className="print:hidden">
        <div className="border-b pb-4 mb-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                📚 Генератор на лекции
                <span className="text-sm font-normal text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{grade} Одд.</span>
            </h2>
            <p className="text-slate-500 mt-1">Изберете тема и лекција од наставната програма за {grade} одделение.</p>
        </div>

        {/* Motivational Instruction for Teachers */}
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-lg shadow-sm">
            <div className="flex items-start gap-3">
                <span className="text-2xl">🚀</span>
                <div>
                    <p className="text-indigo-900 text-sm font-medium">
                        Осовременете ја наставата!
                    </p>
                    <p className="text-indigo-800 text-sm mt-1">
                        Оваа алатка е вашиот дигитален асистент за креирање иновативни содржини. Генерирајте структурирани лекции кои штедат време и овозможуваат <strong>покреативен пристап</strong> во пренесувањето на знаењето, следејќи ги современите образовни стандарди.
                    </p>
                </div>
            </div>
        </div>

        <div className="flex flex-col gap-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Theme Selector */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">1. Избери Наставна Тема</label>
                    <select 
                        value={selectedThemeId}
                        onChange={(e) => setSelectedThemeId(e.target.value)}
                        className="w-full p-3 border-2 border-indigo-300 rounded-lg focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:outline-none bg-white font-bold text-slate-700 transition-all shadow-sm"
                    >
                        {filteredThemes.map(theme => (
                        <option key={theme.id} value={theme.id}>{theme.title}</option>
                        ))}
                    </select>
                </div>

                {/* Topic Selector */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-bold text-slate-700">2. Избери Лекција</label>
                        <button 
                            onClick={handleConnectivityCheck}
                            disabled={!selectedTopic}
                            className="text-xs font-bold text-white bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 px-3 py-1.5 rounded-full border-2 border-indigo-900 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                            <span>🔗</span>
                            <span>Поврзаност</span>
                        </button>
                    </div>
                    <select 
                        value={selectedTopic}
                        onChange={(e) => setSelectedTopic(e.target.value)}
                        className="w-full p-3 border-2 border-indigo-300 rounded-lg focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 focus:outline-none bg-white font-bold text-slate-700 transition-all shadow-sm"
                        disabled={availableTopics.length === 0}
                    >
                        {availableTopics.map(topic => (
                        <option key={topic.id} value={topic.name}>{topic.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Real World Context Toggle */}
            <div className="flex items-center gap-3 pt-2">
                <input 
                    type="checkbox" 
                    id="contextToggle"
                    checked={includeRealWorldContext} 
                    onChange={(e) => setIncludeRealWorldContext(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300 cursor-pointer"
                />
                <label htmlFor="contextToggle" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                    🌍 Вклучи примери од реалниот живот (Contextual Learning)
                </label>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-200 pt-4 mt-2">
                 <p className="text-sm font-bold text-slate-500">Податоци за наставникот (за печатење):</p>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Изготвил (Име)</label>
                        <input 
                            type="text" 
                            value={teacherName} 
                            onChange={(e) => setTeacherName(e.target.value)}
                            placeholder="Вашето име"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">ООУ</label>
                        <input 
                            type="text" 
                            value={schoolName} 
                            onChange={(e) => setSchoolName(e.target.value)}
                            placeholder="Име на училиштето"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white text-sm"
                        />
                    </div>
                 </div>
            </div>

            <div className="mt-4 flex justify-end">
                <button
                    onClick={handleGenerate}
                    disabled={loading || !selectedTopic}
                    className={`
                        w-full md:w-auto px-6 py-2.5 rounded-lg transition-all font-bold shadow-sm flex items-center justify-center gap-2
                        ${lesson 
                            ? 'bg-white border-2 border-indigo-600 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50' // Strong Blue Outline
                            : 'bg-indigo-600 text-white hover:bg-indigo-700' // Solid
                        }
                    `}
                >
                    {loading ? 'Се пишува...' : (lesson ? '🔄 Регенерирај Лекција' : '✨ Генерирај Лекција')}
                </button>
            </div>
        </div>

        {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">⚠️</span>
                    <strong className="font-bold">Грешка при генерирање:</strong>
                </div>
                <p className="text-sm mb-2">{error}</p>
                <div className="text-xs bg-white/50 p-2 rounded border border-red-100">
                    <p className="font-semibold mb-1">Можни решенија:</p>
                    <ul className="list-disc list-inside space-y-0.5 opacity-80">
                        <li>Проверете дали имате интернет конекција.</li>
                        <li>Обидете се повторно за неколку секунди (можеби серверот е преоптоварен).</li>
                        <li>Проверете дали е внесен <code className="bg-red-100 px-1 rounded">GEMINI_API_KEY</code> во Secrets во поставките на AI Studio.</li>
                    </ul>
                </div>
            </div>
        )}

        {loading && <Loading message="Наставникот ја подготвува лекцијата..." />}
      </div>

      {lesson && !loading && (
        <div className="mt-8 space-y-6 animate-slide-up print:mt-0">
          
          {/* Action Buttons - Hidden on Print */}
          {/* PROFESSIONAL TOOLBAR STYLE */}
          <div className="print:hidden flex flex-wrap justify-end gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
             <div className="text-sm text-slate-500 mr-auto pl-2 font-medium hidden sm:block">
                Достапни формати:
             </div>
             
             <SaveOptionsDropdown 
                title={`Лекција - ${lesson.title}`}
                content={getMarkdownContent()}
                type="Лекција"
                onDownloadWord={handleDownloadWord}
                onDownloadMarkdown={handleDownloadMd}
                onPrint={handlePrint}
             />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm print:border-none print:shadow-none print:p-0">
            {/* Header for Screen View */}
            <div className="bg-gradient-to-r from-indigo-50 to-white p-6 border-b border-indigo-100 print:hidden">
              <h3 className="text-2xl font-bold text-indigo-900 mb-4">{lesson.title}</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Цели:</span>
                <div className="flex flex-wrap gap-2">
                    {lesson.objectives.map((obj, idx) => (
                    <span key={idx} className="bg-indigo-100 text-indigo-800 text-xs px-3 py-1 rounded-full font-medium border border-indigo-200">
                        {obj}
                    </span>
                    ))}
                </div>
              </div>
            </div>

            {/* PRINT HEADER TABLE - Visible ONLY on print */}
            <div className="hidden print:block mb-6 text-black">
                 <div className="text-right text-xs text-slate-500 mb-2 border-b pb-1">Мате-Ментор - Платформа за дигитално образование</div>
                 <table className="w-full border-collapse border border-black mb-6 text-sm">
                    <tbody>
                        <tr>
                            <td className="border border-black p-2 font-bold bg-slate-100 w-1/3">Предмет:</td>
                            <td className="border border-black p-2 w-2/3">Математика за {grade} одделение</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold bg-slate-100">Тема:</td>
                            <td className="border border-black p-2 uppercase font-bold">{THEMES.find(t => t.id === selectedThemeId)?.title || "ГЕОМЕТРИЈА"}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold bg-slate-100">Лекција:</td>
                            <td className="border border-black p-2 font-bold">{lesson.title}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold bg-slate-100">Изготвил/-а:</td>
                            <td className="border border-black p-2">{teacherName || '__________________'}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold bg-slate-100">ООУ:</td>
                            <td className="border border-black p-2">{schoolName || '__________________'}</td>
                        </tr>
                    </tbody>
                </table>
                <div className="mb-4">
                    <p className="font-bold underline mb-2">Цели на часот:</p>
                    <ul className="list-disc pl-5">
                        {lesson.objectives.map((obj, idx) => (
                            <li key={idx} className="text-sm">{obj}</li>
                        ))}
                    </ul>
                </div>
                <hr className="border-black mb-4"/>
            </div>

            {/* CONTENT */}
            <div className="p-8 text-slate-700 leading-relaxed print:p-0 print:text-black">
              <FormattedText text={lesson.content} />
            </div>

            {/* PRINT FOOTER */}
            <div className="mt-8 pt-4 border-t border-black hidden print:block text-black">
                <div className="flex justify-between text-xs">
                    <p>Датум: ________________</p>
                    <p>Потпис: ________________</p>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Connectivity Modal */}
      {showConnectivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-indigo-50">
                    <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                        🔗 Вертикална Поврзаност
                    </h3>
                    <button 
                        onClick={() => setShowConnectivityModal(false)}
                        className="text-slate-500 hover:text-slate-700 p-1 rounded-full hover:bg-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {loadingConnectivity ? (
                         <div className="flex flex-col items-center justify-center py-8">
                            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-2"></div>
                            <p className="text-sm text-slate-500">Ја анализирам наставната програма...</p>
                         </div>
                    ) : (
                        <div className="prose prose-sm prose-indigo">
                            <FormattedText text={connectivity || "Нема податоци."} />
                        </div>
                    )}
                </div>
                <div className="p-4 border-t bg-slate-50 text-right">
                    <button 
                        onClick={() => setShowConnectivityModal(false)}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700"
                    >
                        Затвори
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default LessonGenerator;
