import { useEffect, useMemo, useRef, useState } from "react";
import { loadKakaoMap } from "./loadKakaoMap";
import "./KakaoMap.css";

function hasCoordinates(point) {
  return point?.latitude != null
    && point?.longitude != null
    && String(point.latitude).trim() !== ""
    && String(point.longitude).trim() !== ""
    && Number.isFinite(Number(point.latitude))
    && Number.isFinite(Number(point.longitude));
}

export default function CourseKakaoMap({ stops, userLocation, onSelectStop }) {
  const mapRef = useRef(null);
  const [mapError, setMapError] = useState("");
  const mappedStops = useMemo(() => stops.filter(hasCoordinates), [stops]);

  useEffect(() => {
    let map = null;
    let polyline = null;
    let resizeObserver = null;
    let cancelled = false;
    const overlays = [];

    if (mappedStops.length === 0) return undefined;

    loadKakaoMap()
      .then((kakao) => {
        if (cancelled || !mapRef.current) return;

        setMapError("");
        const stopPositions = mappedStops.map(
          (stop) => new kakao.maps.LatLng(Number(stop.latitude), Number(stop.longitude))
        );
        const routePositions = hasCoordinates(userLocation)
          ? [
              new kakao.maps.LatLng(Number(userLocation.latitude), Number(userLocation.longitude)),
              ...stopPositions,
            ]
          : stopPositions;

        map = new kakao.maps.Map(mapRef.current, {
          center: stopPositions[0],
          level: 6,
        });

        const bounds = new kakao.maps.LatLngBounds();
        routePositions.forEach((position) => bounds.extend(position));

        if (routePositions.length > 1) {
          polyline = new kakao.maps.Polyline({
            path: routePositions,
            strokeWeight: 5,
            strokeColor: "#2f6fed",
            strokeOpacity: 0.85,
            strokeStyle: "solid",
          });
          polyline.setMap(map);
        }

        if (hasCoordinates(userLocation)) {
          const currentPosition = routePositions[0];
          const currentMarker = document.createElement("div");
          currentMarker.className = "course-current-marker";
          currentMarker.textContent = "현재 위치";
          const currentOverlay = new kakao.maps.CustomOverlay({
            position: currentPosition,
            content: currentMarker,
            xAnchor: 0.5,
            yAnchor: 1.2,
            zIndex: 4,
          });
          currentOverlay.setMap(map);
          overlays.push(currentOverlay);
        }

        mappedStops.forEach((stop, index) => {
          const marker = document.createElement("button");
          marker.type = "button";
          marker.className = "course-map-marker";
          marker.textContent = String(stop.order ?? index + 1);
          marker.title = stop.name;
          marker.setAttribute("aria-label", `${stop.order ?? index + 1}번 ${stop.name}`);
          marker.addEventListener("click", () => onSelectStop?.(stop));

          const overlay = new kakao.maps.CustomOverlay({
            position: stopPositions[index],
            content: marker,
            xAnchor: 0.5,
            yAnchor: 0.5,
            zIndex: 5,
          });
          overlay.setMap(map);
          overlays.push(overlay);
        });

        if (routePositions.length === 1) {
          map.setCenter(routePositions[0]);
        } else {
          map.setBounds(bounds, 48, 48, 48, 48);
        }

        resizeObserver = new ResizeObserver(() => {
          if (!map) return;
          map.relayout();
          if (routePositions.length > 1) map.setBounds(bounds, 48, 48, 48, 48);
        });
        resizeObserver.observe(mapRef.current);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("[CourseKakaoMap] 지도 생성 오류:", error);
          setMapError("지도를 불러오지 못했습니다. 카카오맵 키와 도메인 설정을 확인해주세요.");
        }
      });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      polyline?.setMap(null);
      overlays.forEach((overlay) => overlay.setMap(null));
    };
  }, [mappedStops, onSelectStop, userLocation]);

  if (mappedStops.length === 0) {
    return <div className="course-map-empty">좌표가 있는 추천 장소가 없습니다.</div>;
  }

  return (
    <div className="course-map-shell">
      <div ref={mapRef} className="course-kakao-map" />
      {mapError && <div className="course-map-error">{mapError}</div>}
    </div>
  );
}
