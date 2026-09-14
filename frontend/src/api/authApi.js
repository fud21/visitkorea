import { apiClient } from "./client";

export async function signup(payload) {
  const { data } = await apiClient.post("/auth/signup", payload);
  return data;
}

export async function login(payload) {
  const { data } = await apiClient.post("/auth/login", payload);
  return data;
}

export async function fetchMe() {
  const { data } = await apiClient.get("/auth/me");
  return data;
}

export async function updateMe(payload) {
  const { data } = await apiClient.put("/auth/me", payload);
  return data;
}

export async function logout() {
  await apiClient.post("/auth/logout");
}
