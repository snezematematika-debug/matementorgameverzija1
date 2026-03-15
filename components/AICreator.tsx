import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Sparkles, Loader2, Download, Copy, CheckCircle2, FileText, Settings2 } from 'lucide-react';
import Markdown from 'react-markdown';

const AI_CREATOR_PROMPT = `Ти си експерт за креирање на сумативни математички тестови и писмени работи според наставната програма на Бирото за развој на образованието.

Твоја задача е да креираш професионална писмена работа за дадената тема и одделение.
Писмената работа треба да содржи:
1. Наслов и основни податоци (Име, Презиме, Одделение, Датум).
2. Задачи поделени по нивоа на тежина (Лесно, Средно, Тешко).
3. Јасно дефинирани бодови за секоја задача.
4. Скала за оценување (бодови -> оценка).
5. Клуч со точни решенија на крајот.

Сите задачи и упатства мора да бидат на македонски јазик. Користи соодветна математичка терминологија.`;

interface AICreatorProps {
  grade: string;
}

const AICreator: React.FC<AICreatorProps> = ({ grade }) => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateTest = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";

      const response = await ai.models.generateContent({
        model,
        contents: `Креирај писмена работа за ${grade} одделение на тема: ${topic}. \n\n${AI_CREATOR_PROMPT}`,
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

  const downloadTest = () => {
    if (!result) return;
    const element = document.createElement("a");
    const file = new Blob([result], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Pismena_Rabota_${grade}_Odd_${topic.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-indigo-900 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            АИ Креатор на писмени работи
          </h2>
          <p className="text-slate-500 text-sm">Креирајте професионални сумативни тестови за неколку секунди</p>
        </div>
      </div>

      <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Тема на писмената работа
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="пр. Алгебарски изрази, Геометриски фигури..."
              className="w-full px-4 py-3 rounded-xl border-2 border-indigo-100 focus:border-indigo-500 focus:ring-0 outline-none transition-all"
            />
          </div>
          <div className="md:self-end">
            <button
              onClick={generateTest}
              disabled={loading || !topic.trim()}
              className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Генерирај
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-3">
          <Loader2 className="w-5 h-5" /> {error}
        </div>
      )}

      {result && (
        <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
          <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span className="font-bold text-indigo-900">Генерирана писмена работа</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="p-2 hover:bg-white rounded-lg transition-colors text-slate-600"
                title="Копирај"
              >
                <Copy className="w-5 h-5" />
              </button>
              <button
                onClick={downloadTest}
                className="p-2 hover:bg-white rounded-lg transition-colors text-emerald-600"
                title="Превземи"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-8 prose prose-indigo max-w-none">
            <Markdown>{result}</Markdown>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="text-center py-12 text-slate-400">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10" />
          </div>
          <p className="max-w-xs mx-auto italic">
            Внесете тема за да генерирате комплетна писмена работа со задачи, бодови и клуч со решенија.
          </p>
        </div>
      )}
    </div>
  );
};

export default AICreator;
