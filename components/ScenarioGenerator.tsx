
import React, { useState, useRef, useEffect } from 'react';
import { CURRICULUM, THEMES } from '../constants';
import { getContentPackage } from '../services/contentService';
import { GeneratedScenario, GradeLevel, LessonPackage } from '../types';
import Loading from './Loading';
import FormattedText from './FormattedText';
import { parse } from 'marked';

interface ScenarioGeneratorProps {
  grade: GradeLevel;
}

const ScenarioGenerator: React.FC<ScenarioGeneratorProps> = ({ grade }) => {
  const [selectedThemeId, setSelectedThemeId] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");

  const [fullPackage, setFullPackage] = useState<LessonPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Custom fields for the print view
  const [teacherName, setTeacherName] = useState('');
  const [schoolName, setSchoolName] = useState('');

  // Filter themes and topics based on grade
  const filteredThemes = THEMES.filter(t => t.grade === grade);
  const availableTopics = CURRICULUM.filter(topic => topic.themeId === selectedThemeId && topic.grade === grade);

  // Initialize selection when grade changes
  useEffect(() => {
    if (filteredThemes.length > 0) {
      setSelectedThemeId(filteredThemes[0].id);
    } else {
      setSelectedThemeId("");
    }
  }, [grade]);

  // Update default topic when theme changes
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
        throw new Error("Неуспешно генерирање на сценариото.");
      }
    } catch (err: any) {
      setError(err.message || "Се појави грешка при генерирање на сценариото.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getMarkdownContent = () => {
    if (!fullPackage?.scenario) return '';
    return `
# Сценарио за час: ${fullPackage.scenario.topic}

## 1. Содржина и поими
${fullPackage.scenario.content}

## 2. Стандарди за оценување
${fullPackage.scenario.standards}

## 3. Воведна активност (10 мин)
${fullPackage.scenario.introActivity}

## 4. Главни активности (20-25 мин)
${fullPackage.scenario.mainActivity}

## 5. Завршна активност (10 мин)
${fullPackage.scenario.finalActivity}

## 6. Потребни средства
${fullPackage.scenario.resources}

## 7. Следење на напредокот
${fullPackage.scenario.assessment}
    `.trim();
  };

  const handleDownloadMd = () => {
    const textContent = getMarkdownContent();
    const blob = new Blob([textContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Skenario_${fullPackage?.scenario.topic.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadWord = () => {
    if (!fullPackage?.scenario) return;
    const scenario = fullPackage.scenario;

    // Parse each section from Markdown to HTML
    const contentHtml = parse(fullPackage.scenario.content);
    const standardsHtml = parse(fullPackage.scenario.standards);
    const introHtml = parse(fullPackage.scenario.introActivity);
    const mainHtml = parse(fullPackage.scenario.mainActivity);
    const finalHtml = parse(fullPackage.scenario.finalActivity);
    const resourcesHtml = parse(fullPackage.scenario.resources);
    const assessmentHtml = parse(fullPackage.scenario.assessment);

    const themeTitle = THEMES.find(t => t.id === selectedThemeId)?.title || "ГЕОМЕТРИЈА";

    const fullHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Сценарио - ${fullPackage.scenario.topic}</title>
        <style>
          /* Define page size specifically for Word */
          @page Section1 {
            size: 29.7cm 21.0cm; /* A4 Landscape dimensions */
            margin: 1.5cm 1.5cm 1.5cm 1.5cm;
            mso-page-orientation: landscape;
            mso-header-margin: 35.4pt;
            mso-footer-margin: 35.4pt;
          }
          div.Section1 {
            page: Section1;
          }
          
          body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 10pt; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; table-layout: fixed; }
          td, th { border: 1px solid black; padding: 5px; vertical-align: top; word-wrap: break-word; }
          .header-cell { background-color: #f3f4f6; font-weight: bold; width: 30%; }
          .section-header { background-color: #e5e7eb; font-weight: bold; text-align: center; }
          h1, h2, h3 { margin: 5px 0; }
          ul, ol { padding-left: 20px; margin: 5px 0; }
          li { margin-bottom: 3px; }
        </style>
      </head>
      <body>
        <div class="Section1">
            <p style="text-align: right; font-size: 9pt; color: #666; border-bottom: 1px solid #ccc;">Мате-Ментор - Платформа за дигитално образование</p>
            
            <!-- Metadata Table -->
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
                <td class="header-cell">Наставна Единица:</td>
                <td style="font-weight: bold;">${scenario.topic}</td>
            </tr>
            <tr>
                <td class="header-cell">Време за реализација:</td>
                <td>1 Училишен час (40 мин.)</td>
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

            <!-- Main Content Table mimicking the Print View -->
            <table>
            <thead>
                <tr>
                    <th class="section-header" style="width: 15%;">Содржина (и поими)</th>
                    <th class="section-header" style="width: 20%;">Стандарди за оценување</th>
                    <th class="section-header" style="width: 35%;">Сценарио за часот</th>
                    <th class="section-header" style="width: 15%;">Средства</th>
                    <th class="section-header" style="width: 15%;">Следење на напредокот</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${contentHtml}</td>
                    <td>${standardsHtml}</td>
                    <td>
                        <p style="font-weight: bold; text-decoration: underline;">Воведна активност (10 мин.)</p>
                        ${introHtml}
                        <hr style="border-top: 1px dashed #999; margin: 10px 0;"/>
                        <p style="font-weight: bold; text-decoration: underline;">Главни активности (20 мин.)</p>
                        ${mainHtml}
                        <hr style="border-top: 1px dashed #999; margin: 10px 0;"/>
                        <p style="font-weight: bold; text-decoration: underline;">Завршна активност (10 мин.)</p>
                        ${finalHtml}
                    </td>
                    <td>${resourcesHtml}</td>
                    <td>${assessmentHtml}</td>
                </tr>
            </tbody>
            </table>

            <br/><br/>
            <table style="border: none;">
                <tr style="border: none;">
                    <td style="border: none; border-top: 1px solid black; padding-top: 10px;">Датум: ________________</td>
                    <td style="border: none; border-top: 1px solid black; padding-top: 10px; text-align: right;">Потпис: ________________</td>
                </tr>
            </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Skenario_${scenario.topic.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Force Landscape specifically for this component */}
      <style>{`
        @media print {
            @page {
                size: landscape;
            }
        }
      `}</style>

      {/* Controls - Hidden during print */}
      <div className="print:hidden space-y-6 animate-fade-in">
        <div className="border-b pb-4 mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              📋 Генератор на Сценарија
              <span className="text-sm font-normal text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{grade} Одд.</span>
          </h2>
          <p className="text-slate-500 mt-1">Креирајте детални подготовки за час подготвени за печатење.</p>
        </div>

        {/* Teacher Instruction */}
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-lg shadow-sm">
            <div className="flex items-start gap-3">
                <span className="text-2xl">📅</span>
                <div>
                    <p className="text-indigo-900 text-sm font-medium">
                        Планирајте го успехот!
                    </p>
                    <p className="text-indigo-800 text-sm mt-1">
                        Добрата подготовка е клуч за ефективен час. Овој генератор ви помага да креирате <strong>структурирани сценарија</strong> кои ги опфаќаат целите, активностите и оценувањето, заштедувајќи ви време за она што е најважно – работата со учениците.
                    </p>
                </div>
            </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-xl space-y-4">
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
                    <label className="block text-sm font-bold text-slate-700 mb-1">2. Избери Лекција</label>
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
                        ${fullPackage 
                            ? 'bg-white border-2 border-indigo-600 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50' // Strong Blue Outline
                            : 'bg-indigo-600 text-white hover:bg-indigo-700' // Solid
                        }
                    `}
                >
                    {loading ? 'Се генерира...' : (fullPackage ? '🔄 Регенерирај Сценарио' : '✨ Генерирај Сценарио')}
                </button>
            </div>
        </div>

        {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            <strong>Грешка:</strong> {error}
            </div>
        )}

        {loading && <Loading message="Се подготвува сценариото за час..." />}
      </div>

      {/* Scenario Preview / Print View */}
      {fullPackage?.scenario && !loading && (
        <div className="animate-slide-up">
            
             {/* PROFESSIONAL TOOLBAR STYLE */}
             <div className="print:hidden flex flex-wrap justify-end gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4">
             <div className="text-sm text-slate-500 mr-auto pl-2 font-medium hidden sm:block">
                Достапни формати:
             </div>
             
             {/* Word/MD Group with Thicker Blue Border */}
             <div className="flex rounded-lg shadow-sm bg-white border-2 border-indigo-600 divide-x-2 divide-indigo-600 overflow-hidden">
                <button 
                    onClick={handleDownloadMd}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50 transition-colors"
                    title="Преземи Markdown формат"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Markdown
                </button>
                <button 
                    onClick={handleDownloadWord}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50 transition-colors"
                    title="Преземи Microsoft Word формат"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Word Doc
                </button>
             </div>
             
             <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg shadow-md hover:bg-slate-800 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Печати Landscape
             </button>
          </div>

            {/* DOCUMENT LAYOUT - Adjusted to Landscape (297mm wide) */}
            <div className="bg-white p-8 print:p-0 border shadow-sm print:shadow-none print:border-none w-full max-w-[297mm] print:max-w-none mx-auto min-h-[210mm] print:min-h-0 text-sm text-black">
                
                {/* Header Table */}
                <div className="text-right text-xs text-slate-500 mb-2 border-b pb-1 hidden print:block">Мате-Ментор - Платформа за дигитално образование</div>
                <table className="w-full border-collapse border border-black mb-6">
                    <tbody>
                        <tr>
                            <td className="border border-black p-2 font-bold bg-slate-100 print:bg-gray-100 w-1/3">Предмет:</td>
                            <td className="border border-black p-2 w-2/3">Математика за {grade} одделение</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold bg-slate-100 print:bg-gray-100">Тема:</td>
                            <td className="border border-black p-2 uppercase font-bold">{THEMES.find(t => t.id === selectedThemeId)?.title || "ГЕОМЕТРИЈА"}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold bg-slate-100 print:bg-gray-100">Наставна Единица:</td>
                            <td className="border border-black p-2 font-bold">{fullPackage.scenario.topic}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold bg-slate-100 print:bg-gray-100">Време за реализација:</td>
                            <td className="border border-black p-2">1 Училишен час (40 мин.)</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold bg-slate-100 print:bg-gray-100">Изготвил/-а:</td>
                            <td className="border border-black p-2">{teacherName || '__________________'}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold bg-slate-100 print:bg-gray-100">ООУ:</td>
                            <td className="border border-black p-2">{schoolName || '__________________'}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Main Content Table */}
                <table className="w-full border-collapse border border-black text-left align-top">
                    <thead>
                        <tr className="bg-slate-100 print:bg-gray-100 text-center font-bold">
                            <th className="border border-black p-2 w-[15%]">Содржина (и поими)</th>
                            <th className="border border-black p-2 w-[20%]">Стандарди за оценување</th>
                            <th className="border border-black p-2 w-[35%]">Сценарио за часот</th>
                            <th className="border border-black p-2 w-[15%]">Средства</th>
                            <th className="border border-black p-2 w-[15%]">Следење на напредокот</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-black p-3 align-top">
                                <FormattedText text={fullPackage.scenario.content} />
                            </td>
                            <td className="border border-black p-3 align-top">
                                <FormattedText text={fullPackage.scenario.standards} />
                            </td>
                            <td className="border border-black p-3 align-top">
                                <div className="space-y-4">
                                    <div>
                                        <p className="font-bold underline mb-1">Воведна активност (10 мин.)</p>
                                        <FormattedText text={fullPackage.scenario.introActivity} className="text-justify" />
                                    </div>
                                    <div className="border-t border-dashed border-gray-400 pt-2">
                                        <p className="font-bold underline mb-1">Главни активности (20 мин.)</p>
                                        <FormattedText text={fullPackage.scenario.mainActivity} className="text-justify" />
                                    </div>
                                    <div className="border-t border-dashed border-gray-400 pt-2">
                                        <p className="font-bold underline mb-1">Завршна активност (10 мин.)</p>
                                        <FormattedText text={fullPackage.scenario.finalActivity} className="text-justify" />
                                    </div>
                                </div>
                            </td>
                            <td className="border border-black p-3 align-top">
                                <FormattedText text={fullPackage.scenario.resources} />
                            </td>
                            <td className="border border-black p-3 align-top">
                                <FormattedText text={fullPackage.scenario.assessment} />
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div className="mt-8 pt-4 border-t border-black print:block hidden">
                    <div className="flex justify-between text-xs">
                        <p>Датум: ________________</p>
                        <p>Потпис: ________________</p>
                    </div>
                </div>

            </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioGenerator;
