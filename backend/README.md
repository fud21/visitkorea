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

기본 접속값은 `jdbc:postgresql://localhost:5432/localon`, 사용자/비밀번호는 모두 `localon`입니다. 다른 값은 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`로 덮어쓸 수 있습니다.

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

`provinces.csv`, `municipalities.csv`는 초기 실행용 seed입니다. 데이터팀 파일 형식은 `data/dataset.example.json`을 기준으로 하며 `DATASET_JSON_PATH=file:./data/dataset.json`을 지정하면 애플리케이션 시작 시 ID 기준으로 갱신됩니다.

POI(장소)는 현재 프론트가 샘플 단계이므로 경주/부여/영주/군산에 한해 초기 샘플 장소를 넣었습니다. 샘플 여부는 응답의 `sampleData`로 확인할 수 있습니다. 실제 POI가 없는 지역에서 추천을 요청하면 가짜 장소를 실제 장소처럼 반환하지 않고 `dataStatus: PLACEHOLDER`와 안내 문구를 함께 반환합니다.

## 프론트 연결

프론트 `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

지역 상세, 추천 결과, 장소 상세는 API를 먼저 호출하며 연결 실패 시 안내 배너와 데모 데이터를 표시합니다. 호출 코드는 `frontend/src/api/tourismApi.js`에 모여 있습니다.
