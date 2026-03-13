
import React, { useState, useEffect } from 'react';
import { CURRICULUM, THEMES } from '../constants';
import { generateIEPPlan } from '../services/geminiService';
import { GradeLevel } from '../types';
import Loading from './Loading';
import FormattedText from './FormattedText';
import { Sparkles, FileText, Download, Printer, Users, Brain, Heart, Star } from 'lucide-react';

interface InclusionGeneratorProps {
  grade: GradeLevel;
}

const DISABILITY_TYPES = [
  {
    id: 'learning',
    label: 'Специфични потешкотии во учењето',
    subtypes: [
      { id: 'dyslexia', label: 'Дислексија (потешкотии со читање текст)' },
      { id: 'dysgraphia', label: 'Дисграфија (потешкотии со пишување/цртање)' },
      { id: 'dyscalculia', label: 'Дискалкулија (специфични потешкотии со разбирање броеви и операции)' }
    ]
  },
  {
    id: 'autism',
    label: 'Спектрум на аутизам (ASD)',
    subtypes: [
      { id: 'asd1', label: 'Ниво 1 (Високофункционален): Потребна е поддршка во социјална комуникација' },
      { id: 'asd2', label: 'Ниво 2: Потребна е значителна поддршка и јасни рутини' },
      { id: 'asd3', label: 'Ниво 3: Потребна е многу интензивна поддршка и визуелна комуникација' }
    ]
  },
  {
    id: 'intellectual',
    label: 'Интелектуална попреченост',
    subtypes: [
      { id: 'intellectual_mild', label: 'Лесна, Умерена или Тешка (пр. Даунов синдром)' }
    ]
  },
  {
    id: 'adhd',
    label: 'ADHD (Нарушување на вниманието)',
    subtypes: [
      { id: 'adhd_inattentive', label: 'Претежно невнимание (лесно се дефокусира)' },
      { id: 'adhd_hyperactive', label: 'Хиперактивност и импулсивност' }
    ]
  },
  {
    id: 'sensory',
    label: 'Сензорни пречки',
    subtypes: [
      { id: 'vision', label: 'Оштетен вид (слабовидост)' },
      { id: 'hearing', label: 'Оштетен слух' }
    ]
  },
  {
    id: 'physical',
    label: 'Телесна попреченост',
    subtypes: [
      { id: 'motor', label: 'Потешкотии со фина моторика (користење глушец/тастатура/пенкало)' }
    ]
  }
];

const ADAPTATION_LEVELS = [
  { id: 'adaptation', label: 'Адаптација (Environment/Method): Истата лекција, но со повеќе слики, поголем фонт и повеќе време' },
  { id: 'modification', label: 'Модификација (Content): Намалување на сложеноста (пр. намален обем на задачи)' },
  { id: 'initial', label: 'Иницијални вештини: Фокус на основни вештини (пр. препознавање на бројот наместо пресметување)' }
];

const LEARNING_STYLES = [
  { id: 'visual', label: 'Визуелен тип: Сака графикони, бои, дијаграми' },
  { id: 'auditory', label: 'Аудитивен тип: Сака да му се објасни со зборови или звук' },
  { id: 'kinesthetic', label: 'Кинестетички тип: Сака „правење“ (влечење објекти, моделирање)' }
];

const InclusionGenerator: React.FC<InclusionGeneratorProps> = ({ grade }) => {
  const [selectedThemeId, setSelectedThemeId] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedDisability, setSelectedDisability] = useState<string>("");
  const [selectedAdaptation, setSelectedAdaptation] = useState<string>(ADAPTATION_LEVELS[0].id);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [interests, setInterests] = useState<string>("");
  
  const [iepPlan, setIepPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredThemes = THEMES.filter(t => t.grade === grade);
  const availableTopics = CURRICULUM.filter(topic => topic.themeId === selectedThemeId && topic.grade === grade);

  useEffect(() => {
    if (filteredThemes.length > 0) {
      setSelectedThemeId(filteredThemes[0].id);
    }
  }, [grade]);

  useEffect(() => {
    if (availableTopics.length > 0) {
      setSelectedTopic(availableTopics[0].name);
    }
  }, [selectedThemeId]);

  const handleToggleStyle = (id: string) => {
    setSelectedStyles(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!selectedTopic || !selectedDisability) {
        setError("Ве молиме изберете лекција и тип на попреченост.");
        return;
    }

    setLoading(true);
    setError(null);
    setIepPlan(null);

    try {
      const disabilityLabel = DISABILITY_TYPES.flatMap(d => d.subtypes).find(s => s.id === selectedDisability)?.label || selectedDisability;
      const adaptationLabel = ADAPTATION_LEVELS.find(a => a.id === selectedAdaptation)?.label || selectedAdaptation;
      const stylesLabels = LEARNING_STYLES.filter(s => selectedStyles.includes(s.id)).map(s => s.label);

      const result = await generateIEPPlan({
        topic: selectedTopic,
        grade,
        disabilityType: disabilityLabel,
        adaptationLevel: adaptationLabel,
        learningStyles: stylesLabels,
        interests
      });
      if (result) {
        setIepPlan(result);
      } else {
        throw new Error("Неуспешно генерирање на ИОП планот.");
      }
    } catch (err: any) {
      setError(err.message || "Се појави грешка при генерирање на ИОП планот.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!iepPlan) return;
    const blob = new Blob([iepPlan], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IOP_${selectedTopic.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadWord = () => {
    if (!iepPlan) return;
    
    // Simple HTML to Word conversion using a blob
    const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>ИОП План</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; }
          h1 { color: #1e3a8a; text-align: center; }
          h2 { color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 20px; }
          h3 { color: #1d4ed8; }
          ul, ol { margin-bottom: 15px; }
          li { margin-bottom: 5px; }
          .header-info { background: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
          .footer-signatures { margin-top: 50px; }
          .sig-box { display: inline-block; width: 30%; text-align: center; margin-right: 3%; }
          .sig-line { border-bottom: 1px solid #000; margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <h1>Индивидуализиран Образовен План (ИОП)</h1>
        <div class="header-info">
          <p><strong>Одделение:</strong> ${grade}</p>
          <p><strong>Наставна тема:</strong> ${THEMES.find(t => t.id === selectedThemeId)?.title}</p>
          <p><strong>Наставна единица:</strong> ${selectedTopic}</p>
          <p><strong>Тип на поддршка:</strong> ${DISABILITY_TYPES.flatMap(d => d.subtypes).find(s => s.id === selectedDisability)?.label}</p>
        </div>
        <div>
          ${iepPlan.replace(/\n/g, '<br>').replace(/### (.*)/g, '<h2>$1</h2>').replace(/## (.*)/g, '<h1>$1</h1>').replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')}
        </div>
        <div class="footer-signatures">
          <div class="sig-box"><div class="sig-line"></div><p>Наставник</p></div>
          <div class="sig-box"><div class="sig-line"></div><p>Стручен соработник</p></div>
          <div class="sig-box"><div class="sig-line"></div><p>Родител/Старател</p></div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', header], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IOP_${selectedTopic.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="print:hidden">
        <div className="border-b pb-4 mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Heart className="text-rose-500" /> Инклузија: Персонализирај за ИОП
            <span className="text-sm font-normal text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">{grade} Одд.</span>
          </h2>
          <p className="text-slate-500 mt-1">Креирајте прилагоден образовен план за ученици со посебни образовни потреби.</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Topic Selection */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <FileText size={18} className="text-indigo-500" /> 1. Избор на лекција
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Тема</label>
                  <select 
                    value={selectedThemeId}
                    onChange={(e) => setSelectedThemeId(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-sm"
                  >
                    {filteredThemes.map(theme => (
                      <option key={theme.id} value={theme.id}>{theme.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Лекција</label>
                  <select 
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-sm"
                  >
                    {availableTopics.map(topic => (
                      <option key={topic.id} value={topic.name}>{topic.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Disability Selection */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Users size={18} className="text-indigo-500" /> 2. Тип на попреченост
              </h3>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Изберете специфична состојба</label>
                <select 
                  value={selectedDisability}
                  onChange={(e) => setSelectedDisability(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-sm"
                >
                  <option value="">-- Избери --</option>
                  {DISABILITY_TYPES.map(group => (
                    <optgroup key={group.id} label={group.label}>
                      {group.subtypes.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            {/* Adaptation Level */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Brain size={18} className="text-indigo-500" /> 3. Ниво на прилагодување
              </h3>
              <div className="space-y-2">
                {ADAPTATION_LEVELS.map(level => (
                  <label key={level.id} className={`
                    flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${selectedAdaptation === level.id 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50'}
                  `}>
                    <input 
                      type="radio" 
                      name="adaptation" 
                      className="mt-1"
                      checked={selectedAdaptation === level.id}
                      onChange={() => setSelectedAdaptation(level.id)}
                    />
                    <span className="text-sm text-slate-700">{level.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Learning Styles & Interests */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Star size={18} className="text-indigo-500" /> 4. Силни страни и интереси
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2 uppercase">Стилови на учење</label>
                  <div className="flex flex-wrap gap-2">
                    {LEARNING_STYLES.map(style => (
                      <button
                        key={style.id}
                        onClick={() => handleToggleStyle(style.id)}
                        className={`
                          px-3 py-1.5 rounded-full text-xs font-medium transition-all border
                          ${selectedStyles.includes(style.id)
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}
                        `}
                      >
                        {style.label.split(':')[0]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Специфични интереси (пр. животни, вселена...)</label>
                  <textarea 
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="Што го мотивира ученикот?"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-sm h-20 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleGenerate}
              disabled={loading || !selectedTopic || !selectedDisability}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Се подготвува планот...
                </>
              ) : (
                <>
                  <Sparkles size={20} /> Генерирај ИОП План
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
            <strong>Грешка:</strong> {error}
          </div>
        )}
      </div>

      {loading && (
        <div className="py-12 flex flex-col items-center justify-center">
          <Loading message="Наставникот и дефектологот соработуваат на планот..." />
        </div>
      )}

      {iepPlan && !loading && (
        <div className="space-y-6 animate-slide-up">
          <div className="print:hidden flex justify-end gap-3">
            <button 
              onClick={handleDownloadWord}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-sm"
            >
              <Download size={18} /> Преземи (Word)
            </button>
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium"
            >
              <FileText size={18} /> Преземи (.md)
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all font-medium shadow-sm"
            >
              <Printer size={18} /> Печати PDF
            </button>
          </div>

          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
            <div className="hidden print:block mb-8 border-b pb-4">
                <h1 className="text-2xl font-bold text-center">Индивидуализиран Образовен План (ИОП)</h1>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <p><strong>Одделение:</strong> {grade}</p>
                    <p><strong>Наставна тема:</strong> {THEMES.find(t => t.id === selectedThemeId)?.title}</p>
                    <p><strong>Наставна единица:</strong> {selectedTopic}</p>
                    <p><strong>Тип на поддршка:</strong> {DISABILITY_TYPES.flatMap(d => d.subtypes).find(s => s.id === selectedDisability)?.label}</p>
                </div>
            </div>
            <div className="prose prose-indigo max-w-none">
              <FormattedText text={iepPlan} />
            </div>
            <div className="hidden print:block mt-12 pt-8 border-t border-slate-200">
                <div className="flex justify-between text-sm">
                    <div className="text-center">
                        <div className="w-48 border-b border-slate-400 mb-1"></div>
                        <p>Наставник</p>
                    </div>
                    <div className="text-center">
                        <div className="w-48 border-b border-slate-400 mb-1"></div>
                        <p>Стручен соработник</p>
                    </div>
                    <div className="text-center">
                        <div className="w-48 border-b border-slate-400 mb-1"></div>
                        <p>Родител/Старател</p>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InclusionGenerator;
