import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              <span className="text-lg font-bold text-white">Pivot<span className="text-emerald-400">Sim</span></span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              피봇 포인트, 이동평균, 이치모쿠 클라우드를 결합한 스윙 트레이딩 전략 시뮬레이터입니다.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">바로가기</h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/', label: '홈' },
                { href: '/simulator', label: '시뮬레이터' },
                { href: '/about', label: '전략 소개' },
                { href: '/contact', label: '문의' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-gray-500 hover:text-emerald-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">법적 고지</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-gray-500 hover:text-emerald-400 transition-colors">
                  개인정보처리방침
                </Link>
              </li>
            </ul>
            <p className="text-gray-600 text-xs mt-4 leading-relaxed">
              본 서비스는 교육 목적으로 제공되며, 투자 손실에 대한 책임을 지지 않습니다.
              과거 수익률이 미래 수익을 보장하지 않습니다.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
          <span>© {new Date().getFullYear()} PivotSim. All rights reserved.</span>
          <span>투자에는 원금 손실 위험이 있습니다.</span>
        </div>
      </div>
    </footer>
  );
}
