import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PERSONA } from "../constants";

// Влечење на клучот - проверено работи на Vercel
const getAiClient = () => {
  // @ts-ignore
  const apiKey = import.meta.env.VITE_API_KEY || "";
  if (!apiKey) throw new Error("API Key missing");
  return new GoogleGenAI(apiKey);
};

const parseJsonSafe = (text: string) => {
  try {
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    return null;
  }
};

export const generateGameContent = async (topic: string, type: string, grade: string): Promise<any> => {
  try {
    const genAI = getAiClient();
    // Го користиме 'gemini-pro' бидејќи е најстабилен за овој тип на повици
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Ти си наставник по математика. Генерирај содржина за игра ${type} на тема ${topic} за ${grade} одделение.
      Врати исклучиво чист JSON формат без никаков друг текст.
      
      Ако типот е BINGO: {"questions": [{"question": "...", "answer": "..."} x 24]}
      Ако типот е ESCAPE_ROOM: {"riddles": [{"question": "...", "answer": "..."} x 5]}
      Ако типот е FLASHCARDS: {"cards": [{"question": "...", "answer": "..."} x 10]}
      Ако типот е PASSWORD: {"tasks": [{"question": "...", "answer": "..."} x 10]}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return parseJsonSafe(text);
  } catch (error) {
    console.error("Грешка при генерирање:", error);
    return null;
  }
};

// Останатите функции ги оставаме празни за да не кочат
export const generateLessonContent = async () => null;
export const generateLessonConnectivity = async () => "";
export const generateScenarioContent = async () => null;
export const generateQuizQuestions = async () => ({questions: [], rubric: ''});
export const generateWorksheet = async () => "";
export const generateProject = async () => "";
export const generateBoardPlan = async () => "";
export const generateCanvasAnimation = async () => "";
export const generateAdvancedProblem = async () => ({problem: "", solution: ""});
export const generateTeacherTask = async () => ({problem: "", hint: "", solution: ""});
