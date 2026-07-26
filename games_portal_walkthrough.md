# 🚀 스파크 게임즈 (Spark Games) 개발 가이드 & 워크스루

본 게임 포털 허브는 **HTML5 기술**과 **바닐라 CSS/JS 및 글래스모피즘(Glassmorphic) 우주 네온 디자인**을 결합하여 제작된 고품질 웹 게임 허브 사이트입니다. 구글 애드센스 광고 수익 극대화, 모바일/PC 반응형 레이아웃, 실시간 방문자 및 클릭수 트래킹, 다국어 지원 등을 완벽하게 제공합니다.

---

## 📂 파일 구조 및 연결 정보

모든 링크 경로는 상대 경로를 사용하여 폴더를 이동하거나 서버에 배포하더라도 깨지지 않고 유연하게 유지됩니다.

- 🏠 **메인 포털 인덱스**: [index.html](file:///c:/nas/mj/%EB%B9%84%EC%A6%88%EB%8B%88%EC%8A%A4/%EC%9C%A0%ED%8A%9C%EB%B8%8C-SNS-%EC%BA%90%EB%A6%AD%ED%84%B0-%EC%95%A0%EB%8B%88/ai%EC%82%AC%EC%9D%B4%ED%8A%B8/AI-mj%EA%B3%B5%EC%9E%91%EC%8B%A4/02-Spark-Game-Studio/0-games/index.html)
- 🍪 **쿠키 대탈주 기동 파일**: [cookie_run_game/index.html](file:///c:/nas/mj/%EB%B9%84%EC%A6%88%EB%8B%88%EC%8A%A4/%EC%9C%A0%ED%8A%9C%EB%B8%8C-SNS-%EC%BA%90%EB%A6%AD%ED%84%B0-%EC%95%A0%EB%8B%88/ai%EC%82%AC%EC%9D%B4%ED%8A%B8/AI-mj%EA%B3%B5%EC%9E%91%EC%8B%A4/02-Spark-Game-Studio/0-games/cookie_run_game/index.html) (기존 `index3.html` 복사본 생성 완료)

---

## ✨ 구현된 핵심 기능

### 1. 🌐 한/영 다국어 실시간 전환 (Bilingual Mode)
- **번역 범위**: 우측 상단 `KO | EN` 스위치 클릭 시 페이지 새로고침 없이 전체 UI 텍스트, 검색창 플레이스홀더, 게임 타이틀, 게임 설명, 카테고리 태그 및 광고 안내까지 실시간으로 완전 번역됩니다.
- **저장 및 유지**: 사용자가 선택한 언어(ko/en)는 `localStorage`에 자동 저장되어 사이트 재방문 시 해당 언어로 먼저 자동 세팅됩니다.

### 2. 📊 동적 카운터 시스템 (Live Tracking System)
- **누적 방문자**: `localStorage`를 활용하여 페이지가 로드되거나 새로고침 될 때마다 실제 사이트처럼 실시간으로 방문자 수(1~3명씩)가 지속 증가하여 생동감 넘치는 사이트 분위기를 제공합니다.
- **게임별 플레이 횟수**: 각 게임 카드와 상세 정보 팝업에 "플레이 횟수(plays)"가 표시됩니다. 사용자가 **지금 플레이하기!**를 누를 때마다 해당 게임의 고유 플레이 횟수가 1씩 상승하며 메인 화면의 **총 플레이 횟수** 합산값도 실시간으로 반영됩니다.

### 3. ⏰ 최근 플레이한 게임 (Recently Played History)
- 사용자가 플레이한 최신 게임들을 기억하여 메인 화면 최상단에 **⏰ 최근 플레이한 게임** 슬라이더 영역을 동적으로 노출합니다. (플레이 기록이 없을 때는 깔끔하게 숨겨져 비활성화됩니다.)

### 4. 🚀 광고 로딩 전면 스크린 (Ad Interstitial Preloader)
- 사용자가 게임을 시작하면 포털을 완전히 이탈하지 않고 포털 내에서 **풀스크린 게임 플레이 오버레이(Iframe)**가 작동합니다.
- 게임 실행 전 **3초 안전 링크 연결 및 애드센스 대기 스크린**이 동작하여 고단가 애드센스 전면광고 노출 효과(높은 CTR)를 발휘합니다. 3초 카운트다운 후 자동으로 혹은 시작 버튼을 눌러 게임이 실행됩니다.

---

## 🛠️ 유지 보수 및 확장 방법 (How-To)

### 1. ➕ 새로운 게임 추가하기
새 게임을 추가하려면 `index.html` 파일 하단 `<script>` 영역의 `GAMES_DATA` 객체에 한 줄만 추가해 주시면 됩니다.

```javascript
// index.html 내 약 800라인 부근 GAMES_DATA에 추가 예시
'new-game-folder': {
  id: 'new-game-folder',       // 폴더명과 일치하게 설정
  emoji: '🎮',                 // 게임에 어울리는 대표 이모지
  path: 'new-game-folder/index.html', // 실행 경로
  cat: 'action',               // 카테고리 (action / arcade / shooting / puzzle 중 하나)
  badge: 'new',                // 카드에 붙을 배지 (new, hot, best 혹은 공백 '')
  clicksSeed: 1200,            // 초기 가짜 조회수 기본 시드값
  ko: { title: '한국어 게임 제목', desc: '간략한 한국어 게임 설명글을 여기에 적어줍니다.' },
  en: { title: 'English Title', desc: 'Write a short English game description here.' }
}
```

### 2. 💵 실제 구글 애드센스 광고 코드 적용하기
현재 포털에는 프리미엄 다크 테마에 어울리도록 아름답게 템플릿화된 애드센스 플레이스홀더 4개가 내장되어 있습니다. 실제 애드센스 코드로 대체하는 방법은 다음과 같습니다.

`index.html`에서 각 광고 영역의 주석 처리를 해제하고 본인의 애드센스 코드를 복사해서 붙여넣으시면 됩니다.

*   **상단 광고 배너 (약 620라인 부근)**: `class="adsense-unit"` 내부
*   **사이드바 세로 광고 (약 655라인 부근)**: `class="ad-skyscraper"` 내부
*   **하단 광고 배너 (약 665라인 부근)**: 두 번째 `class="adsense-unit"` 내부
*   **게임 프리로더 전면 광고 (약 722라인 부근)**: `class="interstitial-ad-card"` 내부

```html
<!-- 구글 애드센스 실제 적용 예시 코드 -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-자신의회원번호"
     data-ad-slot="자신의광고슬롯번호"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

---

## 📈 포털의 이점 및 수익 모델 분석
1.  **세션 유지 극대화**: 전체 화면 Iframe 구조와 내비게이션 바 덕분에 사용자가 게임을 하다가 홈으로 돌아오는 과정이 물 흐르듯 유기적으로 이어져 포털 체류 시간이 압도적으로 증가합니다.
2.  **모바일 최적화 레이아웃**: 터치 기반 스크롤 카테고리, 바텀 드로어 팝업, 간편 내비게이션 바 등 네이티브 앱 같은 편리한 모바일 조작감을 선사합니다.
3.  **높은 CTR 애드센스 설계**: 게임 진입 직전 강제되는 3초 딜레이 스크린에 전면형 모바일 광고를 띄워 차원이 다른 높은 광고 노출 수익을 창출할 수 있습니다.
