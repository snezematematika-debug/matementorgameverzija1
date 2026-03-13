
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SYSTEM_PERSONA } from "../constants";
import { QuizQuestion, GeneratedLesson, GeneratedScenario, LessonPackage } from "../types";
import { incrementDailyQuota, trackGeneration } from "./analyticsService";
import { getCachedResponse, saveToCache } from "./cacheService";

// Helper to safely get the API client
const getAiClient = () => {
  let apiKey = '';

  // Try all possible ways to get the API key in Vite/Vercel environments
  try {
    // @ts-ignore
    apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
             // @ts-ignore
             (typeof process !== 'undefined' && process.env?.API_KEY) ||
             // @ts-ignore
             (typeof process !== 'undefined' && process.env?.VITE_API_KEY) ||
             // @ts-ignore
             import.meta.env?.VITE_API_KEY || 
             // @ts-ignore
             import.meta.env?.GEMINI_API_KEY ||
             // @ts-ignore
             import.meta.env?.API_KEY || '';
  } catch (e) {
    // Fallback
  }

  if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
    console.error("API_KEY is missing.");
    throw new Error("Не е пронајден API Key. Ве молиме додадете 'GEMINI_API_KEY' во Vercel Environment Variables и направете Redeploy.");
  }

  return new GoogleGenAI({ apiKey });
};

// --- Error Handling Helper ---
const handleGeminiError = (error: any): never => {
    console.error("Gemini API Error:", error);
    const msg = error?.message || error?.toString() || "";

    // Check for Quota Exceeded (429)
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
        throw new Error("⚠️ Надминат е дневниот лимит за бесплатни барања (Error 429). Google Gemini (Free Tier) има ограничувања. Ве молиме почекајте или обидете се утре.");
    }
    
    // Check for Overloaded (503)
    if (msg.includes("503") || msg.includes("Overloaded") || msg.includes("Service Unavailable")) {
        throw new Error("⚠️ Серверот на Google е моментално преоптоварен. Ве молиме почекајте неколку секунди и обидете се повторно.");
    }

    // Check for Safety/Policy blocking
    if (msg.includes("SAFETY") || msg.includes("BLOCKED")) {
        throw new Error("⚠️ Содржината беше блокирана од безбедносните филтри на Google. Обидете се со поинаква формулација.");
    }

    // Default friendly message with a hint of the actual error
    throw new Error(`Техничка грешка при комуникација со AI: ${msg.substring(0, 50)}${msg.length > 50 ? '...' : ''}`);
};

/**
 * Helper to call Gemini with automatic retry for 503 errors
 */
const callGeminiWithRetry = async (params: any, retries = 2): Promise<any> => {
  try {
    const ai = getAiClient();
    return await ai.models.generateContent(params);
  } catch (error: any) {
    const msg = error?.message || "";
    if ((msg.includes("503") || msg.includes("Overloaded")) && retries > 0) {
      console.log(`Server overloaded, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      return callGeminiWithRetry(params, retries - 1);
    }
    throw error;
  }
};

// Common instruction for Math Formatting
const MATH_INSTRUCTION = `
ВАЖНО ЗА ФОРМАТИРАЊЕ И JSON (СТРОГИ ПРАВИЛА):
1. Враќај ЧИТЛИВ ТЕКСТ.
2. ЗАБРАНЕТО Е КОРИСТЕЊЕ НА LATEX СИНТАКСА ($...$, \\frac, \\pi, \\circ) во JSON вредностите.
3. ЗАБРАНЕТО Е КОРИСТЕЊЕ НА КОСИ ЦРТИ (BACKSLASHES \\) бидејќи тие го рушат JSON форматот.
4. Наместо LaTeX, користи UNICODE симболи и обичен текст:
   - π (Unicode) наместо \\pi
   - ° (Unicode) наместо ^\\circ
   - ² (Unicode) наместо ^2
   - ³ (Unicode) наместо ^3
   - √ (Unicode) наместо \\sqrt
   - Δ (Unicode) наместо \\triangle
   - α, β, γ (Unicode) за агли.
   - P = 2·r·π (обичен запис).
5. За болдирање користи **текст**.
`;

// Helper function to handle JSON parsing more robustly
const parseJsonSafe = (text: string) => {
    if (!text) return null;

    // 0. Pre-clean common AI artifacts
    let clean = text.replace(/svg\s*<svg/gi, '<svg');
    clean = clean.replace(/svg\s*```/gi, '```');

    // 1. Remove Markdown code blocks if present
    clean = clean.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        return JSON.parse(clean);
    } catch (e) {
        console.warn("Standard JSON parse failed, attempting fallback...", e);
        try {
            // 2. Fallback: If AI still messed up backslashes despite instructions
            const fixed = clean.replace(/\\/g, '/'); 
            return JSON.parse(fixed);
        } catch (e2) {
            console.error("Auto-fix failed. Original text:", text);
            throw new Error("Неуспешно читање на одговорот од AI (Invalid JSON). Ве молиме обидете се повторно.");
        }
    }
};

export const generateLessonContent = async (topic: string, grade: string, includeContext: boolean = false): Promise<GeneratedLesson> => {
  const cached = await getCachedResponse('lesson', { topic, grade, includeContext });
  if (cached) return cached;

  try {
    const ai = getAiClient();
    
    let contextInstruction = "";
    if (includeContext) {
      contextInstruction = `
      ДОПОЛНИТЕЛНА СЕКЦИЈА (ЗАДОЛЖИТЕЛНО):
      Вклучи посебна секција на крајот (пред задачите за вежбање) насловена '🌍 Математика околу нас'.
      Во оваа секција, објасни го концептот користејќи примери блиски за модерните тинејџери (на пр. Видео игри, Социјални мрежи, Спорт, Шопинг/Попусти, Пари).
      Користи пристап на раскажување приказни (Story Problems) за да покажеш зошто е ова важно.
      `;
    }

    const prompt = `
      Креирај лекција за ${grade} одделение на тема: "${topic}".
      Лекцијата треба да биде интерактивна и разбирлива.
      
      Структура:
      1. Наслов.
      2. Што ќе научиме (3 цели).
      3. Главен дел (Дефиниции, Својства, Примери).
      ${includeContext ? "4. 🌍 Математика околу нас (Contextual Learning)." : ""}
      ${includeContext ? "5." : "4."} Задача за вежбање.
      ${includeContext ? "6." : "5."} 🏠 Предлог за домашна работа (со посебен дел за решенија).
      
      ${contextInstruction}

      СЕКЦИЈА ЗА ДОМАШНА РАБОТА (СПЕЦИФИЧЕН ФОРМАТ):
      На самиот крај на содржината, додај наслов "### 🏠 Предлог за домашна работа".
      1. Генерирај 3 до 5 текстуални задачи (растечка тежина) БЕЗ РЕШЕНИЈА веднаш до нив.
      2. Веднаш по задачите, додај сепаратор (хоризонтална линија: ---).
      3. Под линијата, додај нов наслов "### 🔑 Решенија (Само за наставникот)".
      4. Тука напиши ги решенијата нумерирани исто како задачите (на пр. "1. x=5").
      
      ВИЗУЕЛИЗАЦИЈА (SVG ДИЈАГРАМИ):
      Ако лекцијата вклучува геометриски форми, агли, координатни системи или графички приказ на податоци, ЗАДОЛЖИТЕЛНО генерирај SVG код.
      
      ИНСТРУКЦИИ ЗА SVG:
      1. Вметни го SVG кодот ДИРЕКТНО во текстот како обичен HTML.
      2. НЕ КОРИСТИ CODE BLOCKS (на пр. \`\`\`svg ... \`\`\`). 
      3. Напиши го само тагот: <svg viewBox="0 0 300 200" ...> ... </svg>
      4. Осигурај се дека сите тагови се правилно затворени.
      5. Користи црни линии (stroke="black") и јасни ознаки.

      ${MATH_INSTRUCTION}

      Врати JSON:
      {
        "title": "String",
        "objectives": ["String", "String", "String"],
        "content": "String (Markdown + Unicode Math + Raw HTML SVG)"
      }
    `;

    const response = await callGeminiWithRetry({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PERSONA,
        responseMimeType: "application/json",
      }
    });

    // Track usage (non-blocking)
    incrementDailyQuota().catch(e => console.error("Quota increment failed:", e));
    trackGeneration({
      contentType: 'lesson',
      topic,
      grade,
      model: 'gemini-3-flash-preview'
    }).catch(e => console.error("Generation tracking failed:", e));

    const text = response.text;
    if (!text) throw new Error("No response content from AI");
    
    const result = parseJsonSafe(text) as GeneratedLesson;
    if (result) {
      await saveToCache('lesson', { topic, grade, includeContext }, result);
    }
    return result;
  } catch (error: any) {
    handleGeminiError(error);
    return null as any; // Unreachable due to throw
  }
};

export const generateLessonConnectivity = async (topic: string, grade: string): Promise<string> => {
    const cached = await getCachedResponse('connectivity', { topic, grade });
    if (cached) return cached;

    try {
      const ai = getAiClient();
      const prompt = `
        ТИ СИ МЕТОДИЧКИ АСИСТЕНТ ЗА НАСТАВНИЦИ ПО МАТЕМАТИКА.

        Задача: Креирај приказ на вертикалната (спирална) поврзаност за лекцијата "${topic}" (${grade}).

        ИНСТРУКЦИИ ЗА ФОРМАТИРАЊЕ (СТРОГО):
        Не враќај Markdown. Врати ЧИСТ HTML код користејќи Tailwind CSS класи за стилизирање.
        Следи го следниот визуелен дизајн:

        1. За "Претходно": Користи светло сина позадина (bg-blue-50), сина рамка (border-blue-200) и икона ⏪.
        2. За "Сега": Користи светло виолетова позадина (bg-indigo-50), виолетова рамка (border-indigo-200) и икона 🎯.
        3. За "Потоа": Користи светло зелена позадина (bg-emerald-50), зелена рамка (border-emerald-200) и икона ⏩.

        СТРУКТУРА НА HTML КОДОТ ШТО ТРЕБА ДА ГО ВРАТИШ (Само пополни го текстот):

        <div class="space-y-4 font-sans text-base">
          <!-- Previous Block -->
          <div class="bg-blue-50 p-5 rounded-2xl border border-blue-200 shadow-sm transition-all hover:shadow-md">
             <div class="flex items-center gap-3 mb-2">
                <span class="text-xl bg-blue-100 p-1.5 rounded-lg">⏪</span>
                <h4 class="font-bold text-blue-900 text-lg m-0">Претходно</h4>
             </div>
             <p class="text-blue-900 text-sm leading-relaxed m-0 opacity-90">
                [Овде напиши кратко што ученикот веќе знае од пониските одделенија поврзано со оваа тема]
             </p>
          </div>

          <!-- Now Block -->
          <div class="bg-indigo-50 p-5 rounded-2xl border-2 border-indigo-200 shadow-md relative overflow-hidden">
             <div class="absolute top-0 right-0 w-16 h-16 bg-indigo-100 rounded-full blur-2xl -mr-8 -mt-8 opacity-50"></div>
             <div class="flex items-center gap-3 mb-2 relative z-10">
                <span class="text-xl bg-indigo-100 p-1.5 rounded-lg">🎯</span>
                <h4 class="font-bold text-indigo-900 text-lg m-0">Сега (Фокус)</h4>
             </div>
             <p class="text-indigo-900 text-sm leading-relaxed m-0 font-medium relative z-10">
                [Овде напиши ја методичката цел на тековната лекција и новите поими]
             </p>
          </div>

          <!-- Next Block -->
          <div class="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-sm transition-all hover:shadow-md">
             <div class="flex items-center gap-3 mb-2">
                <span class="text-xl bg-emerald-100 p-1.5 rounded-lg">⏩</span>
                <h4 class="font-bold text-emerald-900 text-lg m-0">Потоа (Иднина)</h4>
             </div>
             <p class="text-emerald-900 text-sm leading-relaxed m-0 opacity-90">
                [Овде напиши како ова знаење ќе се надгради во повисоките одделенија]
             </p>
          </div>
        </div>

        СОДРЖИНА:
        Биди концизен. По 1-2 реченици за секој дел.
      `;
  
      const response = await callGeminiWithRetry({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "You are a professional teaching assistant. You output raw HTML suitable for embedding in a React component.",
        }
      });
  
      const text = response.text;
      if (!text) throw new Error("No response content");
      
      // Clean up markdown code blocks if AI adds them by mistake
      const result = text.replace(/```html/g, '').replace(/```/g, '').trim();
      if (result) {
        await saveToCache('connectivity', { topic, grade }, result);
      }
      return result;
  
    } catch (error: any) {
      handleGeminiError(error);
      return "";
    }
  };

export const generateScenarioContent = async (topic: string): Promise<GeneratedScenario> => {
    const cached = await getCachedResponse('scenario', { topic });
    if (cached) return cached;

    try {
      const ai = getAiClient();
      
      const prompt = `
        Креирај детално Сценарио за час по математика на тема: "${topic}".
        Пополни ги полињата за да одговараат на официјалниот формат за подготовки.
        
        ${MATH_INSTRUCTION}
        
        Биди конкретен, методичен и јасен.
        Врати JSON формат со следните полиња (сите се string):
        - topic: Насловот на темата.
        - standards: Стандарди за оценување (Користи булети).
        - content: Содржина и нови поими кои се воведуваат.
        - introActivity: Опис на воведната активност (околу 10 мин).
        - mainActivity: Опис на главните активности, работа во групи, задачи (околу 20-25 мин). Користи Unicode за формули.
        - finalActivity: Завршна активност, рефлексија и домашна работа (околу 10 мин).
        - resources: Потребни средства и материјали.
        - assessment: Начини на следење на напредокот.
      `;
  
      const response = await callGeminiWithRetry({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PERSONA,
          responseMimeType: "application/json",
        }
      });
  
      // Track usage (non-blocking)
      incrementDailyQuota().catch(e => console.error("Quota increment failed:", e));
      trackGeneration({
        contentType: 'scenario',
        topic,
        grade: 'N/A',
        model: 'gemini-3-flash-preview'
      }).catch(e => console.error("Generation tracking failed:", e));

      const text = response.text;
      if (!text) throw new Error("No response content");
      
      const result = parseJsonSafe(text) as GeneratedScenario;
      if (result) {
        await saveToCache('scenario', { topic }, result);
      }
      return result;
    } catch (error: any) {
      handleGeminiError(error);
      return null as any;
    }
  };

export const generateQuizQuestions = async (topic: string, grade: string): Promise<{questions: QuizQuestion[], rubric: string}> => {
  const cached = await getCachedResponse('quiz', { topic, grade });
  if (cached) return cached;

  try {
    const ai = getAiClient();

    const prompt = `
      Генерирај 5 прашања за геометрија, тема: "${topic}" (${grade} одделение).
      Прашањата треба да бидат соодветни за возраста.
      
      ОСВЕН ПРАШАЊАТА, ГЕНЕРИРАЈ И ДЕТАЛЕН "ВОДИЧ ЗА ОЦЕНУВАЊЕ" (Teacher Guide).
      
      ИНСТРУКЦИИ ЗА ФОРМАТИРАЊЕ НА ВОДИЧОТ (СТРОГО):
      1. Водичот мора да биде во MARKDOWN формат.
      2. ЗАДОЛЖИТЕЛНО користи MARKDOWN ТАБЕЛИ за прегледност (користи pipes |).
      3. Остави ПРАЗЕН РЕД перед и после секоја табела.
      4. Не враќај raw text, туку структурирани табели.
      
      СТРУКТУРА ШТО МОРА ДА ЈА СЛЕДИШ:
      
      ### 1. Матрица на одговори (Клуч)
      
      | Бр. | Точен Одговор | Цел на прашањето |
      | :--- | :---: | :--- |
      | 1 | А | Препознавање на... |
      | 2 | Б | ... |
      ...
      
      ---
      
      ### 2. Критериуми за оценување
      
      | Бодови | Оценка | Опис на постигнувањето |
      | :--- | :---: | :--- |
      | 0-9 | Недоволен (1) | Не ги препознава основните поими... |
      | 10-14 | Доволен (2) | Ги препознава поимите но греши во... |
      
      ${MATH_INSTRUCTION}
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ['Лесно', 'Средно', 'Тешко'] }
            },
            required: ['question', 'options', 'correctAnswerIndex', 'explanation', 'difficulty']
          }
        },
        rubric: {
           type: Type.STRING,
           description: "Markdown formatted rubric text containing tables for answer key and grading criteria. MUST use | for tables."
        }
      },
      required: ['questions', 'rubric']
    };

    const response = await callGeminiWithRetry({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PERSONA,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    // Track usage (non-blocking)
    incrementDailyQuota().catch(e => console.error("Quota increment failed:", e));
    trackGeneration({
      contentType: 'quiz',
      topic,
      grade,
      model: 'gemini-3-flash-preview'
    }).catch(e => console.error("Generation tracking failed:", e));

    const text = response.text;
    if (!text) return { questions: [], rubric: '' };
    const result = parseJsonSafe(text) as {questions: QuizQuestion[], rubric: string};
    if (result) {
      await saveToCache('quiz', { topic, grade }, result);
    }
    return result;
  } catch (error: any) {
    handleGeminiError(error);
    return { questions: [], rubric: '' };
  }
};

export const generateWorksheet = async (topic: string, type: 'STANDARD' | 'DIFFERENTIATED' | 'EXIT_TICKET' = 'STANDARD'): Promise<string> => {
  const cached = await getCachedResponse('worksheet', { topic, type });
  if (cached) return cached;

  try {
    const ai = getAiClient();

    let structureInstruction = "";

    if (type === 'EXIT_TICKET') {
        structureInstruction = `
        ТИП: ИЗЛЕЗНО ЛИВЧЕ (EXIT TICKET)
        
        ИНСТРУКЦИИ ЗА ЛАЈАУТ (МНОГУ ВАЖНО):
        Креирај ДВЕ ИДЕНТИЧНИ КОПИИ од излезното ливче на истата страница, одделени со хоризонтална линија (---).
        Ова е за да може наставникот да печати еднаш и да сече на половина (Eco-friendly).
        
        СОДРЖИНА НА ЕДНО ЛИВЧЕ:
        Наслов: "Излезно Ливче: ${topic}"
        1. Секција: "3 работи што ги научив денес..." (Остави празни линии за пишување)
        2. Секција: "2 работи што ми беа интересни..." (Остави празни линии)
        3. Секција: "1 прашање што се уште го имам..." (Остави празни линии)
        4. Секција: "Задача за проверка" (1 кратка математичка задача поврзана со лекцијата)
        
        Повтори го ова два пати во Markdown одговорот.
        `;
    } else if (type === 'DIFFERENTIATED') {
      structureInstruction = `
      СТРУКТУРА НА РАБОТНИОТ ЛИСТ (ЗАДОЛЖИТЕЛНО ПОДЕЛИ ГИ ЗАДАЧИТЕ ВАКА):

      ### 🟢 ГРУПА А: Почетно ниво (Basic tasks for understanding the concept)
      (3-4 едноставни задачи за проверка на основните поими и директна примена)

      ### 🟡 ГРУПА Б: Средно ниво (Standard practice tasks)
      (3-4 стандардни текстуални задачи, типични за писмена работа)

      ### 🔴 ГРУПА В: Напредно ниво (Logical problems and challenges for talented students)
      (2 сложени логички задачи или предизвици за талентирани ученици)
      `;
    } else {
      structureInstruction = `
      Содржина:
      - 5 текстуални задачи со различно ниво на тежина (од полесни кон потешки).
      `;
    }

    const prompt = `
      Креирај Работен Лист (Worksheet) за ученици по математика.
      Тема: "${topic}".
      
      ${structureInstruction}
      
      - Задачите треба да се јасни и прецизни.
      - Не вклучувај решенија, само задачи за вежбање (освен ако е Излезно Ливче каде задачата е кратка).
      
      ГЕОМЕТРИСКИ ДИЈАГРАМИ:
      - Ако задачата бара слика, ГЕНЕРИРАЈ SVG КОД.
      - Вметни го SVG кодот ДИРЕКТНО како HTML тагови <svg>...</svg>.
      - НЕ КОРИСТИ Code Blocks.
      - SVG-то треба да биде црно-бело, јасно и со димензии 300x200.
      
      Формат на одговорот:
      Врати го текстот директно во Markdown формат. Користи наслови, bold текст и нумерирани листи.
      Користи Unicode за математички симболи.
    `;

    const response = await callGeminiWithRetry({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PERSONA,
      }
    });

    // Track usage (non-blocking)
    incrementDailyQuota().catch(e => console.error("Quota increment failed:", e));
    trackGeneration({
      contentType: `worksheet_${type}`,
      topic,
      grade: 'N/A',
      model: 'gemini-3-flash-preview'
    }).catch(e => console.error("Generation tracking failed:", e));

    const text = response.text;
    if (!text) throw new Error("No response content");
    
    // Clean response before returning
    let clean = text.replace(/svg\s*<svg/gi, '<svg');
    clean = clean.replace(/svg\s*```/gi, '```');
    
    if (clean) {
      await saveToCache('worksheet', { topic, type }, clean);
    }
    return clean;

  } catch (error: any) {
    handleGeminiError(error);
    return "";
  }
};

export const generateProject = async (topic: string): Promise<string> => {
    const cached = await getCachedResponse('project', { topic });
    if (cached) return cached;

    try {
      const ai = getAiClient();
  
      const prompt = `
        You are a helpful teacher assistant. Generate the response STRICTLY IN MACEDONIAN LANGUAGE.
        
        Task: Create a STEAM or real-world math project based on the lesson: "${topic}".
        
        The project should encourage creativity, critical thinking, and application of math in real life.
        
        Structure the response in Markdown with the following specific sections:
        
        # Наслов на проектот
        (A creative and engaging title)
        
        ## Цел на проектот
        (Explain the learning goal and the real-world connection. Why is this useful?)
        
        ## Потребни материјали
        (A bulleted list of items needed, e.g., ruler, cardboard, scissors, internet, etc.)
        
        ## Чекори за работа
        (Detailed step-by-step instructions for the students on how to execute the project)
        
        ## Критериуми за оценување
        (A simple Markdown table (Rubric) showing how points are awarded for Accuracy, Creativity, and Presentation)
        
        Do not include intro/outro conversational text, just the project content.
      `;
  
      const response = await callGeminiWithRetry({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PERSONA,
        }
      });
  
      // Track usage (non-blocking)
      incrementDailyQuota().catch(e => console.error("Quota increment failed:", e));
      trackGeneration({
        contentType: 'project',
        topic,
        grade: 'N/A',
        model: 'gemini-3-flash-preview'
      }).catch(e => console.error("Generation tracking failed:", e));

      const text = response.text;
      if (!text) throw new Error("No response content");
      
      if (text) {
        await saveToCache('project', { topic }, text);
      }
      return text;
    } catch (error: any) {
      handleGeminiError(error);
      return "";
    }
  };

export const generateBoardPlan = async (topic: string, grade: string): Promise<string> => {
    const cached = await getCachedResponse('board_plan', { topic, grade });
    if (cached) return cached;

    try {
      const ai = getAiClient();
      
      const prompt = `
        ТИ СИ НАСТАВНИК ПО МАТЕМАТИКА КОЈ ПИШУВА ПЛАН НА ТАБЛА.
        
        Тема: "${topic}" (${grade} одделение).
        
        ЗАДАЧА:
        Креирај краток, прегледен план што учениците треба да го препишат во училишните тетратки.
        
        СТРУКТУРА (СТРОГО):
        1. Наслов (центриран)
        2. Дефиниции (максимум 2-3 најважни, кратки и јасни реченици)
        3. Формули / Правила (ЗАДОЛЖИТЕЛНО КОРИСТИ LATEX СИНТАКСА СО KaTeX)
        4. Пример (еден решен пример чекор-по-чекор)
        
        ФОРМАТИРАЊЕ НА МАТЕМАТИКА (МНОГУ ВАЖНО):
        - За сите формули, равенки, дропки и броеви КОРИСТИ LATEX синтакса оградена со долар знаци ($...$).
        - Пример: Наместо "1/2", напиши "$\\frac{1}{2}$".
        - Пример: Наместо "a^2 + b^2 = c^2", напиши "$a^2 + b^2 = c^2$".
        - Дури и за едноставни пресметки до дијаграмите, користи LaTeX.
        
        ВИЗУЕЛИЗАЦИЈА (SVG ДИЈАГРАМИ):
        - Ако лекцијата дозволува, генерирај SVG код.
        - Користи stroke="white" и fill="none".
        - Текстот во SVG (ознаки на темиња) може да биде обичен SVG text.
        - НО, формулите и пресметките (на пр. P = a * b) пишувај ги НАДВОР од SVG-то, во Markdown, користејќи LaTeX.
        - ViewBox: Пресметај го точно (tight fit).
        
        ФОРМАТИРАЊЕ:
        Врати Markdown код.
        БЕЗ воведни или завршни коментари.
        
        Пример за изглед:
        # Питагорова Теорема
        
        ## 1. Дефиниција
        ...
        <svg viewBox="0 0 150 150">
           ... drawing ...
        </svg>
        
        **Формула:**
        $c^2 = a^2 + b^2$
        
        **Пример:**
        Ако $a=3$ и $b=4$, тогаш:
        $c^2 = 3^2 + 4^2 = 9 + 16 = 25$
        $c = \\sqrt{25} = 5$
      `;
  
      const response = await callGeminiWithRetry({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PERSONA,
        }
      });
  
      // Track usage (non-blocking)
      incrementDailyQuota().catch(e => console.error("Quota increment failed:", e));
      trackGeneration({
        contentType: 'board_plan',
        topic,
        grade,
        model: 'gemini-3-flash-preview'
      }).catch(e => console.error("Generation tracking failed:", e));

      const text = response.text;
      if (!text) throw new Error("No response content");
      
      if (text) {
        await saveToCache('board_plan', { topic, grade }, text);
      }
      return text;
    } catch (error: any) {
      handleGeminiError(error);
      return "";
    }
  };

export const generateCanvasAnimation = async (description: string): Promise<string> => {
  const cached = await getCachedResponse('canvas_animation', { description });
  if (cached) return cached;

  try {
    const ai = getAiClient();

    const prompt = `
      Act as an expert Educational Math Visualizer.
      Write a JavaScript function body for an HTML5 Canvas animation about: "${description}".
      
      The function signature is: function draw(ctx, width, height, frame) { ... }
      
      VISUAL STYLE GUIDELINES (Whiteboard/Notebook Style):
      1. **Background**: The canvas is transparent with a CSS grid behind it. DO NOT fill the background. Start with 'ctx.clearRect(0, 0, width, height)'.
      2. **Line Quality**: Use thick lines (lineWidth = 3 or 4) for visibility.
      3. **Colors**: 
         - Main Geometry: Black (#000000) or Dark Blue (#1e3a8a).
         - Highlights/Angles/Points: Bright Red (#dc2626) or Dark Orange (#ea580c).
         - Text/Labels: Black (#000000) with '16px sans-serif' font.
      4. **Animation Speed**: MAKE IT SLOW. Math concepts need time to be absorbed. Use slow transitions (e.g., use 'frame * 0.005' or 'frame * 0.01'). A full cycle should take 3-5 seconds.
      5. **Dynamic Labels**: Text labels (e.g., "A", "B", "r", "α") MUST move with the geometric elements. Show changing values (like angles in degrees) if relevant.
      6. **Construction**: If possible, show the shape being constructed (drawing the line) rather than just moving it.

      CODE REQUIREMENTS:
      - Use standard Canvas API (ctx.beginPath, ctx.moveTo, ctx.lineTo, ctx.stroke, ctx.arc, ctx.fillText).
      - Use 'frame' variable to drive animation state.
      - Return ONLY the raw JavaScript code for the function body. NO markdown blocks.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a JavaScript Canvas expert for educational software. You produce clean, high-performance, and visually clear code.",
      }
    });

    // Strip markdown code blocks if present
    let code = response.text || "";
    code = code.replace(/```javascript/g, "").replace(/```js/g, "").replace(/```/g, "");
    
    if (code) {
      await saveToCache('canvas_animation', { description }, code);
    }
    return code;
  } catch (error: any) {
    handleGeminiError(error);
    return "";
  }
};

export const generateAdvancedProblem = async (category: string, grade: string): Promise<{problem: string, solution: string}> => {
  const cached = await getCachedResponse('advanced_problem', { category, grade });
  if (cached) return cached;

  try {
    const ai = getAiClient();
    const prompt = `
      Генерирај една ТЕШКА натпреварувачка математичка задача за ученици од ${grade} одделение.
      Категорија: ${category}.
      
      Задачата треба да бара логичко размислување и да не биде тривијална. Биди креативен и предизвикувачки.

      ВИЗУЕЛИЗАЦИЈА (SVG ДИЈАГРАМИ):
      Ако задачата е геометриска или бара визуелизација (на пр. фигури, графикон), ГЕНЕРИРАЈ SVG КОД и вметни го директно во текстот на полето "problem".
      
      ИНСТРУКЦИИ ЗА SVG:
      1. Вметни го SVG кодот како еден ред текст (inline).
      2. Користи црни линии за цртање (stroke="black" stroke-width="2").
      3. Користи fill="none" за празни форми или fill="#e2e8f0" за шрафирани/обоени делови.
      4. Димензии: viewBox="0 0 300 200" (прилагоди по потреба).
      5. Текстот (темиња) да биде црн.
      6. НЕ кориристи code blocks (\`\`\`) за SVG-то, само чист HTML таг.
      
      Strict Formatting for Solution: 
      When generating the solution, ALWAYS put each step on a new line with a blank line in between.
      Bold Headers: Start each step with **Чекор 1:**, **Чекор 2:** (in bold).
      Result: The output should look like a clean list, not a block of text.
      
      Example:
      **Чекор 1:**
      Пресметуваме плоштина...
      
      **Чекор 2:**
      Сега одземаме...

      Врати JSON формат со следните полиња:
      {
        "problem": "Текстот на задачата... [SVG код ако е потребно]",
        "solution": "Детално решение чекор по чекор..."
      }
      
      ${MATH_INSTRUCTION}
    `;

    const response = await callGeminiWithRetry({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PERSONA,
        responseMimeType: "application/json",
      }
    });

    // Track usage (non-blocking)
    incrementDailyQuota().catch(e => console.error("Quota increment failed:", e));
    trackGeneration({
      contentType: 'advanced_problem',
      topic: category,
      grade,
      model: 'gemini-3-flash-preview'
    }).catch(e => console.error("Generation tracking failed:", e));

    const text = response.text;
    if (!text) throw new Error("No response content from AI");
    
    const result = parseJsonSafe(text) as {problem: string, solution: string};
    if (result) {
      await saveToCache('advanced_problem', { category, grade }, result);
    }
    return result;
  } catch (error: any) {
    handleGeminiError(error);
    return {problem: "", solution: ""}; // unreachable
  }
};

export const generateErrorDetectiveCase = async (topic: string, grade: string): Promise<any> => {
  const cached = await getCachedResponse('error_detective', { topic, grade });
  if (cached) return cached;

  try {
    const prompt = `Создади математички случај за „Детектив за грешки“ за ${grade} одделение. 
    Тема: ${topic}
    
    Сценарио: Еден замислен лик (на пр. Роботот Роби) решил задача, но направил ЕДНА карактеристична математичка грешка во еден од чекорите.
    Ученикот треба да ја најде таа грешка.
    
    Врати го одговорот во JSON формат:
    {
      "title": "Интригантен наслов на случајот",
      "problem": "Оригиналната задача што треба да се реши",
      "steps": [
        {
          "content": "Математички израз или опис на чекорот",
          "isCorrect": true или false (само еден чекор треба да биде false),
          "errorExplanation": "Објаснување зошто овој чекор е погрешен (само за погрешниот чекор)"
        }
      ],
      "finalAdvice": "Совет како да се избегне оваа грешка во иднина"
    }`;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        problem: { type: Type.STRING },
        steps: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING },
              isCorrect: { type: Type.BOOLEAN },
              errorExplanation: { type: Type.STRING }
            },
            required: ["content", "isCorrect"]
          }
        },
        finalAdvice: { type: Type.STRING }
      },
      required: ["title", "problem", "steps", "finalAdvice"]
    };

    const response = await callGeminiWithRetry({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PERSONA,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response content from AI");
    
    const result = parseJsonSafe(text);
    if (result) {
      await saveToCache('error_detective', { topic, grade }, result);
    }
    return result;
  } catch (error: any) {
    handleGeminiError(error);
    return null;
  }
};

export const generateIEPPlan = async (params: {
  topic: string;
  grade: string;
  disabilityType: string;
  adaptationLevel: string;
  learningStyles: string[];
  interests: string;
}): Promise<string> => {
  const cached = await getCachedResponse('iep_plan', params);
  if (cached) return cached;

  try {
    const ai = getAiClient();
    
    const prompt = `
      ТИ СИ ИСКУСЕН СПЕЦИЈАЛЕН ЕДУКАТОР И ДЕФЕКТОЛОГ ВО МАКЕДОНСКИОТ ОБРАЗОВЕН СИСТЕМ.
      Твоја задача е да креираш прилагоден ИОП (Индивидуализиран образовен план) за час по Математика, следејќи ги насоките на БРО (Биро за развој на образованието).
      
      ПОДАТОЦИ ЗА УЧЕНИКОТ:
      - Тема/Лекција: ${params.topic}
      - Одделение: ${params.grade}
      - Тип на попреченост/потешкотија: ${params.disabilityType}
      - Ниво на прилагодување: ${params.adaptationLevel}
      - Стилови на учење: ${params.learningStyles.join(', ')}
      - Специфични интереси: ${params.interests || 'Не се наведени'}
      
      ИНСТРУКЦИИ ЗА СОДРЖИНАТА:
      1. Јазикот мора да биде инклузивен, охрабрувачки и педагошки прецизен.
      2. Планот треба да содржи:
         - Општа цел на часот прилагодена за ученикот.
         - Специфични очекувани резултати.
         - Методи и стратегии за работа (соодветни на нивото на прилагодување).
         - Потребни нагледни средства и асистивна технологија.
         - Активности за ученикот (чекор-по-чекор).
         - Начини на евалуација на постигнувањата.
      3. Користи ги интересите на ученикот ("${params.interests}") за да ги мотивираш задачите.
      
      ФОРМАТИРАЊЕ:
      Врати го текстот директно во Markdown формат. Користи наслови (#, ##), болдирање и листи.
      
      ${MATH_INSTRUCTION}
    `;

    const response = await callGeminiWithRetry({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Ти си специјален едукатор и дефектолог. Твојот јазик е инклузивен и професионален.",
      }
    });

    // Track usage
    incrementDailyQuota().catch(e => console.error("Quota increment failed:", e));
    trackGeneration({
      contentType: 'iep_plan',
      topic: params.topic,
      grade: params.grade,
      model: 'gemini-3-flash-preview'
    }).catch(e => console.error("Generation tracking failed:", e));

    const text = response.text;
    if (!text) throw new Error("No response content");
    
    if (text) {
      await saveToCache('iep_plan', params, text);
    }
    return text;
  } catch (error: any) {
    handleGeminiError(error);
    return "";
  }
};

export const getContentPackage = async (grade: string, topic: string): Promise<LessonPackage> => {
  const cached = await getCachedResponse('content_package', { grade, topic });
  if (cached) return cached;

  try {
    const [
      lesson,
      quiz,
      scenario,
      boardPlan,
      worksheet,
      project,
      connectivity,
      inclusion,
      errorDetective,
      remedial
    ] = await Promise.all([
      generateLessonContent(topic, grade),
      generateQuizQuestions(topic, grade),
      generateScenarioContent(topic),
      generateBoardPlan(topic, grade),
      generateWorksheet(topic),
      generateProject(topic),
      generateLessonConnectivity(topic, grade),
      generateIEPPlan({ topic, grade, disabilityType: 'general', adaptationLevel: 'standard', learningStyles: [], interests: '' }),
      generateErrorDetectiveCase(topic, grade),
      generateRemedialDecomposition(topic, grade)
    ]);

    const result: LessonPackage = {
      grade,
      topic,
      lesson,
      quiz,
      problems: quiz.questions,
      scenario,
      boardPlan,
      worksheet,
      project,
      connectivity,
      remedial,
      inclusion,
      errorDetective
    };

    await saveToCache('content_package', { grade, topic }, result);
    return result;
  } catch (error: any) {
    console.error("Error generating content package:", error);
    throw error;
  }
};

export const generateTeacherTask = async (topic: string, grade: string): Promise<{problem: string, hint: string, solution: string}> => {
  const cached = await getCachedResponse('teacher_task', { topic, grade });
  if (cached) return cached;

  try {
    const ai = getAiClient();
    const prompt = `
      Генерирај интерактивна математичка задача за наставник, на тема: "${topic}" (${grade} одделение).
      
      Врати JSON со следните полиња:
      - problem: Текстот на задачата (јасен и концизен).
      - hint: Кратка насока (помош) која наставникот може да му ја каже на ученикот.
      - solution: Чекор-по-чекор решение.

      ${MATH_INSTRUCTION}
    `;

    const response = await callGeminiWithRetry({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PERSONA,
        responseMimeType: "application/json",
      }
    });

    // Track usage (non-blocking)
    incrementDailyQuota().catch(e => console.error("Quota increment failed:", e));
    trackGeneration({
      contentType: 'teacher_task',
      topic,
      grade,
      model: 'gemini-3-flash-preview'
    }).catch(e => console.error("Generation tracking failed:", e));

    const text = response.text;
    if (!text) throw new Error("No response content");
    
    const result = parseJsonSafe(text) as {problem: string, hint: string, solution: string};
    if (result) {
      await saveToCache('teacher_task', { topic, grade }, result);
    }
    return result;
  } catch (error: any) {
    handleGeminiError(error);
    return {problem: "", hint: "", solution: ""};
  }
};

export const generateGameContent = async (topic: string, type: string, grade: string): Promise<any> => {
  const cached = await getCachedResponse('game_content', { topic, type, grade });
  if (cached) return cached;

  try {
    const ai = getAiClient();
    const prompt = `
      Генерирај содржина за математичка игра од типот "${type}" на тема "${topic}" за ${grade} одделение.
      
      СТРОГИ ПРАВИЛА ЗА JSON СТРУКТУРАТА (Врати само JSON):
      
      Ако типот е "BINGO":
      {
        "questions": [
          {"question": "Колку е 5+5?", "answer": "10"},
          ... (вкупно 12-15 вакви објекти)
        ]
      }

      Ако типот е "FLASHCARDS":
      {
        "cards": [
          {"question": "Што е агол?", "answer": "Дел од рамнина..."},
          ... (вкупно 10 вакви објекти)
        ]
      }

      Ако типот е "ESCAPE_ROOM":
      {
        "riddles": [
          {"question": "Прва загатка...", "answer": "123"},
          ... (вкупно 5 вакви објекти. Одговорите треба да бидат кратки - еден збор или број)
        ]
      }

      Ако типот е "PASSWORD" или "BALLOONS":
      {
        "tasks": [
          {"question": "Колку е 2x2?", "answer": "4"},
          ... (вкупно 10 вакви објекти)
        ]
      }

      Ако типот е "MATEHOOT":
      {
        "questions": [
          {
            "question": "Текстот на прашањето...",
            "options": ["Опција 1", "Опција 2", "Опција 3", "Опција 4"],
            "correctAnswerIndex": 0,
            "explanation": "Зошто е ова точно..."
          },
          ... (вкупно 10-15 вакви објекти. Погрешните одговори треба да бидат логични грешки.)
        ]
      }

      ${MATH_INSTRUCTION}
      
      ДОПОЛНИТЕЛНИ ПРАВИЛА ЗА ОДГОВОРИТЕ:
      1. Сите математички променливи (x, y, a, b, c...) пишувај ги исклучиво со МАЛИ ЛАТИНСКИ БУКВИ.
      2. Одговорите треба да бидат концизни.
      3. Избегнувај непотребни празни места во одговорите (на пр. "2x+10" наместо "2x + 10" ако е можно, но системот сега поддржува и двете).

      Врати го ОДГОВОРОТ ИСКЛУЧИВО КАКО JSON ОБЈЕКТ.
    `;

    const response = await callGeminiWithRetry({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PERSONA,
        responseMimeType: "application/json",
      }
    });

    // Track usage (non-blocking)
    incrementDailyQuota().catch(e => console.error("Quota increment failed:", e));
    trackGeneration({
      contentType: `game_${type}`,
      topic,
      grade,
      model: 'gemini-3-flash-preview'
    }).catch(e => console.error("Generation tracking failed:", e));

    const result = parseJsonSafe(response.text);
    if (result) {
      await saveToCache('game_content', { topic, type, grade }, result);
    }
    return result;
  } catch (error: any) {
    handleGeminiError(error);
    return null;
  }
};

export async function generateRemedialDecomposition(input: string, grade: string): Promise<any> {
  const cached = await getCachedResponse('remedial_decomposition', { input, grade });
  if (cached) return cached;

  try {
    const prompt = `Разложи ја следнава математичка задача/концепт на најмали можни чекори за ученик од ${grade} одделение кој има потешкотии со математика. 
    Користи едноставен јазик, визуелни описи и охрабрувачки тон.
    
    Задача: ${input}
    
    Врати го одговорот во JSON формат со следнава структура:
    {
      "problem": "Оригиналната задача",
      "prerequisites": ["Што треба да знае ученикот пред да почне"],
      "steps": [
        {
          "title": "Краток наслов на чекорот",
          "explanation": "Детално и едноставно објаснување на овој специфичен чекор",
          "hint": "Суптилен совет ако ученикот заглави",
          "visualAid": "Опис на тоа како ученикот може да го замисли ова визуелно"
        }
      ],
      "summary": "Завршна порака за поддршка"
    }`;

    const response = await callGeminiWithRetry({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PERSONA,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problem: { type: Type.STRING },
            prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  hint: { type: Type.STRING },
                  visualAid: { type: Type.STRING }
                },
                required: ["title", "explanation"]
              }
            },
            summary: { type: Type.STRING }
          },
          required: ["problem", "prerequisites", "steps", "summary"]
        }
      }
    });

    // Track usage (non-blocking)
    incrementDailyQuota().catch(e => console.error("Quota increment failed:", e));
    trackGeneration({
      contentType: 'remedial_decomposition',
      topic: input.substring(0, 50),
      grade,
      model: 'gemini-3-flash-preview'
    }).catch(e => console.error("Generation tracking failed:", e));

    const result = parseJsonSafe(response.text);
    if (result) {
      await saveToCache('remedial_decomposition', { input, grade }, result);
    }
    return result;
  } catch (error: any) {
    handleGeminiError(error);
    return null;
  }
}
