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

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { regionImages } from "../data/regionImages";


const daeguImage = regionImages["대구광역시"];
const busanImage = regionImages["부산광역시"];
const ulsanImage = regionImages["울산광역시"];
const gyeongbukImage = regionImages["경상북도"];


const discoveryTypes = [
  {
    id: "quiet",
    label: "한적한 곳",
    description: "조용하고 여유로운",
    icon: Leaf,
  },
  {
    id: "rising",
    label: "요즘 뜨는 곳",
    description: "새롭게 주목받는",
    icon: TrendingUp,
  },
  {
    id: "sea",
    label: "바다가 있는 곳",
    description: "푸른 바다와 함께",
    icon: Waves,
  },
  {
    id: "market",
    label: "전통시장",
    description: "로컬의 맛과 정취",
    icon: Store,
  },
  {
    id: "culture",
    label: "문화·역사",
    description: "지역의 이야기를 따라",
    icon: Landmark,
  },
  {
    id: "food",
    label: "맛집 여행",
    description: "지역의 특별한 맛",
    icon: Utensils,
  },
  {
    id: "nature",
    label: "자연·힐링",
    description: "산·숲·자연 속에서",
    icon: Trees,
  },
];


const themeOptions = [
  "바다",
  "전통시장",
  "문화·역사",
  "맛집",
  "카페",
  "자연·힐링",
];


export default function RegionDiscoveryPage() {
  const navigate = useNavigate();

  // 처음에는 아무 분위기도 선택하지 않음
  // → 전국 로컬발견가능성 TOP4 표시
  const [selectedType, setSelectedType] = useState(null);

  // API에서 받아온 추천 지역
  const [recommendedRegions, setRecommendedRegions] = useState([]);

  // 로딩 및 오류 상태
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [regionError, setRegionError] = useState("");

  // 기존 하단 UI 상태
  const [selectedThemes, setSelectedThemes] = useState(["문화·역사"]);
  const [season, setSeason] = useState("가을");


  // ============================================================
  // 지역 발견 API 호출
  // ============================================================

  useEffect(() => {
    async function loadRecommendedRegions() {
      setLoadingRegions(true);
      setRegionError("");

      try {
        const query = selectedType
          ? `?type=${selectedType}&limit=4`
          : "?limit=4";

        const response = await fetch(
          `/api/regions/discover${query}`
        );

        if (!response.ok) {
          throw new Error(
            "지역 추천 데이터를 불러오지 못했습니다."
          );
        }

        const data = await response.json();

        setRecommendedRegions(
          Array.isArray(data.regions)
            ? data.regions
            : []
        );
      } catch (error) {
        console.error(error);

        setRecommendedRegions([]);

        setRegionError(
          "추천 지역을 불러오는 중 문제가 발생했습니다."
        );
      } finally {
        setLoadingRegions(false);
      }
    }

    loadRecommendedRegions();
  }, [selectedType]);


  // ============================================================
  // 현재 선택한 여행 분위기 이름
  // ============================================================

  function getTypeLabel() {
    if (!selectedType) {
      return "로컬발견가능성";
    }

    return (
      discoveryTypes.find(
        (item) => item.id === selectedType
      )?.label ?? "추천 지역"
    );
  }


  // ============================================================
  // 지역 이미지
  // 시군구 전용 이미지가 없으므로 시도 이미지를 사용
  // ============================================================

  function getRegionImage(region) {
    return regionImages[region.sido] ?? null;
  }


  // ============================================================
  // 유형별 추가 데이터 표시
  // ============================================================

  function getExtraTag(region) {
    if (!selectedType) {
      return null;
    }

    if (
      selectedType === "quiet"
      && region.recentVisitors != null
    ) {
      return `최근 방문자 ${Math.round(
        region.recentVisitors
      ).toLocaleString()}명`;
    }

    if (
      selectedType === "rising"
      && region.growthRate != null
    ) {
      return `증가율 ${Number(
        region.growthRate
      ).toFixed(1)}%`;
    }

    if (
      selectedType === "sea"
      && region.seaPlaceCount != null
    ) {
      return `바다 관광지 ${region.seaPlaceCount}곳`;
    }

    if (
      selectedType === "market"
      && region.marketCount != null
    ) {
      return `전통시장 ${region.marketCount}곳`;
    }

    if (
      selectedType === "culture"
      && region.culturePlaceCount != null
    ) {
      return `문화·역사 ${region.culturePlaceCount}곳`;
    }

    if (
      selectedType === "food"
      && region.foodCount != null
    ) {
      return `맛집 ${region.foodCount}곳`;
    }

    if (
      selectedType === "nature"
      && region.naturePlaceCount != null
    ) {
      return `자연·힐링 ${region.naturePlaceCount}곳`;
    }

    return null;
  }


  // ============================================================
  // 하단 기존 필터 UI
  // ============================================================

  function toggleTheme(theme) {
    setSelectedThemes((current) =>
      current.includes(theme)
        ? current.filter(
            (item) => item !== theme
          )
        : [...current, theme]
    );
  }


  function moveToRecommendations() {
    document
      .getElementById("discover-recommendations")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }


  return (
    <div className="discover-page">

      {/* ===================================================== */}
      {/* Hero */}
      {/* ===================================================== */}

      <section
        className="discover-hero"
        style={{
          backgroundImage: `
            linear-gradient(
              90deg,
              rgba(238, 247, 255, .98) 0%,
              rgba(238, 247, 255, .92) 42%,
              rgba(238, 247, 255, .38) 72%,
              rgba(238, 247, 255, .12) 100%
            ),
            url(${busanImage})
          `,
        }}
      >
        <div className="discover-hero-copy">
          <span className="eyebrow">
            LOCAL DISCOVERY
          </span>

          <p className="discover-hero-kicker">
            사람이 몰리는 곳 말고,
            나만의 새로운 여행지를 찾아보세요.
          </p>

          <h1>
            이번 여행, 어디로 가볼까요?
          </h1>

          <p>
            지역의 분위기와 여행 취향을 먼저 고르면,
            LOCAL:ON이 새로운 지역을 발견하는 흐름을
            만들어드립니다.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={moveToRecommendations}
          >
            지역 둘러보기
            <ArrowRight size={17} />
          </button>
        </div>

        <div className="discover-hero-note">
          <Sparkles size={18} />

          <span>
            로컬발견가능성 데이터와 여행 분위기를 반영한
            추천 지역을 확인해보세요.
          </span>
        </div>
      </section>


      {/* ===================================================== */}
      {/* 여행 분위기 선택 */}
      {/* ===================================================== */}

      <section className="discover-section">

        <div className="discover-section-head">
          <div>
            <span className="section-kicker">
              TRAVEL MOOD
            </span>

            <h2>
              어떤 여행을 찾고 있나요?
            </h2>

            <p>
              가장 끌리는 여행 분위기를 먼저 골라보세요.
            </p>
          </div>
        </div>


        <div className="discover-type-grid">

          {discoveryTypes.map(
            ({
              id,
              label,
              description,
              icon: Icon,
            }) => (
              <button
                key={id}
                type="button"
                className={
                  `discover-type-card ${
                    selectedType === id
                      ? "active"
                      : ""
                  }`
                }
                onClick={() =>
                  setSelectedType(id)
                }
              >
                <span className="discover-type-icon">
                  <Icon size={22} />
                </span>

                <strong>
                  {label}
                </strong>

                <small>
                  {description}
                </small>
              </button>
            )
          )}

        </div>

      </section>


      {/* ===================================================== */}
      {/* 추천 지역 */}
      {/* ===================================================== */}

      <section
        className="discover-section"
        id="discover-recommendations"
      >

        <div className="discover-section-head horizontal">

          <div>
            <span className="section-kicker">
              WEEKLY DISCOVERY
            </span>

            <h2>
              이번에 발견할 추천 지역
            </h2>

            <p>
              {selectedType
                ? `${getTypeLabel()} 조건에 맞는 지역 중 로컬발견가능성 점수가 높은 지역입니다.`
                : "전국 로컬발견가능성 점수를 기준으로 추천한 TOP 4 지역입니다."}
            </p>
          </div>


          <button
            type="button"
            className="discover-link-button"
            onClick={() =>
              navigate("/map")
            }
          >
            지도에서 보기
            <ArrowRight size={16} />
          </button>

        </div>


        <div className="discover-region-grid">

          {loadingRegions && (
            <p>
              추천 지역을 불러오는 중입니다...
            </p>
          )}


          {!loadingRegions && regionError && (
            <p>
              {regionError}
            </p>
          )}


          {!loadingRegions
            && !regionError
            && recommendedRegions.length === 0 && (
              <p>
                조건에 맞는 추천 지역이 없습니다.
              </p>
            )}


          {!loadingRegions
            && !regionError
            && recommendedRegions.map((region) => {

              const regionImage =
                getRegionImage(region);

              const extraTag =
                getExtraTag(region);

              return (
                <article
                  className="discover-region-card"
                  key={
                    `${region.sido}-${region.sigungu}`
                  }
                >

                  <div className="discover-region-image-wrap">

                    {regionImage ? (
                      <img
                        src={regionImage}
                        alt={
                          `${region.sigungu} 지역 여행 일러스트`
                        }
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          minHeight: "180px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#eef5fb",
                          color: "#52708c",
                        }}
                      >
                        <MapPin size={30} />
                      </div>
                    )}


                    <span className="discover-image-badge">
                      {getTypeLabel()}
                    </span>

                  </div>


                  <div className="discover-region-body">

                    <div className="discover-region-title-row">

                      <div>
                        <span className="section-kicker">
                          {region.sido}
                        </span>

                        <h3>
                          {region.sigungu}
                        </h3>
                      </div>

                      <MapPin size={18} />

                    </div>


                    <p>
                      {selectedType
                        ? `${getTypeLabel()} 후보 지역 중 로컬발견가능성 점수를 기준으로 추천된 지역입니다.`
                        : "전국 로컬발견가능성 점수를 기준으로 추천된 지역입니다."}
                    </p>


                    <div className="discover-tag-row">

                      <span>
                        로컬발견{" "}
                        {Number(
                          region.score
                        ).toFixed(2)}
                      </span>


                      <span>
                        추천 {region.rank}위
                      </span>


                      {extraTag && (
                        <span>
                          {extraTag}
                        </span>
                      )}

                    </div>


                    <button
                      type="button"
                      className="discover-card-button"
                      onClick={() =>
                        navigate("/map")
                      }
                    >
                      지역 보기
                      <ArrowRight size={16} />
                    </button>

                  </div>

                </article>
              );
            })}

        </div>

      </section>


      {/* ===================================================== */}
      {/* 하단 영역 */}
      {/* ===================================================== */}

      <div className="discover-lower-grid">


        {/* --------------------------------------------------- */}
        {/* 나에게 맞는 지역 찾기 */}
        {/* --------------------------------------------------- */}

        <section className="discover-filter-panel">

          <div className="discover-section-head compact">
            <div>
              <span className="section-kicker">
                MY DISCOVERY
              </span>

              <h2>
                나에게 맞는 지역 찾기
              </h2>

              <p>
                여행 분위기는 추천 결과에 바로 반영되며,
                관심 테마와 여행 시기는 이후 확장할 수 있습니다.
              </p>
            </div>
          </div>


          <div className="discover-filter-row">

            <strong>
              여행 분위기
            </strong>

            <div className="discover-filter-options">

              {[
                ["quiet", "한적하게"],
                ["rising", "요즘 뜨는 곳"],
                ["sea", "바다 가까이"],
              ].map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      selectedType === value
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setSelectedType(value)
                    }
                  >
                    {label}
                  </button>
                )
              )}

            </div>

          </div>


          <div className="discover-filter-row">

            <strong>
              관심 테마
            </strong>

            <div className="discover-filter-options wrap">

              {themeOptions.map((theme) => (
                <button
                  key={theme}
                  type="button"
                  className={
                    selectedThemes.includes(theme)
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    toggleTheme(theme)
                  }
                >
                  {theme}
                </button>
              ))}

            </div>

          </div>


          <div className="discover-filter-row">

            <strong>
              여행 시기
            </strong>

            <label className="discover-season-select">

              <CalendarDays size={17} />

              <select
                value={season}
                onChange={(event) =>
                  setSeason(
                    event.target.value
                  )
                }
              >
                <option>
                  봄
                </option>

                <option>
                  여름
                </option>

                <option>
                  가을
                </option>

                <option>
                  겨울
                </option>
              </select>

            </label>

          </div>


          <button
            type="button"
            className="primary-button discover-search-button"
            onClick={moveToRecommendations}
          >
            이 조건으로 지역 찾아보기
            <ArrowRight size={17} />
          </button>

        </section>


        {/* --------------------------------------------------- */}
        {/* 다른 지역 제안 */}
        {/* --------------------------------------------------- */}

        <section className="discover-alternative-panel">

          <span className="section-kicker">
            ONE STEP FURTHER
          </span>

          <h2>
            유명한 곳 대신 이런 곳은 어때요?
          </h2>

          <p>
            익숙한 여행 취향을 기준으로
            다른 지역까지 자연스럽게 탐색하도록 만드는 영역입니다.
          </p>


          <div className="discover-alternative-source">

            <img
              src={busanImage}
              alt="부산 여행 일러스트"
            />

            <div>
              <strong>
                바다 여행이 끌린다면
              </strong>

              <span>
                비슷한 분위기의 다른 지역까지
                이어서 살펴보세요.
              </span>
            </div>

          </div>


          <div className="discover-alternative-arrow">

            <ArrowRight size={17} />

            <span>
              이런 지역도 함께
            </span>

          </div>


          <div className="discover-mini-grid">

            {[
              [
                "울산",
                ulsanImage,
                "바다 · 자연",
              ],
              [
                "경북",
                gyeongbukImage,
                "역사 · 자연",
              ],
              [
                "대구",
                daeguImage,
                "도시 · 맛집",
              ],
            ].map(
              ([
                name,
                image,
                description,
              ]) => (
                <button
                  type="button"
                  key={name}
                  onClick={() =>
                    navigate("/map")
                  }
                >
                  <img
                    src={image}
                    alt={
                      `${name} 지역 일러스트`
                    }
                  />

                  <strong>
                    {name}
                  </strong>

                  <small>
                    {description}
                  </small>
                </button>
              )
            )}

          </div>

        </section>

      </div>


      {/* ===================================================== */}
      {/* Next step */}
      {/* ===================================================== */}

      <section className="discover-bottom-preview">

        <div>
          <span className="section-kicker">
            NEXT STEP
          </span>

          <h2>
            지역을 발견했다면,
            이제 여행 코스로 이어보세요.
          </h2>

          <p>
            지역 선택 이후에는 기존 테마 코스 화면으로 연결해
            실제 장소와 동선을 구성할 수 있습니다.
          </p>
        </div>


        <button
          type="button"
          className="primary-button"
          onClick={() =>
            navigate("/course/setup")
          }
        >
          테마 코스 만들기
          <ArrowRight size={17} />
        </button>

      </section>

    </div>
  );
}