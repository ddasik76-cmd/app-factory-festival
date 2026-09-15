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

브라우저 테스트는 설치된 Google Chrome을 사용합니다. 빌드된 `dist`를 GitHub Pages와 같은 하위 경로에서 제공하여 검색/필터, 등록 후 재방문, 안전한 URL, 저장 및 공유 실패, 모바일 화면과 모달 포커스, 오디오 자원 정리를 검증합니다.

## 배포

`main`에 푸시하면 `.github/workflows/deploy.yml`이 잠금 파일 기준 설치, 타입 검사, 빌드를 거쳐 GitHub Pages로 배포합니다. 저장소 Settings → Pages의 Source는 **GitHub Actions**여야 합니다.

- 사이트: https://ddasik76-cmd.github.io/app-factory-festival/
- GitHub: https://github.com/ddasik76-cmd/app-factory-festival

## 데이터 범위

등록 작품, 응원과 별점은 **현재 브라우저의 localStorage**에만 저장됩니다. 로그인, 관리자 권한, 공용 서버, 기기 간 동기화는 없습니다. 브라우저 데이터 삭제 시 등록 자료도 사라집니다. 저장에 실패하면 성공 메시지를 표시하지 않고 입력 내용을 유지합니다.

기본 5개 작품, 순위 및 실적, 프로필은 제공된 디자인의 예시입니다. 기본 작품은 내장 데모로 실행합니다. 신규 작품은 등록한 HTTP/HTTPS URL을 새 탭으로 열며, 공유 버튼은 해당 URL을 복사합니다. 외부 서비스가 차단되어도 로컬 아이콘과 대체 이미지로 화면을 사용할 수 있습니다.

원본 HTML·이미지·디자인 자료와 HTML 검토본(`reference-html/`)은 로컬 폴더에 보존되어 있으며 배포에는 포함되지 않습니다.
