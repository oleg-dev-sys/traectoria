export interface ParsedGoalInput {
  title: string;
  targetValue: number | null;
  unit: string;
  progressMode: "increment" | "absolute" | "best";
}

const DEFAULT_UNIT = "шаг";
const TRAVEL_UNIT = "поездка";

const MULTIPLIERS: Record<string, number> = {
  "тыс": 1_000,
  "тыс.": 1_000,
  "тысяч": 1_000,
  "к": 1_000,
  "k": 1_000,
  "млн": 1_000_000,
  "млн.": 1_000_000,
  "миллион": 1_000_000,
  "миллиона": 1_000_000,
  "миллионов": 1_000_000,
  "м": 1_000_000,
  "m": 1_000_000,
};

const UNIT_ALIASES: Record<string, string> = {
  "руб": "руб",
  "р": "руб",
  "р.": "руб",
  "руб.": "руб",
  "рубль": "руб",
  "рубля": "руб",
  "рублей": "руб",
  "₽": "руб",
  "раз": "раз",
  "раза": "раз",
  "км": "км",
  "кг": "кг",
  "шаг": "шаг",
  "шага": "шаг",
  "шагов": "шаг",
  "$": "usd",
  "usd": "usd",
  "доллар": "usd",
  "доллара": "usd",
  "долларов": "usd",
  "€": "eur",
  "eur": "eur",
  "евро": "eur",
};

const DIGIT_PATTERN =
  /((?:\d{1,3}(?:[ \u00A0]\d{3})+|\d+)(?:[.,]\d+)?)\s*(тыс\.?|тысяч|к|k|млн\.?|миллион(?:а|ов)?|м|m)?\s*([^\s,.;:!?]+)?/iu;

const NUMBER_WORD_UNITS: Record<string, number> = {
  "ноль": 0,
  "один": 1,
  "одна": 1,
  "одно": 1,
  "два": 2,
  "две": 2,
  "три": 3,
  "четыре": 4,
  "пять": 5,
  "шесть": 6,
  "семь": 7,
  "восемь": 8,
  "девять": 9,
  "десять": 10,
  "одиннадцать": 11,
  "двенадцать": 12,
  "тринадцать": 13,
  "четырнадцать": 14,
  "пятнадцать": 15,
  "шестнадцать": 16,
  "семнадцать": 17,
  "восемнадцать": 18,
  "девятнадцать": 19,
};

const NUMBER_WORD_TENS: Record<string, number> = {
  "двадцать": 20,
  "тридцать": 30,
  "сорок": 40,
  "пятьдесят": 50,
  "шестьдесят": 60,
  "семьдесят": 70,
  "восемьдесят": 80,
  "девяносто": 90,
};

const NUMBER_WORD_HUNDREDS: Record<string, number> = {
  "сто": 100,
  "двести": 200,
  "триста": 300,
  "четыреста": 400,
  "пятьсот": 500,
  "шестьсот": 600,
  "семьсот": 700,
  "восемьсот": 800,
  "девятьсот": 900,
};

const NUMBER_WORD_SCALES: Record<string, number> = {
  "тысяча": 1_000,
  "тысячи": 1_000,
  "тысяч": 1_000,
  "миллион": 1_000_000,
  "миллиона": 1_000_000,
  "миллионов": 1_000_000,
};

const CONNECTORS = new Set(["и"]);

const normalizeToken = (value: string): string =>
  value
    .toLowerCase()
    .replace(/^[^0-9a-zа-яё$€₽]+/iu, "")
    .replace(/[^0-9a-zа-яё$€₽]+$/iu, "");

const levenshteinDistance = (a: string, b: string): number => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const dp: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const temp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }
  return dp[b.length];
};

const resolveUnitToken = (value: string | undefined): string | null => {
  if (!value) return null;
  const key = normalizeToken(value);
  if (!key) return null;
  const exact = UNIT_ALIASES[key];
  if (exact) return exact;

  // Tolerate small typos right after quantity, e.g. "аз" -> "раз".
  let best: { alias: string; distance: number } | null = null;
  for (const alias of Object.keys(UNIT_ALIASES)) {
    const distance = levenshteinDistance(key, alias);
    if (distance > 1) continue;
    if (!best || distance < best.distance) {
      best = { alias, distance };
      if (distance === 0) break;
    }
  }
  return best ? UNIT_ALIASES[best.alias] : null;
};

const normalizeUnitToken = (value: string | undefined): string | null => {
  return resolveUnitToken(value);
};

const normalizeMultiplier = (value: string | undefined): number => {
  if (!value) return 1;
  const key = value.trim().toLowerCase();
  return MULTIPLIERS[key] || 1;
};

const inferUnitByContext = (input: string): string => {
  const text = input.toLowerCase();
  if (/(руб|₽|деньг|сбереж|накоп|капитал|доход)/i.test(text)) return "руб";
  if (/(отжим|подтяг|присед|повтор|раз)/i.test(text)) return "раз";
  if (/(поездк|путешеств|тайланд|дубай|тур|отпуск)/i.test(text)) return TRAVEL_UNIT;
  return DEFAULT_UNIT;
};

const inferProgressMode = (input: string, unit: string): "increment" | "absolute" | "best" => {
  const text = input.toLowerCase();
  if (/(накоп|коплю|сбереж|капитал|доход|выруч|заработ|руб|₽|\$|usd|eur|евро)/i.test(text)) return "increment";
  if (/(отжим|подтяг|присед|повтор|рекорд|максимум|макс|жим|планк)/i.test(text)) return "best";
  if (unit === "раз" || unit === "кг") return "best";
  if (unit === "руб" || unit === "usd" || unit === "eur") return "increment";
  return "absolute";
};

const cleanupTitle = (input: string, start: number, end: number): string => {
  const trimmed = `${input.slice(0, start)} ${input.slice(end)}`
    .replace(/\s+/g, " ")
    .replace(/[,-]\s*$/, "")
    .trim();
  return trimmed || input.trim();
};

const clampTarget = (value: number): number => {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(1_000_000, Math.round(value)));
};

export const parseGoalInput = (rawInput: string): ParsedGoalInput => {
  const input = rawInput.replace(/\u00A0/g, " ").trim();
  if (!input) return { title: "", targetValue: null, unit: DEFAULT_UNIT, progressMode: "absolute" };

  const words = input.split(/\s+/);
  const parseWordNumber = (start: number): { value: number; length: number } | null => {
    let total = 0;
    let current = 0;
    let consumed = 0;
    let sawNumberWord = false;

    for (let i = start; i < words.length; i += 1) {
      const token = normalizeToken(words[i]);
      if (!token) break;

      if (CONNECTORS.has(token) && sawNumberWord) {
        consumed += 1;
        continue;
      }

      if (token in NUMBER_WORD_UNITS) {
        current += NUMBER_WORD_UNITS[token];
        consumed += 1;
        sawNumberWord = true;
        continue;
      }

      if (token in NUMBER_WORD_TENS) {
        current += NUMBER_WORD_TENS[token];
        consumed += 1;
        sawNumberWord = true;
        continue;
      }

      if (token in NUMBER_WORD_HUNDREDS) {
        current += NUMBER_WORD_HUNDREDS[token];
        consumed += 1;
        sawNumberWord = true;
        continue;
      }

      if (token in NUMBER_WORD_SCALES) {
        const scale = NUMBER_WORD_SCALES[token];
        total += (current || 1) * scale;
        current = 0;
        consumed += 1;
        sawNumberWord = true;
        continue;
      }

      break;
    }

    if (!sawNumberWord) return null;
    return { value: total + current, length: consumed };
  };

  const buildTitleFromWords = (removeStart: number, removeEndExclusive: number): string => {
    const nextTitle = words
      .filter((_, idx) => idx < removeStart || idx >= removeEndExclusive)
      .join(" ")
      .replace(/\s+/g, " ")
      .replace(/[,-]\s*$/, "")
      .trim();
    return nextTitle || input;
  };

  const digitMatch = DIGIT_PATTERN.exec(input);
  const valueToken = digitMatch?.[1];
  if (digitMatch && valueToken) {
    const normalizedValue = valueToken.replace(/\s+/g, "").replace(",", ".");
    const base = Number.parseFloat(normalizedValue);
    if (Number.isFinite(base)) {
      const multiplier = normalizeMultiplier(digitMatch[2]);
      const target = clampTarget(base * multiplier);
      const explicitUnit = normalizeUnitToken(digitMatch[3]);
      const inferredUnit = inferUnitByContext(input);
      const unit = explicitUnit || inferredUnit;
      const cleanedTitle = cleanupTitle(input, digitMatch.index, digitMatch.index + digitMatch[0].length);
      let finalTitle = cleanedTitle;
      if (!explicitUnit && digitMatch[3]) {
        const trailingToken = normalizeToken(digitMatch[3]);
        const looksLikeShortNoise = /^[a-zа-яё]{1,2}$/iu.test(trailingToken);
        if (!looksLikeShortNoise) {
          finalTitle = `${cleanedTitle} ${digitMatch[3]}`.replace(/\s+/g, " ").trim();
        }
      }

      return {
        title: finalTitle,
        targetValue: target,
        unit,
        progressMode: inferProgressMode(input, unit),
      };
    }
  }

  for (let idx = 0; idx < words.length; idx += 1) {
    const parsed = parseWordNumber(idx);
    if (!parsed) continue;

    const afterNumberToken = words[idx + parsed.length];
    const explicitUnit = normalizeUnitToken(afterNumberToken);
    const inferredUnit = inferUnitByContext(input);
    const unit = explicitUnit || inferredUnit;
    const removeEnd = explicitUnit ? idx + parsed.length + 1 : idx + parsed.length;
    const title = buildTitleFromWords(idx, removeEnd);

    return {
      title,
      targetValue: clampTarget(parsed.value),
      unit,
      progressMode: inferProgressMode(input, unit),
    };
  }

  const unit = inferUnitByContext(input);
  const target = unit === TRAVEL_UNIT ? 1 : null;
  return { title: input, targetValue: target, unit, progressMode: inferProgressMode(input, unit) };
};
