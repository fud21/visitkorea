/**
 * POI 데이터가 아직 확보되지 않아 장소 상세 화면에서만 사용하는 샘플입니다.
 * 실제 서비스에서는 Spring Boot의 GET /api/places/{placeId} 응답으로 교체합니다.
 */
export const placeDetail = {
  id: "sample-place",
  name: "로컬 장소 예시",
  category: "지역 콘텐츠",
  address: "실제 POI 데이터 연결 예정",
  description:
    "장소 상세 화면의 레이아웃 확인을 위한 샘플 데이터입니다. 관광지·시장·맛집 데이터가 확보되면 실제 정보로 교체합니다.",
  reasons: [
    "현지인/외지인 방문 데이터 연결 예정",
    "대표 관광지와의 접근성 계산 예정",
    "사용자 선택 테마 일치도 계산 예정",
  ],
  hours: "데이터 연결 예정",
  closed: "데이터 연결 예정",
  parking: "데이터 연결 예정",
};
