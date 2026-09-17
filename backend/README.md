# LOCAL:ON Spring Boot Backend

프론트엔드(`visitkorea-main`)의 화면과 API 초안을 기준으로 만든 Spring Boot 백엔드입니다.

## 구현 기능

- 전국 광역지자체 방문 데이터 조회
- 광역지자체별 시·군·구 방문 데이터 조회
- 지역 단건 조회 (`gyeongju`, `buyeo`, `yeongju`, `gunsan` 영문 alias 지원)
- 지역별 장소 목록 / 테마 필터
- 장소 검색 / 상세
- 코스 추천
  - localRatio 반영
  - 선택 테마 일치도 반영
  - Local Score / Popularity 혼합 점수
  - 여행 시간에 따라 추천 장소 수 조절
  - 실제 장소 데이터가 없는 지역은 `PLACEHOLDER` 상태로 명시
- 회원가입 / 로그인 / 로그아웃 / 내 정보
  - BCrypt 비밀번호 저장
  - 30일 만료 Bearer opaque token
- 즐겨찾기 추가 / 목록 / 삭제
- 여행 코스 저장 / 조회 / 삭제
- 저장 코스에 장소 추가 / 삭제
- 통합 검색(지역 + 장소)
- PostgreSQL 기본 저장소
- 선택적 JSON 통합 데이터 upsert (`DATASET_JSON_PATH`)
- Spring Actuator health / Prometheus endpoint
- CORS 설정
- 공통 예외 응답 / validation

## 실행

Java 17+ 환경 (Gradle 별도 설치 불필요):

```bash
./gradlew bootRun
```

먼저 저장소 루트에서 PostgreSQL을 실행한 뒤 백엔드를 시작합니다.

```bash
docker compose up -d postgres
./gradlew bootRun
```

Compose가 호스트에 공개하는 기본 포트는 `25433`입니다. 로컬에서 백엔드를 직접 실행할 때는 `DB_URL=jdbc:postgresql://localhost:25433/localon`을 지정합니다. 사용자/비밀번호는 모두 `localon`이며 다른 값은 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`로 덮어쓸 수 있습니다.

첫 `./gradlew` 실행 시 Gradle 8.10.2를 자동으로 내려받아 `~/.gradle`에 캐시합니다.

전체 앱을 Docker로 실행하려면 저장소 루트에서:

```bash
docker compose up --build
```

## 주요 API

### 공개 API

```text
GET  /api/regions
GET  /api/regions/provinces
GET  /api/regions/provinces/{provinceName}/municipalities
GET  /api/regions/municipalities/{municipalityName}
GET  /api/regions/{regionId}
GET  /api/regions/{regionId}/places?theme=전통시장&limit=20
GET  /api/places?q=시장
GET  /api/places/{placeId}
GET  /api/search?q=경주
POST /api/recommendations
POST /api/auth/signup
POST /api/auth/login
GET  /actuator/health
```

추천 요청 예시:

```json
{
  "regionId": "gyeongju",
  "localRatio": 70,
  "selectedThemes": ["전통시장", "떡집", "현지인 맛집"],
  "duration": "half"
}
```

### 로그인 필요 API

```text
GET    /api/auth/me
PUT    /api/auth/me
POST   /api/auth/logout
GET    /api/favorites
POST   /api/favorites/{placeId}
DELETE /api/favorites/{placeId}
GET    /api/courses
GET    /api/courses/{id}
POST   /api/courses
POST   /api/courses/{id}/places/{placeId}
DELETE /api/courses/{id}/places/{placeId}
DELETE /api/courses/{id}
```

Header:

```text
Authorization: Bearer {accessToken}
```

## 데이터 주의사항

`provinces.csv`, `municipalities.csv`는 지역 기준 데이터입니다. 전체 Docker 실행에서는 루트의 `scripts/build_all.py`가 `data/processed` CSV를 분야별 master JSON으로 만든 뒤 `dataset.json`으로 통합합니다. 백엔드는 이 통합 파일만 읽어 ID 기준으로 갱신합니다.

POI(장소)는 현재 프론트가 샘플 단계이므로 경주/부여/영주/군산에 한해 초기 샘플 장소를 넣었습니다. 샘플 여부는 응답의 `sampleData`로 확인할 수 있습니다. 실제 POI가 없는 지역에서 추천을 요청하면 가짜 장소를 실제 장소처럼 반환하지 않고 `dataStatus: PLACEHOLDER`와 안내 문구를 함께 반환합니다.

## 프론트 연결

프론트 `frontend/.env`:

```env
VITE_API_BASE_URL=/api
```

Docker에서는 Nginx가 `/api`를 `backend:8080`으로 프록시합니다. Vite 개발 서버도 같은 경로를 `localhost:8080`으로 프록시합니다. 호출 코드는 `frontend/src/api/tourismApi.js`에 모여 있습니다.
