import { ArrowLeft, ArrowRight, TrendingUp } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import MetricCard from "../components/common/MetricCard";
import { regionDetail } from "../data/mockData";

export default function RegionPage() {
  const navigate = useNavigate();
  const { regionId } = useParams();
  const region = regionDetail;

  return (
    <div className="page">
      <button className="back-button" type="button" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> 지도 탐색으로
      </button>

      <div className="region-title-row">
        <div>
          <span className="eyebrow">{region.province}</span>
          <h1>{region.name} 상세 분석</h1>
          <p>{region.message}</p>
        </div>
        <button className="primary-button" type="button" onClick={() => navigate(`/course/setup/${regionId}`)}>
          이 지역으로 코스 만들기 <ArrowRight size={17} />
        </button>
      </div>

      <div className="metric-grid four">
        <MetricCard label="관광 집중도" value={`${region.tourismScore}%`} sub="관광객 유입 높음" />
        <MetricCard label="로컬 발견 가능성" value={`${region.localPotential}`} sub="추천 지역" />
        <MetricCard label="평균 체류시간" value={`${region.stayHours}시간`} sub="지역 기준" />
        <MetricCard label="혼잡 집중 시간" value={region.peakTime} sub="예시 데이터" />
      </div>

      <div className="analysis-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="section-kicker">시간대 분석</span>
              <h2>관광객 집중 추이</h2>
            </div>
          </div>
          <div className="chart-placeholder">
            <div className="chart-line" />
            <span className="chart-label label-1">09</span>
            <span className="chart-label label-2">12</span>
            <span className="chart-label label-3">15</span>
            <span className="chart-label label-4">18</span>
            <div className="chart-peak">Peak 82%</div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="section-kicker">AI 1 분석</span>
              <h2>지역 진단</h2>
            </div>
          </div>
          <div className="diagnosis-card">
            <TrendingUp size={22} />
            <div>
              <strong>유명 관광지 주변 체류가 집중되어 있습니다.</strong>
              <p>시장·생활상권·로컬 먹거리 장소를 결합하면 관광 집중지역 밖으로 동선을 확장할 수 있습니다.</p>
            </div>
          </div>

          <h3 className="sub-title">대표 관광지</h3>
          <div className="tag-row">
            {region.topPlaces.map((place) => <span className="tag" key={place}>{place}</span>)}
          </div>
        </section>
      </div>
    </div>
  );
}
