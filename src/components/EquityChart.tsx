'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

interface EquityPoint {
  date: string;
  equity: number;
}

interface Props {
  data: EquityPoint[];
  initialCapital: number;
}

function formatKRW(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  return `${(v / 1_000).toFixed(0)}K`;
}

function formatDate(d: string) {
  return d.slice(0, 7); // YYYY-MM
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-emerald-400 font-bold text-base">
        ₩{payload[0].value.toLocaleString()}
      </p>
    </div>
  );
};

export default function EquityChart({ data, initialCapital }: Props) {
  if (!data.length) return (
    <div className="h-72 flex items-center justify-center text-gray-600 text-sm">
      데이터 없음
    </div>
  );

  const isProfit = data[data.length - 1]?.equity >= initialCapital;
  const color = isProfit ? '#10b981' : '#f87171';

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="date"
            stroke="#374151"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickFormatter={formatDate}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#374151"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickFormatter={formatKRW}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={initialCapital} stroke="#374151" strokeDasharray="4 4" />
          <Area
            type="monotone"
            dataKey="equity"
            stroke={color}
            strokeWidth={2}
            fill="url(#equityGrad)"
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
