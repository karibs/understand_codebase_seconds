import type { Metadata } from 'next';
import { TrendingUp, Shield, BarChart2, Activity, Zap, Target } from 'lucide-react';

export const metadata: Metadata = {
  title: '전략 소개',
  description: '피봇 포인트, 이치모쿠 클라우드, 이동평균선을 결합한 스윙 트레이딩 전략의 원리와 매매 규칙을 자세히 설명합니다.',
};

const strategySteps = [
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: '1단계: 추세 확인 (Trend Score)',
    desc: '6가지 조건을 점수화해 현재 추세 강도를 0~6점으로 평가합니다.',
    items: [
      '종가 > 20일 이동평균선',
      '20일 이평선 > 50일 이평선',
      '20일 이평선 기울기 양(+)',
      '종가 > 이치모쿠 기준선',
      '종가 > 이치모쿠 구름대 상단',
      '텐칸선 > 기준선',
    ],
    note: '5~6점: 강한 상승 / 3~4점: 상승 / 1~2점: 중립 / 0점: 하락',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: '2단계: 매수 신호 발생 (BUY_1)',
    desc: '추세 점수 4점 이상일 때 아래 두 가지 조건 중 하나가 충족되면 매수 신호가 발생합니다.',
    items: [
      '강한 돌파: 거래량 1.5배 초과 + 20일 최고가 돌파',
      '눌림목 진입: 20일 이평선 부근(±2%) + 긴 아랫꼬리 + 양봉',
    ],
    note: '첫 매수 시 전체 자본의 40%를 투입합니다.',
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: '3단계: 피라미딩 (BUY_2/3/4)',
    desc: '수익이 발생하면 단계적으로 포지션을 확대합니다.',
    items: [
      'BUY_2: 수익률 3% 이상 → 70%까지 확대',
      'BUY_3: 수익률 6% 이상 → 90%까지 확대',
      'BUY_4: 수익률 10% 이상 → 100%까지 확대',
    ],
    note: '추가 매수 시 평균 매수가가 높아지므로 추세 확인이 필수입니다.',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: '4단계: 청산 조건 (SELL)',
    desc: '다음 중 하나라도 충족되면 전량 청산합니다.',
    items: [
      '손절: 평균 매수가 대비 -3% 하락',
      '추세 붕괴: 종가 < 20일선 AND 기준선 AND 구름대 동시 이탈',
      '약세 전환: 추세 점수 0점 (WEAK)',
    ],
    note: '추세 점수 ≤2 + 20일선 하회 시 일부 청산(SELL_PARTIAL)도 가능합니다.',
  },
];

const indicators = [
  {
    icon: <Activity className="w-5 h-5" />,
    name: '피봇 포인트',
    desc: '20일 롤링 최고가(저항)와 최저가(지지)를 추적합니다. 최고가 돌파 시 매수, 최저가 이탈 시 청산 기준으로 활용합니다.',
  },
  {
    icon: <BarChart2 className="w-5 h-5" />,
    name: '이동평균선 (MA)',
    desc: '20일선과 50일선의 정배열 여부, 기울기 방향으로 중단기 추세를 판단합니다. 20일선은 동적 지지선 역할도 합니다.',
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    name: '이치모쿠 클라우드',
    desc: '텐칸선(9일), 기준선(26일), 선행스팬A/B(52일)로 구성됩니다. 구름대는 강력한 지지/저항 구간을 시각화하며, 텐칸>기준 골든크로스가 핵심 매수 조건입니다.',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    name: '거래량 분석',
    desc: '20일 평균 거래량의 1.5배 이상을 돌파 신호 확인에 활용합니다. 거래량 없는 돌파는 허위 신호일 가능성이 높습니다.',
  },
];

export default function AboutPage() {
  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black text-white mb-4">
            전략 <span className="text-emerald-400">소개</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed">
            피봇 포인트, 이치모쿠 클라우드, 이동평균선을 유기적으로 결합한
            시스템 기반 스윙 트레이딩 전략입니다.
          </p>
        </div>

        {/* Overview */}
        <div className="card mb-10 border-emerald-500/20 bg-emerald-500/5">
          <h2 className="text-2xl font-bold text-white mb-4">전략 개요</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            이 전략은 기술적 분석의 세 가지 핵심 도구를 결합해 <strong className="text-emerald-400">추세 방향, 진입 타이밍, 청산 기준</strong>을
            객관적인 규칙으로 정의합니다. 주관적인 판단을 배제하고 일관된 규칙을 따르는 것이 장기적으로
            안정적인 성과를 내는 핵심입니다.
          </p>
          <p className="text-gray-300 leading-relaxed">
            삼성전자(005930) 백테스트 결과, 2020년부터 2026년까지 6년간 초기 자본 1,000만 원을 기준으로
            <strong className="text-emerald-400"> 1,823만 원(+82.4%)</strong>을 달성했습니다.
            총 19회 거래 중 9번 수익, 10번 손실로 승률은 47%이지만,
            수익 거래의 평균 수익이 손실 거래의 평균 손실을 크게 상회하는 구조입니다.
          </p>
        </div>

        {/* Indicators */}
        <h2 className="text-2xl font-bold text-white mb-6">활용 지표</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14">
          {indicators.map(ind => (
            <div key={ind.name} className="card hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400">
                  {ind.icon}
                </div>
                <h3 className="text-white font-semibold">{ind.name}</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{ind.desc}</p>
            </div>
          ))}
        </div>

        {/* Strategy steps */}
        <h2 className="text-2xl font-bold text-white mb-6">매매 규칙 상세</h2>
        <div className="space-y-6 mb-14">
          {strategySteps.map((step) => (
            <div key={step.title} className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                  {step.icon}
                </div>
                <h3 className="text-white font-bold text-lg">{step.title}</h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">{step.desc}</p>
              <ul className="space-y-2 mb-4">
                {step.items.map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-emerald-400 mt-0.5">▸</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="bg-gray-800/50 rounded-lg px-4 py-2.5 text-xs text-gray-400">
                💡 {step.note}
              </div>
            </div>
          ))}
        </div>

        {/* Risk Management */}
        <div className="card border-yellow-500/20 bg-yellow-500/5 mb-10">
          <h2 className="text-xl font-bold text-yellow-400 mb-4">⚠️ 리스크 관리</h2>
          <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
            <p>• <strong>손절 우선</strong>: 아무리 확신이 있어도 평균가 -3% 이탈 시 즉시 청산합니다.</p>
            <p>• <strong>피라미딩 주의</strong>: 추가 매수는 반드시 수익이 난 상태에서만 진행합니다.</p>
            <p>• <strong>과거 데이터 한계</strong>: 백테스트 결과는 과거 데이터에 기반하며, 미래 수익을 보장하지 않습니다.</p>
            <p>• <strong>분산 투자</strong>: 단일 종목에 전체 자산을 투자하지 않는 것을 권장합니다.</p>
          </div>
        </div>

        <div className="card border-gray-700 bg-gray-900/30 text-center">
          <p className="text-gray-500 text-sm">
            본 전략은 교육 및 연구 목적으로 제공됩니다. 실제 투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
