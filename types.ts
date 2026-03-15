
export enum GradeLevel {
  VI = "VI",
  VII = "VII",
  VIII = "VIII",
  IX = "IX"
}

export interface CurriculumTheme {
  id: string;
  title: string;
  grade: GradeLevel;
}

export interface CurriculumTopic {
  id: string;
  themeId: string;
  name: string;
  grade: GradeLevel;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  difficulty: 'Лесно' | 'Средно' | 'Тешко';
}

export interface GeneratedLesson {
  title: string;
  content: string; // Markdown supported
  objectives: string[];
}

export interface GeneratedScenario {
  topic: string;
  standards: string; // Стандарди за оценување
  content: string; // Содржина и поими
  introActivity: string; // Воведна активност
  mainActivity: string; // Главни активности
  finalActivity: string; // Завршна активност
  resources: string; // Средства
  assessment: string; // Следење на напредокот
}

export enum AppMode {
  DASHBOARD = 'DASHBOARD',
  LESSON = 'LESSON',
  QUIZ = 'QUIZ',
  VISUALIZER = 'VISUALIZER',
  SCENARIO = 'SCENARIO',
  WORKSHEET = 'WORKSHEET',
  PROJECT = 'PROJECT',
  BOARD_PLAN = 'BOARD_PLAN',
  ADVANCED_PRACTICE = 'ADVANCED_PRACTICE',
  TEACHER_PANEL = 'TEACHER_PANEL',
  GAMES = 'GAMES',
  BINGO = 'BINGO',
  BOARD_GAME = 'BOARD_GAME',
  GEOGEBRA = 'GEOGEBRA',
  MATHIGON = 'MATHIGON',
  ANALYTICS = 'ANALYTICS',
  REMEDIAL_TEACHING = 'REMEDIAL_TEACHING',
  ERROR_DETECTIVE = 'ERROR_DETECTIVE',
  INCLUSION = 'INCLUSION',
  MATE_SAFE = 'MATE_SAFE',
  AI_REVIEWER = 'AI_REVIEWER',
  AI_CREATOR = 'AI_CREATOR'
}

export type GameType = 'BINGO' | 'ESCAPE_ROOM' | 'PASSWORD' | 'BALLOONS' | 'FLASHCARDS' | 'MATEHOOT' | 'BOARD_GAME' | 'MATE_SAFE';

export interface GameState {
  pin: string;
  topic: string;
  type: GameType;
  status: 'WAITING' | 'PLAYING' | 'QUESTION' | 'RESULT' | 'LEADERBOARD' | 'FINISHED';
  players: any[];
  solvers?: string[];
  bingoWinner?: string;
  content: any;
  createdAt?: number;
  currentQuestionIndex?: number;
  questionStartTime?: number;
  showCorrectAnswer?: boolean;
}

export interface LessonPackage {
  grade: string;
  topic: string;
  lesson: GeneratedLesson;
  quiz: {
    questions: QuizQuestion[];
    rubric: string;
  };
  problems: QuizQuestion[]; // Batch of 30 problems for games/practice
  scenario: GeneratedScenario;
  boardPlan: string;
  worksheet: string;
  project: string;
  connectivity: string;
  remedial: {
    problem: string;
    prerequisites: string[];
    steps: {
      title: string;
      explanation: string;
      hint: string;
      visualAid: string;
    }[];
    summary: string;
  };
  inclusion: string;
  errorDetective: {
    title: string;
    problem: string;
    steps: {
      content: string;
      isCorrect: boolean;
      errorExplanation?: string;
    }[];
    finalAdvice: string;
  };
}
