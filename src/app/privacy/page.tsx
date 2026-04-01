import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: 'PivotSim의 개인정보처리방침입니다.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-black text-white mb-2">개인정보처리방침</h1>
      <p className="text-gray-500 text-sm mb-10">최종 수정일: 2024년 1월 1일</p>

      <div className="space-y-10 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-4">1. 개인정보 처리 목적</h2>
          <p>
            PivotSim(이하 "서비스")은 별도의 회원가입이나 로그인을 요구하지 않습니다.
            서비스 이용에 있어 사용자의 개인정보를 수집하거나 저장하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">2. 수집하는 정보</h2>
          <p className="mb-3">본 서비스는 다음과 같은 비개인식별 정보를 자동으로 수집할 수 있습니다:</p>
          <ul className="space-y-2 ml-4">
            <li>• 브라우저 종류 및 버전</li>
            <li>• 접속 IP 주소 (서버 로그, 익명 처리됨)</li>
            <li>• 방문 페이지 및 체류 시간</li>
            <li>• 접속 시간 및 날짜</li>
          </ul>
          <p className="mt-3">위 정보는 서비스 품질 개선 및 통계 목적으로만 사용되며, 제3자에게 제공되지 않습니다.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">3. 쿠키 사용</h2>
          <p className="mb-3">
            본 서비스는 사용자 경험 향상을 위해 쿠키를 사용할 수 있습니다. 쿠키는 사용자의 브라우저에 저장되는 소규모 텍스트 파일로,
            서비스 이용 편의성을 높이기 위해 활용됩니다.
          </p>
          <p>
            브라우저 설정을 통해 쿠키 저장을 거부할 수 있으며, 이 경우 일부 서비스 기능이 제한될 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">4. 광고 서비스 (Google AdSense)</h2>
          <p className="mb-3">
            본 서비스는 Google AdSense를 통해 광고를 제공할 수 있습니다.
            Google AdSense는 사용자의 관심사에 기반한 광고를 제공하기 위해 쿠키를 사용합니다.
          </p>
          <p className="mb-3">
            Google의 광고 쿠키 사용에 대한 자세한 내용은{' '}
            <a
              href="https://policies.google.com/technologies/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              Google 광고 정책
            </a>
            을 참조하시기 바랍니다.
          </p>
          <p>
            사용자는{' '}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              Google 광고 설정
            </a>
            에서 맞춤 광고를 비활성화할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">5. 제3자 서비스</h2>
          <p className="mb-3">본 서비스는 다음 제3자 서비스를 활용합니다:</p>
          <ul className="space-y-2 ml-4">
            <li>• <strong className="text-white">Yahoo Finance API</strong>: 주식 시세 데이터 제공 (사용자 데이터 미전송)</li>
            <li>• <strong className="text-white">Vercel</strong>: 웹 호스팅 서비스</li>
            <li>• <strong className="text-white">Google Analytics</strong>: 방문자 통계 분석 (익명 데이터)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">6. 외부 링크</h2>
          <p>
            본 서비스에는 외부 웹사이트로 연결되는 링크가 포함될 수 있습니다.
            외부 사이트의 개인정보처리방침은 해당 사이트의 책임이며, 본 서비스와 무관합니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">7. 아동 개인정보 보호</h2>
          <p>
            본 서비스는 만 14세 미만 아동을 대상으로 하지 않으며,
            아동의 개인정보를 의도적으로 수집하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">8. 개인정보처리방침 변경</h2>
          <p>
            본 개인정보처리방침은 서비스 변경 또는 법령 개정에 따라 업데이트될 수 있습니다.
            변경 시 본 페이지 상단의 최종 수정일이 갱신됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">9. 문의</h2>
          <p>
            개인정보 처리에 관한 문의사항은{' '}
            <a href="/contact" className="text-emerald-400 hover:underline">문의 페이지</a>를 통해 연락주시기 바랍니다.
          </p>
        </section>
      </div>
    </div>
  );
}
