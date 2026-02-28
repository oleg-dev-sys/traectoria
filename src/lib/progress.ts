export const calcProgressPercent = (current: number, target: number): number => {
  if (!Number.isFinite(current) || !Number.isFinite(target)) return 0;
  const safeTarget = target > 0 ? target : 1;
  const normalizedCurrent = Math.max(0, current);
  const raw = Math.round((normalizedCurrent / safeTarget) * 100);
  return Math.max(0, Math.min(100, raw));
};
