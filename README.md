# Study UI

React + Vite + Tailwind v4 기반의 알고리즘 학습 UI. 주제별(탭) 학습 테이블과 DP 시각화가 포함되어 있습니다.

## Quick Start
- 의존성 설치: `npm install`
- 개발 서버: `npm run dev` → http://localhost:5173
- 프로덕션 빌드: `npm run build`
- 로컬 미리보기: `npm run preview`

## App 구조
- 탭 라우팅: 해시 기반 `#/dp`, `#/greedy`, `#/graph`
- 컴포넌트: `src/StudyScheduleTable.jsx`(학습 테이블), `src/VipSeatingVisualizer.jsx`(DP)
- 스타일: Tailwind v4 (`src/index.css` → `@import "tailwindcss"`)

## 학습 테이블 기능
- 컬럼: 문제, 날짜(react-datepicker), 다시 한번, 주제, Level, 복습(태그)
- 필터/검색: Level, 복습 태그, 키워드
- 로컬 저장: localStorage 자동 저장(주제별 key)
- CSV: 내보내기/가져오기 (헤더: `id,title,date,revisit,topic,level,reviews,link`)
  - `reviews`는 공백으로 구분(`"1일 3일 1주일"`)
- 인라인 편집/삭제, 복습 태그(1일/3일/1주일) 클릭 토글

## Dev‑Only: Context Snapshot 툴
개발 세션 컨텍스트(브랜치/상태/최근 커밋/변경 diff/노트)를 로컬에 저장하여 재개를 돕습니다.

- 스냅샷 생성: `npm run snapshot -- --notes "다음 작업 TODO…"`
- 최신 스냅샷 요약: `npm run restore`
- pre‑push 훅 설치: `npm run setup-hooks` (푸시 전 자동 스냅샷)
- PR 생성(스냅샷 요약 자동 첨부): `npm run pr -- --base main --title "feat: ..."`
- 산출물: `.codex/snapshots/`에 JSON/JSON.GZ/MD

주의
- `.gitignore`에 `.codex/`, `scripts/context-*.mjs`가 포함되어 있어 실수로 메인에 섞이지 않습니다.
- 메인으로 보내는 PR에서는 dev‑only 파일 제외 브랜치(`pr/*-no-snapshot`)를 사용하세요.

## 권장 워크플로우
1) 작업 브랜치 생성: `feat/<topic>`
2) 개발/커밋/푸시(자동 스냅샷): `npm run dev`
3) 종료 직전 스냅샷: `npm run snapshot -- --notes "내일 TODO"`
4) PR용 클린 브랜치: `pr/<topic>-no-snapshot`에 변경만 병합
5) PR 생성: `npm run pr` 또는 GitHub Web UI
6) 머지 후 Vercel 프로덕션 자동 배포

## 배포(Vercel)
- Build Command: `npm run build`
- Output Directory: `dist`
- `vercel.json` 포함
  - SPA rewrite (history 라우터 전환 대비)
  - `/assets/*` 장기 캐시(`immutable`)

## Node/도구
- Node >= 18 권장
- gh CLI(PR 자동 생성): `brew install gh` 후 `gh auth login`

---
필요 시 README를 팀 온보딩/개발 규칙에 맞춰 더 축약하거나 확장해도 좋습니다.

