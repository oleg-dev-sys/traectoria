/**
 * Хуки для определения платформы и работы с SDK
 * Поддержка Telegram Mini Apps, VK Mini Apps и Web
 * 
 * Примечание: setState в useEffect используется для определения
 * платформы при первом рендере на клиенте. Это стандартный паттерн
 * для SSR-совместимых React приложений.
 */

/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useCallback } from 'react';
import vkBridge from '@vkontakte/vk-bridge';
import type { Platform } from '@/types';
import { useAppStore } from '@/store';

// ===== КОНСТАНТЫ =====

const DEFAULT_TELEGRAM_THEME = {
  bgColor: '#000000',
  textColor: '#FFFFFF',
  buttonColor: '#007AFF',
  buttonTextColor: '#FFFFFF',
};

// ===== ОПРЕДЕЛЕНИЕ ПЛАТФОРМЫ =====

export const usePlatform = (): Platform => {
  return useAppStore((state) => state.platform);
};

// ===== TELEGRAM SDK =====

interface TelegramTheme {
  bgColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
}

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

const parseTelegramUserFromInitData = (initData: string): TelegramUser | null => {
  try {
    const params = new URLSearchParams(initData);
    const raw = params.get("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TelegramUser;
    return parsed?.id ? parsed : null;
  } catch {
    return null;
  }
};

export const useTelegram = () => {
  const [isReady, setIsReady] = useState(false);
  const [theme, setTheme] = useState<TelegramTheme>(DEFAULT_TELEGRAM_THEME);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState("");

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    // Инициализация
    tg.ready();
    setIsReady(true);
    const rawInitData = tg.initData || "";
    setInitData(rawInitData);
    const unsafeUser = (tg.initDataUnsafe?.user as TelegramUser | undefined) || null;
    setUser(unsafeUser || parseTelegramUserFromInitData(rawInitData));

    // Применяем тему Telegram
    if (tg.themeParams) {
      setTheme({
        bgColor: tg.themeParams.bg_color || '#000000',
        textColor: tg.themeParams.text_color || '#FFFFFF',
        buttonColor: tg.themeParams.button_color || '#007AFF',
        buttonTextColor: tg.themeParams.button_text_color || '#FFFFFF',
      });
    }
  }, []);

  // Расширить на весь экран
  const expand = useCallback(() => {
    window.Telegram?.WebApp?.expand();
  }, []);

  // Закрыть приложение
  const close = useCallback(() => {
    window.Telegram?.WebApp?.close();
  }, []);

  // Поделиться
  const share = useCallback((url: string, text: string) => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
      tg.openTelegramLink(shareUrl);
    } else if (navigator.share) {
      navigator.share({ url, text });
    }
  }, []);

  // Открыть ссылку
  const openLink = useCallback((url: string) => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  }, []);

  return {
    isReady,
    isTelegram: typeof window !== 'undefined' && !!window.Telegram?.WebApp,
    theme,
    user,
    initData,
    expand,
    close,
    share,
    openLink,
  };
}

// ===== VK BRIDGE =====

export const useVK = () => {
  const isVKLaunch = useAppStore((state) => state.platform === 'vk');

  // Поделиться
  const share = useCallback(async (link: string) => {
    if (isVKLaunch) {
      try {
        await vkBridge.send('VKWebAppShare', { link });
        return;
      } catch (err) {
        console.error('VK share error:', err);
      }
    }

    if (navigator.share) {
      await navigator.share({ url: link });
    }
  }, [isVKLaunch]);

  return {
    isVK: isVKLaunch,
    share,
  };
}

// ===== PWA =====

export const usePWA = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Проверяем, установлено ли приложение
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone);
    };

    checkInstalled();

    // Слушаем событие beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Слушаем изменения display-mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      mediaQuery.removeEventListener('change', checkInstalled);
    };
  }, []);

  // Установка PWA
  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    (deferredPrompt as unknown as { prompt: () => void }).prompt();

    const result = await (deferredPrompt as unknown as { userChoice: Promise<{ outcome: string }> }).userChoice;
    
    if (result.outcome === 'accepted') {
      setCanInstall(false);
      return true;
    }

    return false;
  }, [deferredPrompt]);

  return {
    isInstalled,
    canInstall,
    install,
  };
}

// ===== УНИВЕРСАЛЬНЫЙ ШЕРИНГ =====

export const useShare = () => {
  const platform = usePlatform();
  const telegram = useTelegram();
  const vk = useVK();

  const share = useCallback(async (data: { title: string; text: string; url: string }) => {
    const { title, text, url } = data;

    // Telegram
    if (platform === 'telegram') {
      telegram.share(url, `${title}\n${text}`);
      return true;
    }

    // VK
    if (platform === 'vk') {
      await vk.share(url);
      return true;
    }

    // Web Share API
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return true;
      } catch {
        return false;
      }
    }

    // Fallback - копирование в буфер обмена
    try {
      await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
      return true;
    } catch {
      return false;
    }
  }, [platform, telegram, vk]);

  return { share };
}
