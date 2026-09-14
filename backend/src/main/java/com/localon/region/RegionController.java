package com.localon.region;
import com.localon.place.PlaceService; import lombok.RequiredArgsConstructor; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/regions") @RequiredArgsConstructor public class RegionController {
 private final RegionService service; private final PlaceService placeService;
 @GetMapping public List<RegionService.Response> all(){return service.provinces();}
 @GetMapping("/provinces") public List<RegionService.Response> provinces(){return service.provinces();}
 @GetMapping("/provinces/{provinceName}/municipalities") public List<RegionService.Response> municipalities(@PathVariable String provinceName){return service.municipalities(provinceName);}
 @GetMapping("/municipalities/{municipalityName}") public RegionService.Response municipality(@PathVariable String municipalityName){return service.one(municipalityName);}
 @GetMapping("/{regionId}") public RegionService.Response one(@PathVariable String regionId){return service.one(regionId);}
 @GetMapping("/{regionId}/places") public List<PlaceService.PlaceResponse> places(@PathVariable String regionId,@RequestParam(required=false) String theme,@RequestParam(defaultValue="20") int limit){return placeService.byRegion(regionId,theme,limit);}
}
