import type { Metadata } from 'next';
import { Mail, MessageSquare, Github } from 'lucide-react';

export const metadata: Metadata = {
  title: '문의',
  description: 'PivotSim에 대한 문의사항, 피드백, 버그 리포트를 보내주세요.',
};

export default function ContactPage() {
  return (
    <div className="bg-grid min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-14">
          <h1 className="text-5xl font-black text-white mb-4">
            <span className="text-emerald-400">문의</span>하기
          </h1>
          <p className="text-gray-400 text-lg">
            서비스 개선을 위한 피드백, 버그 리포트, 전략 관련 문의를 환영합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            {
              icon: <Mail className="w-6 h-6" />,
              title: '이메일',
              desc: '일반 문의 및 비즈니스 제안',
              value: 'contact@pivotsim.app',
              link: 'mailto:contact@pivotsim.app',
            },
            {
              icon: <Github className="w-6 h-6" />,
              title: 'GitHub',
              desc: '버그 리포트 및 코드 기여',
              value: 'karibs/understand_codebase_seconds',
              link: 'https://github.com/karibs/understand_codebase_seconds',
            },
            {
              icon: <MessageSquare className="w-6 h-6" />,
              title: '피드백',
              desc: '전략 개선 아이디어',
              value: 'GitHub Issues',
              link: 'https://github.com/karibs/understand_codebase_seconds/issues',
            },
          ].map(item => (
            <a
              key={item.title}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="card group hover:border-emerald-500/30 transition-all hover:-translate-y-1 block"
            >
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-4 group-hover:bg-emerald-500/20 transition-colors">
                {item.icon}
              </div>
              <h3 className="text-white font-semibold mb-1">{item.title}</h3>
              <p className="text-gray-500 text-xs mb-3">{item.desc}</p>
              <p className="text-emerald-400 text-xs font-mono break-all">{item.value}</p>
            </a>
          ))}
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-white mb-6">자주 묻는 질문</h2>
          <div className="space-y-6">
            {[
              {
                q: '어떤 종목을 지원하나요?',
                a: '국내 주식(KRX)은 6자리 종목코드(예: 005930)를, 해외 주식은 영문 티커(예: AAPL, TSLA)를 입력하면 됩니다. Yahoo Finance에서 지원하는 모든 종목이 대상입니다.',
              },
              {
                q: '데이터는 얼마나 최신인가요?',
                a: '야후 파이낸스 API를 통해 거의 실시간(15~20분 지연)으로 데이터를 불러옵니다. 백테스트는 종료일까지의 데이터를 사용합니다.',
              },
              {
                q: '이 전략으로 실제 투자해도 되나요?',
                a: '본 서비스는 교육 및 연구 목적으로 만들어졌습니다. 과거 수익률이 미래 수익을 보장하지 않으며, 실제 투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다.',
              },
              {
                q: '파라미터를 어떻게 설정하면 좋나요?',
                a: '기본값(피봇 20일, 손절 3%, 거래량 1.5배)은 한국 대형주에 최적화된 값입니다. 해외 주식이나 변동성이 다른 종목은 손절 비율을 조정해보세요.',
              },
            ].map(faq => (
              <div key={faq.q} className="border-b border-gray-800 last:border-0 pb-6 last:pb-0">
                <h3 className="text-white font-medium mb-2">Q. {faq.q}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">A. {faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
