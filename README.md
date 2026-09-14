# LOCAL:ON

관광 집중 지역과 로컬 생활권을 연결하는 여행 코스 추천 데모입니다.

## 구조

```text
visitkorea-main/
├── frontend/        React + Vite
├── backend/         Spring Boot + PostgreSQL
└── docker-compose.yml
```

프론트는 백엔드 API를 우선 사용하고, 백엔드가 꺼져 있으면 주요 화면에 데모 데이터와 안내 배너를 표시합니다. 백엔드는 데이터팀 파일이 없는 동안 내장 seed를 사용합니다.

회원가입과 로그인 후에는 장소 즐겨찾기 및 추천 코스 저장이 가능하며 `/mypage`에서 저장 목록을 확인하고 삭제할 수 있습니다.

## 가장 빠른 실행

Docker가 설치되어 있다면 저장소 루트에서 실행합니다.

```bash
docker compose up --build
```

- 프론트: http://localhost:4173
- 백엔드: http://localhost:8080
- 상태 확인: http://localhost:8080/actuator/health
- PostgreSQL: localhost:5432 (`localon` / `localon`, 충돌 시 `POSTGRES_PORT=5433` 지정)

## 개발 모드

PostgreSQL만 실행:

```bash
docker compose up -d postgres
```

백엔드:

```bash
cd backend
./gradlew bootRun
```

프론트(다른 터미널):

```bash
cd frontend
npm ci
npm run dev
```

환경변수 예시는 `frontend/.env.example`, `backend/.env.example`에 있습니다.

## 데이터팀 연동

`backend/data/dataset.example.json`이 현재 합의용 JSON 스키마입니다. 데이터팀 산출물을 같은 형태로 만든 뒤 다음처럼 경로를 지정하면 시작 시 지역과 장소가 ID 기준으로 upsert됩니다.

```bash
export DATASET_JSON_PATH=file:./data/dataset.json
./gradlew bootRun
```

Docker에서는 `backend/data`가 `/app/data`로 연결되므로 다음처럼 실행합니다.

```bash
DATASET_JSON_PATH=file:/app/data/dataset.json docker compose up --build
```

실데이터로 적재된 장소는 API의 `sampleData: false`로 구분됩니다. 파일 경로가 비어 있으면 내장 CSV와 최소 POI seed를 사용합니다.

## API

주요 공개 API:

```text
GET  /api/regions
GET  /api/regions/{regionId}
GET  /api/regions/{regionId}/places
GET  /api/places/{placeId}
POST /api/recommendations
GET  /api/search?q={query}
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
GET  /api/favorites
GET  /api/courses
```

인증, 즐겨찾기, 저장 코스 API의 상세 내용은 `backend/README.md`를 참고하세요.
