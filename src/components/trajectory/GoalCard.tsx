/**
 * Карточка цели для отображения в списке
 */

'use client';

import { motion } from 'framer-motion';
import { MoreVertical, CheckCircle2, Pause, Play, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calcProgressPercent } from '@/lib/progress';
import { GOAL_CATEGORIES } from '@/types';
import type { Goal, GoalStatus } from '@/types';

interface GoalCardProps {
  goal: Goal;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// Конфигурация статусов
const statusConfig: Record<GoalStatus, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  active: { label: 'В процессе', icon: Play, color: 'text-[#00C853]' },
  completed: { label: 'Достигнута', icon: CheckCircle2, color: 'text-[#007AFF]' },
  paused: { label: 'На паузе', icon: Pause, color: 'text-yellow-500' },
};

export const GoalCard = ({ goal, isActive, onSelect, onEdit, onDelete }: GoalCardProps) => {
  const category = GOAL_CATEGORIES[goal.category];
  const status = statusConfig[goal.status];
  const StatusIcon = status.icon;
  const progress = calcProgressPercent(goal.currentValue, goal.targetValue);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={cn(
        'relative rounded-2xl p-4 cursor-pointer transition-all',
        'bg-gradient-to-br from-white/5 to-white/[0.02]',
        'border',
        isActive ? 'border-[#007AFF]/50 shadow-lg shadow-[#007AFF]/10' : 'border-white/10'
      )}
    >
      {/* Цветная полоска слева */}
      <div
        className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
        style={{ backgroundColor: goal.color }}
      />

      {/* Контент */}
      <div className="pl-3">
        {/* Верхняя строка - категория и действия */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{category.icon}</span>
            <span className="text-xs text-white/50">{category.label}</span>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Статус */}
            <div className={cn('flex items-center gap-1 text-xs', status.color)}>
              <StatusIcon className="w-3 h-3" />
              <span>{status.label}</span>
            </div>
            
            {/* Меню действий */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-white/40" />
            </button>
          </div>
        </div>

        {/* Заголовок */}
        <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">
          {goal.title}
        </h3>

        {/* Описание */}
        {goal.description && (
          <p className="text-sm text-white/50 mb-3 line-clamp-1">
            {goal.description}
          </p>
        )}

        {/* Прогресс */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/60">Прогресс</span>
            <span className="font-semibold" style={{ color: goal.color }}>
              {progress}%
            </span>
          </div>
          
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full"
              style={{ backgroundColor: goal.color }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-white/40">
            <span>{goal.currentValue.toLocaleString()} {goal.unit}</span>
            <span>{goal.targetValue.toLocaleString()} {goal.unit}</span>
          </div>
        </div>
      </div>

      {/* Индикатор активной цели */}
      {isActive && (
        <div className="absolute -top-2 -right-2 bg-[#007AFF] rounded-full p-1">
          <Target className="w-3 h-3 text-white" />
        </div>
      )}
    </motion.div>
  );
};
