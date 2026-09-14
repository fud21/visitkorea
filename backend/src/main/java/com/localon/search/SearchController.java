package com.localon.search;
import com.localon.place.PlaceService; import com.localon.region.*; import lombok.RequiredArgsConstructor; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/search") @RequiredArgsConstructor public class SearchController {
 private final RegionRepository regions; private final PlaceService places;
 @GetMapping public Response search(@RequestParam String q){String needle=q==null?"":q.trim();var rs=regions.findAll().stream().filter(r->r.getName().contains(needle)||(r.getProvinceName()!=null&&r.getProvinceName().contains(needle))).limit(20).map(RegionService.Response::of).toList();return new Response(rs,places.search(needle).stream().limit(20).toList());}
 public record Response(List<RegionService.Response> regions,List<PlaceService.PlaceResponse> places){}
}
