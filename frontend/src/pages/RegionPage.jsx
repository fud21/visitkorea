import { ArrowLeft, ArrowRight, BarChart3 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import MetricCard from "../components/common/MetricCard";
import { fetchMunicipalities, fetchPlaces, fetchRegion, fetchRegions } from "../api/tourismApi";
import { useApiResource } from "../hooks/useApiResource";

const emptyRegion = {
  name: "선택 지역",
  provinceName: "",
  type: "",
  visitorCount: 0,
  visitorRatio: 0,
};

function formatVisitors(value) {
  const count = Number(value) || 0;
  if (count >= 100000000) return `${(count / 100000000).toFixed(1)}억 명`;
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만 명`;
  return `${count.toLocaleString("ko-KR")}명`;
}

export default function RegionPage() {
  const navigate = useNavigate();
  const { regionId } = useParams();
  const resource = useApiResource(() => fetchRegion(regionId), [regionId], emptyRegion);
  const placesResource = useApiResource(() => fetchPlaces(regionId, { limit: 5 }), [regionId], []);
  const provincesResource = useApiResource(fetchRegions, [], []);
  const comparisonProvince = resource.data.type === "PROVINCE"
    ? resource.data.name
    : resource.data.provinceName;
  const municipalitiesResource = useApiResource(
    () => comparisonProvince ? fetchMunicipalities(comparisonProvince) : Promise.resolve([]),
    [comparisonProvince],
    []
  );

  const region = {
    ...emptyRegion,
    ...resource.data,
    visitorCount: Number(resource.data.visitorCount) || 0,
    visitorRatio: Number(resource.data.visitorRatio) || 0,
  };
  const rankingPool = region.type === "PROVINCE"
    ? provincesResource.data
    : municipalitiesResource.data;
  const rank = [...rankingPool]
    .sort((left, right) => Number(right.visitorRatio) - Number(left.visitorRatio))
    .findIndex((item) => String(item.id) === String(region.id)) + 1;
  const chartRegions = [...municipalitiesResource.data]
    .sort((left, right) => Number(right.visitorRatio) - Number(left.visitorRatio))
    .slice(0, 10);
  const maxRatio = Math.max(...chartRegions.map((item) => Number(item.visitorRatio) || 0), 1);
  const topRegion = chartRegions[0];
  const topThreeRatio = chartRegions
    .slice(0, 3)
    .reduce((sum, item) => sum + (Number(item.visitorRatio) || 0), 0);

  return (
    <div className="page">
      {resource.loading && <div className="status-banner">지역 데이터를 불러오는 중입니다.</div>}
      {resource.usingFallback && <div className="status-banner warning">지역 데이터를 불러오지 못했습니다.</div>}
      <button className="back-button" type="button" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> 지도 탐색으로
      </button>

      <div className="region-title-row">
        <div>
          <span className="eyebrow">{region.provinceName || "REGIONAL DATA"}</span>
          <h1>{region.name} 관광 데이터 분석</h1>
          <p>공공 방문 데이터를 기준으로 방문 규모와 지역 내 관광객 집중 분포를 확인합니다.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => navigate(`/course/setup/${regionId}`)}>
          이 지역으로 코스 만들기 <ArrowRight size={17} />
        </button>
      </div>

      <div className="metric-grid four">
        <MetricCard label="방문객 수" value={formatVisitors(region.visitorCount)} sub="공공 방문 데이터" />
        <MetricCard label="전국 방문 비중" value={`${region.visitorRatio.toFixed(1)}%`} sub="전체 방문 대비" />
        <MetricCard
          label={region.type === "PROVINCE" ? "전국 순위" : "도내 순위"}
          value={rank > 0 ? `${rank}위` : "-"}
          sub={`비교 지역 ${rankingPool.length}곳`}
        />
        <MetricCard
          label={region.type === "PROVINCE" ? "하위 시·군·구" : "대표 추천 장소"}
          value={`${region.type === "PROVINCE" ? municipalitiesResource.data.length : placesResource.data.length}곳`}
          sub={region.type === "PROVINCE" ? "분포 분석 대상" : "상위 후보"}
        />
      </div>

      <div className="analysis-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="section-kicker">VISITOR CONCENTRATION</span>
              <h2>{comparisonProvince || region.name} 관광객 집중 추이</h2>
              <p className="panel-note">방문 비중이 높은 시·군·구 상위 10곳을 비교합니다.</p>
            </div>
          </div>

          <div className="concentration-chart" role="img" aria-label={`${comparisonProvince || region.name} 시군구 방문 비중 막대그래프`}>
            {municipalitiesResource.loading && <div className="empty-card">분포 데이터를 불러오는 중입니다.</div>}
            {chartRegions.map((item, index) => {
              const ratio = Number(item.visitorRatio) || 0;
              return (
                <button
                  type="button"
                  className={`concentration-row ${String(item.id) === String(region.id) ? "active" : ""}`}
                  key={item.id}
                  onClick={() => navigate(`/region/${item.id}`)}
                >
                  <span className="concentration-rank">{String(index + 1).padStart(2, "0")}</span>
                  <span className="concentration-name">{item.name}</span>
                  <span className="concentration-track">
                    <i style={{ width: `${Math.max(3, ratio / maxRatio * 100)}%` }} />
                  </span>
                  <strong>{ratio.toFixed(2)}%</strong>
                </button>
              );
            })}
            {!municipalitiesResource.loading && chartRegions.length === 0 && (
              <div className="empty-card">비교할 하위 지역 데이터가 없습니다.</div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="section-kicker">DATA INSIGHT</span>
              <h2>지역 방문 분석</h2>
            </div>
          </div>
          <div className="diagnosis-card">
            <BarChart3 size={22} />
            <div>
              <strong>
                {topRegion
                  ? `${topRegion.name}의 방문 비중이 ${Number(topRegion.visitorRatio).toFixed(2)}%로 가장 높습니다.`
                  : "하위 지역 방문 데이터가 준비되지 않았습니다."}
              </strong>
              <p>
                {topRegion
                  ? `상위 3개 지역의 방문 비중 합계는 ${topThreeRatio.toFixed(2)}%입니다. 코스에서는 상위 지역과 주변 생활권 장소를 함께 연결합니다.`
                  : "데이터가 추가되면 지역별 관광객 집중 정도를 비교할 수 있습니다."}
              </p>
            </div>
          </div>

          <h3 className="sub-title">대표 장소</h3>
          <div className="tag-row">
            {placesResource.data.map((place) => <span className="tag" key={place.id}>{place.name}</span>)}
            {!placesResource.loading && placesResource.data.length === 0 && <span className="tag">등록 장소 없음</span>}
          </div>
        </section>
      </div>
    </div>
  );
}
