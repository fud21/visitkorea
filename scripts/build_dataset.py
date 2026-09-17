#!/usr/bin/env python3
"""Build domain master JSON files, then combine them into backend dataset.json.

The script uses only Python's standard library so Docker Compose can run it in
a lightweight Python container before the backend starts.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path
from typing import Iterable


PROVINCE_ALIASES = {
    "서울": "서울특별시", "서울특별시": "서울특별시",
    "부산": "부산광역시", "부산광역시": "부산광역시",
    "대구": "대구광역시", "대구광역시": "대구광역시",
    "인천": "인천광역시", "인천광역시": "인천광역시",
    "광주": "광주광역시", "광주광역시": "광주광역시",
    "대전": "대전광역시", "대전광역시": "대전광역시",
    "울산": "울산광역시", "울산광역시": "울산광역시",
    "세종": "세종특별자치시", "세종특별자치시": "세종특별자치시",
    "경기": "경기도", "경기도": "경기도",
    "강원": "강원특별자치도", "강원도": "강원특별자치도", "강원특별자치도": "강원특별자치도",
    "충북": "충청북도", "충청북도": "충청북도",
    "충남": "충청남도", "충청남도": "충청남도",
    "전북": "전북특별자치도", "전라북도": "전북특별자치도", "전북특별자치도": "전북특별자치도",
    "전남": "전라남도", "전라남도": "전라남도", "전남광주": "전라남도", "전남광주통합특별시": "전라남도",
    "경북": "경상북도", "경상북도": "경상북도",
    "경남": "경상남도", "경상남도": "경상남도",
    "제주": "제주특별자치도", "제주도": "제주특별자치도", "제주특별자치도": "제주특별자치도",
}

TRANSFORM_VERSION = "v3-course-themes"


def read_csv(path: Path, encoding: str = "utf-8-sig") -> list[dict[str, str]]:
    with path.open("r", encoding=encoding, newline="") as handle:
        return list(csv.DictReader(handle))


def clean(value: object) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def number(value: object) -> float | None:
    text = clean(value)
    return None if text is None else float(text)


def integer(value: object) -> int | None:
    parsed = number(value)
    return None if parsed is None else int(parsed)


def unique(values: Iterable[str | None]) -> list[str]:
    return list(dict.fromkeys(value for value in values if value))


class RegionIndex:
    def __init__(self, resources: Path):
        self.provinces = read_csv(resources / "provinces.csv")
        self.municipalities = read_csv(resources / "municipalities.csv")
        self.municipalities.sort(key=lambda row: len(row["name"]), reverse=True)

    def dataset_rows(self) -> list[dict[str, object]]:
        provinces = [
            {
                "type": "PROVINCE",
                "name": row["name"],
                "provinceName": None,
                "visitorCount": int(row["visitorCount"]),
                "visitorRatio": float(row["visitorRatio"]),
            }
            for row in self.provinces
        ]
        municipalities = [
            {
                "type": "MUNICIPALITY",
                "name": row["name"],
                "provinceName": row["provinceName"],
                "visitorCount": int(row["visitorCount"]),
                "visitorRatio": float(row["visitorRatio"]),
            }
            for row in self.municipalities
        ]
        return provinces + municipalities

    def normalize_province(self, value: str | None) -> str | None:
        if not value:
            return None
        value = value.strip()
        return PROVINCE_ALIASES.get(value, value)

    def province_from_address(self, address: str | None) -> str | None:
        if not address:
            return None
        first = address.split()[0]
        if first in PROVINCE_ALIASES:
            return PROVINCE_ALIASES[first]
        for alias in sorted(PROVINCE_ALIASES, key=len, reverse=True):
            if address.startswith(alias):
                return PROVINCE_ALIASES[alias]
        return None

    def resolve(self, address: str | None, province: str | None = None, municipality: str | None = None) -> tuple[str, str | None]:
        normalized_province = self.normalize_province(province) or self.province_from_address(address)
        haystack = " ".join(value for value in (municipality, address) if value)
        for row in self.municipalities:
            if row["name"] not in haystack:
                continue
            if normalized_province and row["provinceName"] != normalized_province:
                continue
            return row["name"], row["provinceName"]
        if normalized_province:
            return normalized_province, None
        raise ValueError(f"지역을 찾을 수 없습니다: {address or municipality}")


def score_reason(local_score: float | None, popularity_score: float | None, category: str) -> list[str]:
    reasons = [f"{category} 분류의 공공 관광 데이터 기반 장소입니다."]
    if local_score is not None and popularity_score is not None:
        reasons.append("현지인과 외지인 방문 순위를 함께 반영했습니다.")
    elif local_score is not None:
        reasons.append("현지인 방문 순위를 기반으로 점수를 계산했습니다.")
    elif popularity_score is not None:
        reasons.append("외지인 방문 순위를 기반으로 점수를 계산했습니다.")
    return reasons


def attraction_themes(category: str) -> list[str]:
    natural_keywords = ("자연", "공원", "산", "숲", "휴양", "해수욕", "해안", "수목원", "생태")
    extra = "자연/힐링" if any(keyword in category for keyword in natural_keywords) else None
    return unique(["관광지", category, extra])


def restaurant_themes(category: str) -> list[str]:
    cafe = "카페" if "카페" in category or "찻집" in category else None
    return unique(["현지인 맛집", "맛집", category, cafe])


def build_attractions(data_root: Path, regions: RegionIndex) -> list[dict[str, object]]:
    directory = data_root / "attraction"
    places = read_csv(directory / "attraction_place.csv")
    scores = {row["관광지ID"]: row for row in read_csv(directory / "attraction_score.csv")}
    output = []
    for place in places:
        score = scores[place["관광지ID"]]
        address = place["주소"].strip()
        region_name, province_name = regions.resolve(address)
        category = score["분류"].strip()
        local_score = number(score["현지인점수"])
        popularity_score = number(score["외지인점수"])
        output.append({
            "id": place["관광지ID"],
            "name": place["관광지명"].strip(),
            "category": category,
            "regionName": region_name,
            "provinceName": province_name,
            "address": address,
            "description": f"관광 데이터랩에서 수집한 {category} 장소입니다.",
            "hours": "운영시간 확인 필요",
            "closed": "장소별 상이",
            "parking": "현장 정보 확인 필요",
            "latitude": float(place["위도"]),
            "longitude": float(place["경도"]),
            "localScore": local_score,
            "popularityScore": popularity_score,
            "stayMinutes": 60,
            "estimatedCost": 0,
            "themes": attraction_themes(category),
            "reasons": score_reason(local_score, popularity_score, category),
        })
    return output


def build_markets(data_root: Path, regions: RegionIndex) -> list[dict[str, object]]:
    directory = data_root / "market"
    places = read_csv(directory / "place_market.csv")
    details = {row["market_id"]: row for row in read_csv(directory / "traditional_market.csv")}
    facilities = {row["market_id"]: row for row in read_csv(directory / "traditional_market_facility.csv")}
    output = []
    for place in places:
        detail = details[place["place_id"]]
        facility = facilities[place["place_id"]]
        road = clean(place["road_address"])
        jibun = clean(place["jibun_address"])
        address = road or jibun
        region_name, province_name = regions.resolve(address)
        items = unique(part.strip() for part in detail["취급품목"].split("+"))
        schedule = detail["시장개설주기"].strip()
        store_count = integer(detail["점포수"])
        description_parts = [f"{schedule} 운영되는 전통시장입니다."]
        if store_count is not None:
            description_parts.append(f"등록 점포 수는 {store_count}개입니다.")
        if items:
            description_parts.append("주요 취급품목은 " + ", ".join(items[:6]) + "입니다.")
        parking = "가능" if facility["주차장보유여부"] == "Y" else "없음"
        toilet = "있음" if facility["공중화장실보유여부"] == "Y" else "없음"
        output.append({
            "id": place["place_id"],
            "name": place["name"].strip(),
            "category": "전통시장",
            "regionName": region_name,
            "provinceName": province_name,
            "address": address,
            "description": " ".join(description_parts),
            "hours": f"개설 주기: {schedule}",
            "closed": "시장별 상이",
            "parking": parking,
            "latitude": float(place["latitude"]),
            "longitude": float(place["longitude"]),
            "localScore": None,
            "popularityScore": None,
            "stayMinutes": 60,
            "estimatedCost": 10000,
            "themes": unique(["전통시장", "시장", "먹거리", *items]),
            "reasons": [
                "지역 생활권과 연결되는 전통시장입니다.",
                f"주차장 {parking}, 공중화장실 {toilet}으로 등록되어 있습니다.",
                "시장 추천점수는 데이터팀 산정 후 반영될 예정입니다.",
            ],
        })
    return output


def fix_coordinates(latitude: float, longitude: float) -> tuple[float, float, bool]:
    if 124 <= latitude <= 132 and 33 <= longitude <= 39:
        return longitude, latitude, True
    return latitude, longitude, False


def build_restaurants(data_root: Path, regions: RegionIndex) -> tuple[list[dict[str, object]], int]:
    directory = data_root / "restaurant"
    places = read_csv(directory / "place_restaurant.csv")
    metadata = {row["관광지ID"]: row for row in read_csv(directory / "intermediate" / "restaurant_place.csv")}
    scores = {row["관광지ID"]: row for row in read_csv(directory / "restaurant_score.csv")}
    output = []
    corrected = 0
    for place in places:
        meta = metadata[place["place_id"]]
        score = scores[place["place_id"]]
        road = clean(place["road_address"])
        jibun = clean(place["jibun_address"])
        address = road or jibun
        region_name, province_name = regions.resolve(address, meta["맛집시도"], meta["맛집시군구"])
        latitude, longitude, was_corrected = fix_coordinates(float(place["latitude"]), float(place["longitude"]))
        corrected += int(was_corrected)
        category = meta["분류"].strip()
        local_score = number(score["현지인점수"])
        popularity_score = number(score["외지인점수"])
        output.append({
            "id": place["place_id"],
            "name": place["name"].strip(),
            "category": category,
            "regionName": region_name,
            "provinceName": province_name,
            "address": address,
            "description": f"관광 데이터랩 방문 순위에 포함된 {category} 음식점입니다.",
            "hours": "운영시간 확인 필요",
            "closed": "업소별 상이",
            "parking": "현장 정보 확인 필요",
            "latitude": latitude,
            "longitude": longitude,
            "localScore": local_score,
            "popularityScore": popularity_score,
            "stayMinutes": 60,
            "estimatedCost": 15000,
            "themes": restaurant_themes(category),
            "reasons": score_reason(local_score, popularity_score, category),
        })
    return output, corrected


def source_version(paths: Iterable[Path]) -> str:
    digest = hashlib.sha256()
    digest.update(TRANSFORM_VERSION.encode("utf-8"))
    for path in sorted(paths):
        digest.update(str(path.name).encode("utf-8"))
        digest.update(path.read_bytes())
    return "processed-" + digest.hexdigest()[:16]


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    with temporary.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, separators=(",", ":"))
    temporary.replace(path)


def read_json(path: Path) -> dict[str, object]:
    if not path.exists() or path.stat().st_size == 0:
        raise ValueError(f"Master JSON is missing or empty: {path}")
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_master_files(
    masters_root: Path,
    version: str,
    regions: list[dict[str, object]],
    attractions: list[dict[str, object]],
    markets: list[dict[str, object]],
    restaurants: list[dict[str, object]],
) -> None:
    documents = {
        "attraction_master.json": {"version": version, "domain": "attraction", "places": attractions},
        "market_master.json": {"version": version, "domain": "market", "places": markets},
        "restaurant_master.json": {"version": version, "domain": "restaurant", "places": restaurants},
        "region_metrics.json": {"version": version, "regions": regions},
    }
    for filename, document in documents.items():
        write_json(masters_root / filename, document)


def combine_master_files(masters_root: Path, output: Path) -> dict[str, object]:
    attraction = read_json(masters_root / "attraction_master.json")
    market = read_json(masters_root / "market_master.json")
    restaurant = read_json(masters_root / "restaurant_master.json")
    region_metrics = read_json(masters_root / "region_metrics.json")
    documents = [attraction, market, restaurant, region_metrics]
    versions = {document.get("version") for document in documents}
    if len(versions) != 1 or None in versions:
        raise ValueError(f"Master JSON versions do not match: {versions}")

    places = attraction["places"] + market["places"] + restaurant["places"]
    place_ids = [place["id"] for place in places]
    if len(place_ids) != len(set(place_ids)):
        raise ValueError("Duplicate place IDs found across master JSON files.")

    dataset = {
        "version": next(iter(versions)),
        "regions": region_metrics["regions"],
        "places": places,
    }
    write_json(output, dataset)
    return dataset


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-root", type=Path, required=True)
    parser.add_argument("--region-resources", type=Path, required=True)
    parser.add_argument("--masters-root", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    regions = RegionIndex(args.region_resources)
    attractions = build_attractions(args.data_root, regions)
    markets = build_markets(args.data_root, regions)
    restaurants, corrected = build_restaurants(args.data_root, regions)
    source_paths = list(args.data_root.rglob("*.csv")) + [
        args.region_resources / "provinces.csv",
        args.region_resources / "municipalities.csv",
    ]
    version = source_version(source_paths)
    masters_root = args.masters_root or args.data_root
    write_master_files(
        masters_root,
        version,
        regions.dataset_rows(),
        attractions,
        markets,
        restaurants,
    )
    dataset = combine_master_files(masters_root, args.output)
    print(f"version={dataset['version']}")
    print(f"masters={masters_root}")
    print(f"regions={len(dataset['regions'])}")
    print(f"places={len(dataset['places'])}")
    print(f"attractions={len(attractions)} markets={len(markets)} restaurants={len(restaurants)}")
    print(f"correctedRestaurantCoordinates={corrected}")


if __name__ == "__main__":
    main()
