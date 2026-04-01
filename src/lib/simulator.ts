/**
 * tracking_pivot.py의 generate_signals() + 자산 시뮬레이션을 TypeScript로 정확히 포팅
 */

import { prepareIndicators, IndicatorRow } from './indicators';

export { type RawBar } from './indicators';
import type { RawBar } from './indicators';

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

function getNextTargetPosition(positionPct: number): number | null {
  for (const target of TARGET_POSITIONS) {
    if (positionPct < target - 1e-9) return target;
  }
  return null;
}

function inferStage(positionPct: number): number {
  if (positionPct <= 0) return 0;
  if (positionPct <= 0.40) return 1;
  if (positionPct <= 0.70) return 2;
  if (positionPct <= 0.90) return 3;
  return 4;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function runSimulation(
  bars: RawBar[],
  params: SimParams = DEFAULT_PARAMS
): { trades: Trade[]; equity: EquityPoint[]; stats: SimStats } {
  if (bars.length < 60) {
    return { trades: [], equity: [], stats: emptyStats(params.initialCapital) };
  }

  const rows: IndicatorRow[] = prepareIndicators(bars);

  // -------------------------------------------------------
  // 신호 생성 (generate_signals 포팅)
  // -------------------------------------------------------
  let position_pct = 0.0;
  let avg_entry_price = 0.0;
  let stage = 0;

  // 자산 시뮬레이션용 변수
  let cash = params.initialCapital;
  let shares = 0;

  const trades: Trade[] = [];
  const equity: EquityPoint[] = [];
  let tradeId = 1;
  let tradeEntryDate = '';
  let tradeEntryPrice = 0;
  let tradeEntrySignal = 'BUY_1';

  const REQUIRED_COLS = [
    'upper_pivot', 'lower_pivot', 'avg_volume',
    'ma20', 'ma50', 'tenkan', 'kijun',
    'cloud_top', 'cloud_bottom', 'trend_score', 'trend_state',
  ] as const;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const close = row.close;

    // 자산 계산
    const curEquity = cash + shares * close;
    equity.push({ date: row.date, equity: curEquity, close });

    // 지표 준비 안 된 구간 스킵
    const hasAll = REQUIRED_COLS.every(col => row[col] !== null);
    if (!hasAll) continue;

    const upper_pivot = row.upper_pivot!;
    const ma20 = row.ma20!;
    const tenkan = row.tenkan!;
    const kijun = row.kijun!;
    const cloud_top = row.cloud_top!;
    const trend_score = row.trend_score!;
    const trend_state = row.trend_state!;
    const avg_volume = row.avg_volume!;

    let signal = 'HOLD';
    let exitReason = '';

    const current_profit_pct = position_pct > 0 && avg_entry_price > 0
      ? (close - avg_entry_price) / avg_entry_price
      : null;

    const next_target = getNextTargetPosition(position_pct);

    // ---- 매도 판단 ----
    if (position_pct > 0) {
      const avg_stop = avg_entry_price * (1 - params.stopLossPct);
      const trend_break =
        close < ma20 &&
        close < kijun &&
        close < cloud_top;

      if (close < avg_stop) {
        signal = 'SELL_ALL';
        exitReason = 'stop_loss';
      } else if (trend_break || trend_state === 'WEAK') {
        signal = 'SELL_ALL';
        exitReason = trend_state === 'WEAK' ? 'weak_trend' : 'trend_collapse';
      } else if (position_pct > 0.40 && trend_score <= 2 && close < ma20) {
        // SELL_PARTIAL: Python 원본 로직 그대로
        let new_position: number;
        if (position_pct > 0.90) {
          new_position = 0.70;
        } else {
          new_position = 0.40;
        }
        if (new_position < position_pct) {
          // 주식 수 조정 (현재 equity 기준으로 new_position 비율만 유지)
          const totalEquity = cash + shares * close;
          const targetShares = Math.floor((totalEquity * new_position) / close);
          if (targetShares < shares) {
            cash += (shares - targetShares) * close;
            shares = targetShares;
          }
          position_pct = new_position;
          stage = inferStage(position_pct);
          signal = 'SELL_PARTIAL';
        }
      }

      // SELL_ALL 실행
      if (signal === 'SELL_ALL') {
        cash += shares * close;
        trades.push({
          id: tradeId++,
          entryDate: tradeEntryDate,
          entryPrice: tradeEntryPrice,
          exitDate: row.date,
          exitPrice: close,
          returnPct: ((close - tradeEntryPrice) / tradeEntryPrice) * 100,
          signal: tradeEntrySignal,
          exitReason,
          holdingDays: daysBetween(tradeEntryDate, row.date),
        });
        shares = 0;
        avg_entry_price = 0.0;
        position_pct = 0.0;
        stage = 0;
      }
    }

    // ---- 매수 판단 (SELL_PARTIAL 이후에도 signal이 HOLD면 매수 체크) ----
    if (signal === 'HOLD') {
      // trend_ok = (trend_score >= 4) AND trend_ma_bull
      const trend_ok = trend_score >= 4 && !!row.trend_ma_bull;

      // 강한 돌파: trend_ok AND trend_ichimoku_bull AND (close > upper_pivot OR close > ma20*1.02) AND volume > avg*1.5
      const strong_breakout =
        trend_ok &&
        !!row.trend_ichimoku_bull &&
        (close > upper_pivot || close > ma20 * 1.02) &&
        row.volume > avg_volume * params.volumeMultiple;

      // 눌림목 진입
      const near_ma20 = ma20 > 0 && Math.abs(close - ma20) / ma20 <= 0.02;
      const near_kijun = kijun > 0 && Math.abs(close - kijun) / kijun <= 0.02;
      const near_cloud = cloud_top > 0 && Math.abs(close - cloud_top) / cloud_top <= 0.025;

      const pullback_entry =
        trend_ok &&
        (near_ma20 || near_kijun || near_cloud) &&
        !!row.rebound &&
        (close > ma20 || close > kijun);

      // 추가매수용 추세 확인
      const strength_continue =
        trend_score >= 4 &&
        close > ma20 &&
        tenkan > kijun;

      if (position_pct === 0 && (strong_breakout || pullback_entry)) {
        // BUY_1: 40% 진입
        const totalEquity = cash;
        const buyShares = Math.floor((totalEquity * 0.40) / close);
        if (buyShares > 0) {
          shares = buyShares;
          cash -= shares * close;
          avg_entry_price = close;
          position_pct = 0.40;
          stage = 1;
          tradeEntryDate = row.date;
          tradeEntryPrice = close;
          tradeEntrySignal = 'BUY_1';
          signal = 'BUY_1';
        }
      } else if (position_pct > 0 && next_target !== null && avg_entry_price > 0) {
        const profit = (close - avg_entry_price) / avg_entry_price;
        const required_profit = ADD_PROFIT_LEVELS[next_target];

        if (strength_continue && close > avg_entry_price && profit >= required_profit) {
          // 피라미딩: Python 원본 avg 계산법
          // avg = (avg * old_pos + close * add_size) / new_pos
          const old_position = position_pct;
          const add_size = next_target - position_pct;

          const totalEquity = cash + shares * close;
          const addCost = totalEquity * add_size;
          const additionalShares = Math.floor(addCost / close);

          if (additionalShares > 0 && cash >= additionalShares * close) {
            const new_avg = (avg_entry_price * old_position + close * add_size) / next_target;
            cash -= additionalShares * close;
            shares += additionalShares;
            avg_entry_price = new_avg;
            position_pct = next_target;
            stage = inferStage(position_pct);

            if (next_target === 0.70) signal = 'BUY_2';
            else if (next_target === 0.90) signal = 'BUY_3';
            else if (next_target === 1.00) signal = 'BUY_4';
          }
        }
      }
    }
  }

  // 기간 종료 시 미청산 포지션 처리
  if (shares > 0) {
    const lastBar = rows[rows.length - 1];
    cash += shares * lastBar.close;
    trades.push({
      id: tradeId++,
      entryDate: tradeEntryDate,
      entryPrice: tradeEntryPrice,
      exitDate: lastBar.date,
      exitPrice: lastBar.close,
      returnPct: ((lastBar.close - tradeEntryPrice) / tradeEntryPrice) * 100,
      signal: tradeEntrySignal,
      exitReason: 'end_of_period',
      holdingDays: daysBetween(tradeEntryDate, lastBar.date),
    });
  }

  const stats = computeStats(trades, equity, params.initialCapital, bars);
  return { trades, equity, stats };
}

function computeStats(
  trades: Trade[],
  equity: EquityPoint[],
  initialCapital: number,
  bars: RawBar[]
): SimStats {
  if (!equity.length) return emptyStats(initialCapital);

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

  let peak = initialCapital;
  let maxDrawdown = 0;
  for (const e of equity) {
    if (e.equity > peak) peak = e.equity;
    const dd = (peak - e.equity) / peak * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  const dailyReturns: number[] = [];
  for (let i = 1; i < equity.length; i++) {
    dailyReturns.push((equity[i].equity - equity[i - 1].equity) / equity[i - 1].equity);
  }
  const mean = dailyReturns.reduce((a, b) => a + b, 0) / (dailyReturns.length || 1);
  const variance = dailyReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (dailyReturns.length || 1);
  const sharpeRatio = Math.sqrt(variance) > 0 ? (mean / Math.sqrt(variance)) * Math.sqrt(252) : 0;

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
    totalReturn: 0, annualizedReturn: 0, winRate: 0,
    totalTrades: 0, maxDrawdown: 0, sharpeRatio: 0,
    avgWin: 0, avgLoss: 0, finalEquity: initialCapital, initialCapital,
  };
}
