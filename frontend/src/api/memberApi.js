import { apiClient } from "./client";

export async function fetchFavorites() {
  const { data } = await apiClient.get("/favorites");
  return data;
}

export async function addFavorite(placeId) {
  const { data } = await apiClient.post(`/favorites/${placeId}`);
  return data;
}

export async function removeFavorite(placeId) {
  await apiClient.delete(`/favorites/${placeId}`);
}

export async function fetchSavedCourses() {
  const { data } = await apiClient.get("/courses");
  return data;
}

export async function saveCourse(payload) {
  const { data } = await apiClient.post("/courses", payload);
  return data;
}

export async function removeSavedCourse(courseId) {
  await apiClient.delete(`/courses/${courseId}`);
}
