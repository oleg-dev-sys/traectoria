/**
 * Модальное окно для добавления/редактирования цели
 */

/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Target, DollarSign, MapPin, Dumbbell, GraduationCap, Briefcase, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseGoalInput } from '@/lib/goal-parser';
import { TrajectoryButton } from './Button';
import { GOAL_CATEGORIES, GOAL_COLORS, type GoalCategory, type Goal, type ProgressMode } from '@/types';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: {
    title: string;
    description: string;
    category: GoalCategory;
    targetValue: number;
    currentValue: number;
    unit: string;
    progressMode: ProgressMode;
    color: string;
  }) => void;
  editGoal?: Goal | null;
}

// Иконки категорий
const categoryIcons: Record<GoalCategory, React.ComponentType<{ className?: string }>> = {
  finance: DollarSign,
  travel: MapPin,
  health: Dumbbell,
  education: GraduationCap,
  business: Briefcase,
  other: Sparkles,
};

export const AddGoalModal = ({ isOpen, onClose, onSave, editGoal }: AddGoalModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('other');
  const [targetValue, setTargetValue] = useState('');
  const [currentValue, setCurrentValue] = useState('0');
  const [unit, setUnit] = useState('');
  const [progressMode, setProgressMode] = useState<ProgressMode>('increment');
  const [color, setColor] = useState(GOAL_COLORS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Заполняем форму при редактировании
  useEffect(() => {
    if (editGoal) {
      setTitle(editGoal.title);
      setDescription(editGoal.description || '');
      setCategory(editGoal.category);
      setTargetValue(editGoal.targetValue.toString());
      setCurrentValue(editGoal.currentValue.toString());
      setUnit(editGoal.unit);
      setProgressMode(editGoal.progressMode || 'increment');
      setColor(editGoal.color);
    } else {
      // Сброс для новой цели
      setTitle('');
      setDescription('');
      setCategory('other');
      setTargetValue('');
      setCurrentValue('0');
      setUnit('');
      setProgressMode('increment');
      setColor(GOAL_COLORS[Math.floor(Math.random() * GOAL_COLORS.length)]);
    }
    setErrors({});
  }, [editGoal, isOpen]);

  // Валидация
  const validate = () => {
    const newErrors: Record<string, string> = {};
    const parsedGoal = parseGoalInput(title);
    
    if (!title.trim()) {
      newErrors.title = 'Введите название цели';
    }
    
    const typedTarget = parseFloat(targetValue);
    const target = Number.isFinite(typedTarget) && typedTarget > 0 ? typedTarget : (parsedGoal.targetValue ?? NaN);
    if (isNaN(target) || target <= 0) {
      newErrors.targetValue = 'Укажите число в поле "Цель" или в названии (например: "Отжимания 100 раз")';
    }
    
    const current = parseFloat(currentValue);
    if (isNaN(current) || current < 0) {
      newErrors.currentValue = 'Введите корректный прогресс';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Сохранение
  const handleSave = () => {
    if (!validate()) return;
    const parsedGoal = parseGoalInput(title);
    const typedTarget = parseFloat(targetValue);
    const finalTarget = Number.isFinite(typedTarget) && typedTarget > 0 ? typedTarget : (parsedGoal.targetValue || 1);
    const typedCurrent = parseFloat(currentValue) || 0;
    const finalCurrent = Math.max(0, Math.min(typedCurrent, finalTarget));
    const finalTitle = (parsedGoal.title || title).trim();
    const finalUnit = unit.trim() || parsedGoal.unit || 'шаг';
    const finalProgressMode = progressMode || parsedGoal.progressMode || 'increment';

    onSave({
      title: finalTitle,
      description: description.trim(),
      category,
      targetValue: finalTarget,
      currentValue: finalCurrent,
      unit: finalUnit,
      progressMode: finalProgressMode,
      color,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      >
        {/* Оверлей */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Модальное окно */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#0F0F0F] rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#00C853] flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {editGoal ? 'Редактировать цель' : 'Новая цель'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Форма */}
          <div className="space-y-4">
            {/* Название */}
            <div>
              <label className="block text-sm text-white/60 mb-2">Название цели</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Поездка в Дубай"
                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Описание */}
            <div>
              <label className="block text-sm text-white/60 mb-2">Описание (необязательно)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание цели"
                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
              />
            </div>

            {/* Категория */}
            <div>
              <label className="block text-sm text-white/60 mb-2">Категория</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(GOAL_CATEGORIES) as [GoalCategory, { label: string; icon: string }][]).map(([key, value]) => {
                  const Icon = categoryIcons[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setCategory(key)}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-xl border transition-all',
                        category === key
                          ? 'border-[#007AFF] bg-[#007AFF]/20'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      )}
                    >
                      <Icon className="w-4 h-4 text-white/60" />
                      <span className="text-sm text-white/80">{value.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Значения */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Цель</label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="100000"
                  className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
                />
                {errors.targetValue && <p className="text-red-500 text-sm mt-1">{errors.targetValue}</p>}
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Текущий прогресс</label>
                <input
                  type="number"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  placeholder="0"
                  className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
                />
                {errors.currentValue && <p className="text-red-500 text-sm mt-1">{errors.currentValue}</p>}
              </div>
            </div>

            {/* Единица измерения */}
            <div>
              <label className="block text-sm text-white/60 mb-2">Единица измерения</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="₽, км, кг, шт..."
                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
              />
            </div>

            {/* Режим прогресса */}
            <div>
              <label className="block text-sm text-white/60 mb-2">Как считать результат</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setProgressMode('increment')}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-left transition-all',
                    progressMode === 'increment' ? 'border-[#007AFF] bg-[#007AFF]/20' : 'border-white/10 bg-white/5',
                  )}
                >
                  <div className="text-sm font-medium text-white">Накапливать</div>
                  <div className="text-xs text-white/60">75 + 80 = 155</div>
                </button>
                <button
                  type="button"
                  onClick={() => setProgressMode('absolute')}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-left transition-all',
                    progressMode === 'absolute' ? 'border-[#007AFF] bg-[#007AFF]/20' : 'border-white/10 bg-white/5',
                  )}
                >
                  <div className="text-sm font-medium text-white">Текущее значение</div>
                  <div className="text-xs text-white/60">Всегда как в отчёте</div>
                </button>
                <button
                  type="button"
                  onClick={() => setProgressMode('best')}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-left transition-all',
                    progressMode === 'best' ? 'border-[#007AFF] bg-[#007AFF]/20' : 'border-white/10 bg-white/5',
                  )}
                >
                  <div className="text-sm font-medium text-white">Лучший результат</div>
                  <div className="text-xs text-white/60">max(текущий, новый)</div>
                </button>
              </div>
            </div>

            {/* Цвет */}
            <div>
              <label className="block text-sm text-white/60 mb-2">Цвет</label>
              <div className="flex gap-2 flex-wrap">
                {GOAL_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      'w-8 h-8 rounded-full transition-all',
                      color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0F0F0F]' : ''
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 mt-6">
            <TrajectoryButton
              variant="secondary"
              size="lg"
              fullWidth
              onClick={onClose}
            >
              Отмена
            </TrajectoryButton>
            <TrajectoryButton
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleSave}
              icon={<Plus className="w-5 h-5" />}
            >
              {editGoal ? 'Сохранить' : 'Добавить'}
            </TrajectoryButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
