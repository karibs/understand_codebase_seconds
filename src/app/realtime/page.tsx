'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Play, Square, TrendingUp, TrendingDown, Activity, AlertTriangle, Eye } from 'lucide-react';
import clsx from 'clsx';

const PRESETS = [
  { label: '삼성전자', ticker: '005930' },
  { label: 'SK하이닉스', ticker: '000660' },
  { label: '카카오', ticker: '035720' },
  { label: 'AAPL', ticker: 'AAPL' },
  { label: 'TSLA', ticker: 'TSLA' },
  { label: 'NVDA', ticker: 'NVDA' },
];

const INTERVALS = [
  { label: '30초', value: 30 },
  { label: '1분', value: 60 },
  { label: '5분', value: 300 },
  { label: '10분', value: 600 },
];

interface SignalData {
  mode: string;
  date: string;
  close: number;
  signal: string;
  reason: string;
  trend_score: number | null;
  trend_state: string | null;
  ma20: number | null;
  ma50: number | null;
  tenkan: number | null;
  kijun: number | null;
  cloud_top: number | null;
  cloud_bottom: number | null;
  upper_pivot: number | null;
  lower_pivot: number | null;
  volume: number;
  avg_volume: number | null;
  volume_ratio: number | null;
  avg_entry_price: number | null;
  position_pct: number | null;
  profit_pct: string | null;
  next_target: number | null;
  aux_signal_level: string;
  aux_signal_name: string;
  aux_signal_reason: string;
}

function SignalBadge({ signal }: { signal: string }) {
  const cfg: Record<string, { color: string; bg: string; label: string }> = {
    BUY_1:          { color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40', label: '1차 매수 (40%)' },
    BUY_2:          { color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40', label: '2차 추가매수 (70%)' },
    BUY_3:          { color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40', label: '3차 추가매수 (90%)' },
    BUY_4:          { color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40', label: '4차 추가매수 (100%)' },
    BUY_ADD_TO_40:  { color: 'text-cyan-400',    bg: 'bg-cyan-500/20 border-cyan-500/40',       label: '40%까지 보강' },
    SELL_ALL:       { color: 'text-red-400',      bg: 'bg-red-500/20 border-red-500/40',         label: '전량 매도' },
    SELL_PARTIAL:   { color: 'text-orange-400',   bg: 'bg-orange-500/20 border-orange-500/40',   label: '부분 매도' },
    HOLD:           { color: 'text-gray-400',     bg: 'bg-gray-700/50 border-gray-600/40',       label: '관망 (HOLD)' },
  };
  const c = cfg[signal] ?? cfg.HOLD;
  return (
    <span className={clsx('text-sm font-bold px-3 py-1.5 rounded-lg border', c.color, c.bg)}>
      {signal} · {c.label}
    </span>
  );
}

function AuxBadge({ level, name, reason }: { level: string; name: string; reason: string }) {
  if (level === 'NONE' || !name) return null;
  const cfg: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    WARNING: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30' },
    BULLISH: { icon: <TrendingUp className="w-4 h-4" />,   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
    WATCH:   { icon: <Eye className="w-4 h-4" />,          color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30' },
  };
  const c = cfg[level];
  if (!c) return null;
  return (
    <div className={clsx('flex items-start gap-2 px-3 py-2.5 rounded-lg border text-xs', c.color, c.bg)}>
      <span className="mt-0.5 flex-shrink-0">{c.icon}</span>
      <div>
        <div className="font-bold">{name}</div>
        <div className="opacity-80">{reason}</div>
      </div>
    </div>
  );
}

function TrendBar({ score }: { score: number | null }) {
  if (score === null) return null;
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className={clsx(
            'h-3 w-full rounded-sm transition-all',
            i < score
              ? score >= 5 ? 'bg-emerald-400' : score >= 3 ? 'bg-emerald-500' : 'bg-yellow-500'
              : 'bg-gray-700'
          )}
        />
      ))}
      <span className="text-xs text-gray-400 ml-1 whitespace-nowrap">{score}/6</span>
    </div>
  );
}

function Indicator({ label, value, highlight }: { label: string; value: string | number | null; highlight?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="bg-gray-900/60 rounded-lg px-3 py-2.5">
      <div className="text-gray-500 text-xs mb-1">{label}</div>
      <div className={clsx(
        'font-mono font-semibold text-sm',
        highlight === 'up' ? 'text-emerald-400' : highlight === 'down' ? 'text-red-400' : 'text-white'
      )}>
        {value !== null && value !== undefined ? (typeof value === 'number' ? value.toLocaleString() : value) : '-'}
      </div>
    </div>
  );
}

export default function RealtimePage() {
  const [ticker, setTicker] = useState('005930');
  const [intervalSec, setIntervalSec] = useState(60);
  const [entryPrice, setEntryPrice] = useState('');
  const [positionPct, setPositionPct] = useState('');
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SignalData | null>(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSignal = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ ticker });
      if (entryPrice) params.set('entryPrice', entryPrice);
      if (positionPct) params.set('positionPct', positionPct);

      const res = await fetch(`/api/signal?${params}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error || '오류'); return; }
      setData(json);
      setLastUpdated(new Date());
      setCountdown(intervalSec);
    } catch {
      setError('네트워크 오류');
    } finally {
      setLoading(false);
    }
  }, [ticker, entryPrice, positionPct, intervalSec]);

  const start = useCallback(() => {
    setRunning(true);
    fetchSignal();
    timerRef.current = setInterval(fetchSignal, intervalSec * 1000);
    setCountdown(intervalSec);
    countdownRef.current = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
  }, [fetchSignal, intervalSec]);

  const stop = useCallback(() => {
    setRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  useEffect(() => () => { stop(); }, [stop]);

  const trendColors: Record<string, string> = {
    STRONG_BULL: 'text-emerald-400',
    BULL:        'text-green-400',
    NEUTRAL:     'text-yellow-400',
    WEAK:        'text-red-400',
    UNKNOWN:     'text-gray-500',
  };

  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">
            <span className="text-emerald-400">실시간</span> 신호 추적
          </h1>
          <p className="text-gray-400">
            Python의 <code className="bg-gray-800 px-1.5 py-0.5 rounded text-emerald-400 text-sm">run_realtime_mode()</code>를 웹에서 구현 — 자동으로 최신 신호를 조회합니다.
          </p>
        </div>

        {/* 설정 패널 */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 종목 */}
            <div>
              <label className="text-gray-400 text-xs mb-2 block">종목코드 / 티커</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESETS.map(p => (
                  <button
                    key={p.ticker}
                    onClick={() => setTicker(p.ticker)}
                    disabled={running}
                    className={clsx(
                      'text-xs px-3 py-1.5 rounded-lg border transition-all',
                      ticker === p.ticker
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <input
                className="input"
                value={ticker}
                onChange={e => setTicker(e.target.value.toUpperCase())}
                disabled={running}
                placeholder="예: 005930 또는 AAPL"
              />
            </div>

            {/* 조회 간격 */}
            <div>
              <label className="text-gray-400 text-xs mb-2 block">조회 간격</label>
              <div className="flex gap-2 mb-3">
                {INTERVALS.map(iv => (
                  <button
                    key={iv.value}
                    onClick={() => setIntervalSec(iv.value)}
                    disabled={running}
                    className={clsx(
                      'text-xs px-3 py-1.5 rounded-lg border transition-all flex-1',
                      intervalSec === iv.value
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                    )}
                  >
                    {iv.label}
                  </button>
                ))}
              </div>

              {/* 수동 포지션 (optional) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-500 text-xs mb-1 block">내 평균단가 (선택)</label>
                  <input
                    className="input text-sm"
                    value={entryPrice}
                    onChange={e => setEntryPrice(e.target.value)}
                    disabled={running}
                    placeholder="예: 72000"
                    type="number"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-xs mb-1 block">현재 비중 % (선택)</label>
                  <input
                    className="input text-sm"
                    value={positionPct}
                    onChange={e => setPositionPct(e.target.value)}
                    disabled={running}
                    placeholder="예: 40"
                    type="number"
                    min="0" max="100"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-5">
            {!running ? (
              <button onClick={start} disabled={!ticker} className="btn-primary flex items-center gap-2">
                <Play className="w-4 h-4" /> 추적 시작
              </button>
            ) : (
              <button onClick={stop} className="px-5 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-all flex items-center gap-2">
                <Square className="w-4 h-4" /> 추적 중단
              </button>
            )}
            {running && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                다음 갱신까지 <span className="text-emerald-400 font-mono font-bold">{countdown}초</span>
              </div>
            )}
            {lastUpdated && (
              <span className="text-gray-600 text-xs">
                마지막 조회: {lastUpdated.toLocaleTimeString('ko-KR')}
              </span>
            )}
          </div>
        </div>

        {/* 에러 */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {/* 로딩 */}
        {loading && !data && (
          <div className="card flex items-center justify-center py-20">
            <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
          </div>
        )}

        {/* 결과 */}
        {data && (
          <div className="space-y-4">
            {/* 신호 헤더 */}
            <div className="card border-emerald-500/10">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-500 text-xs">{ticker.toUpperCase()} · {data.date}</span>
                    {loading && <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />}
                  </div>
                  <div className="text-4xl font-black text-white mb-3">
                    ₩{data.close.toLocaleString()}
                  </div>
                  <SignalBadge signal={data.signal} />
                </div>

                <div className="text-right">
                  <div className="text-gray-500 text-xs mb-2">추세 상태</div>
                  <div className={clsx('text-2xl font-black', trendColors[data.trend_state ?? 'UNKNOWN'])}>
                    {data.trend_state ?? '-'}
                  </div>
                  <TrendBar score={data.trend_score} />
                </div>
              </div>

              {data.reason && (
                <div className="mt-4 bg-gray-800/50 rounded-lg px-4 py-2.5 text-sm text-gray-300">
                  📋 {data.reason}
                </div>
              )}
            </div>

            {/* 보조 신호 */}
            {data.aux_signal_level !== 'NONE' && (
              <AuxBadge
                level={data.aux_signal_level}
                name={data.aux_signal_name}
                reason={data.aux_signal_reason}
              />
            )}

            {/* 수동 포지션 정보 */}
            {data.position_pct !== null && (
              <div className="card">
                <h3 className="text-white font-semibold mb-3">내 포지션</h3>
                <div className="grid grid-cols-3 gap-3">
                  <Indicator label="평균단가" value={data.avg_entry_price} />
                  <Indicator
                    label="현재 비중"
                    value={data.position_pct !== null ? `${(data.position_pct * 100).toFixed(0)}%` : null}
                  />
                  <Indicator
                    label="평단 대비 손익"
                    value={data.profit_pct !== null ? `${parseFloat(data.profit_pct) >= 0 ? '+' : ''}${data.profit_pct}%` : null}
                    highlight={data.profit_pct !== null ? (parseFloat(data.profit_pct) >= 0 ? 'up' : 'down') : undefined}
                  />
                </div>
                {data.next_target && (
                  <div className="mt-3 text-xs text-gray-500">
                    다음 목표 비중: <span className="text-emerald-400 font-semibold">{(data.next_target * 100).toFixed(0)}%</span>
                    {' '}(필요 수익률: {(ADD_PROFIT_LEVELS[data.next_target] * 100).toFixed(0)}%)
                  </div>
                )}
              </div>
            )}

            {/* 기술적 지표 */}
            <div className="card">
              <h3 className="text-white font-semibold mb-3">기술적 지표</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Indicator label="MA20" value={data.ma20?.toLocaleString() ?? null}
                  highlight={data.ma20 ? (data.close > data.ma20 ? 'up' : 'down') : undefined} />
                <Indicator label="MA50" value={data.ma50?.toLocaleString() ?? null}
                  highlight={data.ma50 ? (data.close > data.ma50 ? 'up' : 'down') : undefined} />
                <Indicator label="전환선 (Tenkan)" value={data.tenkan?.toLocaleString() ?? null}
                  highlight={data.tenkan && data.kijun ? (data.tenkan > data.kijun ? 'up' : 'down') : undefined} />
                <Indicator label="기준선 (Kijun)" value={data.kijun?.toLocaleString() ?? null} />
                <Indicator label="구름 상단" value={data.cloud_top?.toLocaleString() ?? null}
                  highlight={data.cloud_top ? (data.close > data.cloud_top ? 'up' : 'down') : undefined} />
                <Indicator label="구름 하단" value={data.cloud_bottom?.toLocaleString() ?? null} />
                <Indicator label="상단 피봇" value={data.upper_pivot?.toLocaleString() ?? null}
                  highlight={data.upper_pivot ? (data.close > data.upper_pivot ? 'up' : 'neutral') : undefined} />
                <Indicator label="하단 피봇" value={data.lower_pivot?.toLocaleString() ?? null}
                  highlight={data.lower_pivot ? (data.close > data.lower_pivot ? 'neutral' : 'down') : undefined} />
              </div>
            </div>

            {/* 거래량 */}
            <div className="card">
              <h3 className="text-white font-semibold mb-3">거래량</h3>
              <div className="grid grid-cols-3 gap-3">
                <Indicator label="당일 거래량" value={data.volume ? Math.round(data.volume).toLocaleString() : null} />
                <Indicator label="20일 평균 거래량" value={data.avg_volume ? Math.round(data.avg_volume).toLocaleString() : null} />
                <Indicator
                  label="거래량 배수"
                  value={data.volume_ratio ? `${data.volume_ratio.toFixed(2)}배` : null}
                  highlight={data.volume_ratio ? (data.volume_ratio >= 1.5 ? 'up' : 'neutral') : undefined}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ADD_PROFIT_LEVELS를 클라이언트에서도 사용
const ADD_PROFIT_LEVELS: Record<number, number> = {
  0.40: 0.00,
  0.70: 0.03,
  0.90: 0.06,
  1.00: 0.10,
};
