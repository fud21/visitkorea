package com.localon.recommendation;

import com.localon.place.Place;
import com.localon.place.PlaceService;
import com.localon.region.Region;
import com.localon.region.RegionService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecommendationService {
    private static final double MISSING_SCORE_BASELINE = 50.0;

    private final RegionService regions;
    private final PlaceService places;

    public RecommendationResponse recommend(RecommendationRequest request) {
        String key = request.regionId() != null && !request.regionId().isBlank()
                ? request.regionId()
                : request.regionName();
        if (key == null || key.isBlank()) {
            throw new IllegalArgumentException("regionId 또는 regionName이 필요합니다.");
        }

        Region region = regions.resolve(key);
        int requestedLocalRatio = Math.max(0, Math.min(100, request.localRatio()));
        List<String> themes = request.selectedThemes() == null ? List.of() : request.selectedThemes();
        int maxStops = switch (Optional.ofNullable(request.duration()).orElse("daytrip")) {
            case "2h" -> 3;
            case "day" -> 6;
            case "daytrip", "half" -> 4;
            default -> 4;
        };

        List<Place> candidates = new ArrayList<>(places.entitiesFor(region, themes));
        boolean placeholder = candidates.isEmpty();
        if (placeholder) {
            candidates = placeholderPlaces(region, themes);
        }

        candidates.sort(Comparator.comparingDouble(
                (Place place) -> score(place, themes, requestedLocalRatio)
        ).reversed());
        List<Place> chosen = choosePlaces(candidates, themes, maxStops);

        int minutes = chosen.stream().mapToInt(Place::getStayMinutes).sum()
                + Math.max(0, chosen.size() - 1) * 20;
        int cost = chosen.stream().mapToInt(Place::getEstimatedCost).sum();
        double distance = Math.max(1.5, chosen.size() * 3.8);
        int actualLocalRatio = (int) Math.round(chosen.stream()
                .map(Place::getLocalScore)
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(requestedLocalRatio));

        List<Stop> stops = new ArrayList<>();
        for (int index = 0; index < chosen.size(); index++) {
            Place place = chosen.get(index);
            stops.add(new Stop(
                    place.getId(),
                    index + 1,
                    place.getName(),
                    place.getCategory(),
                    place.getStayMinutes() + "분",
                    place.getLocalScore(),
                    place.getAddress(),
                    place.getLatitude(),
                    place.getLongitude(),
                    reason(place, themes),
                    place.isSampleData() || placeholder
            ));
        }

        String notice = placeholder
                ? "실제 장소가 없는 지역이라 테마 기반 임시 슬롯을 표시합니다."
                : "공공 관광 데이터와 지역 조건을 반영한 추천 결과입니다.";
        return new RecommendationResponse(
                UUID.randomUUID().toString(),
                region.getName(),
                new Summary(
                        formatMinutes(minutes),
                        String.format(Locale.US, "%.1f km", distance),
                        actualLocalRatio,
                        "약 " + String.format("%,d", cost) + "원"
                ),
                stops,
                placeholder ? "PLACEHOLDER" : "LIVE",
                notice
        );
    }

    private double score(Place place, List<String> themes, int localRatio) {
        double localWeight = localRatio / 100.0;
        double localScore = scoreOrFallback(place.getLocalScore(), place.getPopularityScore());
        double popularityScore = scoreOrFallback(place.getPopularityScore(), place.getLocalScore());
        double themeScore = themes.stream().anyMatch(theme -> matchesTheme(place, theme)) ? 100 : 45;
        return localScore * localWeight + popularityScore * (1 - localWeight) + themeScore * .25;
    }

    private List<Place> choosePlaces(List<Place> ranked, List<String> themes, int maxStops) {
        LinkedHashSet<Place> chosen = new LinkedHashSet<>();
        for (String theme : themes) {
            ranked.stream()
                    .filter(place -> matchesTheme(place, theme))
                    .filter(place -> !chosen.contains(place))
                    .findFirst()
                    .ifPresent(chosen::add);
            if (chosen.size() >= maxStops) break;
        }
        for (Place place : ranked) {
            if (chosen.size() >= maxStops) break;
            chosen.add(place);
        }
        return new ArrayList<>(chosen);
    }

    private boolean matchesTheme(Place place, String theme) {
        return place.getThemes().contains(theme) || place.getCategory().contains(theme);
    }

    private double scoreOrFallback(Double value, Double alternative) {
        if (value != null) return value;
        if (alternative != null) return alternative;
        return MISSING_SCORE_BASELINE;
    }

    private String reason(Place place, List<String> themes) {
        Optional<String> matchedTheme = themes.stream()
                .filter(theme -> matchesTheme(place, theme))
                .findFirst();
        if (matchedTheme.isPresent()) {
            return "선택한 '" + matchedTheme.get() + "' 테마와 잘 맞는 장소입니다.";
        }
        if (!place.getReasons().isEmpty()) {
            return place.getReasons().get(0);
        }
        return "지역 방문 분산과 이동 동선을 고려한 후보입니다.";
    }

    private List<Place> placeholderPlaces(Region region, List<String> themes) {
        List<String> categories = new ArrayList<>(themes);
        if (categories.isEmpty()) {
            categories.addAll(List.of("전통시장", "맛집", "카페", "자연/힐링", "관광지"));
        }
        List<Place> output = new ArrayList<>();
        for (int index = 0; index < Math.min(6, categories.size() + 2); index++) {
            String category = categories.get(index % categories.size());
            Place place = new Place();
            place.setId("placeholder-" + region.getId() + "-" + index);
            place.setName(region.getName() + " " + category + " 후보");
            place.setCategory(category);
            place.setAddress("실제 장소 데이터 연결 예정");
            place.setDescription("실제 장소 데이터 연결 전 추천 슬롯입니다.");
            place.setLocalScore((double) Math.max(55, 88 - index * 5));
            place.setPopularityScore((double) (55 + index * 3));
            place.setStayMinutes(35 + index * 5);
            place.setEstimatedCost(category.contains("맛집") ? 12000 : category.contains("카페") ? 6000 : 3000);
            place.setThemes(new LinkedHashSet<>(Set.of(category)));
            place.setReasons(new ArrayList<>(List.of("사용자 선택 테마와 지역 조건을 반영한 임시 후보입니다.")));
            place.setSampleData(true);
            output.add(place);
        }
        return output;
    }

    private String formatMinutes(int minutes) {
        return (minutes / 60) + "시간 " + (minutes % 60) + "분";
    }

    public record RecommendationRequest(
            String regionId,
            String regionName,
            @Min(0) @Max(100) int localRatio,
            List<String> selectedThemes,
            String duration
    ) {}

    public record Summary(String duration, String distance, int localRatio, String budget) {}

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
    ) {}

    public record RecommendationResponse(
            String id,
            String regionName,
            Summary summary,
            List<Stop> stops,
            String dataStatus,
            String notice
    ) {}
}
