# 앱팩토리 페스티벌

React + TypeScript + Vite로 만든 학생 웹앱 갤러리입니다.

## 실행

Node.js 22 이상과 npm을 사용합니다.

```sh
npm ci
npm run dev
```

## 검증 및 빌드

```sh
npm run lint
npm run build
npm test
```

브라우저 테스트는 설치된 Google Chrome을 사용합니다. 빌드된 `dist`를 GitHub Pages와 같은 하위 경로에서 제공하여 검색/필터, 등록 권한 안내, 안전한 URL, 모바일 화면과 모달 포커스, 오디오 자원 정리를 검증합니다.

## 배포

`main`에 푸시하면 `.github/workflows/deploy.yml`이 잠금 파일 기준 설치, 타입 검사, 빌드를 거쳐 GitHub Pages로 배포합니다. 저장소 Settings → Pages의 Source는 **GitHub Actions**여야 합니다.

- 사이트: https://ddasik76-cmd.github.io/app-factory-festival/
- GitHub: https://github.com/ddasik76-cmd/app-factory-festival

## 데이터 범위

등록 작품, 응원과 별점, 동아리 소개, 일정, 핵심 멤버, 멤버 승인 상태는 Firebase Firestore에 저장되어 모든 방문자에게 실시간으로 반영됩니다. Google 학교 계정(`@g.cnees.kr`)으로 로그인한 승인 멤버와 관리자만 작품을 등록할 수 있으며, 빠른 등록은 관리자 화면에서만 사용할 수 있습니다. 작품과 일정·멤버 삭제는 기본적으로 숨김 처리하고, 관리자가 복구하거나 영구 삭제할 수 있습니다.

기본 5개 작품은 첫 로그인 시 Firestore에 한 번 등록됩니다. 기본 작품은 내장 데모로 실행합니다. 신규 작품은 등록한 HTTP/HTTPS URL을 새 탭으로 열며, 공유 버튼은 해당 URL을 복사합니다. 작품별 사용 AI 도구는 선택적으로 기록되며, 동아리 소개에서 공개 작품 기준으로 안내합니다. Firestore 보안 규칙은 공개 조회, 학교 계정과 승인 멤버 등록, 사용자별 1회 응원, 관리자 승인·숨김·복구·영구 삭제를 적용합니다.

원본 HTML·이미지·디자인 자료와 HTML 검토본(`reference-html/`)은 로컬 폴더에 보존되어 있으며 배포에는 포함되지 않습니다.
