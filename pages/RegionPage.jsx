import { ArrowLeft, ArrowRight, Database, MapPinned } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MetricCard from "../components/common/MetricCard";
import { getMunicipalitiesByProvince, getProvinceByName } from "../data/visitorData";
import { formatVisitors, safeDecode } from "../utils/format";

export default function RegionPage() {
  const navigate = useNavigate();
  const { regionId } = useParams();
  const provinceName = safeDecode(regionId);
  const province = getProvinceByName(provinceName);
  const municipalities = useMemo(
    () => getMunicipalitiesByProvince(provinceName),
    [provinceName]
  );
  const [viewMode, setViewMode] = useState("top");

  if (!province) {
    return (
      <div className="page">
        <button className="back-button" type="button" onClick={() => navigate("/")}>
          <ArrowLeft size={18} /> 전국 지도로
        </button>
        <section className="panel"><h2>지역 데이터를 찾을 수 없습니다.</h2></section>
      </div>
    );
  }

  const highest = municipalities[0];
  const lowest = municipalities[municipalities.length - 1];
  const visibleMunicipalities = viewMode === "top"
    ? municipalities.slice(0, 10)
    : [...municipalities].sort((a, b) => a.visitorRatio - b.visitorRatio).slice(0, 10);
  const maxRatio = Math.max(...visibleMunicipalities.map((item) => item.visitorRatio), 1);

  function startCourse(municipality) {
    navigate(`/course/setup/${encodeURIComponent(municipality.name)}`, {
      state: {
        provinceName,
        municipality,
      },
    });
  }

  return (
    <div className="page">
      <button className="back-button" type="button" onClick={() => navigate("/")}>
        <ArrowLeft size={18} /> 전국 지도로
      </button>

      <div className="region-title-row">
        <div>
          <span className="eyebrow">광역 지역 분석</span>
          <h1>{province.name}</h1>
          <p>
            광역 방문자 비중과 내부 시·군·구 방문 분포를 비교합니다. 현재 화면은 실제 방문 데이터만 사용하며 임의의 관광 집중 점수는 계산하지 않습니다.
          </p>
        </div>
        <span className="data-badge"><Database size={15} /> DATA LAB</span>
      </div>

      <div className="metric-grid four">
        <MetricCard label="광역 방문자 수" value={formatVisitors(province.visitorCount)} sub="원본 집계값" />
        <MetricCard label="전국 방문 비중" value={`${province.visitorRatio}%`} sub="광역지자체 기준" />
        <MetricCard label="기초지자체 수" value={`${municipalities.length}개`} sub="CSV 포함 지역" />
        <MetricCard label="방문 비중 상위" value={highest?.name || "-"} sub={highest ? `${highest.visitorRatio}%` : "-"} />
      </div>

      <div className="analysis-grid region-analysis-grid">
        <section className="panel municipality-panel">
          <div className="panel-head wrap-head">
            <div>
              <span className="section-kicker">시·군·구 분포</span>
              <h2>{viewMode === "top" ? "방문 비중 상위 지역" : "상대적 저방문 지역"}</h2>
            </div>
            <div className="segmented-control" role="group" aria-label="지역 분포 정렬">
              <button type="button" className={viewMode === "top" ? "active" : ""} onClick={() => setViewMode("top")}>상위 10</button>
              <button type="button" className={viewMode === "low" ? "active" : ""} onClick={() => setViewMode("low")}>낮은 10</button>
            </div>
          </div>

          <div className="municipality-bars">
            {visibleMunicipalities.map((item, index) => (
              <button
                type="button"
                className="municipality-bar-row"
                key={`${viewMode}-${item.name}`}
                onClick={() => startCourse(item)}
              >
                <span className="bar-rank">{index + 1}</span>
                <span className="bar-name">{item.name}</span>
                <span className="bar-track" aria-hidden="true">
                  <span className="bar-fill" style={{ width: `${Math.max((item.visitorRatio / maxRatio) * 100, 3)}%` }} />
                </span>
                <strong>{item.visitorRatio}%</strong>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        </section>

        <aside className="panel">
          <span className="section-kicker">지역 선택</span>
          <h2>어디를 더 살펴볼까?</h2>

          <div className="compare-card high-card">
            <span>현재 방문 비중 상위</span>
            <strong>{highest?.name}</strong>
            <small>{highest ? `${formatVisitors(highest.visitorCount)} · ${highest.visitorRatio}%` : "-"}</small>
          </div>

          <div className="compare-card low-card">
            <span>상대적 저방문 후보</span>
            <strong>{lowest?.name}</strong>
            <small>{lowest ? `${formatVisitors(lowest.visitorCount)} · ${lowest.visitorRatio}%` : "-"}</small>
          </div>

          <div className="analysis-notice">
            <MapPinned size={20} />
            <div>
              <strong>현재 단계의 해석</strong>
              <p>방문 비중이 낮다고 곧바로 추천 지역인 것은 아닙니다. 다음 데이터에서 관광지·시장·현지인 선호 장소를 결합해 Local Score를 산출할 예정입니다.</p>
            </div>
          </div>

          {lowest && (
            <button className="primary-button full" type="button" onClick={() => startCourse(lowest)}>
              {lowest.name} 코스 설정으로 <ArrowRight size={17} />
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
