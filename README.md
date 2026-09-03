# LOCAL:ON React V1

관광 데이터 기반 로컬 여행 코스 추천 서비스의 1차 프론트엔드 구현입니다.

## 실행

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

## 환경변수

`.env.example`을 복사해 `.env` 생성:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Spring Boot 운영 서버 주소가 생기면 해당 URL만 변경합니다.

## 현재 화면

- `/` : 전국 지도 + 로컬 발견 지역
- `/region/gyeongju` : 지역 관광 집중도 분석
- `/course/setup/gyeongju` : 추천 조건 설정
- `/course/result` : 추천 코스 결과
- `/places/seongdong-market` : 장소 상세

## Spring Boot 연동 포인트

`src/api/tourismApi.js`의 API 함수들을 사용합니다.

예상 엔드포인트:

- `GET /api/regions`
- `GET /api/regions/{regionId}`
- `GET /api/regions/{regionId}/places`
- `POST /api/recommendations`
- `GET /api/places/{placeId}`

현재는 화면 개발을 위해 `src/data/mockData.js`를 사용합니다.
API가 준비되면 React Query 또는 useEffect 기반으로 mock을 교체하면 됩니다.

## Firebase Hosting

1. Firebase CLI 설치
```bash
npm install -g firebase-tools
```

2. 로그인
```bash
firebase login
```

3. 프로젝트 연결
```bash
firebase init hosting
```

설정:
- public directory: `dist`
- single-page app: `Yes`
- overwrite index.html: `No`

4. 빌드 및 배포
```bash
npm run build
firebase deploy
```

`firebase.json`에는 React Router를 위한 SPA rewrite가 이미 포함되어 있습니다.
