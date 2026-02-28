/**
 * Карточка ежедневного квеста
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Flame, Zap, Heart, BookOpen, Coins, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DailyQuest } from '@/types';

interface QuestCardProps {
  quest: DailyQuest;
  streak: number;
  onComplete: () => void;
  completed?: boolean;
}

// Иконки для категорий
const categoryIcons = {
  finance: Coins,
  health: Heart,
  learning: BookOpen,
  habit: Zap,
};

// Цвета для категорий
const categoryColors = {
  finance: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
  health: 'from-red-500/20 to-pink-500/20 border-red-500/30',
  learning: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  habit: 'from-purple-500/20 to-violet-500/20 border-purple-500/30',
};

export const QuestCard = ({ quest, streak, onComplete, completed }: QuestCardProps) => {
  const Icon = categoryIcons[quest.category];
  const gradientClass = categoryColors[quest.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative rounded-3xl p-6 border',
        'bg-gradient-to-br',
        gradientClass,
        'backdrop-blur-sm'
      )}
    >
      {/* Streak badge */}
      {streak > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute -top-3 -right-3 flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg"
        >
          <Flame className="w-4 h-4" />
          <span>{streak}</span>
        </motion.div>
      )}

      {/* Категория */}
      <div className="flex items-center gap-2 mb-4">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          'bg-white/10'
        )}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="text-xs text-white/50 uppercase tracking-wider">
          {quest.category === 'finance' && 'Финансы'}
          {quest.category === 'health' && 'Здоровье'}
          {quest.category === 'learning' && 'Обучение'}
          {quest.category === 'habit' && 'Привычка'}
        </div>
      </div>

      {/* Заголовок и описание */}
      <h3 className="text-xl font-bold text-white mb-2">{quest.title}</h3>
      <p className="text-white/60 text-sm mb-6">{quest.description}</p>

      {/* Награда и кнопка */}
      <div className="flex items-center justify-between">
        {/* Награда XP */}
        <div className="flex items-center gap-2 bg-[#007AFF]/20 rounded-xl px-4 py-2 border border-[#007AFF]/30">
          <Star className="w-5 h-5 text-[#FFD700]" />
          <div>
            <div className="text-[10px] text-white/50 uppercase">Награда</div>
            <div className="text-lg font-bold text-white">+{quest.reward} XP</div>
          </div>
        </div>

        {/* Кнопка выполнения */}
        <motion.button
          onClick={onComplete}
          disabled={completed}
          whileHover={{ scale: completed ? 1 : 1.05 }}
          whileTap={{ scale: completed ? 1 : 0.95 }}
          className={cn(
            'flex items-center justify-center w-14 h-14 rounded-full transition-all',
            completed
              ? 'bg-[#00C853]/20 cursor-default'
              : 'bg-white/10 hover:bg-white/20 cursor-pointer'
          )}
        >
          <AnimatePresence mode="wait">
            {completed ? (
              <motion.div
                key="completed"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <CheckCircle2 className="w-8 h-8 text-[#00C853]" />
              </motion.div>
            ) : (
              <motion.div
                key="uncompleted"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Circle className="w-8 h-8 text-white/40" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Выполнено - показать полученный XP */}
      {completed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-[#00C853]"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">Получено +{quest.reward} XP!</span>
        </motion.div>
      )}
    </motion.div>
  );
};
