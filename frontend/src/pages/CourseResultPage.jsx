import { ArrowLeft, Bookmark, Navigation, Share2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import MetricCard from "../components/common/MetricCard";
import { course } from "../data/mockData";
import { createRecommendation } from "../api/tourismApi";
import { useApiResource } from "../hooks/useApiResource";
import { useAuth } from "../auth/AuthContext";
import { saveCourse } from "../api/memberApi";
import { useState } from "react";

export default function CourseResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [saveMessage, setSaveMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const config = location.state || {
    regionId: "gyeongju",
    localRatio: 70,
    selectedThemes: ["전통시장", "떡집", "현지인 맛집"],
    duration: "half",
  };
  const resource = useApiResource(() => createRecommendation(config), [location.key], course);
  const result = resource.data;
  const regionName = result.regionName || "경주";

  async function save() {
    if (saved || saving) return;
    if (!user) {
      navigate("/login", { state: { from: location } });
      return;
    }
    try {
      setSaving(true);
      await saveCourse({
        ...config,
        title: `${regionName} 로컬 코스`,
        placeIds: result.stops.filter((stop) => !stop.id.startsWith("placeholder-")).map((stop) => stop.id),
      });
      setSaved(true);
      setSaveMessage("마이페이지에 코스를 저장했습니다.");
    } catch (error) {
      setSaveMessage(error.response?.data?.message || "코스를 저장하지 못했습니다.");
    } finally { setSaving(false); }
  }

  return (
    <div className="page">
      {resource.loading && <div className="status-banner">추천 코스를 계산하는 중입니다.</div>}
      {resource.usingFallback && <div className="status-banner warning">백엔드에 연결할 수 없어 데모 코스를 표시합니다.</div>}
      <button className="back-button" type="button" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> 조건 다시 설정
      </button>

      <div className="region-title-row">
        <div>
          <span className="eyebrow">AI RECOMMENDATION</span>
          <h1>{regionName} 로컬 코스</h1>
          <p>유명 관광지 {100 - config.localRatio}% · 로컬 {config.localRatio}% 기준으로 구성한 1차 추천 결과입니다.</p>
        </div>
      </div>

      <div className="metric-grid four">
        <MetricCard label="총 소요시간" value={result.summary.duration} />
        <MetricCard label="이동거리" value={result.summary.distance} />
        <MetricCard label="로컬 체류 비중" value={`${result.summary.localRatio}%`} />
        <MetricCard label="예상 비용" value={result.summary.budget} />
      </div>

      <div className="course-grid">
        <section className="panel route-map-panel">
          <div className="route-map">
            <div className="route-path" />
            {result.stops.map((stop, index) => (
              <button
                key={stop.id}
                type="button"
                className={`route-pin pin-${index + 1}`}
                onClick={() => navigate(`/places/${stop.id}`)}
              >
                {stop.order}
              </button>
            ))}
          </div>
          <div className="map-note">장소 좌표 기반 실제 경로 표시는 지도 API 연동 단계에서 추가합니다.</div>
        </section>

        <section className="panel route-list-panel">
          <div className="panel-head">
            <div>
              <span className="section-kicker">코스 순서</span>
              <h2>추천 장소</h2>
            </div>
          </div>
          <div className="route-list">
            {result.stops.map((stop) => (
              <button
                key={stop.id}
                type="button"
                className="route-row"
                onClick={() => navigate(`/places/${stop.id}`)}
              >
                <span className="stop-order">{stop.order}</span>
                <span className="stop-main">
                  <strong>{stop.name}</strong>
                  <small>{stop.type} · {stop.stay}</small>
                </span>
                <span className="local-score">
                  <strong>{stop.localScore}</strong>
                  <small>Local</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {result.notice && <div className="data-notice">{result.notice}</div>}

      <section className="impact-banner">
        <div>
          <span>이번 여행의 지역 분산 효과</span>
          <strong>관광 집중지역 밖 예상 체류 2시간 35분</strong>
        </div>
        <div className="action-row">
          {saveMessage && <span className="action-message">{saveMessage}</span>}
          <button className={`secondary-button save-button ${saved ? "saved" : ""}`} type="button" onClick={save} disabled={saving || saved}><Bookmark size={17} fill={saved ? "currentColor" : "none"}/> {saving ? "저장 중" : saved ? "저장됨" : "저장"}</button>
          <button className="secondary-button" type="button"><Share2 size={17}/> 공유</button>
          <button className="primary-button" type="button"><Navigation size={17}/> 길찾기 시작</button>
        </div>
      </section>
    </div>
  );
}
