import { ArrowRight, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/common/PageHeader";
import KakaoMap from "../components/map/KakaoMap";
import SchematicMap from "../components/map/SchematicMap";
import { fetchRegions } from "../api/tourismApi";
import { useApiResource } from "../hooks/useApiResource";
import { provinceVisitors } from "../data/visitorData";

const fallbackRegions = provinceVisitors.map((region, index) => ({
  id: region.province,
  name: region.province,
  visitorRatio: region.visitorRatio,
  rank: index + 1,
}));

export default function MapExplorePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const hasKakaoKey = Boolean(import.meta.env.VITE_KAKAO_MAP_JAVASCRIPT_KEY);
  const resource = useApiResource(fetchRegions, [], fallbackRegions);
  const apiRegions = [...resource.data]
    .sort((left, right) => right.visitorRatio - left.visitorRatio)
    .map((region, index) => ({ ...region, rank: index + 1 }));
  const normalizedQuery = query.trim().toLowerCase();
  const visibleRegions = apiRegions.filter((region) =>
    `${region.name} ${region.provinceName || ""}`.toLowerCase().includes(normalizedQuery)
  );
  const displayedRegions = visibleRegions.slice(0, 8);

  function search(event) {
    event.preventDefault();
    if (visibleRegions.length === 1) navigate(`/region/${visibleRegions[0].id}`);
  }

  return (
    <div className="page">
      {resource.loading && <div className="status-banner">지역 데이터를 불러오는 중입니다.</div>}
      {resource.usingFallback && <div className="status-banner warning">백엔드 연결 전 데모 지역 데이터를 표시합니다.</div>}
      <PageHeader
        eyebrow="LOCAL DISCOVERY"
        title="유명한 곳에서 한 걸음 더, 지역으로."
        description="관광 데이터 기반으로 지역별 방문 비중을 비교하고 지역 생활권까지 이어지는 여행을 추천합니다."
      />

      <form className="hero-search" onSubmit={search}>
        <Search size={20} />
        <input
          id="destination-search"
          name="destinationSearch"
          type="text"
          placeholder="시·도 이름을 검색하세요."
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
          </div>
          {hasKakaoKey ? <KakaoMap regions={apiRegions} /> : <SchematicMap regions={apiRegions} />}
          {!hasKakaoKey && <p className="panel-note">Kakao JavaScript 키가 없어 데모 지도를 표시합니다.</p>}
        </section>

        <aside className="panel discovery-panel">
          <div className="panel-head">
            <div>
              <span className="section-kicker">방문 비중</span>
              <h2>지역 데이터</h2>
            </div>
          </div>

          <div className="ranking-list">
            {displayedRegions.map((region) => (
              <button
                key={region.id}
                className="ranking-row"
                type="button"
                onClick={() => navigate(`/region/${region.id}`)}
              >
                <span className="rank">{String(region.rank).padStart(2, "0")}</span>
                <span className="ranking-main">
                  <strong>{region.name}</strong>
                  <small>{region.type === "PROVINCE" ? "광역지자체" : region.provinceName}</small>
                </span>
                <span className="score-box">
                  <strong>{Number(region.visitorRatio).toFixed(1)}%</strong>
                  <small>방문</small>
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
            ["문화·역사", "지역의 역사와 문화"],
            ["카페/찻집", "지역에서 쉬어가는 시간"],
            ["맛집", "지역 방문 순위 기반"],
          ].map(([title, description]) => (
            <button key={title} className="theme-card" type="button" onClick={() => navigate(`/course/setup?theme=${encodeURIComponent(title)}`)}>
              <strong>{title}</strong>
              <span>{description}</span>
              <ArrowRight size={18} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
