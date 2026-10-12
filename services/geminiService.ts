
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SYSTEM_PERSONA } from "../constants";
import { QuizQuestion, GeneratedLesson, GeneratedScenario, LessonPackage } from "../types";
import { incrementDailyQuota, trackGeneration } from "./analyticsService";
import { getCachedResponse, saveToCache } from "./cacheService";
import { 
  getFallbackBoardPlan, 
  getFallbackLesson, 
  getFallbackScenario, 
  getFallbackQuiz,
  getFallbackWorksheet,
  getFallbackProject,
  getFallbackConnectivity,
  getFallbackCanvasAnimation,
  getFallbackAdvancedProblem,
  getFallbackErrorDetective,
  getFallbackRemedial,
  getFallbackMateSafe,
  getFallbackGameContent
} from "./fallbackService";

/**
 * Returns the currently configured Gemini API key if present
 */
export const getGeminiApiKey = (): string => {
  let apiKey = '';
  
  if (typeof process !== 'undefined' && process.env) {
    apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_API_KEY || '';
  }
  
  if (!apiKey && typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const metaEnv = (import.meta as any).env;
    apiKey = metaEnv.GEMINI_API_KEY || metaEnv.API_KEY || metaEnv.VITE_API_KEY || '';
  }

  if (!apiKey && typeof window !== 'undefined') {
    try {
      apiKey = sessionStorage.getItem('matementor_gemini_key') || localStorage.getItem('matementor_gemini_key') || '';
    } catch (e) {}
  }

  // Clean up potential string artifacts
  apiKey = (apiKey || '').trim().replace(/['"]/g, '');
  return apiKey;
};

/**
 * Checks whether a legitimate Gemini API key is configured.
 * Firebase client keys (e.g. AIzaSyAtXI1kYErR...) do not have Generative Language API access.
 */
export const hasValidGeminiKey = (): boolean => {
  const key = getGeminiApiKey();
  if (!key || key.length < 15 || key === 'AIzaSyAtXI1kYErR34Cnv9MnxhW6XCobD5dCous') {
    return false;
  }
  return true;
};

// Helper to safely get the API client
export const getAiClient = async () => {
  const apiKey = getGeminiApiKey();
  return new GoogleGenAI({ apiKey: apiKey || 'preview-key' });
};

// --- Error Handling Helper ---
const handleGeminiError = (error: any): never => {
    console.error("Gemini API Error:", error);
    const msg = error?.message || error?.toString() || "";

    // Check for Quota Exceeded (429)
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
        throw new Error("⚠️ Надминат е дневниот лимит за бесплатни барања (Error 429). Ве молиме почекајте или обидете се подоцна.");
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
 * Helper to call Gemini with automatic retry for 503 errors and fast fallback on 403
 */
const callGeminiWithRetry = async (params: any, retries = 1): Promise<any> => {
  if (!hasValidGeminiKey()) {
    throw new Error("403_NO_KEY: No Gemini API key provided. Using built-in preview fallback.");
  }
  try {
    const ai = await getAiClient();
    return await ai.models.generateContent(params);
  } catch (error: any) {
    const msg = error?.message || "";
    if (msg.includes("403") || msg.includes("PERMISSION_DENIED") || msg.includes("API_KEY_INVALID") || msg.includes("disabled")) {
      throw error;
    }
    if ((msg.includes("503") || msg.includes("Overloaded")) && retries > 0) {
      console.log(`Server overloaded, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 1500));
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
    const ai = await getAiClient();
    
    const isElementary = ['I', 'II', 'III', 'IV', 'V'].includes(grade);

    let contextInstruction = "";
    if (includeContext) {
      const targetExamples = isElementary 
        ? "деца од одделенска настава на возраст 6-11 години (на пр. играчки, животни, овошје, училишни игри, семејство, купување со денари, детски приказни, друштвени игри)"
        : "модерните ученици/тинејџери (на пр. видео игри, социјални мрежи, спорт, шопинг/попусти, џепарлак/пари)";

      contextInstruction = `
      ДОПОЛНИТЕЛНА СЕКЦИЈА (ЗАДОЛЖИТЕЛНО):
      Вклучи посебна секција на крајот (пред задачите за вежбање) насловена '🌍 Математика околу нас'.
      Во оваа секција, објасни го концептот користејќи примери прилагодени за возраста: ${targetExamples}.
      Користи пристап на раскажување приказни (Story Problems) со методологија CPA (Конкретно-Сликовно-Апстрактно) за да покажеш зошто е ова важно и интересно во детскиот секојдневен живот.
      `;
    }

    const prompt = `
      Креирај лекција за ${grade} одделение на тема: "${topic}".
      Лекцијата треба да биде интерактивна, современа и целосно прилагодена на возраста за ${grade} одделение според официјалната наставна програма на БРО.

      ${isElementary ? `
      ВАЖНИ УПАТСТВА ЗА ОДДЕЛЕНСКА НАСТАВА (${grade} ОДДЕЛЕНИЕ, ВОЗРАСТ 6-11 ГОД.):
      - Јазикот мора да биде топол, разбирлив, детски и мотивирачки, без претеран формализам.
      - Користи го CPA пристапот (Конкретно -> Сликовно -> Апстрактно) со реални детски примери.
      - Поимите, опсегот на броеви и операциите мора строго да одговараат на програмата на БРО за ${grade} одделение.
      ` : `
      ВАЖНИ УПАТСТВА ЗА ПРЕДМЕТНА НАСТАВА (${grade} ОДДЕЛЕНИЕ):
      - Користи прецизна математичка терминологија, логички дефиниции и решени примери според стандардите на БРО.
      `}
      
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
      model: 'gemini-3.8-flash',
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
      model: 'gemini-3.8-flash'
    }).catch(e => console.error("Generation tracking failed:", e));

    const text = response.text;
    if (!text) throw new Error("No response content from AI");
    
    const result = parseJsonSafe(text) as GeneratedLesson;
    if (result) {
      await saveToCache('lesson', { topic, grade, includeContext }, result);
    }
    return result;
  } catch (error: any) {
    console.warn("generateLessonContent encountered error (e.g. 403), using fallback lesson:", error);
    const fallback = getFallbackLesson(topic, grade, includeContext);
    await saveToCache('lesson', { topic, grade, includeContext }, fallback);
    return fallback;
  }
};

export const generateLessonConnectivity = async (topic: string, grade: string): Promise<string> => {
    const cached = await getCachedResponse('connectivity', { topic, grade });
    if (cached) return cached;

    try {
      const ai = await getAiClient();
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
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are a professional teaching assistant. You output raw HTML suitable for embedding in a React component.",
        }
      });
  
      const text = response.text;
      if (!text) throw new Error("No response content");
      
      // Track usage
      incrementDailyQuota().catch(e => console.error("Quota increment failed:", e));
      trackGeneration({
        contentType: 'connectivity',
        topic,
        grade,
        model: 'gemini-3.8-flash'
      }).catch(e => console.error("Generation tracking failed:", e));

      // Clean up markdown code blocks if AI adds them by mistake
      const result = text.replace(/```html/g, '').replace(/```/g, '').trim();
      if (result) {
        await saveToCache('connectivity', { topic, grade }, result);
      }
      return result;
  
    } catch (error: any) {
      console.warn("generateLessonConnectivity error, using fallback connectivity:", error);
      const fallback = getFallbackConnectivity(topic, grade);
      await saveToCache('connectivity', { topic, grade }, fallback);
      return fallback;
    }
  };

export const generateScenarioContent = async (topic: string, grade: string = 'N/A'): Promise<GeneratedScenario> => {
    // Cache versioning to force fresh generation when prompt changes
    const CACHE_VERSION = 'v3'; 
    const cached = await getCachedResponse('scenario', { topic, grade, version: CACHE_VERSION });
    if (cached) return cached;

    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        const isElementary = ['I', 'II', 'III', 'IV', 'V'].includes(grade);

        const prompt = `
          Креирај ИСКЛУЧИТЕЛНО ДЕТАЛНО, ТЕМЕЛНО И ОПШИРНО Сценарио за час по математика на тема: "${topic}".
          Одделение: ${grade}.
          
          ${isElementary ? `
          СПЕЦИФИКА ЗА ОДДЕЛЕНСКА НАСТАВА (${grade} ОДДЕЛЕНИЕ, ВОЗРАСТ 6-11 ГОДИНИ):
          - Наставна програма: Користи ги точните наставни цели, поими и стандарди за оценување дефинирани во официјалната програма на БРО за ${grade} одделение.
          - Воведна активност (10 мин): Мотивациска дидактичка игра, разговор со конкретни предмети/картички или математичка приказна прилагодена за возраста.
          - Главна активност (20-25 мин): Примена на CPA методологијата (Конкретно -> Сликовно -> Апстрактно), работа со дидактички материјали, броилки, цртање, моделирање и диференцирана работа во парови/групи.
          - Завршна активност (10 мин): Интерактивна игра за повторување, брз квиз со покажување картички (точно/неточно) или сликовна рефлексија.
          - Средства: Конкретни предмети, геометриски форми, картички со броеви, броилки, детски работни листови.
          - Следење: Формативно оценување, набљудување на манипулација со материјалите, чек-листи и поттикнувачки повратни информации.
          ` : `
          Твојата цел е да креираш професионална подготовка која наставникот може веднаш да ја испечати и користи. Биди многу прецизен и користи стручна терминологија според програмата на БРО за предметна настава.
          `}
          
          ${MATH_INSTRUCTION}
          
          ВАЖНО: Секое поле треба да содржи богат и структуриран текст (користи Markdown за болдирање и листи каде што е соодветно). Не штеди на зборови - наставникот бара професионална и темелна подготовка.
        `;
    
        const response = await callGeminiWithRetry({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_PERSONA + "\nСекогаш враќај опширни и детални одговори за секое поле во сценариото.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING, description: "Целосниот наслов на наставната единица" },
                standards: { type: Type.STRING, description: "Стандарди за оценување (детални)" },
                content: { type: Type.STRING, description: "Содржина и нови поими (опширно објаснување)" },
                introActivity: { type: Type.STRING, description: "Воведна активност (10 мин)" },
                mainActivity: { type: Type.STRING, description: "Главни активности (20-25 мин) - најопширен дел" },
                finalActivity: { type: Type.STRING, description: "Завршна активност (10 мин)" },
                resources: { type: Type.STRING, description: "Потребни средства и материјали" },
                assessment: { type: Type.STRING, description: "Начини на следење на напредокот" }
              },
              required: ["topic", "standards", "content", "introActivity", "mainActivity", "finalActivity", "resources", "assessment"]
            }
          }
        });
    
        // Track usage (non-blocking)
        incrementDailyQuota().catch(e => console.error("Quota increment failed:", e));
        trackGeneration({
          contentType: 'scenario',
          topic,
          grade,
          model: 'gemini-3.8-flash'
        }).catch(e => console.error("Generation tracking failed:", e));

        const text = response.text;
        if (!text) throw new Error("AI моделот не врати содржина.");
        
        const result = parseJsonSafe(text) as GeneratedScenario;
        
        // Validation: Ensure we have at least some content in the main fields
        const minLength = 100; 
        if (!result || !result.content || result.content.length < minLength || !result.mainActivity || result.mainActivity.length < minLength) {
          console.warn(`Attempt ${attempts}: Generated scenario is too short. Content length: ${result?.content?.length}, Main activity length: ${result?.mainActivity?.length}`);
          if (attempts < maxAttempts) continue; // Retry
          throw new Error("Генерираното сценарио е премногу кратко или празно. Ве молиме обидете се повторно со истата или друга тема.");
        }

        if (result) {
          await saveToCache('scenario', { topic, grade, version: CACHE_VERSION }, result);
        }
        return result;
      } catch (error: any) {
        if (attempts < maxAttempts && !error.message.includes("Invalid JSON") && !error.message.includes("403")) {
          console.warn(`Attempt ${attempts} failed, retrying...`, error);
          continue;
        }
        console.warn("generateScenarioContent error, using fallback scenario:", error);
        const fallback = getFallbackScenario(topic, grade);
        await saveToCache('scenario', { topic, grade, version: CACHE_VERSION }, fallback);
        return fallback;
      }
    }
    const fallback = getFallbackScenario(topic, grade);
    return fallback;
  };

export const generateQuizQuestions = async (topic: string, grade: string): Promise<{questions: QuizQuestion[], rubric: string}> => {
  const cached = await getCachedResponse('quiz', { topic, grade });
  if (cached) return cached;

  const isElementary = ['I', 'II', 'III', 'IV', 'V'].includes(grade);

  try {
    const prompt = `
      Генерирај 5 прашања по математика на тема: "${topic}" (${grade} одделение) според официјалната наставна програма на БРО.
      Прашањата и тежината мора да бидат строго прилагодени за возраста на учениците (${grade} одделение).
      ${isElementary ? `
      УПАТСТВО ЗА ОДДЕЛЕНСКА НАСТАВА (${grade} одд.):
      - Користи разбирлив детски јазик, сликовни претстави, задачи со реални ситуации (играчки, овошја, македонски денари, едноставни форми).
      - Прашањата нека бидат со 3 или 4 понудени опции, јасни и недвосмислени.
      ` : `
      УПАТСТВО ЗА ПРЕДМЕТНА НАСТАВА (${grade} одд.):
      - Користи прецизна математичка симболика, формули и својства според БРО.
      `}
      
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
      model: 'gemini-3.8-flash',
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
      model: 'gemini-3.8-flash'
    }).catch(e => console.error("Generation tracking failed:", e));

    const text = response.text;
    if (!text) return getFallbackQuiz(topic, grade);
    const result = parseJsonSafe(text) as {questions: QuizQuestion[], rubric: string};
    if (result) {
      await saveToCache('quiz', { topic, grade }, result);
    }
    return result;
  } catch (error: any) {
    console.warn("generateQuizQuestions error, using fallback quiz:", error);
    const fallback = getFallbackQuiz(topic, grade);
    await saveToCache('quiz', { topic, grade }, fallback);
    return fallback;
  }
};

export const generateWorksheet = async (topic: string, grade: string = 'N/A', type: 'STANDARD' | 'DIFFERENTIATED' | 'EXIT_TICKET' = 'STANDARD'): Promise<string> => {
  const cached = await getCachedResponse('worksheet', { topic, grade, type });
  if (cached) return cached;

  try {
    const ai = await getAiClient();

    let structureInstruction = "";

    if (type === 'EXIT_TICKET') {
        structureInstruction = `
        ТИП: ИЗЛЕЗНО ЛИВЧЕ (EXIT TICKET)
        ОДДЕЛЕНИЕ: ${grade}
        
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
      ОДДЕЛЕНИЕ: ${grade}
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
      ОДДЕЛЕНИЕ: ${grade}
      Содржина:
      - 5 текстуални задачи со различно ниво на тежина (од полесни кон потешки).
      `;
    }

    const prompt = `
      Креирај Работен Лист (Worksheet) за ученици по математика.
      Тема: "${topic}".
      Одделение: ${grade}.
      
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
      model: 'gemini-3.8-flash',
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
      grade,
      model: 'gemini-3.8-flash'
    }).catch(e => console.error("Generation tracking failed:", e));

    const text = response.text;
    if (!text) throw new Error("No response content");
    
    // Clean response before returning
    let clean = text.replace(/svg\s*<svg/gi, '<svg');
    clean = clean.replace(/svg\s*```/gi, '```');
    
    if (clean) {
      await saveToCache('worksheet', { topic, grade, type }, clean);
    }
    return clean;

  } catch (error: any) {
    console.warn("generateWorksheet error, using fallback worksheet:", error);
    const fallback = getFallbackWorksheet(topic, grade, type);
    await saveToCache('worksheet', { topic, grade, type }, fallback);
    return fallback;
  }
};

export const generateProject = async (topic: string, grade: string = 'N/A'): Promise<string> => {
    const cached = await getCachedResponse('project', { topic, grade });
    if (cached) return cached;

    try {
      const ai = await getAiClient();
  
      const prompt = `
        You are a helpful teacher assistant. Generate the response STRICTLY IN MACEDONIAN LANGUAGE.
        
        Task: Create a STEAM or real-world math project based on the lesson: "${topic}".
        Grade: ${grade}.
        
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
        model: 'gemini-3.8-flash',
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
        grade,
        model: 'gemini-3.8-flash'
      }).catch(e => console.error("Generation tracking failed:", e));

      const text = response.text;
      if (!text) throw new Error("No response content");
      
      if (text) {
        await saveToCache('project', { topic, grade }, text);
      }
      return text;
    } catch (error: any) {
      console.warn("generateProject error, using fallback project:", error);
      const fallback = getFallbackProject(topic, grade);
      await saveToCache('project', { topic, grade }, fallback);
      return fallback;
    }
  };

export const generateBoardPlan = async (topic: string, grade: string): Promise<string> => {
    const cached = await getCachedResponse('board_plan', { topic, grade });
    if (cached) return cached;

    if (!hasValidGeminiKey()) {
      const fallback = getFallbackBoardPlan(topic, grade);
      await saveToCache('board_plan', { topic, grade }, fallback);
      return fallback;
    }

    const isElementary = ['I', 'II', 'III', 'IV', 'V'].includes(grade);

    try {
      const prompt = `
        ТИ СИ НАСТАВНИК ПО МАТЕМАТИКА КОЈ ПИШУВА ПЛАН НА ТАБЛА.
        
        Тема: "${topic}" (${grade} одделение).
        
        ${isElementary ? `
        УПАТСТВА ЗА ОДДЕЛЕНСКА НАСТАВА (${grade} ОДДЕЛЕНИЕ):
        - Планот на табла треба да биде прегледен, визуелен и разбирлив за деца од одделенска настава.
        - Користи кратки реченици, едноставни шеми или симболи.
        - Решениот пример да користи броеви и операции прилагодени за ${grade} одделение според БРО.
        ` : `
        УПАТСТВА ЗА ПРЕДМЕТНА НАСТАВА (${grade} ОДДЕЛЕНИЕ):
        - Професионален академски запис со дефиниции, својства и прецизни математички формули.
        `}

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
        - За квадратен корен секогаш користи LaTeX: "$\\sqrt{225} = 15$" или "$\\sqrt{x}$".
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
        model: 'gemini-3.8-flash',
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
        model: 'gemini-3.8-flash'
      }).catch(e => console.error("Generation tracking failed:", e));

      const text = response.text;
      if (!text) throw new Error("No response content");
      
      if (text) {
        await saveToCache('board_plan', { topic, grade }, text);
      }
      return text;
    } catch (error: any) {
      console.warn("AI generation failed or restricted (403), using fallback board plan:", error);
      const fallback = getFallbackBoardPlan(topic, grade);
      await saveToCache('board_plan', { topic, grade }, fallback);
      return fallback;
    }
  };

export const generateCanvasAnimation = async (description: string, grade: string = 'N/A'): Promise<string> => {
  const cached = await getCachedResponse('canvas_animation', { description, grade });
  if (cached) return cached;

  if (!hasValidGeminiKey()) {
    const fallback = getFallbackCanvasAnimation(description, grade);
    await saveToCache('canvas_animation', { description, grade }, fallback);
    return fallback;
  }

  try {
    const ai = await getAiClient();

    const prompt = `
      Act as an expert Educational Math Visualizer.
      Write a JavaScript function body for an HTML5 Canvas animation about: "${description}".
      Grade Level Context: ${grade} (Use this to adjust complexity).
      
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
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a JavaScript Canvas expert for educational software. You produce clean, high-performance, and visually clear code.",
      }
    });

    // Strip markdown code blocks if present
    let code = response.text || "";
    code = code.replace(/```javascript/g, "").replace(/```js/g, "").replace(/```/g, "");
    
    // Track usage
    incrementDailyQuota().catch(e => console.error("Quota increment failed:", e));
    trackGeneration({
      contentType: 'canvas_animation',
      topic: description.substring(0, 50),
      grade,
      model: 'gemini-3.8-flash'
    }).catch(e => console.error("Generation tracking failed:", e));

    if (code) {
      await saveToCache('canvas_animation', { description, grade }, code);
    }
    return code;
  } catch (error: any) {
    console.warn("generateCanvasAnimation error, using fallback:", error);
    const fallback = getFallbackCanvasAnimation(description, grade);
    await saveToCache('canvas_animation', { description, grade }, fallback);
    return fallback;
  }
};

export const generateAdvancedProblem = async (category: string, grade: string): Promise<{problem: string, solution: string}> => {
  const cached = await getCachedResponse('advanced_problem', { category, grade });
  if (cached) return cached;

  try {
    const ai = await getAiClient();
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
      model: 'gemini-3.8-flash',
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
      model: 'gemini-3.8-flash'
    }).catch(e => console.error("Generation tracking failed:", e));

    const text = response.text;
    if (!text) throw new Error("No response content from AI");
    
    const result = parseJsonSafe(text) as {problem: string, solution: string};
    if (result) {
      await saveToCache('advanced_problem', { category, grade }, result);
    }
    return result;
  } catch (error: any) {
    console.warn("generateAdvancedProblem error, using fallback:", error);
    const fallback = getFallbackAdvancedProblem(category, grade);
    await saveToCache('advanced_problem', { category, grade }, fallback);
    return fallback;
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
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PERSONA,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response content from AI");
    
    // Track usage
    incrementDailyQuota().catch(e => console.error("Quota increment failed:", e));
    trackGeneration({
      contentType: 'error_detective',
      topic,
      grade,
      model: 'gemini-3.8-flash'
    }).catch(e => console.error("Generation tracking failed:", e));

    const result = parseJsonSafe(text);
    if (result) {
      await saveToCache('error_detective', { topic, grade }, result);
    }
    return result;
  } catch (error: any) {
    console.warn("generateErrorDetectiveCase error, using fallback:", error);
    const fallback = getFallbackErrorDetective(topic, grade);
    await saveToCache('error_detective', { topic, grade }, fallback);
    return fallback;
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
    const ai = await getAiClient();
    
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
      model: 'gemini-3.8-flash',
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
      model: 'gemini-3.8-flash'
    }).catch(e => console.error("Generation tracking failed:", e));

    const text = response.text;
    if (!text) throw new Error("No response content");
    
    if (text) {
      await saveToCache('iep_plan', params, text);
    }
    return text;
  } catch (error: any) {
    console.warn("generateIEPPlan error, using fallback IEP plan:", error);
    const fallback = `# Прилагоден ИОП План: ${params.topic} (${params.grade} одд.)

## 1. Општа цел и очекувани резултати
- Ученикот да ги разбере клучните поими за **${params.topic}** согласно нивото на прилагодување (${params.adaptationLevel}).
- Развивање на позитивен став кон учењето математика преку поддршка и визуализација.

## 2. Методи и наставни стратегии
- Чекор-по-чекор објаснување со конкретни примери и бои за издвојување на податоците.
- Поврзување на задачите со интересите на ученикот: ${params.interests || 'игра и секојдневни ситуации'}.
- Овозможување дополнително време за работа и редовни паузи.

## 3. Прилагодени активности и вежби
- Задача 1: Препознавање на основните математички симболи со помош на картички.
- Задача 2: Решавање едноставна задача со водена помош од наставникот.

## 4. Следење и вреднување
- Формативно вреднување преку устен опис и охрабрување на напредокот.`;
    await saveToCache('iep_plan', params, fallback);
    return fallback;
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
      generateLessonContent(topic, grade).catch(() => getFallbackLesson(topic, grade)),
      generateQuizQuestions(topic, grade).catch(() => getFallbackQuiz(topic, grade)),
      generateScenarioContent(topic, grade).catch(() => getFallbackScenario(topic, grade)),
      generateBoardPlan(topic, grade).catch(() => getFallbackBoardPlan(topic, grade)),
      generateWorksheet(topic, grade).catch(() => getFallbackWorksheet(topic, grade)),
      generateProject(topic, grade).catch(() => getFallbackProject(topic, grade)),
      generateLessonConnectivity(topic, grade).catch(() => getFallbackConnectivity(topic, grade)),
      generateIEPPlan({ topic, grade, disabilityType: 'general', adaptationLevel: 'standard', learningStyles: [], interests: '' }).catch(() => ''),
      generateErrorDetectiveCase(topic, grade).catch(() => getFallbackErrorDetective(topic, grade)),
      generateRemedialDecomposition(topic, grade).catch(() => getFallbackRemedial(topic, grade))
    ]);

    const result: LessonPackage = {
      grade,
      topic,
      lesson,
      quiz,
      problems: quiz?.questions || [],
      scenario,
      boardPlan,
      worksheet,
      project,
      connectivity,
      remedial: remedial || getFallbackRemedial(topic, grade),
      inclusion,
      errorDetective: errorDetective || getFallbackErrorDetective(topic, grade)
    };

    await saveToCache('content_package', { grade, topic }, result);
    return result;
  } catch (error: any) {
    console.error("Error generating content package, using emergency fallback:", error);
    const fallbackBoard = getFallbackBoardPlan(topic, grade);
    const fallbackLes = getFallbackLesson(topic, grade);
    const fallbackQ = getFallbackQuiz(topic, grade);
    const fallbackSc = getFallbackScenario(topic, grade);
    return {
      grade,
      topic,
      lesson: fallbackLes,
      quiz: fallbackQ,
      problems: fallbackQ.questions,
      scenario: fallbackSc,
      boardPlan: fallbackBoard,
      worksheet: getFallbackWorksheet(topic, grade),
      project: getFallbackProject(topic, grade),
      connectivity: getFallbackConnectivity(topic, grade),
      remedial: getFallbackRemedial(topic, grade),
      inclusion: '',
      errorDetective: getFallbackErrorDetective(topic, grade)
    };
  }
};

export const generateTeacherTask = async (topic: string, grade: string): Promise<{problem: string, hint: string, solution: string}> => {
  const cached = await getCachedResponse('teacher_task', { topic, grade });
  if (cached) return cached;

  try {
    const ai = await getAiClient();
    const prompt = `
      Генерирај интерактивна математичка задача за наставник, на тема: "${topic}" (${grade} одделение).
      
      Врати JSON со следните полиња:
      - problem: Текстот на задачата (јасен и концизен).
      - hint: Кратка насока (помош) која наставникот може да му ја каже на ученикот.
      - solution: Чекор-по-чекор решение.

      ${MATH_INSTRUCTION}
    `;

    const response = await callGeminiWithRetry({
      model: 'gemini-3.8-flash',
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
      model: 'gemini-3.8-flash'
    }).catch(e => console.error("Generation tracking failed:", e));

    const text = response.text;
    if (!text) throw new Error("No response content");
    
    const result = parseJsonSafe(text) as {problem: string, hint: string, solution: string};
    if (result) {
      await saveToCache('teacher_task', { topic, grade }, result);
    }
    return result;
  } catch (error: any) {
    console.warn("generateTeacherTask error, using fallback task:", error);
    const fallback = {
      problem: `Пресметај ја вредноста на изразот за темата "${topic}": 3x + 15 = 45.`,
      hint: `Одземи 15 од двете страни на равенката, па подели со 3.`,
      solution: `3x = 45 - 15 => 3x = 30 => x = 10.`
    };
    await saveToCache('teacher_task', { topic, grade }, fallback);
    return fallback;
  }
};

export const generateGameContent = async (topic: string, type: string, grade: string): Promise<any> => {
  const cached = await getCachedResponse('game_content', { topic, type, grade });
  if (cached) return cached;

  try {
    const ai = await getAiClient();
    const prompt = `
      Генерирај содржина за математичка игра од типот "${type}" на тема "${topic}" за ${grade} одделение.
      
      СТРОГИ ПРАВИЛА ЗА JSON СТРУКТУРАТА (Врати само JSON):
      
      Ако типот е "BOARD_GAME" или "BINGO":
      {
        "questions": [
          {"question": "Колку е 5+5?", "answer": "10"},
          ... (вкупно 15-20 вакви објекти за BOARD_GAME)
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
            "answer": "Опција 1",
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
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PERSONA,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswerIndex: { type: Type.NUMBER },
                  explanation: { type: Type.STRING }
                },
                required: ["question", "answer"]
              }
            },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING }
                },
                required: ["question", "answer"]
              }
            },
            riddles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING }
                },
                required: ["question", "answer"]
              }
            },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING }
                },
                required: ["question", "answer"]
              }
            }
          }
        }
      }
    });

    // Track usage (non-blocking)
    incrementDailyQuota().catch(e => console.error("Quota increment failed:", e));
    trackGeneration({
      contentType: `game_${type}`,
      topic,
      grade,
      model: 'gemini-3.8-flash'
    }).catch(e => console.error("Generation tracking failed:", e));

    const result = parseJsonSafe(response.text);
    if (result) {
      await saveToCache('game_content', { topic, type, grade }, result);
    }
    return result;
  } catch (error: any) {
    console.warn("generateGameContent error, using fallback game content:", error);
    const fallback = getFallbackGameContent(topic, type, grade);
    await saveToCache('game_content', { topic, type, grade }, fallback);
    return fallback;
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
      model: "gemini-3.8-flash",
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
          required: ["problem", "prerequisites", "steps"]
        }
      }
    });

    // Track usage (non-blocking)
    incrementDailyQuota().catch(e => console.error("Quota increment failed:", e));
    trackGeneration({
      contentType: 'remedial_decomposition',
      topic: input.substring(0, 50),
      grade,
      model: 'gemini-3.8-flash'
    }).catch(e => console.error("Generation tracking failed:", e));

    const result = parseJsonSafe(response.text);
    if (result) {
      await saveToCache('remedial_decomposition', { input, grade }, result);
    }
    return result;
  } catch (error: any) {
    console.warn("generateRemedialDecomposition error, using fallback:", error);
    const fallback = getFallbackRemedial(input, grade);
    await saveToCache('remedial_decomposition', { input, grade }, fallback);
    return fallback;
  }
}

export async function generateMateSafeTasks(topic: string, grade: string): Promise<any> {
  const cached = await getCachedResponse('mate_safe', { topic, grade });
  if (cached) return cached;

  try {
    const prompt = `Генерирај 5 математички задачи за играта 'Мате-сеф' за ${grade} одделение на тема: ${topic}.
    
    КРИТИЧНИ ПРАВИЛА:
    1. Решението на секоја задача МОРА да биде ЦЕЛ БРОЈ (позитивен или негативен).
    2. Задачите треба да бидат со различна тежина.
    3. Решенијата ќе се користат како шифра за отклучување сеф.
    
    Врати го одговорот во JSON формат со следнава структура:
    {
      "tasks": [
        {
          "question": "Текстот на задачата",
          "answer": 15
        }
      ]
    }`;

    const response = await callGeminiWithRetry({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PERSONA,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.NUMBER }
                },
                required: ["question", "answer"]
              }
            }
          },
          required: ["tasks"]
        }
      }
    });

    incrementDailyQuota().catch(e => console.error("Quota increment failed:", e));
    trackGeneration({
      contentType: 'mate_safe',
      topic,
      grade,
      model: 'gemini-3.8-flash'
    }).catch(e => console.error("Generation tracking failed:", e));

    const result = parseJsonSafe(response.text);
    if (result) {
      await saveToCache('mate_safe', { topic, grade }, result);
    }
    return result;
  } catch (error: any) {
    console.warn("generateMateSafeTasks error, using fallback tasks:", error);
    const fallback = getFallbackMateSafe(topic, grade);
    await saveToCache('mate_safe', { topic, grade }, fallback);
    return fallback;
  }
}

export const checkMateMachineStep = async (lastStep: string, currentStep: string, initialProblem: string, difficulty: string): Promise<{isValid: boolean, feedback: string, isFinal: boolean}> => {
  try {
    if (!hasValidGeminiKey()) {
      return { 
        isValid: true, 
        feedback: "Чекорот е прегледан во режим на преглед. Продолжи со решавањето!", 
        isFinal: currentStep.includes("x=") || currentStep.length < 5 
      };
    }
    const ai = await getAiClient();
    const prompt = `
      ТИ СИ АЛГЕБАРСКИ ПРОЦЕСОР (МАТЕ-МАШИНА).
      
      ПОЧЕТЕН ПРОБЛЕМ: ${initialProblem}
      ПОСЛЕДЕН ТОЧЕН ЧЕКОР: ${lastStep}
      НОВ ЧЕКОР ОД УЧЕНИКОТ: ${currentStep}
      ТЕЖИНА: ${difficulty}
      
      ЗАДАЧА:
      1. Провери дали новиот чекор е математички еквивалентен на претходниот и дали е логичен напредок кон решението.
      2. Ако е точен, провери дали ова е финалното решение (најпроста форма или вредност на x).
      3. Врати повратна информација на македонски јазик.
      
      ПРАВИЛА ЗА ПРОВЕРКА:
      - Биди строг но фер. Мали варијации во редослед се дозволени (на пр. 2x+5 и 5+2x).
      - Ако чекорот е ист како претходниот, кажи му на ученикот дека треба да направи промена.
      
      ВРАТИ JSON:
      {
        "isValid": boolean,
        "feedback": "Краток коментар на македонски",
        "isFinal": boolean
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a precise mathematical engine. You validate algebraic steps and provide encouraging feedback in Macedonian.",
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    return parseJsonSafe(text) as {isValid: boolean, feedback: string, isFinal: boolean};
  } catch (error: any) {
    console.warn("checkMateMachineStep error:", error);
    return { isValid: true, feedback: "Добар чекор! Продолжи со пресметката.", isFinal: currentStep.includes("x=") };
  }
};

export const generateMateMachineHint = async (lastStep: string, initialProblem: string, difficulty: string): Promise<string> => {
  try {
    if (!hasValidGeminiKey()) {
      return "Совет: Обиди се да ги префрлиш членовите со непозната на едната страна, а броевите на другата.";
    }
    const ai = await getAiClient();
    const prompt = `
      ТИ СИ МЕНТОР ПО АЛГЕБРА.
      Ученикот е заглавен во "Мате-машината".
      
      ПОЧЕТЕН ПРОБЛЕМ: ${initialProblem}
      ПОСЛЕДЕН ТОЧЕН ЧЕКОР: ${lastStep}
      ТЕЖИНА: ${difficulty}
      
      ЗАДАЧА:
      Дај краток, охрабрувачки совет (hint) за тоа кој би бил следниот логичен чекор.
      НЕ ГО ДАВАЈ ЦЕЛОТО РЕШЕНИЕ. Само насока (на пр. "Обиди се да ги префрлиш сите x на левата страна").
      
      Врати го советот на македонски јазик.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful math tutor. You provide hints without giving away the full answer.",
      }
    });

    return response.text || "Обиди се да го поедноставиш изразот.";
  } catch (error: any) {
    console.warn("generateMateMachineHint error:", error);
    return "Совет: Размисли за ослободување од заградите или префрлање на членовите со промена на предзнак.";
  }
};
