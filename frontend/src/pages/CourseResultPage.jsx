import { ArrowLeft, Bookmark, Navigation, Share2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import MetricCard from "../components/common/MetricCard";
import { createRecommendation } from "../api/tourismApi";
import { useApiResource } from "../hooks/useApiResource";
import { useAuth } from "../auth/AuthContext";
import { saveCourse } from "../api/memberApi";
import { useCallback, useEffect, useMemo, useState } from "react";
import { durationLabel, loadLatestCourseConfig, saveLatestCourseConfig } from "../utils/courseConfig";
import { estimateDrivingLeg, formatMinutes } from "../utils/travelEstimate";
import CourseKakaoMap from "../components/map/CourseKakaoMap";

export default function CourseResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [saveMessage, setSaveMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("loading");
  const config = useMemo(
    () => location.state || loadLatestCourseConfig(),
    [location.key]
  );
  useEffect(() => {
    if (config.regionId) saveLatestCourseConfig(config);
  }, [config]);
  const failedResult = useMemo(() => ({
    regionName: config.regionName || "선택 지역",
    summary: { duration: "-", distance: "-", localRatio: config.localRatio, budget: "-" },
    stops: [],
    notice: "추천 API 응답을 받지 못했습니다. 백엔드 상태를 확인해주세요.",
  }), [config]);
  const resource = useApiResource(
    () => config.regionId ? createRecommendation(config) : Promise.resolve(failedResult),
    [location.key],
    failedResult
  );
  const result = resource.data;
  const regionName = result.regionName || config.regionName || "선택 지역";
  const selectStop = useCallback((stop) => navigate(`/places/${stop.id}`), [navigate]);

  useEffect(() => {
    if (!config.regionId || !navigator.geolocation) {
      setLocationStatus("unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationStatus("ready");
      },
      () => setLocationStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, [config.regionId]);

  const travelLegs = useMemo(() => result.stops.map((stop, index) => {
    const origin = index === 0 ? userLocation : result.stops[index - 1];
    return estimateDrivingLeg(origin, stop);
  }), [result.stops, userLocation]);
  const measuredLegs = travelLegs.filter(Boolean);
  const totalDrivingMinutes = measuredLegs.reduce((sum, leg) => sum + leg.drivingMinutes, 0);
  const totalStraightKm = measuredLegs.reduce((sum, leg) => sum + leg.straightKm, 0);

  if (!config.regionId) {
    return (
      <div className="page narrow-page">
        <div className="empty-card">
          <h2>아직 만든 여행 코스가 없습니다.</h2>
          <p>여행할 지역과 테마를 선택해 첫 코스를 만들어보세요.</p>
          <button className="primary-button" type="button" onClick={() => navigate("/course/setup")}>코스 만들기</button>
        </div>
      </div>
    );
  }

  async function save() {
    if (saved || saving || resource.usingFallback || result.stops.length === 0) return;
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
      {resource.usingFallback && <div className="status-banner warning">추천을 불러오지 못했습니다. 백엔드 로그를 확인한 뒤 다시 시도해주세요.</div>}
      <button className="back-button" type="button" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> 조건 다시 설정
      </button>

      <div className="region-title-row">
        <div>
          <span className="eyebrow">AI RECOMMENDATION</span>
          <h1>{regionName} 로컬 코스</h1>
          <p>
            {durationLabel(config.duration)} · {config.selectedThemes.join(" · ")} · 유명 관광지 {100 - config.localRatio}% · 로컬 {config.localRatio}%
          </p>
        </div>
      </div>

      <div className="metric-grid four">
        <MetricCard label="예상 운전시간" value={formatMinutes(totalDrivingMinutes)} />
        <MetricCard label="직선 이동거리" value={measuredLegs.length ? `약 ${totalStraightKm.toFixed(1)} km` : "-"} />
        <MetricCard label="로컬 선호 비율" value={`${result.summary.localRatio}%`} />
        <MetricCard label="예상 비용" value={result.summary.budget} />
      </div>

      <div className="course-grid">
        <section className="panel route-map-panel">
          <CourseKakaoMap
            stops={result.stops}
            userLocation={userLocation}
            onSelectStop={selectStop}
          />
          <div className="map-note">
            {locationStatus === "ready"
              ? "현재 위치부터 첫 장소까지 포함해 계산했습니다."
              : "현재 위치 권한이 없어 첫 장소 이후 구간만 계산합니다."}
            {" "}지도 연결선은 방문 순서를 나타내는 직선이며 실제 도로 경로가 아닙니다.
            {" "}운전시간은 직선거리에 도로 보정계수와 평균 주행속도를 적용한 예상치입니다.
          </div>
        </section>

        <section className="panel route-list-panel">
          <div className="panel-head">
            <div>
              <span className="section-kicker">코스 순서</span>
              <h2>추천 장소</h2>
            </div>
          </div>
          <div className="route-list">
            {result.stops.map((stop, index) => {
              const leg = travelLegs[index];
              const travelText = leg
                ? `직선 ${leg.straightKm.toFixed(1)}km · 차로 약 ${leg.drivingMinutes}분`
                : index === 0 ? "현재 위치 허용 시 이동시간 표시" : "거리 계산 불가";
              return (
              <button
                key={stop.id}
                type="button"
                className="route-row"
                onClick={() => navigate(`/places/${stop.id}`)}
              >
                <span className="stop-order">{stop.order}</span>
                <span className="stop-main">
                  <strong>{stop.name}</strong>
                  <small>{stop.type} · {travelText}</small>
                </span>
                <span className="local-score">
                  <strong>{stop.localScore == null ? "-" : Math.round(stop.localScore * 10) / 10}</strong>
                  <small>Local</small>
                </span>
              </button>
              );
            })}
            {!resource.loading && result.stops.length === 0 && (
              <div className="empty-card">표시할 추천 장소가 없습니다.</div>
            )}
          </div>
        </section>
      </div>

      {result.notice && <div className="data-notice">{result.notice}</div>}

      <section className="impact-banner">
        <div>
          <span>이번 여행의 지역 분산 효과</span>
          <strong>{regionName} 생활권의 추천 장소 {result.stops.length}곳을 연결했습니다.</strong>
        </div>
        <div className="action-row">
          {saveMessage && <span className="action-message">{saveMessage}</span>}
          <button className={`secondary-button save-button ${saved ? "saved" : ""}`} type="button" onClick={save} disabled={saving || saved || resource.usingFallback || result.stops.length === 0}><Bookmark size={17} fill={saved ? "currentColor" : "none"}/> {saving ? "저장 중" : saved ? "저장됨" : "저장"}</button>
          <button className="secondary-button" type="button"><Share2 size={17}/> 공유</button>
          <button className="primary-button" type="button"><Navigation size={17}/> 길찾기 시작</button>
        </div>
      </section>
    </div>
  );
}
