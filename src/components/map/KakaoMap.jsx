import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { loadKakaoMap } from "./loadKakaoMap";
import { provinceVisitors } from "../../data/visitorData";
import "./KakaoMap.css";

const provinceCoordinates = {
  서울특별시: { lat: 37.5665, lng: 126.9780 },
  부산광역시: { lat: 35.1796, lng: 129.0756 },
  대구광역시: { lat: 35.8714, lng: 128.6014 },
  인천광역시: { lat: 37.4563, lng: 126.7052 },
  광주광역시: { lat: 35.1595, lng: 126.8526 },
  대전광역시: { lat: 36.3504, lng: 127.3845 },
  울산광역시: { lat: 35.5384, lng: 129.3114 },
  세종특별자치시: { lat: 36.48, lng: 127.289 },

  경기도: { lat: 37.4138, lng: 127.5183 },
  강원특별자치도: { lat: 37.8228, lng: 128.1555 },
  충청북도: { lat: 36.8, lng: 127.7 },
  충청남도: { lat: 36.5184, lng: 126.8 },
  전북특별자치도: { lat: 35.7175, lng: 127.153 },
  전라남도: { lat: 34.8679, lng: 126.991 },
  경상북도: { lat: 36.4919, lng: 128.8889 },
  경상남도: { lat: 35.4606, lng: 128.2132 },
  제주특별자치도: { lat: 33.4996, lng: 126.5312 },
};

const markerOffsets = {
  서울특별시: {
    x: 10,
    y: -38,
  },

  인천광역시: {
    x: -60,
    y: 4,
  },

  경기도: {
    x: 55,
    y: 22,
  },

  // 충청권
  충청남도: {
    x: -55,
    y: 22,
  },

  세종특별자치시: {
    x: -42,
    y: -4,
  },

  충청북도: {
    x: 38,
    y: -17,
  },

  대전광역시: {
    x: 30,
    y: 24,
  },
};

function getMarkerClass(visitorRatio) {
  if (visitorRatio >= 10) return "high";
  if (visitorRatio >= 5) return "mid";
  return "low";
}

const regionDisplayNames = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  광주광역시: "광주",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",

  경기도: "경기",
  강원특별자치도: "강원",

  충청북도: "충북",
  충청남도: "충남",

  전북특별자치도: "전북",
  전라남도: "전남",

  경상북도: "경북",
  경상남도: "경남",

  제주특별자치도: "제주",
};

function getShortRegionName(name) {
  return regionDisplayNames[name] ?? name;
}

export default function KakaoMap() {
  const mapRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let map = null;
    let overlays = [];
    let resizeObserver = null;
    let cancelled = false;

    loadKakaoMap()
      .then((kakao) => {
        if (cancelled || !mapRef.current) return;

        const container = mapRef.current;

        console.log(
          "[KakaoMap] container size:",
          container.offsetWidth,
          container.offsetHeight
        );

        const center = new kakao.maps.LatLng(
          36.2,
          127.8
        );

        map = new kakao.maps.Map(container, {
          center,
          level: 13,
        });

        // React/Grid 레이아웃이 확정된 다음
        // 카카오 지도 크기를 다시 계산
        requestAnimationFrame(() => {
          if (!map) return;

          map.relayout();
          map.setCenter(center);
        });

        // 한 번 더 보정
        const timer = setTimeout(() => {
          if (!map) return;

          map.relayout();
          map.setCenter(center);
        }, 100);

        provinceVisitors.forEach((region) => {
        const coordinate =
            provinceCoordinates[region.province];

        if (!coordinate) {
            console.warn(
            "[KakaoMap] 좌표 없음:",
            region.province
            );

            return;
        }

        const content = document.createElement("button");

        content.type = "button";
        content.className = "kakao-region-marker";

        const offset =
        markerOffsets[region.province] ?? {
            x: 0,
            y: 0,
        };

        content.style.transform =
        `translate(${offset.x}px, ${offset.y}px)`;

        const markerClass =
        getMarkerClass(region.visitorRatio);

        content.innerHTML = `
        <i class="visitor-dot ${markerClass}"></i>

        <strong>
            ${region.visitorRatio}%
        </strong>

        <span>
            ${getShortRegionName(region.province)}
        </span>
        `;

        content.addEventListener(
            "click",
            () => {
            navigate(
                `/province/${encodeURIComponent(
                region.province
                )}`
            );
            }
        );

        const overlay =
            new kakao.maps.CustomOverlay({
            position:
                new kakao.maps.LatLng(
                coordinate.lat,
                coordinate.lng
                ),

            content,

            xAnchor: 0.5,
            yAnchor: 0.5,
            });

        overlay.setMap(map);

        overlays.push(overlay);
        });

        // 부모 Grid/Flex 크기가 바뀌어도
        // 지도가 자동으로 다시 계산되도록 함
        resizeObserver =
          new ResizeObserver(() => {
            if (!map) return;

            map.relayout();
          });

        resizeObserver.observe(container);

        return () => clearTimeout(timer);
      })
      .catch((error) => {
        console.error(
          "[KakaoMap] 지도 생성 오류:",
          error
        );
      });

    return () => {
      cancelled = true;

      resizeObserver?.disconnect();

      overlays.forEach((overlay) => {
        overlay.setMap(null);
      });

      overlays = [];
    };
  }, [navigate]);

  return (
    <div
      ref={mapRef}
      className="kakao-map"
      style={{
        width: "100%",
        height: "500px",
      }}
    />
  );
}