import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Loader2, Download, Copy, FileText, Settings2, Printer, FileDown, Type as TypeIcon, Layers } from 'lucide-react';
import FormattedText from './FormattedText';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { THEMES } from '../constants';
import { useAuth } from '../services/firebase';

const AI_CREATOR_PROMPT = `Ти си експерт за креирање на сумативни математички тестови и писмени работи според наставната програма на Бирото за развој на образованието во Македонија.

Твоја задача е да креираш професионална писмена работа за дадената тема и одделение.

ВАЖНО: СТРОГО Е ЗАБРАНЕТО КОРИСТЕЊЕ НА HTML ТАГОВИ (како <center>, <br>, <h1>, <div>). Користи исклучиво чист Markdown за форматирање.

ВАЖНО ЗА МАТЕМАТИЧКИ ФОРМУЛИ:
- Користи LaTeX формат за сите математички изрази и формули (пр. $x^2$, $\frac{a}{b}$, $\sqrt{x}$).
- Користи двојни долари за формули во посебен ред (пр. $$E = mc^2$$).

Формат на задачи по нивоа:
- Ниво 1: Задачите секогаш мора да бидат со понудени 4 одговори (multiple choice). Секоја задача носи точно 4 поени (4п).
- Ниво 2: Задачите мора да бидат со допишување на краток одговор (fill in the blank). Секоја задача носи точно 6 поени (6п).
- Ниво 3: Задачите се потешки и мора да имаат планиран простор за решавање (постапка). Секоја задача носи точно 10 поени (10п).

ВАЖНО ЗА ГЕОМЕТРИЈА:
- За задачи од геометрија (агли, форми, трансформации, дијаграми), МОЖЕШ да користиш чист <svg> код за да нацрташ едноставни дијаграми.
- SVG кодот треба да биде вклучен директно во Markdown.
- Користи едноставни форми: <line>, <circle>, <rect>, <text>, <polyline>.
- Постави viewBox="0 0 400 200" или слично, и користи стилови како stroke="black" fill="none".
- Текстот во SVG треба да биде на македонски јазик.
- ВАЖНО ЗА SVG ТЕКСТ: НЕ КОРИСТИ LaTeX ($...$) внатре во <text> таговите во SVG. Користи обични симболи или Unicode (пр. α, β, γ, °, 45°, x, y).
- Осигурај се дека текстот во SVG не се преклопува со линиите. Користи соодветни x и y координати за да го оддалечиш текстот од линиите.
- Пример за агли на трансверзала: нацртај две паралелни линии и една што ги сече, со означени агли користејќи α, β, γ.

Формат на излез:
1. Заглавие: ПИСМЕНА РАБОТА (центрирано)
2. Под заглавието: 'Име и презиме: _________ Одд: ____ Освоени поени: ____ / Вкупно: ____'
3. Содржина: Задачи поделени по нивоа. За секоја задача мора да стои ознака за поените.
4. Критериум за оценување (на крајот):
   - Креирај ПРЕГЛЕДНА ТАБЕЛА во Markdown формат со колони: Поени, Процент, Оценка.
   - Скала:
     - 0 - 29% = 1 (недоволен)
     - 30 - 49% = 2 (доволен)
     - 50 - 69% = 3 (добар)
     - 70 - 85% = 4 (многу добар)
     - 86 - 100% = 5 (одличен)
5. Завршок: 'Наставник: [ИМЕ_НА_НАСТАВНИК]'
6. Клуч со точни решенија на крајот (на посебна страна или јасно одвоено).

Сите задачи и упатства мора да бидат на македонски јазик. Користи соодветна математичка терминологија.`;

interface AICreatorProps {
  grade: string;
}

const AICreator: React.FC<AICreatorProps> = ({ grade }) => {
  const { user } = useAuth();
  const [testType, setTestType] = useState<'Стандардна' | 'Диференцирана'>('Стандардна');
  const [selectedThemeIds, setSelectedThemeIds] = useState<string[]>([]);
  const [level1Count, setLevel1Count] = useState(2);
  const [level2Count, setLevel2Count] = useState(2);
  const [level3Count, setLevel3Count] = useState(1);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredThemes = useMemo(() => THEMES.filter(t => t.grade === grade), [grade]);

  const toggleTheme = (id: string) => {
    setSelectedThemeIds(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const generateTest = async () => {
    if (selectedThemeIds.length === 0) return;

    setLoading(true);
    setError(null);

    const selectedThemesTitles = THEMES
      .filter(t => selectedThemeIds.includes(t.id))
      .map(t => t.title)
      .join(', ');
      
    const teacherName = user?.displayName || '________________';

    const differentiationInstructions = testType === 'Диференцирана' 
      ? `
      ВАЖНО: Ова е ДИФЕРЕНЦИРАНА писмена работа за ученици со потешкотии во учењето.
      - Користи поедноставен јазик и јасни инструкции.
      - Задачите треба да имаат помалку чекори за решавање.
      - Вклучи насоки, формули или мали потсетници како помош за секоја задача каде што е соодветно.
      - Нивото на тежина треба да биде прилагодено, но сепак да ги покрива основните стандарди.
      `
      : `
      ВАЖНО: Ова е СТАНДАРДНА писмена работа според редовната наставна програма.
      - Задачите треба да бидат со стандардна тежина за соодветното одделение.
      `;

    const prompt = `
      Креирај ${testType} писмена работа за ${grade} одделение.
      Теми: ${selectedThemesTitles}
      
      Број на задачи по нивоа:
      - Ниво 1 (4 поени по задача): ${level1Count} задачи
      - Ниво 2 (6 поени по задача): ${level2Count} задачи
      - Ниво 3 (10 поени по задача): ${level3Count} задачи
      
      ${differentiationInstructions}
      
      ВАЖНО: Направи соодветен и разновиден избор на задачи рамномерно распределени од сите избрани теми.
      
      Замени го [ИМЕ_НА_НАСТАВНИК] со ${teacherName}.
      
      ${AI_CREATOR_PROMPT}
    `;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      setResult(response.text || "Нема резултат.");
    } catch (err: any) {
      console.error("Creation error:", err);
      setError("Се случи грешка при креирањето. Ве молиме обидете се повторно.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      alert("Копирано во меморија!");
    }
  };

  const downloadMarkdown = () => {
    if (!result) return;
    const element = document.createElement("a");
    const file = new Blob([result], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `Pismena_Rabota_${grade}_Odd.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadWord = async () => {
    if (!result) return;

    // Helper to clean LaTeX math to plain text
    const cleanMath = (text: string) => {
      return text
        .replace(/<[^>]*>/g, '') // Strip any HTML tags
        .replace(/\$\$(.*?)\$\$/g, '$1')
        .replace(/\$(.*?)\$/g, '$1')
        .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, '$1/$2')
        .replace(/\\sqrt\{(.*?)\}/g, '√$1')
        .replace(/\\cdot/g, '·')
        .replace(/\\times/g, '×')
        .replace(/\\pm/g, '±')
        .replace(/\\le/g, '≤')
        .replace(/\\ge/g, '≥')
        .replace(/\\neq/g, '≠')
        .replace(/\\alpha/g, 'α')
        .replace(/\\beta/g, 'β')
        .replace(/\\gamma/g, 'γ')
        .replace(/\\pi/g, 'π')
        .replace(/\\degree/g, '°')
        .replace(/\^2/g, '²')
        .replace(/\^3/g, '³')
        .replace(/\^n/g, 'ⁿ')
        .replace(/_1/g, '₁')
        .replace(/_2/g, '₂')
        .replace(/_n/g, 'ₙ')
        .replace(/\\text\{(.*?)\}/g, '$1')
        .replace(/\\/g, ''); // Remove remaining backslashes
    };

    const lines = result.split('\n');
    const sections: (Paragraph | Table)[] = [];
    let currentTableRows: TableRow[] = [];
    let isInsideTable = false;

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      // Skip SVG tags in Word export for now (they won't render)
      if (trimmedLine.startsWith('<svg') || trimmedLine.includes('</svg>') || trimmedLine.startsWith('<line') || trimmedLine.startsWith('<circle') || trimmedLine.startsWith('<text') || trimmedLine.startsWith('<rect')) {
        if (trimmedLine.startsWith('<svg')) {
          sections.push(new Paragraph({ 
            children: [new TextRun({ text: "[Дијаграм: Погледнете го оригиналниот тест за сликата]", italics: true, color: "666666", size: 20 })],
            spacing: { before: 200, after: 200 }
          }));
        }
        return;
      }
      
      // Table detection (very basic)
      if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
        // Skip separator lines like |---|---|
        if (trimmedLine.includes('---')) {
          isInsideTable = true;
          return;
        }

        const cells = trimmedLine
          .split('|')
          .filter(cell => cell.trim() !== '' || (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')))
          .map(cell => cell.trim());
        
        // Handle cases where split might leave empty strings at ends
        const actualCells = trimmedLine.startsWith('|') && trimmedLine.endsWith('|') 
          ? trimmedLine.slice(1, -1).split('|').map(c => c.trim())
          : cells;

        if (actualCells.length > 0) {
          const tableRow = new TableRow({
            children: actualCells.map(cellText => (
              new TableCell({
                children: [new Paragraph({ 
                  children: [new TextRun({ text: cleanMath(cellText), size: 24 })],
                  alignment: AlignmentType.CENTER 
                })],
                width: { size: 100 / actualCells.length, type: WidthType.PERCENTAGE },
              })
            )),
          });

          currentTableRows.push(tableRow);
          isInsideTable = true;
          return;
        }
      } else if (isInsideTable && currentTableRows.length > 0) {
        // End of table
        sections.push(
          new Table({
            rows: currentTableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          })
        );
        currentTableRows = [];
        isInsideTable = false;
        // Don't return, process the current line as a normal paragraph
      }

      if (!trimmedLine && sections.length > 0) {
        sections.push(new Paragraph({ text: "" }));
        return;
      }

      // Check if it's the main title
      if (trimmedLine.toUpperCase().includes('ПИСМЕНА РАБОТА') && trimmedLine.length < 30) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine.replace(/#/g, '').trim(),
                bold: true,
                size: 32,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          })
        );
        return;
      }

      // Check if it's the student info line
      if (trimmedLine.includes('Име и презиме:')) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanMath(trimmedLine),
                size: 24,
              }),
            ],
            spacing: { after: 300 },
          })
        );
        return;
      }

      // Check if it's a Level header
      if (trimmedLine.startsWith('Ниво') || trimmedLine.startsWith('### Ниво') || trimmedLine.startsWith('## Ниво')) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine.replace(/#/g, '').trim(),
                bold: true,
                size: 28,
              }),
            ],
            spacing: { before: 400, after: 200 },
          })
        );
        return;
      }

      // Check if it's a task number
      const taskMatch = trimmedLine.match(/^(\d+\.)(.*)/);
      if (taskMatch) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: taskMatch[1],
                bold: true,
                size: 24,
              }),
              new TextRun({
                text: cleanMath(taskMatch[2]).replace(/\*\*/g, ''),
                size: 24,
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );
        return;
      }

      // General text line
      if (trimmedLine) {
        // Add extra space if it's a "space for solving" indicator
        const isSpaceIndicator = trimmedLine.toLowerCase().includes('простор за решавање') || 
                                trimmedLine.toLowerCase().includes('решение:');

        // Handle bold markdown in general text
        const parts = trimmedLine.split(/(\*\*.*?\*\*)/);
        const children = parts.map(part => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return new TextRun({
              text: cleanMath(part.slice(2, -2)),
              bold: true,
              size: 24,
            });
          }
          return new TextRun({
            text: cleanMath(part),
            size: 24,
          });
        });

        sections.push(
          new Paragraph({
            children: children,
            spacing: { 
              after: isSpaceIndicator ? 2400 : 150 // 2400 twips is about 4-5 lines
            },
          })
        );
      }
    });

    // Final table check
    if (isInsideTable && currentTableRows.length > 0) {
      sections.push(
        new Table({
          rows: currentTableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: sections,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Pismena_Rabota_${grade}_Odd.docx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            АИ Креатор на писмени работи
          </h2>
          <p className="text-slate-500 text-sm">Креирајте професионални сумативни тестови за неколку секунди</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm space-y-6 print:hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-indigo-900 flex items-center gap-2">
              <TypeIcon className="w-4 h-4" /> Вид на писмена
            </label>
            <div className="flex bg-indigo-50 p-1 rounded-xl">
              <button
                onClick={() => setTestType('Стандардна')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${testType === 'Стандардна' ? 'bg-white text-indigo-600 shadow-sm' : 'text-indigo-400 hover:text-indigo-600'}`}
              >
                Стандардна
              </button>
              <button
                onClick={() => setTestType('Диференцирана')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${testType === 'Диференцирана' ? 'bg-white text-indigo-600 shadow-sm' : 'text-indigo-400 hover:text-indigo-600'}`}
              >
                Диференцирана
              </button>
            </div>
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="block text-sm font-bold text-indigo-900 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Избери теми (може повеќе)
            </label>
            <div className="flex flex-wrap gap-2">
              {filteredThemes.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => toggleTheme(theme.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                    selectedThemeIds.includes(theme.id)
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                      : 'bg-white border-indigo-50 text-indigo-400 hover:border-indigo-200'
                  }`}
                >
                  {theme.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-4 border-t border-indigo-50">
          <div className="flex-1 w-full space-y-4">
            <label className="block text-sm font-bold text-indigo-900 flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Број на задачи по нивоа
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-600">Ниво 1 (4п)</span>
                  <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{level1Count} задачи</span>
                </div>
                <input
                  type="range" min="0" max="10" value={level1Count}
                  onChange={(e) => setLevel1Count(parseInt(e.target.value))}
                  className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-amber-600">Ниво 2 (6п)</span>
                  <span className="text-xs font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{level2Count} задачи</span>
                </div>
                <input
                  type="range" min="0" max="10" value={level2Count}
                  onChange={(e) => setLevel2Count(parseInt(e.target.value))}
                  className="w-full h-2 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-purple-600">Ниво 3 (10п)</span>
                  <span className="text-xs font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{level3Count} задачи</span>
                </div>
                <input
                  type="range" min="0" max="10" value={level3Count}
                  onChange={(e) => setLevel3Count(parseInt(e.target.value))}
                  className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="md:self-end">
            <button
              onClick={generateTest}
              disabled={loading || selectedThemeIds.length === 0}
              className="w-full md:w-auto px-10 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
              Генерирај писмена
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-3 print:hidden">
          <Loader2 className="w-5 h-5" /> {error}
        </div>
      )}

      {result && (
        <div className="bg-white rounded-3xl shadow-xl border overflow-hidden print:shadow-none print:border-none print:m-0">
          <div className="p-4 bg-slate-50 border-b flex justify-between items-center print:hidden">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span className="font-bold text-indigo-900">Преглед на писмената работа</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="p-2 hover:bg-white rounded-lg transition-colors text-indigo-600"
                title="Печати во PDF"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button
                onClick={downloadWord}
                className="p-2 hover:bg-white rounded-lg transition-colors text-blue-600"
                title="Симни како Word"
              >
                <FileDown className="w-5 h-5" />
              </button>
              <button
                onClick={downloadMarkdown}
                className="p-2 hover:bg-white rounded-lg transition-colors text-slate-600"
                title="Симни како Markdown"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={copyToClipboard}
                className="p-2 hover:bg-white rounded-lg transition-colors text-slate-600"
                title="Копирај"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-8 print:p-0">
            <FormattedText text={result} />
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="text-center py-12 text-slate-400 print:hidden">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10" />
          </div>
          <p className="max-w-xs mx-auto italic">
            Изберете една или повеќе теми за да генерирате комплетна писмена работа со задачи, бодови и клуч со решенија.
          </p>
        </div>
      )}

      <style>{`
        @media print {
          /* Ensure the formatted text is visible and takes full width */
          .formatted-text {
            display: block !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
          }
          
          /* Ensure title is centered in print */
          h1 { text-align: center !important; margin-bottom: 20px; }
          
          /* Remove any shadow/border from parent containers in print */
          .bg-white { background: transparent !important; box-shadow: none !important; border: none !important; }
          
          /* Table improvements for print */
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
        }
      `}</style>
    </div>
  );
};

export default AICreator;
