from pathlib import Path
import os
import sys

import pandas as pd
import psycopg2


# ============================================================
# PATH
# ============================================================

ROOT = Path(__file__).resolve().parents[1]

# 현재 프로젝트 구조 기준
MARKET_CSV = ROOT / "data" / "processed" / "market" / "place_market.csv"


# ============================================================
# DATABASE
# ============================================================

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "dbname": os.getenv("DB_NAME", "localon"),
    "user": os.getenv("DB_USERNAME", "localon"),
    "password": os.getenv("DB_PASSWORD", "localon"),
}


# ============================================================
# PROVINCE NAME NORMALIZATION
# ============================================================

PROVINCE_ALIASES = {
    "서울": "서울특별시",
    "서울특별시": "서울특별시",

    "부산": "부산광역시",
    "부산광역시": "부산광역시",

    "대구": "대구광역시",
    "대구광역시": "대구광역시",

    "인천": "인천광역시",
    "인천광역시": "인천광역시",

    "광주": "광주광역시",
    "광주광역시": "광주광역시",

    "대전": "대전광역시",
    "대전광역시": "대전광역시",

    "울산": "울산광역시",
    "울산광역시": "울산광역시",

    "세종": "세종특별자치시",
    "세종특별자치시": "세종특별자치시",

    "경기": "경기도",
    "경기도": "경기도",

    "충북": "충청북도",
    "충청북도": "충청북도",

    "충남": "충청남도",
    "충청남도": "충청남도",

    "전남": "전라남도",
    "전라남도": "전라남도",

    "경북": "경상북도",
    "경상북도": "경상북도",

    "경남": "경상남도",
    "경상남도": "경상남도",

    "제주": "제주특별자치도",
    "제주도": "제주특별자치도",
    "제주특별자치도": "제주특별자치도",

    "강원": "강원특별자치도",
    "강원도": "강원특별자치도",
    "강원특별자치도": "강원특별자치도",

    "전북": "전북특별자치도",
    "전라북도": "전북특별자치도",
    "전북특별자치도": "전북특별자치도",
}


# ============================================================
# CSV
# ============================================================

def read_csv_auto(path: Path):
    encodings = [
        "utf-8-sig",
        "utf-8",
        "cp949",
        "euc-kr",
    ]

    for encoding in encodings:
        try:
            df = pd.read_csv(path, encoding=encoding)
            print(f"[CSV] encoding = {encoding}")
            return df
        except UnicodeDecodeError:
            pass

    raise RuntimeError(f"CSV 인코딩을 읽을 수 없습니다: {path}")


def find_column(df, candidates):
    for column in candidates:
        if column in df.columns:
            return column

    raise KeyError(
        f"필요한 컬럼을 찾지 못했습니다.\n"
        f"후보: {candidates}\n"
        f"실제: {df.columns.tolist()}"
    )


# ============================================================
# REGIONS
# ============================================================

def load_regions(conn):
    sql = """
        SELECT
            id,
            name,
            province_name,
            type
        FROM regions
        ORDER BY id
    """

    with conn.cursor() as cur:
        cur.execute(sql)
        rows = cur.fetchall()

    provinces = {}
    municipalities = []

    for region_id, name, province_name, region_type in rows:

        if region_type == "PROVINCE":
            provinces[name] = region_id

        elif region_type == "MUNICIPALITY":
            municipalities.append({
                "id": region_id,
                "name": name,
                "province": province_name,
            })

    return provinces, municipalities


def detect_province(address):
    if not address:
        return None

    # 긴 문자열부터 검사
    for alias in sorted(
        PROVINCE_ALIASES,
        key=len,
        reverse=True
    ):
        if alias in address:
            return PROVINCE_ALIASES[alias]

    return None


def find_region_id(
    address,
    provinces,
    municipalities,
):
    if not address:
        return None

    address = str(address).strip()

    province = detect_province(address)

    # ------------------------------------------
    # 1. 시군구 탐색
    # ------------------------------------------

    candidates = []

    for region in municipalities:

        if region["name"] not in address:
            continue

        # 중구, 서구 같은 이름 중복 방지
        if (
            province
            and region["province"]
            and region["province"] != province
        ):
            continue

        candidates.append(region)

    if candidates:
        # 이름이 긴 행정구역 우선
        candidates.sort(
            key=lambda x: len(x["name"]),
            reverse=True,
        )

        return candidates[0]["id"]

    # ------------------------------------------
    # 2. 시군구를 못 찾으면 광역 fallback
    # ------------------------------------------

    if province:
        return provinces.get(province)

    return None


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 60)
    print("LOCAL:ON 전통시장 PostgreSQL 적재")
    print("=" * 60)

    if not MARKET_CSV.exists():
        print(f"[ERROR] CSV 없음: {MARKET_CSV}")
        sys.exit(1)

    df = read_csv_auto(MARKET_CSV)

    print(f"[CSV] rows = {len(df):,}")
    print(f"[CSV] columns = {df.columns.tolist()}")

    # --------------------------------------------------------
    # 컬럼 자동 탐색
    # --------------------------------------------------------

    id_col = find_column(
        df,
        ["place_id", "id", "시장id", "시장ID"]
    )

    name_col = find_column(
        df,
        ["name", "시장명", "시장이름"]
    )

    lat_col = find_column(
        df,
        ["latitude", "위도"]
    )

    lng_col = find_column(
        df,
        ["longitude", "경도"]
    )

    road_col = find_column(
        df,
        ["road_address", "도로명주소"]
    )

    jibun_col = find_column(
        df,
        ["jibun_address", "지번주소"]
    )

    # --------------------------------------------------------
    # DB
    # --------------------------------------------------------

    conn = psycopg2.connect(**DB_CONFIG)

    try:
        provinces, municipalities = load_regions(conn)

        print(f"[DB] provinces      = {len(provinces)}")
        print(f"[DB] municipalities = {len(municipalities)}")

        resolved = []
        unresolved = []

        # ----------------------------------------------------
        # 먼저 지역 매칭만 검증
        # ----------------------------------------------------

        for _, row in df.iterrows():

            road = (
                None
                if pd.isna(row[road_col])
                else str(row[road_col]).strip()
            )

            jibun = (
                None
                if pd.isna(row[jibun_col])
                else str(row[jibun_col]).strip()
            )

            address = road or jibun

            region_id = find_region_id(
                address,
                provinces,
                municipalities,
            )

            item = {
                "id": str(row[id_col]),
                "name": str(row[name_col]),
                "address": address,
                "region_id": region_id,
            }

            if region_id is None:
                unresolved.append(item)
            else:
                resolved.append(item)

        print()
        print(
            f"[REGION] matched   = "
            f"{len(resolved):,}/{len(df):,}"
        )

        print(
            f"[REGION] unmatched = "
            f"{len(unresolved):,}"
        )

        if unresolved:
            print()
            print("[WARN] 지역 매칭 실패 예시")

            for item in unresolved[:20]:
                print(
                    f"  - {item['name']} | "
                    f"{item['address']}"
                )

        # ----------------------------------------------------
        # 너무 많이 실패하면 적재 중단
        # ----------------------------------------------------

        match_ratio = (
            len(resolved) / len(df)
            if len(df)
            else 0
        )

        if match_ratio < 0.95:
            print()
            print(
                "[STOP] 지역 매칭률이 95% 미만입니다."
            )
            print(
                "DB에는 아무것도 저장하지 않았습니다."
            )
            conn.rollback()
            return

        # ----------------------------------------------------
        # INSERT / UPDATE
        # ----------------------------------------------------

        sql = """
            INSERT INTO places (
                id,
                name,
                category,
                address,
                latitude,
                longitude,
                region_id,
                local_score,
                popularity_score,
                estimated_cost,
                stay_minutes,
                sample_data
            )
            VALUES (
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s,
                %s, %s
            )

            ON CONFLICT (id)
            DO UPDATE SET
                name = EXCLUDED.name,
                category = EXCLUDED.category,
                address = EXCLUDED.address,
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                region_id = EXCLUDED.region_id,
                sample_data = EXCLUDED.sample_data
        """

        count = 0

        with conn.cursor() as cur:

            for _, row in df.iterrows():

                road = (
                    None
                    if pd.isna(row[road_col])
                    else str(row[road_col]).strip()
                )

                jibun = (
                    None
                    if pd.isna(row[jibun_col])
                    else str(row[jibun_col]).strip()
                )

                address = road or jibun

                region_id = find_region_id(
                    address,
                    provinces,
                    municipalities,
                )

                latitude = (
                    None
                    if pd.isna(row[lat_col])
                    else float(row[lat_col])
                )

                longitude = (
                    None
                    if pd.isna(row[lng_col])
                    else float(row[lng_col])
                )

                cur.execute(
                    sql,
                    (
                        str(row[id_col]),
                        str(row[name_col]),
                        "전통시장",
                        address,
                        latitude,
                        longitude,
                        region_id,

                        # 점수 정책 확정 전 임시값
                        0,      # local_score
                        0,      # popularity_score

                        0,      # estimated_cost
                        60,     # stay_minutes
                        False,  # sample_data
                    )
                )

                count += 1

        conn.commit()

        print()
        print(
            f"[SUCCESS] 시장 {count:,}건 적재 완료"
        )

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()


if __name__ == "__main__":
    main()