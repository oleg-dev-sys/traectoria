/**
 * Анимированный прогресс-бар для проекта "Траектория"
 * Плавное заполнение с визуальным эффектом
 */

'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { calcProgressPercent } from '@/lib/progress';
import type { ProgressBarProps } from '@/types';

export const ProgressBar = ({
  current,
  target,
  label,
  showPercentage = true,
  animated = true,
  className,
}: ProgressBarProps) => {
  // Вычисляем процент
  const percentage = useMemo(() => {
    return calcProgressPercent(current, target);
  }, [current, target]);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Заголовок и процент */}
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-sm">
          {label && <span className="text-white/70">{label}</span>}
          {showPercentage && (
            <motion.span
              key={percentage}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-semibold text-[#00C853]"
            >
              {percentage}%
            </motion.span>
          )}
        </div>
      )}

      {/* Контейнер прогресс-бара */}
      <div className="relative h-4 bg-white/10 rounded-full overflow-hidden">
        {/* Фоновый градиент для блеска */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        
        {/* Заполнение */}
        <motion.div
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${percentage}%` }}
          transition={{ 
            duration: 0.8, 
            ease: [0.22, 1, 0.36, 1],
            delay: 0.1 
          }}
          className="relative h-full bg-gradient-to-r from-[#007AFF] to-[#00C853] rounded-full"
        >
          {/* Блики */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-50" />
          
          {/* Анимированный блеск */}
          <motion.div
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
        </motion.div>
      </div>

      {/* Значения */}
      <div className="flex justify-between items-center text-xs text-white/50">
        <span>{current.toLocaleString()}</span>
        <span>{target.toLocaleString()}</span>
      </div>
    </div>
  );
};
