/**
 * Нижняя навигация - Tab Bar
 */

'use client';

import { motion } from 'framer-motion';
import { Ticket, Target, Lightbulb, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import type { AppState } from '@/types';

interface TabItem {
  id: AppState['activeTab'];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabItem[] = [
  { id: 'ticket', label: 'Билет', icon: Ticket },
  { id: 'quests', label: 'Задачи', icon: Target },
  { id: 'ideas', label: 'Идеи', icon: Lightbulb },
  { id: 'profile', label: 'Профиль', icon: User },
];

export const BottomTabBar = () => {
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 bg-[#0F0F0F]/95 backdrop-blur-lg border-t border-white/10 safe-area-bottom"
    >
      {/* Индикатор активного таба */}
      <div className="relative flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-colors flex-1',
                isActive ? 'text-white' : 'text-white/40 hover:text-white/60'
              )}
            >
              {/* Фон для активного таба */}
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-white/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              {/* Иконка */}
              <Icon className={cn(
                'w-5 h-5 relative z-10 transition-transform',
                isActive && 'scale-110'
              )} />

              {/* Лейбл */}
              <span className={cn(
                'text-[10px] font-medium relative z-10',
                isActive && 'text-[#007AFF]'
              )}>
                {tab.label}
              </span>

              {/* Активный индикатор */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute -bottom-0.5 w-6 h-0.5 bg-[#007AFF] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};
