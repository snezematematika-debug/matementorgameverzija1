
import React, { useState, useEffect } from 'react';
import { CURRICULUM, THEMES } from '../constants';
import { generateQuizQuestions } from '../services/geminiService';
import { GradeLevel, QuizQuestion } from '../types';
import Loading from './Loading';
import SaveOptionsDropdown from './SaveOptionsDropdown';
import FormattedText from './FormattedText';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { parse } from 'marked';

interface QuizMakerProps {
  grade: GradeLevel;
  initialContent?: string;
}

const QuizMaker: React.FC<QuizMakerProps> = ({ grade, initialContent }) => {
  const [selectedThemeId, setSelectedThemeId] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [rubric, setRubric] = useState<string | null>(null);

  // Initialize from initialContent if provided
  useEffect(() => {
    if (initialContent) {
      try {
        if (initialContent.trim().startsWith('[')) {
          const parsed = JSON.parse(initialContent);
          setQuestions(parsed);
        } else {
          // If it's just markdown/text, we'll need a way to display it.
          // For now, let's assume it's a list of questions in JSON.
          setError("Невалиден формат на зачуваниот тест.");
        }
      } catch (e) {
        setError("Грешка при вчитување на тестот.");
      }
    }
  }, [initialContent]);
  const [loading, setLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom fields for the print view
  const [teacherName, setTeacherName] = useState('');
  const [schoolName, setSchoolName] = useState('');

  // Filter content
  const filteredThemes = THEMES.filter(t => t.grade === grade);
  const availableTopics = CURRICULUM.filter(topic => topic.themeId === selectedThemeId && topic.grade === grade);

  // Initialize selection
  useEffect(() => {
    if (filteredThemes.length > 0) {
      setSelectedThemeId(filteredThemes[0].id);
    } else {
      setSelectedThemeId("");
    }
    setQuestions([]);
    setRubric(null);
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
    setQuestions([]);
    setRubric(null);
    setShowResults(false);
    setSelectedAnswers([]);
    try {
      const result = await generateQuizQuestions(selectedTopic, grade);
      // Handle the new object structure { questions, rubric }
      setQuestions(result.questions);
      setRubric(result.rubric);
      setSelectedAnswers(new Array(result.questions.length).fill(-1));
    } catch (err: any) {
      setError(err.message || "Неуспешно генерирање на квиз.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadWord = () => {
    if (questions.length === 0) return;
    
    const questionsHtml = questions.map((q, idx) => `
      <div style="margin-bottom: 20px;">
        <p><b>${idx + 1}. ${q.question}</b> <span style="font-size: 9pt; color: #666;">(${q.difficulty})</span></p>
        <div style="margin-left: 20px;">
          ${q.options.map((opt, optIdx) => `
            <p>${String.fromCharCode(65 + optIdx)}) ${opt}</p>
          `).join('')}
        </div>
      </div>
    `).join('');

    let rubricHtml = '';
    if (rubric) {
      const parsedRubric = parse(rubric);
      rubricHtml = `
        <div style="page-break-before: always; border-top: 2px solid black; padding-top: 20px; margin-top: 40px;">
          <h2 style="color: #2c3e50;">Клуч за одговори и Рубрика за оценување</h2>
          <div style="font-size: 10pt;">${parsedRubric}</div>
        </div>
      `;
    }

    const fullHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <style>
          body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          td, th { border: 1px solid #ccc; padding: 8px; text-align: left; }
          .header-table td { border: none; padding: 4px; }
          h1 { font-size: 18pt; text-align: center; text-transform: uppercase; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 30px; }
        </style>
      </head>
      <body>
        <p style="text-align: right; font-size: 8pt; color: #999; border-bottom: 1px solid #eee;">Мате-Ментор - Платформа за дигитално образование</p>
        <table class="header-table">
          <tr>
            <td><b>Предмет:</b> Математика</td>
            <td style="text-align: right;"><b>Датум:</b> ________________</td>
          </tr>
          <tr>
            <td><b>Одделение:</b> ${grade} одд.</td>
            <td style="text-align: right;"><b>Ученик:</b> __________________________</td>
          </tr>
          <tr>
            <td><b>Наставник:</b> ${teacherName || '__________________'}</td>
            <td style="text-align: right;"><b>Училиште:</b> ${schoolName || '__________________'}</td>
          </tr>
        </table>
        <h1>Тест за ${selectedTopic}</h1>
        ${questionsHtml}
        ${rubricHtml}
      </body>
      </html>
    `;

    const blob = new Blob([fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Test_${selectedTopic.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getMarkdownContent = () => {
    if (questions.length === 0) return "";
    
    let md = `# Тест за ${selectedTopic}\n\n`;
    md += `**Предмет:** Математика\n`;
    md += `**Одделение:** ${grade} одд.\n`;
    md += `**Наставник:** ${teacherName || '__________________'}\n`;
    md += `**Училиште:** ${schoolName || '__________________'}\n\n`;
    md += `---\n\n`;

    questions.forEach((q, idx) => {
      md += `### ${idx + 1}. ${q.question} (${q.difficulty})\n`;
      q.options.forEach((opt, optIdx) => {
        md += `${String.fromCharCode(65 + optIdx)}) ${opt}\n`;
      });
      md += `\n`;
    });

    if (rubric) {
      md += `\n---\n\n## Клуч за одговори и Рубрика за оценување\n\n${rubric}`;
    }

    return md;
  };

  const handleDownloadMd = () => {
    const content = getMarkdownContent();
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Test_${selectedTopic.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAnswerSelect = (qIndex: number, optionIndex: number) => {
    if (showResults) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[qIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) score++;
    });
    return score;
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4 mb-6 print:hidden">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            📝 Квиз тестови
            <span className="text-sm font-normal text-teal-600 bg-teal-50 px-2 py-1 rounded-full">{grade} Одд.</span>
        </h2>
        <p className="text-slate-500 mt-1">Проверка на знаење за теми од {grade} одделение.</p>
      </div>

      {/* Motivational Instruction for Teachers */}
      <div className="bg-teal-50 border-l-4 border-teal-500 p-4 mb-6 rounded-r-lg shadow-sm print:hidden">
        <div className="flex items-start gap-3">
            <span className="text-2xl">📊</span>
            <div>
                <p className="text-teal-900 text-sm font-medium">
                    Дигитална трансформација на оценувањето!
                </p>
                <p className="text-teal-800 text-sm mt-1">
                    Напуштете го класичното тестирање. Овој генератор ви овозможува брзо креирање на <strong>формативни тестови</strong> кои даваат моментална повратна информација. Идеално за кратки проверки на часот кои ги мотивираат учениците наместо да ги плашат.
                </p>
            </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 bg-slate-50 p-6 rounded-xl border border-slate-100 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Theme Selector */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">1. Избери Наставна Тема</label>
                <select 
                    value={selectedThemeId}
                    onChange={(e) => setSelectedThemeId(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white font-medium text-slate-700"
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
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white text-slate-700"
                    disabled={availableTopics.length === 0}
                >
                    {availableTopics.map(topic => (
                    <option key={topic.id} value={topic.name}>{topic.name}</option>
                    ))}
                </select>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 pt-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Изготвил (за печатење)</label>
                <input 
                    type="text" 
                    value={teacherName} 
                    onChange={(e) => setTeacherName(e.target.value)} 
                    placeholder="Вашето име" 
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">ООУ (за печатење)</label>
                <input 
                    type="text" 
                    value={schoolName} 
                    onChange={(e) => setSchoolName(e.target.value)} 
                    placeholder="Име на училиштето" 
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
                />
            </div>
        </div>
        
        <div className="mt-4 flex justify-end">
            <button
                onClick={handleGenerate}
                disabled={loading || !selectedTopic}
                className={`
                    w-full md:w-auto px-6 py-2.5 rounded-lg transition-all font-bold shadow-sm flex items-center justify-center gap-2
                    ${questions.length > 0
                        ? 'bg-white border-2 border-teal-600 text-teal-700 hover:border-teal-300 hover:bg-teal-50' // Strong Teal Outline
                        : 'bg-teal-600 text-white hover:bg-teal-700' // Solid style when new
                    }
                `}
            >
                {loading ? 'Се подготвува...' : (questions.length > 0 ? '🔄 Регенерирај Тест' : '🎲 Старт')}
            </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
           <strong>Грешка:</strong> {error}
        </div>
      )}

      {loading && <Loading message="Се генерираат прашања..." />}

      {!loading && questions.length > 0 && (
        <div className="space-y-6 animate-fade-in print:space-y-4">
          
          {/* PRINT HEADER - Visible ONLY on print */}
          <div className="hidden print:block mb-8 text-black">
              <div className="text-right text-[10px] text-slate-500 mb-4 border-b pb-1 italic">Мате-Ментор - Платформа за дигитално образование</div>
              
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm border-b-2 border-slate-200 pb-4">
                  <div className="space-y-1">
                      <p><strong>Предмет:</strong> Математика</p>
                      <p><strong>Одделение:</strong> {grade} одд.</p>
                      <p><strong>Наставник:</strong> {teacherName || '__________________'}</p>
                  </div>
                  <div className="space-y-1 text-right">
                      <p><strong>Училиште:</strong> {schoolName || '__________________'}</p>
                      <p><strong>Датум:</strong> ________________</p>
                      <p><strong>Ученик:</strong> __________________________</p>
                  </div>
              </div>

              <h1 className="text-2xl font-black text-center mb-8 uppercase tracking-tight">
                Тест за {selectedTopic}
              </h1>
          </div>

          {questions.map((q, idx) => {
            const isCorrect = selectedAnswers[idx] === q.correctAnswerIndex;
            return (
              <div key={idx} className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow break-inside-avoid print:shadow-none print:border-slate-200 print:p-4 print:mb-4">
                <div className="flex justify-between items-start mb-4 print:mb-2">
                    <div className="flex-1 text-slate-800 text-lg print:text-base">
                        <span className="font-bold text-slate-400 mr-2 print:text-black">{idx + 1}.</span> 
                        <div className="inline-block"><FormattedText text={q.question} /></div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs px-2 py-1 rounded font-bold ml-4 uppercase tracking-wider print:hidden ${
                            q.difficulty === 'Лесно' ? 'bg-green-100 text-green-700' :
                            q.difficulty === 'Средно' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                        }`}>
                            {q.difficulty}
                        </span>
                        <span className="hidden print:block text-[10px] font-bold text-slate-400">Поени: ____ / 10</span>
                    </div>
                </div>

                <div className="space-y-2 pl-6 print:pl-4 print:space-y-1">
                  {q.options.map((opt, optIdx) => {
                    let btnClass = "w-full text-left p-3 rounded-lg border transition-all text-sm flex items-center gap-2 cursor-pointer select-none ";
                    
                    if (showResults) {
                        if (optIdx === q.correctAnswerIndex) {
                            btnClass += "bg-green-100 border-green-500 text-green-900 font-bold";
                        } else if (optIdx === selectedAnswers[idx]) {
                            btnClass += "bg-red-50 border-red-300 text-red-900";
                        } else {
                            btnClass += "bg-slate-50 border-slate-200 opacity-50";
                        }
                    } else {
                        if (selectedAnswers[idx] === optIdx) {
                            btnClass += "bg-teal-50 border-teal-500 text-teal-900 font-medium shadow-inner";
                        } else {
                            btnClass += "hover:bg-slate-50 border-slate-200 active:bg-slate-100";
                        }
                    }

                    // Print styles override
                    btnClass += " print:border-none print:p-0.5 print:pl-0 print:bg-transparent print:text-sm";

                    return (
                      <div
                        key={optIdx}
                        onClick={() => !showResults && handleAnswerSelect(idx, optIdx)}
                        className={btnClass}
                        role="button"
                        aria-disabled={showResults}
                      >
                        <span className="font-mono font-bold text-slate-400 flex-shrink-0 print:text-black w-6">{String.fromCharCode(65 + optIdx)})</span> 
                        <div className="flex-1"><FormattedText text={opt} /></div>
                      </div>
                    );
                  })}
                </div>

                {showResults && (
                  <div className={`mt-4 ml-6 p-3 rounded-lg text-sm print:hidden ${isCorrect ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    <p className="font-bold mb-1">
                        {isCorrect ? '✅ Точен одговор!' : '❌ Неточен одговор.'}
                    </p>
                    <FormattedText text={q.explanation} />
                  </div>
                )}
              </div>
            );
          })}

          {/* RUBRIC SECTION - Visible on Screen and Print */}
          {rubric && (
              <div className="mt-8 pt-8 border-t-2 border-slate-200 print:border-black break-before-page">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 print:bg-transparent print:border-none print:p-0">
                      <h3 className="text-xl font-bold text-slate-800 mb-4 print:text-black flex items-center gap-2">
                          <span className="print:hidden">👨‍🏫</span> Водич за наставникот (Рубрика)
                      </h3>
                      <div className="text-slate-700 print:text-black rubric-content">
                         <ReactMarkdown 
                             remarkPlugins={[remarkGfm]}
                             rehypePlugins={[rehypeRaw]}
                             components={{
                                 table: ({node, ...props}) => <table className="w-full border-collapse border border-yellow-300 bg-white/50 mb-4 text-sm" {...props} />,
                                 thead: ({node, ...props}) => <thead className="bg-yellow-100" {...props} />,
                                 th: ({node, ...props}) => <th className="border border-yellow-300 p-2 text-left font-bold text-yellow-900" {...props} />,
                                 td: ({node, ...props}) => <td className="border border-yellow-300 p-2" {...props} />,
                                 tr: ({node, ...props}) => <tr className="border-b border-yellow-200" {...props} />,
                             }}
                         >
                             {rubric}
                         </ReactMarkdown>
                      </div>
                  </div>
              </div>
          )}

          <div className="sticky bottom-6 bg-white/90 backdrop-blur p-4 shadow-2xl rounded-xl border border-slate-200 flex flex-wrap justify-between items-center gap-4 z-10 print:hidden">
            <div className="flex items-center gap-4 flex-1">
                {showResults ? (
                    <div className="text-xl font-bold flex items-center gap-4">
                        <span>Резултат: <span className={calculateScore() > questions.length/2 ? "text-green-600" : "text-orange-600"}>{calculateScore()} / {questions.length}</span></span>
                        <button 
                            onClick={handleGenerate} 
                            className="text-sm bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors font-bold"
                        >
                            Нов Тест
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowResults(true)}
                        disabled={selectedAnswers.includes(-1)}
                        className="flex-1 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed font-bold shadow-lg transform active:scale-95 transition-all"
                    >
                        Заврши и Провери
                    </button>
                )}
            </div>

            <SaveOptionsDropdown 
                title={`Тест - ${selectedTopic && selectedTopic !== 'undefined' ? selectedTopic : 'Без наслов'}`}
                content={JSON.stringify({ questions, rubric })}
                type="Тест"
                grade={grade || 'Непознато'}
                onDownloadWord={handleDownloadWord}
                onDownloadMarkdown={handleDownloadMd}
                onPrint={() => window.print()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizMaker;
