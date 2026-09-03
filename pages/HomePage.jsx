import { ArrowRight, Search } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import KakaoMap from "../components/map/KakaoMap";
import { provinceVisitors } from "../data/visitorData";
import { formatVisitors } from "../utils/format";

export default function HomePage() {
  const navigate = useNavigate();

  const lowVisitCandidates = useMemo(
    () => [...provinceVisitors].sort((a, b) => a.visitorRatio - b.visitorRatio).slice(0, 5),
    []
  );

  return (
    <div className="page">
      <PageHeader
        eyebrow="LOCAL DISCOVERY"
        title="유명한 곳에서 한 걸음 더, 지역으로."
        description="한국관광 데이터랩의 지역별 방문 데이터를 기반으로 관광 방문이 어느 지역에 집중되는지 먼저 탐색합니다."
      />

      <section className="hero-search">
        <Search size={20} />
        <input
          id="destination-search"
          name="destinationSearch"
          type="text"
          placeholder="어디로 떠나볼까요? 지역 또는 테마를 검색하세요."
        />
        <button type="button">검색</button>
      </section>

      <div className="home-grid">
        <section className="panel map-panel">
          <div className="panel-head">
            <div>
              <span className="section-kicker">전국 방문 현황</span>
              <h2>광역별 방문자 비중</h2>
            </div>
            <span className="data-badge">DATA LAB 실제 데이터</span>
          </div>
          <KakaoMap />
        </section>

        <aside className="panel discovery-panel">
          <div className="panel-head">
            <div>
              <span className="section-kicker">탐색 후보</span>
              <h2>상대적 저방문 광역지역</h2>
            </div>
          </div>

          <p className="panel-note">
            현재는 방문자 비율 단일 지표 기준입니다. Local Score는 현지인·외지인·POI 데이터가 추가된 뒤 별도로 계산합니다.
          </p>

          <div className="ranking-list">
            {lowVisitCandidates.map((region, index) => (
              <button
                key={region.name}
                className="ranking-row"
                type="button"
                onClick={() => navigate(`/region/${encodeURIComponent(region.name)}`)}
              >
                <span className="rank">{String(index + 1).padStart(2, "0")}</span>
                <span className="ranking-main">
                  <strong>{region.name}</strong>
                  <small>{formatVisitors(region.visitorCount)}</small>
                </span>
                <span className="score-box">
                  <strong>{region.visitorRatio}%</strong>
                  <small>전국 비중</small>
                </span>
                <ArrowRight size={18} />
              </button>
            ))}
          </div>
        </aside>
      </div>

      <section className="theme-section">
        <div className="panel-head">
          <div>
            <span className="section-kicker">다음 단계</span>
            <h2>지역을 고른 뒤 로컬 테마로 코스를 좁힙니다</h2>
          </div>
        </div>
        <div className="theme-grid">
          {[
            ["전통시장", "지역 생활 상권과 먹거리"],
            ["빵지순례", "로컬 베이커리"],
            ["떡지순례", "지역 전통 간식"],
            ["현지인 맛집", "현지인 선호 장소"],
          ].map(([title, desc]) => (
            <div key={title} className="theme-card static-card">
              <strong>{title}</strong>
              <span>{desc}</span>
              <ArrowRight size={18} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
