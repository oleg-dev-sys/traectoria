/**
 * Кастомный инпут для проекта "Траектория"
 * Минималистичный дизайн с фокусом на мобильные устройства
 */

'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { TrajectoryInputProps } from '@/types';

export const TrajectoryInput = forwardRef<HTMLInputElement, TrajectoryInputProps>(
  ({ label, placeholder, value, onChange, type = 'text', error, className }, ref) => {
    return (
      <div className={cn('space-y-2', className)}>
        <label className="block text-sm font-medium text-white/70">
          {label}
        </label>
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            // Базовые стили
            'w-full h-14 px-4 text-lg',
            'bg-white/5 border border-white/10 rounded-2xl',
            'text-white placeholder:text-white/40',
            'focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20',
            'transition-all duration-200',
            // Ошибка
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
          )}
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

TrajectoryInput.displayName = 'TrajectoryInput';
