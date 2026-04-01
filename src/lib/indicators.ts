/**
 * tracking_pivot.py의 prepare_indicators() 를 TypeScript로 정확히 포팅
 */

export interface IndicatorRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  upper_pivot: number | null;
  lower_pivot: number | null;
  avg_volume: number | null;
  volume_ratio: number | null;
  ma20: number | null;
  ma50: number | null;
  ma20_slope: number | null;
  tenkan: number | null;
  kijun: number | null;
  cloud_top: number | null;
  cloud_bottom: number | null;
  trend_score: number | null;
  trend_state: 'STRONG_BULL' | 'BULL' | 'NEUTRAL' | 'WEAK' | 'UNKNOWN' | null;
  trend_ma_bull: boolean | null;
  trend_ichimoku_bull: boolean | null;
  breakout: boolean | null;
  rebound: boolean | null;
  long_lower_wick: boolean | null;
  bullish_smart_money: boolean | null;
  watch_absorption: boolean | null;
  warning_volume_dump: boolean | null;
}

const PIVOT_WINDOW = 20;
const VOLUME_WINDOW = 20;
const VOLUME_MULTIPLE = 1.5;
const BREAKOUT_BUFFER = 0.0;

function rollingMaxShift1(data: number[], window: number): (number | null)[] {
  // data["High"].shift(1).rolling(PIVOT_WINDOW).max()
  // shift(1) → index i에서 data[i-1]을 사용, rolling window는 i-window ~ i-1
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    // shift(1) 후 rolling window: 인덱스 i는 data[i-window] ~ data[i-1]
    const start = i - window;
    const end = i; // exclusive (shift 1이라 i는 포함 안 함)
    if (start < 0) { result.push(null); continue; }
    let max = -Infinity;
    for (let j = start; j < end; j++) max = Math.max(max, data[j]);
    result.push(max);
  }
  return result;
}

function rollingMinShift1(data: number[], window: number): (number | null)[] {
  // data["Low"].shift(1).rolling(PIVOT_WINDOW).min()
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = i - window;
    const end = i;
    if (start < 0) { result.push(null); continue; }
    let min = Infinity;
    for (let j = start; j < end; j++) min = Math.min(min, data[j]);
    result.push(min);
  }
  return result;
}

function rollingMeanShift1(data: number[], window: number): (number | null)[] {
  // data["Volume"].shift(1).rolling(VOLUME_WINDOW).mean()
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = i - window;
    const end = i;
    if (start < 0) { result.push(null); continue; }
    let sum = 0;
    for (let j = start; j < end; j++) sum += data[j];
    result.push(sum / window);
  }
  return result;
}

function simpleMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += data[j];
    result.push(sum / period);
  }
  return result;
}

function rollingMaxN(data: number[], window: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) { result.push(null); continue; }
    let max = -Infinity;
    for (let j = i - window + 1; j <= i; j++) max = Math.max(max, data[j]);
    result.push(max);
  }
  return result;
}

function rollingMinN(data: number[], window: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) { result.push(null); continue; }
    let min = Infinity;
    for (let j = i - window + 1; j <= i; j++) min = Math.min(min, data[j]);
    result.push(min);
  }
  return result;
}

function classifyTrend(score: number | null): 'STRONG_BULL' | 'BULL' | 'NEUTRAL' | 'WEAK' | 'UNKNOWN' {
  if (score === null) return 'UNKNOWN';
  if (score >= 5) return 'STRONG_BULL';
  if (score >= 3) return 'BULL';
  if (score >= 1) return 'NEUTRAL';
  return 'WEAK';
}

export interface RawBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function prepareIndicators(bars: RawBar[]): IndicatorRow[] {
  const n = bars.length;
  const highs = bars.map(b => b.high);
  const lows = bars.map(b => b.low);
  const closes = bars.map(b => b.close);
  const opens = bars.map(b => b.open);
  const volumes = bars.map(b => b.volume);

  // Pivot: shift(1) 후 rolling
  const upper_pivot = rollingMaxShift1(highs, PIVOT_WINDOW);
  const lower_pivot = rollingMinShift1(lows, PIVOT_WINDOW);

  // 거래량: shift(1) 후 rolling mean
  const avg_volume = rollingMeanShift1(volumes, VOLUME_WINDOW);

  // 이동평균
  const ma20 = simpleMA(closes, 20);
  const ma50 = simpleMA(closes, 50);

  // MA 기울기: ma20 - ma20.shift(3)
  const ma20_slope: (number | null)[] = ma20.map((v, i) => {
    if (v === null || i < 3 || ma20[i - 3] === null) return null;
    return v - (ma20[i - 3] as number);
  });

  // 일목균형표
  const high9 = rollingMaxN(highs, 9);
  const low9 = rollingMinN(lows, 9);
  const tenkan: (number | null)[] = high9.map((h, i) =>
    h !== null && low9[i] !== null ? (h + low9[i]!) / 2 : null
  );

  const high26 = rollingMaxN(highs, 26);
  const low26 = rollingMinN(lows, 26);
  const kijun: (number | null)[] = high26.map((h, i) =>
    h !== null && low26[i] !== null ? (h + low26[i]!) / 2 : null
  );

  // 선행스팬 A: ((tenkan + kijun) / 2).shift(26)
  // shift(26) → index i에서 i-26의 값을 사용
  const raw_spanA: (number | null)[] = tenkan.map((t, i) =>
    t !== null && kijun[i] !== null ? (t + kijun[i]!) / 2 : null
  );

  const high52 = rollingMaxN(highs, 52);
  const low52 = rollingMinN(lows, 52);
  const raw_spanB: (number | null)[] = high52.map((h, i) =>
    h !== null && low52[i] !== null ? (h + low52[i]!) / 2 : null
  );

  // shift(26) 적용: index i → raw[i-26]
  const senkou_span_a: (number | null)[] = raw_spanA.map((_, i) =>
    i >= 26 ? raw_spanA[i - 26] : null
  );
  const senkou_span_b: (number | null)[] = raw_spanB.map((_, i) =>
    i >= 26 ? raw_spanB[i - 26] : null
  );

  const cloud_top: (number | null)[] = senkou_span_a.map((a, i) => {
    const b = senkou_span_b[i];
    if (a === null || b === null) return null;
    return Math.max(a, b);
  });
  const cloud_bottom: (number | null)[] = senkou_span_a.map((a, i) => {
    const b = senkou_span_b[i];
    if (a === null || b === null) return null;
    return Math.min(a, b);
  });

  const rows: IndicatorRow[] = [];

  for (let i = 0; i < n; i++) {
    const close = closes[i];
    const open = opens[i];
    const high = highs[i];
    const low = lows[i];
    const vol = volumes[i];

    const m20 = ma20[i];
    const m50 = ma50[i];
    const slope20 = ma20_slope[i];
    const tk = tenkan[i];
    const kj = kijun[i];
    const ct = cloud_top[i];
    const cb = cloud_bottom[i];
    const av = avg_volume[i];

    // trend_score
    let trend_score: number | null = null;
    if (m20 !== null && m50 !== null && slope20 !== null && tk !== null && kj !== null && ct !== null) {
      trend_score = 0;
      if (close > m20) trend_score++;
      if (m20 > m50) trend_score++;
      if (slope20 > 0) trend_score++;
      if (close > kj) trend_score++;
      if (close > ct) trend_score++;
      if (tk > kj) trend_score++;
    }

    const trend_state = classifyTrend(trend_score);

    // trend_ma_bull = (ma20 > ma50) AND (close > ma20) AND (ma20_slope > 0)
    const trend_ma_bull = (m20 !== null && m50 !== null && slope20 !== null)
      ? m20 > m50 && close > m20 && slope20 > 0
      : null;

    // trend_ichimoku_bull = (close > cloud_top) AND (tenkan > kijun)
    const trend_ichimoku_bull = (ct !== null && tk !== null && kj !== null)
      ? close > ct && tk > kj
      : null;

    // breakout
    const breakout = (upper_pivot[i] !== null && av !== null)
      ? close > upper_pivot[i]! * (1 + BREAKOUT_BUFFER) && vol > av * VOLUME_MULTIPLE
      : null;

    // rebound = (close > open) AND (prev_close < prev_open)
    const rebound = i > 0
      ? close > open && closes[i - 1] < opens[i - 1]
      : null;

    // 캔들 구조
    const candle_range = high - low;
    const lower_wick = Math.min(open, close) - low;
    const body = Math.abs(close - open);

    // long_lower_wick = (range > 0) AND (lower_wick/range >= 0.4) AND (lower_wick > body)
    const long_lower_wick = candle_range > 0
      ? (lower_wick / candle_range) >= 0.4 && lower_wick > body
      : false;

    // bullish_smart_money
    const bullish_smart_money = av !== null && av > 0
      ? vol >= av * 2.0 && close > open && close >= low + candle_range * 0.7
      : null;

    // watch_absorption
    const watch_absorption = av !== null && av > 0
      ? vol >= av * 2.0 && long_lower_wick && close >= low + candle_range * 0.6
      : null;

    // warning_volume_dump
    const warning_volume_dump = av !== null && av > 0
      ? vol >= av * 2.0 && close <= open && close <= low + candle_range * 0.4
      : null;

    const volume_ratio = av !== null && av > 0 ? vol / av : null;

    rows.push({
      date: bars[i].date,
      open,
      high,
      low,
      close,
      volume: vol,
      upper_pivot: upper_pivot[i],
      lower_pivot: lower_pivot[i],
      avg_volume: av,
      volume_ratio,
      ma20: m20,
      ma50: m50,
      ma20_slope: slope20,
      tenkan: tk,
      kijun: kj,
      cloud_top: ct,
      cloud_bottom: cb,
      trend_score,
      trend_state,
      trend_ma_bull,
      trend_ichimoku_bull,
      breakout,
      rebound,
      long_lower_wick,
      bullish_smart_money,
      watch_absorption,
      warning_volume_dump,
    });
  }

  return rows;
}
