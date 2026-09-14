from pathlib import Path
import os
import sys

import pandas as pd
import psycopg2


# ============================================================
# PATH
# ============================================================

ROOT = Path(__file__).resolve().parents[1]

RESTAURANT_DIR = (
    ROOT
    / "data"
    / "processed"
    / "restaurant"
)

PLACE_CSV = (
    RESTAURANT_DIR
    / "place_restaurant.csv"
)

META_CSV = (
    RESTAURANT_DIR
    / "intermediate"
    / "restaurant_place.csv"
)


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
# PROVINCE NORMALIZATION
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
    "전남광주": "전라남도",
    "전남광주통합특별시": "전라남도",

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
            print(f"[CSV] {path.name} encoding = {encoding}")
            return df
        except UnicodeDecodeError:
            pass

    raise RuntimeError(
        f"CSV 인코딩을 읽을 수 없습니다: {path}"
    )


def clean_text(value):
    if pd.isna(value):
        return None

    value = str(value).strip()

    if not value:
        return None

    return value


# ============================================================
# REGIONS
# ============================================================

def normalize_province(name):
    if not name:
        return None

    name = str(name).strip()

    return PROVINCE_ALIASES.get(
        name,
        name,
    )


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


def find_region_by_metadata(
    province,
    city,
    provinces,
    municipalities,
):
    """
    restaurant_place.csv의 맛집시도 / 맛집시군구를 이용해서
    regions.id를 찾는다.
    """

    province = normalize_province(province)
    city = clean_text(city)

    if not city:
        return provinces.get(province)

    # --------------------------------------------------------
    # 1. 정확한 시군구명 매칭
    # --------------------------------------------------------

    for region in municipalities:

        if region["name"] != city:
            continue

        if (
            province
            and region["province"]
            and region["province"] != province
        ):
            continue

        return region["id"]

    # --------------------------------------------------------
    # 2. "수원시 팔달구" 같은 데이터 처리
    #
    # DataLab의 229개 기초지자체 테이블에는
    # 수원시처럼 시 단위만 존재할 수 있으므로
    # 앞쪽 행정구역부터 시도한다.
    # --------------------------------------------------------

    city_parts = city.split()

    if len(city_parts) >= 2:

        candidates = [
            city,
            city_parts[0],
            city_parts[-1],
        ]

        for candidate in candidates:

            for region in municipalities:

                if region["name"] != candidate:
                    continue

                if (
                    province
                    and region["province"]
                    and region["province"] != province
                ):
                    continue

                return region["id"]

    # --------------------------------------------------------
    # 3. 부분 매칭
    # --------------------------------------------------------

    candidates = []

    for region in municipalities:

        if (
            province
            and region["province"]
            and region["province"] != province
        ):
            continue

        if (
            region["name"] in city
            or city in region["name"]
        ):
            candidates.append(region)

    if candidates:
        candidates.sort(
            key=lambda x: len(x["name"]),
            reverse=True,
        )

        return candidates[0]["id"]

    # --------------------------------------------------------
    # 4. 최후 fallback: 광역
    # --------------------------------------------------------

    return provinces.get(province)


# ============================================================
# PLACE THEMES
# ============================================================

def insert_theme(
    cur,
    place_id,
    theme,
):
    """
    place_themes에 동일 theme가 중복되지 않게 추가.
    UNIQUE constraint 존재 여부에 의존하지 않도록
    NOT EXISTS 방식 사용.
    """

    if not theme:
        return

    sql = """
        INSERT INTO place_themes (
            place_id,
            theme
        )
        SELECT
            %s,
            %s
        WHERE NOT EXISTS (
            SELECT 1
            FROM place_themes
            WHERE place_id = %s
              AND theme = %s
        )
    """

    cur.execute(
        sql,
        (
            place_id,
            theme,
            place_id,
            theme,
        )
    )


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 60)
    print("LOCAL:ON 지역맛집 PostgreSQL 적재")
    print("=" * 60)

    # --------------------------------------------------------
    # 파일 확인
    # --------------------------------------------------------

    for path in [
        PLACE_CSV,
        META_CSV,
    ]:
        if not path.exists():
            print(
                f"[ERROR] CSV 없음: {path}"
            )
            sys.exit(1)

    # --------------------------------------------------------
    # CSV 읽기
    # --------------------------------------------------------

    place_df = read_csv_auto(
        PLACE_CSV
    )

    meta_df = read_csv_auto(
        META_CSV
    )

    print()
    print(
        f"[PLACE] rows = "
        f"{len(place_df):,}"
    )

    print(
        f"[META]  rows = "
        f"{len(meta_df):,}"
    )

    # --------------------------------------------------------
    # 컬럼명 정리
    # --------------------------------------------------------

    meta_df = meta_df.rename(
        columns={
            "관광지ID": "place_id",
            "업소명": "meta_name",
            "분류": "subcategory",
            "맛집시도": "province",
            "맛집시군구": "city",
            "현지인순위": "local_rank",
            "외지인순위": "outsider_rank",
        }
    )

    # 필요한 컬럼 존재 검사
    required_place_columns = {
        "place_id",
        "name",
        "latitude",
        "longitude",
        "road_address",
        "jibun_address",
    }

    required_meta_columns = {
        "place_id",
        "subcategory",
        "province",
        "city",
        "local_rank",
        "outsider_rank",
    }

    missing_place = (
        required_place_columns
        - set(place_df.columns)
    )

    missing_meta = (
        required_meta_columns
        - set(meta_df.columns)
    )

    if missing_place:
        raise KeyError(
            f"place_restaurant.csv 누락 컬럼: "
            f"{sorted(missing_place)}"
        )

    if missing_meta:
        raise KeyError(
            f"restaurant_place.csv 누락 컬럼: "
            f"{sorted(missing_meta)}"
        )

    # --------------------------------------------------------
    # ID 중복 검사
    # --------------------------------------------------------

    place_duplicates = (
        place_df["place_id"]
        .duplicated()
        .sum()
    )

    meta_duplicates = (
        meta_df["place_id"]
        .duplicated()
        .sum()
    )

    print()
    print(
        f"[CHECK] place ID duplicates = "
        f"{place_duplicates:,}"
    )

    print(
        f"[CHECK] meta ID duplicates  = "
        f"{meta_duplicates:,}"
    )

    if (
        place_duplicates > 0
        or meta_duplicates > 0
    ):
        print(
            "[STOP] 중복 place_id가 있습니다."
        )
        return

    # --------------------------------------------------------
    # 위치 + 메타데이터 통합
    # --------------------------------------------------------

    df = place_df.merge(
        meta_df[
            [
                "place_id",
                "subcategory",
                "province",
                "city",
                "local_rank",
                "outsider_rank",
            ]
        ],
        on="place_id",
        how="left",
        validate="one_to_one",
    )

    missing_meta_count = (
        df["subcategory"]
        .isna()
        .sum()
    )

    print(
        f"[CHECK] meta missing = "
        f"{missing_meta_count:,}"
    )

    # 분류가 없는 식당은 지역맛집으로 fallback
    df["subcategory"] = (
        df["subcategory"]
        .fillna("지역맛집")
    )

    # --------------------------------------------------------
    # DB 연결
    # --------------------------------------------------------

    conn = psycopg2.connect(
        **DB_CONFIG
    )

    try:

        provinces, municipalities = (
            load_regions(conn)
        )

        print()
        print(
            f"[DB] provinces      = "
            f"{len(provinces)}"
        )

        print(
            f"[DB] municipalities = "
            f"{len(municipalities)}"
        )

        # ----------------------------------------------------
        # 지역 매칭 사전 검증
        # ----------------------------------------------------

        resolved = []
        unresolved = []

        for _, row in df.iterrows():

            region_id = (
                find_region_by_metadata(
                    row["province"],
                    row["city"],
                    provinces,
                    municipalities,
                )
            )

            item = {
                "id": row["place_id"],
                "name": row["name"],
                "province": row["province"],
                "city": row["city"],
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
            print(
                "[WARN] 지역 매칭 실패 예시"
            )

            for item in unresolved[:30]:

                print(
                    f"  - {item['name']} | "
                    f"{item['province']} | "
                    f"{item['city']}"
                )

        match_ratio = (
            len(resolved) / len(df)
            if len(df)
            else 0
        )

        if match_ratio < 0.95:

            print()
            print(
                "[STOP] 지역 매칭률이 "
                "95% 미만입니다."
            )

            print(
                "DB에는 아무것도 "
                "저장하지 않았습니다."
            )

            conn.rollback()
            return

        # ----------------------------------------------------
        # places INSERT / UPDATE
        # ----------------------------------------------------

        place_sql = """
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
        local_theme_count = 0
        outsider_theme_count = 0

        with conn.cursor() as cur:

            for _, row in df.iterrows():

                place_id = str(
                    row["place_id"]
                )

                road = clean_text(
                    row["road_address"]
                )

                jibun = clean_text(
                    row["jibun_address"]
                )

                address = road or jibun

                latitude = (
                    None
                    if pd.isna(
                        row["latitude"]
                    )
                    else float(
                        row["latitude"]
                    )
                )

                longitude = (
                    None
                    if pd.isna(
                        row["longitude"]
                    )
                    else float(
                        row["longitude"]
                    )
                )

                category = clean_text(
                    row["subcategory"]
                )

                if not category:
                    category = "지역맛집"

                region_id = (
                    find_region_by_metadata(
                        row["province"],
                        row["city"],
                        provinces,
                        municipalities,
                    )
                )

                # --------------------------------------------
                # 장소 본체
                # --------------------------------------------

                cur.execute(
                    place_sql,
                    (
                        place_id,
                        clean_text(
                            row["name"]
                        ),
                        category,
                        address,
                        latitude,
                        longitude,
                        region_id,

                        # 점수 정책 확정 전
                        0,      # local_score
                        0,      # popularity_score

                        0,      # estimated_cost
                        60,     # stay_minutes
                        False,  # sample_data
                    )
                )

                # --------------------------------------------
                # broad theme
                # --------------------------------------------

                insert_theme(
                    cur,
                    place_id,
                    "지역맛집",
                )

                # 세부분류도 theme으로 보존
                insert_theme(
                    cur,
                    place_id,
                    category,
                )

                # --------------------------------------------
                # 현지인 / 외지인 여부
                # 현재는 순위의 존재 여부만 사용.
                # 점수 계산은 아직 하지 않음.
                # --------------------------------------------

                if not pd.isna(
                    row["local_rank"]
                ):

                    insert_theme(
                        cur,
                        place_id,
                        "현지인 맛집",
                    )

                    local_theme_count += 1

                if not pd.isna(
                    row["outsider_rank"]
                ):

                    insert_theme(
                        cur,
                        place_id,
                        "외지인 맛집",
                    )

                    outsider_theme_count += 1

                count += 1

        conn.commit()

        print()
        print(
            f"[SUCCESS] 식당 "
            f"{count:,}건 적재 완료"
        )

        print(
            f"[THEME] 현지인 맛집 = "
            f"{local_theme_count:,}"
        )

        print(
            f"[THEME] 외지인 맛집 = "
            f"{outsider_theme_count:,}"
        )

    except Exception:

        conn.rollback()
        raise

    finally:

        conn.close()


if __name__ == "__main__":
    main()