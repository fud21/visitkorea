package com.localon.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.localon.place.Place;
import com.localon.place.PlaceRepository;
import com.localon.region.Region;
import com.localon.region.RegionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

/** Imports the data team's normalized JSON file when DATASET_JSON_PATH is set. */
@Slf4j
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
@RequiredArgsConstructor
public class DatasetImporter implements ApplicationRunner {
    private final ObjectMapper objectMapper;
    private final RegionRepository regions;
    private final PlaceRepository places;

    @Value("${localon.dataset.path:}")
    private String datasetPath;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        if (datasetPath == null || datasetPath.isBlank()) {
            log.info("DATASET_JSON_PATH is empty; using bundled demo seed data.");
            return;
        }

        var resource = new DefaultResourceLoader().getResource(datasetPath);
        if (!resource.exists()) {
            throw new IllegalArgumentException("Dataset file does not exist: " + datasetPath);
        }

        Dataset dataset;
        try (var input = resource.getInputStream()) {
            dataset = objectMapper.readValue(input, Dataset.class);
        }

        int regionCount = 0;
        for (RegionRow row : safe(dataset.regions())) {
            var type = Region.RegionType.valueOf(row.type().trim().toUpperCase());
            var region = type == Region.RegionType.MUNICIPALITY
                    ? regions.findByTypeAndNameAndProvinceName(type, row.name(), row.provinceName()).orElseGet(Region::new)
                    : regions.findByTypeAndName(type, row.name()).orElseGet(Region::new);
            region.setType(type);
            region.setName(row.name());
            region.setProvinceName(row.provinceName());
            region.setVisitorCount(row.visitorCount());
            region.setVisitorRatio(row.visitorRatio());
            regions.save(region);
            regionCount++;
        }

        int placeCount = 0;
        for (PlaceRow row : safe(dataset.places())) {
            var region = (row.provinceName() == null || row.provinceName().isBlank()
                    ? regions.findFirstByName(row.regionName())
                    : regions.findByTypeAndNameAndProvinceName(Region.RegionType.MUNICIPALITY, row.regionName(), row.provinceName()))
                    .orElseThrow(() -> new IllegalArgumentException("Unknown regionName in dataset: " + row.regionName()));
            var place = places.findById(row.id()).orElseGet(Place::new);
            place.setId(row.id());
            place.setName(row.name());
            place.setCategory(row.category());
            place.setRegion(region);
            place.setAddress(row.address());
            place.setDescription(row.description());
            place.setHours(row.hours());
            place.setClosedInfo(row.closed());
            place.setParking(row.parking());
            place.setLatitude(row.latitude());
            place.setLongitude(row.longitude());
            place.setLocalScore(orZero(row.localScore()));
            place.setPopularityScore(orZero(row.popularityScore()));
            place.setStayMinutes(orZero(row.stayMinutes()));
            place.setEstimatedCost(orZero(row.estimatedCost()));
            place.setThemes(new LinkedHashSet<>(safe(row.themes())));
            place.setReasons(new ArrayList<>(safe(row.reasons())));
            place.setSampleData(false);
            places.save(place);
            placeCount++;
        }
        log.info("Imported dataset version {}: {} regions, {} places", dataset.version(), regionCount, placeCount);
    }

    private static int orZero(Integer value) { return value == null ? 0 : value; }
    private static <T> List<T> safe(List<T> value) { return value == null ? List.of() : value; }

    public record Dataset(String version, List<RegionRow> regions, List<PlaceRow> places) {}
    public record RegionRow(String type, String name, String provinceName, long visitorCount, double visitorRatio) {}
    public record PlaceRow(
            String id, String name, String category, String regionName, String provinceName, String address,
            String description, String hours, String closed, String parking,
            Double latitude, Double longitude, Integer localScore, Integer popularityScore,
            Integer stayMinutes, Integer estimatedCost, List<String> themes, List<String> reasons
    ) {}
}
