import { useNavigate } from "react-router-dom";

const markerPositions = [
  { left: "48%", top: "20%" },
  { left: "64%", top: "31%" },
  { left: "38%", top: "38%" },
  { left: "58%", top: "49%" },
  { left: "36%", top: "61%" },
  { left: "62%", top: "67%" },
];

export default function SchematicMap({ regions = [] }) {
  const navigate = useNavigate();
  const visibleRegions = regions.slice(0, markerPositions.length);

  return (
    <div className="schematic-map">
      <div className="map-watermark">대한민국 관광 분산 지도</div>
      <div className="korea-shape" />
      {visibleRegions.map((region, index) => {
        const ratio = Number(region.visitorRatio) || 0;
        const scoreClass = ratio >= 10 ? "high" : ratio >= 5 ? "mid" : "low";
        return (
          <button
            key={region.id}
            type="button"
            className={`map-marker score-${scoreClass}`}
            style={markerPositions[index]}
            onClick={() => navigate(`/region/${region.id}`)}
          >
            <strong>{ratio.toFixed(1)}%</strong>
            <span>{region.name}</span>
          </button>
        );
      })}
      <div className="map-legend">
        <span><i className="legend-dot high" /> 방문 비중 높음</span>
        <span><i className="legend-dot mid" /> 보통</span>
        <span><i className="legend-dot low" /> 로컬 발견</span>
      </div>
    </div>
  );
}
