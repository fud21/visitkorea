import {
  ArrowRight,
  Map,
  Route,
  Sparkles,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import heroIllustration from "../assets/home.png";

const discoveryRegions = [
  {
    id: "gyeongju",
    rank: "01",
    name: "경주",
    province: "경상북도",
    visitorRatio: 14.8,
    type: "문화·역사",
    imageClass: "region-image-1",
  },
  {
    id: "buyeo",
    rank: "02",
    name: "부여",
    province: "충청남도",
    visitorRatio: 4.3,
    type: "백제 문화",
    imageClass: "region-image-2",
  },
  {
    id: "yeongju",
    rank: "03",
    name: "영주",
    province: "경상북도",
    visitorRatio: 3.8,
    type: "자연·전통",
    imageClass: "region-image-3",
  },
  {
    id: "gunsan",
    rank: "04",
    name: "군산",
    province: "전북특별자치도",
    visitorRatio: 5.1,
    type: "근대 문화",
    imageClass: "region-image-4",
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-landing">
      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="eyebrow">
            LOCAL DISCOVERY
          </span>

          <h1>
            유명한 곳에서 한 걸음 더,
            <br />
            지역으로.
          </h1>

          <p>
            관광 데이터를 기반으로
            관광객이 많이 찾는 지역과
            상대적으로 덜 알려진 지역을 연결해,
            지역 생활권까지 이어지는 여행을 제안합니다.
          </p>

          <div className="home-hero-actions">
            <button
              type="button"
              className="primary-button home-main-action"
              onClick={() => navigate("/map")}
            >
              <Map size={18} />
              지도 탐색하기
            </button>

            <button
              type="button"
              className="secondary-button home-secondary-action"
              onClick={() =>
                navigate("/course/setup/gyeongju")
              }
            >
              <Route size={18} />
              코스 추천 받기
            </button>
          </div>
        </div>

        {/* */}
        <div className="home-hero-visual">
            <div className="hero-image-card">
                <img
                src={heroIllustration}
                alt="지역 관광과 로컬 여행을 연결하는 서비스 일러스트"
                className="hero-illustration"
                />

                <div className="hero-visual-label">
                <Sparkles size={17} />

                <div>
                    <strong>LOCAL:ON</strong>
                    <span>지역으로 이어지는 여행</span>
                </div>
                </div>
            </div>
            </div>
      </section>

      {/* DISCOVERY */}
      <section className="home-discovery">
        <div className="home-section-head">
          <div>
            <span className="section-kicker">
              LOCAL DISCOVERY
            </span>

            <h2>
              이번 주 둘러볼 지역
            </h2>

            <p>
              관광 데이터를 바탕으로
              새로운 지역을 탐색해보세요.
            </p>
          </div>

          <button
            type="button"
            className="home-more-button"
            onClick={() => navigate("/map")}
          >
            전체 지역 보기
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="home-region-grid">
          {discoveryRegions.map((region) => (
            <button
              type="button"
              key={region.id}
              className="home-region-card"
              onClick={() =>
                navigate(
                  `/region/${region.id}`
                )
              }
            >
              <div
                className={`home-region-image ${region.imageClass}`}
              >
                <span className="home-region-rank">
                  {region.rank}
                </span>

                <span className="home-region-type">
                  {region.type}
                </span>
              </div>

              <div className="home-region-content">
                <div>
                  <strong>
                    {region.name}
                  </strong>

                  <span>
                    {region.province}
                  </span>
                </div>

                <ArrowRight size={18} />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* WHY */}
      <section className="home-value-section">
        <div className="home-value-card">
          <span>01</span>

          <div>
            <strong>
              관광 집중지역 확인
            </strong>

            <p>
              지역별 방문 데이터를 지도에서
              비교합니다.
            </p>
          </div>
        </div>

        <div className="home-value-card">
          <span>02</span>

          <div>
            <strong>
              숨은 지역 발견
            </strong>

            <p>
              상대적으로 방문 비중이 낮은
              지역을 탐색합니다.
            </p>
          </div>
        </div>

        <div className="home-value-card">
          <span>03</span>

          <div>
            <strong>
              로컬 코스 연결
            </strong>

            <p>
              시장·맛집·지역 상권을 연결해
              여행 코스를 만듭니다.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}