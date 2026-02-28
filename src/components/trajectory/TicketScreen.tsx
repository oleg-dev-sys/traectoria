/**
 * Экран Билета - слайдер билетов для всех целей
 */

'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { TicketSlider } from './TicketSlider';
import { useAppStore } from '@/store';
import { calcProgressPercent } from '@/lib/progress';
import { createAchievementShareImage } from '@/lib/achievement-share-image';
import type { Goal } from '@/types';

export const TicketScreen = () => {
  const user = useAppStore((state) => state.user);
  const goals = useAppStore((state) => state.goals);
  const activeGoalId = useAppStore((state) => state.activeGoalId);
  const setActiveGoal = useAppStore((state) => state.setActiveGoal);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const openAchievementShareGoal = useAppStore((state) => state.openAchievementShareGoal);
  
  const [isGenerating, setIsGenerating] = useState(false);

  // Только активные и на паузе цели для слайдера
  const visibleGoals = goals.filter(g => g.status === 'active' || g.status === 'paused');

  // Шеринг конкретной цели
  const handleShare = useCallback(async (goal: Goal) => {
    openAchievementShareGoal(goal.id);
  }, [openAchievementShareGoal]);

  // Скачивание изображения конкретной цели
  const handleDownload = useCallback(async (goal: Goal, ticketRef: React.RefObject<HTMLDivElement>) => {
    if (!ticketRef.current || typeof window === 'undefined' || !user) return;

    setIsGenerating(true);

    try {
      const imageDataUrl = createAchievementShareImage({
        userName: user.name || 'Пользователь',
        goalTitle: goal.title,
        currentValue: goal.currentValue,
        targetValue: goal.targetValue,
        unit: goal.unit,
        progressPercent: calcProgressPercent(goal.currentValue, goal.targetValue),
      });

      // Создаем ссылку для скачивания
      const link = document.createElement('a');
      link.download = `trajectory-${goal.title.replace(/\s+/g, '-')}-${Date.now()}.png`;
      link.href = imageDataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
      window.alert('Не удалось скачать билет');
    } finally {
      setIsGenerating(false);
    }
  }, [user]);

  // Переход к задачам
  const handleContinue = useCallback(() => {
    setActiveTab('quests');
  }, [setActiveTab]);

  // Выбор активной цели
  const handleSelectGoal = useCallback((id: string) => {
    setActiveGoal(id);
  }, [setActiveGoal]);

  // Если нет пользователя
  if (!user) return null;

  // Если нет видимых целей
  if (visibleGoals.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#007AFF] to-[#00C853] flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Нет активных целей</h2>
          <p className="text-white/60 mb-6 max-w-xs">
            {goals.length > 0 
              ? 'Все цели достигнуты! Создайте новую или возобновите существующую.'
              : 'Создай свою первую цель и начни путь к мечте!'}
          </p>
          <button
            onClick={() => setActiveTab('profile')}
            className="px-6 py-3 bg-[#007AFF] text-white font-semibold rounded-2xl hover:bg-[#0066CC] transition-colors"
          >
            К целям
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <TicketSlider
        goals={visibleGoals}
        user={user}
        activeGoalId={activeGoalId}
        onSelectGoal={handleSelectGoal}
        onShare={handleShare}
        onDownload={handleDownload}
        onContinue={handleContinue}
        isGenerating={isGenerating}
      />
    </div>
  );
};
