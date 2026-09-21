from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pathlib import Path

import subprocess
import sys
import json
import pandas as pd


app = FastAPI()


# ============================================================
# 경로 설정
# ============================================================

PROJECT_DIR = Path(__file__).resolve().parent

RECOMMENDER_FILE = (
    PROJECT_DIR
    / "local_on_route_recommender.py"
)

RESULT_DIR = (
    PROJECT_DIR
    / "data"
    / "경로추천_결과"
)


# ============================================================
# 요청 DTO
# ============================================================

class RecommendRequest(BaseModel):
    sido: str

    # 시군구는 선택값
    # None이면 Python 모델이 자동 추천
    sigungu: str | None = None

    trip: str = "day"

    categories: list[str]

    start_time: str = "10:00"


# ============================================================
# Health Check
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "UP",
        "service": "route-recommendation"
    }


# ============================================================
# 추천 API
# ============================================================

@app.post("/recommend")
def recommend(request: RecommendRequest):

    # ========================================================
    # 1. Python 추천 모델 실행 명령
    # ========================================================

    command = [
        sys.executable,
        str(RECOMMENDER_FILE),

        "--sido",
        request.sido,

        "--trip",
        request.trip,

        "--categories",
        ",".join(request.categories),

        "--start-time",
        request.start_time,
    ]


    # 시군구가 들어왔을 때만 전달
    if request.sigungu:
        command.extend([
            "--sigungu",
            request.sigungu
        ])


    # ========================================================
    # 2. 추천 모델 실행
    # ========================================================

    try:

        result = subprocess.run(
            command,
            cwd=PROJECT_DIR,
            capture_output=True,
            text=True,
            encoding="cp949",
            errors="replace",
            timeout=120
        )

    except subprocess.TimeoutExpired:

        raise HTTPException(
            status_code=504,
            detail="추천 모델 실행 시간이 초과되었습니다."
        )


    # ========================================================
    # 3. 추천 모델 실행 실패
    # ========================================================

    if result.returncode != 0:

        raise HTTPException(
            status_code=500,
            detail={
                "message": "추천 모델 실행 실패",
                "stderr": result.stderr,
                "stdout": result.stdout
            }
        )


    # ========================================================
    # 4. 시도 기준 요약 파일 후보 찾기
    #
    # sigungu가 있으면 정확한 파일 사용
    # sigungu가 없으면 자동 추천된 시군구 파일 탐색
    # ========================================================

    if request.sigungu:

        summary_file = (
            RESULT_DIR
            / f"04_{request.sido}_{request.sigungu}_{request.trip}_요약.json"
        )

        if not summary_file.exists():

            raise HTTPException(
                status_code=500,
                detail=f"요약 JSON 파일을 찾을 수 없습니다: {summary_file}"
            )

    else:

        summary_candidates = list(
            RESULT_DIR.glob(
                f"04_{request.sido}_*_{request.trip}_요약.json"
            )
        )


        if not summary_candidates:

            raise HTTPException(
                status_code=500,
                detail=(
                    f"{request.sido}의 자동 추천 결과 요약 파일을 "
                    f"찾을 수 없습니다."
                )
            )


        # 가장 최근 생성된 파일 사용
        summary_file = max(
            summary_candidates,
            key=lambda p: p.stat().st_mtime
        )


    # ========================================================
    # 5. 요약 JSON 읽기
    # ========================================================

    with open(
        summary_file,
        "r",
        encoding="utf-8-sig"
    ) as f:

        summary = json.load(f)


    # ========================================================
    # 6. 실제 선택된 시군구 추출
    # ========================================================

    selected_sigungu = (
        summary.get("추천/선택시군구")
        or request.sigungu
    )


    if not selected_sigungu:

        raise HTTPException(
            status_code=500,
            detail="추천 결과에서 선택된 시군구를 확인할 수 없습니다."
        )


    # ========================================================
    # 7. 실제 추천 경로 CSV 찾기
    # ========================================================

    route_file = (
        RESULT_DIR
        / f"03_{request.sido}_{selected_sigungu}_{request.trip}_추천경로.csv"
    )


    if not route_file.exists():

        raise HTTPException(
            status_code=500,
            detail=f"추천 경로 CSV 파일을 찾을 수 없습니다: {route_file}"
        )


    # ========================================================
    # 8. 추천 경로 CSV 읽기
    # ========================================================

    route_df = pd.read_csv(
        route_file,
        encoding="utf-8-sig"
    )


    # ========================================================
    # 9. Spring / 프론트에서 사용하기 좋은 형태로 변환
    # ========================================================

    stops = []


    for _, row in route_df.iterrows():

        stop = {

            "day": (
                int(row["day"])
                if pd.notna(row["day"])
                else None
            ),

            "order": (
                int(row["order"])
                if pd.notna(row["order"])
                else None
            ),

            "arrivalTime": (
                str(row["도착예정"])
                if pd.notna(row["도착예정"])
                else None
            ),

            "departureTime": (
                str(row["출발예정"])
                if pd.notna(row["출발예정"])
                else None
            ),

            "name": (
                str(row["장소명"])
                if pd.notna(row["장소명"])
                else None
            ),

            "category": (
                str(row["카테고리"])
                if pd.notna(row["카테고리"])
                else None
            ),

            "subCategory": (
                str(row["세부분류"])
                if pd.notna(row["세부분류"])
                else None
            ),

            "placeScore": (
                float(row["장소추천점수"])
                if pd.notna(row["장소추천점수"])
                else None
            ),

            "routeScore": (
                float(row["경로선택점수"])
                if pd.notna(row["경로선택점수"])
                else None
            ),

            "travelMinutes": (
                float(row["이전장소에서_이동분"])
                if pd.notna(row["이전장소에서_이동분"])
                else None
            ),
            "latitude": (
                float(row["위도"])
                if pd.notna(row["위도"])
                else None
            ),

            "longitude": (
                float(row["경도"])
                if pd.notna(row["경도"])
                else None
            )
        }

        stops.append(stop)


    # ========================================================
    # 10. 최종 응답
    # ========================================================

    return {

        "status": "success",

        "sido": request.sido,

        "sigungu": selected_sigungu,

        "trip": request.trip,

        "categories": request.categories,

        "startTime": request.start_time,

        "summary": summary,

        "stops": stops
    }