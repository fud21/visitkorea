package com.localon.region;

import com.fasterxml.jackson.databind.JsonNode;
import com.localon.place.PlaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/regions")
@RequiredArgsConstructor
public class RegionController {

    private final RegionService service;
    private final PlaceService placeService;
    private final RegionDiscoverService regionDiscoverService;

    @GetMapping
    public List<RegionService.Response> all() {
        return service.provinces();
    }

    @GetMapping("/provinces")
    public List<RegionService.Response> provinces() {
        return service.provinces();
    }

    @GetMapping("/provinces/{provinceName}/municipalities")
    public List<RegionService.Response> municipalities(
            @PathVariable String provinceName
    ) {
        return service.municipalities(provinceName);
    }

    @GetMapping("/municipalities/{municipalityName}")
    public RegionService.Response municipality(
            @PathVariable String municipalityName
    ) {
        return service.one(municipalityName);
    }

    @GetMapping("/discover")
    public JsonNode discover(
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "4") int limit
    ) {
        return regionDiscoverService.discover(
                type,
                limit
        );
    }

    @GetMapping("/{regionId}")
    public RegionService.Response one(
            @PathVariable String regionId
    ) {
        return service.one(regionId);
    }

    @GetMapping("/{regionId}/places")
    public List<PlaceService.PlaceResponse> places(
            @PathVariable String regionId,
            @RequestParam(required = false) String theme,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return placeService.byRegion(
                regionId,
                theme,
                limit
        );
    }
}