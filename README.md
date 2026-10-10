# 제주 스노클링 가이드

첨부 PRD와 디자인 문서를 바탕으로 만든 정적 웹사이트입니다. 서버·API 키·패키지 설치가 필요하지 않습니다.

## 실행

이 폴더에서 아래 명령을 실행하고 `http://localhost:8080`을 엽니다.

```powershell
python -m http.server 8080 --directory dist
```

배포할 때는 `dist/` 폴더를 정적 호스팅에 업로드하세요. 모든 화면은 해시 기반 경로이므로 직접 링크와 새로고침을 지원합니다.

## GitHub Pages

- 사이트: https://blackbean0.github.io/jeju-snorkeling-guide/
- 저장소: https://github.com/blackbean0/jeju-snorkeling-guide
- `main` 브랜치에 변경사항을 푸시하면 `.github/workflows/pages.yml`이 `dist/`를 자동 배포합니다.
- GitHub 저장소의 Settings → Pages → Source는 **GitHub Actions**를 사용합니다.

## 구현 내용

- 홈, 사전 안내, 장소 목록·상세, 최대 3곳 비교, 준비물, 출처 안내
- 장소 이름 검색, 지역·확인된 시설 필터
- 기본 7개 / 조건별 3개 / 선택 3개 준비물과 대여 계획
- 메모 500ms 지연 저장, 기록 복원·초기화·저장 실패 안내
- 모바일 하단 메뉴, 키보드 포커스, 접근 가능한 비교표

여섯 장소는 원문 후보이며 현장 정보는 아직 검증되지 않았습니다. 비용·수심·운영 시간을 추측하지 않았습니다. SVG는 이 프로젝트에서 독립적으로 제작한 안내 일러스트이며 현장 사진이 아닙니다. 원문 PDF 자체는 전달되지 않았으므로 다운로드를 제공하지 않습니다.

저장 키: `jeju-snorkel:v1`. 준비물, 메모, 선택 장소, 비교 선택만 해당 브라우저에 저장합니다. 로그인·외부 분석·위치 추적을 사용하지 않습니다.
