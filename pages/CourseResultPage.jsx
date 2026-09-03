import { ArrowLeft, Bookmark, Navigation, Share2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import MetricCard from "../components/common/MetricCard";

const sampleStops = [
  { id: "anchor", order: 1, name: "대표 관광지", type: "앵커 관광지", stay: "60분", localScore: null },
  { id: "market", order: 2, name: "지역 전통시장", type: "전통시장", stay: "45분", localScore: null },
  { id: "local-food", order: 3, name: "로컬 먹거리", type: "선택 테마", stay: "30분", localScore: null },
  { id: "local-area", order: 4, name: "생활권 로컬 장소", type: "비관광 생활권", stay: "50분", localScore: null },
];

export default function CourseResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const config = location.state || {
    regionName: "선택 지역",
    localRatio: 70,
    selectedThemes: ["전통시장", "떡집", "현지인 맛집"],
    duration: "half",
  };

  return (
    <div className="page">
      <button className="back-button" type="button" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> 조건 다시 설정
      </button>

      <div className="region-title-row">
        <div>
          <span className="eyebrow">SAMPLE RECOMMENDATION</span>
          <h1>{config.regionName} 로컬 코스 구조</h1>
          <p>유명 관광 {100 - config.localRatio}% · 로컬 {config.localRatio}% 조건입니다. 아직 POI 데이터가 없어 장소명과 Local Score는 샘플 구조만 표시합니다.</p>
        </div>
        <span className="sample-badge">샘플 화면</span>
      </div>

      <div className="metric-grid four">
        <MetricCard label="여행 시간" value={config.duration === "day" ? "하루" : config.duration === "2h" ? "2시간" : "반나절"} />
        <MetricCard label="선택 테마" value={`${config.selectedThemes.length}개`} />
        <MetricCard label="로컬 선호" value={`${config.localRatio}%`} />
        <MetricCard label="추천 장소" value="4곳" sub="샘플" />
      </div>

      <div className="course-grid">
        <section className="panel route-map-panel">
          <div className="route-map">
            <div className="route-path" />
            {sampleStops.map((stop, index) => (
              <span key={stop.id} className={`route-pin pin-${index + 1}`}>{stop.order}</span>
            ))}
          </div>
          <div className="map-note">POI·지도 API 연결 전 화면 구조입니다. 실제 경로는 지도 SDK + 추천 API 결과로 교체합니다.</div>
        </section>

        <section className="panel route-list-panel">
          <div className="panel-head">
            <div>
              <span className="section-kicker">예상 코스 구조</span>
              <h2>추천 장소 슬롯</h2>
            </div>
          </div>
          <div className="route-list">
            {sampleStops.map((stop) => (
              <div key={stop.id} className="route-row static-route-row">
                <span className="stop-order">{stop.order}</span>
                <span className="stop-main">
                  <strong>{stop.name}</strong>
                  <small>{stop.type} · {stop.stay}</small>
                </span>
                <span className="pending-score">API 예정</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="impact-banner muted-impact">
        <div>
          <span>향후 계산 지표</span>
          <strong>관광 집중지역 밖 체류시간 · Local Score · 이동시간</strong>
        </div>
        <div className="action-row">
          <button className="secondary-button" type="button" disabled><Bookmark size={17}/> 저장</button>
          <button className="secondary-button" type="button" disabled><Share2 size={17}/> 공유</button>
          <button className="primary-button" type="button" disabled><Navigation size={17}/> 길찾기</button>
        </div>
      </section>
    </div>
  );
}
