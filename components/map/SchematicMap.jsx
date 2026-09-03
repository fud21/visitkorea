import { useNavigate } from "react-router-dom";
import { provinceVisitors } from "../../data/visitorData";

function markerClass(ratio) {
  if (ratio >= 10) return "score-high";
  if (ratio >= 5) return "score-mid";
  return "score-low";
}

function shortName(name) {
  return name
    .replace("특별자치도", "")
    .replace("특별자치시", "")
    .replace("특별시", "")
    .replace("광역시", "")
    .replace("도", "");
}

export default function SchematicMap() {
  const navigate = useNavigate();

  return (
    <div className="schematic-map">
      <div className="map-watermark">1차 도식 지도 · 방문자 비율 기준</div>
      <div className="korea-shape" />

      {provinceVisitors.map((region) => (
        <button
          key={region.name}
          type="button"
          className={`map-marker ${markerClass(region.visitorRatio)}`}
          style={{ left: `${region.mapX}%`, top: `${region.mapY}%` }}
          onClick={() => navigate(`/region/${encodeURIComponent(region.name)}`)}
          aria-label={`${region.name} 방문자 비율 ${region.visitorRatio}%`}
        >
          <strong>{region.visitorRatio}%</strong>
          <span>{shortName(region.name)}</span>
        </button>
      ))}

      <div className="map-legend">
        <span><i className="legend-dot high" /> 10% 이상</span>
        <span><i className="legend-dot mid" /> 5~10%</span>
        <span><i className="legend-dot low" /> 5% 미만</span>
      </div>
    </div>
  );
}
