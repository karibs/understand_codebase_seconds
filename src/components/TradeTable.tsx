'use client';

import { Trade } from '@/lib/simulator';
import clsx from 'clsx';

const EXIT_LABELS: Record<string, string> = {
  stop_loss: '손절',
  trend_collapse: '추세 붕괴',
  weak_trend: '약세 전환',
  end_of_period: '기간 종료',
};

export default function TradeTable({ trades }: { trades: Trade[] }) {
  if (!trades.length) return (
    <div className="text-center py-12 text-gray-600 text-sm">거래 기록 없음</div>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900/50">
            <th className="px-4 py-3 text-left text-gray-400 font-medium">#</th>
            <th className="px-4 py-3 text-left text-gray-400 font-medium">진입일</th>
            <th className="px-4 py-3 text-right text-gray-400 font-medium">진입가</th>
            <th className="px-4 py-3 text-left text-gray-400 font-medium">청산일</th>
            <th className="px-4 py-3 text-right text-gray-400 font-medium">청산가</th>
            <th className="px-4 py-3 text-right text-gray-400 font-medium">수익률</th>
            <th className="px-4 py-3 text-center text-gray-400 font-medium">보유일</th>
            <th className="px-4 py-3 text-center text-gray-400 font-medium">청산 사유</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t, idx) => {
            const isWin = t.returnPct > 0;
            return (
              <tr
                key={t.id}
                className={clsx(
                  'border-b border-gray-800/50 transition-colors hover:bg-gray-800/30',
                  idx % 2 === 0 ? 'bg-transparent' : 'bg-gray-900/20'
                )}
              >
                <td className="px-4 py-3 text-gray-600">{t.id}</td>
                <td className="px-4 py-3 text-gray-300 font-mono text-xs">{t.entryDate}</td>
                <td className="px-4 py-3 text-right text-gray-300 font-mono text-xs">
                  {t.entryPrice.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-gray-300 font-mono text-xs">{t.exitDate}</td>
                <td className="px-4 py-3 text-right text-gray-300 font-mono text-xs">
                  {t.exitPrice.toLocaleString()}
                </td>
                <td className={clsx(
                  'px-4 py-3 text-right font-bold font-mono',
                  isWin ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {isWin ? '+' : ''}{t.returnPct.toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-center text-gray-400">{t.holdingDays}일</td>
                <td className="px-4 py-3 text-center">
                  <span className={clsx(
                    'text-xs px-2 py-1 rounded-full',
                    t.exitReason === 'stop_loss' ? 'bg-red-500/10 text-red-400' :
                    t.exitReason === 'trend_collapse' ? 'bg-orange-500/10 text-orange-400' :
                    t.exitReason === 'weak_trend' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-gray-700/50 text-gray-400'
                  )}>
                    {EXIT_LABELS[t.exitReason] ?? t.exitReason}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
