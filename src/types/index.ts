/**
 * Типы и интерфейсы для проекта "Траектория"
 * Геймифицированный трекер целей с поддержкой Web, Telegram и VK
 */

// ===== ОСНОВНЫЕ ТИПЫ =====

/** Платформа, на которой запущено приложение */
export type Platform = 'telegram' | 'vk' | 'web';

/** Статус цели */
export type GoalStatus = 'active' | 'completed' | 'paused';
export type ProgressMode = 'increment' | 'absolute' | 'best';

/** Категория цели */
export type GoalCategory = 'finance' | 'travel' | 'health' | 'education' | 'business' | 'other';

/** Отдельная цель */
export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  currentValue: number;
  targetValue: number;
  unit: string;
  progressMode: ProgressMode;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  color: string;
}

/** Данные пользователя */
export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

/** Ежедневный квест */
export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  category: 'finance' | 'health' | 'learning' | 'habit';
  reward: number;
  completed: boolean;
  completedAt?: string;
  date: string;
  goalId?: string;
}

/** Идея для заработка */
export interface BusinessIdea {
  id: string;
  title: string;
  description: string;
  firstStep: string;
  category: 'online' | 'offline' | 'creative' | 'service';
  estimatedIncome: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

/** Streak (серия дней) */
export interface StreakData {
  current: number;
  max: number;
  lastCompletedDate: string | null;
  history: string[];
}

/** История выполненных задач */
export interface QuestHistory {
  date: string;
  questTitle: string;
  category: DailyQuest['category'];
  goalId?: string;
  xpEarned: number;
}

// ===== СОСТОЯНИЕ ПРИЛОЖЕНИЯ =====

export interface AppState {
  // Пользователь
  user: UserProfile | null;
  isOnboarded: boolean;
  
  // Цели
  goals: Goal[];
  activeGoalId: string | null;
  
  // Навигация
  activeTab: 'ticket' | 'quests' | 'ideas' | 'profile';
  
  // Квесты
  dailyQuests: DailyQuest[];
  streak: StreakData;
  questHistory: QuestHistory[];
  totalXP: number;
  
  // Платформа
  platform: Platform;
  setPlatform: (platform: Platform) => void;
  
  // Действия - пользователь
  setUser: (user: UserProfile) => void;
  
  // Действия - цели
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  setActiveGoal: (id: string) => void;
  updateGoalProgress: (id: string, value: number) => void;
  
  // Действия - навигация
  setActiveTab: (tab: AppState['activeTab']) => void;
  
  // Действия - квесты
  completeQuest: (questId: string, resultValue?: number) => void;
  generateNewQuest: () => void;
  
  // Действия - сброс
  resetUser: () => void;
}

// ===== ПРОПСЫ КОМПОНЕНТОВ =====

/** Пропсы для кнопки */
export interface TrajectoryButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

/** Пропсы для инпута */
export interface TrajectoryInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  error?: string;
  className?: string;
}

/** Пропсы для прогресс-бара */
export interface ProgressBarProps {
  current: number;
  target: number;
  label?: string;
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
}

/** Пропсы для Билета */
export interface TicketProps {
  goal: Goal;
  userName: string;
  onShare: () => void;
  onDownload: () => void;
  onContinue: () => void;
}

/** Пропсы для карточки цели */
export interface GoalCardProps {
  goal: Goal;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** Пропсы для карточки идеи */
export interface IdeaCardProps {
  idea: BusinessIdea;
  onGenerate: () => void;
}

/** Пропсы для карточки квеста */
export interface QuestCardProps {
  quest: DailyQuest;
  streak: number;
  onComplete: () => void;
  completed?: boolean;
}

// ===== API RESPONSES =====

export interface GenerateIdeaResponse {
  idea: BusinessIdea;
}

// ===== КАТЕГОРИИ ЦЕЛЕЙ =====

export const GOAL_CATEGORIES: Record<GoalCategory, { label: string; icon: string }> = {
  finance: { label: 'Финансы', icon: '💰' },
  travel: { label: 'Путешествия', icon: '✈️' },
  health: { label: 'Здоровье', icon: '💪' },
  education: { label: 'Обучение', icon: '📚' },
  business: { label: 'Бизнес', icon: '🚀' },
  other: { label: 'Другое', icon: '🎯' },
};

export const GOAL_COLORS = [
  '#007AFF', // синий
  '#00C853', // зелёный
  '#FF9500', // оранжевый
  '#FF3B30', // красный
  '#AF52DE', // фиолетовый
  '#FF2D55', // розовый
  '#5856D6', // индиго
  '#FFCC00', // жёлтый
];

// ===== TELEGRAM SDK TYPES =====

export interface TelegramWebApp {
  ready: () => void;
  close: () => void;
  expand: () => void;
  initData: string;
  initDataUnsafe?: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
    };
  };
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  openLink: (url: string) => void;
  openTelegramLink: (url: string) => void;
  share: (url: string, text: string) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}
