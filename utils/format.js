export function formatVisitors(value) {
  if (!Number.isFinite(value)) return "-";
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억 명`;
  if (value >= 10000) return `${Math.round(value / 10000).toLocaleString("ko-KR")}만 명`;
  return `${value.toLocaleString("ko-KR")}명`;
}

export function safeDecode(value = "") {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
