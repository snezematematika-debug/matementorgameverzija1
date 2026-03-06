import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SYSTEM_PERSONA } from "../constants";
import { QuizQuestion, GeneratedLesson, GeneratedScenario } from "../types";

// 1. Сигурна функција за клучот (Специјално за Vite + Vercel)
const getAiClient = () => {
  // @ts-ignore
  const apiKey = import.meta.env.VITE_API_KEY || "";

  if (!apiKey) {
    throw new Error("Не е пронајден VITE_API_KEY во поставките на Vercel.");
  }
  return new GoogleGenAI(apiKey);
};

// 2. Помошник за читање на JSON од AI
const parseJsonSafe = (text: string) => {
    if (!text) return null;
    try {
        // Чистење на можни Markdown ознаки (```json ... ```)
        let clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(clean);
    } catch (e) {
        console.error("Грешка при читање на JSON:", e);
        return null;
    }
};

// 3. СТРОГИ ПРАВИЛА ЗА МАТЕМАТИКА
const MATH_INSTRUCTION = `
ВАЖНО: Користи само Unicode симболи (π, °, ², √). ЗАБРАНЕТО Е LaTeX ($...$, \\frac). 
Врати само чист JSON објект без дополнителен текст.
`;

// 4. ГЛАВНАТА ФУНКЦИЈА ЗА ИГРИТЕ (BINGO, ESCAPE ROOM...)
export const generateGameContent = async (topic: string, type: string, grade: string): Promise<any> => {
  try {
    const genAI = getAiClient();
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: SYSTEM_PERSONA 
    });

    const prompt = `Генерирај содржина за математичка игра "${type}" на тема "${topic}" за ${grade} одделение. 
    ${MATH_INSTRUCTION}
    
    Ако е BINGO: врати {"questions": [{"question": "...", "answer": "..."} x 24]}.
    Ако е ESCAPE_ROOM: врати {"riddles": [{"question": "...", "answer": "..."} x 5]}.
    Ако е FLASHCARDS: врати {"cards": [{"question": "...", "answer": "..."} x 10]}.
    Ако е PASSWORD: врати {"tasks": [{"question": "...", "answer": "..."} x 10]}.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return parseJsonSafe(text);
  } catch (error: any) {
    console.error("Gemini Game Error:", error);
    throw new Error("Не успеавме да ја генерираме играта. Обидете се повторно.");
  }
};

// 5. ФУНКЦИЈА ЗА ЛЕКЦИИ
export const generateLessonContent = async (topic: string, grade: string, includeContext: boolean = false): Promise<GeneratedLesson> => {
  try {
    const genAI = getAiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Креирај лекција за ${grade} одд на тема ${topic}. Врати JSON со: title, objectives[], content (Markdown). ${MATH_INSTRUCTION}`;
    
    const result = await model.generateContent(prompt);
    return parseJsonSafe(result.response.text()) as GeneratedLesson;
  } catch (error) {
    return null as any;
  }
};

// ДОДАДИ ГИ ПРАЗНИТЕ ФУНКЦИИ (За да не јавува грешка во другите делови од апликацијата)
export const generateLessonConnectivity = async (t: string, g: string) => "";
export const generateScenarioContent = async (t: string) => null;
export const generateQuizQuestions = async (t: string, g: string) => ({questions: [], rubric: ''});
export const generateWorksheet = async (t: string) => "";
export const generateProject = async (t: string) => "";
export const generateBoardPlan = async (t: string, g: string) => "";
export const generateCanvasAnimation = async (d: string) => "";
export const generateAdvancedProblem = async (c: string, g: string) => ({problem: "", solution: ""});
export const generateTeacherTask = async (t: string, g: string) => ({problem: "", hint: "", solution: ""});
