import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Upload, Trash2, Download, Loader2, FileSearch, CheckCircle2, AlertCircle } from 'lucide-react';
import FormattedText from './FormattedText';

const AI_REVIEWER_PROMPT = `Ти си врвен асистент за оценување математички тестови. Твоја задача е:

ПРВО: Идентификувај ги задачите на сликата и поените означени до нив (на пр. 5п, 10п).

ВТОРО: Анализирај го ракописот и провери ја точноста на секој чекор од решението.

ТРЕТО: Додели поени за секоја задача. Ако е делумно точна, додели соодветен дел од поените за точната постапка.

ЧЕТВРТО: Резултатот прикажи го во табела со колони: Задача, Макс. поени, Освоени поени и Краток педагошки коментар.

ПЕТТО: На крајот сумирај го вкупниот број на бодови.

ВАЖНО ЗА МАТЕМАТИЧКИ ФОРМУЛИ:
- Користи LaTeX формат за сите математички изрази, равенки и формули во твојот коментар и анализа (на пр. $x^2$, $3x + 5 = 20$, $\frac{a}{b}$).
- Користи единечни долари ($...$) за инлајн математика и двојни долари ($$...$$) за формули во посебен ред.

Сите коментари и анализи мора да бидат на македонски јазик.`;

const AIReviewer: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysis(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";

      const base64Data = image.split(',')[1];
      
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            parts: [
              { text: AI_REVIEWER_PROMPT },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data,
                },
              },
            ],
          },
        ],
      });

      setAnalysis(response.text || "Нема резултат од анализата.");
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError("Се случи грешка при анализата. Ве молиме обидете се повторно.");
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setImage(null);
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadReport = () => {
    if (!analysis) return;
    
    const element = document.createElement("a");
    const file = new Blob([analysis], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "AI_Review_Report.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-3">
            <FileSearch className="w-8 h-8 text-indigo-600" />
            АИ Прегледувач
          </h2>
          <p className="text-slate-500 text-sm">Автоматско оценување на рачно решени математички тестови</p>
        </div>
        
        <div className="flex gap-2">
          {image && (
            <button
              onClick={clearAll}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-200"
            >
              <Trash2 className="w-4 h-4" /> Исчисти
            </button>
          )}
          {analysis && (
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-200"
            >
              <Download className="w-4 h-4" /> Превземи извештај
            </button>
          )}
        </div>
      </div>

      {!image ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-indigo-200 rounded-3xl p-12 flex flex-col items-center justify-center bg-indigo-50/30 hover:bg-indigo-50/50 transition-all cursor-pointer group"
        >
          <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-10 h-10 text-indigo-500" />
          </div>
          <h3 className="text-lg font-bold text-indigo-900 mb-2">Прикачи слика од тест</h3>
          <p className="text-slate-500 text-center max-w-xs">
            Кликни овде за да избереш слика од рачно решен тест (JPG, PNG)
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side: Image */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-md border overflow-hidden sticky top-4">
              <div className="p-3 bg-slate-50 border-b flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Оригинален тест</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">СЛИКА</span>
              </div>
              <div className="p-2">
                <img 
                  src={image} 
                  alt="Test" 
                  className="w-full h-auto rounded-lg shadow-inner"
                  referrerPolicy="no-referrer"
                />
              </div>
              {!analysis && !loading && (
                <div className="p-4 bg-indigo-50 border-t">
                  <button
                    onClick={runAnalysis}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <FileSearch className="w-5 h-5" /> Започни АИ Анализа
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Analysis */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-md border min-h-[400px] flex flex-col">
              <div className="p-3 bg-slate-50 border-b flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">АИ Анализа и Оценување</span>
                {loading && (
                  <span className="flex items-center gap-2 text-[10px] text-indigo-600 font-bold animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" /> СЕ ОБРАБОТУВА...
                  </span>
                )}
                {analysis && !loading && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                    <CheckCircle2 className="w-3 h-3" /> ЗАВРШЕНО
                  </span>
                )}
              </div>
              
              <div className="p-6 flex-1">
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div>
                      <h4 className="font-bold text-indigo-900">Анализирање на ракописот...</h4>
                      <p className="text-sm text-slate-500">Gemini ги проверува математичките чекори и доделува поени.</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-red-50 rounded-xl border border-red-100">
                    <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                    <h4 className="font-bold text-red-900 mb-2">Грешка при анализата</h4>
                    <p className="text-sm text-red-700 mb-4">{error}</p>
                    <button 
                      onClick={runAnalysis}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all"
                    >
                      Обиди се повторно
                    </button>
                  </div>
                ) : analysis ? (
                  <div className="max-w-none">
                    <FormattedText text={analysis} />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                      <FileSearch className="w-8 h-8" />
                    </div>
                    <p className="max-w-xs italic">
                      Започнете ја анализата за да ги видите резултатите, поените и педагошките коментари.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIReviewer;
