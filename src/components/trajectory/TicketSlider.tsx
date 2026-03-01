/**
 * Слайдер билетов - по билету на каждую цель
 */

/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Share2, Download, ArrowRight, Plane, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calcProgressPercent } from '@/lib/progress';
import { TrajectoryButton } from './Button';
import { usePlatform } from '@/hooks/platform';
import type { Goal, UserProfile } from '@/types';

interface TicketSliderProps {
  goals: Goal[];
  user: UserProfile;
  activeGoalId: string | null;
  onSelectGoal: (id: string) => void;
  onShare: (goal: Goal) => void;
  onDownload: (goal: Goal, ref: React.RefObject<HTMLDivElement>) => void;
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
const generateFlightCode = (goal: Goal) => {
  const words = goal.title.split(' ').filter(Boolean);
  const prefix = words[0]?.substring(0, 2).toUpperCase() || 'TR';
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}${number}`;
};

// Компонент одного билета
const TicketSlide = ({ 
  goal, 
  user, 
  isActive,
  ticketRef 
}: { 
  goal: Goal; 
  user: UserProfile; 
  isActive: boolean;
  ticketRef: React.RefObject<HTMLDivElement>;
}) => {
  const flightCode = generateFlightCode(goal);
  const progress = calcProgressPercent(goal.currentValue, goal.targetValue);

  return (
    <div
      ref={ticketRef}
      className="relative w-full max-w-[340px] bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23] rounded-3xl overflow-hidden shadow-2xl flex-shrink-0"
    >
      {/* Декоративные элементы */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#007AFF]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#00C853]/10 rounded-full blur-3xl" />
        {/* Цветная полоска цели */}
        <div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: goal.color }}
        />
      </div>

      {/* Перфорация */}
      <div className="absolute top-[100px] left-0 right-0 h-6 flex items-center">
        <div className="w-4 h-8 bg-[#000] rounded-r-full" />
        <div className="flex-1 border-t-2 border-dashed border-white/10" />
        <div className="w-4 h-8 bg-[#000] rounded-l-full" />
      </div>

      {/* Контент */}
      <div className="relative p-5 space-y-4">
        {/* Верхняя часть - "посадочный талон" */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: goal.color }}
            >
              <Plane className="w-4 h-4 text-white rotate-45" />
            </div>
            <div>
              <div className="text-[9px] text-white/40 uppercase tracking-wider">Рейс</div>
              <div className="text-base font-bold text-white">{flightCode}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-white/40 uppercase tracking-wider">Старт</div>
            <div className="text-xs font-medium text-white">{formatDate(goal.createdAt)}</div>
          </div>
        </div>

        {/* Информация о пассажире */}
        <div className="pt-1">
          <div className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">Пассажир</div>
          <div className="text-lg font-bold text-white">{user.name}</div>
        </div>

        {/* Цель */}
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-[9px] text-white/40 uppercase tracking-wider mb-1">Направление</div>
          <div className="text-base font-semibold text-white mb-2">{goal.title}</div>
          
          {/* Прогресс */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-white/60">Прогресс</span>
              <span className="font-bold" style={{ color: goal.color }}>{progress}%</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8 }}
                className="h-full rounded-full"
                style={{ backgroundColor: goal.color }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-white/40">
              <span>{goal.currentValue.toLocaleString()} {goal.unit}</span>
              <span>{goal.targetValue.toLocaleString()} {goal.unit}</span>
            </div>
          </div>
        </div>

        {/* QR-код placeholder */}
        <div className="flex items-center justify-center pt-1">
          <div className="w-16 h-16 bg-white rounded-lg p-1">
            <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCBmaWxsPSIjMDAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjxyZWN0IGZpbGw9IiNmZmYiIHg9IjEwIiB5PSIxMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIi8+PHJlY3QgZmlsbD0iI2ZmZiIgeD0iNzAiIHk9IjEwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiLz48cmVjdCBmaWxsPSIjZmZmIiB4PSIxMCIgeT0iNzAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIvPjxyZWN0IGZpbGw9IiNmZmYiIHg9IjQwIiB5PSI0MCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIi8+PC9zdmc+')] bg-contain bg-center bg-no-repeat" />
          </div>
        </div>

        {/* Брендинг */}
        <div className="text-center pt-1">
          <div className="text-[9px] text-white/30 uppercase tracking-widest">
            Траектория • Trajectory
          </div>
        </div>
      </div>

      {/* Активный индикатор */}
      {isActive && (
        <div className="absolute top-3 right-3 bg-[#007AFF] text-white text-[10px] font-medium px-2 py-1 rounded-full">
          Активная
        </div>
      )}
    </div>
  );
};

export const TicketSlider = ({
  goals,
  user,
  activeGoalId,
  onSelectGoal,
  onShare,
  onDownload,
  onContinue,
  isGenerating,
}: TicketSliderProps) => {
  const platform = usePlatform();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const ticketRef = useRef<HTMLDivElement>(null);

  // Находим индекс активной цели при загрузке
  useEffect(() => {
    if (activeGoalId && goals.length > 0) {
      const activeIndex = goals.findIndex(g => g.id === activeGoalId);
      if (activeIndex !== -1) {
        setCurrentIndex(activeIndex);
      }
    }
  }, [activeGoalId, goals]);

  const currentGoal = goals[currentIndex];
  const hasMultipleGoals = goals.length > 1;

  // Переход к следующему билету
  const goToNext = useCallback(() => {
    if (currentIndex < goals.length - 1) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, goals.length]);

  // Переход к предыдущему билету
  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  // Обработка свайпа
  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold) {
      goToPrev();
    } else if (info.offset.x < -threshold) {
      goToNext();
    }
  }, [goToPrev, goToNext]);

  // Анимации для слайдов
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  if (goals.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Заголовок */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 text-white/60"
      >
        <Sparkles className="w-4 h-4 text-[#007AFF]" />
        <span className="text-sm font-medium">БИЛЕТА МЕЧТЫ</span>
        <Sparkles className="w-4 h-4 text-[#007AFF]" />
      </motion.div>

      {/* Счётчик */}
      {hasMultipleGoals && (
        <div className="text-sm text-white/40">
          {currentIndex + 1} из {goals.length}
        </div>
      )}

      {/* Слайдер */}
      <div className="relative w-full flex items-center justify-center">
        {/* Кнопка назад */}
        {hasMultipleGoals && currentIndex > 0 && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={goToPrev}
            className="absolute left-0 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </motion.button>
        )}

        {/* Контейнер слайда */}
        <div className="overflow-hidden w-full max-w-[360px] flex justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentGoal?.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="cursor-grab active:cursor-grabbing"
            >
              <TicketSlide
                goal={currentGoal}
                user={user}
                isActive={currentGoal?.id === activeGoalId}
                ticketRef={ticketRef}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Кнопка вперёд */}
        {hasMultipleGoals && currentIndex < goals.length - 1 && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={goToNext}
            className="absolute right-0 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </div>

      {/* Индикаторы (точки) */}
      {hasMultipleGoals && (
        <div className="flex items-center gap-2">
          {goals.map((goal, index) => (
            <button
              key={goal.id}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1);
                setCurrentIndex(index);
              }}
              className={cn(
                'transition-all rounded-full',
                index === currentIndex
                  ? 'w-6 h-2 bg-[#007AFF]'
                  : 'w-2 h-2 bg-white/20 hover:bg-white/40'
              )}
              style={index === currentIndex ? { backgroundColor: goal.color } : {}}
            />
          ))}
        </div>
      )}

      {/* Кнопки действий */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-[340px] space-y-3"
      >
        {platform === 'vk' && (
          <TrajectoryButton
            variant="primary"
            size="lg"
            fullWidth
            icon={<Share2 className="w-5 h-5" />}
            onClick={() => currentGoal && onShare(currentGoal)}
          >
            Поделиться
          </TrajectoryButton>
        )}

        <div className="flex gap-3 mb-8">
          <TrajectoryButton
            variant="secondary"
            size="md"
            fullWidth
            icon={<Download className="w-5 h-5" />}
            onClick={() => currentGoal && onDownload(currentGoal, ticketRef)}
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

        {/* Выбрать активной */}
        {currentGoal && currentGoal.id !== activeGoalId && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => onSelectGoal(currentGoal.id)}
            className="w-full py-2 text-sm text-[#007AFF] hover:text-[#00C853] transition-colors"
          >
            Сделать активной целью
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};
