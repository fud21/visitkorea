from pathlib import Path
import os
import sys

import pandas as pd
import psycopg2


# ============================================================
# PATH
# ============================================================

ROOT = Path(__file__).resolve().parents[1]

ATTRACTION_DIR = (
    ROOT
    / "data"
    / "processed"
    / "attraction"
)

PLACE_CSV = (
    ATTRACTION_DIR
    / "attraction_place.csv"
)

SCORE_CSV = (
    ATTRACTION_DIR
    / "attraction_score.csv"
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

    "강원": "강원특별자치도",
    "강원도": "강원특별자치도",
    "강원특별자치도": "강원특별자치도",

    "충북": "충청북도",
    "충청북도": "충청북도",

    "충남": "충청남도",
    "충청남도": "충청남도",

    "전북": "전북특별자치도",
    "전라북도": "전북특별자치도",
    "전북특별자치도": "전북특별자치도",

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
            df = pd.read_csv(
                path,
                encoding=encoding
            )

            print(
                f"[CSV] {path.name} "
                f"encoding = {encoding}"
            )

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

    for (
        region_id,
        name,
        province_name,
        region_type,
    ) in rows:

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

    address = str(address).strip()

    # 주소 첫 토큰 우선
    # ex) 경기 남양주시 ...
    first_token = address.split()[0]

    if first_token in PROVINCE_ALIASES:
        return PROVINCE_ALIASES[first_token]

    # fallback
    for alias in sorted(
        PROVINCE_ALIASES,
        key=len,
        reverse=True,
    ):
        if address.startswith(alias):
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

    # --------------------------------------------------------
    # 시군구 탐색
    # --------------------------------------------------------

    candidates = []

    for region in municipalities:

        if region["name"] not in address:
            continue

        # 중구, 서구, 동구 등 중복 방지
        if (
            province
            and region["province"]
            and region["province"] != province
        ):
            continue

        candidates.append(region)

    if candidates:

        # 긴 행정구역명을 우선
        candidates.sort(
            key=lambda x: len(x["name"]),
            reverse=True,
        )

        return candidates[0]["id"]

    # --------------------------------------------------------
    # 시군구 매칭 실패 시 광역단위 fallback
    # --------------------------------------------------------

    if province:
        return provinces.get(province)

    return None


# ============================================================
# THEMES
# ============================================================

def insert_theme(
    cur,
    place_id,
    theme,
):
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
    print("LOCAL:ON 관광지 PostgreSQL 적재")
    print("=" * 60)

    # --------------------------------------------------------
    # 파일 확인
    # --------------------------------------------------------

    for path in [
        PLACE_CSV,
        SCORE_CSV,
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

    score_df = read_csv_auto(
        SCORE_CSV
    )

    print()
    print(
        f"[PLACE] rows = "
        f"{len(place_df):,}"
    )

    print(
        f"[SCORE] rows = "
        f"{len(score_df):,}"
    )

    # --------------------------------------------------------
    # 컬럼명 통일
    # --------------------------------------------------------

    place_df = place_df.rename(
        columns={
            "관광지ID": "place_id",
            "관광지명": "name",
            "위도": "latitude",
            "경도": "longitude",
            "주소": "address",
        }
    )

    score_df = score_df.rename(
        columns={
            "관광지ID": "place_id",
            "관광지명": "score_name",
            "분류": "subcategory",
            "현지인순위": "local_rank",
            "외지인순위": "outsider_rank",
        }
    )

    # --------------------------------------------------------
    # 필요한 컬럼 검사
    # --------------------------------------------------------

    required_place_columns = {
        "place_id",
        "name",
        "latitude",
        "longitude",
        "address",
    }

    required_score_columns = {
        "place_id",
        "subcategory",
        "local_rank",
        "outsider_rank",
    }

    missing_place = (
        required_place_columns
        - set(place_df.columns)
    )

    missing_score = (
        required_score_columns
        - set(score_df.columns)
    )

    if missing_place:
        raise KeyError(
            "attraction_place.csv 누락 컬럼: "
            f"{sorted(missing_place)}"
        )

    if missing_score:
        raise KeyError(
            "attraction_score.csv 누락 컬럼: "
            f"{sorted(missing_score)}"
        )

    # --------------------------------------------------------
    # ID 중복 검사
    # --------------------------------------------------------

    place_duplicates = (
        place_df["place_id"]
        .duplicated()
        .sum()
    )

    score_duplicates = (
        score_df["place_id"]
        .duplicated()
        .sum()
    )

    print()
    print(
        "[CHECK] place ID duplicates = "
        f"{place_duplicates:,}"
    )

    print(
        "[CHECK] score ID duplicates = "
        f"{score_duplicates:,}"
    )

    if (
        place_duplicates > 0
        or score_duplicates > 0
    ):
        print()
        print(
            "[STOP] 중복 관광지ID가 있습니다."
        )
        return

    # --------------------------------------------------------
    # PLACE + SCORE merge
    # 점수 자체는 사용하지 않고 분류/순위 존재만 이용
    # --------------------------------------------------------

    df = place_df.merge(
        score_df[
            [
                "place_id",
                "subcategory",
                "local_rank",
                "outsider_rank",
            ]
        ],
        on="place_id",
        how="left",
        validate="one_to_one",
    )

    meta_missing = (
        df["subcategory"]
        .isna()
        .sum()
    )

    print(
        "[CHECK] score/meta missing = "
        f"{meta_missing:,}"
    )

    if meta_missing > 0:

        print()
        print(
            "[STOP] 점수 파일과 매칭되지 않는 "
            "관광지가 있습니다."
        )

        missing_rows = df[
            df["subcategory"].isna()
        ][
            [
                "place_id",
                "name",
            ]
        ]

        print(
            missing_rows.head(20)
        )

        return

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
            "[DB] provinces      = "
            f"{len(provinces)}"
        )

        print(
            "[DB] municipalities = "
            f"{len(municipalities)}"
        )

        # ----------------------------------------------------
        # REGION 사전검증
        # ----------------------------------------------------

        resolved = []
        unresolved = []

        for _, row in df.iterrows():

            address = clean_text(
                row["address"]
            )

            region_id = find_region_id(
                address,
                provinces,
                municipalities,
            )

            item = {
                "id": row["place_id"],
                "name": row["name"],
                "address": address,
                "region_id": region_id,
            }

            if region_id is None:
                unresolved.append(item)

            else:
                resolved.append(item)

        print()
        print(
            "[REGION] matched   = "
            f"{len(resolved):,}/"
            f"{len(df):,}"
        )

        print(
            "[REGION] unmatched = "
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
                    f"{item['address']}"
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
                "DB에는 아무것도 저장하지 "
                "않았습니다."
            )

            conn.rollback()
            return

        # ----------------------------------------------------
        # PLACES INSERT
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

        local_count = 0
        outsider_count = 0

        with conn.cursor() as cur:

            for _, row in df.iterrows():

                place_id = str(
                    row["place_id"]
                )

                name = clean_text(
                    row["name"]
                )

                address = clean_text(
                    row["address"]
                )

                category = clean_text(
                    row["subcategory"]
                )

                if not category:
                    category = "기타관광"

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

                region_id = find_region_id(
                    address,
                    provinces,
                    municipalities,
                )

                # --------------------------------------------
                # 장소 본체
                # --------------------------------------------

                cur.execute(
                    place_sql,
                    (
                        place_id,
                        name,
                        category,
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

                # --------------------------------------------
                # 큰 분류
                # --------------------------------------------

                insert_theme(
                    cur,
                    place_id,
                    "관광지",
                )

                # --------------------------------------------
                # 세부분류
                #
                # 예:
                # 자연경관(하천/해양)
                # 역사관광
                # 체험관광기타
                # 기타레저스포츠
                # ...
                # --------------------------------------------

                insert_theme(
                    cur,
                    place_id,
                    category,
                )

                # --------------------------------------------
                # 현지인 / 외지인 인기 여부
                #
                # 점수는 계산하지 않고
                # 순위 존재 여부만 theme으로 보존
                # --------------------------------------------

                if not pd.isna(
                    row["local_rank"]
                ):

                    insert_theme(
                        cur,
                        place_id,
                        "현지인 인기 관광지",
                    )

                    local_count += 1

                if not pd.isna(
                    row["outsider_rank"]
                ):

                    insert_theme(
                        cur,
                        place_id,
                        "외지인 인기 관광지",
                    )

                    outsider_count += 1

                count += 1

        conn.commit()

        print()
        print(
            "[SUCCESS] 관광지 "
            f"{count:,}건 적재 완료"
        )

        print(
            "[THEME] 현지인 인기 관광지 = "
            f"{local_count:,}"
        )

        print(
            "[THEME] 외지인 인기 관광지 = "
            f"{outsider_count:,}"
        )

    except Exception:

        conn.rollback()
        raise

    finally:

        conn.close()


if __name__ == "__main__":
    main()