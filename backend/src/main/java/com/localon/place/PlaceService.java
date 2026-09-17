package com.localon.place;

import com.localon.common.NotFoundException;
import com.localon.region.Region;
import com.localon.region.RegionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PlaceService {
    private static final Sort SCORE_SORT = Sort.by(
            Sort.Order.desc("localScore").nullsLast(),
            Sort.Order.desc("popularityScore").nullsLast(),
            Sort.Order.asc("name")
    );

    private final PlaceRepository repo;
    private final RegionService regions;

    public PlaceResponse one(String id) {
        return PlaceResponse.of(entity(id));
    }

    public List<PlaceResponse> search(String q) {
        List<Place> result = q == null || q.isBlank()
                ? repo.findTop100ByOrderByNameAsc()
                : repo.search(q.trim(), PageRequest.of(0, 100));
        return result.stream().map(PlaceResponse::of).toList();
    }

    public List<PlaceResponse> byRegion(String key, String theme, int limit) {
        Region region = regions.resolve(key);
        int pageSize = Math.max(1, Math.min(limit, 100));
        String provinceName = provinceScope(region);
        List<Place> result = theme == null || theme.isBlank()
                ? repo.findRegionCandidates(region.getId(), provinceName, PageRequest.of(0, pageSize, SCORE_SORT))
                : repo.findRegionCandidatesByTheme(region.getId(), provinceName, theme.trim(), PageRequest.of(0, pageSize, SCORE_SORT));
        return result.stream().map(PlaceResponse::of).toList();
    }

    public List<Place> entitiesFor(Region region, List<String> themes) {
        String provinceName = provinceScope(region);
        Map<String, Place> candidates = new LinkedHashMap<>();

        for (String theme : themes.stream().filter(value -> value != null && !value.isBlank()).distinct().toList()) {
            repo.findRegionCandidatesByTheme(
                    region.getId(), provinceName, theme.trim(), PageRequest.of(0, 30, SCORE_SORT)
            ).forEach(place -> candidates.putIfAbsent(place.getId(), place));
        }

        repo.findRegionCandidates(
                region.getId(), provinceName, PageRequest.of(0, 200, SCORE_SORT)
        ).forEach(place -> candidates.putIfAbsent(place.getId(), place));
        return List.copyOf(candidates.values());
    }

    public Place entity(String id) {
        return repo.findById(id)
                .orElseThrow(() -> new NotFoundException("장소를 찾을 수 없습니다: " + id));
    }

    private String provinceScope(Region region) {
        return region.getType() == Region.RegionType.PROVINCE ? region.getName() : null;
    }

    public record PlaceResponse(
            String id,
            String name,
            String category,
            String address,
            String description,
            List<String> reasons,
            String hours,
            String closed,
            String parking,
            Double localScore,
            Double popularityScore,
            Integer stayMinutes,
            Integer estimatedCost,
            Double latitude,
            Double longitude,
            Set<String> themes,
            boolean sampleData
    ) {
        public static PlaceResponse of(Place place) {
            return new PlaceResponse(
                    place.getId(), place.getName(), place.getCategory(), place.getAddress(),
                    place.getDescription(), place.getReasons(), place.getHours(), place.getClosedInfo(),
                    place.getParking(), place.getLocalScore(), place.getPopularityScore(),
                    place.getStayMinutes(), place.getEstimatedCost(), place.getLatitude(),
                    place.getLongitude(), place.getThemes(), place.isSampleData()
            );
        }
    }
}
