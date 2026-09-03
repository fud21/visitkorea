import { apiClient } from "./client";

/**
 * Spring Boot API 계약 초안.
 * 현재 FE는 src/data/visitorData.js의 CSV 기반 정적 데이터를 사용합니다.
 * BE 준비 후 아래 함수 호출로 교체하면 됩니다.
 */

export async function fetchProvinces() {
  const { data } = await apiClient.get("/regions/provinces");
  return data;
}

export async function fetchMunicipalities(provinceName) {
  const { data } = await apiClient.get(
    `/regions/provinces/${encodeURIComponent(provinceName)}/municipalities`
  );
  return data;
}

export async function fetchMunicipality(municipalityName) {
  const { data } = await apiClient.get(
    `/regions/municipalities/${encodeURIComponent(municipalityName)}`
  );
  return data;
}

export async function createRecommendation(payload) {
  const { data } = await apiClient.post("/recommendations", payload);
  return data;
}

export async function fetchPlace(placeId) {
  const { data } = await apiClient.get(`/places/${placeId}`);
  return data;
}
