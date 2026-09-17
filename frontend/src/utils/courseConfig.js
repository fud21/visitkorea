const STORAGE_KEY = "localon_latest_course_config_v2";

export const defaultCourseConfig = {
  regionId: "",
  regionName: "",
  localRatio: 70,
  selectedThemes: ["전통시장", "맛집"],
  duration: "daytrip",
};

export function loadLatestCourseConfig() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!stored?.regionId) return defaultCourseConfig;
    return {
      ...defaultCourseConfig,
      ...stored,
      selectedThemes: Array.isArray(stored.selectedThemes)
        ? stored.selectedThemes
        : defaultCourseConfig.selectedThemes,
    };
  } catch {
    return defaultCourseConfig;
  }
}

export function saveLatestCourseConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // 저장소 사용이 제한된 브라우저에서도 코스 생성은 계속 진행합니다.
  }
}

export function durationLabel(duration) {
  return duration === "day" ? "하루" : "당일치기";
}
