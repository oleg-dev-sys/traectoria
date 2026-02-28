/**
 * Экран Идей - генератор идей для заработка
 */

'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, RefreshCw, Sparkles } from 'lucide-react';
import { IdeaCard } from './IdeaCard';
import { TrajectoryButton } from './Button';
import { calcProgressPercent } from '@/lib/progress';
import { useAppStore, useActiveGoal } from '@/store';
import type { BusinessIdea } from '@/types';

// Mock идеи (будут заменены на API)
const MOCK_IDEAS: BusinessIdea[] = [
  {
    id: '1',
    title: 'Фриланс-консультации',
    description: 'Консультируй людей в своей экспертной области через Zoom или мессенджеры.',
    firstStep: 'Создай профиль на бирже фриланса и опиши свои навыки',
    category: 'online',
    estimatedIncome: '5,000 - 50,000 ₽/мес',
    difficulty: 'easy',
  },
  {
    id: '2',
    title: 'Продажа фото на стоках',
    description: 'Загружай свои фотографии на фотостоки и получай пассивный доход.',
    firstStep: 'Зарегистрируйся на Shutterstock, Adobe Stock или iStock',
    category: 'creative',
    estimatedIncome: '1,000 - 20,000 ₽/мес',
    difficulty: 'easy',
  },
  {
    id: '3',
    title: 'Копирайтинг',
    description: 'Пиши тексты для сайтов, рекламы и соцсетей на заказ.',
    firstStep: 'Найди первые заказы на биржах eTXT или Advego',
    category: 'online',
    estimatedIncome: '10,000 - 100,000 ₽/мес',
    difficulty: 'medium',
  },
  {
    id: '4',
    title: 'Выгул собак',
    description: 'Гуляй с собаками занятых владельцев в своём районе.',
    firstStep: 'Размести объявление на Авито или в местных чатах',
    category: 'offline',
    estimatedIncome: '5,000 - 30,000 ₽/мес',
    difficulty: 'easy',
  },
  {
    id: '5',
    title: 'Репетиторство онлайн',
    description: 'Преподавай школьные предметы или языки через видеосвязь.',
    firstStep: 'Создай профиль на Preply или Profi.ru',
    category: 'service',
    estimatedIncome: '15,000 - 150,000 ₽/мес',
    difficulty: 'medium',
  },
  {
    id: '6',
    title: 'Дропшиппинг',
    description: 'Продавай товары через маркетплейсы без склада.',
    firstStep: 'Изучи спрос на товары на Wildberries или Ozon',
    category: 'online',
    estimatedIncome: '10,000 - 200,000 ₽/мес',
    difficulty: 'hard',
  },
  {
    id: '7',
    title: 'Ведение соцсетей',
    description: 'Управляй аккаунтами компаний в Instagram, VK, Telegram.',
    firstStep: 'Создай портфолио из своих аккаунтов и предложи услуги малому бизнесу',
    category: 'service',
    estimatedIncome: '20,000 - 100,000 ₽/мес',
    difficulty: 'medium',
  },
  {
    id: '8',
    title: 'Создание UGC-контента',
    description: 'Снимай рекламные ролики для брендов в формате "нативного" контента.',
    firstStep: 'Зарегистрируйся на UGC-платформах и создай примеры работ',
    category: 'creative',
    estimatedIncome: '10,000 - 80,000 ₽/мес',
    difficulty: 'medium',
  },
];

// Начальная случайная идея
const getInitialIdea = (): BusinessIdea => {
  return MOCK_IDEAS[Math.floor(Math.random() * MOCK_IDEAS.length)];
};

export const IdeasScreen = () => {
  const user = useAppStore((state) => state.user);
  const activeGoal = useActiveGoal();
  // Инициализируем состояние с начальной идеей
  const [currentIdea, setCurrentIdea] = useState<BusinessIdea>(getInitialIdea);
  const [isLoading, setIsLoading] = useState(false);
  const [usedIds, setUsedIds] = useState<string[]>([]);
  const [viewedCount, setViewedCount] = useState(1);

  // Генерация случайной идеи
  const generateIdea = useCallback(() => {
    setIsLoading(true);

    // Имитация загрузки
    setTimeout(() => {
      const availableIdeas = MOCK_IDEAS.filter((idea) => !usedIds.includes(idea.id));
      
      let newIdea: BusinessIdea;
      if (availableIdeas.length === 0) {
        newIdea = MOCK_IDEAS[Math.floor(Math.random() * MOCK_IDEAS.length)];
        setUsedIds([newIdea.id]);
      } else {
        newIdea = availableIdeas[Math.floor(Math.random() * availableIdeas.length)];
        setUsedIds((prev) => [...prev, newIdea.id]);
      }
      
      setCurrentIdea(newIdea);
      setViewedCount((prev) => prev + 1);
      setIsLoading(false);
    }, 500);
  }, [usedIds]);

  if (!user) return null;

  const progressPercent = activeGoal
    ? calcProgressPercent(activeGoal.currentValue, activeGoal.targetValue)
    : 0;

  // Текст в зависимости от прогресса
  const getMotivationText = () => {
    if (!activeGoal) return 'Выбери цель в профиле!';
    if (progressPercent < 30) return 'Отличный старт! Вот идеи для ускорения.';
    if (progressPercent < 70) return 'Ты уже близко! Немного усилий — и цель достигнута.';
    return 'Финишная прямая! Осталось совсем немного.';
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-6">
      <div className="max-w-lg mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-2"
          >
            <Sparkles className="w-5 h-5 text-[#007AFF]" />
            <h1 className="text-2xl font-bold text-white">Идеи для ресурсов</h1>
          </motion.div>
          <p className="text-white/60">
            Застрял? Вот идеи, как приблизиться к цели
          </p>
        </div>

        {/* Персональное сообщение */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-[#007AFF]/20 to-[#00C853]/20 rounded-2xl p-4 mb-6 border border-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#00C853] flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-white font-medium">
                {user.name}
                {activeGoal && `, ты на ${progressPercent}% к цели!`}
              </div>
              <div className="text-white/60 text-sm">
                {getMotivationText()}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Карточка идеи */}
        {currentIdea && (
          <motion.div
            key={currentIdea.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <IdeaCard
              idea={currentIdea}
              onGenerate={generateIdea}
              isLoading={isLoading}
            />
          </motion.div>
        )}

        {/* Кнопка генерации */}
        {currentIdea && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center"
          >
            <TrajectoryButton
              variant="ghost"
              size="md"
              onClick={generateIdea}
              loading={isLoading}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Показать другую идею
            </TrajectoryButton>
          </motion.div>
        )}

        {/* Счётчик просмотренных */}
        {viewedCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-center text-xs text-white/40"
          >
            Просмотрено идей: {viewedCount} из {MOCK_IDEAS.length}
          </motion.div>
        )}
      </div>
    </div>
  );
};
