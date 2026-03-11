import { getCachedLessonPackage, saveLessonPackage } from "./firebaseService";
import { generateFullLessonPackage, generateIEPPlan as generateIEPPlanAI, generateBatchProblems } from "./geminiService";
import { LessonPackage } from "../types";

/**
 * Central module for generating and managing educational content.
 * Implements caching using Firebase to reduce Gemini API usage.
 */

/**
 * Retrieves a complete lesson package.
 * First checks the local cache (Firebase), then generates via AI if missing.
 */
export const getContentPackage = async (grade: string, topic: string): Promise<LessonPackage | null> => {
  try {
    // 1. Check if the package already exists in the Content Library (Firebase)
    // We use a normalized key based on grade and topic
    const cachedPackage = await getCachedLessonPackage(grade, topic, "main_package");
    
    if (cachedPackage) {
      console.log("Serving content from cache:", topic);
      return cachedPackage as LessonPackage;
    }

    // 2. If not found, generate a complete "lesson package" using AI
    console.log("Generating new content package for:", topic);
    const newPackage = await generateFullLessonPackage(topic, grade);

    if (newPackage) {
      // 3. Store the generated package in the database for future use
      await saveLessonPackage(grade, topic, "main_package", newPackage);
      return newPackage;
    }

    return null;
  } catch (error) {
    console.error("Error in getContentPackage:", error);
    return null;
  }
};

/**
 * Retrieves an inclusion plan, with caching.
 */
export const getInclusionPlan = async (params: {
  topic: string;
  grade: string;
  disabilityType: string;
  adaptationLevel: string;
  learningStyles: string[];
  interests: string;
}): Promise<string | null> => {
  try {
    const cacheKey = `inclusion_${params.disabilityType}_${params.adaptationLevel}_${params.learningStyles.join('_')}_${params.interests.substring(0, 20)}`;
    const cached = await getCachedLessonPackage(params.grade, params.topic, cacheKey);
    
    if (cached && typeof cached === 'string') {
      return cached;
    }

    const newPlan = await generateIEPPlanAI(params);
    if (newPlan) {
      await saveLessonPackage(params.grade, params.topic, cacheKey, newPlan);
      return newPlan;
    }
    return null;
  } catch (error) {
    console.error("Error in getInclusionPlan:", error);
    return null;
  }
};

/**
 * Batch generates problems if they are missing from a package or for general use.
 */
export const getProblemsForTopic = async (grade: string, topic: string): Promise<any[]> => {
  const pkg = await getContentPackage(grade, topic);
  if (pkg && pkg.problems && pkg.problems.length > 0) {
    return pkg.problems;
  }
  
  // If package exists but no problems, generate and update
  if (pkg) {
    console.log("Generating missing problem bank for:", topic);
    const newProblems = await generateBatchProblems(topic, grade, 20);
    if (newProblems && newProblems.length > 0) {
      const updatedPkg = { ...pkg, problems: newProblems };
      await saveLessonPackage(grade, topic, "main_package", updatedPkg);
      return newProblems;
    }
  }
  
  return [];
};

/**
 * Retrieves content for a specific game type, using the cached problem bank.
 */
export const getGameContent = async (grade: string, topic: string, type: string): Promise<any> => {
  const problems = await getProblemsForTopic(grade, topic);
  if (!problems || problems.length === 0) {
    return null;
  }

  switch (type) {
    case 'BINGO':
      return {
        questions: problems.slice(0, 15).map(p => ({
          question: p.question,
          answer: p.options[p.correctAnswerIndex]
        }))
      };
    case 'FLASHCARDS':
      return {
        cards: problems.slice(0, 10).map(p => ({
          question: p.question,
          answer: p.options[p.correctAnswerIndex]
        }))
      };
    case 'ESCAPE_ROOM':
      return {
        riddles: problems.slice(0, 5).map(p => ({
          question: p.question,
          answer: p.options[p.correctAnswerIndex]
        }))
      };
    case 'PASSWORD':
    case 'BALLOONS':
    case 'MATEHOOT':
      return {
        tasks: problems.map(p => ({
          question: p.question,
          answer: p.options[p.correctAnswerIndex],
          options: p.options,
          correctAnswerIndex: p.correctAnswerIndex
        }))
      };
    default:
      return null;
  }
};
