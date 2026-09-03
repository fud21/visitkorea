import { ArrowLeft, Bookmark, Navigation, Share2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import MetricCard from "../components/common/MetricCard";
import { course } from "../data/mockData";

export default function CourseResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const config = location.state || {
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
          <span className="eyebrow">AI RECOMMENDATION</span>
          <h1>경주 반나절 로컬 코스</h1>
          <p>유명 관광지 {100 - config.localRatio}% · 로컬 {config.localRatio}% 기준으로 구성한 1차 추천 결과입니다.</p>
        </div>
      </div>

      <div className="metric-grid four">
        <MetricCard label="총 소요시간" value={course.summary.duration} />
        <MetricCard label="이동거리" value={course.summary.distance} />
        <MetricCard label="로컬 체류 비중" value={`${course.summary.localRatio}%`} />
        <MetricCard label="예상 비용" value={course.summary.budget} />
      </div>

      <div className="course-grid">
        <section className="panel route-map-panel">
          <div className="route-map">
            <div className="route-path" />
            {course.stops.map((stop, index) => (
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
          <div className="map-note">현재는 UI 구현용 도식 지도입니다. 실제 서비스에서는 Kakao/Naver Maps SDK로 교체합니다.</div>
        </section>

        <section className="panel route-list-panel">
          <div className="panel-head">
            <div>
              <span className="section-kicker">코스 순서</span>
              <h2>추천 장소</h2>
            </div>
          </div>
          <div className="route-list">
            {course.stops.map((stop) => (
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

      <section className="impact-banner">
        <div>
          <span>이번 여행의 지역 분산 효과</span>
          <strong>관광 집중지역 밖 예상 체류 2시간 35분</strong>
        </div>
        <div className="action-row">
          <button className="secondary-button" type="button"><Bookmark size={17}/> 저장</button>
          <button className="secondary-button" type="button"><Share2 size={17}/> 공유</button>
          <button className="primary-button" type="button"><Navigation size={17}/> 길찾기 시작</button>
        </div>
      </section>
    </div>
  );
}
