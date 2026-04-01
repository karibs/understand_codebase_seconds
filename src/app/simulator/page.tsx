'use client';

import { useState } from 'react';
import { Play, Settings2, RefreshCw, TrendingUp, TrendingDown, Activity, BarChart2 } from 'lucide-react';
import EquityChart from '@/components/EquityChart';
import TradeTable from '@/components/TradeTable';
import { Trade, EquityPoint, SimStats } from '@/lib/simulator';
import clsx from 'clsx';

const PRESETS = [
  { label: '삼성전자', ticker: '005930', name: '삼성전자 (KRX)' },
  { label: 'SK하이닉스', ticker: '000660', name: 'SK하이닉스 (KRX)' },
  { label: '카카오', ticker: '035720', name: '카카오 (KRX)' },
  { label: 'AAPL', ticker: 'AAPL', name: 'Apple Inc.' },
  { label: 'TSLA', ticker: 'TSLA', name: 'Tesla Inc.' },
  { label: 'NVDA', ticker: 'NVDA', name: 'NVIDIA Corp.' },
];

interface SimResult {
  trades: Trade[];
  equity: EquityPoint[];
  stats: SimStats;
}

export default function SimulatorPage() {
  const [ticker, setTicker] = useState('005930');
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [initialCapital, setInitialCapital] = useState(10000000);
  const [pivotWindow, setPivotWindow] = useState(20);
  const [stopLossPct, setStopLossPct] = useState(3);
  const [volumeMultiple, setVolumeMultiple] = useState(1.5);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SimResult | null>(null);

  async function runSim() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker,
          startDate,
          endDate,
          params: {
            pivotWindow,
            stopLossPct: stopLossPct / 100,
            volumeMultiple,
            initialCapital,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '오류가 발생했습니다.'); return; }
      setResult(data);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const s = result?.stats;

  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-white mb-2">
            <span className="text-emerald-400">피봇</span> 트레이딩 시뮬레이터
          </h1>
          <p className="text-gray-400">피봇 포인트 + 이치모쿠 + 이동평균 전략 백테스트</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                종목 설정
              </h2>

              {/* Presets */}
              <div className="flex flex-wrap gap-2 mb-4">
                {PRESETS.map(p => (
                  <button
                    key={p.ticker}
                    onClick={() => setTicker(p.ticker)}
                    className={clsx(
                      'text-xs px-3 py-1.5 rounded-lg border transition-all',
                      ticker === p.ticker
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block">종목코드 / 티커</label>
                  <input
                    className="input"
                    value={ticker}
                    onChange={e => setTicker(e.target.value.toUpperCase())}
                    placeholder="예: 005930 또는 AAPL"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-400 text-xs mb-1.5 block">시작일</label>
                    <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1.5 block">종료일</label>
                    <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1.5 block">초기 자본 (원)</label>
                  <input
                    type="number"
                    className="input"
                    value={initialCapital}
                    onChange={e => setInitialCapital(Number(e.target.value))}
                    step={1000000}
                    min={1000000}
                  />
                </div>
              </div>
            </div>

            {/* Advanced */}
            <div className="card">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full text-white font-semibold"
              >
                <span className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-gray-400" />
                  고급 파라미터
                </span>
                <span className={clsx('text-gray-500 text-xs transition-transform', showAdvanced && 'rotate-180')}>▼</span>
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-gray-400 text-xs mb-1.5 block">피봇 윈도우 (일)</label>
                    <input type="number" className="input" value={pivotWindow} onChange={e => setPivotWindow(Number(e.target.value))} min={5} max={60} />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1.5 block">손절 비율 (%)</label>
                    <input type="number" className="input" value={stopLossPct} onChange={e => setStopLossPct(Number(e.target.value))} min={1} max={20} step={0.5} />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1.5 block">거래량 배수</label>
                    <input type="number" className="input" value={volumeMultiple} onChange={e => setVolumeMultiple(Number(e.target.value))} min={1.0} max={5.0} step={0.1} />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={runSim}
              disabled={loading || !ticker}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4"
            >
              {loading ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> 분석 중...</>
              ) : (
                <><Play className="w-5 h-5" /> 시뮬레이션 실행</>
              )}
            </button>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {!result && !loading && (
              <div className="card flex flex-col items-center justify-center py-24 text-center">
                <BarChart2 className="w-16 h-16 text-gray-700 mb-4" />
                <p className="text-gray-500 text-lg font-medium">종목과 기간을 설정하고</p>
                <p className="text-gray-600 text-sm mt-1">시뮬레이션을 실행하세요</p>
              </div>
            )}

            {loading && (
              <div className="card flex flex-col items-center justify-center py-24">
                <RefreshCw className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
                <p className="text-gray-400">데이터를 불러오고 전략을 적용하는 중...</p>
              </div>
            )}

            {result && s && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      label: '총 수익률',
                      value: `${s.totalReturn >= 0 ? '+' : ''}${s.totalReturn.toFixed(1)}%`,
                      icon: s.totalReturn >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />,
                      color: s.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400',
                      bg: s.totalReturn >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
                    },
                    {
                      label: '연평균 수익률',
                      value: `${s.annualizedReturn >= 0 ? '+' : ''}${s.annualizedReturn.toFixed(1)}%`,
                      icon: <Activity className="w-5 h-5" />,
                      color: s.annualizedReturn >= 0 ? 'text-emerald-400' : 'text-red-400',
                      bg: 'bg-emerald-500/10',
                    },
                    {
                      label: '승률',
                      value: `${s.winRate.toFixed(0)}%`,
                      icon: <BarChart2 className="w-5 h-5" />,
                      color: 'text-cyan-400',
                      bg: 'bg-cyan-500/10',
                    },
                    {
                      label: '최대 낙폭',
                      value: `-${s.maxDrawdown.toFixed(1)}%`,
                      icon: <TrendingDown className="w-5 h-5" />,
                      color: 'text-red-400',
                      bg: 'bg-red-500/10',
                    },
                  ].map(stat => (
                    <div key={stat.label} className="card-sm">
                      <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center mb-3', stat.bg, stat.color)}>
                        {stat.icon}
                      </div>
                      <div className={clsx('text-2xl font-black stat-value', stat.color)}>{stat.value}</div>
                      <div className="text-gray-500 text-xs mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Detail stats */}
                <div className="card">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-1">
                    {[
                      { label: '총 거래', value: `${s.totalTrades}회` },
                      { label: '샤프 지수', value: s.sharpeRatio.toFixed(2) },
                      { label: '평균 수익 (승)', value: `+${s.avgWin.toFixed(1)}%` },
                      { label: '평균 손실 (패)', value: `${s.avgLoss.toFixed(1)}%` },
                    ].map(d => (
                      <div key={d.label} className="text-center">
                        <div className="text-white font-bold text-lg">{d.value}</div>
                        <div className="text-gray-500 text-xs">{d.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center text-xs text-gray-600 mt-2">
                    최종 자산: ₩{s.finalEquity.toLocaleString()} (초기: ₩{s.initialCapital.toLocaleString()})
                  </div>
                </div>

                {/* Equity Chart */}
                <div className="card">
                  <h3 className="text-white font-semibold mb-4">자산 곡선</h3>
                  <EquityChart data={result.equity} initialCapital={s.initialCapital} />
                </div>

                {/* Trade Table */}
                <div className="card">
                  <h3 className="text-white font-semibold mb-4">
                    거래 내역 <span className="text-gray-500 font-normal text-sm">({result.trades.length}건)</span>
                  </h3>
                  <TradeTable trades={result.trades} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
