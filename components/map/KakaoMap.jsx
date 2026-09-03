import { useEffect, useRef } from "react";
import { loadKakaoMap } from "./loadKakaoMap";

const provinceData = [
  {
    name: "서울",
    latitude: 37.5665,
    longitude: 126.978,
    visitorRatio: 20.5,
  },
  {
    name: "경기",
    latitude: 37.4138,
    longitude: 127.5183,
    visitorRatio: 21.4,
  },
  {
    name: "강원",
    latitude: 37.8228,
    longitude: 128.1555,
    visitorRatio: 4.9,
  },
  {
    name: "충북",
    latitude: 36.8,
    longitude: 127.7,
    visitorRatio: 4.0,
  },
  {
    name: "충남",
    latitude: 36.5184,
    longitude: 126.8,
    visitorRatio: 5.7,
  },
  {
    name: "경북",
    latitude: 36.4919,
    longitude: 128.8889,
    visitorRatio: 6.1,
  },
  {
    name: "경남",
    latitude: 35.4606,
    longitude: 128.2132,
    visitorRatio: 5.3,
  },
  {
    name: "전북",
    latitude: 35.7175,
    longitude: 127.153,
    visitorRatio: 3.3,
  },
  {
    name: "전남",
    latitude: 34.8679,
    longitude: 126.991,
    visitorRatio: 4.2,
  },
  {
    name: "제주",
    latitude: 33.4996,
    longitude: 126.5312,
    visitorRatio: 1.9,
  },
];

export default function KakaoMap() {
  const mapRef = useRef(null);

  useEffect(() => {
    let overlays = [];

    loadKakaoMap()
      .then((kakao) => {
        if (!mapRef.current) return;

        const map = new kakao.maps.Map(mapRef.current, {
          center: new kakao.maps.LatLng(36.3, 127.8),
          level: 13,
        });

        provinceData.forEach((region) => {
          const position = new kakao.maps.LatLng(
            region.latitude,
            region.longitude
          );

          const content = document.createElement("button");

          content.className = "kakao-region-marker";
          content.type = "button";

          content.innerHTML = `
            <strong>${region.visitorRatio}%</strong>
            <span>${region.name}</span>
          `;

          content.addEventListener("click", () => {
            console.log(`${region.name} 선택`);
          });

          const overlay = new kakao.maps.CustomOverlay({
            position,
            content,
            yAnchor: 0.5,
          });

          overlay.setMap(map);

          overlays.push(overlay);
        });
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      overlays.forEach((overlay) => {
        overlay.setMap(null);
      });

      overlays = [];
    };
  }, []);

  return (
    <div
      ref={mapRef}
      className="kakao-map"
    />
  );
}