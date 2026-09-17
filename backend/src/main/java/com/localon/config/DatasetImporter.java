package com.localon.config;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Types;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Imports the normalized data team's JSON file when DATASET_JSON_PATH is set. */
@Slf4j
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
@RequiredArgsConstructor
public class DatasetImporter implements ApplicationRunner {
    private static final String IMPORT_STATE_ID = "processed-data-v2";
    private static final int BATCH_SIZE = 500;

    private final ObjectMapper objectMapper;
    private final RegionRepository regions;
    private final JdbcTemplate jdbc;

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
        if (dataset.version() == null || dataset.version().isBlank()) {
            throw new IllegalArgumentException("Dataset version is required.");
        }

        createImportStateTable();
        allowNullableScores();
        if (alreadyImported(dataset.version())) {
            log.info("Dataset {} is already imported; skipping.", dataset.version());
            return;
        }

        int regionCount = upsertRegions(dataset.regions());
        Map<String, Long> regionIds = regionIds();
        List<ResolvedPlace> places = resolvePlaces(dataset.places(), regionIds);

        upsertPlaces(places);
        replaceThemesAndReasons(places);
        rememberVersion(dataset.version());

        log.info("Imported dataset version {}: {} regions, {} places", dataset.version(), regionCount, places.size());
    }

    private void createImportStateTable() {
        jdbc.execute("""
                create table if not exists dataset_import_state (
                    id varchar(100) primary key,
                    dataset_version varchar(200) not null,
                    imported_at timestamp with time zone not null default current_timestamp
                )
                """);
    }

    private boolean alreadyImported(String version) {
        List<String> versions = jdbc.query(
                "select dataset_version from dataset_import_state where id = ?",
                (rs, rowNum) -> rs.getString(1),
                IMPORT_STATE_ID
        );
        return versions.stream().findFirst().filter(version::equals).isPresent();
    }

    private int upsertRegions(List<RegionRow> rows) {
        int count = 0;
        for (RegionRow row : safe(rows)) {
            Region.RegionType type = Region.RegionType.valueOf(row.type().trim().toUpperCase());
            Region region = type == Region.RegionType.MUNICIPALITY
                    ? regions.findByTypeAndNameAndProvinceName(type, row.name(), row.provinceName()).orElseGet(Region::new)
                    : regions.findByTypeAndName(type, row.name()).orElseGet(Region::new);
            region.setType(type);
            region.setName(row.name());
            region.setProvinceName(row.provinceName());
            region.setVisitorCount(row.visitorCount());
            region.setVisitorRatio(row.visitorRatio());
            regions.save(region);
            count++;
        }
        regions.flush();
        return count;
    }

    private Map<String, Long> regionIds() {
        Map<String, Long> result = new LinkedHashMap<>();
        for (Region region : regions.findAll()) {
            result.put(regionKey(region.getName(), region.getProvinceName()), region.getId());
            if (region.getType() == Region.RegionType.PROVINCE) {
                result.putIfAbsent(regionKey(region.getName(), null), region.getId());
            }
        }
        return result;
    }

    private List<ResolvedPlace> resolvePlaces(List<PlaceRow> rows, Map<String, Long> regionIds) {
        List<ResolvedPlace> result = new ArrayList<>();
        for (PlaceRow row : safe(rows)) {
            Long regionId = regionIds.get(regionKey(row.regionName(), row.provinceName()));
            if (regionId == null) {
                regionId = regionIds.get(regionKey(row.regionName(), null));
            }
            if (regionId == null) {
                throw new IllegalArgumentException(
                        "Unknown region in dataset: " + row.provinceName() + " / " + row.regionName()
                );
            }
            result.add(new ResolvedPlace(row, regionId));
        }
        return result;
    }

    private void allowNullableScores() {
        jdbc.execute("alter table places alter column local_score type double precision using local_score::double precision");
        jdbc.execute("alter table places alter column popularity_score type double precision using popularity_score::double precision");
        jdbc.execute("alter table places alter column local_score drop not null");
        jdbc.execute("alter table places alter column popularity_score drop not null");
        jdbc.execute("create index if not exists idx_places_region_id on places(region_id)");
        jdbc.execute("create index if not exists idx_regions_province_name on regions(province_name)");
        jdbc.execute("create index if not exists idx_place_themes_theme_place on place_themes(theme, place_id)");
    }

    private void upsertPlaces(List<ResolvedPlace> places) {
        String sql = """
                insert into places (
                    id, name, category, address, description, hours, closed_info, parking,
                    latitude, longitude, local_score, popularity_score, stay_minutes,
                    estimated_cost, sample_data, region_id
                ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, false, ?)
                on conflict (id) do update set
                    name = excluded.name,
                    category = excluded.category,
                    address = excluded.address,
                    description = excluded.description,
                    hours = excluded.hours,
                    closed_info = excluded.closed_info,
                    parking = excluded.parking,
                    latitude = excluded.latitude,
                    longitude = excluded.longitude,
                    local_score = excluded.local_score,
                    popularity_score = excluded.popularity_score,
                    stay_minutes = excluded.stay_minutes,
                    estimated_cost = excluded.estimated_cost,
                    sample_data = false,
                    region_id = excluded.region_id
                """;
        jdbc.batchUpdate(sql, places, BATCH_SIZE, (statement, resolved) -> {
            PlaceRow row = resolved.row();
            statement.setString(1, row.id());
            statement.setString(2, row.name());
            statement.setString(3, row.category());
            statement.setString(4, row.address());
            statement.setString(5, row.description());
            statement.setString(6, row.hours());
            statement.setString(7, row.closed());
            statement.setString(8, row.parking());
            statement.setObject(9, row.latitude(), Types.DOUBLE);
            statement.setObject(10, row.longitude(), Types.DOUBLE);
            statement.setObject(11, row.localScore(), Types.DOUBLE);
            statement.setObject(12, row.popularityScore(), Types.DOUBLE);
            statement.setInt(13, orZero(row.stayMinutes()));
            statement.setInt(14, orZero(row.estimatedCost()));
            statement.setLong(15, resolved.regionId());
        });
    }

    private void replaceThemesAndReasons(List<ResolvedPlace> places) {
        List<String> ids = places.stream().map(place -> place.row().id()).toList();
        jdbc.batchUpdate("delete from place_themes where place_id = ?", ids, BATCH_SIZE,
                (statement, id) -> statement.setString(1, id));
        jdbc.batchUpdate("delete from place_reasons where place_id = ?", ids, BATCH_SIZE,
                (statement, id) -> statement.setString(1, id));

        List<PlaceText> themes = new ArrayList<>();
        List<PlaceText> reasons = new ArrayList<>();
        for (ResolvedPlace place : places) {
            for (String theme : safe(place.row().themes())) {
                if (theme != null && !theme.isBlank()) {
                    themes.add(new PlaceText(place.row().id(), theme.trim()));
                }
            }
            for (String reason : safe(place.row().reasons())) {
                if (reason != null && !reason.isBlank()) {
                    reasons.add(new PlaceText(place.row().id(), reason.trim()));
                }
            }
        }
        jdbc.batchUpdate("insert into place_themes (place_id, theme) values (?, ?)", themes, BATCH_SIZE,
                (statement, value) -> {
                    statement.setString(1, value.placeId());
                    statement.setString(2, value.text());
                });
        jdbc.batchUpdate("insert into place_reasons (place_id, reason) values (?, ?)", reasons, BATCH_SIZE,
                (statement, value) -> {
                    statement.setString(1, value.placeId());
                    statement.setString(2, value.text());
                });
    }

    private void rememberVersion(String version) {
        jdbc.update("""
                insert into dataset_import_state (id, dataset_version, imported_at)
                values (?, ?, current_timestamp)
                on conflict (id) do update set
                    dataset_version = excluded.dataset_version,
                    imported_at = excluded.imported_at
                """, IMPORT_STATE_ID, version);
    }

    private static String regionKey(String name, String provinceName) {
        return (provinceName == null ? "" : provinceName.trim()) + "|" + (name == null ? "" : name.trim());
    }

    private static int orZero(Integer value) {
        return value == null ? 0 : value;
    }

    private static <T> List<T> safe(List<T> value) {
        return value == null ? List.of() : value;
    }

    public record Dataset(String version, List<RegionRow> regions, List<PlaceRow> places) {}

    public record RegionRow(
            String type,
            String name,
            String provinceName,
            long visitorCount,
            double visitorRatio
    ) {}

    public record PlaceRow(
            String id,
            String name,
            String category,
            String regionName,
            String provinceName,
            String address,
            String description,
            String hours,
            String closed,
            String parking,
            Double latitude,
            Double longitude,
            Double localScore,
            Double popularityScore,
            Integer stayMinutes,
            Integer estimatedCost,
            List<String> themes,
            List<String> reasons
    ) {}

    private record ResolvedPlace(PlaceRow row, Long regionId) {}

    private record PlaceText(String placeId, String text) {}
}
