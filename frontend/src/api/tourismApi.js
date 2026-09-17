import { apiClient } from "./client";

/**
 * Spring Boot 연동 시 이 파일만 중심으로 교체하면 됩니다.
 * 현재 페이지는 mock 데이터 fallback을 함께 사용합니다.
 */

export async function fetchRegions() {
  const { data } = await apiClient.get("/regions");
  return data;
}

export async function fetchRegion(regionId) {
  const { data } = await apiClient.get(`/regions/${regionId}`);
  return data;
}

export async function fetchMunicipalities(provinceName) {
  const { data } = await apiClient.get(
    `/regions/provinces/${encodeURIComponent(provinceName)}/municipalities`
  );
  return data;
}

export async function fetchPlaces(regionId, params = {}) {
  const { data } = await apiClient.get(`/regions/${regionId}/places`, { params });
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
