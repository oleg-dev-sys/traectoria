/**
 * Главный компонент приложения "Траектория"
 * Управляет навигацией и отображением экранов
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import vkBridge from '@vkontakte/vk-bridge';
import { X } from 'lucide-react';
import { OnboardingScreen } from './OnboardingScreen';
import { TicketScreen } from './TicketScreen';
import { QuestsScreen } from './QuestsScreen';
import { IdeasScreen } from './IdeasScreen';
import { ProfileScreen } from './ProfileScreen';
import { BottomTabBar } from './BottomTabBar';
import { useAppStore, checkAndUpdateStreak } from '@/store';
import { usePlatform, useTelegram, usePWA, useShare } from '@/hooks/platform';
import { apiClient } from '@/lib/api-client';
import { calcProgressPercent } from '@/lib/progress';
import { createAchievementShareImage } from '@/lib/achievement-share-image';

// Анимации переходов между экранами
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const toStringValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

const getVKLaunchPayload = async (): Promise<Record<string, string> | null> => {
  try {
    const raw = (await vkBridge.send('VKWebAppGetLaunchParams')) as Record<string, unknown>;
    const payload: Record<string, string> = {};

    for (const [key, value] of Object.entries(raw)) {
      const normalizedValue = toStringValue(value);
      if (!normalizedValue) continue;

      if (key === 'sign') {
        payload.sign = normalizedValue;
        continue;
      }

      if (key.startsWith('vk_')) {
        payload[key] = normalizedValue;
        continue;
      }

      payload[`vk_${key}`] = normalizedValue;
    }

    return Object.keys(payload).length > 0 ? payload : null;
  } catch {
    return null;
  }
};

const buildVKMiniAppLink = (payload: Record<string, string> | null, fallbackUrl: string): string => {
  if (!payload) return fallbackUrl;
  const appId = payload.vk_app_id?.trim();
  const groupId = payload.vk_group_id?.trim();
  if (appId && groupId) return `https://vk.com/app${appId}_${groupId}`;
  if (appId) return `https://vk.com/app${appId}`;
  return fallbackUrl;
};

const getVkErrorMessage = (error: unknown): string => {
  if (!error || typeof error !== 'object') return 'unknown_error';
  const maybe = error as { error_type?: string; error_data?: string; message?: string };
  return maybe.error_type || maybe.error_data || maybe.message || 'unknown_error';
};

export const TrajectoryApp = () => {
  const [isHydrating, setIsHydrating] = useState(true);
  const [isAuthBootstrapping, setIsAuthBootstrapping] = useState(false);
  const isOnboarded = useAppStore((state) => state.isOnboarded);
  const token = useAppStore((state) => state.token);
  const user = useAppStore((state) => state.user);
  const achievementShareGoal = useAppStore((state) => state.achievementShareGoal);
  const dismissAchievementShareGoal = useAppStore((state) => state.dismissAchievementShareGoal);
  const activeTab = useAppStore((state) => state.activeTab);
  const hydrateSession = useAppStore((state) => state.hydrateSession);
  const bootstrapAuth = useAppStore((state) => state.bootstrapAuth);
  const setPlatform = useAppStore((state) => state.setPlatform);
  const platform = usePlatform();
  const { share } = useShare();
  const telegram = useTelegram();
  const { isReady: isTelegramReady, expand } = telegram;
  const { canInstall, install } = usePWA();
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isSharingAchievement, setIsSharingAchievement] = useState(false);
  const achievementCardRef = useRef<HTMLDivElement>(null);
  const authAttemptedRef = useRef(false);
  const isBootstrapLoading = isHydrating || isAuthBootstrapping;


  const buildAbsoluteUrl = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (typeof window === 'undefined') return path;
    return `${window.location.origin}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const renderAchievementCardImage = async (): Promise<{ imageDataUrl: string; publicUrl: string }> => {
    if (!achievementShareGoal) {
      throw new Error('achievement_goal_unavailable');
    }
    const imageDataUrl = createAchievementShareImage({
      userName: user?.name || 'Пользователь',
      goalTitle: achievementShareGoal.title,
      currentValue: achievementShareGoal.currentValue,
      targetValue: achievementShareGoal.targetValue,
      unit: achievementShareGoal.unit,
      progressPercent: calcProgressPercent(
        achievementShareGoal.currentValue,
        achievementShareGoal.targetValue,
      ),
    });
    const uploaded = await apiClient.share.uploadImage(imageDataUrl, 'image/png');
    return { imageDataUrl, publicUrl: buildAbsoluteUrl(uploaded.path) };
  };

  const shareAchievement = async (mode: 'wall' | 'story' | 'default') => {
    if (!achievementShareGoal || isSharingAchievement) return;
    setIsSharingAchievement(true);
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    const vkPayload = platform === 'vk' ? await getVKLaunchPayload() : null;
    const appShareUrl = platform === 'vk' ? buildVKMiniAppLink(vkPayload, url) : url;
    const message = `Мой результат в Траектории: ${achievementShareGoal.title}`;
    let sharedSuccessfully = false;

    try {
      let shareImageDataUrl = '';
      let shareImageUrl = url;
      try {
        const rendered = await renderAchievementCardImage();
        shareImageDataUrl = rendered.imageDataUrl;
        shareImageUrl = rendered.publicUrl;
      } catch (renderError) {
        console.error('[share] achievement image render/upload failed:', renderError);
        shareImageDataUrl = '';
        shareImageUrl = url;
      }

      if (platform === 'vk' && mode === 'wall') {
        try {
          const isSupported = await vkBridge.supportsAsync('VKWebAppShowWallPostBox');
          if (!isSupported) {
            throw new Error('VKWebAppShowWallPostBox_not_supported');
          }

          const hasShareImage = Boolean(shareImageUrl && shareImageUrl !== url);
          if (hasShareImage) {
            try {
              await vkBridge.send('VKWebAppShowWallPostBox', {
                message,
                attachments: appShareUrl,
                upload_attachments: [
                  {
                    type: 'photo',
                    link: shareImageUrl,
                  },
                ],
              });
            } catch (photoErr) {
              console.error('[share] wall photo upload failed, fallback to link post:', getVkErrorMessage(photoErr), photoErr);
              await vkBridge.send('VKWebAppShowWallPostBox', {
                message: `${message}\n${appShareUrl}`,
                attachments: appShareUrl,
              });
            }
          } else {
            try {
              await vkBridge.send('VKWebAppShowWallPostBox', {
                message: `${message}\n${appShareUrl}`,
                attachments: appShareUrl,
              });
            } catch (linkErr) {
              console.error('[share] wall link post failed, fallback to text:', getVkErrorMessage(linkErr), linkErr);
              await vkBridge.send('VKWebAppShowWallPostBox', {
                message: `${message}\n${appShareUrl}`,
              });
            }
          }

          sharedSuccessfully = true;
        } catch (err) {
          console.error('[share] wall failed:', getVkErrorMessage(err), err);
          window.alert('Не удалось открыть публикацию на стене в VK. Попробуй позже.');
        }
      } else if (platform === 'vk' && mode === 'story') {
        try {
          const isSupported = await vkBridge.supportsAsync('VKWebAppShowStoryBox');
          if (!isSupported) {
            throw new Error('VKWebAppShowStoryBox_not_supported');
          }

          await vkBridge.send('VKWebAppShowStoryBox', {
            background_type: shareImageDataUrl || shareImageUrl ? 'image' : 'none',
            ...(shareImageDataUrl
              ? { blob: shareImageDataUrl, locked: true }
              : shareImageUrl
                ? { url: shareImageUrl, locked: true }
                : {}),
            attachment: {
              type: 'url',
              text: 'open',
              url: appShareUrl,
            },
          });
          sharedSuccessfully = true;
        } catch (err) {
          console.error('[share] story failed:', getVkErrorMessage(err), err);
          window.alert('Не удалось открыть публикацию в истории VK. Попробуй позже.');
        }
      } else {
        await share({
          title: 'Мой результат в Траектории',
          text: `Результат: ${achievementShareGoal.title}`,
          url: appShareUrl || shareImageUrl || url,
        });
        sharedSuccessfully = true;
      }
    } finally {
      setIsSharingAchievement(false);
      if (sharedSuccessfully) {
        dismissAchievementShareGoal();
      }
    }
  };

  // Инициализация при загрузке
  useEffect(() => {
    void (async () => {
      setIsHydrating(true);
      try {
        await hydrateSession();
      } finally {
        setIsHydrating(false);
      }
    })();
  }, [hydrateSession]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (telegram.isTelegram && !telegram.isReady) {
      console.log("Waiting for Telegram SDK...");
      return;
    }

    void (async () => {
      let vkPayload = await getVKLaunchPayload();
      
      if (!vkPayload) {
        // Fallback path for environments that still pass params via URL.
        const params = new URLSearchParams(window.location.search);
        const fromQuery: Record<string, string> = {};
        for (const [key, value] of params.entries()) {
          if (key === 'sign' || key.startsWith('vk_')) {
            fromQuery[key] = value;
          }
        }
        vkPayload = Object.keys(fromQuery).length > 0 ? fromQuery : null;
      }

      console.log("Attempting auth for platform:", platform);

      const hasVKAuthParams = !!vkPayload?.vk_user_id && !!vkPayload?.sign;
      const isTelegramEnv = telegram.isTelegram || !!telegram.initData;
      const resolvedPlatform = hasVKAuthParams ? 'vk' : isTelegramEnv ? 'telegram' : 'web';
      setPlatform(resolvedPlatform);

      const isNativeMiniApp = resolvedPlatform === 'vk' || resolvedPlatform === 'telegram';
      const needsAvatarSync = isNativeMiniApp && !user?.avatar;
      if (authAttemptedRef.current || ((isOnboarded || token) && !needsAvatarSync)) {
        setIsAuthBootstrapping(false);
        return;
      }

      if (resolvedPlatform === 'vk' && vkPayload) {
        setIsAuthBootstrapping(true);
        authAttemptedRef.current = true;
        let displayName = `VK ${vkPayload.vk_user_id}`;
        let avatarUrl: string | undefined;
        try {
          await vkBridge.send('VKWebAppInit');
          const userInfo = (await vkBridge.send('VKWebAppGetUserInfo')) as {
            first_name?: string;
            last_name?: string;
            screen_name?: string;
            photo_200?: string;
          };
          avatarUrl = userInfo.photo_200;

          displayName =
            [userInfo.first_name, userInfo.last_name].filter(Boolean).join(' ').trim() ||
            userInfo.screen_name ||
            displayName;
        } catch {
          // fallback to id-based label
        }
        
        await bootstrapAuth({
          platform: 'vk',
          vkPayload,
          displayName,
          avatarUrl,
        });
        return;
      }

      console.log('=== AUTH DEBUG ===');
      console.log('resolvedPlatform:', resolvedPlatform);
      console.log('window.Telegram?.WebApp?.initData:', !!window.Telegram?.WebApp?.initData);
      console.log('authAttemptedRef.current:', authAttemptedRef.current);
      console.log('token:', !!token);
      console.log('isOnboarded:', isOnboarded);
      console.log('=================');

      if (resolvedPlatform === 'telegram' && window.Telegram?.WebApp?.initData) {
          setIsAuthBootstrapping(true);
          authAttemptedRef.current = true;
          const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
          const displayName =
              [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' ').trim() ||
              tgUser?.username ||
              'Telegram User';
          await bootstrapAuth({
              platform: 'telegram',
              telegramInitData: window.Telegram.WebApp.initData,
              displayName,
              avatarUrl: tgUser?.photo_url,
          });
          return;
      }

      setIsAuthBootstrapping(false);
    })().catch((err) => {
      console.error('Platform bootstrap auth failed', err);
      authAttemptedRef.current = false;
    }).finally(() => {
      setIsAuthBootstrapping(false);
    });

  }, [isOnboarded, token, user?.avatar, telegram.initData, telegram.user, bootstrapAuth, setPlatform]);


  useEffect(() => {
    // Проверяем и обновляем streak
    checkAndUpdateStreak();

    // В Telegram расширяем на весь экран
    if (platform === 'telegram' && isTelegramReady) {
      expand();
    }

    // Показываем баннер установки PWA (только для web и не установленного)
    if (platform === 'web' && canInstall) {
      const timer = setTimeout(() => setShowInstallBanner(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [platform, isTelegramReady, expand, canInstall]);

  useEffect(() => {
    if (platform !== 'vk' || !isOnboarded) {
      void vkBridge.send('VKWebAppHideBannerAd').catch(() => {});
      return;
    }

    void (async () => {
      try {
        const isSupported = await vkBridge.supportsAsync('VKWebAppShowBannerAd');
        if (!isSupported) return;

        await vkBridge.send('VKWebAppShowBannerAd', {
          banner_location: 'bottom',
          layout_type: 'resize',
          height_type: 'compact',
        });
      } catch (err) {
        console.error('VK banner ad error:', err);
      }
    })();

    return () => {
      void vkBridge.send('VKWebAppHideBannerAd').catch(() => {});
    };
  }, [platform, isOnboarded]);

  if (isBootstrapLoading) {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center">
        <div className="text-sm text-white/70">Загрузка...</div>
      </div>
    );
  }

  // Рендеринг текущего экрана
  const renderScreen = () => {
    if (!isOnboarded) {
      return <OnboardingScreen />;
    }

    switch (activeTab) {
      case 'ticket':
        return <TicketScreen />;
      case 'quests':
        return <QuestsScreen />;
      case 'ideas':
        return <IdeasScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <TicketScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      {/* Основной контент */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isOnboarded ? activeTab : 'onboarding'}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>

      {/* Нижняя навигация - только после онбординга */}
      {isOnboarded && <BottomTabBar />}

      {/* Модалка достижения цели */}
      <AnimatePresence>
        {achievementShareGoal && platform === 'vk' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <button
              className="absolute inset-0 bg-black/70"
              onClick={dismissAchievementShareGoal}
              aria-label="Закрыть"
            />
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#111] p-6"
            >
              <button
                onClick={dismissAchievementShareGoal}
                className="absolute right-3 top-3 rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white"
                aria-label="Закрыть"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="mb-2 text-xl font-bold text-white">Поделиться результатом</div>
              <p className="mb-1 text-white/80">{achievementShareGoal.title}</p>
              <p className="mb-5 text-sm text-white/60">
                Поделиться результатом?
              </p>
              {platform === 'vk' ? (
                <div className="space-y-2">
                  <button
                    onClick={() => void shareAchievement('story')}
                    disabled={isSharingAchievement}
                    className="h-11 w-full rounded-xl bg-white/10 font-semibold text-white hover:bg-white/20 transition-colors disabled:opacity-60"
                  >
                    В историю
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => void shareAchievement('default')}
                  disabled={isSharingAchievement}
                  className="h-11 w-full rounded-xl bg-[#007AFF] font-semibold text-white hover:bg-[#0068DA] transition-colors disabled:opacity-60"
                >
                  Да
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Скрытый рендер карточки достижения для экспорта в изображение */}
      {achievementShareGoal && (
        <div className="fixed -left-[99999px] top-0 pointer-events-none">
          <div
            ref={achievementCardRef}
            className="w-[720px] bg-[#0F0F0F] p-8 text-white"
          >
            <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23] p-8 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-white/50">Trajectory</div>
                  <div className="text-3xl font-bold">Билет достижения</div>
                </div>
                <div className="rounded-xl bg-white/10 px-3 py-2 text-sm">
                  {new Date().toLocaleDateString('ru-RU')}
                </div>
              </div>
              <div className="rounded-2xl bg-white/5 p-5">
                <div className="text-sm text-white/60">Пассажир</div>
                <div className="mb-3 text-2xl font-semibold">{user?.name || 'Пользователь'}</div>
                <div className="text-sm text-white/60">Текущий результат</div>
                <div className="mb-4 text-2xl font-bold">{achievementShareGoal.title}</div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-white/60">Прогресс</span>
                  <span className="font-semibold">
                    {calcProgressPercent(achievementShareGoal.currentValue, achievementShareGoal.targetValue)}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#007AFF] to-[#00C853]"
                    style={{ width: `${calcProgressPercent(achievementShareGoal.currentValue, achievementShareGoal.targetValue)}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-white/60">
                  <span>{achievementShareGoal.currentValue.toLocaleString()} {achievementShareGoal.unit}</span>
                  <span>{achievementShareGoal.targetValue.toLocaleString()} {achievementShareGoal.unit}</span>
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-[#007AFF]/30 bg-[#007AFF]/15 px-4 py-3 text-lg font-medium">
                Пройди этот квест со мной в Траектории
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Баннер установки PWA */}
      <AnimatePresence>
        {showInstallBanner && !isOnboarded && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#007AFF] to-[#007AFF]/90 safe-area-bottom z-50"
          >
            <div className="flex items-center justify-between max-w-lg mx-auto">
              <div className="flex-1 mr-4">
                <div className="text-sm font-semibold text-white">
                  Установи приложение
                </div>
                <div className="text-xs text-white/80">
                  Быстрый доступ и уведомления
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowInstallBanner(false)}
                  className="px-3 py-2 text-sm text-white/70 hover:text-white"
                >
                  Позже
                </button>
                <button
                  onClick={() => {
                    install();
                    setShowInstallBanner(false);
                  }}
                  className="px-4 py-2 bg-white text-[#007AFF] text-sm font-semibold rounded-lg"
                >
                  Установить
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
