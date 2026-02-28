/**
 * Кастомная кнопка для проекта "Траектория"
 * Премиальный минимализм с крупными кнопками
 */

'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrajectoryButtonProps } from '@/types';

const variantStyles = {
  primary: 'bg-[#007AFF] text-white hover:bg-[#0066CC] active:bg-[#0055AA]',
  secondary: 'bg-white/10 text-white hover:bg-white/20 active:bg-white/30 border border-white/20',
  ghost: 'text-white hover:bg-white/10 active:bg-white/20',
};

const sizeStyles = {
  sm: 'h-10 px-4 text-sm rounded-xl',
  md: 'h-12 px-6 text-base rounded-2xl',
  lg: 'h-14 px-8 text-lg rounded-2xl',
};

export const TrajectoryButton = forwardRef<HTMLButtonElement, TrajectoryButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      icon,
      children,
      onClick,
      disabled,
      className,
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        onClick={onClick}
        disabled={disabled || loading}
        whileTap={{ scale: 0.98 }}
        whileHover={{ scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={cn(
          // Базовые стили
          'inline-flex items-center justify-center gap-2 font-semibold',
          'transition-colors duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Варианты
          variantStyles[variant],
          sizeStyles[size],
          // Полная ширина
          fullWidth && 'w-full',
          className
        )}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
          </>
        )}
      </motion.button>
    );
  }
);

TrajectoryButton.displayName = 'TrajectoryButton';
