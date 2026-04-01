import { NextRequest, NextResponse } from 'next/server';
import { runSimulation, DEFAULT_PARAMS, SimParams, RawBar } from '@/lib/simulator';

function normalizeSymbol(ticker: string): string {
  if (/^\d{6}$/.test(ticker.trim())) return `${ticker.trim()}.KS`;
  return ticker.trim().toUpperCase();
}

async function fetchYahooHistorical(symbol: string, startDate: string, endDate: string): Promise<RawBar[]> {
  const period1 = Math.floor(new Date(startDate).getTime() / 1000);
  const period2 = Math.floor(new Date(endDate).getTime() / 1000);

  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?period1=${period1}&period2=${period2}&interval=1d&events=history`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json',
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error(`Yahoo Finance 요청 실패: ${res.status}`);

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error('데이터 없음');

  const timestamps: number[] = result.timestamp ?? [];
  const quotes = result.indicators?.quote?.[0] ?? {};

  const bars: RawBar[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const o = quotes.open?.[i];
    const h = quotes.high?.[i];
    const l = quotes.low?.[i];
    const c = quotes.close?.[i];
    const v = quotes.volume?.[i];
    if (o == null || h == null || l == null || c == null || v == null) continue;
    bars.push({
      date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
      open: o,
      high: h,
      low: l,
      close: c,
      volume: v,
    });
  }
  return bars;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticker, startDate, endDate, params } = body as {
      ticker: string;
      startDate: string;
      endDate: string;
      params?: Partial<SimParams>;
    };

    if (!ticker || !startDate || !endDate) {
      return NextResponse.json({ error: '종목코드, 시작일, 종료일을 입력하세요.' }, { status: 400 });
    }

    const symbol = normalizeSymbol(ticker);
    const simParams: SimParams = { ...DEFAULT_PARAMS, ...params };

    let bars: RawBar[];
    try {
      bars = await fetchYahooHistorical(symbol, startDate, endDate);
    } catch {
      return NextResponse.json(
        { error: `'${ticker}' 데이터를 불러오지 못했습니다. 종목코드를 확인하세요.` },
        { status: 400 }
      );
    }

    if (bars.length < 60) {
      return NextResponse.json(
        { error: '데이터가 충분하지 않습니다 (최소 60거래일 필요).' },
        { status: 400 }
      );
    }

    const { trades, equity, stats } = runSimulation(bars, simParams);

    const step = Math.max(1, Math.floor(equity.length / 500));
    const sampledEquity = equity.filter((_, i) => i % step === 0 || i === equity.length - 1);

    return NextResponse.json({ trades, equity: sampledEquity, stats });
  } catch (err) {
    console.error('Backtest error:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
