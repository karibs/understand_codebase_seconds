import { NextRequest, NextResponse } from 'next/server';
import { runSimulation, DEFAULT_PARAMS, SimParams } from '@/lib/simulator';

function normalizeSymbol(ticker: string): string {
  // Korean 6-digit ticker → add .KS suffix
  if (/^\d{6}$/.test(ticker.trim())) {
    return `${ticker.trim()}.KS`;
  }
  return ticker.trim().toUpperCase();
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

    // Dynamic import to avoid SSR issues
    const yahooFinance = (await import('yahoo-finance2')).default;

    let historical;
    try {
      historical = await yahooFinance.historical(symbol, {
        period1: startDate,
        period2: endDate,
        interval: '1d',
      }, { validateResult: false });
    } catch {
      return NextResponse.json({ error: `'${ticker}' 데이터를 불러오지 못했습니다. 종목코드를 확인하세요.` }, { status: 400 });
    }

    if (!historical || historical.length < 60) {
      return NextResponse.json({ error: '데이터가 충분하지 않습니다 (최소 60거래일 필요).' }, { status: 400 });
    }

    const bars = historical
      .filter(d => d.open && d.high && d.low && d.close && d.volume)
      .map(d => ({
        date: d.date.toISOString().slice(0, 10),
        open: d.open!,
        high: d.high!,
        low: d.low!,
        close: d.close!,
        volume: d.volume!,
      }));

    const { trades, equity, stats } = runSimulation(bars, simParams);

    // Downsample equity for response size (max 500 points)
    const step = Math.max(1, Math.floor(equity.length / 500));
    const sampledEquity = equity.filter((_, i) => i % step === 0 || i === equity.length - 1);

    return NextResponse.json({ trades, equity: sampledEquity, stats });
  } catch (err) {
    console.error('Backtest error:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
