import {
  simpleMA, rollingMax, rollingMin, ichimokuLine,
  rollingAvg, getCloudAt, calcTrendScore, trendState,
} from './indicators';

export interface RawBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  id: number;
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  returnPct: number;
  signal: string;
  exitReason: string;
  holdingDays: number;
}

export interface EquityPoint {
  date: string;
  equity: number;
  close: number;
}

export interface SimStats {
  totalReturn: number;
  annualizedReturn: number;
  winRate: number;
  totalTrades: number;
  maxDrawdown: number;
  sharpeRatio: number;
  avgWin: number;
  avgLoss: number;
  finalEquity: number;
  initialCapital: number;
}

export interface SimParams {
  pivotWindow: number;
  stopLossPct: number;
  volumeMultiple: number;
  initialCapital: number;
}

export const DEFAULT_PARAMS: SimParams = {
  pivotWindow: 20,
  stopLossPct: 0.03,
  volumeMultiple: 1.5,
  initialCapital: 10_000_000,
};

const TARGET_POSITIONS = [0.40, 0.70, 0.90, 1.00];
const ADD_PROFIT_LEVELS: Record<number, number> = {
  0.40: 0.00,
  0.70: 0.03,
  0.90: 0.06,
  1.00: 0.10,
};

export function runSimulation(
  bars: RawBar[],
  params: SimParams = DEFAULT_PARAMS
): { trades: Trade[]; equity: EquityPoint[]; stats: SimStats } {
  if (bars.length < 60) {
    return { trades: [], equity: [], stats: emptyStats(params.initialCapital) };
  }

  const closes = bars.map(b => b.close);
  const highs = bars.map(b => b.high);
  const lows = bars.map(b => b.low);
  const opens = bars.map(b => b.open);
  const volumes = bars.map(b => b.volume);

  const ma20 = simpleMA(closes, 20);
  const ma50 = simpleMA(closes, 50);
  const upperPivot = rollingMax(highs, params.pivotWindow);
  const lowerPivot = rollingMin(lows, params.pivotWindow);
  const avgVolume = rollingAvg(volumes, 20);
  const tenkan = ichimokuLine(highs, lows, 9);
  const kijun = ichimokuLine(highs, lows, 26);
  const senkou52 = ichimokuLine(highs, lows, 52);

  let cash = params.initialCapital;
  let shares = 0;
  let avgEntryPrice = 0;
  let stage = 0;
  let positionPct = 0;
  let tradeEntryDate = '';
  let tradeEntryPrice = 0;

  const trades: Trade[] = [];
  const equity: EquityPoint[] = [];
  let tradeId = 1;

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    const close = bar.close;
    const open = bar.open;
    const high = bar.high;
    const low = bar.low;
    const vol = bar.volume;

    const cloud = getCloudAt(tenkan, kijun, senkou52, i);
    const score = calcTrendScore(
      close,
      ma20[i], ma50[i],
      i > 0 ? ma20[i - 1] : null,
      kijun[i], tenkan[i],
      cloud.top
    );
    const state = trendState(score);

    const curEquity = cash + shares * close;
    equity.push({ date: bar.date, equity: curEquity, close });

    const avgVol = avgVolume[i];
    const upPivot = upperPivot[i];
    const loKijun = kijun[i];
    const lowa20 = ma20[i];
    const cloudTop = cloud.top;

    // Need enough indicator data
    if (i < 52) continue;

    const candle = close - open;
    const range = high - low;
    const lowerWick = Math.min(open, close) - low;
    const longLowerWick = range > 0 && lowerWick / range > 0.5;

    if (stage === 0) {
      // BUY_1 conditions
      const strongBreakout =
        score >= 4 &&
        avgVol !== null && vol > avgVol * params.volumeMultiple &&
        upPivot !== null && close >= upPivot * 0.995;

      const pullbackEntry =
        score >= 4 &&
        lowa20 !== null && Math.abs(close - lowa20) / lowa20 < 0.02 &&
        longLowerWick &&
        candle >= 0;

      if (strongBreakout || pullbackEntry) {
        const targetShares = Math.floor((cash * 0.40) / close);
        if (targetShares > 0) {
          shares = targetShares;
          cash -= shares * close;
          avgEntryPrice = close;
          stage = 1;
          positionPct = 0.40;
          tradeEntryDate = bar.date;
          tradeEntryPrice = close;
        }
      }
    } else {
      const profit = avgEntryPrice > 0 ? (close - avgEntryPrice) / avgEntryPrice : 0;
      const totalEquity = cash + shares * close;

      // SELL_ALL conditions
      const stopLossHit = close < avgEntryPrice * (1 - params.stopLossPct);
      const trendCollapse =
        lowa20 !== null && loKijun !== null && cloudTop !== null &&
        close < lowa20 && close < loKijun && close < cloudTop;
      const weakTrend = state === 'WEAK';

      if (stopLossHit || trendCollapse || weakTrend) {
        let exitReason = 'stop_loss';
        if (trendCollapse) exitReason = 'trend_collapse';
        if (weakTrend) exitReason = 'weak_trend';

        const exitRevenue = shares * close;
        cash += exitRevenue;

        trades.push({
          id: tradeId++,
          entryDate: tradeEntryDate,
          entryPrice: tradeEntryPrice,
          exitDate: bar.date,
          exitPrice: close,
          returnPct: ((close - tradeEntryPrice) / tradeEntryPrice) * 100,
          signal: 'BUY_1',
          exitReason,
          holdingDays: daysBetween(tradeEntryDate, bar.date),
        });

        shares = 0;
        avgEntryPrice = 0;
        stage = 0;
        positionPct = 0;
      } else {
        // SELL_PARTIAL
        if (positionPct > 0.40 && score <= 2 && lowa20 !== null && close < lowa20) {
          const reducedPct = positionPct === 0.90 || positionPct === 1.00 ? 0.70 : 0.40;
          const targetShares = Math.floor((totalEquity * reducedPct) / close);
          if (targetShares < shares) {
            cash += (shares - targetShares) * close;
            shares = targetShares;
            positionPct = reducedPct;
            stage = TARGET_POSITIONS.indexOf(reducedPct) + 1;
          }
        }

        // Pyramiding
        const nextTargetIdx = TARGET_POSITIONS.indexOf(positionPct);
        if (nextTargetIdx >= 0 && nextTargetIdx < TARGET_POSITIONS.length - 1) {
          const nextTarget = TARGET_POSITIONS[nextTargetIdx + 1];
          const requiredProfit = ADD_PROFIT_LEVELS[nextTarget];

          if (
            profit >= requiredProfit &&
            score >= 4 &&
            loKijun !== null && tenkan[i] !== null && tenkan[i]! > loKijun &&
            close > avgEntryPrice
          ) {
            const additionalCost = totalEquity * (nextTarget - positionPct);
            const additionalShares = Math.floor(additionalCost / close);
            if (additionalShares > 0 && cash >= additionalShares * close) {
              const newAvg = (shares * avgEntryPrice + additionalShares * close) / (shares + additionalShares);
              cash -= additionalShares * close;
              shares += additionalShares;
              avgEntryPrice = newAvg;
              positionPct = nextTarget;
              stage = nextTargetIdx + 2;
            }
          }
        }
      }
    }
  }

  // Close any open position at end
  if (shares > 0) {
    const lastBar = bars[bars.length - 1];
    cash += shares * lastBar.close;
    trades.push({
      id: tradeId++,
      entryDate: tradeEntryDate,
      entryPrice: tradeEntryPrice,
      exitDate: lastBar.date,
      exitPrice: lastBar.close,
      returnPct: ((lastBar.close - tradeEntryPrice) / tradeEntryPrice) * 100,
      signal: 'BUY_1',
      exitReason: 'end_of_period',
      holdingDays: daysBetween(tradeEntryDate, lastBar.date),
    });
  }

  const stats = computeStats(trades, equity, params.initialCapital, bars);
  return { trades, equity, stats };
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function computeStats(
  trades: Trade[],
  equity: EquityPoint[],
  initialCapital: number,
  bars: RawBar[]
): SimStats {
  if (equity.length === 0) return emptyStats(initialCapital);

  const finalEquity = equity[equity.length - 1].equity;
  const totalReturn = ((finalEquity - initialCapital) / initialCapital) * 100;

  const years = bars.length / 252;
  const annualizedReturn = years > 0
    ? (Math.pow(finalEquity / initialCapital, 1 / years) - 1) * 100
    : 0;

  const wins = trades.filter(t => t.returnPct > 0);
  const losses = trades.filter(t => t.returnPct <= 0);
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const avgWin = wins.length > 0 ? wins.reduce((a, t) => a + t.returnPct, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, t) => a + t.returnPct, 0) / losses.length : 0;

  // Max drawdown
  let peak = initialCapital;
  let maxDrawdown = 0;
  for (const e of equity) {
    if (e.equity > peak) peak = e.equity;
    const dd = (peak - e.equity) / peak * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // Simple Sharpe (daily returns)
  const dailyReturns: number[] = [];
  for (let i = 1; i < equity.length; i++) {
    dailyReturns.push((equity[i].equity - equity[i - 1].equity) / equity[i - 1].equity);
  }
  const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / (dailyReturns.length || 1);
  const variance = dailyReturns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / (dailyReturns.length || 1);
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0;

  return {
    totalReturn,
    annualizedReturn,
    winRate,
    totalTrades: trades.length,
    maxDrawdown,
    sharpeRatio,
    avgWin,
    avgLoss,
    finalEquity,
    initialCapital,
  };
}

function emptyStats(initialCapital: number): SimStats {
  return {
    totalReturn: 0,
    annualizedReturn: 0,
    winRate: 0,
    totalTrades: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    avgWin: 0,
    avgLoss: 0,
    finalEquity: initialCapital,
    initialCapital,
  };
}
