# 팔봉중 앱팩토리 페스티벌

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

GitHub Pages 배포와 별개로, 별점·댓글 권한 변경은 Firebase 규칙을 한 번 배포해야 합니다.

```sh
firebase login --reauth
firebase deploy --only firestore:rules --project app-factory-festival
```

## 데이터 범위

등록 작품, 응원과 별점, 댓글, 동아리 소개, 일정, 핵심 멤버, 멤버 승인 상태는 Firebase Firestore에 저장되어 모든 방문자에게 실시간으로 반영됩니다. 별점은 로그인 사용자별 1~5점으로 저장되고 평균과 참여 인원이 작품에 집계됩니다. 댓글은 로그인 사용자별로 작품당 하나를 남기며 수정·삭제할 수 있습니다. Google 학교 계정(`@g.cnees.kr`)으로 로그인한 승인 멤버와 관리자만 작품을 등록할 수 있으며, 빠른 등록은 관리자 화면에서만 사용할 수 있습니다. 작품과 일정·멤버 삭제는 기본적으로 숨김 처리하고, 관리자가 복구하거나 영구 삭제할 수 있습니다.

기본 5개 작품은 Firestore에 초기 데이터로 등록되어 있으며, 이후 삭제한 작품을 자동으로 재생성하지 않습니다. 기본 작품은 내장 데모로 실행합니다. 신규 작품은 등록한 HTTP/HTTPS URL을 새 탭으로 열며, 공유 버튼은 해당 URL을 복사합니다. 작품별 사용 AI 도구는 선택적으로 기록되며, 동아리 소개에서 공개 작품 기준으로 안내합니다. 작품 수정은 관리자 또는 해당 작품을 등록한 로그인 사용자만 할 수 있으며, 별점·플레이 수·댓글 수·하트 수와 등록자 UID는 수정할 수 없습니다. Firestore 보안 규칙은 공개 조회, 학교 계정과 승인 멤버 등록, 등록자 본인·관리자의 작품 수정, 사용자별 1회 응원, 관리자 승인·숨김·복구·영구 삭제를 적용합니다.

원본 HTML·이미지·디자인 자료와 HTML 검토본(`reference-html/`)은 로컬 폴더에 보존되어 있으며 배포에는 포함되지 않습니다.

## PC 갤러리와 실제 첫 화면 썸네일

갤러리는 화면 폭 768px 미만에서 1열, 768~1199px에서 2열, 1200px 이상에서 3열입니다. 갤러리의 최대 폭은 1200px이며 다른 탭의 폭은 유지합니다. 검색으로 작품이 하나만 남아도 카드 폭은 유지됩니다. 실행 버튼은 이미지 아래에 배치해 화면을 가리지 않습니다.

기존 공개 작품의 첫 화면은 `public/project-thumbnails/`에 1280×720 WebP로 보관하고, `src/data/projectThumbnails.json`에 원본 주소와 촬영 시각을 기록합니다. 등록 주소가 촬영 주소와 일치할 때만 사용하며, 서버에서 새로 생성하거나 직접 등록한 이미지가 있으면 그것을 우선합니다. 이 정적 미리보기는 GitHub Pages만으로 동작합니다.

기존 작품의 첫 화면을 다시 준비하려면:

```powershell
npm ci --prefix functions --ignore-scripts
$env:CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
node functions/scripts/capture-existing.mjs
node functions/scripts/preview-thumbnails.mjs
npm run build
```

성공한 동일 주소의 캡처는 재사용합니다. 다시 촬영하려면 `CAPTURE_FORCE=1`을 설정합니다. 공개 Firestore 문서를 읽고 로컬 파일만 생성하며 운영 문서는 변경하지 않습니다. 결과는 미리보기 모음에서 확인한 뒤 배포합니다. 로그인·초기 설정 창이 첫 화면이면 그 화면이 촬영됩니다.

## 자동 썸네일 서버 활성화

`functions/`는 데이터베이스와 같은 서울(`asia-northeast3`) 지역의 Firebase Functions 2세대 서버입니다. 기본 빌드에서 `VITE_THUMBNAIL_SERVICE_ENABLED=false`로 서버 전용 버튼을 숨깁니다. 자동 생성과 직접 이미지 등록은 다음 설정 완료 후 활성화해야 합니다.

1. `app-factory-festival` 프로젝트에 사용자가 승인한 Blaze 결제 계정을 연결하고 Firebase Storage 기본 버킷 `app-factory-festival.firebasestorage.app`을 생성합니다. 이 설정은 비용이 발생할 수 있어 코드 작업에서 자동으로 변경하지 않습니다.
2. Node.js 22 환경에서 `npm ci --prefix functions --ignore-scripts`를 실행합니다.
3. `firebase deploy --only functions:thumbnails,storage --project app-factory-festival`로 서버와 Storage 규칙을 배포합니다. 기존 Firestore 규칙은 썸네일 필드와 작업 문서의 클라이언트 수정을 이미 허용하지 않습니다.
4. 로컬 `.env.local` 또는 GitHub 저장소 Actions 변수에 `VITE_THUMBNAIL_SERVICE_ENABLED=true`를 설정하고 웹사이트를 빌드·배포합니다.
5. 관리자로 갤러리의 **기존 작품 썸네일 전환**을 실행합니다. 한 번에 20개씩 확인하고 이미 처리한 작품과 숨긴 작품은 건너뜁니다.

서버 동작:

- 등록·주소 변경을 감지해 별도 작업 문서에 요청을 기록합니다. 이전 주소의 결과와 중복 실행은 현재 요청을 덮어쓰지 않습니다.
- 공개 주소를 로그아웃 상태에서 1280×720로 열고 첫 화면을 저장합니다. 기존 이미지는 새 이미지가 준비될 때까지 유지합니다.
- 등록자·관리자는 1분 간격으로 새로고침하거나 3MB 이하 PNG/JPEG/WebP를 직접 등록할 수 있습니다. 서버는 이미지 내용을 검증하고 16:9 WebP로 변환합니다.
- 로그인 뒤의 화면은 자동 수집하지 않습니다. 캡처 차단, 접속 오류, 저장소 주소는 직접 이미지 등록이나 실제 웹앱 주소 입력으로 처리합니다.
- 사설·루프백·메타데이터 주소, 위험한 포트와 프로토콜을 차단합니다. DNS 검증 후 해당 IP에 연결을 고정하고 리디렉션과 하위 리소스도 검증합니다. 브라우저의 직접 네트워크 연결은 차단합니다.
- 캡처 동시 실행 수와 시간·요청·이미지 크기를 제한합니다. 저장된 썸네일을 재사용하며 방문할 때마다 촬영하지 않습니다.

검증 명령:

```sh
npm run lint
npm run build
npm test
npm run test:unit
npm test --prefix functions
firebase emulators:exec --config firebase.emulators.json --only firestore,storage --project demo-app-factory "node --test functions/test/jobs.emulator.mjs"
node scripts/preview-gallery.cjs
```

에뮬레이터 테스트는 운영 데이터에 접근하지 않는 `demo-app-factory` 프로젝트에서 권한·요청 중복·주소 변경·실패 복구·업로드·기존 작품 전환을 확인합니다. 화면 검증 도구는 공개 작품을 읽어 PC·태블릿·모바일 이미지를 `test-results/`에 저장합니다.

운영 사이트 검증 시 `GALLERY_BASE_URL=https://ddasik76-cmd.github.io/app-factory-festival/`을 설정하고 `node scripts/preview-gallery.cjs`를 실행합니다.

서버 배포 후 운영자가 기존 Firebase CLI 로그인으로 초기 전환을 실행할 수도 있습니다. `FIREBASE_TOOLS_AUTH_PATH`를 설치된 `firebase-tools/lib/auth.js`의 절대 경로로 지정하고 `node scripts/migrate-live-thumbnails.cjs`를 실행하면 조회만 합니다. 실제 요청 등록은 `--enqueue`, 시험 대상 수 제한은 `--limit=1`, 실패한 항목 재요청은 `--retry-failed`를 명시합니다. 작품의 동시 변경을 덮어쓰지 않도록 문서 변경 시각을 확인하고 원자적으로 요청을 기록합니다. 인증 토큰은 출력하거나 파일에 저장하지 않습니다.
