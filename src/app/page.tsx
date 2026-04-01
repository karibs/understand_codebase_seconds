import Link from 'next/link';
import { TrendingUp, BarChart2, Shield, Zap, ChevronRight, Activity } from 'lucide-react';

const stats = [
  { label: '삼성전자 백테스트 수익률', value: '+82.4%', sub: '2020–2026 (6년)', color: 'text-emerald-400' },
  { label: '연평균 수익률', value: '+10.7%', sub: 'CAGR', color: 'text-emerald-400' },
  { label: '총 거래 횟수', value: '19회', sub: '6년간', color: 'text-cyan-400' },
  { label: '초기 자본 대비', value: '1.82배', sub: '₩10M → ₩18.2M', color: 'text-emerald-400' },
];

const features = [
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: '피봇 포인트 전략',
    desc: '20일 롤링 최고/최저가를 이용한 돌파 매수와 지지선 이탈 시 청산 전략으로 명확한 매매 기준을 제시합니다.',
  },
  {
    icon: <Activity className="w-6 h-6" />,
    title: '이치모쿠 클라우드',
    desc: '텐칸·기준·선행스팬을 활용해 추세 방향과 지지/저항 구간을 동시에 파악합니다.',
  },
  {
    icon: <BarChart2 className="w-6 h-6" />,
    title: '피라미딩 전략',
    desc: '40% → 70% → 90% → 100% 단계적 포지션 확대로 리스크를 관리하며 수익을 극대화합니다.',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: '자동 손절 관리',
    desc: '평균 매수가 대비 3% 하락 시 자동 손절, 추세 붕괴 시 전량 청산으로 손실을 제한합니다.',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: '거래량 필터',
    desc: '20일 평균 거래량의 1.5배 이상일 때만 매수 신호를 발생시켜 허위 돌파를 걸러냅니다.',
  },
  {
    icon: <BarChart2 className="w-6 h-6" />,
    title: '실시간 백테스트',
    desc: '야후 파이낸스 데이터를 기반으로 국내외 모든 종목에 전략을 적용해 결과를 즉시 확인합니다.',
  },
];

const howItWorks = [
  {
    step: '01',
    title: '종목 & 기간 선택',
    desc: '종목코드(예: 005930)와 백테스트 기간을 입력합니다. 국내주식 6자리, 해외주식 영문 티커 모두 지원합니다.',
  },
  {
    step: '02',
    title: '전략 파라미터 설정',
    desc: '피봇 윈도우, 손절 비율, 거래량 배수 등 전략 파라미터를 자유롭게 조정합니다.',
  },
  {
    step: '03',
    title: '시뮬레이션 실행',
    desc: '버튼 클릭 한 번으로 수년간의 매매를 시뮬레이션하고 자산 곡선, 거래 내역, 핵심 지표를 확인합니다.',
  },
];

export default function HomePage() {
  return (
    <div className="bg-grid bg-gray-950">
      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        <div className="text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-8">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-sm font-medium">무료 · 회원가입 불필요</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
            주식 피봇 트레이딩
            <br />
            <span className="text-glow text-emerald-400">시뮬레이터</span>
          </h1>

          <p className="text-gray-400 text-xl md:text-2xl max-w-3xl mx-auto mb-10 leading-relaxed">
            피봇 포인트 · 이치모쿠 · 이동평균을 결합한<br className="hidden md:block" />
            스윙 트레이딩 전략을 원하는 종목에 즉시 백테스트하세요.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/simulator" className="btn-primary text-lg px-8 py-4 glow-emerald-sm inline-flex items-center gap-2 justify-center">
              시뮬레이터 시작하기
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link href="/about" className="btn-secondary text-lg px-8 py-4 inline-flex items-center gap-2 justify-center">
              전략 자세히 보기
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="card-sm text-center hover:border-emerald-500/30 transition-colors">
                <div className={`text-3xl font-black ${s.color} stat-value`}>{s.value}</div>
                <div className="text-gray-500 text-xs mt-1">{s.sub}</div>
                <div className="text-gray-400 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AdSense placeholder - 승인 후 활성화 */}
      {/* <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ins className="adsbygoogle" style={{display:'block'}} data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" data-ad-slot="XXXXXXXXXX" data-ad-format="auto" />
      </div> */}

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-white mb-4">전략 핵심 기능</h2>
          <p className="text-gray-400 text-lg">검증된 기술적 분석 도구의 조합</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card group hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-4 group-hover:bg-emerald-500/20 transition-colors">
                {f.icon}
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-white mb-4">사용 방법</h2>
          <p className="text-gray-400 text-lg">3단계로 시작하는 백테스트</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-px bg-gradient-to-r from-emerald-500/20 via-emerald-500/50 to-emerald-500/20" />
          {howItWorks.map((step) => (
            <div key={step.step} className="card text-center relative">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5 glow-emerald-sm">
                <span className="text-emerald-400 font-black text-xl">{step.step}</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-3">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="card border-yellow-500/20 bg-yellow-500/5">
          <p className="text-yellow-400/80 text-xs leading-relaxed text-center">
            ⚠️ 본 서비스는 교육 및 연구 목적으로 제공됩니다. 과거 수익률은 미래 수익을 보장하지 않으며,
            모든 투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다.
            본 시뮬레이터의 결과를 실제 투자에 직접 활용하여 발생한 손실에 대해 책임을 지지 않습니다.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="card text-center glow-emerald border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            회원가입 없이 무료로 원하는 종목의 피봇 트레이딩 전략을 백테스트해보세요.
          </p>
          <Link href="/simulator" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
            시뮬레이터 열기
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
