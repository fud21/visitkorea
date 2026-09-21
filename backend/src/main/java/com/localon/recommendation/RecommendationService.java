package com.localon.recommendation;

import com.localon.region.Region;
import com.localon.region.RegionService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final RegionService regions;
    private final KakaoRouteService kakaoRouteService;

    private final RestClient restClient =
            RestClient.builder()
                    .baseUrl("http://host.docker.internal:8000")
                    .build();


    public RecommendationResponse recommend(
            RecommendationRequest request
    ) {

        // ========================================================
        // 1. 지역 찾기
        // ========================================================

        String key =
                request.regionId() != null
                        && !request.regionId().isBlank()
                        ? request.regionId()
                        : request.regionName();


        if (key == null || key.isBlank()) {

            throw new IllegalArgumentException(
                    "regionId 또는 regionName이 필요합니다."
            );
        }


        Region region =
                regions.resolve(key);


        String sido;
        String sigungu;


        if (
                region.getType()
                        == Region.RegionType.PROVINCE
        ) {

            sido =
                    region.getName();

            sigungu =
                    null;

        } else {

            sido =
                    region.getProvinceName();

            sigungu =
                    region.getName();
        }


        if (
                sido == null
                        || sido.isBlank()
        ) {

            throw new IllegalArgumentException(
                    "추천 모델 호출에 필요한 시도 정보가 없습니다."
            );
        }


        // ========================================================
        // 2. 카테고리
        // ========================================================

        List<String> categories;


        if (
                request.selectedThemes() == null
                        || request.selectedThemes().isEmpty()
        ) {

            categories =
                    List.of(
                            "맛집",
                            "관광지",
                            "카페/베이커리",
                            "전통시장"
                    );

        } else {

            categories =
                    normalizeCategories(
                            request.selectedThemes()
                    );
        }


        // ========================================================
        // 3. 여행 유형
        // ========================================================

        String trip =
                normalizeTrip(
                        request.duration()
                );


        // ========================================================
        // 4. Python 추천 API 요청
        // ========================================================

        PythonRecommendRequest pythonRequest =
                new PythonRecommendRequest(
                        sido,
                        sigungu,
                        trip,
                        categories,
                        "10:00"
                );


        PythonRecommendResponse pythonResponse;


        try {

            pythonResponse =
                    restClient
                            .post()
                            .uri("/recommend")
                            .body(pythonRequest)
                            .retrieve()
                            .body(
                                    PythonRecommendResponse.class
                            );

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Python 추천 서버 호출에 실패했습니다: "
                            + e.getMessage(),
                    e
            );
        }


        if (pythonResponse == null) {

            throw new IllegalStateException(
                    "Python 추천 서버의 응답이 없습니다."
            );
        }


        if (
                pythonResponse.status() == null
                        || !pythonResponse.status()
                        .equalsIgnoreCase("success")
        ) {

            throw new IllegalStateException(
                    "Python 추천 모델이 정상 결과를 반환하지 않았습니다."
            );
        }


        // ========================================================
        // 5. Python이 선택한 실제 시군구
        // ========================================================

        String selectedSigungu =
                pythonResponse.sigungu();


        if (
                selectedSigungu == null
                        || selectedSigungu.isBlank()
        ) {

            selectedSigungu =
                    sigungu;
        }


        // ========================================================
        // 6. Python stops → 프론트 Stop
        // ========================================================

        List<Stop> stops =
                new ArrayList<>();


        if (pythonResponse.stops() != null) {

            for (
                    PythonStop pythonStop
                    : pythonResponse.stops()
            ) {

                int order =
                        pythonStop.order() == null
                                ? stops.size() + 1
                                : pythonStop.order();


                Double score =
                        pythonStop.routeScore() != null
                                ? pythonStop.routeScore()
                                : pythonStop.placeScore();


                String stay =
                        makeStayText(
                                pythonStop.arrivalTime(),
                                pythonStop.departureTime()
                        );


                String reason =
                        makeReason(
                                pythonStop
                        );


                stops.add(
                        new Stop(
                                "python-"
                                        + UUID.randomUUID(),

                                order,

                                pythonStop.name(),

                                pythonStop.category(),

                                stay,

                                score,

                                "",

                                pythonStop.latitude(),

                                pythonStop.longitude(),

                                reason,

                                false
                        )
                );
            }
        }


        // ========================================================
        // 7. 카카오 자동차 길찾기
        // ========================================================

        KakaoRouteService.RouteSummary kakaoRoute =
                kakaoRouteService.calculateRoute(
                        stops
                );


        // ========================================================
        // 8. Python 결과 fallback
        // ========================================================

        Map<String, Object> pythonSummary =
                pythonResponse.summary();


        String duration;
        String distance;


        /*
         * 카카오 길찾기가 정상적으로 계산되면
         * 실제 자동차 이동시간 / 도로거리를 사용한다.
         *
         * 실패하면 Python의 위경도 기반 추정값을 사용한다.
         */

        if (
                kakaoRoute != null
                        && kakaoRoute.distanceKm() > 0
        ) {

            duration =
                    formatDuration(
                            kakaoRoute.durationMinutes()
                    );


            distance =
                    String.format(
                            "%.1f km",
                            kakaoRoute.distanceKm()
                    );

        } else {

            duration =
                    summaryValue(
                            pythonSummary,
                            "총이동시간분",
                            "분"
                    );


            distance =
                    summaryValue(
                            pythonSummary,
                            "총이동거리km",
                            " km"
                    );
        }


        // ========================================================
        // 9. 프론트 summary
        // ========================================================

        Summary summary =
                new Summary(
                        duration,
                        distance,
                        request.localRatio(),
                        "-"
                );


        // ========================================================
        // 10. 화면 표시 지역명
        // ========================================================

        String responseRegionName;


        if (
                selectedSigungu != null
                        && !selectedSigungu.isBlank()
        ) {

            responseRegionName =
                    sido
                            + " "
                            + selectedSigungu;

        } else {

            responseRegionName =
                    sido;
        }


        // ========================================================
        // 11. React 반환
        // ========================================================

        return new RecommendationResponse(
                UUID.randomUUID().toString(),

                responseRegionName,

                summary,

                stops,

                "PYTHON_MODEL",

                "LOCAL:ON Python 추천 + Kakao 자동차 길찾기 결과입니다."
        );
    }


    // ============================================================
    // 카테고리 정규화
    // ============================================================

    private List<String> normalizeCategories(
            List<String> themes
    ) {

        List<String> result =
                new ArrayList<>();


        for (String theme : themes) {

            if (
                    theme == null
                            || theme.isBlank()
            ) {
                continue;
            }


            String value =
                    theme.trim();


            if (
                    value.contains("맛집")
                            || value.contains("음식")
            ) {

                addIfMissing(
                        result,
                        "맛집"
                );

            } else if (
                    value.contains("카페")
                            || value.contains("베이커리")
            ) {

                addIfMissing(
                        result,
                        "카페/베이커리"
                );

            } else if (
                    value.contains("시장")
            ) {

                addIfMissing(
                        result,
                        "전통시장"
                );

            } else if (
                    value.contains("관광")
                            || value.contains("자연")
                            || value.contains("힐링")
                            || value.contains("문화")
                            || value.contains("체험")
                            || value.contains("레저")
            ) {

                addIfMissing(
                        result,
                        "관광지"
                );

            } else {

                addIfMissing(
                        result,
                        value
                );
            }
        }


        if (result.isEmpty()) {

            return List.of(
                    "맛집",
                    "관광지",
                    "카페/베이커리",
                    "전통시장"
            );
        }


        return result;
    }


    private void addIfMissing(
            List<String> list,
            String value
    ) {

        if (!list.contains(value)) {
            list.add(value);
        }
    }


    // ============================================================
    // 여행 유형
    // ============================================================

    private String normalizeTrip(
            String duration
    ) {

        if (
                duration == null
                        || duration.isBlank()
        ) {

            return "day";
        }


        return switch (duration) {

            case "day",
                 "daytrip",
                 "half",
                 "2h" -> "day";

            default -> "day";
        };
    }


    // ============================================================
    // 장소 방문 시간
    // ============================================================

    private String makeStayText(
            String arrival,
            String departure
    ) {

        if (
                arrival == null
                        || departure == null
        ) {

            return "";
        }


        return arrival
                + " ~ "
                + departure;
    }


    // ============================================================
    // 추천 이유
    // ============================================================

    private String makeReason(
            PythonStop stop
    ) {

        List<String> reasons =
                new ArrayList<>();


        if (
                stop.subCategory() != null
                        && !stop.subCategory().isBlank()
        ) {

            reasons.add(
                    stop.subCategory()
            );
        }


        if (
                stop.placeScore() != null
        ) {

            reasons.add(
                    "장소추천점수 "
                            + String.format(
                            "%.1f",
                            stop.placeScore()
                    )
            );
        }


        if (
                stop.travelMinutes() != null
        ) {

            reasons.add(
                    "예상 이동 "
                            + String.format(
                            "%.1f분",
                            stop.travelMinutes()
                    )
            );
        }


        return String.join(
                " · ",
                reasons
        );
    }


    // ============================================================
    // 카카오 이동시간 표시
    // ============================================================

    private String formatDuration(
            double minutes
    ) {

        long roundedMinutes =
                Math.round(minutes);


        long hours =
                roundedMinutes / 60;


        long remainingMinutes =
                roundedMinutes % 60;


        if (hours > 0) {

            return hours
                    + "시간 "
                    + remainingMinutes
                    + "분";
        }


        return remainingMinutes
                + "분";
    }


    // ============================================================
    // Python summary
    // ============================================================

    private String summaryValue(
            Map<String, Object> summary,
            String key,
            String suffix
    ) {

        if (summary == null) {

            return "-";
        }


        Object value =
                summary.get(key);


        if (value == null) {

            return "-";
        }


        return value
                + suffix;
    }


    // ============================================================
    // React → Spring
    // ============================================================

    public record RecommendationRequest(
            String regionId,
            String regionName,

            @Min(0)
            @Max(100)
            int localRatio,

            List<String> selectedThemes,

            String duration
    ) {
    }


    // ============================================================
    // Spring → Python
    // ============================================================

    public record PythonRecommendRequest(
            String sido,
            String sigungu,
            String trip,
            List<String> categories,
            String start_time
    ) {
    }


    // ============================================================
    // Python → Spring
    // ============================================================

    public record PythonStop(
            Integer day,
            Integer order,

            String arrivalTime,
            String departureTime,

            String name,
            String category,
            String subCategory,

            Double placeScore,
            Double routeScore,
            Double travelMinutes,

            Double latitude,
            Double longitude
    ) {
    }


    public record PythonRecommendResponse(
            String status,

            String sido,
            String sigungu,

            String trip,

            List<String> categories,

            String startTime,

            Map<String, Object> summary,

            List<PythonStop> stops
    ) {
    }


    // ============================================================
    // Spring → React
    // ============================================================

    public record Summary(
            String duration,
            String distance,
            int localRatio,
            String budget
    ) {
    }


    public record Stop(
            String id,
            int order,

            String name,
            String type,

            String stay,

            Double localScore,

            String address,

            Double latitude,
            Double longitude,

            String reason,

            boolean sampleData
    ) {
    }


    public record RecommendationResponse(
            String id,

            String regionName,

            Summary summary,

            List<Stop> stops,

            String dataStatus,

            String notice
    ) {
    }
}