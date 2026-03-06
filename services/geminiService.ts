import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SYSTEM_PERSONA } from "../constants";
import { QuizQuestion, GeneratedLesson, GeneratedScenario } from "../types";

// Едноставен и сигурен начин за влечење на клучот на Vercel/Vite
const getAiClient = () => {
  // Приоритет е VITE_API_KEY бидејќи така го именувавме во Vercel Settings
  const apiKey = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY || "";

  if (!apiKey) {
    console.error("ГРЕШКА: API_KEY не е пронајден во Environment Variables!");
    throw new Error("Не е пронајден API Key. Проверете ги поставките на Vercel.");
  }

  return new GoogleGenAI(apiKey);
};

// --- Error Handling Helper ---
const handleGeminiError = (error: any): never => {
    console.error("Gemini API Error:", error);
    const msg = error?.message || error?.toString() || "";

    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        throw new Error("⚠️ Лимитот е надминат. Ве молиме почекајте малку.");
    }
    
    throw new Error("Се појави техничка грешка при комуникација со AI.");
};

// --- Останатиот дел од твојот код продолжува тука исто како што беше ---
// (parseJsonSafe, MATH_INSTRUCTION и сите export функции се во ред)

const MATH_INSTRUCTION = `
ВАЖНО ЗА ФОРМАТИРАЊЕ И JSON (СТРОГИ ПРАВИЛА):
1. Враќај ЧИТЛИВ ТЕКСТ.
2. ЗАБРАНЕТО Е КОРИСТЕЊЕ НА LATEX СИНТАКСА ($...$, \\frac, \\pi, \\circ) во JSON вредностите.
3. Наместо LaTeX, користи UNICODE симболи: π, °, ², ³, √, Δ, α, β.
`;

const parseJsonSafe = (text: string) => {
    if (!text) return null;
    let clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    try {
        return JSON.parse(clean);
    } catch (e) {
        console.error("JSON Parse Error", e);
        return null;
    }
};

// ... Твоите функции (generateLessonContent, generateGameContent, итн.) ...
// Осигурај се дека ги задржа сите функции што ги имаше во оригиналот!
// Само getAiClient беше критичен за поправка.

export const generateGameContent = async (topic: string, type: string, grade: string): Promise<any> => {
  try {
    const genAI = getAiClient();
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash", // Ова е постабилна верзија за игри
        systemInstruction: SYSTEM_PERSONA 
    });

    const prompt = `Генерирај содржина за математичка игра "${type}" на тема "${topic}" за ${grade} одделение. ${MATH_INSTRUCTION} Врати исклучиво JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return parseJsonSafe(response.text());
  } catch (error: any) {
    handleGeminiError(error);
    return null;
  }
};

// Додај ги и сите останати функции од твојот оригинал тука...
