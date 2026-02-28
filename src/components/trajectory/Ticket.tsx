/**
 * Билет Мечты - виральный компонент проекта "Траектория"
 * Стильная карточка в виде посадочного талона
 */

'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Share2, ArrowRight, Plane, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calcProgressPercent } from '@/lib/progress';
import { TrajectoryButton } from './Button';
import type { UserProfile } from '@/types';

interface TicketComponentProps {
  user: UserProfile;
  onShare: () => void;
  onDownload: () => void;
  onContinue: () => void;
  isGenerating?: boolean;
}

// Форматирование даты
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase();
};

// Генерация "рейса" на основе цели
const generateFlightCode = (goal: string) => {
  const words = goal.split(' ').filter(Boolean);
  const prefix = words[0]?.substring(0, 2).toUpperCase() || 'TR';
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}${number}`;
};

export const TicketComponent = forwardRef<HTMLDivElement, TicketComponentProps>(
  ({ user, onShare, onDownload, onContinue, isGenerating }, ref) => {
    const flightCode = generateFlightCode(user.goal);
    const progress = calcProgressPercent(user.currentValue, user.targetValue);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6"
      >
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 text-white/60"
        >
          <Sparkles className="w-4 h-4 text-[#007AFF]" />
          <span className="text-sm font-medium">ТВОЙ БИЛЕТ МЕЧТЫ</span>
          <Sparkles className="w-4 h-4 text-[#007AFF]" />
        </motion.div>

        {/* Карточка билета */}
        <div
          ref={ref}
          className="relative w-full max-w-[340px] bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23] rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Декоративные элементы */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#007AFF]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#00C853]/10 rounded-full blur-3xl" />
          </div>

          {/* Перфорация */}
          <div className="absolute top-[120px] left-0 right-0 h-6 flex items-center">
            <div className="w-4 h-8 bg-[#000] rounded-r-full" />
            <div className="flex-1 border-t-2 border-dashed border-white/10" />
            <div className="w-4 h-8 bg-[#000] rounded-l-full" />
          </div>

          {/* Контент */}
          <div className="relative p-6 space-y-6">
            {/* Верхняя часть - "посадочный талон" */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#00C853] flex items-center justify-center">
                  <Plane className="w-5 h-5 text-white rotate-45" />
                </div>
                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">Рейс</div>
                  <div className="text-lg font-bold text-white">{flightCode}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-white/40 uppercase tracking-wider">Дата старта</div>
                <div className="text-sm font-medium text-white">{formatDate(user.createdAt)}</div>
              </div>
            </div>

            {/* Информация о пассажире */}
            <div className="pt-2">
              <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Пассажир</div>
              <div className="text-xl font-bold text-white">{user.name}</div>
            </div>

            {/* Цель */}
            <div className="bg-white/5 rounded-2xl p-4">
              <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Направление</div>
              <div className="text-lg font-semibold text-white mb-3">{user.goal}</div>
              
              {/* Прогресс */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Прогресс</span>
                  <span className="font-bold text-[#00C853]">{progress}%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-[#007AFF] to-[#00C853] rounded-full"
                  />
                </div>
                <div className="flex justify-between text-xs text-white/40">
                  <span>{user.currentValue.toLocaleString()}</span>
                  <span>{user.targetValue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* QR-код placeholder */}
            <div className="flex items-center justify-center pt-2">
              <div className="w-20 h-20 bg-white rounded-lg p-1">
                <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCBmaWxsPSIjMDAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjxyZWN0IGZpbGw9IiNmZmYiIHg9IjEwIiB5PSIxMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIi8+PHJlY3QgZmlsbD0iI2ZmZiIgeD0iNzAiIHk9IjEwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiLz48cmVjdCBmaWxsPSIjZmZmIiB4PSIxMCIgeT0iNzAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIvPjxyZWN0IGZpbGw9IiNmZmYiIHg9IjQwIiB5PSI0MCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIi8+PC9zdmc+')] bg-contain bg-center bg-no-repeat" />
              </div>
            </div>

            {/* Брендинг */}
            <div className="text-center pt-2">
              <div className="text-[10px] text-white/30 uppercase tracking-widest">
                Траектория • Trajectory
              </div>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-[340px] space-y-3"
        >
          <TrajectoryButton
            variant="primary"
            size="lg"
            fullWidth
            icon={<Share2 className="w-5 h-5" />}
            onClick={onShare}
          >
            Поделиться
          </TrajectoryButton>

          <div className="flex gap-3">
            <TrajectoryButton
              variant="secondary"
              size="md"
              fullWidth
              icon={<Download className="w-5 h-5" />}
              onClick={onDownload}
              loading={isGenerating}
            >
              Скачать
            </TrajectoryButton>

            <TrajectoryButton
              variant="ghost"
              size="md"
              fullWidth
              icon={<ArrowRight className="w-5 h-5" />}
              onClick={onContinue}
            >
              К задачам
            </TrajectoryButton>
          </div>
        </motion.div>
      </motion.div>
    );
  }
);

TicketComponent.displayName = 'TicketComponent';
