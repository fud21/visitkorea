const EARTH_RADIUS_KM = 6371;
const ROAD_DISTANCE_FACTOR = 1.25;

function radians(degrees) {
  return degrees * Math.PI / 180;
}

export function estimateDrivingLeg(origin, destination) {
  if (![origin?.latitude, origin?.longitude, destination?.latitude, destination?.longitude]
    .every((value) => Number.isFinite(Number(value)))) return null;

  const lat1 = radians(Number(origin.latitude));
  const lat2 = radians(Number(destination.latitude));
  const deltaLat = lat2 - lat1;
  const deltaLng = radians(Number(destination.longitude) - Number(origin.longitude));
  const value = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  const straightKm = 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(value));
  const estimatedRoadKm = straightKm * ROAD_DISTANCE_FACTOR;
  const averageSpeed = straightKm < 10 ? 30 : straightKm < 50 ? 50 : 70;
  const rawMinutes = estimatedRoadKm / averageSpeed * 60;
  const drivingMinutes = Math.max(5, Math.ceil(rawMinutes / 5) * 5);

  return { straightKm, drivingMinutes };
}

export function formatMinutes(minutes) {
  if (!minutes) return "-";
  if (minutes < 60) return `약 ${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `약 ${hours}시간 ${remainder}분` : `약 ${hours}시간`;
}
