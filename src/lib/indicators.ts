export function simpleMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  return result;
}

export function rollingMax(data: number[], window: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) { result.push(null); continue; }
    result.push(Math.max(...data.slice(i - window + 1, i + 1)));
  }
  return result;
}

export function rollingMin(data: number[], window: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) { result.push(null); continue; }
    result.push(Math.min(...data.slice(i - window + 1, i + 1)));
  }
  return result;
}

export function ichimokuLine(highs: number[], lows: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < highs.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    const h = Math.max(...highs.slice(i - period + 1, i + 1));
    const l = Math.min(...lows.slice(i - period + 1, i + 1));
    result.push((h + l) / 2);
  }
  return result;
}

export function rollingAvg(data: number[], window: number): (number | null)[] {
  return simpleMA(data, window);
}

export interface CloudValues {
  top: number | null;
  bottom: number | null;
}

export function getCloudAt(
  tenkan: (number | null)[],
  kijun: (number | null)[],
  senkou52: (number | null)[],
  i: number,
  displacement = 26
): CloudValues {
  const idx = i - displacement;
  if (idx < 0) return { top: null, bottom: null };
  const t = tenkan[idx];
  const k = kijun[idx];
  const s52 = senkou52[idx];
  const sA = t !== null && k !== null ? (t + k) / 2 : null;
  const sB = s52;
  if (sA === null || sB === null) return { top: null, bottom: null };
  return { top: Math.max(sA, sB), bottom: Math.min(sA, sB) };
}

export function calcTrendScore(
  close: number,
  ma20: number | null,
  ma50: number | null,
  ma20Prev: number | null,
  kijun: number | null,
  tenkan: number | null,
  cloudTop: number | null
): number {
  let score = 0;
  if (ma20 !== null && close > ma20) score++;
  if (ma20 !== null && ma50 !== null && ma20 > ma50) score++;
  if (ma20 !== null && ma20Prev !== null && ma20 > ma20Prev) score++;
  if (kijun !== null && close > kijun) score++;
  if (cloudTop !== null && close > cloudTop) score++;
  if (tenkan !== null && kijun !== null && tenkan > kijun) score++;
  return score;
}

export function trendState(score: number): 'STRONG_BULL' | 'BULL' | 'NEUTRAL' | 'WEAK' {
  if (score >= 5) return 'STRONG_BULL';
  if (score >= 3) return 'BULL';
  if (score >= 1) return 'NEUTRAL';
  return 'WEAK';
}
