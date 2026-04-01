/**
 * tracking_pivot.py의 evaluate_latest_signal() / evaluate_manual_position() 포팅
 * GET /api/signal?ticker=005930&entryPrice=70000&positionPct=40
 */

import { NextRequest, NextResponse } from 'next/server';
import { prepareIndicators } from '@/lib/indicators';
import { RawBar } from '@/lib/simulator';

const TARGET_POSITIONS = [0.40, 0.70, 0.90, 1.00];
const ADD_PROFIT_LEVELS: Record<number, number> = {
  0.40: 0.00,
  0.70: 0.03,
  0.90: 0.06,
  1.00: 0.10,
};
const STOP_LOSS_PCT = 0.03;
const VOLUME_MULTIPLE = 1.5;

function getNextTarget(positionPct: number): number | null {
  for (const t of TARGET_POSITIONS) {
    if (positionPct < t - 1e-9) return t;
  }
  return null;
}

function normalizeSymbol(ticker: string): string {
  if (/^\d{6}$/.test(ticker.trim())) return `${ticker.trim()}.KS`;
  return ticker.trim().toUpperCase();
}

async function fetchRecentBars(symbol: string): Promise<RawBar[]> {
  // 최소 100일치 데이터가 필요 (지표 계산용)
  const end = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);

  const period1 = Math.floor(start.getTime() / 1000);
  const period2 = Math.floor(end.getTime() / 1000);

  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?period1=${period1}&period2=${period2}&interval=1d&events=history`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    next: { revalidate: 300 }, // 5분 캐시
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error('데이터 없음');

  const timestamps: number[] = result.timestamp ?? [];
  const q = result.indicators?.quote?.[0] ?? {};

  return timestamps
    .map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().slice(0, 10),
      open: q.open?.[i],
      high: q.high?.[i],
      low: q.low?.[i],
      close: q.close?.[i],
      volume: q.volume?.[i],
    }))
    .filter(b => b.open != null && b.high != null && b.low != null && b.close != null && b.volume != null) as RawBar[];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ticker = searchParams.get('ticker');
    const entryPriceStr = searchParams.get('entryPrice');   // 수동 평균단가 (optional)
    const positionPctStr = searchParams.get('positionPct'); // 수동 비중 % (optional)

    if (!ticker) {
      return NextResponse.json({ error: '종목코드를 입력하세요.' }, { status: 400 });
    }

    const symbol = normalizeSymbol(ticker);
    let bars: RawBar[];
    try {
      bars = await fetchRecentBars(symbol);
    } catch {
      return NextResponse.json({ error: `'${ticker}' 데이터를 불러오지 못했습니다.` }, { status: 400 });
    }

    if (bars.length < 60) {
      return NextResponse.json({ error: '데이터가 부족합니다.' }, { status: 400 });
    }

    const rows = prepareIndicators(bars);
    const row = rows[rows.length - 1]; // 최신 데이터

    const close = row.close;
    const ma20 = row.ma20;
    const kijun = row.kijun;
    const tenkan = row.tenkan;
    const cloud_top = row.cloud_top;
    const trend_score = row.trend_score;
    const trend_state = row.trend_state;
    const avg_volume = row.avg_volume;

    // 수동 포지션 모드 여부
    const hasManual = entryPriceStr !== null;
    const manual_entry_price = hasManual ? parseFloat(entryPriceStr!) : null;
    const manual_position_pct = positionPctStr ? parseFloat(positionPctStr) / 100 : (hasManual ? 0.40 : null);

    let signal = 'HOLD';
    let reason = '조건 없음';

    if (hasManual && manual_entry_price !== null && manual_position_pct !== null) {
      // ---- evaluate_manual_position 모드 ----
      const avg_entry_price = manual_entry_price;
      const position_pct = Math.max(0, Math.min(1, manual_position_pct));
      const current_profit_pct = (close - avg_entry_price) / avg_entry_price;
      const next_target = getNextTarget(position_pct);

      const trend_ok =
        (trend_score ?? 0) >= 4 &&
        close > (ma20 ?? 0) &&
        (tenkan ?? 0) > (kijun ?? 0);

      const avg_stop = avg_entry_price * (1 - STOP_LOSS_PCT);
      const trend_break =
        ma20 !== null && kijun !== null && cloud_top !== null &&
        close < ma20 && close < kijun && close < cloud_top;

      if (close < avg_stop) {
        signal = 'SELL_ALL';
        reason = `평단 기준 손절: 종가 ${close.toFixed(0)} < 손절기준 ${avg_stop.toFixed(0)}`;
      } else if (trend_break || trend_state === 'WEAK') {
        signal = 'SELL_ALL';
        reason = '추세 붕괴로 전량 매도';
      } else if (position_pct > 0.40 && (trend_score ?? 6) <= 2 && ma20 !== null && close < ma20) {
        signal = 'SELL_PARTIAL';
        reason = '추세 약화로 부분 매도 고려';
      } else if (next_target !== null) {
        const required_profit = ADD_PROFIT_LEVELS[next_target];
        const can_add =
          trend_ok &&
          close > avg_entry_price &&
          current_profit_pct >= required_profit;

        if (can_add) {
          if (next_target === 0.40) { signal = 'BUY_ADD_TO_40'; reason = '40%까지 보강 가능'; }
          else if (next_target === 0.70) { signal = 'BUY_2'; reason = `수익 ${(current_profit_pct * 100).toFixed(1)}%, 70%까지 추가매수 가능`; }
          else if (next_target === 0.90) { signal = 'BUY_3'; reason = `수익 ${(current_profit_pct * 100).toFixed(1)}%, 90%까지 추가매수 가능`; }
          else if (next_target === 1.00) { signal = 'BUY_4'; reason = `수익 ${(current_profit_pct * 100).toFixed(1)}%, 100%까지 추가매수 가능`; }
        }
      }

      return NextResponse.json({
        mode: 'manual',
        date: row.date,
        close,
        signal,
        reason,
        trend_score,
        trend_state,
        ma20,
        ma50: row.ma50,
        tenkan,
        kijun,
        cloud_top,
        cloud_bottom: row.cloud_bottom,
        upper_pivot: row.upper_pivot,
        lower_pivot: row.lower_pivot,
        volume: row.volume,
        avg_volume,
        volume_ratio: row.volume_ratio,
        avg_entry_price,
        position_pct,
        profit_pct: (current_profit_pct * 100).toFixed(2),
        next_target,
        aux_signal_level: row.warning_volume_dump ? 'WARNING' : row.bullish_smart_money ? 'BULLISH' : row.watch_absorption ? 'WATCH' : 'NONE',
        aux_signal_name: row.warning_volume_dump ? 'WARNING_VOLUME_DUMP' : row.bullish_smart_money ? 'BULLISH_SMART_MONEY' : row.watch_absorption ? 'WATCH_ABSORPTION' : '',
        aux_signal_reason: row.warning_volume_dump ? '거래량 급증 음봉 - 분배/투매 가능성' : row.bullish_smart_money ? '양봉 거래량 급증 - 세력 유입 가능성' : row.watch_absorption ? '긴 아래꼬리 + 거래량 급증 - 하락 흡수 가능성' : '',
      });
    }

    // ---- evaluate_latest_signal 모드 (자동 전략 최신 신호) ----
    // 신호를 전체 기간에 걸쳐 generate하고 마지막 값 반환
    const { runSimulation } = await import('@/lib/simulator');
    const oneYearStart = new Date();
    oneYearStart.setFullYear(oneYearStart.getFullYear() - 3);
    const longBars = await fetchRecentBars(symbol).catch(() => bars);

    // generate_signals 결과를 시뮬레이션 통해 얻음
    const simRows = prepareIndicators(longBars);
    const lastRow = simRows[simRows.length - 1];

    // 전략 최신 신호 계산 (가장 마지막 포지션 상태)
    // 간단히: 시뮬레이션 실행 후 현재 포지션 상태 확인
    const simResult = runSimulation(longBars);
    const openTrade = simResult.trades.length > 0
      ? simResult.trades[simResult.trades.length - 1]
      : null;
    const isOpen = openTrade?.exitReason === 'end_of_period';

    // 마지막 row에서 최신 신호 판단
    const trend_ok_auto =
      (lastRow.trend_score ?? 0) >= 4 && !!lastRow.trend_ma_bull;

    const strong_breakout_auto =
      trend_ok_auto &&
      !!lastRow.trend_ichimoku_bull &&
      lastRow.upper_pivot !== null &&
      (lastRow.close > lastRow.upper_pivot || lastRow.close > (lastRow.ma20 ?? 0) * 1.02) &&
      lastRow.volume > (lastRow.avg_volume ?? Infinity) * VOLUME_MULTIPLE;

    const auto_signal = strong_breakout_auto ? 'BUY_1' : 'HOLD';

    return NextResponse.json({
      mode: 'auto',
      date: lastRow.date,
      close: lastRow.close,
      signal: auto_signal,
      reason: strong_breakout_auto ? '강한 추세 돌파 - 1차 진입 조건 충족' : '매수 조건 미충족',
      trend_score: lastRow.trend_score,
      trend_state: lastRow.trend_state,
      ma20: lastRow.ma20,
      ma50: lastRow.ma50,
      tenkan: lastRow.tenkan,
      kijun: lastRow.kijun,
      cloud_top: lastRow.cloud_top,
      cloud_bottom: lastRow.cloud_bottom,
      upper_pivot: lastRow.upper_pivot,
      lower_pivot: lastRow.lower_pivot,
      volume: lastRow.volume,
      avg_volume: lastRow.avg_volume,
      volume_ratio: lastRow.volume_ratio,
      avg_entry_price: null,
      position_pct: null,
      profit_pct: null,
      next_target: null,
      aux_signal_level: lastRow.warning_volume_dump ? 'WARNING' : lastRow.bullish_smart_money ? 'BULLISH' : lastRow.watch_absorption ? 'WATCH' : 'NONE',
      aux_signal_name: lastRow.warning_volume_dump ? 'WARNING_VOLUME_DUMP' : lastRow.bullish_smart_money ? 'BULLISH_SMART_MONEY' : lastRow.watch_absorption ? 'WATCH_ABSORPTION' : '',
      aux_signal_reason: lastRow.warning_volume_dump ? '거래량 급증 음봉 - 분배/투매 가능성' : lastRow.bullish_smart_money ? '양봉 거래량 급증 - 세력 유입 가능성' : lastRow.watch_absorption ? '긴 아래꼬리 + 거래량 급증 - 하락 흡수 가능성' : '',
    });
  } catch (err) {
    console.error('Signal error:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
