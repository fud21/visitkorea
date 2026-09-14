import { ArrowRight, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import KakaoMap from "../components/map/KakaoMap";
import SchematicMap from "../components/map/SchematicMap";
import { regions } from "../data/mockData";

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const hasKakaoKey = Boolean(import.meta.env.VITE_KAKAO_MAP_JAVASCRIPT_KEY);
  const visibleRegions = regions.filter((region) =>
    `${region.name} ${region.province}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  function search(event) {
    event.preventDefault();
    if (visibleRegions.length === 1) navigate(`/region/${visibleRegions[0].id}`);
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="LOCAL DISCOVERY"
        title="유명한 곳에서 한 걸음 더, 지역으로."
        description="관광 데이터 기반으로 관광 집중지역과 로컬 발견지역을 함께 보여주고, 지역 생활권까지 이어지는 여행 코스를 추천합니다."
      />

      <form className="hero-search" onSubmit={search}>
        <Search size={20} />
        <input
          id="destination-search"
          name="destinationSearch"
          type="text"
          placeholder="어디로 떠나볼까요? 지역 또는 테마를 검색하세요."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="submit">검색</button>
      </form>

      <div className="home-grid">
        <section className="panel map-panel">
          <div className="panel-head">
            <div>
              <span className="section-kicker">전국 지도</span>
              <h2>관광객이 어디에 몰려있을까?</h2>
            </div>
            <button className="ghost-button" type="button">필터</button>
          </div>
          {hasKakaoKey ? <KakaoMap /> : <SchematicMap />}
          {!hasKakaoKey && <p className="panel-note">Kakao JavaScript 키가 없어 데모 지도를 표시합니다.</p>}
        </section>

        <aside className="panel discovery-panel">
          <div className="panel-head">
            <div>
              <span className="section-kicker">이번 주</span>
              <h2>로컬 발견 지역</h2>
            </div>
          </div>

          <div className="ranking-list">
            {visibleRegions.map((region) => (
              <button
                key={region.id}
                className="ranking-row"
                type="button"
                onClick={() => navigate(`/region/${region.id}`)}
              >
                <span className="rank">{String(region.rank).padStart(2, "0")}</span>
                <span className="ranking-main">
                  <strong>{region.name}</strong>
                  <small>{region.province}</small>
                </span>
                <span className="score-box">
                  <strong>{region.localPotential}</strong>
                  <small>Local</small>
                </span>
                <ArrowRight size={18} />
              </button>
            ))}
            {visibleRegions.length === 0 && <p className="empty-state">일치하는 지역이 없습니다.</p>}
          </div>
        </aside>
      </div>

      <section className="theme-section">
        <div className="panel-head">
          <div>
            <span className="section-kicker">테마 여행</span>
            <h2>관광지 밖으로 이어지는 이유를 골라보세요</h2>
          </div>
        </div>
        <div className="theme-grid">
          {[
            ["전통시장", "생활 상권과 먹거리"],
            ["빵지순례", "로컬 베이커리"],
            ["떡지순례", "지역 전통 간식"],
            ["현지인 맛집", "외지인보다 현지인 선호"],
          ].map(([title, desc]) => (
            <button key={title} className="theme-card" type="button" onClick={() => navigate("/course/setup/gyeongju")}>
              <strong>{title}</strong>
              <span>{desc}</span>
              <ArrowRight size={18} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
