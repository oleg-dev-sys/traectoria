/**
 * Экран профиля - управление целями и настройками
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, Trophy, Flame, Settings, LogOut, User, Star } from 'lucide-react';
import vkBridge from '@vkontakte/vk-bridge';
import { GoalCard } from './GoalCard';
import { AddGoalModal } from './AddGoalModal';
import { TrajectoryButton } from './Button';
import { useAppStore, useUserStats } from '@/store';
import { usePlatform, useTelegram } from '@/hooks/platform';
import type { Goal } from '@/types';

export const ProfileScreen = () => {
  const user = useAppStore((state) => state.user);
  const goals = useAppStore((state) => state.goals);
  const activeGoalId = useAppStore((state) => state.activeGoalId);
  const setActiveGoal = useAppStore((state) => state.setActiveGoal);
  const addGoal = useAppStore((state) => state.addGoal);
  const updateGoal = useAppStore((state) => state.updateGoal);
  const deleteGoal = useAppStore((state) => state.deleteGoal);
  const resetUser = useAppStore((state) => state.resetUser);
  const openAddGoalModalRequested = useAppStore((state) => state.openAddGoalModalRequested);
  const consumeOpenAddGoalModalRequest = useAppStore((state) => state.consumeOpenAddGoalModalRequest);
  const platform = usePlatform();
  const telegram = useTelegram();
  const avatarSrc = user?.avatar || telegram.user?.photo_url;
  
  const stats = useUserStats();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleOpenAddGoal = async () => {
    if (platform === 'vk') {
      try {
        const isSupported = await vkBridge.supportsAsync('VKWebAppShowNativeAds');
        if (isSupported) {
          await vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' });
        }
      } catch {
        // Continue to opening modal even when ad is unavailable or failed.
      }
    }

    setEditingGoal(null);
    setIsModalOpen(true);
  };

  // Добавление/редактирование цели
  const handleSaveGoal = (goalData: Parameters<typeof addGoal>[0]) => {
    if (editingGoal) {
      updateGoal(editingGoal.id, goalData);
    } else {
      addGoal(goalData);
    }
    if (openAddGoalModalRequested) {
      consumeOpenAddGoalModalRequest();
    }
    setEditingGoal(null);
  };

  // Удаление цели
  const handleDeleteGoal = (id: string) => {
    deleteGoal(id);
    setShowDeleteConfirm(null);
  };

  // Редактирование цели
  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  // Разделение целей по статусу
  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const pausedGoals = goals.filter((g) => g.status === 'paused');

  if (!user) return null;

  return (
    <div className="min-h-screen pb-24 px-4 pt-6">
      <div className="max-w-lg mx-auto">
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-bold text-white mb-2">Профиль</h1>
          <p className="text-white/60">Управляй своими целями</p>
        </motion.div>

        {/* Карточка пользователя */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-[#007AFF]/20 to-[#00C853]/20 rounded-2xl p-4 mb-6 border border-white/10"
        >
          <div className="flex items-center gap-4">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={user.name}
                className="w-14 h-14 rounded-2xl object-cover border border-white/20"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#00C853] flex items-center justify-center">
                <User className="w-7 h-7 text-white" />
              </div>
            )}
            <div className="flex-1">
              <div className="text-lg font-semibold text-white">{user.name}</div>
              <div className="text-sm text-white/60">
                В проекте с {new Date(user.createdAt).toLocaleDateString('ru-RU')}
              </div>
            </div>
            <button
              onClick={resetUser}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              { platform == 'web' ?
              <LogOut className="w-5 h-5 text-white/40" />
              : '' }
            </button>
          </div>
        </motion.div>

        {/* Статистика - 4 карточки */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          {/* XP - главная карточка */}
          <div className="col-span-2 bg-gradient-to-r from-[#007AFF]/20 to-[#00C853]/20 rounded-2xl p-4 border border-[#007AFF]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs text-white/50 uppercase tracking-wider">Заработано XP</div>
                  <div className="text-3xl font-bold text-white">{stats.totalXP.toLocaleString()}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/40">за {stats.totalQuestsCompleted} задач</div>
              </div>
            </div>
          </div>

          {/* Цели */}
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <Target className="w-5 h-5 text-[#007AFF] mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.totalGoals}</div>
            <div className="text-xs text-white/50">целей</div>
          </div>

          {/* Достигнуто */}
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <Trophy className="w-5 h-5 text-[#00C853] mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.completedGoals}</div>
            <div className="text-xs text-white/50">достигнуто</div>
          </div>

          {/* Streak */}
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.currentStreak}</div>
            <div className="text-xs text-white/50">дней подряд</div>
          </div>

          {/* Рекорд */}
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.maxStreak}</div>
            <div className="text-xs text-white/50">рекорд серии</div>
          </div>
        </motion.div>

        {/* Раздел целей */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Мои цели</h2>
            <TrajectoryButton
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => void handleOpenAddGoal()}
            >
              Добавить
            </TrajectoryButton>
          </div>

          {/* Список целей */}
          {goals.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-2xl">
              <Target className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 mb-4">У вас пока нет целей</p>
              <TrajectoryButton
                variant="secondary"
                size="md"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => void handleOpenAddGoal()}
              >
                Создать первую цель
              </TrajectoryButton>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Активные цели */}
              {activeGoals.length > 0 && (
                <div className="space-y-3">
                  {activeGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      isActive={goal.id === activeGoalId}
                      onSelect={() => setActiveGoal(goal.id)}
                      onEdit={() => handleEditGoal(goal)}
                      onDelete={() => setShowDeleteConfirm(goal.id)}
                    />
                  ))}
                </div>
              )}

              {/* На паузе */}
              {pausedGoals.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm text-white/40 mb-3 px-1">На паузе</h3>
                  <div className="space-y-3">
                    {pausedGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        isActive={goal.id === activeGoalId}
                        onSelect={() => setActiveGoal(goal.id)}
                        onEdit={() => handleEditGoal(goal)}
                        onDelete={() => setShowDeleteConfirm(goal.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Достигнутые */}
              {completedGoals.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm text-white/40 mb-3 px-1">Достигнутые</h3>
                  <div className="space-y-3">
                    {completedGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        isActive={false}
                        onSelect={() => {}}
                        onEdit={() => handleEditGoal(goal)}
                        onDelete={() => setShowDeleteConfirm(goal.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Подтверждение удаления */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-black/80" onClick={() => setShowDeleteConfirm(null)} />
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="relative bg-[#1C1C1E] rounded-2xl p-6 max-w-sm w-full"
              >
                <h3 className="text-lg font-bold text-white mb-2">Удалить цель?</h3>
                <p className="text-white/60 mb-6">Это действие нельзя отменить. Прогресс будет потерян.</p>
                <div className="flex gap-3">
                  <TrajectoryButton
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={() => setShowDeleteConfirm(null)}
                  >
                    Отмена
                  </TrajectoryButton>
                  <TrajectoryButton
                    variant="danger"
                    size="md"
                    fullWidth
                    onClick={() => handleDeleteGoal(showDeleteConfirm)}
                  >
                    Удалить
                  </TrajectoryButton>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Модальное окно добавления/редактирования */}
        <AddGoalModal
          isOpen={isModalOpen || openAddGoalModalRequested}
          onClose={() => {
            setIsModalOpen(false);
            setEditingGoal(null);
            if (openAddGoalModalRequested) {
              consumeOpenAddGoalModalRequest();
            }
          }}
          onSave={handleSaveGoal}
          editGoal={openAddGoalModalRequested ? null : editingGoal}
        />
      </div>
    </div>
  );
};
