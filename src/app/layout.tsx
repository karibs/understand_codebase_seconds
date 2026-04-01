import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: {
    default: 'PivotSim - 주식 피봇 트레이딩 시뮬레이터',
    template: '%s | PivotSim',
  },
  description:
    '피봇 포인트, 이동평균선, 이치모쿠 클라우드를 결합한 스윙 트레이딩 전략을 백테스트하세요. 국내외 주식에 적용 가능한 무료 시뮬레이터.',
  keywords: [
    '주식 시뮬레이터', '피봇 트레이딩', '백테스트', '이치모쿠', '스윙 트레이딩',
    '이동평균', '삼성전자', '주식 전략', '기술적 분석', '퀀트 투자',
  ],
  authors: [{ name: 'PivotSim' }],
  creator: 'PivotSim',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://pivotsim.vercel.app',
    siteName: 'PivotSim',
    title: 'PivotSim - 주식 피봇 트레이딩 시뮬레이터',
    description: '피봇 포인트 + 이치모쿠 + 이동평균 전략 백테스트 플랫폼',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* Google AdSense - 승인 후 아래 코드를 활성화하세요 */}
        {/* <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
        /> */}
      </head>
      <body className="bg-gray-950 text-white antialiased">
        <Navbar />
        <main className="min-h-screen pt-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
