import {
  ArrowRight,
  CalendarDays,
  Landmark,
  Leaf,
  MapPin,
  Sparkles,
  Store,
  Trees,
  TrendingUp,
  Utensils,
  Waves,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { regionImages } from "../data/regionImages";

const daeguImage = regionImages["대구광역시"];
const busanImage = regionImages["부산광역시"];
const ulsanImage = regionImages["울산광역시"];
const gyeongbukImage = regionImages["경상북도"];

const discoveryTypes = [
  { id: "quiet", label: "한적한 곳", description: "조용하고 여유로운", icon: Leaf },
  { id: "rising", label: "요즘 뜨는 곳", description: "새롭게 주목받는", icon: TrendingUp },
  { id: "sea", label: "바다가 있는 곳", description: "푸른 바다와 함께", icon: Waves },
  { id: "market", label: "전통시장", description: "로컬의 맛과 정취", icon: Store },
  { id: "culture", label: "문화·역사", description: "지역의 이야기를 따라", icon: Landmark },
  { id: "food", label: "맛집 여행", description: "지역의 특별한 맛", icon: Utensils },
  { id: "nature", label: "자연·힐링", description: "산·숲·자연 속에서", icon: Trees },
];

const previewRegions = [
  {
    name: "대구",
    image: daeguImage,
    eyebrow: "도심과 자연을 함께",
    description: "도시 풍경과 산책 코스를 한 번에 즐기는 여행을 떠올려보세요.",
    tags: ["도시 산책", "문화", "맛집"],
  },
  {
    name: "부산",
    image: busanImage,
    eyebrow: "바다와 함께하는 여행",
    description: "해변과 시장, 도심 풍경을 이어보는 지역 여행을 미리 살펴보세요.",
    tags: ["바다", "시장", "맛집"],
  },
  {
    name: "울산",
    image: ulsanImage,
    eyebrow: "바다와 자연 사이",
    description: "해안 풍경과 자연 산책을 함께 즐기는 코스를 상상해볼 수 있어요.",
    tags: ["바다", "자연·힐링", "산책"],
  },
  {
    name: "경북",
    image: gyeongbukImage,
    eyebrow: "역사와 자연이 이어지는 곳",
    description: "역사와 문화, 자연을 천천히 이어 둘러보는 여행을 떠올려보세요.",
    tags: ["문화·역사", "자연", "전통"],
  },
];

const themeOptions = ["바다", "전통시장", "문화·역사", "맛집", "카페", "자연·힐링"];

export default function RegionDiscoveryPage() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState("quiet");
  const [selectedThemes, setSelectedThemes] = useState(["문화·역사"]);
  const [season, setSeason] = useState("가을");

  function toggleTheme(theme) {
    setSelectedThemes((current) =>
      current.includes(theme)
        ? current.filter((item) => item !== theme)
        : [...current, theme]
    );
  }

  function moveToRecommendations() {
    document.getElementById("discover-recommendations")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <div className="discover-page">
      <section
        className="discover-hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(238, 247, 255, .98) 0%, rgba(238, 247, 255, .92) 42%, rgba(238, 247, 255, .38) 72%, rgba(238, 247, 255, .12) 100%), url(${busanImage})`,
        }}
      >
        <div className="discover-hero-copy">
          <span className="eyebrow">LOCAL DISCOVERY</span>
          <p className="discover-hero-kicker">사람이 몰리는 곳 말고, 나만의 새로운 여행지를 찾아보세요.</p>
          <h1>이번 여행, 어디로 가볼까요?</h1>
          <p>
            지역의 분위기와 여행 취향을 먼저 고르면, LOCAL:ON이 새로운 지역을 발견하는 흐름을 만들어드립니다.
          </p>
          <button type="button" className="primary-button" onClick={moveToRecommendations}>
            지역 둘러보기 <ArrowRight size={17} />
          </button>
        </div>
        <div className="discover-hero-note">
          <Sparkles size={18} />
          <span>데이터 연동 전, 지역 발견 화면의 디자인을 먼저 확인하는 미리보기입니다.</span>
        </div>
      </section>

      <section className="discover-section">
        <div className="discover-section-head">
          <div>
            <span className="section-kicker">TRAVEL MOOD</span>
            <h2>어떤 여행을 찾고 있나요?</h2>
            <p>가장 끌리는 여행 분위기를 먼저 골라보세요.</p>
          </div>
        </div>

        <div className="discover-type-grid">
          {discoveryTypes.map(({ id, label, description, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`discover-type-card ${selectedType === id ? "active" : ""}`}
              onClick={() => setSelectedType(id)}
            >
              <span className="discover-type-icon"><Icon size={22} /></span>
              <strong>{label}</strong>
              <small>{description}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="discover-section" id="discover-recommendations">
        <div className="discover-section-head horizontal">
          <div>
            <span className="section-kicker">WEEKLY DISCOVERY</span>
            <h2>이번에 발견할 추천 지역</h2>
            <p>홈에서 사용하던 지역 일러스트를 그대로 활용해 카드형 탐색 화면으로 구성했습니다.</p>
          </div>
          <button type="button" className="discover-link-button" onClick={() => navigate("/map")}>
            지도에서 보기 <ArrowRight size={16} />
          </button>
        </div>

        <div className="discover-region-grid">
          {previewRegions.map((region) => (
            <article className="discover-region-card" key={region.name}>
              <div className="discover-region-image-wrap">
                <img src={region.image} alt={`${region.name} 지역 여행 일러스트`} />
                <span className="discover-image-badge">{region.eyebrow}</span>
              </div>
              <div className="discover-region-body">
                <div className="discover-region-title-row">
                  <div>
                    <span className="section-kicker">LOCAL PREVIEW</span>
                    <h3>{region.name}</h3>
                  </div>
                  <MapPin size={18} />
                </div>
                <p>{region.description}</p>
                <div className="discover-tag-row">
                  {region.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
                <button type="button" className="discover-card-button" onClick={() => navigate("/map")}>
                  지역 보기 <ArrowRight size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="discover-lower-grid">
        <section className="discover-filter-panel">
          <div className="discover-section-head compact">
            <div>
              <span className="section-kicker">MY DISCOVERY</span>
              <h2>나에게 맞는 지역 찾기</h2>
              <p>선택 UI만 먼저 구성하고, 실제 추천 로직은 데이터 확정 후 연결할 수 있습니다.</p>
            </div>
          </div>

          <div className="discover-filter-row">
            <strong>여행 분위기</strong>
            <div className="discover-filter-options">
              {[
                ["quiet", "한적하게"],
                ["rising", "요즘 뜨는 곳"],
                ["sea", "바다 가까이"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={selectedType === value ? "active" : ""}
                  onClick={() => setSelectedType(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="discover-filter-row">
            <strong>관심 테마</strong>
            <div className="discover-filter-options wrap">
              {themeOptions.map((theme) => (
                <button
                  key={theme}
                  type="button"
                  className={selectedThemes.includes(theme) ? "active" : ""}
                  onClick={() => toggleTheme(theme)}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>

          <div className="discover-filter-row">
            <strong>여행 시기</strong>
            <label className="discover-season-select">
              <CalendarDays size={17} />
              <select value={season} onChange={(event) => setSeason(event.target.value)}>
                <option>봄</option>
                <option>여름</option>
                <option>가을</option>
                <option>겨울</option>
              </select>
            </label>
          </div>

          <button type="button" className="primary-button discover-search-button" onClick={moveToRecommendations}>
            이 조건으로 지역 찾아보기 <ArrowRight size={17} />
          </button>
        </section>

        <section className="discover-alternative-panel">
          <span className="section-kicker">ONE STEP FURTHER</span>
          <h2>유명한 곳 대신 이런 곳은 어때요?</h2>
          <p>익숙한 여행 취향을 기준으로 다른 지역까지 자연스럽게 탐색하도록 만드는 영역입니다.</p>

          <div className="discover-alternative-source">
            <img src={busanImage} alt="부산 여행 일러스트" />
            <div>
              <strong>바다 여행이 끌린다면</strong>
              <span>비슷한 분위기의 다른 지역까지 이어서 살펴보세요.</span>
            </div>
          </div>

          <div className="discover-alternative-arrow">
            <ArrowRight size={17} />
            <span>이런 지역도 함께</span>
          </div>

          <div className="discover-mini-grid">
            {[
              ["울산", ulsanImage, "바다 · 자연"],
              ["경북", gyeongbukImage, "역사 · 자연"],
              ["대구", daeguImage, "도시 · 맛집"],
            ].map(([name, image, description]) => (
              <button type="button" key={name} onClick={() => navigate("/map")}>
                <img src={image} alt={`${name} 지역 일러스트`} />
                <strong>{name}</strong>
                <small>{description}</small>
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="discover-bottom-preview">
        <div>
          <span className="section-kicker">NEXT STEP</span>
          <h2>지역을 발견했다면, 이제 여행 코스로 이어보세요.</h2>
          <p>지역 선택 이후에는 기존 테마 코스 화면으로 연결해 실제 장소와 동선을 구성할 수 있습니다.</p>
        </div>
        <button type="button" className="primary-button" onClick={() => navigate("/course/setup")}>
          테마 코스 만들기 <ArrowRight size={17} />
        </button>
      </section>
    </div>
  );
}
