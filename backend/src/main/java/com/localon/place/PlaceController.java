package com.localon.place;
import lombok.RequiredArgsConstructor; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/places") @RequiredArgsConstructor public class PlaceController {private final PlaceService service; @GetMapping public List<PlaceService.PlaceResponse> search(@RequestParam(required=false) String q){return service.search(q);} @GetMapping("/{id}") public PlaceService.PlaceResponse one(@PathVariable String id){return service.one(id);}}
