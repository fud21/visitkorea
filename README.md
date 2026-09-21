# LOCAL:ON

공공 관광 데이터를 바탕으로 관광 집중 지역과 로컬 생활권을 연결하는 여행 코스 추천 애플리케이션입니다.

사용자가 시/도와 관심 테마를 선택하면 Python 추천 모델이 적합한 시군구와 방문 장소를 선정하고, Spring Boot가 추천 결과와 Kakao Mobility 자동차 경로 정보를 결합하여 프론트엔드에 제공합니다.

---

## 프로젝트 구조

```text
visitkorea/
├── frontend/                     React + Vite + Nginx
├── backend/                      Spring Boot + PostgreSQL
├── route-recommendation/         Python 추천 모델 + FastAPI
│   ├── api_server.py
│   ├── local_on_route_recommender.py
│   ├── requirements.txt
│   └── data/
│       └── 추천 모델용 CSV 데이터
├── data/processed/               데이터팀 CSV 및 master JSON
│   ├── attraction/
│   ├── market/
│   └── restaurant/
├── scripts/build_all.py          로컬 실행용 진입점
├── scripts/build_dataset.py      master JSON 생성 및 dataset 통합
├── docker-compose.yml
└── README.md
```

---

## 실행 전 설정

LOCAL:ON은 Kakao Mobility 자동차 길찾기 API와 Kakao Maps JavaScript SDK를 사용합니다.

저장소 루트에 `.env` 파일을 생성하고 다음 값을 설정합니다.

```env
KAKAO_REST_API_KEY=본인의_Kakao_REST_API_KEY
VITE_KAKAO_MAP_JAVASCRIPT_KEY=본인의_Kakao_JavaScript_KEY
```

각 환경변수의 용도는 다음과 같습니다.

- `KAKAO_REST_API_KEY`: Kakao Mobility 자동차 길찾기 API 호출
- `VITE_KAKAO_MAP_JAVASCRIPT_KEY`: Kakao Maps JavaScript SDK 지도 표시

`.env` 파일에는 실제 API Key가 포함되므로 GitHub에 업로드하지 않습니다.

Kakao Developers의 웹 플랫폼에는 다음 도메인을 등록합니다.

```text
http://localhost:4173
```

Vite 개발 서버를 직접 사용하는 경우 다음 주소도 등록합니다.

```text
http://localhost:5173
```

---

## Python 추천 서버 실행

현재 Python 추천 서버는 Docker 외부에서 별도로 실행합니다.

처음 실행하는 경우 `route-recommendation` 폴더에서 가상환경을 생성합니다.

```powershell
cd route-recommendation
python -m venv .venv
```

PowerShell에서 가상환경을 활성화합니다.

```powershell
.\.venv\Scripts\Activate.ps1
```

필요한 Python 패키지를 설치합니다.

```powershell
python -m pip install -r requirements.txt
```

FastAPI 추천 서버를 실행합니다.

```powershell
uvicorn api_server:app --host 0.0.0.0 --port 8000
```

정상적으로 실행되면 다음과 같이 표시됩니다.

```text
Uvicorn running on http://0.0.0.0:8000
```

FastAPI 상태 확인:

```text
http://localhost:8000/health
```

정상 응답:

```json
{
  "status": "UP",
  "service": "route-recommendation"
}
```

FastAPI Swagger:

```text
http://localhost:8000/docs
```

Python 추천 서버는 `localhost:8000`에서 실행되며, Docker 내부의 Spring Boot는 `host.docker.internal:8000`을 통해 추천 서버에 접근합니다.

---

## 전체 실행

Python 추천 서버를 실행한 상태에서 새로운 터미널을 열고 저장소 루트에서 다음 명령을 실행합니다.

```bash
docker compose up --build
```

첫 실행에서는 `data-builder`가 데이터팀 CSV로 분야별 master JSON을 만들고 이를 `dataset.json`으로 통합합니다.

이후 백엔드가 PostgreSQL에 관광 데이터를 적재한 후 프론트엔드가 시작됩니다.

실행 주소:

- 애플리케이션: http://localhost:4173
- 백엔드: http://localhost:8080
- 백엔드 Health Check: http://localhost:8080/actuator/health
- Python 추천 서버: http://localhost:8000
- FastAPI Swagger: http://localhost:8000/docs
- PostgreSQL: `localhost:25433` (`localon` / `localon`)

실행 상태 확인:

```bash
docker compose ps
```

백엔드 및 데이터 처리 로그 확인:

```bash
docker compose logs -f data-builder backend
```

Docker 종료:

```bash
docker compose down
```

Python 추천 서버는 FastAPI를 실행한 터미널에서 다음 키를 눌러 종료합니다.

```text
Ctrl + C
```

데이터베이스까지 완전히 초기화해야 할 경우에만 다음 명령을 사용합니다.

```bash
docker compose down -v
```

> 해당 명령을 실행하면 PostgreSQL에 저장된 사용자 계정 및 저장 데이터도 함께 삭제됩니다.

---

## 추천 경로 생성 흐름

사용자는 프론트엔드에서 다음 정보를 선택합니다.

1. 여행 지역
2. 관심 테마
3. 여행 시간

예시:

```text
여행 지역
충청남도

관심 테마
맛집
관광지
카페/베이커리
전통시장

여행 시간
당일치기
```

사용자가 시/도만 선택하면 Python 추천 모델이 해당 시/도 내 시군구를 평가하여 추천 지역을 자동으로 선정합니다.

전체 추천 흐름은 다음과 같습니다.

```text
React
  ↓
Spring Boot
  ↓
FastAPI
  ↓
Python 추천 모델
  ↓
추천 시군구 및 방문 장소 선정
  ↓
Spring Boot
  ↓
Kakao Mobility API
  ↓
자동차 이동거리 및 예상시간 계산
  ↓
React + Kakao Map
```

예를 들어 충청남도를 선택한 경우 다음과 같은 추천 결과가 생성될 수 있습니다.

```text
충청남도
  ↓
서천군 자동 선택
  ↓
국립생태원
  ↓
하림각
  ↓
장항전통시장
  ↓
브라운핸즈송림동화점
  ↓
장항송림산림욕장
  ↓
서천파크골프장
```

추천 결과에는 각 장소의 위도와 경도가 포함됩니다.

Spring Boot는 해당 좌표를 Kakao Mobility API에 전달하여 실제 자동차 이동거리와 예상 이동시간을 계산합니다.

최종 결과는 React 프론트엔드에서 추천 장소 목록 및 Kakao 지도 형태로 표시됩니다.

---

## Python 추천 API

FastAPI 추천 요청 예시:

```json
{
  "sido": "충청남도",
  "trip": "day",
  "categories": [
    "맛집",
    "관광지",
    "카페/베이커리",
    "전통시장"
  ],
  "start_time": "10:00"
}
```

`sigungu`를 전달하지 않을 경우 Python 추천 모델이 시/도 내부에서 추천 시군구를 자동으로 선정합니다.

응답 예시:

```json
{
  "status": "success",
  "sido": "충청남도",
  "sigungu": "서천군"
}
```

추천 장소 정보에는 다음 데이터가 포함됩니다.

```text
장소명
카테고리
세부분류
장소추천점수
경로선택점수
예상 도착시간
예상 출발시간
위도
경도
```

추천 결과 예시:

```json
{
  "day": 1,
  "order": 1,
  "arrivalTime": "10:16",
  "departureTime": "11:26",
  "name": "국립생태원",
  "category": "관광지",
  "subCategory": "기타관광",
  "placeScore": 74.0,
  "routeScore": 95.0,
  "travelMinutes": 16.1,
  "latitude": 36.036218,
  "longitude": 126.7186387
}
```

---

## 데이터 처리 흐름

Docker Compose 실행 시 다음 작업이 자동으로 이루어집니다.

1. `data/processed`의 관광지·전통시장·음식점 CSV를 읽습니다.
2. 장소, 상세, 점수 파일을 ID 기준으로 결합합니다.
3. `attraction_master.json`, `market_master.json`, `restaurant_master.json`, `region_metrics.json`을 생성합니다.
4. 네 개의 master JSON을 Docker volume의 `dataset.json` 하나로 통합합니다.
5. Spring Boot가 `dataset.json`을 PostgreSQL에 upsert합니다.
6. 프론트엔드는 원본 CSV나 master JSON에 직접 접근하지 않고 백엔드 API JSON을 사용합니다.

```mermaid
flowchart LR
    CSV["data/processed CSV"] --> MASTER["분야별 master JSON"]
    MASTER --> DATASET["dataset.json 통합"]
    DATASET --> API["Spring Boot 적재"]
    API --> DB[(PostgreSQL)]
    DB --> JSON["REST API JSON"]
    JSON --> UI["React 프론트"]
```

세부 흐름과 파일별 책임은 `docs/DATA_PIPELINE.md`에 정리되어 있습니다.

현재 변환 대상:

- 관광지: 15,710건
- 전통시장: 1,393건
- 음식점: 16,949건
- 전체: 34,052건

전통시장은 점수 원본이 없는 경우 점수를 `null`로 유지하며, 원본 CSV는 수정하지 않습니다.

통합 데이터만 따로 생성하여 확인하려면 다음 명령을 사용합니다.

```bash
python3 scripts/build_all.py \
  --data-root data/processed \
  --region-resources backend/src/main/resources \
  --masters-root data/processed \
  --output /tmp/localon-dataset.json
```

---

## Python 추천 데이터

Python 추천 모델은 다음 폴더의 데이터를 사용합니다.

```text
route-recommendation/data/
```

주요 데이터:

```text
01_인기관광지_전국통합_점수_최종.csv
01_인기관광지_전국통합_위경도_최최종.csv
03_로컬발견가능성_지역별.csv

restaurant_place_지역정규화.csv
restaurant_score.csv
restaurant_location.csv
place_restaurant.csv

traditional_market.csv
traditional_market_facility.csv
place_market.csv
```

추천 실행 결과는 다음 폴더에 생성됩니다.

```text
route-recommendation/data/경로추천_결과/
```

생성 파일 예시:

```text
00_통합데이터_QA.csv
01_충청남도_지역추천순위.csv
02_충청남도_서천군_장소후보.csv
03_충청남도_서천군_day_추천경로.csv
04_충청남도_서천군_day_요약.json
```

---

## API 연결 방식

Docker 프론트엔드는 브라우저에서 `http://localhost:8080`을 직접 호출하지 않습니다.

프론트엔드는 `/api` 요청을 같은 출처인 다음 주소로 전송합니다.

```text
http://localhost:4173/api
```

Nginx가 해당 요청을 Docker 내부의 `backend:8080`으로 전달합니다.

이를 통해 브라우저의 `ERR_CONNECTION_REFUSED` 및 CORS 문제를 줄일 수 있습니다.

추천 API는 다음 순서로 처리됩니다.

```text
React
  ↓
Nginx
  ↓
Spring Boot
  ↓
FastAPI
  ↓
Python 추천 모델
  ↓
Spring Boot
  ↓
Kakao Mobility
  ↓
React
```

주요 API:

```text
POST /api/auth/signup
POST /api/auth/login

GET  /api/auth/me
PUT  /api/auth/me

GET  /api/regions
GET  /api/regions/{regionId}/places

GET  /api/places/{placeId}

GET  /api/search?q={query}

POST /api/recommendations

GET  /api/favorites
GET  /api/courses
```

---

## Kakao API 연결

### Kakao Mobility

Spring Boot는 Python 추천 결과에 포함된 각 장소의 위도와 경도를 사용하여 Kakao Mobility 자동차 길찾기 API를 호출합니다.

장소 간 이동 경로를 기준으로 다음 정보를 계산합니다.

- 실제 자동차 이동거리
- 예상 자동차 이동시간

Kakao Mobility API 인증에는 다음 환경변수가 사용됩니다.

```env
KAKAO_REST_API_KEY=...
```

### Kakao Maps

React 프론트엔드는 Kakao Maps JavaScript SDK를 사용하여 추천 장소를 지도에 표시합니다.

지도 API Key:

```env
VITE_KAKAO_MAP_JAVASCRIPT_KEY=...
```

지도 사용을 위해 Kakao Developers 웹 플랫폼에 다음 주소를 등록해야 합니다.

```text
http://localhost:4173
```

---

## 서비스 연결 확인

### FastAPI 확인

브라우저에서 다음 주소에 접속합니다.

```text
http://localhost:8000/health
```

정상 응답:

```json
{
  "status": "UP",
  "service": "route-recommendation"
}
```

### Docker 상태 확인

```bash
docker compose ps
```

### Backend 로그 확인

```bash
docker compose logs backend --tail=100
```

### Spring Boot에서 FastAPI 연결 확인

Spring Boot 컨테이너에 접속합니다.

```bash
docker compose exec backend sh
```

컨테이너 내부에서 다음 명령을 실행합니다.

```bash
curl http://host.docker.internal:8000/health
```

정상 응답:

```json
{
  "status": "UP",
  "service": "route-recommendation"
}
```

컨테이너에서 나오려면 다음 명령을 실행합니다.

```bash
exit
```

---

## 문제 해결

### Python 추천 서버 호출 실패

다음 오류가 발생할 수 있습니다.

```text
Python 추천 서버 호출에 실패했습니다.
```

먼저 FastAPI가 실행 중인지 확인합니다.

```text
http://localhost:8000/health
```

FastAPI가 실행 중이지 않다면 다음 명령으로 실행합니다.

```powershell
cd route-recommendation
.\.venv\Scripts\Activate.ps1
uvicorn api_server:app --host 0.0.0.0 --port 8000
```

Docker 내부에서도 FastAPI에 접근 가능한지 확인합니다.

```bash
docker compose exec backend sh
curl http://host.docker.internal:8000/health
```

---

### Kakao Mobility 401 오류

다음 오류가 발생할 수 있습니다.

```text
401 Unauthorized
cannot find Authorization : KakaoAK header
```

프로젝트 루트의 `.env`에 REST API Key가 설정되어 있는지 확인합니다.

```env
KAKAO_REST_API_KEY=...
```

환경변수 설정 후 Docker를 다시 실행합니다.

```bash
docker compose down
docker compose up --build
```

---

### Kakao 지도가 표시되지 않는 경우

프로젝트 루트의 `.env`에 JavaScript Key가 설정되어 있는지 확인합니다.

```env
VITE_KAKAO_MAP_JAVASCRIPT_KEY=...
```

Kakao Developers의 웹 플랫폼에 다음 주소가 등록되어 있는지도 확인합니다.

```text
http://localhost:4173
```

프론트엔드의 Vite 환경변수는 빌드 시 적용되므로 Key 변경 후 반드시 프론트엔드를 다시 빌드해야 합니다.

```bash
docker compose down
docker compose up --build
```

---

### Docker Compose 파일을 찾지 못하는 경우

다음 오류가 발생할 수 있습니다.

```text
no configuration file provided: not found
```

현재 위치가 `docker-compose.yml`이 존재하는 `visitkorea` 저장소 루트인지 확인합니다.

```powershell
Get-Location
```

프로젝트 루트로 이동한 후 실행합니다.

```powershell
cd visitkorea
docker compose up --build
```

---

### PowerShell에서 Python 가상환경이 실행되지 않는 경우

다음과 같은 오류가 발생할 수 있습니다.

```text
Activate.ps1을 실행할 수 없습니다.
```

현재 PowerShell 프로세스에 대해 실행 정책을 변경합니다.

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
```

다시 가상환경을 활성화합니다.

```powershell
.\.venv\Scripts\Activate.ps1
```

---

## 로컬 개발 모드

PostgreSQL만 Docker로 실행:

```bash
docker compose up -d postgres
```

백엔드 실행:

```bash
cd backend
DB_URL=jdbc:postgresql://localhost:25433/localon ./gradlew bootRun
```

Windows 환경에서는 다음 명령을 사용할 수 있습니다.

```powershell
cd backend
.\gradlew.bat bootRun
```

프론트 실행:

```bash
cd frontend
npm ci
npm run dev
```

Python 추천 서버 실행:

```powershell
cd route-recommendation
.\.venv\Scripts\Activate.ps1
uvicorn api_server:app --host 0.0.0.0 --port 8000
```

Vite 개발 서버도 `/api` 요청을 `localhost:8080`의 백엔드로 전달합니다.

환경변수 예시는 `frontend/.env.example`, `backend/.env.example`에서 확인할 수 있습니다.

---

## 서비스 종료

Docker 서비스 종료:

```bash
docker compose down
```

FastAPI 종료:

```text
Ctrl + C
```

PostgreSQL 데이터까지 모두 삭제:

```bash
docker compose down -v
```

> `docker compose down -v` 실행 시 PostgreSQL volume이 삭제되므로 사용자 계정 및 저장 데이터도 함께 삭제됩니다.

---

## 개발 환경

- Frontend: React
- Build Tool: Vite
- Web Server: Nginx
- Backend: Spring Boot 3
- Database: PostgreSQL 16
- Recommendation Model: Python
- Recommendation API: FastAPI
- Data Processing: Pandas / NumPy
- Route API: Kakao Mobility
- Map: Kakao Maps JavaScript SDK
- Container: Docker Compose
