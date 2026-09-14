import { useNavigate } from "react-router-dom";
import { regions } from "../../data/mockData";

const markerStyle = {
  gyeongju: { left: "69%", top: "45%" },
  buyeo: { left: "45%", top: "49%" },
  yeongju: { left: "63%", top: "31%" },
  gunsan: { left: "37%", top: "58%" },
};

export default function SchematicMap() {
  const navigate = useNavigate();

  return (
    <div className="schematic-map">
      <div className="map-watermark">대한민국 관광 분산 지도</div>
      <div className="korea-shape" />
      {regions.map((region) => (
        <button
          key={region.id}
          type="button"
          className={`map-marker score-${region.tourismScore >= 70 ? "high" : region.tourismScore >= 50 ? "mid" : "low"}`}
          style={markerStyle[region.id]}
          onClick={() => navigate(`/region/${region.id}`)}
        >
          <strong>{region.tourismScore}</strong>
          <span>{region.name}</span>
        </button>
      ))}
      <div className="map-legend">
        <span><i className="legend-dot high" /> 관광 집중</span>
        <span><i className="legend-dot mid" /> 보통</span>
        <span><i className="legend-dot low" /> 로컬 발견</span>
      </div>
    </div>
  );
}
