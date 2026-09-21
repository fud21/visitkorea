import { ArrowLeft, Sparkles } from "lucide-react";
import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { fetchRegion, fetchRegions } from "../api/tourismApi";
import { useApiResource } from "../hooks/useApiResource";
import { saveLatestCourseConfig } from "../utils/courseConfig";

const themes = ["전통시장", "맛집", "자연/힐링", "카페", "관광지"];

export default function CourseSetupPage() {
  const navigate = useNavigate();
  const { regionId } = useParams();
  const [searchParams] = useSearchParams();
  const requestedTheme = searchParams.get("theme");
  const initialThemes = requestedTheme && themes.includes(requestedTheme)
    ? [requestedTheme]
    : ["전통시장", "맛집"];
  const [selectedRegionId, setSelectedRegionId] = React.useState(regionId || "");
  const [localRatio, setLocalRatio] = React.useState(70);
  const [selectedThemes, setSelectedThemes] = React.useState(initialThemes);
  const [duration, setDuration] = React.useState("daytrip");
  const [formError, setFormError] = React.useState("");
  const regionsResource = useApiResource(fetchRegions, [], []);
  const detailResource = useApiResource(
    () => regionId ? fetchRegion(regionId) : Promise.resolve(null),
    [regionId],
    null
  );
  React.useEffect(() => {
    if (regionId && detailResource.data?.id) {
      setSelectedRegionId(String(detailResource.data.id));
    }
  }, [regionId, detailResource.data?.id]);
  const regionOptions = detailResource.data && !regionsResource.data.some((region) => String(region.id) === String(detailResource.data.id))
    ? [detailResource.data, ...regionsResource.data]
    : regionsResource.data;
  const selectedRegion = regionOptions.find((region) => String(region.id) === String(selectedRegionId));
  const regionName = selectedRegion?.name?.replace(/(시|군|구)$/, "") || "지역을 선택한";

  function toggleTheme(theme) {
    setSelectedThemes((current) =>
      current.includes(theme)
        ? current.filter((item) => item !== theme)
        : [...current, theme]
    );
  }

  function submit() {
    if (!selectedRegionId) {
      setFormError("여행할 지역을 먼저 선택해주세요.");
      return;
    }
    if (selectedThemes.length === 0) {
      setFormError("여행 테마를 하나 이상 선택해주세요.");
      return;
    }
    const config = {
      regionId: selectedRegionId,
      regionName: selectedRegion?.name || regionName,
      localRatio,
      selectedThemes,
      duration,
    };
    saveLatestCourseConfig(config);
    navigate("/course/result", {
      state: config,
    });
  }

  return (
    <div className="page narrow-page">
      <button className="back-button" type="button" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> 이전 화면으로
      </button>

      <div className="setup-header">
        <span className="eyebrow">AI COURSE BUILDER</span>
        <h1>어떤 {regionName} 여행을 원하세요?</h1>
        <p>관광지 비중과 로컬 콘텐츠를 조절하면 AI가 후보 장소를 고르고 이동 동선을 구성합니다.</p>
      </div>

      <section className="form-panel">
        <div className="form-section">
          <h2>여행 지역</h2>
          <p>추천 코스를 만들 지역을 먼저 선택해주세요.</p>
          <select
            className="region-select"
            value={selectedRegionId}
            onChange={(event) => {
              setSelectedRegionId(event.target.value);
              setFormError("");
            }}
          >
            <option value="">지역 선택</option>
            {regionOptions.map((region) => (
              <option key={region.id} value={region.id}>{region.name}</option>
            ))}
          </select>
        </div>

        <div className="form-section">
          <div className="form-label-row">
            <div>
              <h2>관광 성향</h2>
              <p>대표 관광지를 얼마나 포함할지 조절합니다.</p>
            </div>
            <strong>로컬 {localRatio}%</strong>
          </div>
          <div className="range-labels">
            <span>유명 관광지 중심</span>
            <span>로컬 중심</span>
          </div>
          <input
            className="range-input"
            type="range"
            min="0"
            max="100"
            value={localRatio}
            onChange={(e) => setLocalRatio(Number(e.target.value))}
          />
        </div>

        <div className="form-section">
          <h2>여행 테마</h2>
          <p>여러 개 선택할 수 있습니다.</p>
          <div className="theme-select-grid">
            {themes.map((theme) => {
              const active = selectedThemes.includes(theme);
              return (
                <button
                  key={theme}
                  type="button"
                  className={`select-chip ${active ? "active" : ""}`}
                  onClick={() => toggleTheme(theme)}
                >
                  {theme}
                </button>
              );
            })}
          </div>
        </div>

        <div className="form-section">
          <h2>여행 시간</h2>
          <div className="duration-grid">
            {[
              ["daytrip", "당일치기", "하루 동안 둘러보는 로컬 코스"],
              ["1n2d", "1박 2일", "여유롭게 둘러보는 2일 코스"],
            ].map(([value, title, desc]) => (
              <button
                key={value}
                type="button"
                className={`duration-card ${duration === value ? "active" : ""}`}
                onClick={() => setDuration(value)}
              >
                <strong>{title}</strong>
                <span>{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {formError && <div className="status-banner warning">{formError}</div>}
        <button className="primary-button full" type="button" onClick={submit} disabled={regionsResource.loading && !regionId}>
          <Sparkles size={18} />
          AI 로컬 코스 만들기
        </button>
      </section>
    </div>
  );
}
