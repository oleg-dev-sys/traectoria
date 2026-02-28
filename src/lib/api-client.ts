const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

class ApiClientError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, method: HttpMethod, body?: unknown, token?: string): Promise<T> {
  const isLocalHost = (host: string) => host === "localhost" || host === "127.0.0.1";
  const resolveBase = () => {
    const configured = API_BASE_URL.trim();
    if (!configured) return "/api";
    if (typeof window === "undefined") return configured;

    const pageHost = window.location.hostname;
    const configHost = configured.startsWith("http")
      ? (() => {
          try {
            return new URL(configured).hostname;
          } catch {
            return "";
          }
        })()
      : "";

    // Safety fallback for Mini Apps / remote domains when old build still has localhost base URL.
    if (configHost && isLocalHost(configHost) && !isLocalHost(pageHost)) {
      return "/api";
    }
    return configured;
  };

  const base = resolveBase().replace(/\/+$/, "");
  const normalizedPath =
    base.endsWith("/api") && path.startsWith("/api/")
      ? path.slice(4)
      : path;
  const url = base ? `${base}${normalizedPath}` : normalizedPath;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json?.error?.message || "Request failed";
    const code = json?.error?.code || "request_failed";
    throw new ApiClientError(message, res.status, code);
  }
  return json as T;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface MeResponse {
  id: number;
  platform: string;
  platform_user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  total_points: number;
  quests_completed: number;
  streak_days: number;
}

export interface GoalResponse {
  id: number;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  unit: string;
  progress_mode: "increment" | "absolute" | "best";
  category: "finance" | "travel" | "health" | "education" | "business" | "other";
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuestTodayResponse {
  id: number;
  goal_id: number | null;
  quest_date: string;
  title: string;
  description: string | null;
  reward_points: number;
}

export interface QuestHistoryResponse {
  id: number;
  quest_id: number;
  points_awarded: number;
  completed_at: string;
}

export interface ShareImageUploadResponse {
  image_id: string;
  path: string;
}

export const apiClient = {
  authVK: (payload: Record<string, string>, displayName?: string, avatarUrl?: string) =>
    request<AuthResponse>("/api/auth/platform", "POST", {
      platform: "vk",
      payload,
      display_name: displayName,
      avatar_url: avatarUrl,
    }),
  authWeb: (displayName: string, avatarUrl?: string) =>
    request<AuthResponse>("/api/auth/platform", "POST", {
      platform: "web",
      payload: { web_user_id: displayName.trim().toLowerCase().replace(/\s+/g, "-") || "web-user" },
      display_name: displayName,
      avatar_url: avatarUrl,
    }),
  authTelegram: (initData: string, displayName: string, avatarUrl?: string) =>
    request<AuthResponse>("/api/auth/platform", "POST", {
      platform: "telegram",
      payload: initData,
      display_name: displayName,
      avatar_url: avatarUrl,
    }),
  authTelegramWidget: (
    payload: Record<string, string | number>,
    displayName?: string,
    avatarUrl?: string,
  ) =>
    request<AuthResponse>("/api/auth/platform", "POST", {
      platform: "telegram",
      payload,
      display_name: displayName,
      avatar_url: avatarUrl,
    }),
  onboarding: (
    token: string,
    payload: {
      display_name: string;
      goal_title?: string;
      goal_target_value?: number;
      goal_current_value?: number;
      goal_unit?: string;
      goal_progress_mode?: "increment" | "absolute" | "best";
    },
  ) =>
    request<MeResponse>("/api/onboarding", "POST", payload, token),
  me: (token: string) => request<MeResponse>("/api/me", "GET", undefined, token),
  goals: {
    list: (token: string) => request<GoalResponse[]>("/api/goals", "GET", undefined, token),
    create: (
      token: string,
      payload: {
        title: string;
        description?: string;
        target_value: number;
        current_value: number;
        unit?: string;
        progress_mode?: "increment" | "absolute" | "best";
        category?: "finance" | "travel" | "health" | "education" | "business" | "other";
        color?: string;
      },
    ) => request<GoalResponse>("/api/goals", "POST", payload, token),
    update: (
      token: string,
      goalId: number,
      payload: {
        title?: string;
        description?: string;
        target_value?: number;
        current_value?: number;
        unit?: string;
        progress_mode?: "increment" | "absolute" | "best";
        category?: "finance" | "travel" | "health" | "education" | "business" | "other";
        color?: string;
        is_active?: boolean;
      },
    ) => request<GoalResponse>(`/api/goals/${goalId}`, "PATCH", payload, token),
    remove: (token: string, goalId: number) => request<{ ok: boolean }>(`/api/goals/${goalId}`, "DELETE", undefined, token),
  },
  quests: {
    today: (token: string) => request<QuestTodayResponse[]>("/api/quests/today", "GET", undefined, token),
    complete: (token: string, questId: number, resultValue?: number) =>
      request<QuestHistoryResponse>(
        "/api/quests/complete",
        "POST",
        {
          quest_id: questId,
          ...(typeof resultValue === "number" ? { result_value: resultValue } : {}),
        },
        token,
      ),
    history: (token: string) => request<QuestHistoryResponse[]>("/api/quests/history", "GET", undefined, token),
  },
  share: {
    uploadImage: (imageBase64: string, mimeType = "image/png") =>
      request<ShareImageUploadResponse>("/api/share/images", "POST", {
        image_base64: imageBase64,
        mime_type: mimeType,
      }),
  },
};

export { ApiClientError };
