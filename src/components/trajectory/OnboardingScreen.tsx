/**
 * Экран онбординга - первый запуск приложения
 * Быстрая регистрация с созданием первой цели
 */

'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Rocket, Target, Wallet, Sparkles, Send } from 'lucide-react';
import { TrajectoryButton } from './Button';
import { useAppStore } from '@/store';
import { usePlatform, useTelegram } from '@/hooks/platform';
import { parseGoalInput } from '@/lib/goal-parser';

declare global {
  interface Window {
    VKIDSDK?: {
      Config: {
        init: (opts: {
          app: number;
          redirectUrl: string;
          responseMode: unknown;
          source: unknown;
          scope?: string;
        }) => void;
      };
      ConfigResponseMode: { Callback: unknown };
      ConfigSource: { LOWCODE: unknown };
      OneTap: new () => {
        render: (opts: { container: HTMLElement; showAlternativeLogin: boolean }) => {
          on: (event: unknown, callback: (payload: Record<string, unknown>) => unknown) => unknown;
        };
      };
      WidgetEvents: { ERROR: unknown };
      OneTapInternalEvents: { LOGIN_SUCCESS: unknown };
      Auth: {
        exchangeCode: (code: string, deviceId: string) => Promise<Record<string, unknown>>;
        userInfo: (accessToken: string) => Promise<Record<string, unknown>>;
      };
    };
    onTelegramAuth?: (user: Record<string, unknown>) => void;
  }
}

const WEB_STEPS = [
  {
    id: 'login',
    title: 'Вход в Траекторию',
    subtitle: 'Войдите через Telegram или VK',
    placeholder: 'Ваше имя',
    icon: LogIn,
  },
  {
    id: 'goal',
    title: 'Твоя первая цель?',
    subtitle: 'К чему стремишься? (Дубай, Капитал, Форма...)',
    placeholder: 'Например: Поездка в Дубай',
    icon: Target,
  },
  {
    id: 'progress',
    title: 'Текущий прогресс',
    subtitle: 'Сколько уже накоплено / достигнуто?',
    placeholder: '0',
    icon: Wallet,
  },
];

const MINI_APP_STEPS = [
  {
    id: 'name',
    title: 'Как тебя зовут?',
    subtitle: 'Представься, чтобы мы могли начать',
    placeholder: 'Твоё имя',
    icon: Rocket,
  },
  {
    id: 'goal',
    title: 'Твоя первая цель?',
    subtitle: 'К чему стремишься? (Дубай, Капитал, Форма...)',
    placeholder: 'Например: Поездка в Дубай',
    icon: Target,
  },
  {
    id: 'progress',
    title: 'Текущий прогресс',
    subtitle: 'Сколько уже накоплено / достигнуто?',
    placeholder: '0',
    icon: Wallet,
  },
];

export const OnboardingScreen = () => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [progress, setProgress] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const tgContainerRef = useRef<HTMLDivElement | null>(null);
  const tgWidgetMountedRef = useRef(false);
  const vkContainerRef = useRef<HTMLDivElement | null>(null);
  const vkWidgetMountedRef = useRef(false);
  const [isVKScriptReady, setIsVKScriptReady] = useState(false);

  const user = useAppStore((state) => state.user);
  const onboard = useAppStore((state) => state.onboard);
  const bootstrapAuth = useAppStore((state) => state.bootstrapAuth);
  const token = useAppStore((state) => state.token);
  const platform = usePlatform();
  const telegram = useTelegram();
  const isWeb = platform === 'web' && !telegram.initData;
  const steps = useMemo(() => (isWeb ? WEB_STEPS : MINI_APP_STEPS), [isWeb]);
  const telegramName =
    [telegram.user?.first_name, telegram.user?.last_name].filter(Boolean).join(' ').trim() ||
    telegram.user?.username ||
    '';
  const vkName = platform === 'vk' && user?.name && user.name !== 'Пользователь' ? user.name : '';
  const profileName = user?.name && user.name !== 'Пользователь' ? user.name : '';
  const effectiveName = isWeb ? name || profileName || telegramName || vkName : name || telegramName || vkName;
  const currentStep = steps[step];
  const currentStepId = currentStep?.id;
  const telegramBotUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '';
  const vkAppId = process.env.NEXT_PUBLIC_VK_APP_ID || '';

  useEffect(() => {
    if (isWeb && token && step === 0) {
      setStep(1);
    }
  }, [isWeb, token, step]);

  useEffect(() => {
    if (!isWeb || currentStepId !== 'login' || tgWidgetMountedRef.current || typeof window === 'undefined') return;
    if (!telegramBotUsername) {
      setErrors((prev) => ({ ...prev, name: 'Telegram login не настроен (NEXT_PUBLIC_TELEGRAM_BOT_USERNAME)' }));
      return;
    }
    if (!tgContainerRef.current) return;

    const normalizePayload = (payload: Record<string, unknown>): Record<string, string | number> => {
      const result: Record<string, string | number> = {};
      for (const [key, value] of Object.entries(payload)) {
        if (typeof value === 'string' || typeof value === 'number') {
          result[key] = value;
        }
      }
      return result;
    };

    window.onTelegramAuth = (user) => {
      const payload = normalizePayload(user);
      const firstName = String(payload.first_name ?? '').trim();
      const lastName = String(payload.last_name ?? '').trim();
      const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || String(payload.username ?? '').trim();
      const avatarUrl = String(payload.photo_url ?? '').trim() || undefined;

      setIsSubmitting(true);
      void bootstrapAuth({
        platform: 'telegram',
        telegramWidgetPayload: payload,
        displayName: displayName || 'Telegram User',
        avatarUrl,
      })
        .catch(() => {
          setErrors((prev) => ({ ...prev, name: 'Не удалось завершить вход через Telegram' }));
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    };

    tgContainerRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', telegramBotUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    tgContainerRef.current.appendChild(script);
    tgWidgetMountedRef.current = true;

    return () => {
      if (window.onTelegramAuth) {
        delete window.onTelegramAuth;
      }
    };
  }, [isWeb, currentStepId, telegramBotUsername, bootstrapAuth]);

  useEffect(() => {
    if (!isWeb || currentStepId !== 'login' || typeof window === 'undefined') return;
    if (window.VKIDSDK) {
      setIsVKScriptReady(true);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-vkid-sdk="1"]');
    if (existing) {
      existing.addEventListener('load', () => setIsVKScriptReady(true), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js';
    script.async = true;
    script.dataset.vkidSdk = '1';
    script.onload = () => setIsVKScriptReady(true);
    script.onerror = () => setErrors({ name: 'Не удалось загрузить VK ID SDK' });
    document.head.appendChild(script);
  }, [isWeb, currentStepId]);

  useEffect(() => {
    if (!isWeb || currentStepId !== 'login' || !isVKScriptReady || vkWidgetMountedRef.current) return;
    if (!vkAppId || typeof window === 'undefined') {
      setErrors({ name: 'VK login не настроен (NEXT_PUBLIC_VK_APP_ID)' });
      return;
    }
    const VKID = window.VKIDSDK;
    if (!VKID || !vkContainerRef.current) return;

    vkWidgetMountedRef.current = true;
    const redirectUrl = window.location.origin;

    const extractUserId = (obj: Record<string, unknown>): string => {
      const direct = obj.user_id ?? obj.userId;
      if (direct) return String(direct);
      const nested = obj.user as Record<string, unknown> | undefined;
      if (!nested) return '';
      return String(nested.user_id ?? nested.userId ?? nested.id ?? '');
    };

    const extractDisplayName = (obj: Record<string, unknown>): string => {
      const nested = obj.user as Record<string, unknown> | undefined;
      if (!nested) return '';
      const first = String(nested.first_name ?? nested.firstName ?? '').trim();
      const last = String(nested.last_name ?? nested.lastName ?? '').trim();
      return [first, last].filter(Boolean).join(' ').trim();
    };

    VKID.Config.init({
      app: Number(vkAppId),
      redirectUrl,
      responseMode: VKID.ConfigResponseMode.Callback,
      source: VKID.ConfigSource.LOWCODE,
      scope: '',
    });

    const oneTap = new VKID.OneTap();
    oneTap
      .render({
        container: vkContainerRef.current,
        showAlternativeLogin: true,
      })
      .on(VKID.WidgetEvents.ERROR, () => {
        setErrors({ name: 'Ошибка VK авторизации' });
      })
      .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, (payload) => {
        const code = String(payload.code ?? '');
        const deviceId = String(payload.device_id ?? payload.deviceId ?? '');
        if (!code || !deviceId) {
          setErrors({ name: 'Некорректный ответ VK авторизации' });
          return;
        }

        setIsSubmitting(true);
        void VKID.Auth.exchangeCode(code, deviceId)
          .then(async (tokenData) => {
            const accessToken = String(tokenData.access_token ?? tokenData.accessToken ?? '');
            if (!accessToken) {
              throw new Error('vk_access_token_missing');
            }

            let userId = extractUserId(tokenData);
            let displayName = extractDisplayName(tokenData);
            if (!userId || !displayName) {
              const userInfo = await VKID.Auth.userInfo(accessToken);
              if (!userId) userId = extractUserId(userInfo);
              if (!displayName) displayName = extractDisplayName(userInfo);
            }

            if (!userId) {
              throw new Error('vk_user_id_missing');
            }

            await bootstrapAuth({
              platform: 'vk',
              vkPayload: {
                access_token: accessToken,
                user_id: userId,
              },
              displayName: displayName || `VK ${userId}`,
            });
          })
          .catch(() => {
            setErrors({ name: 'Не удалось завершить вход через VK' });
          })
          .finally(() => {
            setIsSubmitting(false);
          });
      });
  }, [isWeb, currentStepId, isVKScriptReady, vkAppId, bootstrapAuth]);

  // Валидация текущего шага
  const validateStep = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (currentStepId === 'name' && !effectiveName.trim()) {
      newErrors.name = 'Введите ваше имя';
    }
    if (currentStepId === 'goal' && !goalTitle.trim()) {
      newErrors.goal = 'Введите вашу цель';
    }
    if (currentStepId === 'progress') {
      const progressValue = parseFloat(progress);
      if (isNaN(progressValue) || progressValue < 0) {
        newErrors.progress = 'Введите корректное число';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStepId, effectiveName, goalTitle, progress]);

  // Переход к следующему шагу
  const handleNext = useCallback(async () => {
    if (isSubmitting || !validateStep()) return;

    setIsSubmitting(true);
    try {
      if (isWeb && currentStepId === 'login') {
        return;
      }

      if (step < steps.length - 1) {
        setStep((prev) => prev + 1);
        return;
      }

      const progressValue = parseFloat(progress) || 0;
      const parsedGoal = parseGoalInput(goalTitle);
      const safeDisplayName = effectiveName.trim() || profileName || telegramName || vkName || 'Пользователь';
      await onboard(safeDisplayName, parsedGoal.title || goalTitle.trim(), progressValue, {
        platform: telegram.initData ? 'telegram' : platform === 'vk' ? 'vk' : 'web',
        telegramInitData: telegram.initData || undefined,
        goalTargetValue: parsedGoal.targetValue ?? undefined,
        goalUnit: parsedGoal.unit,
        goalProgressMode: parsedGoal.progressMode,
      });
      console.log('Platform in Onboarding: ' + platform)
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    validateStep,
    isWeb,
    currentStepId,
    effectiveName,
    steps.length,
    step,
    progress,
    goalTitle,
    onboard,
    platform,
    telegram.initData,
  ]);

  const Icon = currentStep.icon;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Прогресс шагов */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((_, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`w-2 h-2 rounded-full transition-colors ${
              index <= step ? 'bg-[#007AFF]' : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Иконка */}
      <motion.div
        key={`icon-${step}`}
        initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#007AFF] to-[#00C853] flex items-center justify-center mb-6 shadow-lg shadow-[#007AFF]/30"
      >
        <Icon className="w-10 h-10 text-white" />
      </motion.div>

      {/* Заголовок */}
      <motion.h1
        key={`title-${step}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-white text-center mb-2"
      >
        {currentStep.title}
      </motion.h1>

      <motion.p
        key={`subtitle-${step}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-white/60 text-center mb-8"
      >
        {currentStep.subtitle}
      </motion.p>

      {/* Инпут / кнопки входа */}
      <motion.div
        key={`input-${step}`}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-sm mb-8"
      >
        {isWeb && currentStepId === 'login' ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
              <div className="mb-2 text-xs text-white/60 flex items-center gap-2">
                <Send className="w-4 h-4" />
                Войти через Telegram
              </div>
              <div ref={tgContainerRef} />
            </div>
            <div className={isSubmitting ? 'opacity-60 pointer-events-none' : ''}>
              <div ref={vkContainerRef} />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type={currentStepId === 'progress' ? 'number' : 'text'}
              value={currentStepId === 'name' ? effectiveName : currentStepId === 'goal' ? goalTitle : progress}
              onChange={(e) => {
                const value = e.target.value;
                if (currentStepId === 'name') setName(value);
                else if (currentStepId === 'goal') setGoalTitle(value);
                else setProgress(value);
              }}
              placeholder={currentStep.placeholder}
              className="w-full h-14 px-4 text-lg bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/40 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
            />
            {errors[currentStepId === 'progress' ? 'progress' : currentStepId === 'goal' ? 'goal' : 'name'] && (
              <p className="text-red-500 text-sm">
                {errors[currentStepId === 'progress' ? 'progress' : currentStepId === 'goal' ? 'goal' : 'name']}
              </p>
            )}
          </div>
        )}
      </motion.div>

      {/* Кнопка */}
      {!(isWeb && currentStepId === 'login') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-sm"
        >
          <TrajectoryButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleNext}
            disabled={isSubmitting}
          >
            {step === steps.length - 1 ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Создать профиль
              </span>
            ) : (
              'Далее'
            )}
          </TrajectoryButton>
        </motion.div>
      )}

      {/* Пропустить (только на шаге цели) */}
      {currentStepId === 'goal' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={() => {
            setGoalTitle('Моя первая цель');
            setStep(2);
          }}
          className="mt-4 text-sm text-white/40 hover:text-white/60 transition-colors"
        >
          Пропустить
        </motion.button>
      )}
    </div>
  );
};
