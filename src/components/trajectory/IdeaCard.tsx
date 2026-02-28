/**
 * Карточка идеи для заработка
 */

'use client';

import { motion } from 'framer-motion';
import { Lightbulb, ArrowRight, TrendingUp, Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrajectoryButton } from './Button';
import type { BusinessIdea } from '@/types';

interface IdeaCardProps {
  idea: BusinessIdea;
  onGenerate: () => void;
  isLoading?: boolean;
}

// Сложность
const difficultyConfig = {
  easy: { label: 'Легко', color: 'text-[#00C853]', stars: 1 },
  medium: { label: 'Средне', color: 'text-yellow-500', stars: 2 },
  hard: { label: 'Сложно', color: 'text-red-500', stars: 3 },
};

// Категории
const categoryLabels = {
  online: 'Онлайн',
  offline: 'Офлайн',
  creative: 'Творчество',
  service: 'Услуги',
};

export const IdeaCard = ({ idea, onGenerate, isLoading }: IdeaCardProps) => {
  const difficulty = difficultyConfig[idea.difficulty];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-3xl p-6 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-white/10"
    >
      {/* Иконка */}
      <div className="absolute -top-4 -right-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#00C853] flex items-center justify-center shadow-lg">
        <Lightbulb className="w-8 h-8 text-white" />
      </div>

      {/* Категория и сложность */}
      <div className="flex items-center gap-3 mb-4">
        <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/60">
          {categoryLabels[idea.category]}
        </span>
        <div className={cn('flex items-center gap-1 text-xs', difficulty.color)}>
          {Array.from({ length: difficulty.stars }).map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-current" />
          ))}
          <span className="ml-1">{difficulty.label}</span>
        </div>
      </div>

      {/* Заголовок */}
      <h3 className="text-xl font-bold text-white mb-2 pr-12">{idea.title}</h3>
      
      {/* Описание */}
      <p className="text-white/60 text-sm mb-4">{idea.description}</p>

      {/* Доход */}
      <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-white/5">
        <TrendingUp className="w-5 h-5 text-[#00C853]" />
        <div>
          <div className="text-[10px] text-white/40 uppercase">Потенциальный доход</div>
          <div className="text-sm font-semibold text-white">{idea.estimatedIncome}</div>
        </div>
      </div>

      {/* Первый шаг */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <ArrowRight className="w-4 h-4 text-[#007AFF]" />
          <span className="text-sm font-medium text-white">Первый шаг:</span>
        </div>
        <p className="text-white/70 text-sm pl-6">{idea.firstStep}</p>
      </div>

      {/* Кнопка */}
      <TrajectoryButton
        variant="secondary"
        size="md"
        fullWidth
        onClick={onGenerate}
        loading={isLoading}
        icon={<Clock className="w-4 h-4" />}
      >
        Другая идея
      </TrajectoryButton>
    </motion.div>
  );
};
