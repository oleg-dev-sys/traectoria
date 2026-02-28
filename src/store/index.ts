import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { apiClient, type GoalResponse, type MeResponse, type QuestHistoryResponse, type QuestTodayResponse } from "@/lib/api-client";
import type { AppState, DailyQuest, Goal, GoalCategory, ProgressMode, QuestHistory, UserProfile } from "@/types";
import { GOAL_COLORS } from "@/types";

const FALLBACK_CATEGORY: GoalCategory = "other";

const detectNewlyCompletedGoal = (prevGoals: Goal[], nextGoals: Goal[]): Goal | null => {
  const prevById = new Map(prevGoals.map((goal) => [goal.id, goal]));
  for (const goal of nextGoals) {
    if (goal.status !== "completed") continue;
    const prev = prevById.get(goal.id);
    if (!prev || prev.status !== "completed") return goal;
  }
  return null;
};

const mapUser = (me: MeResponse): UserProfile => ({
  id: String(me.id),
  name: me.display_name || "Пользователь",
  avatar: me.avatar_url || undefined,
  createdAt: me.created_at,
  updatedAt: me.updated_at,
});

const mapGoal = (goal: GoalResponse): Goal => {
  const isCompleted = goal.current_value >= goal.target_value;
  return {
    id: String(goal.id),
    title: goal.title,
    description: goal.description || "",
    category: goal.category || FALLBACK_CATEGORY,
    currentValue: goal.current_value,
    targetValue: goal.target_value,
    unit: goal.unit || "шаг",
    progressMode: goal.progress_mode || "increment",
    status: isCompleted ? "completed" : goal.is_active ? "active" : "paused",
    createdAt: goal.created_at,
    updatedAt: goal.updated_at,
    color: goal.color || GOAL_COLORS[goal.id % GOAL_COLORS.length],
  };
};

const mapHistory = (items: QuestHistoryResponse[]): QuestHistory[] =>
  items.map((item) => ({
    date: item.completed_at.split("T")[0],
    questTitle: `Квест #${item.quest_id}`,
    category: "habit",
    goalId: undefined,
    xpEarned: item.points_awarded,
  }));

const mapTodayQuest = (quest: QuestTodayResponse, completedQuestIds: Set<number>): DailyQuest => ({
  id: String(quest.id),
  title: quest.title,
  description: quest.description || "Ежедневный квест",
  category: "habit",
  reward: quest.reward_points,
  completed: completedQuestIds.has(quest.id),
  completedAt: undefined,
  date: quest.quest_date,
  goalId: quest.goal_id ? String(quest.goal_id) : undefined,
});

const mapTodayQuests = (quests: QuestTodayResponse[], completedQuestIds: Set<number>): DailyQuest[] =>
  quests.map((quest) => mapTodayQuest(quest, completedQuestIds));

const syncFromBackend = async (token: string) => {
  const [me, goals, todayQuests, history] = await Promise.all([
    apiClient.me(token),
    apiClient.goals.list(token),
    apiClient.quests.today(token),
    apiClient.quests.history(token),
  ]);

  const completedIds = new Set(history.map((h) => h.quest_id));
  return {
    me,
    goals: goals.map(mapGoal),
    dailyQuests: mapTodayQuests(todayQuests, completedIds),
    history: mapHistory(history),
  };
};

interface StoreState extends AppState {
  token: string | null;
  achievementShareGoal: Goal | null;
  dismissAchievementShareGoal: () => void;
  openAchievementShareGoal: (goalId: string) => void;
  openAddGoalModalRequested: boolean;
  requestOpenAddGoalModal: () => void;
  consumeOpenAddGoalModalRequest: () => void;
  hydrateSession: () => Promise<void>;
  bootstrapAuth: (opts: {
    platform: "web" | "telegram" | "vk";
    displayName?: string;
    avatarUrl?: string;
    telegramInitData?: string;
    telegramWidgetPayload?: Record<string, string | number>;
    vkPayload?: Record<string, string>;
  }) => Promise<void>;
  onboard: (
    name: string,
    goalTitle: string,
    progress: number,
    opts?: {
      platform?: "web" | "telegram" | "vk";
      telegramInitData?: string;
      goalTargetValue?: number;
      goalUnit?: string;
      goalProgressMode?: ProgressMode;
    },
  ) => Promise<void>;
}

export const useAppStore = create<StoreState>()(
  persist(
    (set, get) => ({
      token: null,
      achievementShareGoal: null,
      openAddGoalModalRequested: false,
      user: null,
      isOnboarded: false,
      goals: [],
      activeGoalId: null,
      activeTab: "ticket",
      dailyQuests: [],
      streak: { current: 0, max: 0, lastCompletedDate: null, history: [] },
      questHistory: [],
      platform: "web",
      totalXP: 0,
      setPlatform: (platform) => set({ platform }),
      dismissAchievementShareGoal: () => set({ achievementShareGoal: null }),
      openAchievementShareGoal: (goalId) =>
        set((state) => ({
          achievementShareGoal: state.goals.find((goal) => goal.id === goalId) || null,
        })),
      requestOpenAddGoalModal: () => set({ openAddGoalModalRequested: true }),
      consumeOpenAddGoalModalRequest: () => set({ openAddGoalModalRequested: false }),

      hydrateSession: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const synced = await syncFromBackend(token);
          const hasGoals = synced.goals.length > 0;
          set(() => ({
            user: mapUser(synced.me),
            isOnboarded: hasGoals,
            goals: synced.goals,
            activeGoalId: synced.goals[0]?.id || null,
            dailyQuests: synced.dailyQuests,
            questHistory: synced.history,
            totalXP: synced.me.total_points,
            streak: {
              current: synced.me.streak_days,
              max: synced.me.streak_days,
              lastCompletedDate: synced.history[0]?.date || null,
              history: synced.history.map((h) => h.date),
            },
          }));
        } catch {
          set({ token: null, user: null, isOnboarded: false });
        }
      },

      bootstrapAuth: async (opts) => {
        let auth;
        if (opts.platform === "telegram" && opts.telegramInitData) {
          auth = await apiClient.authTelegram(
            opts.telegramInitData,
            opts.displayName || "Telegram User",
            opts.avatarUrl,
          );
        } else if (opts.platform === "telegram" && opts.telegramWidgetPayload) {
          auth = await apiClient.authTelegramWidget(
            opts.telegramWidgetPayload,
            opts.displayName || "Telegram User",
            opts.avatarUrl,
          );
        } else if (opts.platform === "vk" && opts.vkPayload) {
          auth = await apiClient.authVK(opts.vkPayload, opts.displayName, opts.avatarUrl);
        } 
        // else {
        //   auth = await apiClient.authWeb(opts.displayName || "Web User", opts.avatarUrl);
        // }

        // ИСПРАВЛЕНИЕ: Сохраняем платформу в store
        set({ token: auth.access_token, platform: opts.platform });
        await get().hydrateSession();
      },

      onboard: async (name: string, goalTitle: string, progress: number, opts) => {
        const platform = opts?.platform || "web";
        const existingToken = get().token;
        console.log(platform)
        console.log(opts)
        const token =
          existingToken ||
          (platform === "telegram" && opts?.telegramInitData
            ? (await apiClient.authTelegram(opts.telegramInitData, name)).access_token
            // : (await apiClient.authWeb(name)).access_token);
            : '')
        const parsedTarget = opts?.goalTargetValue;
        const fallbackTarget = progress > 0 ? Math.max(progress * 2, 100) : 100;
        const target = Math.max(1, Math.round(parsedTarget ?? fallbackTarget));
        const current = Math.max(0, Math.round(progress));
        await apiClient.onboarding(token, {
          display_name: name.trim(),
          goal_title: goalTitle.trim(),
          goal_target_value: target,
          goal_current_value: current,
          goal_unit: opts?.goalUnit || "шаг",
          goal_progress_mode: opts?.goalProgressMode || "increment",
        });
        // ИСПРАВЛЕНИЕ: Сохраняем и платформу тоже
        set({ token, platform });
        await get().hydrateSession();
      },

      setUser: (user: UserProfile) => set({ user, isOnboarded: true }),

      addGoal: (goalData) => {
        const token = get().token;
        if (!token) return;
        void (async () => {
          const created = await apiClient.goals.create(token, {
            title: goalData.title,
            description: goalData.description,
            target_value: goalData.targetValue,
            current_value: goalData.currentValue,
            unit: goalData.unit.trim() || "шаг",
            progress_mode: goalData.progressMode || "increment",
            category: goalData.category,
            color: goalData.color,
          });
          const nextGoal = mapGoal(created);
          set((state) => ({
            goals: [nextGoal, ...state.goals],
            activeGoalId: state.activeGoalId || nextGoal.id,
          }));
        })();
      },

      updateGoal: (id, updates) => {
        const token = get().token;
        if (!token) return;
        void (async () => {
          const updated = await apiClient.goals.update(token, Number(id), {
            title: updates.title,
            description: updates.description,
            target_value: updates.targetValue,
            current_value: updates.currentValue,
            unit: typeof updates.unit === "string" ? updates.unit.trim() || "шаг" : undefined,
            progress_mode: updates.progressMode,
            category: updates.category,
            color: updates.color,
            is_active: updates.status ? updates.status === "active" : undefined,
          });
          const nextGoal = mapGoal(updated);
          set((state) => ({
            goals: state.goals.map((goal) => (goal.id === id ? { ...goal, ...nextGoal } : goal)),
            achievementShareGoal:
              state.achievementShareGoal ||
              (nextGoal.status === "completed" &&
              state.goals.find((goal) => goal.id === id)?.status !== "completed"
                ? nextGoal
                : null),
          }));
        })();
      },

      deleteGoal: (id) => {
        const token = get().token;
        if (!token) return;
        void (async () => {
          await apiClient.goals.remove(token, Number(id));
          set((state) => {
            const nextGoals = state.goals.filter((goal) => goal.id !== id);
            return {
              goals: nextGoals,
              activeGoalId: state.activeGoalId === id ? nextGoals[0]?.id || null : state.activeGoalId,
            };
          });
        })();
      },

      setActiveGoal: (id) => set({ activeGoalId: id }),

      updateGoalProgress: (id, value) => {
        get().updateGoal(id, { currentValue: value });
      },

      setActiveTab: (tab) => set({ activeTab: tab }),

      completeQuest: (questId: string, resultValue?: number) => {
        const token = get().token;
        if (!token || !questId) return;
        void (async () => {
          const prevGoals = get().goals;
          await apiClient.quests.complete(token, Number(questId), resultValue);
          get().generateNewQuest();
          await get().hydrateSession();
          const newlyCompletedGoal = detectNewlyCompletedGoal(prevGoals, get().goals);
          if (newlyCompletedGoal) {
            set((state) => ({
              achievementShareGoal: state.achievementShareGoal || newlyCompletedGoal,
            }));
          }
        })();
      },

      generateNewQuest: () => {
        const token = get().token;
        if (!token) return;
        void (async () => {
          const [today, history] = await Promise.all([apiClient.quests.today(token), apiClient.quests.history(token)]);
          const completedIds = new Set(history.map((h) => h.quest_id));
          set({
            dailyQuests: mapTodayQuests(today, completedIds),
            questHistory: mapHistory(history),
          });
        })();
      },

      resetUser: () =>
        set({
          token: null,
          achievementShareGoal: null,
          openAddGoalModalRequested: false,
          user: null,
          isOnboarded: false,
          goals: [],
          activeGoalId: null,
          activeTab: "ticket",
          dailyQuests: [],
          streak: { current: 0, max: 0, lastCompletedDate: null, history: [] },
          questHistory: [],
          totalXP: 0,
          platform: "web",
        }),
    }),
    {
      name: "trajectory-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        activeTab: state.activeTab,
        platform: state.platform,  // ИСПРАВЛЕНИЕ: Сохраняем platform в localStorage
      }),
    },
  ),
);

export const useUser = () => useAppStore((state) => state.user);
export const useIsOnboarded = () => useAppStore((state) => state.isOnboarded);
export const useGoals = () => useAppStore((state) => state.goals);
export const useActiveGoal = () => {
  const goals = useAppStore((state) => state.goals);
  const activeGoalId = useAppStore((state) => state.activeGoalId);
  return goals.find((g) => g.id === activeGoalId) || null;
};
export const useActiveGoalId = () => useAppStore((state) => state.activeGoalId);
export const useActiveTab = () => useAppStore((state) => state.activeTab);
export const useDailyQuest = () => useAppStore((state) => state.dailyQuests[0] || null);
export const useStreak = () => useAppStore((state) => state.streak);
export const useQuestHistory = () => useAppStore((state) => state.questHistory);
export const useTotalXP = () => useAppStore((state) => state.totalXP);

export const createUser = (name: string): UserProfile => ({
  id: `local-${Date.now()}`,
  name: name.trim(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const createGoal = (
  title: string,
  targetValue: number,
  currentValue: number = 0,
  category: GoalCategory = "other",
  unit: string = "",
  description: string = "",
  progressMode: ProgressMode = "increment",
): Omit<Goal, "id" | "createdAt" | "updatedAt" | "status"> => {
  const colorIndex = Math.floor(Math.random() * GOAL_COLORS.length);
  return {
    title: title.trim(),
    description: description.trim(),
    category,
    currentValue,
    targetValue,
    unit: unit.trim(),
    progressMode,
    color: GOAL_COLORS[colorIndex],
  };
};

export const checkAndUpdateStreak = () => {
  void useAppStore.getState().generateNewQuest();
};

export const useUserStats = () => {
  const goals = useAppStore((state) => state.goals);
  const streak = useAppStore((state) => state.streak);
  const questHistory = useAppStore((state) => state.questHistory);
  const totalXP = useAppStore((state) => state.totalXP);

  return {
    totalGoals: goals.length,
    completedGoals: goals.filter((g) => g.status === "completed").length,
    activeGoals: goals.filter((g) => g.status === "active").length,
    currentStreak: streak.current,
    maxStreak: streak.max,
    totalQuestsCompleted: questHistory.length,
    totalXP: totalXP || 0,
  };
};