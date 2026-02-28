export interface AchievementShareImagePayload {
  userName: string;
  goalTitle: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  progressPercent: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] => {
  const normalized = (text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return ['-'];

  const words = normalized.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
      current = word;
    } else {
      lines.push(word);
      current = '';
    }

    if (lines.length >= maxLines) break;
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  if (lines.length > maxLines) {
    lines.length = maxLines;
  }

  if (lines.length === maxLines && words.join(' ') !== lines.join(' ')) {
    const last = lines[maxLines - 1] || '';
    const ellipsis = '...';
    let truncated = last;
    while (truncated.length > 0 && ctx.measureText(`${truncated}${ellipsis}`).width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    lines[maxLines - 1] = `${truncated}${ellipsis}`;
  }

  return lines;
};

export const createAchievementShareImage = (payload: AchievementShareImagePayload): string => {
  const width = 1080;
  const height = 1350;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('canvas_context_unavailable');
  }

  const progress = clamp(Math.round(payload.progressPercent || 0), 0, 100);
  const date = new Date().toLocaleDateString('ru-RU');

  ctx.fillStyle = '#0F0F0F';
  ctx.fillRect(0, 0, width, height);

  const cardX = 80;
  const cardY = 80;
  const cardW = width - 160;
  const cardH = height - 160;
  const cardRadius = 44;

  const gradient = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(0.52, '#16213e');
  gradient.addColorStop(1, '#0f0f23');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cardX + 1, cardY + 1, cardW - 2, cardH - 2, cardRadius - 1);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.60)';
  ctx.font = '500 28px Arial';
  ctx.fillText('TRAJECTORY', cardX + 56, cardY + 84);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 64px Arial';
  ctx.fillText('Билет достижения', cardX + 56, cardY + 162);

  const dateW = 220;
  const dateH = 64;
  const dateX = cardX + cardW - dateW - 56;
  const dateY = cardY + 58;
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.beginPath();
  ctx.roundRect(dateX, dateY, dateW, dateH, 18);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '500 28px Arial';
  ctx.fillText(date, dateX + 28, dateY + 42);

  const innerX = cardX + 56;
  const innerY = cardY + 210;
  const innerW = cardW - 112;
  const innerH = 760;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.roundRect(innerX, innerY, innerW, innerH, 28);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '500 30px Arial';
  ctx.fillText('Пассажир', innerX + 36, innerY + 64);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 54px Arial';
  const userNameLines = wrapText(ctx, payload.userName || 'Пользователь', innerW - 72, 2);
  userNameLines.forEach((line, index) => {
    ctx.fillText(line, innerX + 36, innerY + 128 + index * 58);
  });

  const afterUserY = innerY + 128 + (userNameLines.length - 1) * 58 + 46;
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '500 30px Arial';
  ctx.fillText('Текущий результат', innerX + 36, afterUserY);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 52px Arial';
  const goalLines = wrapText(ctx, payload.goalTitle, innerW - 72, 3);
  goalLines.forEach((line, index) => {
    ctx.fillText(line, innerX + 36, afterUserY + 58 + index * 56);
  });

  const progressBlockY = afterUserY + 58 + goalLines.length * 56 + 34;
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '500 30px Arial';
  ctx.fillText('Прогресс', innerX + 36, progressBlockY);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 36px Arial';
  ctx.fillText(`${progress}%`, innerX + innerW - 140, progressBlockY);

  const barX = innerX + 36;
  const barY = progressBlockY + 28;
  const barW = innerW - 72;
  const barH = 24;

  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 12);
  ctx.fill();

  const fillW = Math.max(10, Math.round((barW * progress) / 100));
  const barGradient = ctx.createLinearGradient(barX, barY, barX + fillW, barY + barH);
  barGradient.addColorStop(0, '#007AFF');
  barGradient.addColorStop(1, '#00C853');
  ctx.fillStyle = barGradient;
  ctx.beginPath();
  ctx.roundRect(barX, barY, fillW, barH, 12);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '500 28px Arial';
  const unit = payload.unit || '';
  ctx.fillText(`${payload.currentValue.toLocaleString('ru-RU')} ${unit}`.trim(), barX, barY + 64);
  const targetText = `${payload.targetValue.toLocaleString('ru-RU')} ${unit}`.trim();
  const targetTextW = ctx.measureText(targetText).width;
  ctx.fillText(targetText, barX + barW - targetTextW, barY + 64);

  const ctaX = cardX + 56;
  const ctaY = cardY + cardH - 168;
  const ctaW = cardW - 112;
  const ctaH = 112;
  ctx.fillStyle = 'rgba(0,122,255,0.20)';
  ctx.beginPath();
  ctx.roundRect(ctaX, ctaY, ctaW, ctaH, 26);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,122,255,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(ctaX + 1, ctaY + 1, ctaW - 2, ctaH - 2, 25);
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 32px Arial';
  const ctaLines = wrapText(ctx, 'Пройди этот квест со мной в Траектории', ctaW - 72, 2);
  ctaLines.forEach((line, index) => {
    ctx.fillText(line, ctaX + 36, ctaY + 46 + index * 36);
  });

  return canvas.toDataURL('image/png');
};
