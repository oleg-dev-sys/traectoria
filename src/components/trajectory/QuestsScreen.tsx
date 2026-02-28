/**
 * Экран Задач - ежедневные отметки по всем активным целям
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Calendar, CheckCircle2, Trophy, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import vkBridge from '@vkontakte/vk-bridge';
import { QuestCard } from './QuestCard';
import { calcProgressPercent } from '@/lib/progress';
import { useAppStore, checkAndUpdateStreak, useTotalXP } from '@/store';
import { usePlatform } from '@/hooks/platform';
import type { DailyQuest } from '@/types';

export const QuestsScreen = () => {
  const goals = useAppStore((state) => state.goals);
  const dailyQuests = useAppStore((state) => state.dailyQuests);
  const streak = useAppStore((state) => state.streak);
  const questHistory = useAppStore((state) => state.questHistory);
  const completeQuest = useAppStore((state) => state.completeQuest);
  const generateNewQuest = useAppStore((state) => state.generateNewQuest);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const requestOpenAddGoalModal = useAppStore((state) => state.requestOpenAddGoalModal);
  const totalXP = useTotalXP();
  const platform = usePlatform();
  const [dailyResults, setDailyResults] = useState<Record<string, string>>({});
  const [resultErrors, setResultErrors] = useState<Record<string, string>>({});

  const focusDayQuest: DailyQuest = {
    id: 'focus-day',
    title: 'Определи фокус дня',
    description: 'Выбери цель и сделай первый шаг.',
    category: 'habit',
    reward: 10,
    completed: false,
    date: new Date().toISOString().split('T')[0],
  };

  const goalQuests = useMemo(
    () => dailyQuests.filter((quest) => Boolean(quest.goalId)),
    [dailyQuests],
  );
  const pendingGoalQuests = useMemo(
    () => goalQuests.filter((quest) => !quest.completed),
    [goalQuests],
  );
  const completedGoalQuests = useMemo(
    () => goalQuests.filter((quest) => quest.completed),
    [goalQuests],
  );

  useEffect(() => {
    checkAndUpdateStreak();
  }, []);

  useEffect(() => {
    generateNewQuest();
  }, [generateNewQuest]);

  const handleCreateGoalFromFocus = useCallback(async () => {
    if (platform === 'vk') {
      try {
        const isSupported = await vkBridge.supportsAsync('VKWebAppShowNativeAds');
        if (isSupported) {
          await vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' });
        }
      } catch {
        // Continue to goal creation flow even when ad is unavailable or failed.
      }
    }

    requestOpenAddGoalModal();
    setActiveTab('profile');
  }, [platform, requestOpenAddGoalModal, setActiveTab]);

  const handleCompleteGoalQuest = useCallback((quest: DailyQuest) => {
    const raw = dailyResults[quest.id] || '';
    const parsed = Number.parseFloat(raw.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setResultErrors((prev) => ({ ...prev, [quest.id]: 'Введите результат за сегодня (больше 0)' }));
      return;
    }

    setResultErrors((prev) => ({ ...prev, [quest.id]: '' }));
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#007AFF', '#00C853', '#FFD700'],
    });
    completeQuest(quest.id, Math.max(1, Math.round(parsed)));
    setDailyResults((prev) => ({ ...prev, [quest.id]: '' }));
  }, [completeQuest, dailyResults]);

  return (
    <div className="min-h-screen pb-24 px-4 pt-6">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-white mb-2"
          >
            Ежедневные задачи
          </motion.h1>
          <p className="text-white/60">Отмечай результат по каждой активной цели</p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-4 mb-8"
        >
          <div className="flex flex-col items-center bg-white/5 rounded-2xl p-4 min-w-[100px]">
            <div className="flex items-center gap-1 mb-1">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-2xl font-bold text-white">{streak.current}</span>
            </div>
            <span className="text-xs text-white/50">дней подряд</span>
          </div>

          <div className="w-px h-16 bg-white/10" />

          <div className="flex flex-col items-center bg-white/5 rounded-2xl p-4 min-w-[100px]">
            <div className="flex items-center gap-1 mb-1">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold text-white">{streak.max}</span>
            </div>
            <span className="text-xs text-white/50">рекорд</span>
          </div>

          <div className="w-px h-16 bg-white/10" />

          <div className="flex flex-col items-center bg-gradient-to-br from-[#007AFF]/20 to-[#00C853]/20 rounded-2xl p-4 min-w-[100px] border border-[#007AFF]/30">
            <div className="flex items-center gap-1 mb-1">
              <Star className="w-5 h-5 text-[#FFD700]" />
              <span className="text-2xl font-bold text-white">{totalXP}</span>
            </div>
            <span className="text-xs text-white/50">XP</span>
          </div>
        </motion.div>

        {pendingGoalQuests.length === 0 && (
          <QuestCard
            quest={focusDayQuest}
            streak={streak.current}
            onComplete={() => void handleCreateGoalFromFocus()}
            completed={false}
          />
        )}

        {pendingGoalQuests.map((quest) => {
          const goal = goals.find((item) => item.id === quest.goalId);
          if (!goal) return null;
          const hint =
            goal.progressMode === 'increment'
              ? 'Накапливаем прогресс'
              : goal.progressMode === 'best'
                ? 'Сохраняем лучший результат'
                : 'Обновляем текущее значение';

          return (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-[#007AFF]/30 bg-gradient-to-br from-[#007AFF]/15 to-[#00C853]/15 p-4"
            >
              <h3 className="text-lg font-semibold text-white mb-1">{goal.title}</h3>
              <p className="text-sm text-white/70 mb-3">{hint}</p>

              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-white/60">Прогресс</span>
                <span className="text-white font-semibold">
                  {calcProgressPercent(goal.currentValue, goal.targetValue)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${calcProgressPercent(goal.currentValue, goal.targetValue)}%` }}
                  className="h-full bg-gradient-to-r from-[#007AFF] to-[#00C853]"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-white/50 mb-3">
                <span>{goal.currentValue.toLocaleString()} {goal.unit}</span>
                <span>{goal.targetValue.toLocaleString()} {goal.unit}</span>
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={dailyResults[quest.id] || ''}
                  onChange={(e) => setDailyResults((prev) => ({ ...prev, [quest.id]: e.target.value }))}
                  placeholder={`Например: 30 ${goal.unit}`}
                  className="h-11 w-full rounded-xl border border-white/20 bg-black/20 px-3 text-white placeholder:text-white/40 focus:border-[#007AFF] focus:outline-none md:flex-1"
                />
                <button
                  onClick={() => handleCompleteGoalQuest(quest)}
                  className="h-11 w-full rounded-xl bg-[#007AFF] px-4 font-medium text-white hover:bg-[#0068DA] transition-colors md:w-auto"
                >
                  Отметить
                </button>
              </div>
              {resultErrors[quest.id] && <p className="mt-2 text-sm text-red-400">{resultErrors[quest.id]}</p>}
            </motion.div>
          );
        })}

        {pendingGoalQuests.length > 0 && (
          <QuestCard
            quest={focusDayQuest}
            streak={streak.current}
            onComplete={() => void handleCreateGoalFromFocus()}
            completed={false}
          />
        )}

        {completedGoalQuests.length > 0 && (
          <div className="space-y-3">
            {completedGoalQuests.map((quest) => (
              <QuestCard
                key={`completed-${quest.id}`}
                quest={quest}
                streak={streak.current}
                onComplete={() => {}}
                completed
              />
            ))}
          </div>
        )}

        {questHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-white/60" />
              <h2 className="text-lg font-semibold text-white">История</h2>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence>
                {questHistory.slice(0, 10).map((item, index) => (
                  <motion.div
                    key={`${item.date}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#00C853] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{item.questTitle}</div>
                      <div className="text-xs text-white/40">{item.date}</div>
                    </div>
                    {item.xpEarned && (
                      <div className="flex items-center gap-1 text-[#FFD700] text-sm font-medium">
                        <Star className="w-3 h-3" />
                        <span>+{item.xpEarned}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
