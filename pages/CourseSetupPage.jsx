import React from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { safeDecode } from "../utils/format";

const themes = ["전통시장", "현지인 맛집", "떡집", "빵집", "카페", "자연/힐링"];

export default function CourseSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { regionId } = useParams();
  const regionName = location.state?.municipality?.name || safeDecode(regionId) || "선택 지역";
  const provinceName = location.state?.provinceName || "";
  const [localRatio, setLocalRatio] = React.useState(70);
  const [selectedThemes, setSelectedThemes] = React.useState(["전통시장", "떡집", "현지인 맛집"]);
  const [duration, setDuration] = React.useState("half");

  function toggleTheme(theme) {
    setSelectedThemes((current) =>
      current.includes(theme)
        ? current.filter((item) => item !== theme)
        : [...current, theme]
    );
  }

  function submit() {
    navigate("/course/result", {
      state: {
        provinceName,
        regionName,
        localRatio,
        selectedThemes,
        duration,
      },
    });
  }

  return (
    <div className="page narrow-page">
      <button className="back-button" type="button" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> 지역 분석으로
      </button>

      <div className="setup-header">
        <span className="eyebrow">AI COURSE BUILDER</span>
        <h1>어떤 {regionName} 여행을 원하세요?</h1>
        <p>
          {provinceName && `${provinceName} · `}현재는 사용자 조건을 받는 FE 단계입니다. 실제 장소 추천은 POI와 Local Score API가 연결된 뒤 활성화합니다.
        </p>
      </div>

      <section className="form-panel">
        <div className="form-section">
          <div className="form-label-row">
            <div>
              <h2>관광 성향</h2>
              <p>대표 관광지와 로컬 장소의 추천 비중을 조절합니다.</p>
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
              ["2h", "2시간", "가볍게"],
              ["half", "반나절", "추천"],
              ["day", "하루", "충분히"],
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

        <button className="primary-button full" type="button" onClick={submit}>
          <Sparkles size={18} />
          샘플 로컬 코스 보기
        </button>
      </section>
    </div>
  );
}
