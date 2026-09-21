package com.localon.recommendation;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
public class KakaoRouteService {

    private final RestClient restClient;

    public KakaoRouteService(
            @Value("${kakao.rest-api-key:}") String kakaoRestApiKey
    ) {

        this.restClient =
                RestClient.builder()
                        .baseUrl("https://apis-navi.kakaomobility.com")
                        .defaultHeader(
                                "Authorization",
                                "KakaoAK " + kakaoRestApiKey
                        )
                        .build();
    }


    public RouteSummary calculateRoute(
            List<RecommendationService.Stop> stops
    ) {

        if (stops == null || stops.size() < 2) {
            return new RouteSummary(
                    0.0,
                    0.0
            );
        }


        double totalKm = 0.0;
        double totalMinutes = 0.0;


        for (int i = 0; i < stops.size() - 1; i++) {

            RecommendationService.Stop from =
                    stops.get(i);

            RecommendationService.Stop to =
                    stops.get(i + 1);


            if (
                    from.latitude() == null
                            || from.longitude() == null
                            || to.latitude() == null
                            || to.longitude() == null
            ) {
                continue;
            }


            SegmentResult result =
                    getDrivingRoute(
                            from.longitude(),
                            from.latitude(),
                            to.longitude(),
                            to.latitude()
                    );


            totalKm += result.distanceKm();
            totalMinutes += result.durationMinutes();
        }


        return new RouteSummary(
                Math.round(totalKm * 100.0) / 100.0,
                Math.round(totalMinutes * 10.0) / 10.0
        );
    }


    @SuppressWarnings("unchecked")
    private SegmentResult getDrivingRoute(
            double originLongitude,
            double originLatitude,
            double destinationLongitude,
            double destinationLatitude
    ) {

        String origin =
                originLongitude
                        + ","
                        + originLatitude;

        String destination =
                destinationLongitude
                        + ","
                        + destinationLatitude;


        Map<String, Object> response =
                restClient
                        .get()
                        .uri(
                                uriBuilder ->
                                        uriBuilder
                                                .path("/v1/directions")
                                                .queryParam(
                                                        "origin",
                                                        origin
                                                )
                                                .queryParam(
                                                        "destination",
                                                        destination
                                                )
                                                .queryParam(
                                                        "priority",
                                                        "RECOMMEND"
                                                )
                                                .build()
                        )
                        .retrieve()
                        .body(Map.class);


        if (response == null) {
            return new SegmentResult(
                    0.0,
                    0.0
            );
        }


        List<Map<String, Object>> routes =
                (List<Map<String, Object>>)
                        response.get("routes");


        if (
                routes == null
                        || routes.isEmpty()
        ) {
            return new SegmentResult(
                    0.0,
                    0.0
            );
        }


        Map<String, Object> firstRoute =
                routes.get(0);


        Map<String, Object> summary =
                (Map<String, Object>)
                        firstRoute.get("summary");


        if (summary == null) {
            return new SegmentResult(
                    0.0,
                    0.0
            );
        }


        Number distanceMeters =
                (Number)
                        summary.get("distance");

        Number durationSeconds =
                (Number)
                        summary.get("duration");


        double km =
                distanceMeters == null
                        ? 0.0
                        : distanceMeters.doubleValue()
                        / 1000.0;


        double minutes =
                durationSeconds == null
                        ? 0.0
                        : durationSeconds.doubleValue()
                        / 60.0;


        return new SegmentResult(
                km,
                minutes
        );
    }


    private record SegmentResult(
            double distanceKm,
            double durationMinutes
    ) {
    }


    public record RouteSummary(
            double distanceKm,
            double durationMinutes
    ) {
    }
}